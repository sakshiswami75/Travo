const axios = require('axios');

async function testApi() {
  const email = `api${Date.now()}@example.com`;
  
  try {
    console.log('Testing Signup API...');
    const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'API Test User',
      email: email,
      password: 'password123',
      role: 'Citizen'
    });
    
    console.log('Signup Response:', signupRes.data);
    
    console.log('Testing Login API...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: 'password123'
    });
    
    console.log('Login Response:', loginRes.data);
    
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
  }
}

testApi();
