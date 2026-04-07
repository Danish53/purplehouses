export const dynamic = "force-dynamic";
import { getAllBlogs } from "@/lib/queries";
import DashboardBlogsClient from "./DashboardBlogsClient";

export default async function DashboardBlogsPage() {
  const blogs = await getAllBlogs();
  return <DashboardBlogsClient blogs={blogs} />;
}
