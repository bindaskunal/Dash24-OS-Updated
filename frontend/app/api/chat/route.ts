import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import products from '../../../data/enriched_catalog.json';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, lastOrderContext, catalog } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const keys = [
      process.env.GEMINI_API_KEY_PRIMARY,
      process.env.GEMINI_API_KEY_SECONDARY,
      process.env.GEMINI_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    ].filter(Boolean);

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Please configure GEMINI_API_KEY_PRIMARY in your .env file." },
        { status: 500 }
      );
    }


    const hungerKeywords = ['bhook', 'bhuk', 'hungry', 'hunger', 'eat', 'food', 'snack', 'craving'];
    const isHungerIntent = hungerKeywords.some(kw => prompt.toLowerCase().includes(kw));

    let processedCatalog = catalog && Array.isArray(catalog) ? catalog : products;

    if (isHungerIntent) {
      processedCatalog = processedCatalog.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const aiTags = p.ai_intent_layers ? Object.values(p.ai_intent_layers).join(" ").toLowerCase() : "";
        const name = (p.name || '').toLowerCase();
        // Check for food related categories or tags
        return cat.includes('food') || cat.includes('snack') || cat.includes('eat') || 
               cat.includes('beverage') || cat.includes('drink') || cat.includes('chocolate') || 
               cat.includes('sweet') || cat.includes('grocery') || cat.includes('instant') ||
               aiTags.includes('snack') || aiTags.includes('food') || aiTags.includes('hunger');
      });
      
      // Fallback if filtering is too strict
      if (processedCatalog.length === 0) {
        processedCatalog = catalog && Array.isArray(catalog) ? catalog : products;
      }
    }

    const slimCatalog = processedCatalog.map((p: any) => ({ 
      id: p.id, 
      name: p.name, 
      category: p.category,
      brand: p.brand,
      tags: p.ai_intent_layers ? Object.values(p.ai_intent_layers).join(" ") : "",
      stock: p.stock !== undefined ? p.stock : (p.inventory ? Object.values(p.inventory).reduce((a:any,b:any)=>a+b,0) : 0)
    }));
    
    let catalogString = JSON.stringify(slimCatalog);

    const systemPrompt = `You are the Katzen OS Agent. Analyze user intent (e.g., 'bhook lagi hai') and return product recommendations based strictly on the catalog provided below.
IMPORTANT: If the user searches for food or hunger (like "bhook lagi hai"), you MUST ONLY return items that are food, snacks, or beverages. Do not return non-food items like shampoo, face wash, or skincare.

CATALOG (Array of objects with id, name, category, and stock):
${catalogString}

RULE 1: You MUST return a JSON object with strictly this exact schema:
{ 
  "thought_process": [
    "Locality: Scanning options near the user...", 
    "Intent: Analyzing need for...", 
    "Logistics: Checking stock & fast-delivery...", 
    "Solution: Finalizing top match..."
  ],
  "pitch_title": "String (A large, persuasive title e.g. 'High potassium, zero prep')", 
  "reasoning": "String (A Personalized Synthesis explicitly linking the user's intent & location to the final choice. Example: 'Since you're in Bangalore and feeling hungry, I bypassed 14 other snacks to prioritize this [Product Name] from [Brand] because it offers instant energy.')",
  "primary_product_id": "String (exact product id from the catalog)", 
  "alternative_product_ids": ["String", "String"] 
}

RULE 2: Your thought_process must ALWAYS be exactly 4 human-centric logs detailing the theater of search: [Locality, Intent, Logistics, Solution].

RULE 3: The primary_product_id logic MUST prioritize high-stock items from the catalog.

RULE 4: If you cannot find any suitable product, return a fallback headline with an empty string for primary_product_id and empty array for alternative_product_ids rather than breaking. Do not hallucinate product IDs.

RULE 5: Do NOT wrap the JSON in Markdown formatting (e.g. \`\`\`json). Return raw JSON only.`;

    const fullPrompt = `${systemPrompt}\n\nUser Query: ${prompt}\n\nContext:\n${lastOrderContext || 'None'}`;

    let response;
    let lastError = null;

    for (const key of keys) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        if (response) break;
      } catch (e: any) {
        lastError = e;
        console.warn(`Gemini key failed, trying next fallback...`);
      }
    }

    if (!response) {
      return NextResponse.json({
        status: 'error',
        error: "All Gemini API keys failed or quota exhausted. " + (lastError?.message || lastError?.toString())
      }, { status: 500 });
    }


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
