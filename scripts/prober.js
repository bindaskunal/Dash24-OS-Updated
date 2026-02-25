const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env if available
let envPath = path.join(__dirname, '..', '.env');
let manualKey = '';
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/GEMINI_API_KEY=(.*)/);
    if (match) manualKey = match[1].trim();
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || manualKey;
const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'data', 'catalog.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'frontend', 'data', 'enriched_catalog.json');

const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

function mockLlmResponse() {
    return {
        clarification: "Mock clarification intent",
        risk: "Mock risk intent",
        outcome: "Mock outcome intent",
        comparison: "Mock comparison intent",
        value: "Mock value intent",
        personalization: "Mock personalization intent"
    };
}

function queryGemini(prompt) {
    return new Promise((resolve, reject) => {
        if (!GEMINI_API_KEY) {
            console.log("GEMINI_API_KEY not found. Returning mock data.");
            return resolve(mockLlmResponse());
        }

        const data = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 400) {
                        console.log(`Error from Gemini (${res.statusCode}): ${body}`);
                        return resolve(mockLlmResponse());
                    }
                    const result = JSON.parse(body);
                    const responseText = result.candidates[0].content.parts[0].text;

                    let cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
                    resolve(JSON.parse(cleaned));
                } catch (e) {
                    console.log(`Failed to parse Gemini response: ${e}`);
                    resolve(mockLlmResponse());
                }
            });
        });

        req.on('error', (e) => {
            console.log(`Error querying Gemini: ${e}`);
            resolve(mockLlmResponse());
        });

        req.write(data);
        req.end();
    });
}

function generatePrompt(product) {
    return `Act as the Dash24 Lead Engineer. We are building a 'Conversational Decisioning' engine. 
Analyze the following product and generate 6 intent layers: Clarification, Risk, Outcome, Comparison, Value, and Personalization.

Product Name: ${product.name}
Brand: ${product.brand}
Price: ${product.price}

Respond strictly with ONLY a valid JSON object. Do not include markdown formatting or backticks around the json block. 
The JSON keys must be exactly: "clarification", "risk", "outcome", "comparison", "value", "personalization".

Ensure all responses feature the 'Dash24 Live Pulse' logic, emphasizing Bangalore delivery and strict genuine quality.`;
}

async function enrichCatalog() {
    console.log(`Reading catalog from ${INPUT_FILE}...`);
    let catalog;
    try {
        const data = fs.readFileSync(INPUT_FILE, 'utf8');
        catalog = JSON.parse(data);
    } catch (e) {
        console.log(`Failed to read input file: ${e}`);
        return;
    }

    const enrichedCatalog = [];

    console.log(`Processing ${catalog.length} products...`);
    for (let i = 0; i < catalog.length; i++) {
        const product = catalog[i];
        console.log(`[${i + 1}/${catalog.length}] Processing ${product.name}...`);

        const prompt = generatePrompt(product);
        const aiIntentLayers = await queryGemini(prompt);

        enrichedCatalog.push({
            ...product,
            ai_intent_layers: aiIntentLayers
        });

        // Simple sleep
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Writing enriched catalog to ${OUTPUT_FILE}...`);
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedCatalog, null, 2));
        console.log("Success! Enriched catalog saved.");
    } catch (e) {
        console.log(`Failed to write output file: ${e}`);
    }
}

enrichCatalog();
