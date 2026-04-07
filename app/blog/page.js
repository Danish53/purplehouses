export const dynamic = "force-dynamic";
import { getAllBlogs, searchBlogs } from "@/lib/queries";
import Link from "next/link";

export default async function BlogShowPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";
  let blogs = [];
  try {
    blogs = query ? await searchBlogs(query) : await getAllBlogs();
  } catch (e) {
    console.error("Blog fetch error:", e);
  }

  return (
    <section className="ph-page-shell">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">Blogs</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <span>Blog</span>
          </div>
        </div>
      </div>
      <div className="blogShowPage">
        <div className="inner">
          <div className="content">
            <div className="container py-4">
              <h1 className="mb-4">All Blogs</h1>
              {query && (
                <p className="mb-4">
                  Results for: <strong>{query}</strong>
                </p>
              )}

              {blogs.length > 0 ? (
                <div className="row">
                  {blogs.map((blog) => {
                    const imageUrl = blog.safe_image_url || blog.image_url;
                    return (
                      <div key={blog.id} className="col-md-3 mb-4">
                        <div className="card h-100">
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              className="card-img-top"
                              alt={blog.title}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">{blog.title}</h5>
                            <p className="card-text">
                              {(blog.description || "")
                                .replace(/<[^>]*>/g, "")
                                .slice(0, 150)}
                              ...
                            </p>
                            {blog.keywords && (
                              <p className="text-muted">
                                Keywords: {blog.keywords}
                              </p>
                            )}
                          </div>
                          <div className="card-footer text-end">
                            <Link
                              href={`/blog_detail/${blog.id}`}
                              className="btn btn-blogShow btn-sm"
                            >
                              Read More
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No blogs available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
