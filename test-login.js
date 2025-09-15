import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@fixwell.ca',
        password: 'FixwellAdmin2024!'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
      
      // Test admin endpoint with token
      console.log('\nTesting admin endpoint...');
      const adminResponse = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const adminData = await adminResponse.json();
      
      if (adminResponse.ok) {
        console.log('✅ Admin endpoint working!');
        console.log('Stats:', adminData);
      } else {
        console.log('❌ Admin endpoint failed:', adminData);
      }
      
    } else {
      console.log('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();