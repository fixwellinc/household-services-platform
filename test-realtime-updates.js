// Test script for real-time customer dashboard updates
// Run this with: node test-realtime-updates.js

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';
const TEST_USER_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token

async function testRealtimeUpdates() {
  console.log('🧪 Testing Real-time Customer Dashboard Updates\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_USER_TOKEN}`
  };

  try {
    // Test 1: Track service usage
    console.log('1️⃣ Testing service usage tracking...');
    const usageResponse = await fetch(`${API_BASE}/customer/track-usage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        serviceType: 'priority_booking',
        subscriptionTier: 'HOMECARE'
      })
    });
    
    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      console.log('✅ Service usage tracked:', usageData.data);
    } else {
      console.log('❌ Service usage tracking failed:', await usageResponse.text());
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Track discount usage
    console.log('\n2️⃣ Testing discount usage tracking...');
    const discountResponse = await fetch(`${API_BASE}/customer/track-discount`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        discountAmount: 75,
        subscriptionTier: 'HOMECARE'
      })
    });
    
    if (discountResponse.ok) {
      const discountData = await discountResponse.json();
      console.log('✅ Discount usage tracked:', discountData.data);
    } else {
      console.log('❌ Discount usage tracking failed:', await discountResponse.text());
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Simulate subscription update
    console.log('\n3️⃣ Testing subscription status update...');
    const subscriptionResponse = await fetch(`${API_BASE}/customer/simulate-subscription-update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        status: 'ACTIVE',
        tier: 'PRIORITY',
        message: 'Your subscription has been upgraded to Priority!'
      })
    });
    
    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      console.log('✅ Subscription update simulated:', subscriptionData.data);
    } else {
      console.log('❌ Subscription update simulation failed:', await subscriptionResponse.text());
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Simulate billing event
    console.log('\n4️⃣ Testing billing event...');
    const billingResponse = await fetch(`${API_BASE}/customer/simulate-billing-event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'PAYMENT_SUCCESS',
        amount: 99,
        message: 'Your Priority plan payment has been processed successfully!'
      })
    });
    
    if (billingResponse.ok) {
      const billingData = await billingResponse.json();
      console.log('✅ Billing event simulated:', billingData.data);
    } else {
      console.log('❌ Billing event simulation failed:', await billingResponse.text());
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Run full usage simulation
    console.log('\n5️⃣ Testing full usage simulation...');
    const simulationResponse = await fetch(`${API_BASE}/customer/simulate-usage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subscriptionTier: 'HOMECARE'
      })
    });
    
    if (simulationResponse.ok) {
      const simulationData = await simulationResponse.json();
      console.log('✅ Usage simulation started:', simulationData.data);
    } else {
      console.log('❌ Usage simulation failed:', await simulationResponse.text());
    }

    console.log('\n🎉 Real-time update tests completed!');
    console.log('\n📝 To see the real-time updates:');
    console.log('1. Open the customer dashboard in your browser');
    console.log('2. Make sure you\'re logged in with the test user');
    console.log('3. Watch for real-time notifications and usage updates');
    console.log('4. Check the connection status indicator in the header');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions for manual testing
console.log('📋 Manual Testing Instructions:');
console.log('1. Update TEST_USER_TOKEN with a valid JWT token');
console.log('2. Make sure the server is running on localhost:3000');
console.log('3. Open the customer dashboard in a browser');
console.log('4. Run this script to trigger real-time updates');
console.log('5. Watch the dashboard for live updates\n');

// Uncomment the line below to run the tests
// testRealtimeUpdates();

export { testRealtimeUpdates };