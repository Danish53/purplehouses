import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

/** Short, unique names — avoids very long URLs / odd chars on Linux + nginx. */
function buildStoredFilename(originalName, subdir) {
  let ext = path.extname(originalName || "").toLowerCase();
  if (!ext || !/^\.[a-z0-9]{1,12}$/i.test(ext)) {
    if (subdir === "property_images") ext = ".jpg";
    else ext = ".bin";
  }
  return `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
}

async function saveFiles(files, subdir) {
  const paths = [];
  const dir = path.join(process.cwd(), "public", "media", subdir);
  await mkdir(dir, { recursive: true });
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      // Allow images in image dirs, any file type for attachments
      if (subdir === "property_images" && !file.type.startsWith("image/"))
        continue;
      if (file.size > 20 * 1024 * 1024) continue; // 20 MB limit per file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = buildStoredFilename(file.name, subdir);
      await writeFile(path.join(dir, filename), buffer);
      paths.push(`${subdir}/${filename}`);
    }
  }
  return paths;
}

function parseStoredJsonArray(value, fallback = []) {
  if (value == null) return [...fallback];
  try {
    const a = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(a) ? a : [...fallback];
  } catch {
    return [...fallback];
  }
}

/** Merge client-sent existing paths (after user removed some) with newly uploaded files. */
function parseExistingGalleryFromForm(fields, dbGalleryJson) {
  const raw = fields.existing_gallery;
  if (raw != null && String(raw).trim() !== "") {
    return parseStoredJsonArray(String(raw), []);
  }
  return parseStoredJsonArray(dbGalleryJson, []);
}

function parseExistingAttachmentsFromForm(fields, dbAttachmentsJson) {
  const raw = fields.existing_attachments;
  if (raw != null && String(raw).trim() !== "") {
    return parseStoredJsonArray(String(raw), []);
  }
  return parseStoredJsonArray(dbAttachmentsJson, []);
}

function normalizeFeatureList(fields, existingFeaturesJson) {
  const fallback = parseStoredJsonArray(existingFeaturesJson, []);
  const arr = fields.prop_features;
  if (!Array.isArray(arr) || arr.length === 0) {
    return fallback;
  }
  if (
    arr.length === 1 &&
    typeof arr[0] === "string" &&
    arr[0].trim().startsWith("[")
  ) {
    try {
      const inner = JSON.parse(arr[0]);
      if (Array.isArray(inner)) return inner;
    } catch {
      /* ignore */
    }
  }
  return arr;
}

function clampFeaturedIndex(index, galleryLength) {
  if (galleryLength <= 0) return 0;
  const n = parseInt(String(index), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  if (n >= galleryLength) return galleryLength - 1;
  return n;
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const fields = {};
    const galleryFiles = [];
    const videoFiles = [];
    const attachmentFiles = [];

    for (const [key, value] of formData.entries()) {
      if (key === "gallery_images" && value instanceof File) {
        galleryFiles.push(value);
      } else if (key === "video_file" && value instanceof File) {
        videoFiles.push(value);
      } else if (key === "attachments" && value instanceof File) {
        attachmentFiles.push(value);
      } else if (key === "prop_features[]" || key === "prop_features") {
        if (!fields.prop_features) fields.prop_features = [];
        fields.prop_features.push(value);
      } else {
        fields[key] = value;
      }
    }

    const galleryPaths = await saveFiles(galleryFiles, "property_images");
    const videoPaths = await saveFiles(videoFiles, "property_videos");
    const attachmentPaths = await saveFiles(
      attachmentFiles,
      "property_attachments",
    );

    if (galleryPaths.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one property image." },
        { status: 400 },
      );
    }

    const row = await prisma.Property.create({
      data: {
        prop_title: fields.prop_title || "",
        prop_des: fields.prop_des || "",
        category: fields.category || "",
        purpose: fields.purpose || "",
        prop_price: fields.prop_price || "0",
        available_date: fields.available_date
          ? new Date(fields.available_date)
          : null,
        prop_beds: fields.prop_beds ? parseInt(fields.prop_beds) : null,
        prop_baths: fields.prop_baths ? parseInt(fields.prop_baths) : null,
        prop_size: fields.prop_size || "",
        prop_year_built: fields.prop_year_built || "",
        prop_features: JSON.stringify(fields.prop_features || []),
        property_map_address: fields.property_map_address || "",
        country: fields.country || "",
        administrative_area_level_1:
          fields.administrative_area_level_1 || "",
        city: fields.city || fields.locality || "",
        zip_code: fields.zip_code || fields.postal_code || "",
        lat: fields.lat || fields.latitude || "",
        lng: fields.lng || fields.longitude || "",
        prop_google_street_view: fields.prop_google_street_view || "False",
        login_required:
          fields.login_required === "1" || fields.login_required === "true",
        disclaimer: fields.disclaimer || null,
        gallery_images: JSON.stringify(galleryPaths),
        video_file: videoPaths[0] || null,
        youtube_url: fields.youtube_url || "",
        attachments: JSON.stringify(attachmentPaths),
        featured: fields.featured === "1" || fields.featured === "true",
        featured_image: fields.featured_image
          ? parseInt(fields.featured_image)
          : 0,
        status: "approved",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: Number(row.id) });
  } catch (error) {
    console.error("Add property error:", error);
    return NextResponse.json(
      { error: "Failed to add property." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get("id");
    if (!id)
      return NextResponse.json(
        { error: "Property ID required." },
        { status: 400 },
      );

    const fields = {};
    const galleryFiles = [];
    const videoFiles = [];
    const attachmentFiles = [];

    for (const [key, value] of formData.entries()) {
      if (key === "gallery_images" && value instanceof File && value.size > 0) {
        galleryFiles.push(value);
      } else if (
        key === "video_file" &&
        value instanceof File &&
        value.size > 0
      ) {
        videoFiles.push(value);
      } else if (
        key === "attachments" &&
        value instanceof File &&
        value.size > 0
      ) {
        attachmentFiles.push(value);
      } else if (key === "prop_features[]" || key === "prop_features") {
        if (!fields.prop_features) fields.prop_features = [];
        fields.prop_features.push(value);
      } else {
        fields[key] = value;
      }
    }

    const existing = await prisma.Property.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const keptGallery = parseExistingGalleryFromForm(
      fields,
      existing.gallery_images,
    );
    const newGalleryPaths = await saveFiles(
      galleryFiles,
      "property_images",
    );
    const galleryPaths = [...keptGallery, ...newGalleryPaths];

    const videoPaths =
      videoFiles.length > 0
        ? await saveFiles(videoFiles, "property_videos")
        : [];

    const keptAttachments = parseExistingAttachmentsFromForm(
      fields,
      existing.attachments,
    );
    const newAttachmentPaths = await saveFiles(
      attachmentFiles,
      "property_attachments",
    );
    const attachmentPaths = [...keptAttachments, ...newAttachmentPaths];

    if (galleryPaths.length === 0) {
      return NextResponse.json(
        { error: "Property must have at least one image. Add images or keep existing ones." },
        { status: 400 },
      );
    }

    const featureList = normalizeFeatureList(fields, existing.prop_features);
    const featuredImageIndex = clampFeaturedIndex(
      fields.featured_image,
      galleryPaths.length,
    );

    const latRaw = formData.get("lat") ?? fields.lat ?? fields.latitude;
    const lngRaw = formData.get("lng") ?? fields.lng ?? fields.longitude;
    const latStr =
      latRaw != null && String(latRaw).trim() !== ""
        ? String(latRaw).trim()
        : String(existing.lat ?? "");
    const lngStr =
      lngRaw != null && String(lngRaw).trim() !== ""
        ? String(lngRaw).trim()
        : String(existing.lng ?? "");

    await prisma.Property.update({
      where: { id: BigInt(id) },
      data: {
        prop_title: fields.prop_title || existing.prop_title,
        prop_des: fields.prop_des ?? existing.prop_des,
        category: fields.category || existing.category,
        purpose: fields.purpose || existing.purpose,
        prop_price: fields.prop_price || existing.prop_price,
        available_date: fields.available_date
          ? new Date(fields.available_date)
          : existing.available_date,
        prop_beds: fields.prop_beds
          ? parseInt(fields.prop_beds)
          : existing.prop_beds,
        prop_baths: fields.prop_baths
          ? parseInt(fields.prop_baths)
          : existing.prop_baths,
        prop_size: fields.prop_size || existing.prop_size,
        prop_year_built: fields.prop_year_built || existing.prop_year_built,
        prop_features: JSON.stringify(featureList),
        property_map_address:
          fields.property_map_address || existing.property_map_address,
        country: fields.country || existing.country,
        administrative_area_level_1:
          fields.administrative_area_level_1 ||
          existing.administrative_area_level_1,
        city: fields.city || fields.locality || existing.city,
        zip_code: fields.zip_code || fields.postal_code || existing.zip_code,
        lat: latStr,
        lng: lngStr,
        prop_google_street_view:
          fields.prop_google_street_view ?? existing.prop_google_street_view,
        login_required:
          fields.login_required === "1" || fields.login_required === "true"
            ? true
            : fields.login_required === "0" || fields.login_required === "false"
              ? false
              : existing.login_required,
        disclaimer:
          fields.disclaimer !== undefined
            ? fields.disclaimer || null
            : existing.disclaimer,
        gallery_images: JSON.stringify(galleryPaths),
        video_file: videoPaths[0] || existing.video_file,
        youtube_url:
          fields.youtube_url !== undefined
            ? fields.youtube_url
            : existing.youtube_url,
        attachments: JSON.stringify(attachmentPaths),
        featured:
          fields.featured === "1" ||
          fields.featured === "true" ||
          fields.prop_featured === "1" ||
          fields.prop_featured === "true",
        featured_image: featuredImageIndex,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update property error:", error);
    return NextResponse.json(
      { error: "Failed to update property." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    await prisma.Property.delete({ where: { id: BigInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete property error:", error);
    return NextResponse.json(
      { error: "Failed to delete property." },
      { status: 500 },
    );
  }
}
