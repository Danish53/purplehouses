import Link from "next/link";
import { query } from "@/lib/db";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

async function verifyPayment(searchParams) {
  const params = await searchParams;
  const applicationId = params?.application_id;
  const paymentIntent = params?.payment_intent;
  const token = params?.token;

  let message = null;
  let warning = null;

  // Check by application_id (Venmo/PayPal flow)
  if (applicationId) {
    const [app] = await query(
      "SELECT * FROM frontend_applying WHERE id = ? ORDER BY id DESC LIMIT 1",
      [applicationId],
    );
    if (app) {
      if (app.payment_status === "paid") {
        if (app.payment_method === "venmo") {
          message =
            "Your Venmo payment was confirmed and your application has been received.";
        } else if (app.payment_method === "paypal") {
          message =
            "Your PayPal payment was confirmed and your application has been received.";
        } else if (app.payment_method === "card") {
          message = "Your card payment has already been confirmed.";
        } else {
          message =
            "Your application payment was confirmed and your application has been received.";
        }
      } else {
        warning =
          "We received your application, but the payment is still pending.";
      }
    }
  }

  // Check by Stripe payment_intent
  if (paymentIntent && !message) {
    const [app] = await query(
      "SELECT * FROM frontend_applying WHERE stripe_payment_intent = ? ORDER BY id DESC LIMIT 1",
      [paymentIntent],
    );
    if (app) {
      if (app.payment_status === "paid") {
        message = "Your card payment has already been confirmed.";
      } else {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          const intent = await stripe.paymentIntents.retrieve(paymentIntent);
          if (intent.status === "succeeded") {
            await query(
              "UPDATE frontend_applying SET payment_status = ?, payment_method = ? WHERE id = ?",
              ["paid", "card", app.id],
            );
            message =
              "Your card payment was confirmed and your application has been received.";
          } else if (intent.status === "processing") {
            warning =
              "We received your application, and your card payment is still processing.";
          } else {
            warning =
              "We received your application, but we could not confirm the card payment automatically.";
          }
        } catch {
          warning =
            "We received your application, but we could not confirm the card payment automatically.";
        }
      }
    }
  }

  // Check by PayPal token
  if (token && !message) {
    const [app] = await query(
      "SELECT * FROM frontend_applying WHERE stripe_charge_id = ? ORDER BY id DESC LIMIT 1",
      [token],
    );
    if (app && app.payment_status === "paid") {
      message = "Your application fee has already been confirmed.";
    }
  }

  return { message, warning };
}

export default async function SuccessPage({ searchParams }) {
  const { message, warning } = await verifyPayment(searchParams);

  return (
    <div
      style={{
        background: "#f4f6f8",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "100px auto",
          background: "white",
          padding: "40px",
          textAlign: "center",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#43086b" }}>Payment Successful</h1>
        {message ? (
          <p style={{ color: "#2a5f37", fontWeight: 600 }}>{message}</p>
        ) : warning ? (
          <p style={{ color: "#8a5a00", fontWeight: 600 }}>{warning}</p>
        ) : (
          <p>Thank you, your payment was successfully charged.</p>
        )}
        <Link href="/" style={{ textDecoration: "none", color: "#43086b" }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
