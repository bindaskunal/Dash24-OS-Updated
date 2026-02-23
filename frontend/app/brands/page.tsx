"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const BRAND_LOGOS: Record<string, string> = {
    "The Whole Truth": "https://miro.medium.com/v2/resize:fit:720/format:webp/1*rM8a2mpgfcZc4WtiHJYC0A.png",
    "Minimalist": "https://media.licdn.com/dms/image/v2/C4D0BAQGEeX1h2U7TwQ/company-logo_200_200/company-logo_200_200/0/1646895741612/beminimalist_logo?e=1773273600&v=beta&t=nMyqQ-FzZJtt9HfVEdLpi9Os7txGkLB92DQYz5TA_0Q",
    "What's Up Wellness": "https://whatsupwellness.in/cdn/shop/files/rectangle_WUW_logo1x_120x.svg?v=1708696270",
    "Kapiva": "https://bazaar5.com/image/catalog/pro/category/100631.jpg",
    "Titan": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Titan_Company_Logo.jpg",
    "Nothing": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nothing_Logo.svg",
    "Blue Tokai": "https://bluetokaicoffee.com/cdn/shop/files/BT_Logo_200x.png?v=1614332927",
    "Snitch": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nothing_Logo.svg"
};

const CATEGORIES = [
    "All Categories",
    "Health & Nutrition",
    "Beauty & Personal Care",
    "Electronics Wearables",
    "Fashion & Apparel"
];

const BRAND_CATEGORIES: Record<string, string[]> = {
    "Health & Nutrition": ["The Whole Truth", "Kapiva", "Blue Tokai", "What's Up Wellness"],
    "Beauty & Personal Care": ["Minimalist", "What's Up Wellness"],
    "Electronics Wearables": ["Titan", "Nothing"],
    "Fashion & Apparel": ["Snitch"]
};

export default function BrandsPage() {
    const [activeCategory, setActiveCategory] = useState("All Categories");

    const displayedBrands = activeCategory === "All Categories"
        ? Object.keys(BRAND_LOGOS)
        : BRAND_CATEGORIES[activeCategory] || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/" className="w-auto h-10 px-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition">
                            <img src="/logo.png?v=2" alt="Dash24" className="h-6 w-auto object-contain drop-shadow-sm" />
                        </Link>
                        <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-gray-700">
                            <Link href="/" className="cursor-pointer transition pb-1 border-b-2 border-transparent hover:border-[#F97316] hover:text-[#F97316]">Home</Link>
                            <Link href="/brands" className="cursor-pointer transition pb-1 border-b-2 border-[#F97316] text-[#F97316]">Brands</Link>
                            <span className="cursor-pointer transition pb-1 border-b-2 border-transparent hover:border-[#F97316] hover:text-[#F97316]">Arcade</span>
                            <span className="cursor-pointer transition pb-1 border-b-2 border-transparent hover:border-[#F97316] hover:text-[#F97316]">Track</span>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-10 mt-10">

                {/* HERO SECTION */}
                <div className="bg-gradient-to-br from-[#111827] via-gray-900 to-[#1e293b] px-10 py-12 relative overflow-hidden rounded-[24px] mb-12 border border-gray-800 shadow-xl text-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
                    <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                        <div className="inline-flex items-center gap-3 mb-4 w-max">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]"></span>
                            <h1 className="text-4xl font-black tracking-tight text-yellow-400 drop-shadow-lg">
                                100% Genuine Partner Brands
                            </h1>
                        </div>
                        <p className="text-gray-300 font-medium text-lg leading-relaxed">
                            Discover our curated network of top Direct-to-Consumer brands, sourced directly from their warehouses via our 60 min Sovereign Fulfillment network.
                        </p>
                    </div>
                </div>

                {/* FEATURED BRANDS (Horizontal Scroll) */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <span className="text-orange-500 text-2xl">★</span> Featured Brands
                        </h2>
                    </div>
                    <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x">
                        {Object.keys(BRAND_LOGOS).map((brandKey, idx) => (
                            <div key={idx} className="snap-start flex-shrink-0 w-48 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1">
                                <div className="w-full h-32 flex items-center justify-center mb-4 p-4">
                                    <img src={BRAND_LOGOS[brandKey]} alt={brandKey} className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition duration-500" />
                                </div>
                                <h3 className="text-center font-bold text-gray-800">{brandKey}</h3>
                                <p className="text-center text-[10px] text-orange-500 font-bold tracking-widest uppercase mt-2 opacity-0 group-hover:opacity-100 transition">Shop Now</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BROWSE BY CATEGORY */}
                <section>
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <span className="text-blue-500 text-2xl">❖</span> Browse by Category
                    </h2>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${activeCategory === category
                                    ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-500 hover:text-blue-600'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Brand Grid */}
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
                        >
                            {displayedBrands.map(brandKey => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={brandKey}
                                    className="bg-white border border-gray-100 rounded-[2rem] p-5 flex flex-col items-center justify-center hover:shadow-xl hover:border-blue-200 transition-all group cursor-pointer h-48"
                                >
                                    <div className="w-full flex-1 flex items-center justify-center p-2 mb-2">
                                        <img src={BRAND_LOGOS[brandKey]} alt={brandKey} className="max-w-full max-h-full object-contain filter group-hover:scale-110 transition duration-300" />
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 text-center">{brandKey}</h3>
                                </motion.div>
                            ))}
                            {displayedBrands.length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-500 font-medium">
                                    No brands found for this category.
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </section>

            </main>
        </div>
    );
}
