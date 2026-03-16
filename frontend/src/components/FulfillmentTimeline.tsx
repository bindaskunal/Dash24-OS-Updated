"use client";

import React, { useEffect, useState } from 'react';
import { CartItem } from '../store/useCartStore';

interface FulfillmentTimelineProps {
    instantItems: CartItem[];
    quickItems: CartItem[];
}

export default function FulfillmentTimeline({ instantItems, quickItems }: FulfillmentTimelineProps) {
    const [timeLeftInstant, setTimeLeftInstant] = useState(30 * 60); // 30 mins
    const [timeLeftQuick, setTimeLeftQuick] = useState(60 * 60); // 60 mins

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeftInstant(prev => Math.max(0, prev - 1));
            setTimeLeftQuick(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const hasInstant = instantItems.length > 0;
    const hasQuick = quickItems.length > 0;

    if (!hasInstant && !hasQuick) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Fulfillment Timeline</h3>

            <div className="space-y-4">
                {hasInstant && (
                    <div className="flex items-center gap-3 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl relative overflow-hidden">
                        <div className="w-1.5 h-full bg-[#FFD700] absolute left-0 top-0"></div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm shrink-0">
                            ⚡
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight">Instant Delivery</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{instantItems.length} {instantItems.length === 1 ? 'Item' : 'Items'} arriving soon</p>
                        </div>
                        <div className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                            <span className="text-sm font-black text-gray-900 font-mono tracking-tighter">{formatTime(timeLeftInstant)}</span>
                        </div>
                    </div>
                )}

                {hasQuick && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                        <div className="w-1.5 h-full bg-blue-400 absolute left-0 top-0"></div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm shrink-0">
                            📦
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight">Quick Delivery</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{quickItems.length} {quickItems.length === 1 ? 'Item' : 'Items'} dispatched separately</p>
                        </div>
                        <div className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                            <span className="text-sm font-black text-gray-900 font-mono tracking-tighter">{formatTime(timeLeftQuick)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
