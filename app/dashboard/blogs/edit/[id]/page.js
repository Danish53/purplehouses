export const dynamic = "force-dynamic";
import { getBlogById } from "@/lib/queries";
import BlogEditClient from "./BlogEditClient";

export default async function BlogEditPage({ params }) {
  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) {
    return <div className="p-4">Blog not found.</div>;
  }
  return <BlogEditClient blog={blog} />;
}
