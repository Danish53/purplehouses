import fs from "fs";
import path from "path";
import prisma from "./prisma";
import { query, queryOne } from "./db";
import { friendlyFeatureLabel } from "./constants";

// Convert BigInt IDs and Date objects to plain JS types for JSON serialization
function serializePrismaRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "bigint") out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), "public", "media");
const PROPERTY_GALLERY_FALLBACKS = [
  {
    match: ["4024 winfield", "winfield ave"],
    urls: ["/images/2.jpg"],
  },
  {
    match: ["3204 forest park", "forest park blvd"],
    urls: ["/images/1.jpg"],
  },
  {
    match: ["2615 wabash", "wabash ave"],
    urls: ["/images/3.jpg"],
  },
  {
    match: ["4510 s university", "3 bed townhouse"],
    urls: [
      "/media/property_images/property_34_1768241079_1.webp",
      "/media/property_images/property_34_1768241079_2.webp",
    ],
  },
  {
    match: ["3501 lackland", "2 bed condo"],
    urls: [
      "/media/property_images/property_35_1768293466_1.webp",
      "/media/property_images/property_35_1768293466_2.webp",
    ],
  },
  {
    match: ["2900 s university", "studio apartment"],
    urls: [
      "/media/property_images/property_36_1768293860_10.webp",
      "/media/property_images/property_36_1768293860_11.webp",
    ],
  },
];
const GENERIC_GALLERY_FALLBACKS = [
  "/images/1.jpg",
  "/images/2.jpg",
  "/images/3.jpg",
  "/media/property_images/property_34_1768241079_1.webp",
  "/media/property_images/property_35_1768293466_1.webp",
  "/media/property_images/property_36_1768293860_10.webp",
];

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function naturalSort(a, b) {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizeMediaPath(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^media\//, "");
}

function mediaFileExists(relativePath) {
  if (!relativePath) return false;
  return fs.existsSync(path.join(PUBLIC_MEDIA_ROOT, relativePath));
}

function existingMediaPaths(values = []) {
  const resolved = [];
  const seen = new Set();

  for (const value of values) {
    const cleaned = normalizeMediaPath(value);
    if (!cleaned || seen.has(cleaned) || !mediaFileExists(cleaned)) continue;
    resolved.push(cleaned);
    seen.add(cleaned);
  }

  return resolved;
}

function fallbackMediaPaths(directoryName, prefix) {
  const directory = path.join(PUBLIC_MEDIA_ROOT, directoryName);
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter((name) => name.startsWith(prefix))
    .sort(naturalSort)
    .map((name) => `${directoryName}/${name}`);
}

function getPropertyFallbackGallery(prop) {
  const haystack =
    `${prop?.prop_title || ""} ${prop?.property_map_address || ""}`
      .toLowerCase()
      .trim();

  const matched = PROPERTY_GALLERY_FALLBACKS.find((entry) =>
    entry.match.some((needle) => haystack.includes(needle)),
  );
  if (matched) return matched.urls;

  const seed = Math.abs(Number(prop?.id) || 0);
  return [GENERIC_GALLERY_FALLBACKS[seed % GENERIC_GALLERY_FALLBACKS.length]];
}

export function resolvePropertyGalleryUrls(
  prop,
  galleryValues = parseJsonField(prop?.gallery_images),
) {
  let galleryPaths = existingMediaPaths(galleryValues);

  if (prop?.id) {
    const byIdPaths = fallbackMediaPaths(
      "property_images",
      `property_${prop.id}_`,
    );
    galleryPaths = galleryPaths.length
      ? unique([...galleryPaths, ...byIdPaths])
      : byIdPaths;
  }

  if (galleryPaths.length) {
    return galleryPaths.map(buildMediaUrl).filter(Boolean);
  }

  return unique(getPropertyFallbackGallery(prop));
}

export function resolvePropertyAttachmentItems(
  prop,
  attachmentValues = parseJsonField(prop?.attachments),
) {
  let attachmentPaths = existingMediaPaths(attachmentValues);

  if (prop?.id) {
    const byIdPaths = fallbackMediaPaths(
      "property_attachments",
      `property_${prop.id}_`,
    );
    attachmentPaths = attachmentPaths.length
      ? unique([...attachmentPaths, ...byIdPaths])
      : byIdPaths;
  }

  return attachmentPaths.map((filePath) => ({
    path: filePath,
    url: buildMediaUrl(filePath),
    name: filePath.split("/").pop(),
  }));
}

/* ─── Properties ─── */
export async function getPublicProperties() {
  const rows = await prisma.Property.findMany({
    where: { status: { not: "expire" } },
    orderBy: [{ featured: "desc" }, { id: "desc" }],
  });
  return rows.map(serializePrismaRow);
}

export async function getPropertyById(id) {
  try {
    const row = await prisma.Property.findUnique({ where: { id: BigInt(id) } });
    return row ? serializePrismaRow(row) : null;
  } catch {
    return null;
  }
}

export async function getAllProperties(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.Property.findMany({
      orderBy: { id: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.Property.count(),
  ]);
  return { rows: rows.map(serializePrismaRow), total };
}

export async function searchProperties({
  q,
  city,
  category,
  purpose,
  page = 1,
  limit = 9,
}) {
  const where = {
    NOT: { status: { equals: "expire" } },
  };
  if (q) {
    where.OR = [
      { prop_title: { contains: q } },
      { property_map_address: { contains: q } },
      { city: { contains: q } },
      { zip_code: { contains: q } },
    ];
  }
  if (city) where.city = { equals: city };
  if (category) where.category = { equals: category };
  if (purpose) where.purpose = { equals: purpose };

  const [rows, total] = await Promise.all([
    prisma.Property.findMany({
      where,
      orderBy: [{ featured: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.Property.count({ where }),
  ]);
  return { rows: rows.map(serializePrismaRow), total };
}

export async function getFilterOptions() {
  const [cities, categories, purposes] = await Promise.all([
    prisma.Property.findMany({
      where: {
        city: { not: "" },
        NOT: { status: { equals: "expire" } },
      },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.Property.findMany({
      where: {
        category: { not: null },
        NOT: { status: { equals: "expire" } },
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    prisma.Property.findMany({
      where: {
        purpose: { not: null },
        NOT: { status: { equals: "expire" } },
      },
      select: { purpose: true },
      distinct: ["purpose"],
      orderBy: { purpose: "asc" },
    }),
  ]);
  return {
    cities: cities.map((r) => r.city).filter(Boolean),
    categories: categories.map((r) => r.category).filter(Boolean),
    purposes: purposes.map((r) => r.purpose).filter(Boolean),
  };
}

/* ─── Blogs ─── */
export async function getAllBlogs(limit) {
  const rows = await prisma.blogs.findMany({
    orderBy: { id: "desc" },
    ...(limit ? { take: parseInt(limit, 10) } : {}),
  });
  return rows.map(serializePrismaRow).map(enrichBlog);
}

export async function getBlogById(id) {
  try {
    const row = await prisma.blogs.findUnique({ where: { id: BigInt(id) } });
    return row ? enrichBlog(serializePrismaRow(row)) : null;
  } catch {
    return null;
  }
}

export async function searchBlogs(q) {
  const rows = await prisma.blogs.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { keywords: { contains: q } },
      ],
    },
    orderBy: { id: "desc" },
  });
  return rows.map(serializePrismaRow).map(enrichBlog);
}

/* ─── Bookings ─── */
export async function createBooking(data) {
  const row = await prisma.booking.create({
    data: {
      property_name: data.property_name,
      date: new Date(data.date),
      time: data.time,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      status: "Pending",
      reason: "",
      created_at: new Date(),
    },
  });
  return Number(row.id);
}

export async function getBookings(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { id: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.booking.count(),
  ]);
  return { rows: rows.map(serializePrismaRow), total };
}

export async function updateBookingStatus(id, status, reason) {
  await prisma.booking.update({
    where: { id: BigInt(id) },
    data: { status, reason: reason || "" },
  });
  const row = await prisma.booking.findUnique({ where: { id: BigInt(id) } });
  return row ? serializePrismaRow(row) : null;
}

/* ─── Applications (Applying) ─── */
export async function getApplications(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.frontend_applying.findMany({
      orderBy: { id: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.frontend_applying.count(),
  ]);
  return { rows: rows.map(serializePrismaRow), total };
}

export async function getApplicationById(id) {
  const row = await prisma.frontend_applying.findUnique({
    where: { id: BigInt(id) },
  });
  return row ? serializePrismaRow(row) : null;
}

export async function deleteApplication(id) {
  return prisma.frontend_applying.delete({ where: { id: BigInt(id) } });
}

/* ─── Contacts ─── */
export async function createContact(data) {
  const row = await prisma.frontend_contact.create({
    data: {
      name: data.name,
      email: data.email,
      work_phone: data.work_phone || "",
      subject: data.subject || "",
      message: data.message,
    },
  });
  return { insertId: Number(row.id) };
}

/* ─── Users ─── */
export async function getUserByUsername(username) {
  const row = await prisma.frontend_customuser.findUnique({
    where: { username },
  });
  return row ? serializePrismaRow(row) : null;
}

export async function getUserById(id) {
  const row = await prisma.frontend_customuser.findUnique({
    where: { id: BigInt(id) },
  });
  return row ? serializePrismaRow(row) : null;
}

/* ─── Property gallery helpers ─── */
export function parseJsonField(value) {
  if (value == null || value === "") return [];
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    value = value.toString("utf8");
  }
  if (Array.isArray(value)) return value;
  const str = String(value).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildMediaUrl(path) {
  if (!path) return null;
  const cleaned = String(path).replace(/\\/g, "/").replace(/^\//, "");
  return `/media/${cleaned.replace(/^media\//, "")}`;
}

export function enrichProperty(prop) {
  if (!prop) return null;
  const gallery = parseJsonField(prop.gallery_images);
  const features = parseJsonField(prop.prop_features);
  const galleryUrls = resolvePropertyGalleryUrls(prop, gallery);
  const attachmentItems = resolvePropertyAttachmentItems(prop);

  return {
    ...prop,
    gallery_images: gallery,
    gallery_urls: galleryUrls,
    primary_image_url: galleryUrls[0] || null,
    attachments: parseJsonField(prop.attachments),
    attachment_urls: attachmentItems,
    prop_features: features,
    feature_labels: features.map(friendlyFeatureLabel),
    category_label: String(prop.category || "")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim(),
    purpose_label: String(prop.purpose || "")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim(),
    available_date: prop.available_date || prop.created_at,
  };
}

/**
 * Dashboard list: URLs from DB paths only (no fs.existsSync). New uploads use
 * `timestamp_filename` which does not match resolvePropertyGalleryUrls' `property_${id}_` fallback.
 */
export function enrichDashboardProperty(prop) {
  if (!prop) return null;
  const gallery = parseJsonField(prop.gallery_images);
  const gallery_urls = unique(
    gallery.map((entry) => buildMediaUrl(entry)).filter(Boolean),
  );
  const primary_image_url = gallery_urls[0] || "/images/1.jpg";
  return {
    ...prop,
    gallery_images: gallery,
    gallery_urls,
    primary_image_url,
  };
}

export function enrichBlog(blog) {
  if (!blog) return null;
  const rawImage = String(blog.image || "").trim();
  let safeImageUrl = null;

  if (rawImage) {
    if (/^(https?:)?\/\//i.test(rawImage) || rawImage.startsWith("data:")) {
      safeImageUrl = rawImage;
    } else if (rawImage.startsWith("/media/")) {
      safeImageUrl = rawImage.replace(/\/+/g, "/");
    } else {
      safeImageUrl = buildMediaUrl(rawImage);
    }
  }

  return {
    ...blog,
    safe_image_url: safeImageUrl,
    image_url: safeImageUrl,
  };
}
