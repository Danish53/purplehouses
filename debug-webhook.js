// Webhook Debugging Script
// Yeh script check karegi ke Stripe webhook sahi se configured hai

const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

console.log('=== Stripe Webhook Debugging ===\n');

// Check environment variables
console.log('1. Environment Variables Check:');
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET', 
  'NEXT_PUBLIC_SITE_URL'
];

let envOk = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  const exists = value && value.length > 0;
  console.log(`   ${exists ? '✅' : '❌'} ${varName}: ${exists ? 'Set' : 'Missing'}`);
  if (!exists) envOk = false;
}

// Check webhook file exists
console.log('\n2. Webhook Endpoint Check:');
const webhookPath = 'app/api/stripe/webhook/route.js';
if (fs.existsSync(webhookPath)) {
  console.log(`   ✅ Webhook file exists: ${webhookPath}`);
  
  const content = fs.readFileSync(webhookPath, 'utf8');
  const hasSignatureCheck = content.includes('stripe.webhooks.constructEvent');
  const hasFailedHandler = content.includes('payment_intent.payment_failed');
  const hasLogging = content.includes('console.log');
  
  console.log(`   ${hasSignatureCheck ? '✅' : '❌'} Signature verification`);
  console.log(`   ${hasFailedHandler ? '✅' : '❌'} payment_failed handler`);
  console.log(`   ${hasLogging ? '✅' : '❌'} Debug logging`);
} else {
  console.log(`   ❌ Webhook file missing: ${webhookPath}`);
}

// Check database connection
console.log('\n3. Database Schema Check:');
const schemaPath = 'prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const hasPaymentStatus = schema.includes('payment_status');
  const hasStripeFields = schema.includes('stripe_payment_intent');
  
  console.log(`   ${hasPaymentStatus ? '✅' : '❌'} payment_status field`);
  console.log(`   ${hasStripeFields ? '✅' : '❌'} stripe_payment_intent field`);
}

// Test webhook endpoint
console.log('\n4. Webhook Endpoint Test:');
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
console.log(`   Webhook URL: ${siteUrl}/api/stripe/webhook`);

// Manual test instructions
console.log('\n=== Manual Testing Instructions ===\n');
console.log('1. Start your Next.js server:');
console.log('   npm run dev\n');

console.log('2. Test with Stripe CLI:');
console.log('   stripe listen --forward-to localhost:3000/api/stripe/webhook');
console.log('   stripe trigger payment_intent.payment_failed\n');

console.log('3. Check server logs for:');
console.log('   "Received Stripe event: payment_intent.payment_failed"');
console.log('   "handlePaymentIntentFailed called for:"');
console.log('   "Updating application X to failed status"\n');

console.log('4. Check database:');
console.log('   SELECT id, payment_status FROM frontend_applying ORDER BY id DESC LIMIT 5;\n');

console.log('=== Common Solutions ===\n');
console.log('1. Agar webhook call nahi ho rahi:');
console.log('   - Stripe Dashboard → Webhooks → Re-configure endpoint');
console.log('   - STRIPE_WEBHOOK_SECRET regenerate karein\n');

console.log('2. Agar payment failed aa raha hai:');
console.log('   - Test card use karein: 4242 4242 4242 4242');
console.log('   - CVC: 123, Expiry: 12/34');
console.log('   - ZIP: 12345\n');

console.log('3. Agar database update nahi ho raha:');
console.log('   - Check application_id metadata in Stripe');
console.log('   - Check database connection\n');

console.log('Debugging complete! 🐛');