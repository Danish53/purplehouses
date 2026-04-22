// Test script for local Stripe integration
import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

console.log('=== Testing Local Stripe Configuration ===\n');

// Check environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

console.log('1. Environment Variables:');
console.log(`   STRIPE_SECRET_KEY: ${stripeKey ? '✓ Set' : '✗ Missing'}`);
if (stripeKey) {
  console.log(`   Mode: ${stripeKey.includes('sk_test') ? 'Test' : stripeKey.includes('sk_live') ? 'Live' : 'Unknown'}`);
}
console.log(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✓ Set' : '✗ Missing'}`);
console.log(`   NEXT_PUBLIC_STRIPE_PUBLIC_KEY: ${publicKey ? '✓ Set' : '✗ Missing'}`);

// Test Stripe API connection
async function testStripe() {
  if (stripeKey) {
    console.log('\n2. Testing Stripe API Connection:');
    try {
      const stripe = new Stripe(stripeKey);
      
      // Try to list a few payment intents
      const paymentIntents = await stripe.paymentIntents.list({ limit: 3 });
      console.log(`   ✓ API Connection Successful`);
      console.log(`   Found ${paymentIntents.data.length} payment intents`);
      
      // Check webhook endpoints
      console.log('\n3. Checking Webhook Endpoints:');
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
      const localEndpoint = endpoints.data.find(e =>
        e.url.includes('localhost:3000') || e.url.includes('127.0.0.1')
      );
      
      if (localEndpoint) {
        console.log(`   ✓ Local webhook endpoint found: ${localEndpoint.url}`);
        console.log(`   Status: ${localEndpoint.status}`);
        console.log(`   Events: ${localEndpoint.enabled_events.join(', ')}`);
      } else {
        console.log(`   ⚠️ No local webhook endpoint configured in Stripe`);
        console.log(`   You need to configure: http://localhost:3000/api/stripe/webhook`);
      }
      
    } catch (error) {
      console.log(`   ✗ API Connection Failed: ${error.message}`);
    }
  }

  console.log('\n4. Local Testing Recommendations:');
  console.log('   a) Install Stripe CLI: npm install -g stripe-cli');
  console.log('   b) Run: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   c) Use test card: 4242 4242 4242 4242');
  console.log('   d) Check logs for webhook events');

  console.log('\n5. Quick Test Card Details:');
  console.log('   Card: 4242 4242 4242 4242');
  console.log('   CVC: 123');
  console.log('   Expiry: 12/34');
  console.log('   ZIP: 12345');

  console.log('\n=== Test Complete ===');
}

testStripe().catch(console.error);