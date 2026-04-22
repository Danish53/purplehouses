// Test if webhook endpoint is reachable
const http = require('http');

console.log('=== Testing Webhook Endpoint ===\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stripe/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': 'test-signature'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook endpoint is reachable');
      const response = JSON.parse(data);
      if (response.warning && response.warning.includes('Stripe not configured')) {
        console.log('⚠️  Stripe is not configured (expected since env vars are missing)');
        console.log('\n=== Solution ===');
        console.log('1. Create .env.local file with:');
        console.log('   STRIPE_SECRET_KEY=sk_test_...');
        console.log('   STRIPE_WEBHOOK_SECRET=whsec_...');
        console.log('   NEXT_PUBLIC_SITE_URL=http://localhost:3000');
        console.log('\n2. Restart the server');
      }
    } else {
      console.log('\n❌ Webhook endpoint returned error');
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  console.log('\n❌ Cannot connect to webhook endpoint');
  console.log('Make sure the server is running: npm run dev');
});

req.write(JSON.stringify({ test: 'data' }));
req.end();