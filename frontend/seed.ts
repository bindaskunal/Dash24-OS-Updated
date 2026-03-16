import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function processBrands() {
    const brands: any[] = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream('H:/My Drive/Dash24_Brain_Sync/brands_expanded.csv')
            .pipe(csv())
            .on('data', (row: any) => {
                if (!row['Brand Name']) return;
                brands.push({
                    name: row['Brand Name'],
                    logo_url: row['Logo URL'],
                    default_fulfillment: row['Default Fulfillment']
                });
            })
            .on('end', async () => {
                try {
                    console.log(`Upserting ${brands.length} brands...`);
                    const { data, error } = await supabase.from('brands').upsert(brands, { onConflict: 'name' }).select();
                    if (error) throw error;
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            });
    });
}

async function processProducts(brands: any[]) {
    const products: any[] = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream('H:/My Drive/Dash24_Brain_Sync/products_expanded.csv')
            .pipe(csv())
            .on('data', (row: any) => {
                if (!row['Product Name']) return;
                const brandMatch = brands.find(b => b.name === row['Brand']);
                products.push({
                    name: row['Product Name'],
                    brand_id: brandMatch ? brandMatch.id : null,
                    category: row['Category'],
                    price: parseFloat(row['Price']) || 0,
                    mrp: parseFloat(row['MRP']) || 0,
                    image_url: row['Image URL'],
                    is_fbb: row['Is FBB']?.toLowerCase() === 'true',
                    stock_count: parseInt(row['Stock Inventory']) || 0,
                    replenishment_period_days: parseInt(row['Replenishment Period (Days)']) || 0,
                    sku: row['SKU'],
                    description: row['Product Description']
                });
            })
            .on('end', async () => {
                try {
                    console.log(`Testing minimal insert for product 0...`);
                    const first = products[0];
                    const minimal = { name: first.name, price: first.price, mrp: first.mrp };
                    const { error } = await supabase.from('products').insert(minimal).select();
                    if (error) {
                        console.error(`Minimal Insert failed:`, JSON.stringify(error));
                        throw error;
                    }
                    console.log("Minimal insert OK. Performing full upsert...");
                    const { data, error: upsertError } = await supabase.from('products').upsert(products, { onConflict: 'sku' }).select();
                    if (upsertError) throw upsertError;
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            });
    });
}

async function run() {
    try {
        const uploadedBrands: any = await processBrands();
        console.log(`Brands ready: ${uploadedBrands.length}`);
        await processProducts(uploadedBrands);
        console.log("MISSION 07 COMPLETE: Data Seeded");
    } catch (error) {
        console.error("FATAL:", error);
    }
}

run();
