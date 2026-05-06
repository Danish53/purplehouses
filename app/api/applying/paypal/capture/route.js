import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  deleteApplyingDraft,
  deleteOrderDraftLink,
  loadApplyingDraft,
} from "@/lib/applyingDraft";
import { sendApplyingNotificationEmail } from "@/lib/applyingApplication";

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const draftToken = searchParams.get("draft_token");
    const orderId = searchParams.get("token");
    const applicationId = searchParams.get("application_id");

    if (!draftToken || !orderId || !applicationId) {
      return NextResponse.redirect(
        new URL("/applying?error=missing_checkout", request.url),
      );
    }

    const PAYPAL_API =
      process.env.PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
    const paypalClientId = getPayPalClientId();
    if (!paypalClientId || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL("/applying?error=paypal_not_configured", request.url),
      );
    }

    const authResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${paypalClientId}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) {
      return NextResponse.redirect(
        new URL("/applying?error=paypal_auth_failed", request.url),
      );
    }
    const accessToken = authData.access_token;

    const orderGetRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const orderBefore = await orderGetRes.json();
    const linkedCustomId = String(orderBefore.purchase_units?.[0]?.custom_id || "");
    const expectedCustomId = `${draftToken}:${applicationId}`;
    if (!orderGetRes.ok || linkedCustomId !== expectedCustomId) {
      return NextResponse.redirect(
        new URL("/applying?error=invalid_checkout", request.url),
      );
    }

    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const captureData = await captureResponse.json();

    if (captureResponse.ok && captureData.status === "COMPLETED") {
      const current = await query(
        `SELECT id, payment_status
         FROM frontend_applying
         WHERE id = ? LIMIT 1`,
        [applicationId],
      );
      if (!current?.length) {
        return NextResponse.redirect(
          new URL("/applying?error=missing_application", request.url),
        );
      }

      if (String(current[0].payment_status || "").toLowerCase() !== "paid") {
        await query(
          `UPDATE frontend_applying
           SET payment_status = 'paid', stripe_charge_id = ?
           WHERE id = ?`,
          [orderId, applicationId],
        );
      }

      const draft = await loadApplyingDraft(draftToken);
      if (draft?.fields && draft.photoPath) {
        await sendApplyingNotificationEmail(
          draft.fields,
          Number(applicationId),
          "paypal",
          "paid",
          draft.photoPath,
        );
      }
      await deleteApplyingDraft(draftToken);
      await deleteOrderDraftLink(orderId);
      return NextResponse.redirect(new URL("/success", request.url));
    }

    await query(
      `UPDATE frontend_applying
       SET payment_status = 'failed', stripe_charge_id = ?
       WHERE id = ?`,
      [orderId, applicationId],
    );
    await deleteOrderDraftLink(orderId);
    return NextResponse.redirect(
      new URL("/applying?error=payment_failed", request.url),
    );
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.redirect(
      new URL("/applying?error=payment_failed", request.url),
    );
  }
}
