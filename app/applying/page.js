export const dynamic = "force-dynamic";
import { getPublicProperties } from "@/lib/queries";
import ApplyingClient from "./ApplyingClient";

export default async function ApplyingPage() {
  let properties = [];
  try {
    const rows = await getPublicProperties();
    properties = rows.map((r) => ({ id: r.id, prop_title: r.prop_title }));
  } catch (e) {
    console.error("Applying properties fetch error:", e);
  }

  return (
    <ApplyingClient
      properties={properties}
      stripePublicKey={process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ""}
      paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""}
    />
  );
}
