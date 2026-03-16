
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedTestOrder() {
    console.log('--- Seeding Test Order for Mission 10 ---');

    // 1. Get products (one FBB, one Dash24)
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, price, is_fbb')
        .limit(10);

    if (pError || !products) {
        console.error('Error fetching products:', pError);
        return;
    }

    const fbbProduct = products.find(p => p.is_fbb);
    const dashProduct = products.find(p => !p.is_fbb);

    if (!fbbProduct || !dashProduct) {
        console.error('Could not find both FBB and Dash24 products for testing.', { fbbProduct, dashProduct });
        return;
    }

    console.log(`Using products:\n- FBB: ${fbbProduct.name}\n- Dash24: ${dashProduct.name}`);

    // 2. Create Order
    const { data: order, error: oError } = await supabase
        .from('orders')
        .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            total_amount: fbbProduct.price + dashProduct.price,
            status: 'Pending',
            razorpay_order_id: 'test_order_' + Date.now()
        })
        .select()
        .single();

    if (oError) {
        console.error('Error creating order:', oError);
        return;
    }

    console.log(`Order created: ${order.id}`);

    // 3. Create Order Items
    const items = [
        {
            order_id: order.id,
            product_id: fbbProduct.id,
            quantity: 1,
            price_at_purchase: fbbProduct.price
        },
        {
            order_id: order.id,
            product_id: dashProduct.id,
            quantity: 1,
            price_at_purchase: dashProduct.price
        }
    ];

    const { error: iError } = await supabase.from('order_items').insert(items);

    if (iError) {
        console.error('Error creating order items:', iError);
        return;
    }

    console.log('Order items created successfully.');
    console.log('--- Seeding Complete ---');
}

seedTestOrder();
