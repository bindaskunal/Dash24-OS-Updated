"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../src/store/useCartStore';
import { OrderService } from '../../src/services/OrderService';
import FulfillmentTimeline from '../../src/components/FulfillmentTimeline';
import CheckoutSummaryTable from '../../src/components/CheckoutSummaryTable';
import OrderSuccessMap from '../../src/components/OrderSuccessMap';

export default function CheckoutPage() {
    const router = useRouter();
    // Use CartStore logic
    const {
        items,
        getTotalAmount,
        getTotalPoints,
        getDeliveryBuckets,
        clearCart
    } = useCartStore();

    // States: 'review' | 'processing' | 'success'
    const [view, setView] = useState<'review' | 'processing' | 'success'>('review');
    const [mounted, setMounted] = useState(false);
    const [finalPoints, setFinalPoints] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Snapshot frozen data if successful so clearing cart doesn't unmount the success view
    const subtotal = getTotalAmount();
    const points = getTotalPoints();
    const buckets = getDeliveryBuckets();

    const handleMockPayment = async () => {
        setView('processing');
        // Freeze the points earned for the success view before cart clears
        setFinalPoints(getTotalPoints());

        // Snapshot the current cart for the service
        const stateSnapshot = useCartStore.getState();

        // Let the mock service handle processing delay (3s)
        const success = await OrderService.processOrder(stateSnapshot);

        if (success) {
            // ONLY clear after successful payment
            clearCart();
            setView('success');
        }
    };

    if (view === 'success') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 pb-24 md:pb-8">
                <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col text-center isolate overflow-hidden relative">
                    <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-pulse relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[#FFD700] animate-ping opacity-20"></div>
                        ✨
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">Order Confirmed!</h1>
                    <p className="text-sm text-gray-600 font-bold mb-6">Your Dash24 Pulse is locked in.</p>

                    <OrderSuccessMap />

                    <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100">
                        <p className="text-xs uppercase tracking-widest text-[#FFD700] font-black mb-1 bg-gray-900 px-2 py-1 w-max rounded">+{finalPoints} Pulse Points Earned</p>
                        <p className="text-sm text-gray-700 font-medium">Your points will be credited upon delivery completion.</p>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition"
                    >
                        Back to Home
                    </button>

                    {/* Confetti Background overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
                </div>
            </div>
        );
    }

    if (view === 'processing') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FFD700] rounded-full animate-spin mb-4 shadow-lg"></div>
                    <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase">Processing Payment...</h2>
                    <p className="text-xs font-bold text-gray-500 mt-2">Securing your order</p>
                </div>
            </div>
        );
    }

    // Review View
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <p className="text-4xl mb-4">🛒</p>
                    <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase mb-2">Cart is empty</h2>
                    <p className="text-sm text-gray-500 font-medium mb-6">Looks like you haven't added anything yet.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#FFD700] text-gray-900 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:scale-105 transition shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                    >
                        Go Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-32 md:pb-16 px-4">
            <div className="w-full max-w-md mx-auto relative isolate">

                {/* Header Pattern */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-screen h-48 bg-gray-900 z-0 border-b-4 border-[#FFD700]"></div>

                <div className="relative z-10 flex flex-col gap-2">
                    <div className="mb-2">
                        <button onClick={() => router.back()} className="text-white text-xs font-black uppercase tracking-wider hover:opacity-80 transition flex items-center gap-1">
                            <span>←</span> Back
                        </button>
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-4">Checkout</h1>

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
                        {/* Decorative Top Line */}
                        <div className="h-1.5 w-full bg-[#FFD700]"></div>

                        <div className="p-4 md:p-6 pb-2">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-4">Order Summary</h2>

                            {/* Fulfillment Timelines */}
                            <FulfillmentTimeline instantItems={buckets.instant} quickItems={buckets.quick} />

                            {/* Cost Breakdown */}
                            <CheckoutSummaryTable subtotal={subtotal} pointsEarned={points} />
                        </div>

                        {/* Mock Payment CTA */}
                        <div className="p-4 md:p-6 pt-2 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={handleMockPayment}
                                className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_8px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_12px_25px_rgba(255,215,0,0.4)] transition-all active:scale-95 flex justify-between items-center px-6 border border-[#FFD700]/50"
                            >
                                <span>Mock Payment</span>
                                <span>→</span>
                            </button>
                            <p className="text-[10px] text-center font-bold text-gray-500 mt-3 flex items-center justify-center gap-1">
                                <span>🔒</span> 256-bit Secure Encrypted Checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
