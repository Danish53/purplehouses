import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const APPLICATION_FEE = "50.00";

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
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "Failed to obtain PayPal token");
  }
  return { token: data.access_token, base };
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const orderId = body.order_id;
    const applicationId = body.application_id;

    if (!orderId || !applicationId) {
      return NextResponse.json(
        { error: "Missing PayPal order details." },
        { status: 400 },
      );
    }

    // Verify application matches order
    const [app] = await query(
      "SELECT * FROM frontend_applying WHERE id = ? AND stripe_charge_id = ?",
      [applicationId, orderId],
    );

    if (!app) {
      return NextResponse.json(
        { error: "Application not found for this PayPal order." },
        { status: 404 },
      );
    }

    // Capture the PayPal order
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
    const captureStatus = captureData.status;
    const paymentsCompleted = (captureData.purchase_units || []).some((pu) =>
      (pu.payments?.captures || []).some((c) => c.status === "COMPLETED"),
    );

    if (captureRes.ok && (captureStatus === "COMPLETED" || paymentsCompleted)) {
      await query(
        "UPDATE frontend_applying SET payment_method = ?, payment_status = ?, amount = ? WHERE id = ?",
        ["venmo", "paid", APPLICATION_FEE, applicationId],
      );
      return NextResponse.json({
        status: "succeeded",
        redirect_url: `/success?application_id=${applicationId}`,
      });
    }

    return NextResponse.json(
      {
        error:
          captureData?.message || "PayPal did not mark the payment complete.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Venmo capture error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture Venmo payment." },
      { status: 500 },
    );
  }
}
