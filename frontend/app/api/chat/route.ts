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

        const systemPrompt = `You are a Quick Commerce AI. You must ALWAYS return a JSON object with this exact schema: 
{ 
  "insight": "3 lines max", 
  "recommendedProductNames": ["Exact Name 1"] 
}. 
If the user asks for something we don't carry (like gym equipment), recommend the closest proxy (like hydration or snacks) and explain the pivot in the insight.
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
