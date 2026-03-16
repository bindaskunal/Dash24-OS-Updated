import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BRAND_LOGOS, MASTER_CATALOG } from '@/src/data/constants';

// We must use the Service Role Key here to bypass RLS for admin seeding operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST() {
    try {
        console.log("Starting Supabase Database Seed Process...");

        // --- PHASE 1: SEED BRANDS ---
        const brandIdsMap = new Map<string, string>(); // Maps "Brand Name" -> "UUID"
        let brandsInserted = 0;

        // Load existing brands into memory to avoid duplicate inserts without DB constraints
        const { data: existingBrands, error: brandsError } = await supabaseAdmin.from('brands').select('id, name');
        if (brandsError) throw brandsError;

        // Seed existing ones to the map to skip them
        existingBrands?.forEach(b => brandIdsMap.set(b.name, b.id));

        for (const [brandName, brandLogo] of Object.entries(BRAND_LOGOS)) {
            if (!brandIdsMap.has(brandName)) {
                // Insert new brand
                const { data, error } = await supabaseAdmin
                    .from('brands')
                    .insert({ name: brandName, logo_url: brandLogo })
                    .select()
                    .single();

                if (error) {
                    console.error(`Error inserting brand ${brandName}:`, error);
                    throw error;
                }

                if (data) {
                    brandIdsMap.set(brandName, data.id);
                    brandsInserted++;
                }
            }
        }

        console.log(`Successfully acquired ${brandIdsMap.size} brands. ${brandsInserted} newly inserted.`);

        // --- PHASE 2: SEED PRODUCTS ---
        const uniqueProducts = Array.from(new Map(MASTER_CATALOG.map(item => [item.id, item])).values());
        let productsInserted = 0;

        // Load existing products into memory to avoid duplicates matching on name
        const { data: dbProducts, error: dbProdError } = await supabaseAdmin.from('products').select('id, name');
        if (dbProdError) throw dbProdError;

        const existingProductNames = new Set(dbProducts?.map(p => p.name) || []);

        for (const item of uniqueProducts) {
            if (existingProductNames.has(item.name)) {
                continue; // Only Insert if missing to act like an upsert without strict SQL constraints
            }

            const brandId = brandIdsMap.get(item.brand);

            if (!brandId) {
                console.warn(`Skipping product ${item.name} - Brand "${item.brand}" not found in brands table.`);
                continue;
            }

            // Map local JSON structure to Postgres snake_case schema
            const mappedProduct = {
                name: item.name,
                brand_id: brandId,
                category: item.category,
                price: item.price,
                mrp: item.mrp || item.price,
                image_url: item.image_url,
                is_fbb: (item as any).fulfilledBy === 'Brand',
                stock_inventory: item.inventory['Prestige Koramangala'] || 50, // Default seed quantity
                replenishment_period_days: item.consumptionCycle || 15,
                fulfilled_by: (item as any).fulfilledBy || 'Dash24', // Added fulfilledBy field
                delivery_time: item.deliveryBucket || ((item as any).fulfilledBy === 'Brand' ? 'standard' : 'quick')
            };

            const { error } = await supabaseAdmin
                .from('products')
                .insert(mappedProduct);

            if (error) {
                console.error(`Error inserting product ${item.name}:`, error);
                throw error; // Fail fast
            }

            productsInserted++;
            existingProductNames.add(item.name); // Track locally added items
        }

        console.log(`Successfully seeded ${productsInserted} net new products.`);

        return NextResponse.json({
            success: true,
            brandsInserted,
            productsInserted
        });

    } catch (error: any) {
        console.error("FATAL SEED ERROR:", error);
        return NextResponse.json({
            error: error?.message || String(error) || "Database Seeding Failed"
        }, { status: 500 });
    }
}
