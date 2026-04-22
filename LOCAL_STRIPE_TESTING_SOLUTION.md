# Local Stripe Testing Solution

## Problem Analysis
You're experiencing payment failures with Stripe test card (4242) while testing locally. The main issues are:

1. **Webhook cannot reach localhost** - Stripe's servers cannot send webhooks to `localhost:3000`
2. **Payment flow depends on webhooks** - The application uses webhooks to update payment status
3. **No fallback for local testing** - When webhooks fail, payments remain "pending"

## Solution 1: Use Stripe CLI (Recommended)

### Step 1: Install Stripe CLI
```bash
# Windows (using PowerShell)
iwr -useb https://dl.stripe.com/stripe-cli.ps1 | iex

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### Step 2: Login and Forward Webhooks
```bash
# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Step 3: Update Webhook Secret
Copy the webhook secret displayed by Stripe CLI and update `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

### Step 4: Test Payment Flow
1. Start your Next.js dev server: `npm run dev`
2. Keep Stripe CLI running in a separate terminal
3. Make a test payment with card `4242 4242 4242 4242`
4. Watch Stripe CLI logs for webhook events

## Solution 2: Implement Local Testing Fallback

Add a development mode that doesn't depend on webhooks for local testing.

### Update `app/api/applying/route.js`:

Add this function near the top of the file (after imports):

```javascript
function isLocalDevelopment() {
  return process.env.NODE_ENV === 'development' && 
         (!process.env.STRIPE_WEBHOOK_SECRET || 
          process.env.STRIPE_WEBHOOK_SECRET.includes('test'));
}
```

Modify the card payment section (around line 70-140) to add local fallback:

```javascript
if (paymentMethod === "card") {
  const stripe = getStripe();
  
  // LOCAL DEVELOPMENT FALLBACK
  if (isLocalDevelopment() && !process.env.USE_REAL_STRIPE) {
    console.log("Local development: Using payment simulation");
    
    const result = await insertFullApplication(validated.fields, photoPath, {
      paymentMethod: "card",
      paymentStatus: "paid",
      stripePaymentIntent: "simulated_pi_" + Date.now(),
    });
    
    await deleteApplyingDraft(draftToken);
    await sendApplyingNotificationEmail(
      validated.fields,
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
    });
  }
  
  // Rest of existing Stripe code...
}
```

## Solution 3: Debug Current Payment Failures

### Check Database Status
Run this SQL query to see recent payments:
```sql
SELECT id, payment_status, stripe_payment_intent, created_at 
FROM frontend_applying 
ORDER BY id DESC LIMIT 10;
```

### Check Stripe Dashboard
Visit: https://dashboard.stripe.com/test/payments
Look for failed payments and check the error message.

### Common Test Card Errors
Use these test cards for different scenarios:
- `4242 4242 4242 4242` - Always succeeds
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 0069` - Expired card
- `4000 0000 0000 0127` - Incorrect CVC

## Solution 4: Immediate Fix for Webhook Issue

Create a temporary endpoint to manually trigger webhook processing:

### Create `scripts/manual-webhook-test.js`:
```javascript
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  try {
    // Create a test payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        application_id: '999',
        test: 'true'
      }
    });
    
    console.log('Created test payment intent:', paymentIntent.id);
    
    // Confirm with test card
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa',
    });
    
    console.log('Payment intent status:', confirmed.status);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWebhook();
```

## Quick Start for Testing

1. **Install Stripe CLI** (if not installed)
2. **Run in terminal 1:** `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. **Run in terminal 2:** `npm run dev`
4. **Make test payment** using card `4242 4242 4242 4242`
5. **Check logs** in both terminals for success/failure messages

## Verification Steps

After implementing solutions:

1. ✅ Payment with test card 4242 should succeed
2. ✅ Application status should update to "paid"
3. ✅ Success email should be sent
4. ✅ User should be redirected to /success page
5. ✅ Database should show payment_status = 'paid'

## Troubleshooting

### If payments still fail:
1. Check Stripe Dashboard for error details
2. Verify webhook endpoint is configured in Stripe Dashboard
3. Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
4. Check server logs for webhook processing errors

### If webhooks not reaching:
1. Use `stripe trigger payment_intent.succeeded` to test
2. Check if firewall/antivirus is blocking webhook connections
3. Try using ngrok for temporary public URL: `ngrok http 3000`

## Production Readiness

For production deployment:
1. Update to live Stripe keys
2. Configure production webhook endpoint (HTTPS required)
3. Set up proper webhook signing secret
4. Test with real small amount before going live