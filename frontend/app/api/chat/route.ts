import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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

        const systemPrompt = `You are Dash AI, an expert Quick Commerce shopping assistant. 
Your goal is to recommend products based on user queries and their order context. 
You MUST return ONLY a strictly valid JSON object. Do not wrap it in markdown code blocks (\`\`\`json). Do not include any conversational text outside the JSON.
The JSON must perfectly match this schema:
{
  "insight": "A maximum 3-to-5 line explanation of why these products fit the user's query. Keep it incredibly brief, punchy, and sales-oriented.",
  "recommendedProductNames": ["Exact Product Name 1", "Exact Product Name 2"]
}
`;

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
        const rawText = response.text || "{}";
        try {
            jsonResponse = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", rawText);
            jsonResponse = { insight: rawText, recommendedProductNames: [] };
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
