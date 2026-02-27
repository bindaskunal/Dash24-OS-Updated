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

RULE 1: Never apologize or say 'we do not carry' a brand. Confidently suggest the closest alternative from our catalog.

RULE 2: Write like a top-tier e-commerce conversion expert. Use sharp, structured formatting (bullet points, bold keywords). Maximize insight and provide detailed, LLM-style analysis.

RULE 3: If the user query implies a comparison (e.g., uses 'vs'), set \`isComparison: true\`. You MUST return exactly two products from the catalog. You MUST evaluate them across exactly 10 distinct, highly relevant variables (e.g., Specs, Build, Price, Delivery Speed, Use Case, etc.) formatted as strings in the \`specs\` array for each product so the frontend table can render them perfectly.

RULE 4: You MUST return strictly UNIQUE products. Never recommend the exact same product twice in your response.

You must ALWAYS return a JSON object with this exact schema: 
{ 
  "isComparison": boolean,
  "globalHook": "One punchy intro sentence.", 
  "comparisonData": {
    "features": ["String", "String", "String", "String", "String", "String", "String", "String", "String", "String"],
    "products": [
      {
        "name": "Product A Name",
        "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5", "Value 6", "Value 7", "Value 8", "Value 9", "Value 10"]
      },
      {
        "name": "Product B Name",
        "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5", "Value 6", "Value 7", "Value 8", "Value 9", "Value 10"]
      }
    ]
  } | null,
  "recommendations": [ 
    { "productName": "Exact Name from Catalog", "reason": "Short reason" } 
  ] 
}
(Note: isComparison and comparisonData should be null or false for standard non-comparison queries).
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
