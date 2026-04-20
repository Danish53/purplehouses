import { redirect } from "next/navigation";

export default async function LegacyBlogDetailPage({ params }) {
  const { slug } = await params;
  redirect(`/blogs/${encodeURIComponent(slug)}`);
}
