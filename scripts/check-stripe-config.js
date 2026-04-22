// Simple script to check Stripe configuration
console.log('=== Checking Stripe Configuration ===\n');

// Read .env.local file
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('1. Environment Variables from .env.local:');
  
  const lines = envContent.split('\n');
  let stripeKey = '';
  let webhookSecret = '';
  let publicKey = '';
  
  for (const line of lines) {
    if (line.startsWith('STRIPE_SECRET_KEY=')) {
      stripeKey = line.split('=')[1];
      console.log(`   STRIPE_SECRET_KEY: ${stripeKey ? '✓ Set' : '✗ Missing'}`);
      if (stripeKey) {
        console.log(`   Key starts with: ${stripeKey.substring(0, 15)}...`);
        console.log(`   Mode: ${stripeKey.includes('sk_test') ? 'Test' : stripeKey.includes('sk_live') ? 'Live' : 'Unknown'}`);
      }
    }
    if (line.startsWith('STRIPE_WEBHOOK_SECRET=')) {
      webhookSecret = line.split('=')[1];
      console.log(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✓ Set' : '✗ Missing'}`);
      if (webhookSecret) {
        console.log(`   Secret starts with: ${webhookSecret.substring(0, 10)}...`);
      }
    }
    if (line.startsWith('NEXT_PUBLIC_STRIPE_PUBLIC_KEY=')) {
      publicKey = line.split('=')[1];
      console.log(`   NEXT_PUBLIC_STRIPE_PUBLIC_KEY: ${publicKey ? '✓ Set' : '✗ Missing'}`);
    }
  }
  
  console.log('\n2. Current Issues:');
  if (!stripeKey) {
    console.log('   ❌ STRIPE_SECRET_KEY is missing');
  } else if (stripeKey.includes('sk_test')) {
    console.log('   ℹ️  Using TEST mode Stripe key (correct for development)');
  }
  
  if (!webhookSecret) {
    console.log('   ❌ STRIPE_WEBHOOK_SECRET is missing');
  } else if (webhookSecret === 'whsec_00000000000000000000000000000000' || webhookSecret.length < 20) {
    console.log('   ⚠️  Webhook secret appears to be a placeholder');
  } else {
    console.log('   ✓ Webhook secret looks valid');
  }
  
  console.log('\n3. Local Testing Solution:');
  console.log('   a) Install Stripe CLI: npm install -g stripe-cli');
  console.log('   b) Run: stripe login');
  console.log('   c) Run: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   d) Copy the webhook secret and update .env.local');
  console.log('   e) Use test card: 4242 4242 4242 4242');
  
  console.log('\n4. Test Card Details:');
  console.log('   Card: 4242 4242 4242 4242');
  console.log('   CVC: 123');
  console.log('   Expiry: 12/34');
  console.log('   ZIP: 12345');
  
  console.log('\n5. Quick Fix for Local Testing:');
  console.log('   Option A: Use Stripe CLI (recommended)');
  console.log('   Option B: Add environment variable to bypass webhook:');
  console.log('     Add to .env.local:');
  console.log('     STRIPE_SKIP_WEBHOOK=true');
  console.log('     (Then modify code to handle this)');
  
} catch (error) {
  console.log(`Error reading .env.local: ${error.message}`);
  console.log('\nChecking process.env directly:');
  console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set'}`);
  console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set'}`);
}

console.log('\n=== Configuration Check Complete ===');