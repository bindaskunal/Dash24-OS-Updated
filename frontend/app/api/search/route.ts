import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import enrichedCatalog from '../../../data/enriched_catalog.json';

const memoryCache: Record<string, { matchedProductIds: string[], aiReasoning: string, suggestedCategory: string }> = {};

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

        // TIER 1: Exact Local Match
        const exactMatches = enrichedCatalog.filter((item: any) =>
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.brand.toLowerCase().includes(normalizedQuery) ||
            item.category.toLowerCase().includes(normalizedQuery)
        );

        if (normalizedQuery.length >= 3 && exactMatches.length > 0) {
            const matchedProductIds = exactMatches.map((item: any) => item.id).slice(0, 8);
            return NextResponse.json({
                matchedProductIds,
                aiReasoning: `I found these Dash24 products matching "${query}" ready for 60-minute local delivery.`,
                suggestedCategory: exactMatches[0].category || "General"
            });
        }

        // TIER 2: Memory Cache Match
        if (memoryCache[normalizedQuery]) {
            console.log("Memory Cache Hit for:", normalizedQuery);
            return NextResponse.json(memoryCache[normalizedQuery]);
        }

        // TIER 3: Semantic AI Search
        console.log("Semantic AI Search triggered for:", normalizedQuery);

        const slimCatalog = enrichedCatalog.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            brand: item.brand,
            tags: item.ai_intent_layers ? Object.values(item.ai_intent_layers).join(" ") : ""
        }));

        const prompt = `You are a semantic search engine. The user searched for: "${query}".
Return a JSON array of up to 8 product IDs from the catalog below that best match the query's intent. 
IMPORTANT: If the query is "bhook lagi hai" (I am hungry), return food items, snacks, or beverages. Do NOT return non-food items like shampoo, skincare, or face wash for hunger-related queries. Ensure strict semantic relevance based on user need.

CATALOG:
${JSON.stringify(slimCatalog)}

Return ONLY a raw JSON array of strings (the product IDs). No markdown, no explanations. Example: ["123", "456"]`;

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
             return NextResponse.json({ matchedProductIds: [], aiReasoning: "✨ AI Service unavailable. Relying on explicit matches.", suggestedCategory: "General" });
        }

        let matchedProductIds: string[] = [];
        try {
            const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            matchedProductIds = JSON.parse(cleaned);
        } catch(e) {
            console.error("Failed to parse Gemini semantic search response:", resultText);
        }

        const matchedItems = enrichedCatalog.filter((c: any) => matchedProductIds.includes(c.id));

        memoryCache[normalizedQuery] = {
            matchedProductIds: matchedProductIds,
            aiReasoning: `✨ Powered by Gemini: Displaying AI semantic results for "${query}".`,
            suggestedCategory: matchedItems.length > 0 ? matchedItems[0].category : "General"
        };

        return NextResponse.json(memoryCache[normalizedQuery]);

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({
            matchedProductIds: [],
            aiReasoning: "✨ Search Error. No results found.",
            suggestedCategory: "General"
        }, { status: 200 });
    }
}