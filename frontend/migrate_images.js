const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

// Require necessary env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Anti-Bot Headers
const fetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/'
};

async function migrateImages() {
  console.log("🚀 Starting Image Migration Protocol...");

  // 1. Fetch all products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (fetchError) {
    console.error("❌ Error fetching products:", fetchError);
    return;
  }

  console.log(`📦 Found ${products.length} products to process.`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const product of products) {
    const { id, name, image_url } = product;
    
    // 2. Skip condition: null URL or already a Supabase URL
    if (!image_url || image_url.includes(supabaseUrl)) {
        console.log(`⏩ Skipping ${name} (ID: ${id}) - URL already migrated or null.`);
        skipCount++;
        continue;
    }

    console.log(`⏳ Processing: ${name} (ID: ${id}) - URL: ${image_url}`);

    try {
      // 3. Download the image using Anti-Bot Headers
      const response = await fetch(image_url, { headers: fetchHeaders });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Determine content type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('gif')) ext = 'gif';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('svg')) ext = 'svg';

      const fileName = `${id}.${ext}`;
      
      console.log(`   ⬇️  Downloaded ${fileName} (${arrayBuffer.byteLength} bytes) [Type: ${contentType}]`);

      // 4. Upload to Supabase Storage - Make sure contentType is explicitly set!
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, arrayBuffer, {
          contentType: contentType, // Ensure the browser renders it correctly
          upsert: true
        });

      if (uploadError) {
          throw new Error(`Upload Failed: ${uploadError.message}`);
      }

      // 5. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const newUrl = publicUrlData.publicUrl;
      console.log(`   ⬆️  Uploaded to Supabase: ${newUrl}`);

      // 6. Update Database
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: newUrl })
        .eq('id', id);

      if (updateError) {
        throw new Error(`DB Update Failed: ${updateError.message}`);
      }

      console.log(`   ✅ Successfully migrated ${name}!`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ Failed to migrate ${name} (ID: ${id}):`, err.message);
      errorCount++;
    }
  }

  console.log("\n🏁 Migration Protocol Complete!");
  console.log(`📊 Summary: ${successCount} Migrated | ${skipCount} Skipped | ${errorCount} Errors`);
}

migrateImages();
