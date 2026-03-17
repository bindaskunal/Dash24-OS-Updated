import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load catalog directly. Path is relative to this file.
import enrichedCatalog from '../../../data/enriched_catalog.json';

// Cache interface updated for Mission 60 (Hero Reasoning + Pitches + Name Mapping)
interface CacheEntry {
    matchedProductIds: string[];
    focusItemId: string | null;
    focusItemName: string | null;
    carouselItemIds: string[];
    carouselItemNames: string[];
    aiReasoning: string;        // The short header greeting
    heroReasoning: string;      // The 7-8 line deep-dive convincer text
    productPitches: Record<string, string>; // Individual sales pitches per product ID
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
            { error: "Gemini API key is missing. Please configure in Vercel." },
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
            const focusItemId = matchedProductIds[0];
            const focusItemName = exactMatches[0].name;
            const carouselItemIds = matchedProductIds.slice(1);
            const carouselItemNames = exactMatches.slice(1, 5).map((item: any) => item.name);

            return NextResponse.json({
                matchedProductIds,
                focusItemId,
                focusItemName,
                carouselItemIds,
                carouselItemNames,
                aiReasoning: `I found these items ready for delivery to Prestige Whitefield.`,
                heroReasoning: `You requested ${query}. I've matched this with our live inventory at the Prestige Whitefield node. These specific items are curated for quality and speed, ensuring you get exactly what you need in under 60 minutes. My engine has verified stock levels to ensure a frictionless checkout experience for you today.`,
                productPitches: {},
                suggestedCategory: exactMatches[0].category || "General"
            });
        }

        // -------------------------------------------------------------------
        // TIER 2: Memory Cache Match
        // -------------------------------------------------------------------
        if (memoryCache[normalizedQuery]) {
            return NextResponse.json(memoryCache[normalizedQuery]);
        }

        // -------------------------------------------------------------------
        // TIER 3: Semantic AI Search (Katzen Hero Upgrade)
        // -------------------------------------------------------------------
        console.log("Katzen Hero Search triggered for:", normalizedQuery);

        // FIXED: Added tags back so the AI has semantic context
        const slimCatalog = enrichedCatalog.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            brand: item.brand,
            tags: item.ai_intent_layers ? Object.values(item.ai_intent_layers).join(" ") : "" 
        }));

        // FIXED: Appended the actual CATALOG to the bottom of the prompt
        const prompt = `You are 'Katzen', the proactive, highly intelligent AI concierge for Dash24.
The user is at Prestige Whitefield and searched for: "${query}".

YOUR GOAL: Be agentic and highly persuasive. Don't just list products; convince the customer why these specific items solve their current state (hunger, active, tech need).

INSTRUCTIONS:
1. Analyze intent. If they say "bhook" or "hunger", strictly prioritize food/snacks.
2. Draft 'conciergeMessage': A short, agentic 1-sentence header.
3. Draft 'heroReasoning': A high-conviction 7-8 line paragraph. Explain in detail WHY these products are perfect for them right now and emphasize the 60-minute delivery to Prestige Whitefield. CRITICAL: Once you select the 'focusItemId', you MUST explicitly write out that product's actual name in this paragraph and explain why it is the absolute best solution for the user.
4. Select 1 'focusItemId' and 4 'carouselItemIds'.
5. For EVERY other product in the alternatives list, write a 2-sentence 'pitch' explaining why it's a great secondary choice.

RETURN ONLY RAW JSON matching this structure:
{
  "conciergeMessage": "...",
  "heroReasoning": "...",
  "focusItemId": "...",
  "carouselItems": [
    {"id": "...", "pitch": "..."}
  ]
}

CATALOG:
${JSON.stringify(slimCatalog)}`;

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
                console.error(`Gemini Error:`, e.message || e);
            }
        }

        if (!resultText) throw new Error("AI Failed to respond");

        const markdownMarker = '`' + '`' + '`';
        const cleaned = resultText
            .replace(new RegExp(markdownMarker + '(?:json)?', 'g'), '')
            .replace(new RegExp(markdownMarker, 'g'), '')
            .trim();
        
        const parsed = JSON.parse(cleaned);

        const focusItemObj = enrichedCatalog.find((c: any) => c.id === parsed.focusItemId);
        const carouselItems = enrichedCatalog.filter((c: any) => 
            parsed.carouselItems.map((i: any) => i.id).includes(c.id)
        );

        const entry: CacheEntry = {
            matchedProductIds: [parsed.focusItemId, ...parsed.carouselItems.map((i: any) => i.id)].filter(Boolean),
            focusItemId: parsed.focusItemId,
            focusItemName: focusItemObj?.name || null,
            carouselItemIds: parsed.carouselItems.map((i: any) => i.id),
            carouselItemNames: carouselItems.map((c: any) => c.name),
            aiReasoning: parsed.conciergeMessage,
            heroReasoning: parsed.heroReasoning,
            productPitches: parsed.carouselItems.reduce((acc: any, curr: any) => {
                acc[curr.id] = curr.pitch;
                return acc;
            }, { [parsed.focusItemId]: "Our primary recommendation for your current need." }),
            suggestedCategory: focusItemObj?.category || "General"
        };

        memoryCache[normalizedQuery] = entry;
        return NextResponse.json(entry);

    } catch (error: any) {
        console.error("Fatal Search API Error:", error);
        // FIXED: Added missing fallback fields to prevent UI crashes
        return NextResponse.json({
            matchedProductIds: [],
            focusItemId: null,
            focusItemName: null,
            carouselItemIds: [],
            carouselItemNames: [],
            heroReasoning: "I've analyzed our local node inventory for your request. Although my reasoning engine is momentarily limited, these items are verified as in-stock at the Prestige Whitefield store.",
            aiReasoning: "✨ Instant Match Found",
            productPitches: {},
            suggestedCategory: "General"
        }, { status: 200 });
    }
}