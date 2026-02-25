import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Load catalog directly. Path is relative to this file (frontend/app/api/search/route.ts).
import enrichedCatalog from '../../../data/enriched_catalog.json';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Simple in-memory cache object (cleared on server restart)
const memoryCache: Record<string, { matchedProductIds: string[], aiReasoning: string, suggestedCategory: string }> = {};

export async function POST(req: Request) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "Gemini API key is missing. Please configure NEXT_PUBLIC_GEMINI_API_KEY in your .env file." },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const normalizedQuery = query.toLowerCase().trim();

        // -------------------------------------------------------------------
        // TIER 1: Exact Local Match (Zero Latency)
        // -------------------------------------------------------------------
        const exactMatches = enrichedCatalog.filter((item: any) =>
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.brand.toLowerCase().includes(normalizedQuery) ||
            item.category.toLowerCase().includes(normalizedQuery)
        );

        // If we found a direct name/brand match, return instantly without hitting LLM
        // (We require at least a 3-letter query to avoid returning everything on "a", etc)
        if (normalizedQuery.length >= 3 && exactMatches.length > 0) {
            const matchedProductIds = exactMatches.map((item: any) => item.id).slice(0, 8);
            return NextResponse.json({
                matchedProductIds,
                aiReasoning: `I found these Dash24 products matching "${query}" ready for 60-minute local delivery.`,
                suggestedCategory: exactMatches[0].category || "General"
            });
        }

        // -------------------------------------------------------------------
        // TIER 2: Memory Cache Match (Zero Latency)
        // -------------------------------------------------------------------
        if (memoryCache[normalizedQuery]) {
            console.log("Memory Cache Hit for:", normalizedQuery);
            return NextResponse.json(memoryCache[normalizedQuery]);
        }

        // -------------------------------------------------------------------
        // TIER 3: Mock AI Mode (Bypassing Gemini for UI Testing)
        // -------------------------------------------------------------------
        // The user requested a pause on Gemini API usage for UI testing.
        console.log("Mock AI Mode triggered for:", normalizedQuery);

        // Simple local keyword search including intent layers
        const mockMatches = enrichedCatalog.filter((item: any) => {
            const searchObj = JSON.stringify(item).toLowerCase();
            return searchObj.includes(normalizedQuery.split(' ')[0]); // Very basic keyword match
        });

        const matchedProductIds = mockMatches.map((item: any) => item.id).slice(0, 8);

        memoryCache[normalizedQuery] = {
            matchedProductIds: matchedProductIds,
            aiReasoning: "✨ UI Test Mode: AI Intelligence Paused. Exhibiting local keyword match results.",
            suggestedCategory: mockMatches.length > 0 ? mockMatches[0].category : "General"
        };

        return NextResponse.json(memoryCache[normalizedQuery]);

    } catch (error: any) {
        console.error("Mock Search API Error:", error);
        return NextResponse.json({
            matchedProductIds: [],
            aiReasoning: "✨ UI Test Mode: AI Intelligence Paused. No results found.",
            suggestedCategory: "General"
        }, { status: 200 });
    }
}
