import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  APPLICATION_FEE_CENTS,
  APPLICATION_FEE_DOLLARS,
  parseApplyingFormEntries,
  validateApplyingAndSavePhoto,
  insertFullApplication,
  sendApplyingNotificationEmail,
} from "@/lib/applyingApplication";
import {
  deleteApplyingDraft,
  generateDraftToken,
  loadApplyingDraft,
  saveApplyingDraft,
  saveOrderDraftLink,
} from "@/lib/applyingDraft";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
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
    const paymentMethod = fields.payment_method || "card";

    if (paymentMethod === "venmo") {
      return NextResponse.json(
        {
          error:
            "Venmo checkout uses the Venmo button; please complete payment there.",
        },
        { status: 400 },
      );
    }

    const draftToken = generateDraftToken();
    await saveApplyingDraft(draftToken, { fields, photoPath });

    if (paymentMethod === "card") {
      const stripePaymentMethodId = fields.stripe_payment_method_id;
      if (!stripePaymentMethodId) {
        await deleteApplyingDraft(draftToken);
        return NextResponse.json(
          { error: "No payment method provided." },
          { status: 400 },
        );
      }

      const paymentIntent = await getStripe().paymentIntents.create({
        amount: APPLICATION_FEE_CENTS,
        currency: "usd",
        payment_method: stripePaymentMethodId,
        confirm: true,
        payment_method_types: ["card"],
        description: "Rental application fee ($50)",
        metadata: { draft_token: draftToken },
      });

      if (paymentIntent.status === "requires_action") {
        return NextResponse.json({
          status: "requires_action",
          payment_intent_client_secret: paymentIntent.client_secret,
        });
      }

      if (paymentIntent.status === "succeeded") {
        const draft = await loadApplyingDraft(draftToken);
        if (!draft?.fields || !draft.photoPath) {
          await deleteApplyingDraft(draftToken);
          return NextResponse.json(
            { error: "Application draft expired. Please submit again." },
            { status: 400 },
          );
        }
        const result = await insertFullApplication(draft.fields, draft.photoPath, {
          paymentMethod: "card",
          paymentStatus: "paid",
        });
        await deleteApplyingDraft(draftToken);
        await sendApplyingNotificationEmail(
          draft.fields,
          result.insertId,
          "card",
          "paid",
          draft.photoPath,
        );
        return NextResponse.json({
          status: "succeeded",
          redirect_url: "/success",
        });
      }

      await deleteApplyingDraft(draftToken);
      return NextResponse.json(
        { error: "Payment failed. Status: " + paymentIntent.status },
        { status: 400 },
      );
    }

    if (paymentMethod === "paypal") {
      const PAYPAL_API =
        process.env.PAYPAL_ENV === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";
      const paypalClientId = getPayPalClientId();
      if (!paypalClientId || !process.env.PAYPAL_CLIENT_SECRET) {
        await deleteApplyingDraft(draftToken);
        return NextResponse.json(
          { error: "PayPal is not configured." },
          { status: 500 },
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
        await deleteApplyingDraft(draftToken);
        return NextResponse.json(
          {
            error:
              authData.error_description || "PayPal authentication failed.",
          },
          { status: 502 },
        );
      }
      const accessToken = authData.access_token;

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: APPLICATION_FEE_DOLLARS,
              },
              description: "Rental application fee ($50)",
              custom_id: draftToken,
            },
          ],
          application_context: {
            return_url: `${siteUrl}/api/applying/paypal/capture?draft_token=${encodeURIComponent(draftToken)}`,
            cancel_url: `${siteUrl}/applying`,
          },
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        await deleteApplyingDraft(draftToken);
        return NextResponse.json(
          { error: order?.message || "Failed to create PayPal order." },
          { status: 502 },
        );
      }
      const orderId = order.id;
      const approvalUrl = order.links?.find((l) => l.rel === "approve")?.href;

      if (approvalUrl && orderId) {
        await saveOrderDraftLink(orderId, draftToken);
        return NextResponse.json({
          status: "paypal_redirect",
          redirect_url: approvalUrl,
        });
      }

      await deleteApplyingDraft(draftToken);
      return NextResponse.json(
        { error: "Failed to create PayPal order." },
        { status: 500 },
      );
    }

    await deleteApplyingDraft(draftToken);
    return NextResponse.json(
      { error: "Unsupported payment method." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Applying error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process application." },
      { status: 500 },
    );
  }
}
