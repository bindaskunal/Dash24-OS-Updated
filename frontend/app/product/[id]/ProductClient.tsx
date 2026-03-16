// @ts-nocheck
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../src/context/CartContext';

export default function ProductClient({ product, params }: { product: any, params: { id: string } }) {
    const router = useRouter();
    const { handleAddToCart, setCartOpen } = useCart();

    const [activeTab, setActiveTab] = useState("Comparison");

    const pAny = product as any;
    const intentLayers = pAny.ai_intent_layers || {};

    const tabs = [
        { id: "Overview", icon: "💡", key: "clarification", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
        { id: "Comparison", icon: "⚖️", key: "comparison", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Value", icon: "💎", key: "value", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Outcome", icon: "📈", key: "outcome", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
        { id: "Risk", icon: "🛡️", key: "risk", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        { id: "Personalization", icon: "🎯", key: "personalization", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    ];

    const onAddToCart = () => {
        handleAddToCart(product.name);
        setCartOpen(true);
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24">

            {/* Back Button (Global Header provides main navigation) */}
            <div className="px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition active:scale-95">
                    <span className="text-xl leading-none">←</span>
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Product Details</span>
            </div>

            {/* Image Gallery */}
            <div className="w-full bg-white p-6 md:p-10 mb-2 border-b border-gray-100 flex items-center justify-center">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full max-w-[280px] h-[280px] object-contain drop-shadow-sm mix-blend-multiply"
                />
            </div>

            {/* Core Details */}
            <div className="px-5 py-4 bg-white mb-2 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-wider leading-none">60Mins Delivery</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.brand}</span>
                </div>

                <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">{product.name}</h1>

                <div className="flex items-end gap-3 mb-1">
                    <span className="text-3xl font-black text-gray-900 leading-none">₹{product.price}</span>
                    {product.mrp > product.price && (
                        <span className="text-sm font-bold text-gray-400 line-through leading-none mb-1">₹{product.mrp}</span>
                    )}
                    {product.mrp > product.price && (
                        <span className="text-xs font-bold text-green-600 mb-1 leading-none ml-1">
                            -{Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                        </span>
                    )}
                </div>
            </div>

            {/* LLM Intent Layers (Dash24 Live Pulse) */}
            <div className="px-5 py-3">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">✨</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Live Pulse Insights</h2>
                </div>

                {/* Tab Scroller */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-4 snap-x">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeTab === tab.id
                                ? `${tab.bg} ${tab.color} ${tab.border} shadow-sm`
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className="mr-1.5 text-sm">{tab.icon}</span> {tab.id}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content */}
                <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {tabs.map((tab) => activeTab === tab.id && (
                        <div key={tab.id} className="flex gap-4 items-start">
                            <div className={`w-10 h-10 ${tab.bg} rounded-full flex items-center justify-center text-xl shrink-0 border ${tab.border}`}>
                                {tab.icon}
                            </div>
                            <div>
                                <h3 className={`text-xs font-black uppercase tracking-widest mb-1 ${tab.color}`}>{tab.id} Insight</h3>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    {intentLayers[tab.key] || "Gathering real-time local intelligence..."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spacer to prevent content from hiding behind the taller sticky bar */}
            <div className="h-44 md:h-32"></div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-safe flex flex-col items-center justify-center gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
                <div className="w-full max-w-[600px] mx-auto flex flex-col gap-3">
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onAddToCart}
                            className="flex-1 bg-[#2563eb] text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-[16px] shadow-sm hover:bg-blue-700 transition active:scale-95 flex items-center justify-center border border-[#2563eb]"
                        >
                            Add to Cart <span className="text-lg leading-none ml-1 align-middle">+</span>
                        </button>
                        <button
                            onClick={() => { router.push(`/checkout?express=true&product=${params.id}`); }}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-[16px] font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-1.5 focus:ring-4 hover:shadow-blue-600/30"
                        >
                            <span>⚡</span> Dash it Now
                        </button>
                    </div>
                </div>
            </div>

        </main>
    );
}
