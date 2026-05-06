import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  deleteApplyingDraft,
  deleteOrderDraftLink,
  loadApplyingDraft,
  loadDraftTokenByOrderId,
} from "@/lib/applyingDraft";
import {
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
    const customIdRaw = String(orderBefore.purchase_units?.[0]?.custom_id || "");
    const [orderDraftToken, orderApplicationIdRaw] = customIdRaw.split(":");
    const orderApplicationId = orderApplicationIdRaw
      ? parseInt(orderApplicationIdRaw, 10)
      : null;
    if (!orderGetRes.ok || orderDraftToken !== draftToken) {
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
      if (orderApplicationId && !Number.isNaN(orderApplicationId)) {
        await query(
          `UPDATE frontend_applying
           SET payment_status = 'failed', stripe_charge_id = ?
           WHERE id = ?`,
          [orderId, orderApplicationId],
        );
      }
      return NextResponse.json(
        {
          error:
            captureData?.message || "PayPal did not mark the payment complete.",
        },
        { status: 400 },
      );
    }

    if (!orderApplicationId || Number.isNaN(orderApplicationId)) {
      return NextResponse.json(
        { error: "Missing linked application for this checkout." },
        { status: 400 },
      );
    }
    await query(
      `UPDATE frontend_applying
       SET payment_status = 'paid', stripe_charge_id = ?
       WHERE id = ?`,
      [orderId, orderApplicationId],
    );

    const draft = await loadApplyingDraft(draftToken);
    await deleteApplyingDraft(draftToken);
    await deleteOrderDraftLink(orderId);

    if (draft?.fields && draft.photoPath) {
      await sendApplyingNotificationEmail(
        draft.fields,
        orderApplicationId,
        "venmo",
        "paid",
        draft.photoPath,
      );
    }

    return NextResponse.json({
      status: "succeeded",
      redirect_url: `/success?application_id=${orderApplicationId}`,
    });
  } catch (error) {
    console.error("Venmo capture error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture Venmo payment." },
      { status: 500 },
    );
  }
}
