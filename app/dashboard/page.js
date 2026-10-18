export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import { enrichDashboardProperty } from "@/lib/queries";
import DashboardIndexClient from "./DashboardIndexClient";

export default async function DashboardPage() {
  // sort_order = manual drag order (ties / unset keep newest first)
  let rows;
  try {
    rows = await query(
      "SELECT * FROM Property ORDER BY sort_order ASC, created_at DESC",
    );
  } catch {
    // sort_order column not added yet (run: npx prisma db push)
    rows = await query("SELECT * FROM Property ORDER BY created_at DESC");
  }

  const properties = rows.map((p) => {
    const enriched = enrichDashboardProperty(p);
    if (!enriched) {
      return {
        ...p,
        gallery_images: [],
        primary_image_url: "/images/1.jpg",
        created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
        available_date: p.available_date
          ? new Date(p.available_date).toISOString()
          : null,
      };
    }
    return {
      ...enriched,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
      available_date: p.available_date
        ? new Date(p.available_date).toISOString()
        : null,
    };
  });

  return <DashboardIndexClient properties={properties} />;
}
