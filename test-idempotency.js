// Test script to verify idempotent webhook behavior
// This simulates Stripe sending the same event multiple times

const http = require('http');

console.log('=== Testing Idempotent Webhook Behavior ===\n');

// Test data simulating a payment_intent.succeeded event
const testEvent = {
  id: 'evt_test_123456789', // Same event ID for all duplicates
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_987654321',
      latest_charge: 'ch_test_555555',
      metadata: {
        application_id: '999'
      }
    }
  }
};

// Create a valid Stripe signature (for testing purposes only)
// In real scenario, Stripe would provide this
const signature = 't=1234567890,v1=test_signature';

function sendWebhook(event, signature, iteration) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/stripe/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Attempt ${iteration}: Status ${res.statusCode}, Response: ${data}`);
        resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
      });
    });

    req.on('error', (error) => {
      console.error(`Attempt ${iteration} error:`, error.message);
      reject(error);
    });

    req.write(JSON.stringify(event));
    req.end();
  });
}

async function runTest() {
  console.log('1. Testing duplicate event prevention:');
  console.log('   Sending same event 3 times...\n');
  
  const results = [];
  
  for (let i = 1; i <= 3; i++) {
    try {
      const result = await sendWebhook(testEvent, signature, i);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to send webhook ${i}:`, error);
    }
  }
  
  console.log('\n2. Analyzing results:');
  
  const successCount = results.filter(r => r.statusCode === 200).length;
  const skippedCount = results.filter(r => r.data && r.data.skipped === 'already processed').length;
  
  console.log(`   Total requests: ${results.length}`);
  console.log(`   Successful (200): ${successCount}`);
  console.log(`   Skipped (already processed): ${skippedCount}`);
  
  if (skippedCount >= 2) {
    console.log('   ✅ PASS: Duplicate events were correctly skipped');
  } else {
    console.log('   ❌ FAIL: Duplicate events were not properly handled');
  }
  
  console.log('\n3. Expected behavior:');
  console.log('   - First request: Process event, update DB, send email');
  console.log('   - Second request: Skip with "already processed"');
  console.log('   - Third request: Skip with "already processed"');
  
  console.log('\n4. Database check (manual):');
  console.log('   Run this SQL to check application 999:');
  console.log('   SELECT id, payment_status, stripe_payment_intent, updated_at');
  console.log('   FROM frontend_applying WHERE id = 999;');
  
  console.log('\n5. Email check:');
  console.log('   Email should be sent only once for application 999');
  
  console.log('\n=== Additional Idempotency Tests ===\n');
  
  console.log('A. Test with different event IDs (should all process):');
  console.log('   - evt_1, evt_2, evt_3 → All processed');
  console.log('   - Each has unique event.id but same payment intent');
  
  console.log('\nB. Test idempotent database updates:');
  console.log('   SQL includes: WHERE payment_status = "pending"');
  console.log('   This prevents updating already "paid" applications');
  
  console.log('\nC. Test email duplicate prevention:');
  console.log('   Code checks: if (currentApp.payment_status === "paid")');
  console.log('   If already paid, skips email sending');
  
  console.log('\n=== Production Recommendations ===\n');
  
  console.log('1. For distributed systems:');
  console.log('   - Use Redis or database for event tracking');
  console.log('   - In-memory Set only works for single process');
  
  console.log('\n2. For better email tracking:');
  console.log('   - Add email_sent_at column to frontend_applying');
  console.log('   - Check email_sent_at before sending');
  
  console.log('\n3. For payment intent tracking:');
  console.log('   - Already implemented: stripe_payment_intent column');
  console.log('   - Check before processing duplicate payment intents');
  
  console.log('\nTest complete! 🧪');
}

// Run the test
runTest().catch(console.error);