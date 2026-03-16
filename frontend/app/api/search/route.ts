import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load catalog directly. Path is relative to this file.
import enrichedCatalog from '../../../data/enriched_catalog.json';

// Cache interface updated for the Katzen Persona structure
interface CacheEntry {
    matchedProductIds: string[];
    focusItemId: string | null;
    carouselItemIds: string[];
    aiReasoning: string;
    suggestedCategory: string;
}

const memoryCache: Record<string, CacheEntry> = {};

export async function POST(req: Request) {
    const keys = [
        process.env.GEMINI_API_KEY_PRIMARY,
        process.env.GEMINI_API_KEY_SECONDARY,
        process.env.GEMINI_API_KEY,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
        return NextResponse.json(
            { error: "Gemini API key is missing. Please configure GEMINI_API_KEY_PRIMARY in Vercel." },
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
            item.brand?.toLowerCase().includes(normalizedQuery) ||
            item.category.toLowerCase().includes(normalizedQuery)
        );

        if (normalizedQuery.length >= 3 && exactMatches.length > 0) {
            const matchedProductIds = exactMatches.map((item: any) => item.id).slice(0, 5);
            const focusItemId = matchedProductIds.length > 0 ? matchedProductIds[0] : null;
            const carouselItemIds = matchedProductIds.slice(1);

            return NextResponse.json({
                matchedProductIds,
                focusItemId,
                carouselItemIds,
                aiReasoning: `I found these items ready for 60-minute delivery to your Prestige Whitefield node.`,
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
        // TIER 3: Semantic AI Search (Katzen Persona / Gemini 2.5 Flash)
        // -------------------------------------------------------------------
        console.log("Katzen AI Search triggered for:", normalizedQuery);

        const slimCatalog = enrichedCatalog.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            brand: item.brand,
            tags: item.ai_intent_layers ? Object.values(item.ai_intent_layers).join(" ") : ""
        }));

        const prompt = `You are 'Katzen', the proactive, highly intelligent AI concierge for Dash24.
The user searched for: "${query}".
Your brand voice is Agentic, sharp, and helpful. 

INSTRUCTIONS:
1. Analyze the user's intent based on the query. Are they hungry? Late? Preparing for a workout? 
2. If they say "bhook lagi hai" or indicate hunger, strictly prioritize high-satisfaction food, snacks, or ready-to-eat meals. DO NOT return non-food items (like shampoo or face wash).
3. Draft a concise, proactive 'conciergeMessage' acknowledging their status and confirming lightning-fast delivery to Prestige Whitefield.
4. Select ONE primary product ID as the 'focusItemId' (the absolute best match).
5. Select up to 4 alternative product IDs for the 'carouselItemIds'.

CATALOG:
${JSON.stringify(slimCatalog)}

Return ONLY a raw JSON object matching this exact structure. No markdown, no explanations, no code blocks:
{
  "conciergeMessage": "Your agentic message addressing their state and Prestige Whitefield delivery...",
  "focusItemId": "ID_OF_BEST_MATCH",
  "carouselItemIds": ["ID_ALT_1", "ID_ALT_2", "ID_ALT_3"]
}`;

        let resultText = "";
        let lastError = null;

        for (const key of keys) {
            try {
                const ai = new GoogleGenerativeAI(key as string);
                const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
                const response = await model.generateContent(prompt);
                resultText = response.response.text();
                if (resultText) break;
            } catch (e: any) {
                lastError = e;
                console.error(`Gemini API Crash (Key: ${key?.substring(0, 5)}...):`, e.message || e);
            }
        }

        if (!resultText) {
             console.error("All AI attempts failed. Last error was:", lastError);
             return NextResponse.json({ 
                 matchedProductIds: [], 
                 focusItemId: null,
                 carouselItemIds: [],
                 aiReasoning: "✨ AI Service temporarily unavailable. Please browse our categories.", 
                 suggestedCategory: "General" 
             });
        }

        let parsedData = { conciergeMessage: "", focusItemId: "", carouselItemIds: [] as string[] };
        try {
            // FIX: Safely building the markdown marker without using 3 consecutive backticks
            const markdownMarker = '`' + '`' + '`';
            const cleaned = resultText
                .replace(new RegExp(markdownMarker + '(?:json)?', 'g'), '')
                .replace(new RegExp(markdownMarker, 'g'), '')
                .trim();
            
            parsedData = JSON.parse(cleaned);
        } catch(e) {
            console.error("Failed to parse Katzen JSON:", resultText);
        }

        const focusItemId = parsedData.focusItemId || null;
        const carouselItemIds = Array.isArray(parsedData.carouselItemIds) ? parsedData.carouselItemIds : [];
        const matchedProductIds = [focusItemId, ...carouselItemIds].filter(Boolean) as string[];

        const matchedItems = enrichedCatalog.filter((c: any) => matchedProductIds.includes(c.id));

        memoryCache[normalizedQuery] = {
            matchedProductIds: matchedProductIds,
            focusItemId: focusItemId,
            carouselItemIds: carouselItemIds,
            aiReasoning: parsedData.conciergeMessage || `✨ Powered by Katzen: Curated selection for your request.`,
            suggestedCategory: matchedItems.length > 0 ? matchedItems[0].category : "General"
        };

        return NextResponse.json(memoryCache[normalizedQuery]);

    } catch (error: any) {
        console.error("Fatal Search API Error:", error);
        return NextResponse.json({
            matchedProductIds: [],
            focusItemId: null,
            carouselItemIds: [],
            aiReasoning: "✨ Search Error. No results found.",
            suggestedCategory: "General"
        }, { status: 200 });
    }
}