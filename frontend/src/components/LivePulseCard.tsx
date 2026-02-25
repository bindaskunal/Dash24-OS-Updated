"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { Brain, ChevronRight, Activity, Clock } from "lucide-react";

const INTENT_LAYERS = ["personalization", "clarification", "risk", "outcome", "comparison", "value"];
const INTENT_LABELS: Record<string, string> = {
    clarification: "What is it?",
    risk: "Is it safe?",
    outcome: "Results",
    comparison: "Vs Others",
    value: "Value",
    personalization: "For You"
};
const INTENT_COLORS: Record<string, string> = {
    clarification: "bg-blue-50 text-blue-700 ring-blue-200",
    risk: "bg-red-50 text-red-700 ring-red-200",
    outcome: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    comparison: "bg-purple-50 text-purple-700 ring-purple-200",
    value: "bg-amber-50 text-amber-700 ring-amber-200",
    personalization: "bg-indigo-50 text-indigo-700 ring-indigo-200"
};

export default function LivePulseCard({ product, handleAddToCart, handleCardClick }: { product: any, handleAddToCart: any, handleCardClick?: any }) {
    const [activeIntent, setActiveIntent] = useState<string | null>(null);

    // Fallback to empty intent object if ai_intent_layers is missing
    const intentData = product.ai_intent_layers || {};
    const hasIntentData = Object.keys(intentData).length > 0;

    return (
        <div className="bg-white rounded-[16px] md:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 overflow-visible group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full relative">

            {/* Product Image & Badges */}
            <div className="relative h-[120px] md:h-[220px] w-full p-2 md:p-6 bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center rounded-t-[16px] md:rounded-t-[24px] overflow-hidden">
                {product.low && (
                    <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-orange-50 text-orange-600 text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 md:py-1 rounded-full border border-orange-100 shadow-sm z-10 hidden group-hover:block transition-opacity">
                        Selling Fast
                    </span>
                )}
                <div className="w-[80px] md:w-[140px] h-[80px] md:h-[140px] relative group-hover:scale-105 transition-transform duration-500 md:mt-2">
                    <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-contain filter drop-shadow-sm" />
                </div>
            </div>

            {/* Product Info */}
            <div className="p-2 md:p-5 flex-1 flex flex-col justify-between cursor-pointer" onClick={handleCardClick || (() => { })}>
                <div>
                    <div className="flex justify-between items-start mb-0.5 md:mb-1">
                        <h3 className="font-bold text-gray-900 text-[11px] md:text-[15px] leading-tight md:leading-snug line-clamp-2">{product.name}</h3>
                    </div>
                    <p className="text-[9px] md:text-[11px] text-gray-500 font-medium mb-1 md:mb-2 line-clamp-1">{product.brand}</p>

                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        <span className="font-black text-gray-900 text-[14px] md:text-lg tracking-tight">₹{product.price}</span>
                        {product.mrp && <span className="text-[10px] md:text-xs text-gray-400 font-medium line-through">₹{product.mrp}</span>}
                    </div>
                </div>

                {/* Desktop: Dash24 Live Pulse (Hidden on Mobile) */}
                {hasIntentData && (
                    <div className="hidden md:block mb-2 mt-1">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] uppercase tracking-widest text-[#1E3A8A] font-bold flex items-center gap-1.5">
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex h-2 w-2 relative"
                                >
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E3A8A] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E3A8A]"></span>
                                </motion.span>
                                Live Pulse
                            </p>
                        </div>

                        {/* Intent Pills - Single Row (Desktop only shows top 3) */}
                        <div className="flex flex-row items-center justify-start gap-1 mb-1 relative">
                            {['clarification', 'risk', 'comparison'].map((layer) => (
                                <div
                                    key={layer}
                                    className="relative group/pill flex-shrink-0"
                                    onMouseEnter={() => setActiveIntent(layer)}
                                    onMouseLeave={() => setActiveIntent(null)}
                                >
                                    <button
                                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all duration-200 cursor-default text-center flex items-center ${activeIntent === layer
                                            ? INTENT_COLORS[layer] + ' ring-1 shadow-sm'
                                            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 hover:text-gray-700'
                                            }`}
                                    >
                                        {INTENT_LABELS[layer]}
                                    </button>

                                    {/* Absolute Hover Bubble (Tooltip) - Horizontal Stretch */}
                                    <AnimatePresence>
                                        {activeIntent === layer && intentData[layer] && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 md:w-64 bg-[#111827] text-white border border-gray-800 rounded-xl shadow-2xl p-3 z-[60] pointer-events-none"
                                            >
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111827] border-b border-r border-gray-800 rotate-45"></div>
                                                <p className="text-[11px] font-medium leading-[1.6] relative z-10 text-gray-100 line-clamp-3">
                                                    {String(intentData[layer] || '').replace(/^["']|["']$/g, '')}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* Desktop Action Button / Mobile Compact Plus Button */}
                <div className="mt-auto pt-2">
                    {/* 60Mins Badge Nudge */}
                    {((product.name.charCodeAt(0) * 13 + product.name.length) % 10) < 7 && (
                        <div className="mb-2">
                            <span className="inline-flex bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase md:tracking-widest tracking-wider px-1.5 py-0.5 md:py-1 md:px-2 rounded md:rounded-md shadow-sm items-center gap-0.5 md:gap-1 w-max">
                                <span className="text-[10px] md:text-[12px] drop-shadow-sm leading-none">⚡</span><span className="leading-tight">60Mins</span>
                            </span>
                        </div>
                    )}
                    {/* Mobile Button Wrapper */}
                    <div className="flex md:hidden items-center justify-between">
                        <span className="font-black text-gray-900 text-[13px] tracking-tight leading-none text-blue-600">₹{product.price}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        >
                            <span className="text-lg leading-none">+</span>
                        </button>
                    </div>

                    {/* Desktop Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="hidden md:flex w-full py-2.5 rounded-xl text-xs font-bold transition-all relative overflow-hidden group/btn bg-blue-600 text-white border border-[#D1E0FF] hover:bg-blue-700 mt-2 items-center justify-center gap-2"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>➕</span> Add to Cart
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
