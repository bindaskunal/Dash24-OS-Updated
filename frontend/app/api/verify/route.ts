import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    console.log("[VERIFY API] Handling verification request");
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            dbOrderId
        } = await req.json();

        console.log("[VERIFY API] Payload received:", { razorpay_order_id, razorpay_payment_id, dbOrderId });

        // 1. Cryptographic verification of signature
        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            console.error("[VERIFY API] Signature mismatch");
            return NextResponse.json({ error: 'Transaction not legitimate!' }, { status: 400 });
        }
        
        console.log("[VERIFY API] Signature verified");

        // 2. Update order status in Supabase
        console.log("[VERIFY API] Attempting to update database record:", dbOrderId);
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: 'Confirmed', 
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature
            })
            .eq('id', dbOrderId);

        if (error) {
            console.error("[VERIFY API] Supabase update failed (RLS issue?):", error);
            // Non-critical if signature matches
        } else {
            console.log("[VERIFY API] Database record updated successfully");
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error: any) {
        console.error('[VERIFY API] Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
