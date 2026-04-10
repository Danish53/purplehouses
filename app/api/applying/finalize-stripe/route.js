import { NextResponse } from "next/server";
import Stripe from "stripe";
import { deleteApplyingDraft, loadApplyingDraft } from "@/lib/applyingDraft";
import {
  insertFullApplication,
  sendApplyingNotificationEmail,
} from "@/lib/applyingApplication";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const paymentIntentId = body.payment_intent_id;
    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json(
        { error: "payment_intent_id is required." },
        { status: 400 },
      );
    }

    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment is not complete yet." },
        { status: 400 },
      );
    }

    const draftToken = pi.metadata?.draft_token;
    if (!draftToken) {
      return NextResponse.json(
        { error: "This payment is not linked to an application draft." },
        { status: 400 },
      );
    }

    const draft = await loadApplyingDraft(draftToken);
    if (!draft?.fields || !draft.photoPath) {
      await deleteApplyingDraft(draftToken);
      return NextResponse.json(
        { error: "Application draft expired. Please contact support if you were charged." },
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
  } catch (error) {
    console.error("finalize-stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to finalize application." },
      { status: 500 },
    );
  }
}
