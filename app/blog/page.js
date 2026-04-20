import { redirect } from "next/navigation";

export default async function LegacyBlogPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q ? `?q=${encodeURIComponent(params.q)}` : "";
  redirect(`/blogs${query}`);
}
