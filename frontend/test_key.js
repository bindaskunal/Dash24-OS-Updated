// @ts-nocheck
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Load .env manually
const envPath = 'c:\\Users\\binda\\Documents\\Kuch to kar hi lenge\\Dash24 Web App\\Github_Dash24-webApp\\frontend\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const keys = [
  envVars['GEMINI_API_KEY_PRIMARY'],
  envVars['GEMINI_API_KEY_SECONDARY']
].filter(Boolean);

console.log(`Found ${keys.length} keys to test.`);

async function testKey(key, name) {
  try {
    console.log(`Testing ${name}...`);
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say Hello',
      config: { responseMimeType: "application/json" }
    });
    console.log(`${name} SUCCESS:`, response.text);
    return true;
  } catch (e) {
    console.error(`${name} FAILED:`, e.message);
    return false;
  }
}

async function run() {
  for (let i = 0; i < keys.length; i++) {
     await testKey(keys[i], i === 0 ? "PRIMARY" : "SECONDARY");
  }
}

run();
