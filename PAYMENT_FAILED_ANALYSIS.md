# Payment Failed Error Analysis

## Current Situation
You're getting "Payment failed" errors from Stripe when making card payments. Here's why:

## Root Cause Analysis

### 1. **Stripe IS Configured**
- ✅ `STRIPE_SECRET_KEY` is set in `.env.local`
- ✅ `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` is set
- ❌ `STRIPE_WEBHOOK_SECRET` is set to a placeholder value (`whsec_000...`)

### 2. **Why Payments Are Failing**
Since Stripe keys are configured, the system attempts real Stripe payments (not development fallback). When a payment fails at Stripe's end (card declined, insufficient funds, etc.), Stripe sends a `payment_intent.payment_failed` webhook event.

### 3. **Webhook Issue**
The webhook secret in `.env.local` is invalid (all zeros). This causes:
- Webhook signature verification to fail
- Stripe webhooks may not be properly configured in Stripe Dashboard
- Even if webhooks arrive, they might be rejected due to invalid signature

## Solution Steps

### Step 1: Fix Webhook Secret
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter: `http://localhost:3000/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Update `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YourActualSecretHere
   ```

### Step 2: Test with Valid Test Card
Use Stripe's test card that always succeeds:
- **Card:** `4242 4242 4242 4242`
- **CVC:** `123`
- **Expiry:** `12/34`
- **ZIP:** `12345`

### Step 3: Verify Webhook is Working
1. Install Stripe CLI: `npm install -g stripe-cli`
2. Test webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. In another terminal:
   ```bash
   stripe trigger payment_intent.payment_failed
   ```
4. Check server logs for:
   ```
   Received Stripe event: payment_intent.payment_failed
   handlePaymentIntentFailed called for: pi_...
   Updating application X to failed status
   ```

### Step 4: Check Database
```sql
SELECT id, payment_status, stripe_payment_intent 
FROM frontend_applying 
ORDER BY id DESC LIMIT 5;
```

## Expected Flow After Fix

1. **Form submit** → Application saved with `payment_status = 'pending'`
2. **Stripe Checkout** → User enters card details
3. **Payment succeeds** → Stripe sends `payment_intent.succeeded` webhook
4. **Webhook handler** → Updates DB to `payment_status = 'paid'`
5. **Email sent** → Notification email sent to admin

## If Payment Fails

1. Stripe sends `payment_intent.payment_failed` webhook
2. Webhook handler updates DB to `payment_status = 'failed'`
3. User sees "Payment failed" error in Stripe Checkout

## Quick Test
Run this command to test if webhook endpoint works:
```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=123,v1=test" \
  -d '{"type":"payment_intent.payment_failed","data":{"object":{"id":"pi_test","status":"requires_payment_method","metadata":{"application_id":"999"}}}}'
```

## Summary
The "Payment failed" error is coming from Stripe because:
1. Real Stripe payments are enabled (keys are configured)
2. The webhook secret needs to be updated
3. Test with card `4242 4242 4242 4242` for successful payments

Once webhook is properly configured, the flow will work correctly:
- Successful payments → DB updated to "paid" via webhook
- Failed payments → DB updated to "failed" via webhook
- You'll see logs in server console for all events