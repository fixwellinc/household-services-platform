const crypto = require('crypto');

// Test webhook payload for payment_intent.succeeded
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2024-12-18.acacia',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_payment_intent',
      object: 'payment_intent',
      amount: 2199, // $21.99 in cents
      currency: 'usd',
      status: 'succeeded',
      customer: 'cus_test_customer',
      metadata: {
        subscription_id: 'sub_test_subscription',
        user_id: 'test_user_123'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
};

// Create a test signature (this won't be valid for real verification, but good for testing)
const payload = JSON.stringify(testPayload);
const timestamp = Math.floor(Date.now() / 1000);
const secret = 'whsec_test_secret';
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', secret)
  .update(signedPayload, 'utf8')
  .digest('hex');

console.log('Testing webhook endpoint...');
console.log('URL: https://roasted-key-production.up.railway.app/api/payments/webhook');
console.log('Event Type: payment_intent.succeeded');
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('\nTo test with curl:');
console.log(`curl -X POST https://roasted-key-production.up.railway.app/api/payments/webhook \\
  -H "Content-Type: application/json" \\
  -H "Stripe-Signature: t=${timestamp},v1=${signature}" \\
  -d '${payload}'`);

// You can also test with a simpler approach (without signature verification)
console.log('\nSimple test (without signature verification):');
console.log(`curl -X POST https://roasted-key-production.up.railway.app/api/payments/webhook \\
  -H "Content-Type: application/json" \\
  -d '${payload}'`); 