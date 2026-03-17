"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { Brain, ChevronRight, Activity, Clock } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useSurgeState } from "../hooks/useSurgeState";

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
    const { addItem, setIsCartOpen } = useCartStore();
    const { isSurgeActive } = useSurgeState();
    const [activeIntent, setActiveIntent] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);

    console.log('Product Bucket:', product.deliveryBucket);

    // Fallback to empty intent object if ai_intent_layers is missing
    const intentData = product.ai_intent_layers || {};
    const hasIntentData = Object.keys(intentData).length > 0;

    const isOutOfStock = (product.deliveryBucket === 'instant' || product.deliveryBucket === 'quick') && product.fulfilledBy !== 'Brand' && (product.stock === 0 || product.stock === undefined);

    return (
        <div className="bg-white rounded-[16px] md:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 overflow-visible group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full relative">

            {/* Product Image & Badges */}
            <div className="relative h-[120px] md:h-[220px] w-full p-2 md:p-6 bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center rounded-t-[16px] md:rounded-t-[24px] overflow-hidden">
                {product.low && (
                    <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-orange-50 text-orange-600 text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 md:py-1 rounded-full border border-orange-100 shadow-sm z-10 hidden group-hover:block transition-opacity">
                        Selling Fast
                    </span>
                )}
                {product.fulfilledBy === 'Brand' && (
                    <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-red-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 md:py-1 rounded-full shadow-md z-10 transition-transform hover:scale-105">
                        FBB
                    </span>
                )}
                <div className="w-[80px] md:w-[140px] h-[80px] md:h-[140px] relative group-hover:scale-105 transition-transform duration-500 md:mt-2">
                    <img 
                        referrerPolicy="no-referrer" 
                        src={imgError ? "https://placehold.co/400x400/1a1a1a/ffffff?text=Image+Coming+Soon" : (product.image_url || "https://placehold.co/400x400/1a1a1a/ffffff?text=Image+Coming+Soon")} 
                        alt={product.name} 
                        loading="lazy" 
                        onError={() => setImgError(true)}
                        className="w-full h-full object-contain filter drop-shadow-sm" 
                    />
                </div>
            </div>

            {/* Product Info */}
            <div className="p-2 md:p-5 flex-1 flex flex-col justify-between cursor-pointer" onClick={handleCardClick || (() => { })}>
                <div>
                    <div className="flex justify-between items-start mb-0.5 md:mb-1">
                        <h3 className="font-bold text-gray-900 text-[11px] md:text-[15px] leading-tight md:leading-snug line-clamp-2">{product.name}</h3>
                    </div>
                    <p className="text-[9px] md:text-[11px] text-gray-500 font-medium mb-1 md:mb-2 line-clamp-1">{product.brand}</p>

                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 mt-1 md:mt-0">
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

                        {/* Intent Pills - Flex Wrap (Shows max 3) */}
                        <div className="flex flex-row items-center justify-start gap-1 mb-1 relative flex-wrap">
                            {Object.keys(intentData).slice(0, 3).map((layer) => (
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



                <div className="mt-auto pt-2">
                    <div className="mb-2">
                        {product.fulfilledBy === 'Brand' || product.fulfilledBy === 'FBB' ? null : (
                            product.deliveryBucket === 'instant' ? (
                                <span className="inline-flex bg-[#FF3B30] text-white font-black text-[9px] uppercase md:tracking-widest tracking-wider px-1.5 py-0.5 md:py-1 md:px-2 rounded md:rounded-md shadow-sm items-center w-max">
                                    30 MIN PULSE
                                </span>
                            ) : product.deliveryBucket === 'quick' ? (
                                <span className={`inline-flex ${isSurgeActive ? "bg-amber-600 text-white" : "bg-[#FFD700] text-gray-900"} font-black text-[9px] uppercase md:tracking-widest tracking-wider px-1.5 py-0.5 md:py-1 md:px-2 rounded md:rounded-md shadow-sm items-center w-max`}>
                                    {isSurgeActive ? "90 MIN (WEATHER SURGE)" : "60 MIN QUICK"}
                                </span>
                            ) : (
                                <span className="inline-flex bg-gray-100 text-gray-600 font-black text-[9px] uppercase md:tracking-widest tracking-wider px-1.5 py-0.5 md:py-1 md:px-2 rounded md:rounded-md shadow-sm items-center w-max">
                                    Standard: 3-5 Days
                                </span>
                            )
                        )}
                    </div>
                    {/* Mobile Button Wrapper */}
                    <div className="flex md:hidden items-center justify-end w-full mt-2">
                        {isOutOfStock ? (
                            <button disabled className="flex items-center justify-center w-full py-2.5 rounded-xl bg-gray-200 text-gray-500 text-[10px] font-bold cursor-not-allowed shadow-inner">
                                Out of Stock
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem({ ...product, id: product.id || product.name, brandName: product.brand || 'Unknown', isFastTrack: product.fulfilledBy !== 'Brand', imageUrl: product.image_url, deliveryBucket: product.deliveryBucket });
                                    setIsCartOpen(true);
                                }}
                                className="flex items-center justify-center w-full py-2.5 rounded-xl bg-[#0066FF] text-white font-black text-xs shadow-md active:scale-95 transition-transform gap-2 hover:bg-blue-700"
                            >
                                <span className="text-sm leading-none font-black">+</span> Add to Cart
                            </button>
                        )}
                    </div>

                    {/* Desktop Button */}
                    {isOutOfStock ? (
                        <button disabled className="hidden md:flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-gray-200 text-gray-500 cursor-not-allowed mt-2">
                            Out of Stock
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addItem({ ...product, id: product.id || product.name, brandName: product.brand || 'Unknown', isFastTrack: product.fulfilledBy !== 'Brand', imageUrl: product.image_url, deliveryBucket: product.deliveryBucket });
                                setIsCartOpen(true);
                            }}
                            className="hidden md:flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-black transition-all relative overflow-hidden group/btn bg-[#0066FF] text-white border border-[#0066FF]/30 hover:bg-blue-700 mt-2 gap-2"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <span>➕</span> Add to Cart
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
