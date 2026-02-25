import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function GET() {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key is missing. Please configure NEXT_PUBLIC_GEMINI_API_KEY in your .env file." },
            { status: 500 }
        );
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("Are you online?");
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            status: 'success',
            model: 'gemini-2.5-flash',
            reply: text
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            model: 'gemini-2.5-flash',
            error: error.message || error.toString()
        }, { status: 500 });
    }
}
