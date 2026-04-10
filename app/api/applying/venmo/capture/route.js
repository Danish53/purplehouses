import { NextResponse } from "next/server";
import {
  deleteApplyingDraft,
  deleteOrderDraftLink,
  loadApplyingDraft,
  loadDraftTokenByOrderId,
} from "@/lib/applyingDraft";
import {
  insertFullApplication,
  sendApplyingNotificationEmail,
} from "@/lib/applyingApplication";

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
    const draftToken = body.draft_token;

    if (!orderId || !draftToken) {
      return NextResponse.json(
        { error: "Missing PayPal order or draft details." },
        { status: 400 },
      );
    }

    const linkedFromFile = await loadDraftTokenByOrderId(orderId);
    if (linkedFromFile !== draftToken) {
      return NextResponse.json(
        { error: "Order does not match this checkout session." },
        { status: 404 },
      );
    }

    const { token, base } = await getPayPalAccessToken();

    const orderGetRes = await fetch(
      `${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const orderBefore = await orderGetRes.json();
    const customId = orderBefore.purchase_units?.[0]?.custom_id;
    if (!orderGetRes.ok || customId !== draftToken) {
      return NextResponse.json(
        { error: "Invalid or expired PayPal order." },
        { status: 404 },
      );
    }

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

    if (
      !captureRes.ok ||
      !(captureStatus === "COMPLETED" || paymentsCompleted)
    ) {
      return NextResponse.json(
        {
          error:
            captureData?.message || "PayPal did not mark the payment complete.",
        },
        { status: 400 },
      );
    }

    const draft = await loadApplyingDraft(draftToken);
    if (!draft?.fields || !draft.photoPath) {
      await deleteApplyingDraft(draftToken);
      await deleteOrderDraftLink(orderId);
      return NextResponse.json(
        { error: "Application draft expired. Please contact support if you were charged." },
        { status: 400 },
      );
    }

    const result = await insertFullApplication(
      draft.fields,
      draft.photoPath,
      { paymentMethod: "venmo", paymentStatus: "paid" },
    );
    await deleteApplyingDraft(draftToken);
    await deleteOrderDraftLink(orderId);
    await sendApplyingNotificationEmail(
      draft.fields,
      result.insertId,
      "venmo",
      "paid",
      draft.photoPath,
    );

    return NextResponse.json({
      status: "succeeded",
      redirect_url: `/success?application_id=${result.insertId}`,
    });
  } catch (error) {
    console.error("Venmo capture error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture Venmo payment." },
      { status: 500 },
    );
  }
}
