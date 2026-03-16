import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { cartItems, totalAmount, userId = 'guest-user' } = await req.json();

        // 1. Fetch products from Supabase to verify prices and fulfillment (Security check)
        const productIds = cartItems.map((item: any) => item.id);

        console.log('--- CHECKOUT VERIFICATION START ---');
        console.log('Incoming Cart Size:', cartItems.length);
        console.log('Extracted Product IDs for DB Query:', productIds);

        const { data: dbProducts, error: pError } = await supabase
            .from('products')
            .select('id, name, price, is_fbb, brand_id')
            .in('id', productIds);

        console.log('DB Products Found:', dbProducts?.length || 0);
        if (dbProducts) {
            console.log('DB Mapped IDs:', dbProducts.map(p => p.id));
        }
        console.log('--- CHECKOUT VERIFICATION END ---');

        if (pError || !dbProducts || dbProducts.length === 0) {
            console.error('Supabase Product Fetch Error:', pError);
            throw new Error('Could not verify products');
        }

        // Fetch brands to identify 'Snitch' for special shipping logic
        const { data: dbBrands } = await supabase.from('brands').select('id, name');

        // 2. Calculate Server-side Total
        let subtotal = 0;
        let localSubtotal = 0;
        let brandSubtotal = 0;
        let hasSnitch = false;

        cartItems.forEach((item: any) => {
            const dbProduct = dbProducts.find((p) => p.id === item.id);
            if (dbProduct) {
                const itemTotal = dbProduct.price * item.quantity;
                subtotal += itemTotal;

                const dbBrand = dbBrands?.find(b => b.id === dbProduct.brand_id);
                if (dbBrand?.name === 'Snitch') {
                    hasSnitch = true;
                } else if (dbProduct.is_fbb) {
                    brandSubtotal += itemTotal;
                } else {
                    localSubtotal += itemTotal;
                }
            }
        });

        const localShipping = localSubtotal >= 699 ? 0 : (localSubtotal > 0 ? 50 : 0);
        const brandShipping = brandSubtotal >= 999 ? 0 : (brandSubtotal > 0 ? 50 : 0);
        const snitchDelivery = hasSnitch ? 49 : 0;

        const serverTotal = subtotal + localShipping + brandShipping + snitchDelivery;

        // 3. Create Razorpay Order
        const payment_capture = 1;
        const amount = serverTotal * 100; // in paisa
        const currency = 'INR';
        const options = {
            amount: amount.toString(),
            currency,
            receipt: `receipt_${Date.now()}`,
            payment_capture,
        };

        const order = await razorpay.orders.create(options);

        // 4. Persistence: Insert into Supabase Orders table
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId === 'guest-user' ? null : userId,
                total_amount: serverTotal,
                status: 'Pending',
                razorpay_order_id: order.id,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 5. Persistence: Insert into Order Items
        const orderItems = cartItems.map((item: any) => {
            const dbProduct = dbProducts.find((p) => p.id === item.id);
            return {
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: dbProduct ? dbProduct.price : 0,
            };
        });

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            dbOrderId: orderData.id
        });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        const errorMessage = error?.message || String(error) || 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
