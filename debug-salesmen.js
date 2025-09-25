const fetch = require('node-fetch');

const RAILWAY_API_URL = 'https://household-services-platform-production.up.railway.app/api';

async function debugSalesmen() {
  try {
    // This is a debug script to test the salesmen endpoints
    console.log('🔍 Debugging Salesmen API Issues...\n');

    console.log('1. Testing debug endpoint...');
    const debugResponse = await fetch(`${RAILWAY_API_URL}/admin/salesmen/debug`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with actual admin token
        'Content-Type': 'application/json'
      }
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug data:', JSON.stringify(debugData, null, 2));
    } else {
      console.log('Debug endpoint failed:', debugResponse.status, debugResponse.statusText);
    }

    console.log('\n2. Testing sync endpoint...');
    const syncResponse = await fetch(`${RAILWAY_API_URL}/admin/salesmen/sync`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with actual admin token
        'Content-Type': 'application/json'
      }
    });

    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('Sync result:', JSON.stringify(syncData, null, 2));
    } else {
      console.log('Sync endpoint failed:', syncResponse.status, syncResponse.statusText);
    }

    console.log('\n3. Testing main salesmen endpoint...');
    const salesmenResponse = await fetch(`${RAILWAY_API_URL}/admin/salesmen`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Replace with actual admin token
        'Content-Type': 'application/json'
      }
    });

    if (salesmenResponse.ok) {
      const salesmenData = await salesmenResponse.json();
      console.log('Salesmen data:', JSON.stringify(salesmenData, null, 2));
    } else {
      console.log('Salesmen endpoint failed:', salesmenResponse.status, salesmenResponse.statusText);
    }

  } catch (error) {
    console.error('Debug script error:', error);
  }
}

// Run the debug script
debugSalesmen();