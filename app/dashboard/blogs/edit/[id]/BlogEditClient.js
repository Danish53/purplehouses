"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BlogEditClient({ blog }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        window.CKEDITOR &&
        document.getElementById("blog-editor-edit")
      ) {
        if (!editorRef.current) {
          editorRef.current = window.CKEDITOR.replace("blog-editor-edit");
        }
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const fd = new FormData();
    fd.append("id", blog.id);
    fd.append("title", form.title.value);
    fd.append(
      "description",
      editorRef.current ? editorRef.current.getData() : form.description.value,
    );
    fd.append("keywords", form.keywords.value);
    const imageFile = form.image.files?.[0];
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch("/api/blogs", { method: "PUT", body: fd });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/blogs");
      } else {
        alert(data.error || "Failed to update blog.");
      }
    } catch {
      alert("Error updating blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <h2>Update Blog</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {(blog.safe_image_url || blog.image_url) && (
            <img
              src={blog.safe_image_url || blog.image_url}
              width="150"
              className="mb-3"
              alt={blog.title}
            />
          )}
          <br />
          <input type="file" name="image" className="form-control mb-3" />
          <input
            type="text"
            name="title"
            defaultValue={blog.title}
            className="bc_title border w-100 p-2 mb-3"
            required
          />
          <textarea
            name="description"
            id="blog-editor-edit"
            className="bc_text border w-100 p-2"
            defaultValue={blog.description || ""}
          ></textarea>
          <br />
          <br />
          <input
            type="text"
            name="keywords"
            defaultValue={blog.keywords || ""}
            className="bc_title border w-100 p-2 mb-3"
          />
          <br />
          <button type="submit" className="btn btn-bc_save" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}
