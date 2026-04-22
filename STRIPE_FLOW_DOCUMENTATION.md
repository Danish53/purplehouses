# Stripe Payment Flow for Purple Housing

## Overview
This document describes the complete Stripe payment flow implemented for the rental application system. The flow follows these steps:

1. **Form Submit → DB (pending)**: User submits application form, application is saved with `payment_status = 'pending'`
2. **Payment → Stripe**: Stripe Checkout Session is created and user is redirected to Stripe
3. **Stripe Webhook → Success Event**: Stripe sends webhook event when payment succeeds
4. **DB Update → Paid**: Webhook handler updates application to `payment_status = 'paid'`
5. **Email Sent**: Notification emails are sent to admin and applicant

## Files Created/Modified

### 1. Webhook Endpoint
- `app/api/stripe/webhook/route.js` - Handles Stripe webhook events
  - Processes `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
  - Updates database and sends emails

### 2. Updated Applying Route
- `app/api/applying/route.js` - Modified to use new webhook-based flow
  - Saves application with `pending` status first
  - Creates Stripe Checkout Session
  - Returns redirect URL to Stripe

### 3. Updated Library Functions
- `lib/applyingApplication.js` - Enhanced to support stripe fields
  - Updated `insertFullApplication` to accept `stripePaymentIntent` and `stripeChargeId`
  - Updated SQL to include `stripe_payment_intent` and `stripe_charge_id` columns

### 4. Environment Configuration
- `.env.example` - Added Stripe configuration variables

## Database Schema
The existing `frontend_applying` table already has the required fields:
- `payment_status` (VARCHAR(10)) - Values: 'pending', 'paid', 'failed'
- `payment_method` (VARCHAR(20)) - Values: 'card', 'paypal', 'venmo'
- `stripe_payment_intent` (VARCHAR(100)) - Stripe Payment Intent ID
- `stripe_charge_id` (VARCHAR(100)) - Stripe Charge ID
- `amount` (DECIMAL(10,2)) - Application fee amount

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL (for webhooks and redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Setting Up Stripe Webhooks

1. **Create Stripe Account**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Get API Keys**: 
   - `STRIPE_SECRET_KEY` from Developers → API Keys
   - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` from Developers → API Keys
3. **Configure Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
   - Get `STRIPE_WEBHOOK_SECRET` from webhook details

## Flow Details

### Step 1: Form Submission
```
POST /api/applying
↓
Validate form data
↓
Save application to DB with status='pending'
↓
Create Stripe Checkout Session
↓
Return redirect URL to frontend
```

### Step 2: Payment Processing
```
Frontend redirects to Stripe Checkout
↓
User completes payment on Stripe
↓
Stripe processes payment
↓
Stripe sends webhook to /api/stripe/webhook
```

### Step 3: Webhook Handling
```
Stripe webhook received
↓
Verify signature using STRIPE_WEBHOOK_SECRET
↓
Handle event type:
  - checkout.session.completed: Update DB to 'paid'
  - payment_intent.succeeded: Update DB to 'paid'
  - payment_intent.payment_failed: Update DB to 'failed'
↓
Send email notifications
```

### Step 4: Success Page
```
User redirected to /success?session_id={CHECKOUT_SESSION_ID}
↓
Success page verifies payment status
↓
Shows confirmation message
```

## Testing the Flow

### Local Testing with Stripe CLI
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy webhook secret to `.env.local`
5. Use test card: `4242 4242 4242 4242`

### Test Cards
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Decline: `4000 0000 0000 0002`

## Error Handling

1. **Payment Failure**: Application remains in `pending` status, user can retry
2. **Webhook Failure**: Stripe retries webhooks, idempotent updates prevent duplicates
3. **Network Issues**: Success page polls for payment status if webhook is delayed

## Security Considerations

1. **Webhook Signatures**: All webhooks are verified using Stripe signature
2. **Idempotent Updates**: Database updates check `payment_status = 'pending'` to prevent duplicate processing
3. **Environment Separation**: Use test keys for development, live keys for production

## Migration from Old Flow

The old synchronous flow (immediate payment confirmation) has been replaced. The `finalize-stripe` route is now deprecated and commented out. All new payments use the webhook-based flow for better reliability.