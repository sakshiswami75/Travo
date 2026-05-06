const axios = require('axios');

async function runTests() {
  const email = `test_flow_${Date.now()}@example.com`;
  const password = 'securePassword123';
  
  console.log('--- STARTING AUTH FLOW TESTS ---');

  try {
    // 1. Test Signup
    console.log(`\n[Test 1] Signup new user (${email})...`);
    const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Flow Tester',
      email: email,
      password: password,
      role: 'Driver'
    });
    console.log('✅ Signup Success. Token received:', !!signupRes.data.token);
    
    // 2. Test Duplicate Email
    console.log(`\n[Test 2] Testing duplicate email registration...`);
    try {
      await axios.post('http://localhost:5000/api/auth/signup', {
        name: 'Duplicate Guy',
        email: email, // same email
        password: 'anotherPassword',
        role: 'Citizen'
      });
      console.log('❌ Duplicate email test failed. Expected error, but signup succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message === 'User already exists') {
        console.log('✅ Duplicate email correctly rejected:', err.response.data.message);
      } else {
        console.log('❌ Duplicate email test failed with unexpected error:', err.response?.data);
      }
    }

    // 3. Test Invalid Credentials Login
    console.log(`\n[Test 3] Testing invalid credentials...`);
    try {
      await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: 'wrongPassword456'
      });
      console.log('❌ Invalid credentials test failed. Expected error, but login succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Invalid credentials correctly rejected:', err.response.data.message);
      } else {
        console.log('❌ Invalid credentials test failed with unexpected error:', err.response?.data);
      }
    }

    // 4. Test Valid Login
    console.log(`\n[Test 4] Testing valid login...`);
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: password
    });
    console.log('✅ Login Success. Token received:', !!loginRes.data.token);
    
    // 5. Test JWT Session Persistence (Protected Route)
    console.log(`\n[Test 5] Testing protected route (/api/auth/me) with token...`);
    const token = loginRes.data.token;
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Protected route accessed successfully. User: ${meRes.data.name}, Role: ${meRes.data.role}`);

  } catch (error) {
    console.error('Fatal Error during tests:', error.response ? error.response.data : error.message);
  }
}

runTests();
