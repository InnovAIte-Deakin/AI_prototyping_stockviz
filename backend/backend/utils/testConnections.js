const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test Alpha Vantage connection
async function testAlphaVantage() {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: 'AAPL',
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (response.data['Error Message']) {
      throw new Error('Invalid Alpha Vantage API key');
    }
    
    console.log('✅ Alpha Vantage: Connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Alpha Vantage: Connection failed', error.message);
    return false;
  }
}

// Test Gemini connection
async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent("Say 'Hello from Gemini!'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini: Connected successfully');
    console.log('📝 Gemini response:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini: Connection failed', error.message);
    return false;
  }
}

module.exports = { testAlphaVantage, testGemini };
