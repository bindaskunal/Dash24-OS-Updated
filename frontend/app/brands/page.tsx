"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BRAND_LOGOS, MASTER_CATALOG } from "../../src/data/constants";

const BRAND_CATEGORIES = [
    { name: "Health & Wellness", img: "/icon-health.png" },
    { name: "Beauty", img: "/icon-beauty.PNG" },
    { name: "Electronics", img: "/icon-electronics.png" },
    { name: "Wearables", img: "/icon-Wearables.PNG" },
    { name: "Snacks", img: "/icon-Snacks.PNG" },
    { name: "Fashion", img: "/icon-Fashion.PNG" },
];

export default function BrandsPage() {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const FEATURED_BRANDS = ["The Whole Truth", "Minimalist", "Snitch"];
    const TRENDING_BRANDS = ["Cult Fit", "boAt", "Noise", "Sleepy Owl"];

    const allBrands = useMemo(() => Object.keys(BRAND_LOGOS).sort(), []);

    const brandsByLetter = useMemo(() => {
        const map: Record<string, string[]> = {};
        allBrands.forEach(brand => {
            const char = brand[0].toUpperCase();
            if (!map[char]) map[char] = [];
            map[char].push(brand);
        });
        return map;
    }, [allBrands]);

    const sortedLetters = useMemo(() => Object.keys(brandsByLetter).sort(), [brandsByLetter]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-32 overflow-x-hidden">

            <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
                {/* HERO */}
                <div className="bg-[#111827] rounded-[32px] p-8 md:p-12 mb-12 relative overflow-hidden text-center border border-gray-800 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">100% Genuine</span>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Official Brand Stores</h1>
                        <p className="text-gray-400 max-w-xl text-sm md:text-base font-medium">Hyperlocal fulfillment directly from official brands. No middlemen, total authenticity.</p>
                    </div>
                </div>

                {/* FEATURED SECTION */}
                <section className="mb-12">
                    <div className="flex justify-between items-end mb-6 px-1">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">★ Featured Brands</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {FEATURED_BRANDS.map(brand => (
                            <div key={brand} onClick={() => setSelectedBrand(brand)} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center">
                                <div className="w-24 h-24 mb-4 flex items-center justify-center p-4">
                                    <img referrerPolicy="no-referrer" src={BRAND_LOGOS[brand]} alt={brand} className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition duration-500" />
                                </div>
                                <h3 className="text-sm font-black text-gray-900">{brand}</h3>
                                <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest mt-2">{MASTER_CATALOG.filter(p => p.brand === brand).length} Products</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BRAND CATEGORIES */}
                <section className="mb-12">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6 px-1">📁 Brand Categories</h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {BRAND_CATEGORIES.map(cat => (
                            <div key={cat.name} className="flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center p-1 group-hover:scale-110 transition group-active:scale-95">
                                    <img referrerPolicy="no-referrer" src={cat.img} alt="" className="w-3/4 h-3/4 object-contain" />
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-gray-700 text-center px-1 line-clamp-1">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TRENDING SECTION */}
                <section className="mb-12">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6 px-1">🔥 Trending Now</h2>
                    <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
                        {TRENDING_BRANDS.map(brand => (
                            <div key={brand} onClick={() => setSelectedBrand(brand)} className="flex-shrink-0 w-36 md:w-48 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center">
                                <div className="w-16 h-16 md:w-20 md:h-20 mb-3 flex items-center justify-center">
                                    <img referrerPolicy="no-referrer" src={BRAND_LOGOS[brand]} alt={brand} className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition" />
                                </div>
                                <h3 className="text-[11px] md:text-sm font-bold text-gray-900 text-center">{brand}</h3>
                            </div>
                        ))}
                    </div>
                </section>

                {/* A-Z LIST */}
                <section className="bg-white rounded-[32px] p-8 md:p-12 border border-gray-100 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">A-Z All Brands</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                        {sortedLetters.map(letter => (
                            <div key={letter} className="flex flex-col gap-3">
                                <span className="text-3xl font-black text-gray-200 border-b border-gray-100 pb-2">{letter}</span>
                                <div className="flex flex-col gap-2">
                                    {brandsByLetter[letter].map(brand => (
                                        <button key={brand} onClick={() => setSelectedBrand(brand)} className="text-left py-1 text-sm font-bold text-gray-600 hover:text-[#F97316] hover:translate-x-1 transition flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#F97316]"></div>
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* BRAND PROFILE OVERLAY (REUSED FROM HOME) */}
            {selectedBrand && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-6">
                    <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#111827] to-[#1E3A8A] text-white p-8 md:p-12 relative flex-shrink-0">
                            <button onClick={() => setSelectedBrand(null)} className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition text-xl font-bold">✕</button>
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl mb-4 md:mb-6 flex items-center justify-center overflow-hidden p-3 md:p-4 shadow-2xl">
                                <img referrerPolicy="no-referrer" src={BRAND_LOGOS[selectedBrand]} alt={selectedBrand} className="object-contain w-full h-full mix-blend-multiply" />
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2">{selectedBrand}</h2>
                            <p className="text-xs font-medium text-blue-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                                Official Store Verified • 60min Fulfillment
                            </p>
                        </div>
                        <div className="p-6 md:p-12 overflow-y-auto bg-[#F8FAFC]">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {MASTER_CATALOG.filter(i => i.brand === selectedBrand).map(item => (
                                    <div key={item.name} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition flex flex-col">
                                        <div className="aspect-square bg-[#F8FAFC] rounded-2xl mb-4 flex items-center justify-center p-3 relative overflow-hidden group">
                                            <img referrerPolicy="no-referrer" src={item.image_url} alt={item.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition duration-500" />
                                            {item.low && <span className="absolute top-2 right-2 text-[8px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">LowStock</span>}
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-900 leading-tight mb-2 flex-1">{item.name}</p>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-sm font-black text-gray-900">₹{item.price}</span>
                                            <span className="text-[10px] text-gray-400 line-through">₹{item.mrp}</span>
                                        </div>
                                        <button className="w-full py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition">Add to Cart</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MOBILE BOTTOM NAV PLACEHOLDER - FOR CONSISTENCY */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-4">
                <Link href="/" className="flex flex-col items-center gap-1 opacity-50"><span className="text-xl">🏠</span><span className="text-[9px] font-bold">Home</span></Link>
                <Link href="/brands" className="flex flex-col items-center gap-1 text-[#F97316]"><span className="text-xl">🏢</span><span className="text-[9px] font-bold">Brands</span></Link>
                <Link href="/arcade" className="flex flex-col items-center gap-1 opacity-50"><span className="text-xl">🎮</span><span className="text-[9px] font-bold">Arcade</span></Link>
                <Link href="/track" className="flex flex-col items-center gap-1 opacity-50"><span className="text-xl">📍</span><span className="text-[9px] font-bold">Track</span></Link>
            </div>
        </div>
    );
}
