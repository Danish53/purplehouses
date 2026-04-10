import { NextResponse } from "next/server";
import {
  APPLICATION_FEE_DOLLARS,
  parseApplyingFormEntries,
  validateApplyingAndSavePhoto,
} from "@/lib/applyingApplication";
import {
  deleteApplyingDraft,
  generateDraftToken,
  saveApplyingDraft,
  saveOrderDraftLink,
} from "@/lib/applyingDraft";

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

async function getPayPalAccessToken() {
  const clientId = getPayPalClientId();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error("PayPal credentials not configured");

  const base =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to obtain PayPal token");
  return { token: data.access_token, base };
}

export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid form payload. Please submit using the application form.",
        },
        { status: 400 },
      );
    }

    const { fields, photoFile } = parseApplyingFormEntries(formData);
    const validated = await validateApplyingAndSavePhoto(fields, photoFile);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { photoPath } = validated;
    const fundingSource = fields.payment_method || "venmo";
    if (fundingSource !== "venmo") {
      return NextResponse.json(
        { error: "Only Venmo uses the native SDK checkout flow." },
        { status: 400 },
      );
    }

    const draftToken = generateDraftToken();
    await saveApplyingDraft(draftToken, { fields, photoPath });

    const { token, base } = await getPayPalAccessToken();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: APPLICATION_FEE_DOLLARS },
            description: "Rental application fee ($50)",
            custom_id: draftToken,
          },
        ],
      }),
    });

    const order = await orderRes.json();
    const orderId = order.id;

    if (!orderRes.ok || !orderId) {
      await deleteApplyingDraft(draftToken);
      return NextResponse.json(
        { error: order?.message || "Failed to create PayPal order." },
        { status: 502 },
      );
    }

    await saveOrderDraftLink(orderId, draftToken);

    return NextResponse.json({
      status: "created",
      order_id: orderId,
      draft_token: draftToken,
    });
  } catch (error) {
    console.error("Venmo create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Venmo order." },
      { status: 500 },
    );
  }
}
