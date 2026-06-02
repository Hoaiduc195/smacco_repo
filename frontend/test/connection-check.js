import axios from 'axios';

// A simple script to verify if the frontend can connect to the NestJS backend
const API_URL = 'http://localhost:3001/api/v1';

async function testConnection() {
  console.log('=== Checking Connection to NestJS Backend ===');
  console.log(`URL: ${API_URL}`);
  try {
    const start = Date.now();
    const response = await axios.get(`${API_URL}/health`);
    const duration = Date.now() - start;
    console.log('✅ Connection Successful!');
    console.log(`Status Code: ${response.status}`);
    console.log(`Response Time: ${duration}ms`);
    console.log('Response Body:', response.data);
  } catch (error) {
    console.error('❌ Connection Failed!');
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testConnection();
