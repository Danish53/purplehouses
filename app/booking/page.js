export const dynamic = "force-dynamic";
import { getPublicProperties } from "@/lib/queries";
import BookingClient from "./BookingClient";

export default async function BookingPage() {
  let properties = [];
  try {
    const rows = await getPublicProperties();
    properties = rows.map((r) => ({ id: r.id, prop_title: r.prop_title }));
  } catch (e) {
    console.error("Booking properties fetch error:", e);
  }

  return <BookingClient properties={properties} />;
}
