"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BlogCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        window.CKEDITOR &&
        document.getElementById("blog-editor")
      ) {
        if (!editorRef.current) {
          editorRef.current = window.CKEDITOR.replace("blog-editor");
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
    fd.append("title", form.title.value);
    fd.append(
      "description",
      editorRef.current ? editorRef.current.getData() : form.description.value,
    );
    fd.append("keywords", form.keywords.value);
    const imageFile = form.image.files[0];
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch("/api/blogs", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/blogs");
      } else {
        alert(data.error || "Failed to create blog.");
      }
    } catch {
      alert("Error creating blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <h4 className="mb-4">Create Blog</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input type="file" name="image" className="form-control mb-3" />
          <input
            type="text"
            name="title"
            placeholder="Title"
            className="bc_title border w-100 p-2 mb-3"
            required
          />
          <textarea
            name="description"
            id="blog-editor"
            placeholder="Description"
            className="bc_text border w-100 p-2"
          ></textarea>
          <br />
          <br />
          <input
            type="text"
            name="keywords"
            placeholder="Keywords"
            className="bc_keywords border w-100 p-2 mb-3"
          />
          <br />
          <button type="submit" className="btn btn-bc_save" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
