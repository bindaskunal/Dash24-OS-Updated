"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';

export default function FloatingCartBar() {
    const { items, getTotalAmount, getTotalItems, getTotalPoints, setIsCartOpen } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);

    const itemCount = getTotalItems();
    // Keep track of the previous count to only pulse when items are ADDED
    const prevItemCountRef = React.useRef(itemCount);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && itemCount > prevItemCountRef.current) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 1000);
            return () => clearTimeout(timer);
        }
        prevItemCountRef.current = itemCount;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemCount]);

    // SSR hydration mismatch prevention 
    if (!mounted) return null;

    if (items.length === 0) {
        return null;
    }

    const totalAmount = getTotalAmount();
    const totalPoints = getTotalPoints();

    return (
        <div className={`fixed bottom-[90px] md:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm md:max-w-md bg-gray-900 text-white rounded-2xl shadow-2xl z-[99998] p-3 transition-all duration-300 ${isPulsing ? 'scale-105 ring-2 ring-[#FFD700] shadow-[#FFD700]/30 -translate-y-2' : 'scale-100'} animate-in slide-in-from-bottom-6`}>
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="font-sans font-black tracking-tight text-lg leading-none">₹{totalAmount}</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            +{totalPoints} pts
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setIsCartOpen(true)}
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all active:scale-95"
                >
                    Checkout →
                </button>
            </div>
        </div>
    );
}
