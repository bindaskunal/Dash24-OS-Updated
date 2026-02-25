const fs = require('fs');
const path = require('path');

// Basic CSV parser (handles quoted strings)
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // RegExp to match comma separated values, accounting for quotes
        const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const values = line.split(re).map(v => v.replace(/^"|"$/g, '').trim());

        const obj = {};
        headers.forEach((h, index) => {
            obj[h] = values[index];
        });
        result.push(obj);
    }
    return result;
}

function generateIntentLayers(productName, category, brand) {
    const p = productName.toLowerCase();
    const c = category.toLowerCase();

    let keywords = "";
    if (c.includes('beauty')) keywords = "glowing, skincare, acne, hydration, routine";
    else if (c.includes('health') || c.includes('wellness')) keywords = "immunity, energy, fitness, organic, recovery";
    else if (c.includes('snack')) keywords = "healthy snacking, guilt-free, delicious, quick bite, craving";
    else if (c.includes('fashion')) keywords = "trendy, comfortable, style, everyday wear, casual";
    else if (c.includes('wearable') || c.includes('electronic')) keywords = "smart, connected, battery life, premium, tech";
    else keywords = "premium quality, daily use, essential, best seller";

    return {
        "clarification": `${productName} by ${brand}. Perfect for ${keywords.split(', ')[0]} needs.`,
        "risk": `100% genuine product. Secure checkout and fast delivery.`,
        "outcome": `Associated keywords for search: ${keywords}, ${p.split(' ').join(', ')}`,
        "comparison": `A top choice in the ${category} category with verified local inventory.`,
        "value": `High quality at competitive pricing.`,
        "personalization": `Great addition to your daily ${category.toLowerCase()} routine in Bangalore.`
    };
}

async function mergeData() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    const dataDir = path.join(frontendDir, 'data');

    // 1. Process Brands
    console.log("Processing Brands...");
    const brandsCsvPath = path.join(dataDir, 'brands_template.csv');
    const brandsData = parseCSV(fs.readFileSync(brandsCsvPath, 'utf8'));

    let brandsOutput = "export const BRAND_LOGOS: Record<string, string> = {\n";
    // Hardcoded preservation just in case
    brandsOutput += `  'Sleepy Owl': 'https://sleepyowl.co/cdn/shop/files/SO_Logo_Black.png',\n`;
    brandsOutput += `  'Minimalist': 'https://beminimalist.co/cdn/shop/files/logo_black_140x.png',\n`;

    brandsData.forEach(row => {
        const brand = row['Brand Name'];
        const logo = row['Logo URL'];
        if (brand !== 'Sleepy Owl' && brand !== 'Minimalist') {
            brandsOutput += `  '${brand}': '${logo}',\n`;
        }
    });
    brandsOutput += "};\n";
    fs.writeFileSync(path.join(__dirname, 'brand_logos_snippet.txt'), brandsOutput);
    console.log("Wrote BRAND_LOGOS snippet to scripts/brand_logos_snippet.txt");

    // 2. Process Products
    console.log("Processing Products...");
    const enrichedPath = path.join(dataDir, 'enriched_catalog.json');
    let existingCatalog = [];
    if (fs.existsSync(enrichedPath)) {
        existingCatalog = JSON.parse(fs.readFileSync(enrichedPath, 'utf8'));
    } else {
        console.error("enriched_catalog.json not found! Expected original 12 items to exist.");
        process.exit(1);
    }

    // Keep only the first 12 items to be absolutely safe
    let finalItems = existingCatalog.slice(0, 12);
    console.log(`Preserved ${finalItems.length} original items from enriched_catalog.json`);

    const productsCsvPath = path.join(dataDir, 'products_template.csv');
    const productsData = parseCSV(fs.readFileSync(productsCsvPath, 'utf8'));

    // The CSV has 43 rows (header + 42 items). First 12 are old. Next 30 are new.
    // Let's filter to just the remaining 30 new items. We can group by brand.
    const newItemsFromCSV = productsData.slice(12);

    const brandCounts = {};

    const newProducts = newItemsFromCSV.map((row, idx) => {
        const brand = row['Brand'];
        if (!brandCounts[brand]) brandCounts[brand] = 0;

        let fulfilledBy = "Dash24";
        let node_inventory = {
            "Prestige Koramangala": 500,
            "Brigade Indiranagar": 500,
            "Sobha HSR": 500
        };
        let inventory = { ...node_inventory };
        let localAvailable = true;

        if (brandCounts[brand] >= 2) {
            // The 3rd product for this brand
            fulfilledBy = "Brand";
            node_inventory = {
                "Prestige Koramangala": 0,
                "Brigade Indiranagar": 0,
                "Sobha HSR": 0
            };
            inventory = { ...node_inventory };
            localAvailable = false;
        }

        brandCounts[brand]++;

        return {
            id: `NEW_CSV_PROD_${idx + 13}`,
            name: row['Product Name'],
            brand: brand,
            category: row['Category'],
            price: parseInt(row['Price'] || '0', 10),
            mrp: parseInt(row['MRP'] || '0', 10),
            image_url: row['Image URL'],
            rating: (4 + Math.random()).toFixed(1) * 1, // Random rating > 4
            low: false,
            lastPurchased: Math.floor(Math.random() * 50) + 10,
            consumptionCycle: Math.floor(Math.random() * 30) + 15,
            inventory: inventory,
            ai_intent_layers: generateIntentLayers(row['Product Name'], row['Category'], brand),
            fulfilledBy: fulfilledBy,
            node_inventory: node_inventory,
            localAvailable: localAvailable,
            brandDeliveryDays: 2 + Math.floor(Math.random() * 3) // 2-4 days
        };
    });

    finalItems = [...finalItems, ...newProducts];

    console.log(`Final output consists of ${finalItems.length} items. (Expected 42)`);
    fs.writeFileSync(enrichedPath, JSON.stringify(finalItems, null, 2));
    console.log(`Successfully rewrote ${enrichedPath}`);
}

mergeData().catch(console.error);
