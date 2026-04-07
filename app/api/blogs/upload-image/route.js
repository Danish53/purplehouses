import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
]);

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: { message: "Authentication required." } },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const upload = formData.get("upload");

    if (!upload || !(upload instanceof File)) {
      return NextResponse.json(
        { error: { message: "No image file was provided." } },
        { status: 400 },
      );
    }

    if (!upload.type.startsWith("image/")) {
      return NextResponse.json(
        { error: { message: "Only image uploads are allowed." } },
        { status: 400 },
      );
    }

    if (upload.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: { message: "Image uploads must be 5 MB or smaller." } },
        { status: 400 },
      );
    }

    const ext = path.extname(upload.name).toLowerCase() || ".jpg";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: { message: "Unsupported image format." } },
        { status: 400 },
      );
    }

    const filename = `blog_inline_${Date.now()}_${crypto.randomBytes(5).toString("hex")}${ext}`;
    const dir = path.join(process.cwd(), "public", "media", "blog_inline");
    await mkdir(dir, { recursive: true });

    const bytes = await upload.arrayBuffer();
    await writeFile(path.join(dir, filename), Buffer.from(bytes));

    return NextResponse.json({
      urls: { default: `/media/blog_inline/${filename}` },
    });
  } catch (error) {
    console.error("Blog image upload error:", error);
    return NextResponse.json(
      { error: { message: "Upload failed." } },
      { status: 500 },
    );
  }
}
