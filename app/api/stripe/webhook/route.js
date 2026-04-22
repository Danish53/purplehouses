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
    console.warn("Stripe not configured");
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * Save webhook event (STRICT idempotency)
 */
async function saveEvent(event, object, status) {
  const applicationId = object?.metadata?.application_id
    ? parseInt(object.metadata.application_id)
    : null;

  try {
    await query(
      `INSERT INTO stripe_webhook_events 
       (id, event_type, stripe_object_id, application_id, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = status`,
      [
        event.id,
        event.type,
        object?.id,
        applicationId,
        status,
      ]
    );

    return true;
  } catch (err) {
    console.error("Webhook event save error:", err);
    return false;
  }
}

/**
 * CHECK duplicate processing
 */
async function alreadyProcessed(paymentIntentId) {
  const row = await queryOne(
    `SELECT id FROM frontend_applying 
     WHERE stripe_payment_intent = ? AND payment_status = 'paid'`,
    [paymentIntentId]
  );

  return !!row;
}

export async function POST(request) {
  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const object = event.data.object;

  // 🔥 SAVE EVENT FIRST (idempotent protection)
  await saveEvent(event, object, "received");

  try {
    switch (event.type) {

      // =========================
      // PAYMENT SUCCESS
      // =========================
      case "payment_intent.succeeded": {
        const paymentIntent = object;

        // 🔒 BLOCK duplicate processing
        if (await alreadyProcessed(paymentIntent.id)) {
          console.log("Already processed payment:", paymentIntent.id);
          return NextResponse.json({ ok: true });
        }

        const applicationId = paymentIntent.metadata?.application_id;
        const draftToken = paymentIntent.metadata?.draft_token;

        // =====================
        // EXISTING APPLICATION
        // =====================
        if (applicationId) {
          const app = await queryOne(
            `SELECT payment_status FROM frontend_applying WHERE id = ?`,
            [applicationId]
          );

          if (!app || app.payment_status === "paid") {
            return NextResponse.json({ ok: true });
          }

          const result = await query(
            `UPDATE frontend_applying
             SET payment_status = 'paid',
                 stripe_payment_intent = ?,
                 stripe_charge_id = ?
             WHERE id = ? AND payment_status = 'pending'`,
            [paymentIntent.id, paymentIntent.latest_charge, applicationId]
          );

          if (result.affectedRows > 0) {
            const [application] = await query(
              `SELECT * FROM frontend_applying WHERE id = ?`,
              [applicationId]
            );

            // 🚨 EMAIL ONLY ONCE
            await sendApplyingNotificationEmail(
              application,
              applicationId,
              "card",
              "paid",
              application.photo_id
            );
          }
        }

        // =====================
        // DRAFT FLOW
        // =====================
        else if (draftToken) {
          const draft = await loadApplyingDraft(draftToken);
          if (!draft) return;

          const exists = await queryOne(
            `SELECT id FROM frontend_applying WHERE stripe_payment_intent = ?`,
            [paymentIntent.id]
          );

          if (exists) return;

          const result = await insertFullApplication(
            draft.fields,
            draft.photoPath,
            {
              paymentMethod: "card",
              paymentStatus: "paid",
              stripePaymentIntent: paymentIntent.id,
              stripeChargeId: paymentIntent.latest_charge,
            }
          );

          await deleteApplyingDraft(draftToken);

          await sendApplyingNotificationEmail(
            draft.fields,
            result.insertId,
            "card",
            "paid",
            draft.photoPath
          );
        }

        break;
      }

      // =========================
      // PAYMENT FAILED
      // =========================
      case "payment_intent.payment_failed": {
        const paymentIntent = object;

        const applicationId = paymentIntent.metadata?.application_id;
        if (!applicationId) break;

        await query(
          `UPDATE frontend_applying
           SET payment_status = 'failed'
           WHERE id = ? AND payment_status = 'pending'`,
          [applicationId]
        );

        break;
      }

      // =========================
      // CHECKOUT
      // =========================
      case "checkout.session.completed": {
        const session = object;

        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent
        );

        const applicationId = session.metadata?.application_id;
        if (!applicationId) break;

        const app = await queryOne(
          `SELECT payment_status FROM frontend_applying WHERE id = ?`,
          [applicationId]
        );

        if (app?.payment_status === "paid") return;

        const result = await query(
          `UPDATE frontend_applying
           SET payment_status = 'paid',
               stripe_payment_intent = ?
           WHERE id = ? AND payment_status = 'pending'`,
          [paymentIntent.id, applicationId]
        );

        if (result.affectedRows > 0) {
          const [application] = await query(
            `SELECT * FROM frontend_applying WHERE id = ?`,
            [applicationId]
          );

          await sendApplyingNotificationEmail(
            application,
            applicationId,
            "card",
            "paid",
            application.photo_id
          );
        }

        break;
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}