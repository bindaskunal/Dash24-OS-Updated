require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { MASTER_CATALOG } = require('./src/data/constants'); // Local legacy mapping source

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE credentials. Ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function patchImages() {
    console.log("Starting Emergency Image URL Patch...");

    // Create a fast lookup map for target URLs
    const urlMap = new Map();
    MASTER_CATALOG.forEach(item => {
        // We already identified in planning some constants have "imageUrl" instead of "image_url"
        const finalUrl = item.image_url || item.imageUrl || item.image;
        if (finalUrl) {
            urlMap.set(item.name, finalUrl);
        }
    });

    console.log(`Loaded ${urlMap.size} valid image target mappings.`);

    // Fetch existing broken rows
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
        .from('products')
        .select('id, name, image_url')
        .is('image_url', null); // Target only broken ones to save write operations

    if (dbErr) {
        console.error("Failed to read from Supabase:", dbErr);
        process.exit(1);
    }

    console.log(`Found ${dbProducts.length} live products with null image_urls.`);
    let patchedCount = 0;

    for (const dbItem of dbProducts) {
        const freshUrl = urlMap.get(dbItem.name);

        if (freshUrl) {
            const { error: patchErr } = await supabaseAdmin
                .from('products')
                .update({ image_url: freshUrl })
                .eq('id', dbItem.id);

            if (patchErr) {
                console.error(`Failed patching ${dbItem.name}`, patchErr);
            } else {
                patchedCount++;
            }
        } else {
            console.warn(`No mapping found for ${dbItem.name}`);
        }
    }

    console.log(`SUCCESS! Patched ${patchedCount} records.`);
    process.exit(0);
}

patchImages();
