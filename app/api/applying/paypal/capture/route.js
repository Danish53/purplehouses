import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("application_id");
    const token = searchParams.get("token");

    if (!applicationId) {
      return NextResponse.redirect(new URL("/applying", request.url));
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

    // Get access token
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

    // Capture the order
    const orderId = token;
    if (orderId) {
      const captureResponse = await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const captureData = await captureResponse.json();

      if (captureResponse.ok && captureData.status === "COMPLETED") {
        await query(
          "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
          ["paid", applicationId],
        );
        return NextResponse.redirect(new URL("/success", request.url));
      }
    }

    await query(
      "UPDATE frontend_applying SET payment_status = ? WHERE id = ?",
      ["failed", applicationId],
    );
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
