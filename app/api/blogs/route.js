import { NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { getSession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveBlogImage(file) {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;
  if (file.size > 5 * 1024 * 1024) return null; // 5 MB limit
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = path.join(process.cwd(), "public", "media", "blogs");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `blogs/${filename}`;
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const keywords = formData.get("keywords") || "";
    const imageUrl = formData.get("image_url") || "";
    const imageFile = formData.get("image");

    let imagePath = imageUrl || "";
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      imagePath = await saveBlogImage(imageFile);
    }

    const result = await insert(
      "INSERT INTO blogs (title, description, keywords, image) VALUES (?, ?, ?, ?)",
      [title, description, keywords, imagePath],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json(
      { error: "Failed to create blog." },
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
    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const keywords = formData.get("keywords") || "";
    const imageUrl = formData.get("image_url") || "";
    const imageFile = formData.get("image");

    if (!id)
      return NextResponse.json({ error: "Blog ID required." }, { status: 400 });

    let imagePath = imageUrl;
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      imagePath = await saveBlogImage(imageFile);
    }

    if (imagePath) {
      await query(
        "UPDATE blogs SET title = ?, description = ?, keywords = ?, image = ? WHERE id = ?",
        [title, description, keywords, imagePath, id],
      );
    } else {
      await query(
        "UPDATE blogs SET title = ?, description = ?, keywords = ? WHERE id = ?",
        [title, description, keywords, id],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json(
      { error: "Failed to update blog." },
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
    await query("DELETE FROM blogs WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete blog." },
      { status: 500 },
    );
  }
}
