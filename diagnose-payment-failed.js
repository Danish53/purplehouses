// Diagnostic script for "Payment failed" errors
console.log('=== Diagnosing "Payment failed" Error ===\n');

// Check 1: Environment variables
console.log('1. Checking Stripe Configuration:');
const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (stripeKey) {
  console.log('   ✅ STRIPE_SECRET_KEY is configured');
  console.log(`   Key starts with: ${stripeKey.substring(0, 10)}...`);
  
  // Check if it's a test key
  if (stripeKey.includes('sk_test')) {
    console.log('   ℹ️  Using TEST mode Stripe key');
  } else if (stripeKey.includes('sk_live')) {
    console.log('   ℹ️  Using LIVE mode Stripe key');
  }
} else {
  console.log('   ❌ STRIPE_SECRET_KEY is NOT configured');
  console.log('   ⚠️  Payments will fail or use development fallback');
}

if (webhookSecret) {
  console.log('   ✅ STRIPE_WEBHOOK_SECRET is configured');
} else {
  console.log('   ❌ STRIPE_WEBHOOK_SECRET is NOT configured');
  console.log('   ⚠️  Webhook signature verification will fail');
}

// Check 2: Server logs analysis
console.log('\n2. Server Log Analysis:');
console.log('   Check your server console for these logs when payment fails:');
console.log('   a) "Received Stripe event: payment_intent.payment_failed"');
console.log('   b) "handlePaymentIntentFailed called for:"');
console.log('   c) "Updating application X to failed status"');
console.log('\n   If you see these logs → Webhook IS working');
console.log('   If you DON\'T see these logs → Webhook NOT being called');

// Check 3: Common causes of payment failure
console.log('\n3. Common Causes of "Payment failed":');
console.log('   a) Card declined by bank');
console.log('   b) Insufficient funds');
console.log('   c) Invalid card details (expired, wrong CVC)');
console.log('   d) 3D Secure authentication failed');
console.log('   e) Stripe test mode with failing test card');

// Check 4: Test card to use
console.log('\n4. Test Card for Development:');
console.log('   Card: 4242 4242 4242 4242');
console.log('   CVC: 123');
console.log('   Expiry: 12/34');
console.log('   ZIP: 12345');
console.log('   This card ALWAYS succeeds in test mode');

// Check 5: Webhook configuration
console.log('\n5. Webhook Configuration Check:');
console.log('   a) Go to: https://dashboard.stripe.com/test/webhooks');
console.log('   b) Check if endpoint is configured:');
console.log('      URL: http://localhost:3000/api/stripe/webhook');
console.log('   c) Events should include:');
console.log('      - payment_intent.succeeded');
console.log('      - payment_intent.payment_failed');
console.log('      - checkout.session.completed');

// Check 6: Debug steps
console.log('\n6. Debug Steps:');
console.log('   Step 1: Use Stripe CLI to test webhook:');
console.log('     stripe listen --forward-to localhost:3000/api/stripe/webhook');
console.log('     stripe trigger payment_intent.payment_failed');
console.log('\n   Step 2: Check database status:');
console.log('     SELECT id, payment_status, stripe_payment_intent FROM frontend_applying ORDER BY id DESC LIMIT 5;');
console.log('\n   Step 3: Check Stripe Dashboard:');
console.log('     https://dashboard.stripe.com/test/payments');
console.log('     Look for failed payments and error messages');

// Check 7: Immediate test
console.log('\n7. Immediate Test:');
console.log('   Run this command to test webhook endpoint:');
console.log('   curl -X POST http://localhost:3000/api/stripe/webhook \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -H "stripe-signature: t=123,v1=test" \\');
console.log('     -d \'{"type":"payment_intent.payment_failed","data":{"object":{"id":"pi_test","status":"requires_payment_method","metadata":{"application_id":"999"}}}}\'');

console.log('\n=== Summary ===');
if (!stripeKey) {
  console.log('❌ Stripe is NOT configured. Set STRIPE_SECRET_KEY in .env.local');
  console.log('   Payments will use development fallback (mark as paid).');
} else if (!webhookSecret) {
  console.log('⚠️  Webhook secret missing. Webhook signature verification will fail.');
  console.log('   Set STRIPE_WEBHOOK_SECRET in .env.local');
} else {
  console.log('✅ Stripe is configured. "Payment failed" is likely a real payment failure.');
  console.log('   Check server logs to see if webhook is being called.');
}

console.log('\nDebugging complete! 🐛');