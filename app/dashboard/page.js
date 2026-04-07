export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import DashboardIndexClient from "./DashboardIndexClient";

export default async function DashboardPage() {
  const rows = await query("SELECT * FROM Property ORDER BY created_at DESC");

  const properties = rows.map((p) => {
    let gallery = [];
    try {
      gallery =
        typeof p.gallery_images === "string"
          ? JSON.parse(p.gallery_images)
          : p.gallery_images || [];
    } catch {
      gallery = [];
    }
    return {
      ...p,
      gallery_images: Array.isArray(gallery) ? gallery : [],
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
      available_date: p.available_date
        ? new Date(p.available_date).toISOString()
        : null,
    };
  });

  return <DashboardIndexClient properties={properties} />;
}
