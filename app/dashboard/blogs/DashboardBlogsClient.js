"use client";
import { useState } from "react";
import Link from "next/link";

function stripTags(html) {
  return html ? html.replace(/<[^>]*>/g, "") : "";
}

function truncateWords(text, count) {
  const words = text.split(/\s+/);
  return words.slice(0, count).join(" ") + (words.length > count ? "..." : "");
}

export default function DashboardBlogsClient({ blogs: initialBlogs }) {
  const [blogs, setBlogs] = useState(initialBlogs);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    const res = await fetch("/api/blogs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBlogs(blogs.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="dashboardHome">
      <div className="inner">
        <div className="top d-flex align-items-center justify-content-between">
          <p className="m-0 title">All Blogs List</p>
          <Link href="/dashboard/blogs/create">
            <button className="btn btn-createList rounded-1">
              Create New Blog Post
            </button>
          </Link>
        </div>

        <hr />

        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Title</th>
              <th>Description</th>
              <th>Keywords</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No blogs found.
                </td>
              </tr>
            ) : (
              blogs.map((blog, i) => (
                <tr key={blog.id}>
                  <td>{i + 1}</td>
                  <td>
                    {blog.safe_image_url || blog.image_url ? (
                      <img
                        src={blog.safe_image_url || blog.image_url}
                        width="100"
                        alt={blog.title}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td>{blog.title}</td>
                  <td>
                    {truncateWords(stripTags(blog.description || ""), 20)}
                  </td>
                  <td>{blog.keywords}</td>
                  <td>
                    <Link
                      href={`/dashboard/blogs/edit/${blog.id}`}
                      className="btn btn-sm btn_blog_edit me-1"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn_blog_delete"
                      onClick={() => handleDelete(blog.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
