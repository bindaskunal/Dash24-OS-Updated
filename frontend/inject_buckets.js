const fs = require('fs');
const path = require('path');

function processCatalog(catalog) {
    if (!Array.isArray(catalog)) return catalog;
    return catalog.map(item => {
        const cat = item.category || '';
        if (cat.includes('Electronics') || cat.includes('Electronic')) {
            item.deliveryBucket = 'instant';
        } else if (cat.includes('Wellness') || cat.includes('Snacks') || cat.includes('Health')) {
            item.deliveryBucket = 'quick';
        } else {
            // Default based on isFastTrack if possible, else 'quick'
            item.deliveryBucket = item.isFastTrack ? 'instant' : 'quick';
        }
        return item;
    });
}

// 1. Update enriched_catalog.json
const enrichedPath = path.join(__dirname, 'data', 'enriched_catalog.json');
try {
    const raw = fs.readFileSync(enrichedPath, 'utf8');
    const catalog = JSON.parse(raw);
    const updated = processCatalog(catalog);
    fs.writeFileSync(enrichedPath, JSON.stringify(updated, null, 2), 'utf8');
    console.log("Updated enriched_catalog.json");
} catch (e) {
    console.error("Failed to update enriched_catalog.json", e.message);
}

// 2. Update constants.ts
const constantsPath = path.join(__dirname, 'src', 'data', 'constants.ts');
try {
    let raw = fs.readFileSync(constantsPath, 'utf8');
    // It's a JS/TS file with export const MASTER_CATALOG = [...]
    const match = raw.match(/export const MASTER_CATALOG = (\[[\s\S]*?\]);/);
    if (match) {
        // Evaluate it carefully
        const arrayStr = match[1];
        const catalog = eval(`(${arrayStr})`);
        const updated = processCatalog(catalog);
        const updatedStr = JSON.stringify(updated, null, 2).replace(/"([^"]+)":/g, '$1:');

        // Let's keep quotes if they were there, JSON.stringify works fine for JS arrays.
        raw = raw.replace(/export const MASTER_CATALOG = \[[\s\S]*?\];/, `export const MASTER_CATALOG = ${JSON.stringify(updated, null, 2)};`);
        fs.writeFileSync(constantsPath, raw, 'utf8');
        console.log("Updated constants.ts");
    }
} catch (e) {
    console.error("Failed to update constants.ts", e.message);
}
