import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import products from '../../../data/enriched_catalog.json';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, lastOrderContext } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key is missing. Please configure GEMINI_API_KEY in your .env file." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const availableProducts = products.map((p: any) => p.name);

        const systemPrompt = `You are the Dash24 Quick Commerce AI. You MUST select 1 to 3 relevant products strictly from this list: ${JSON.stringify(availableProducts)}. Do not hallucinate products or recommend any product not on this list.

If the user is comparing products (e.g. "Minimalist vitamin C vs Mamaearth"), you must use our catalog data (for price, etc.) AND your own LLM knowledge (for skin type, ingredients, use-case) to build a comparison matrix.

You must ALWAYS return a JSON object with this exact schema: 
{ 
  "isComparison": boolean,
  "globalHook": "One punchy intro sentence.", 
  "comparisonData": {
    "features": ["Price", "Key Ingredient", "Skin Type", "Best For"],
    "products": [
      {
        "name": "Product A Name",
        "values": ["₹699", "10% Vitamin C", "All Types", "Potent glow"]
      }
    ]
  } | null,
  "recommendations": [ 
    { "productName": "Exact Name from Catalog", "reason": "Short reason" } 
  ] 
}
(Note: isComparison and comparisonData should be null or false for standard non-comparison queries).
If the user asks for something we don't carry, recommend the closest proxy from the available products list and explain the pivot in the globalHook.
Do not wrap it in markdown code blocks (\`\`\`json). Do not include any conversational text outside the JSON.`;

        const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}\n\nContext:\n${lastOrderContext || 'None'}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // Parse the response to ensure it's valid JSON before sending it to the frontend
        let jsonResponse;
        let rawText = response.text || "{}";

        // Strip out potential markdown code blocks like ```json ... ```
        rawText = rawText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();

        try {
            jsonResponse = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", rawText);
            jsonResponse = { globalHook: rawText, recommendations: [] };
        }

        return NextResponse.json({
            status: 'success',
            data: jsonResponse,
        });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json({
            status: 'error',
            error: error.message || error.toString()
        }, { status: 500 });
    }
}
