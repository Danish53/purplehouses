import { NextResponse } from "next/server";
import { query } from "@/lib/db";

async function getPayPalAccessToken() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
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

// GET: PayPal redirects here after approval (redirect flow)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("application_id");
    const token = searchParams.get("token"); // PayPal order ID

    if (!applicationId) {
      return NextResponse.redirect(new URL("/applying", request.url));
    }

    if (!token) {
      await query(
        "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
        ["failed", applicationId],
      );
      return NextResponse.redirect(
        new URL("/applying?error=payment_failed", request.url),
      );
    }

    const { token: accessToken, base } = await getPayPalAccessToken();
    const captureRes = await fetch(
      `${base}/v2/checkout/orders/${encodeURIComponent(token)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const captureData = await captureRes.json();

    if (captureRes.ok && captureData.status === "COMPLETED") {
      await query(
        "UPDATE frontend_applying SET payment_status = ?, stripe_charge_id = ? WHERE id = ?",
        ["paid", token, applicationId],
      );
      return NextResponse.redirect(new URL("/success", request.url));
    }

    await query(
      "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
      ["failed", applicationId],
    );
    return NextResponse.redirect(
      new URL("/applying?error=payment_failed", request.url),
    );
  } catch (error) {
    console.error("PayPal capture-order error:", error);
    return NextResponse.redirect(
      new URL("/applying?error=server_error", request.url),
    );
  }
}

// POST: JS SDK capture flow
export async function POST(request) {
  try {
    const { orderId, applicationId } = await request.json();
    if (!orderId || !applicationId) {
      return NextResponse.json(
        { error: "Missing order details." },
        { status: 400 },
      );
    }

    const { token, base } = await getPayPalAccessToken();
    const captureRes = await fetch(
      `${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    const captureData = await captureRes.json();

    if (captureRes.ok && captureData.status === "COMPLETED") {
      await query(
        "UPDATE frontend_applying SET payment_status = ?, stripe_charge_id = ? WHERE id = ?",
        ["paid", orderId, applicationId],
      );
      return NextResponse.json({ success: true });
    }

    await query(
      "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
      ["failed", applicationId],
    );
    return NextResponse.json(
      { error: "Payment capture failed." },
      { status: 400 },
    );
  } catch (error) {
    console.error("PayPal capture-order POST error:", error);
    return NextResponse.json(
      { error: "Server error during capture." },
      { status: 500 },
    );
  }
}
