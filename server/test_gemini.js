require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log('API Key starts with:', process.env.GEMINI_API_KEY?.slice(0, 10));
  console.log('Model:', process.env.GEMINI_MODEL);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
    const res = await model.generateContent('Return only JSON: {"summary": "test success"}');
    console.log('SUCCESS:', res.response.text());
  } catch (err) {
    console.error('FAIL status:', err.status);
    console.error('FAIL message:', err.message);
  }
}
test();
