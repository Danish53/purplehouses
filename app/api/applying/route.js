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
import { query } from "@/lib/db";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not configured. Stripe payments disabled.");
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getPayPalClientId() {
  return (
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  );
}

// Check if we're in local development mode where webhooks can't reach
function isLocalDevelopment() {
  return process.env.NODE_ENV === 'development' &&
    (process.env.STRIPE_SKIP_WEBHOOK === 'true' ||
      !process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET.includes('test'));
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

    const property = await prisma.$queryRaw`
  SELECT prop_title 
  FROM property 
  WHERE id = ${fields.property_id}
`;

    const property_name = property?.[0]?.prop_title || "";

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
      const stripe = getStripe();

      // If Stripe is not configured, mark as paid for development/testing
      if (!stripe) {
        console.warn("Stripe not configured. Marking application as paid for development.");
        const result = await insertFullApplication(validated.fields, photoPath, {
          paymentMethod: "card",
          paymentStatus: "paid",
        });

        await deleteApplyingDraft(draftToken);
        await sendApplyingNotificationEmail(
          {
            ...validated.fields,
            property_name, // 👈 ADD THIS
          },
          result.insertId,
          "card",
          "paid",
          photoPath,
        );

        return NextResponse.json({
          status: "succeeded",
          redirect_url: "/success",
          application_id: result.insertId,
        });
      }

      // LOCAL DEVELOPMENT FALLBACK: Skip webhook dependency for local testing
      if (isLocalDevelopment()) {
        console.warn("Local development mode: Simulating successful payment (bypassing webhook)");
        console.warn("Add STRIPE_SKIP_WEBHOOK=false to .env.local to use real Stripe flow");

        const result = await insertFullApplication(validated.fields, photoPath, {
          paymentMethod: "card",
          paymentStatus: "paid",
          stripePaymentIntent: "local_dev_" + Date.now(),
        });

        await deleteApplyingDraft(draftToken);
        await sendApplyingNotificationEmail(
          {
            ...validated.fields,
            property_name,
          },
          result.insertId,
          "card",
          "paid",
          photoPath,
        );

        return NextResponse.json({
          status: "succeeded",
          redirect_url: "/success",
          application_id: result.insertId,
          simulated: true,
          message: "Local development mode - payment simulated",
        });
      }

      // Check if using Stripe Elements (embedded payment form)
      const stripePaymentMethodId = fields.stripe_payment_method_id;

      if (stripePaymentMethodId) {
        // STRIPE ELEMENTS FLOW: Create Payment Intent with provided payment method
        console.log("Using Stripe Elements flow with payment method:", stripePaymentMethodId);

        // Save application with pending status first
        const result = await insertFullApplication(validated.fields, photoPath, {
          paymentMethod: "card",
          paymentStatus: "pending",
        });

        const applicationId = result.insertId;

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: APPLICATION_FEE_CENTS,
          currency: "usd",
          payment_method: stripePaymentMethodId,
          confirmation_method: "manual",
          confirm: true, // Try to confirm immediately
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/success`,
          metadata: {
            application_id: applicationId.toString(),
            draft_token: draftToken,
          },
          description: "Rental Application Fee",
          receipt_email: validated.fields.email,
        });

        // Delete draft since we've saved the application
        await deleteApplyingDraft(draftToken);

        // Return appropriate response based on Payment Intent status
        if (paymentIntent.status === "requires_action" || paymentIntent.status === "requires_confirmation") {
          // 3D Secure or additional authentication needed
          return NextResponse.json({
            status: "requires_action",
            payment_intent_client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            application_id: applicationId,
          });
        } else if (paymentIntent.status === "succeeded") {
          // Payment succeeded immediately
          // Update application status to paid
          await query(
            `UPDATE frontend_applying
             SET payment_status = 'paid', stripe_payment_intent = ?
             WHERE id = ?`,
            [paymentIntent.id, applicationId]
          );

          await sendApplyingNotificationEmail(
            {
              ...validated.fields,
              property_name,
            },
            applicationId,
            "card",
            "paid",
            photoPath,
          );

          return NextResponse.json({
            status: "succeeded",
            redirect_url: "/success",
            application_id: applicationId,
            payment_intent_id: paymentIntent.id,
          });
        } else {
          // Other status (processing, requires_payment_method, etc.)
          return NextResponse.json({
            status: paymentIntent.status,
            payment_intent_client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            application_id: applicationId,
            message: `Payment status: ${paymentIntent.status}`,
          });
        }
      } else {
        // CHECKOUT SESSION FLOW: Redirect to Stripe Checkout
        // New webhook-based flow: Save application with pending status first
        const result = await insertFullApplication(validated.fields, photoPath, {
          paymentMethod: "card",
          paymentStatus: "pending",
        });

        const applicationId = result.insertId;

        // Create Stripe Checkout Session
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Rental Application Fee",
                  description: "Application fee for property rental",
                },
                unit_amount: APPLICATION_FEE_CENTS,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/applying`,
          metadata: {
            application_id: applicationId.toString(),
            draft_token: draftToken,
          },
          customer_email: validated.fields.email,
        });

        // Delete draft since we've saved the application
        await deleteApplyingDraft(draftToken);

        return NextResponse.json({
          status: "checkout_redirect",
          redirect_url: checkoutSession.url,
          application_id: applicationId,
        });
      }
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
