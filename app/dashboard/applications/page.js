export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const applications = await query(
    "SELECT * FROM frontend_applying ORDER BY submitted_at DESC",
  );
  const serialized = applications.map((a) => ({
    ...a,
    submitted_at: a.submitted_at
      ? new Date(a.submitted_at).toISOString()
      : null,
    move_in_date: a.move_in_date
      ? new Date(a.move_in_date).toISOString()
      : null,
    dob: a.dob ? new Date(a.dob).toISOString() : null,
    dependent_dob: a.dependent_dob
      ? new Date(a.dependent_dob).toISOString()
      : null,
  }));
  return <ApplicationsClient applications={serialized} />;
}
