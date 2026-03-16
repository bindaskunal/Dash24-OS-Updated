
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from current directory
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyOrders() {
    console.log('--- Mission 10 Verification ---');
    console.log('Fetching orders with joins...');

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            total_amount,
            order_items (
                id,
                product_id,
                quantity,
                products (
                    name,
                    is_fbb
                )
            )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Found ${orders.length} orders.`);

    orders.forEach((order, index) => {
        console.log(`\nOrder #${index + 1}: ${order.id}`);
        console.log(`Status: ${order.status} | Total: ₹${order.total_amount}`);

        const dash24Items = order.order_items.filter(item => !item.products?.is_fbb);
        const brandItems = order.order_items.filter(item => item.products?.is_fbb);

        console.log(`- Dash24 Dispatch Queue: ${dash24Items.length} items`);
        dash24Items.forEach(item => console.log(`  [QC] ${item.products?.name} x ${item.quantity}`));

        console.log(`- Brand Notification Queue: ${brandItems.length} items`);
        brandItems.forEach(item => console.log(`  [FBB] ${item.products?.name} x ${item.quantity}`));
    });

    console.log('\n--- Verification Complete ---');
}

verifyOrders();
