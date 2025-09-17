// Simple script to create a test subscription for the current user
// Run this in the browser console while logged in

async function createTestSubscription() {
  try {
    console.log('Creating test subscription...');
    
    // First, select a plan
    const selectResponse = await fetch('/api/plans/user/select-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        tier: 'HOMECARE',
        billingCycle: 'monthly'
      })
    });
    
    const selectData = await selectResponse.json();
    console.log('Plan selection response:', selectData);
    
    if (!selectData.success) {
      throw new Error(selectData.error || 'Failed to select plan');
    }
    
    // Then activate the subscription
    const activateResponse = await fetch('/api/plans/user/activate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    const activateData = await activateResponse.json();
    console.log('Activation response:', activateData);
    
    if (!activateData.success) {
      throw new Error(activateData.error || 'Failed to activate subscription');
    }
    
    console.log('✅ Test subscription created successfully!');
    console.log('Subscription details:', activateData.subscription);
    
    // Refresh the page to see the changes
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  }
}

// Run the function
createTestSubscription();