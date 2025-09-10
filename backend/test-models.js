// node >=18 (has global fetch). If <18, npm i node-fetch and import it.
import 'dotenv/config';

async function listGeminiModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();

  console.log('✅ Gemini: Connected successfully');
  console.log('📝 Available Gemini Models:');
  for (const m of data.models ?? []) {
    console.log(`- Model Name: ${m.name}`);
    console.log(`  Description: ${m.description ?? ''}`);
    console.log(`  Supported Methods: ${(m.supportedGenerationMethods ?? []).join(', ')}`);
    console.log('-----------------------------------');
  }
}

listGeminiModels().catch(err => {
  console.error('❌ Gemini: Connection failed', err.message);
});
