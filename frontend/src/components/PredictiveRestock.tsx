"use client";

import React, { useState, useEffect } from 'react';

// The "Smart Pushback" logic list
const HIGH_SUGAR_CATEGORIES = ['Snacks', 'Chocolates', 'Beverages'];
const PROCESSED_KEYWORDS = ['Processed', 'High-Sugar', 'Chips', 'Sweet'];

interface PredictiveRestockProps {
    productName: string;
    category: string;
    onSchedule: (date: Date) => void;
}

export default function PredictiveRestock({ productName, category, onSchedule }: PredictiveRestockProps) {
    const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

    // Consumption Logic Map
    const frequencyMap = [
        { label: "Fresh Produce", days: 4, icon: "🥬", desc: "Every 3-5 days" },
        { label: "Pantry/Snacks", days: 12, icon: "🍪", desc: "Every 10-14 days" },
        { label: "Supplements/Wellness", days: 30, icon: "💊", desc: "Every 30 days" },
        { label: "Daily (Intense)", days: 1, icon: "🔥", desc: "Everyday restock" }
    ];

    let defaultSuggest = 12; // Default pantry
    const catLower = category?.toLowerCase() || '';
    const nameLower = productName?.toLowerCase() || '';
    if (catLower.includes('fresh') || catLower.includes('produce') || catLower.includes('fruit') || catLower.includes('veg') || nameLower.includes('banana') || nameLower.includes('apple') || nameLower.includes('vegetable')) {
        defaultSuggest = 4;
    } else if (catLower.includes('wellness') || catLower.includes('supplement') || catLower.includes('health') || nameLower.includes('vitamin') || nameLower.includes('protein') || nameLower.includes('gummies')) {
        defaultSuggest = 30;
    }

    useEffect(() => {
        setSelectedFrequency(defaultSuggest);
    }, [defaultSuggest]);

    // Check health constraint
    const isUnhealthy = HIGH_SUGAR_CATEGORIES.includes(category) || 
        PROCESSED_KEYWORDS.some(k => nameLower.includes(k.toLowerCase()) || catLower.includes(k.toLowerCase()));

    const handleSelect = (days: number) => {
        setSelectedFrequency(days);
    };

    const handleConfirm = () => {
        if (!selectedFrequency) return;
        
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + selectedFrequency);
        setScheduledDate(nextDate);
        setIsConfirmed(true);
        onSchedule(nextDate);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const isTriggeringHealthGuardrail = isUnhealthy && selectedFrequency && selectedFrequency < 7;

    return (
        <div className="bg-gray-900/40 border border-[#00FF41]/20 rounded-2xl p-5 mt-6 backdrop-blur-md">
            
            {!isConfirmed ? (
                <>
                   <div className="flex items-center gap-3 mb-4">
                       <span className="text-xl">🤖</span>
                       <div>
                           <h3 className="text-white font-bold text-sm">Smart Replenishment</h3>
                           <p className="text-gray-400 text-xs">Set an Auto-Add cycle for <span className="text-[#00FF41]">{productName}</span></p>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                       {frequencyMap.map(freq => (
                           <button 
                               key={freq.days}
                               onClick={() => handleSelect(freq.days)}
                               className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${selectedFrequency === freq.days ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}`}
                           >
                               <span className="text-lg mb-1">{freq.icon}</span>
                               <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{freq.label}</span>
                               <span className="text-[9px] mt-1 opacity-60">{freq.desc}</span>
                           </button>
                       ))}
                   </div>

                   {/* The Smart Pushback Banner */}
                   {isTriggeringHealthGuardrail && (
                       <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                           <span className="text-orange-400 shrink-0">⚠️</span>
                           <p className="text-xs text-orange-200/80 font-medium leading-relaxed">
                               Frequent consumption detected. Perhaps try a healthy alternative for your next slot?
                           </p>
                       </div>
                   )}

                   <button 
                      onClick={handleConfirm}
                      disabled={!selectedFrequency}
                      className="w-full bg-[#00FF41] text-black font-black py-3 rounded-xl hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,65,0.2)] text-sm uppercase tracking-wide"
                   >
                      Confirm Auto-Add
                   </button>
                </>
            ) : (
                <div className="flex items-center gap-4 animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 bg-[#00FF41]/20 rounded-full flex items-center justify-center text-[#00FF41] text-2xl shrink-0 border border-[#00FF41]/40">
                        ✓
                    </div>
                    <div>
                        <h4 className="text-[#00FF41] font-bold text-sm mb-1">Smart-Scheduled.</h4>
                        <p className="text-gray-300 text-xs leading-relaxed">
                            We'll add this to your cart on <strong className="text-white">{scheduledDate ? formatDate(scheduledDate) : ''}</strong>—just when you're likely to run out.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
