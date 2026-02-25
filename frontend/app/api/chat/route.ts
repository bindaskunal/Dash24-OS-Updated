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

        const fullPrompt = `${prompt}\n\nContext:\n${lastOrderContext || ''}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        return NextResponse.json({
            status: 'success',
            reply: response.text,
        });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json({
            status: 'error',
            error: error.message || error.toString()
        }, { status: 500 });
    }
}
