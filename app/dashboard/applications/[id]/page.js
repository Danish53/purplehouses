export const dynamic = "force-dynamic";
import { query, queryOne } from "@/lib/db";
import ApplicationViewClient from "./ApplicationViewClient";

export default async function ApplicationDetailPage({ params }) {
  const { id } = await params;
  const rows = await query("SELECT * FROM frontend_applying WHERE id = ?", [
    id,
  ]);
  if (!rows.length) {
    return <div className="p-4">Application not found.</div>;
  }
  const app = { ...rows[0] };
  if (app.property_id) {
    const prop = await queryOne(
      "SELECT prop_title FROM Property WHERE id = ? LIMIT 1",
      [String(app.property_id).trim()],
    );
    if (prop?.prop_title) app.property_name = prop.prop_title;
  }
  // Serialize dates
  const dateFields = [
    "created_at",
    "submitted_at",
    "move_in_date",
    "dob",
    "dependent_dob",
  ];
  for (const f of dateFields) {
    if (app[f]) app[f] = new Date(app[f]).toISOString();
  }
  // Parse JSON fields
  const jsonFields = ["adult_names", "pet_details"];
  for (const f of jsonFields) {
    if (app[f] && typeof app[f] === "string") {
      try {
        app[f] = JSON.parse(app[f]);
      } catch {
        /* keep as string */
      }
    }
  }
  return <ApplicationViewClient app={app} />;
}
