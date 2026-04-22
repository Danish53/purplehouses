// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { deleteApplyingDraft, loadApplyingDraft } from "@/lib/applyingDraft";
// import {
//   insertFullApplication,
//   sendApplyingNotificationEmail,
// } from "@/lib/applyingApplication";

// function getStripe() {
//   if (!process.env.STRIPE_SECRET_KEY) {
//     throw new Error("Stripe is not configured.");
//   }
//   return new Stripe(process.env.STRIPE_SECRET_KEY);
// }

// export async function POST(request) {
//   try {
//     let body;
//     try {
//       body = await request.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
//     }

//     const paymentIntentId = body.payment_intent_id;
//     if (!paymentIntentId || typeof paymentIntentId !== "string") {
//       return NextResponse.json(
//         { error: "payment_intent_id is required." },
//         { status: 400 },
//       );
//     }

//     const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
//     if (pi.status !== "succeeded") {
//       return NextResponse.json(
//         { error: "Payment is not complete yet." },
//         { status: 400 },
//       );
//     }

//     const draftToken = pi.metadata?.draft_token;
//     if (!draftToken) {
//       return NextResponse.json(
//         { error: "This payment is not linked to an application draft." },
//         { status: 400 },
//       );
//     }

//     const draft = await loadApplyingDraft(draftToken);
//     if (!draft?.fields || !draft.photoPath) {
//       await deleteApplyingDraft(draftToken);
//       return NextResponse.json(
//         { error: "Application draft expired. Please contact support if you were charged." },
//         { status: 400 },
//       );
//     }

//     const result = await insertFullApplication(draft.fields, draft.photoPath, {
//       paymentMethod: "card",
//       paymentStatus: "paid",
//     });
//     await deleteApplyingDraft(draftToken);
//     await sendApplyingNotificationEmail(
//       draft.fields,
//       result.insertId,
//       "card",
//       "paid",
//       draft.photoPath,
//     );

//     return NextResponse.json({
//       status: "succeeded",
//       redirect_url: "/success",
//     });
//   } catch (error) {
//     console.error("finalize-stripe error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to finalize application." },
//       { status: 500 },
//     );
//   }
// }




import { NextResponse } from "next/server";
import Stripe from "stripe";
import { deleteApplyingDraft, loadApplyingDraft } from "@/lib/applyingDraft";
import {
  insertFullApplication,
  sendApplyingNotificationEmail,
} from "@/lib/applyingApplication";
import { query, queryOne } from "@/lib/db";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * Check if webhook has already processed this payment intent
 * Returns true if webhook has processed it, false otherwise
 */
async function isWebhookProcessed(paymentIntentId) {
  try {
    // Check stripe_webhook_events table
    const webhookEvent = await queryOne(
      `SELECT status FROM stripe_webhook_events
       WHERE stripe_object_id = ? AND event_type = 'payment_intent.succeeded'`,
      [paymentIntentId]
    );
    
    if (webhookEvent) {
      console.log(`Webhook already processed payment intent ${paymentIntentId} with status: ${webhookEvent.status}`);
      return true;
    }
    
    // Also check if application already exists with this payment intent
    const existingApp = await queryOne(
      `SELECT id FROM frontend_applying WHERE stripe_payment_intent = ?`,
      [paymentIntentId]
    );
    
    if (existingApp) {
      console.log(`Application already exists for payment intent ${paymentIntentId}: app ID ${existingApp.id}`);
      return true;
    }
    
    return false;
  } catch (error) {
    // If table doesn't exist yet, assume not processed
    console.warn(`Error checking webhook status: ${error.message}`);
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const paymentIntentId = body.payment_intent_id;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "payment_intent_id required" }, { status: 400 });
    }

    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded") {
      return NextResponse.json({ status: "pending" });
    }

    // ✅ NO DB INSERT HERE
    return NextResponse.json({
      status: "processing",
      message: "Handled by webhook",
      redirect_url: "/success",
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
