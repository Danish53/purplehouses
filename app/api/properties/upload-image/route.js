import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_DIR = path.join(
  process.cwd(),
  "public",
  "media",
  "property_images",
);
let imageDirectoryReady;

function ensureImageDirectory() {
  imageDirectoryReady ||= mkdir(IMAGE_DIR, { recursive: true });
  return imageDirectoryReady;
}

function storedFilename(file) {
  let ext = path.extname(file.name || "").toLowerCase();
  if (!ext || !/^\.[a-z0-9]{1,12}$/i.test(ext)) ext = ".jpg";
  return `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size <= 0) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 },
      );
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file." },
        { status: 400 },
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Maximum size is 20MB." },
        { status: 413 },
      );
    }

    await ensureImageDirectory();

    const filename = storedFilename(image);
    const bytes = await image.arrayBuffer();
    await writeFile(path.join(IMAGE_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      path: `property_images/${filename}`,
    });
  } catch (error) {
    console.error("Property image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
