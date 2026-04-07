export const dynamic = "force-dynamic";
import { query } from "@/lib/db";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
  const bookings = await query(
    `SELECT * FROM booking ORDER BY created_at DESC`,
  );
  return <ScheduleClient bookings={bookings} />;
}
