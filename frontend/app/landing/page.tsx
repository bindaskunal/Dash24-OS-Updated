"use client";

import Link from "next/link";
import { useState } from "react";
import ClaimBonusModal from "../../src/components/ClaimBonusModal";

export default function LandingPage() {
    const [customerMobile, setCustomerMobile] = useState("");
    const [fullName, setFullName] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const topBrands = [
        { name: "Snitch", logo: "👔" },
        { name: "Minimalist", logo: "🧴" },
        { name: "True Elements", logo: "🥣" },
        { name: "Sleepy Owl", logo: "☕" },
        { name: "Giva", logo: "✨" },
        { name: "MyFitness", logo: "🥜" },
        { name: "Whole Truth", logo: "🍫" },
        { name: "Plum Goodness", logo: "🌿" },
        { name: "Bella Vita", logo: "🌸" },
        { name: "Nutty Gritties", logo: "🌰" },
        { name: "Bold Care", logo: "💪" },
        { name: "Happilo", logo: "🍇" },
    ];

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-white text-gray-900 font-sans selection:bg-[#00FF41]/30">
            {/* Header */}
            <header className="px-6 md:px-12 py-6 flex items-center justify-between z-50 relative bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tighter text-gray-900 hover:text-emerald-500 transition-colors">DASH24</h1>
                </div>
                <Link href="/" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg active:scale-95">
                    Enter Store
                </Link>
            </header>

            <main className="flex flex-col">
                {/* 1. HERO SECTION: The Funnel */}
                <section className="relative pt-20 pb-24 px-4 overflow-hidden bg-slate-50 flex flex-col items-center">
                    {/* The animated funnel diagram background */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center opacity-30">
                        <div className="relative w-[300px] md:w-[600px] h-[400px]">
                            <svg viewBox="0 0 600 400" className="w-full h-full">
                                <path d="M 50 50 C 250 150, 200 300, 300 350" fill="transparent" stroke="#00FF41" strokeWidth="2" strokeDasharray="4 8" className="animate-[dash_3s_linear_infinite]" />
                                <path d="M 550 50 C 350 150, 400 300, 300 350" fill="transparent" stroke="#00FF41" strokeWidth="2" strokeDasharray="4 8" className="animate-[dash_3s_linear_infinite]" />
                                <path d="M 300 0 L 300 350" fill="transparent" stroke="#00FF41" strokeWidth="2" strokeDasharray="4 8" className="animate-[dash_3s_linear_infinite]" />
                            </svg>
                            {/* Floating Icons dropping into the bag */}
                            <div className="absolute top-[10%] left-[15%] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl animate-[bounce_4s_infinite]">👔</div>
                            <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl animate-[bounce_3s_infinite_100ms]">🧴</div>
                            <div className="absolute top-[15%] right-[15%] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-lg animate-[bounce_3.5s_infinite_300ms]">☕</div>
                        </div>
                    </div>

                    <div className="relative z-10 text-center max-w-4xl mx-auto mt-12 md:mt-16">
                        <div className="inline-flex items-center gap-2 bg-[#00FF41]/10 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold border border-[#00FF41]/20 mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></span>
                            Live in Bangalore
                        </div>
                        
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-gray-900 leading-[1.1]">
                            One Cart. 50+ Top Brands. <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[#00FF41]">Zero Multiple Shipping Fees.</span>
                        </h2>
                        
                        <p className="text-lg md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
                            Stop paying shipping 4 times for 4 different brands. Dash24 combines your favorite D2C items into a single, instant delivery.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#00FF41] text-gray-900 px-8 py-4 rounded-full text-lg font-black uppercase tracking-wide hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] active:scale-95 w-full sm:w-auto"
                            >
                                Register & Claim ₹500
                            </button>
                            <Link href="/" className="bg-white text-gray-900 border-2 border-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors w-full sm:w-auto">
                                Browse Storefront
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 2. VISUAL MATH BANNER */}
                <section className="py-20 md:py-32 px-4 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">The Mathematics of Shopping.</h3>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                            {/* The Problem (Red) */}
                            <div className="bg-red-50 border-2 border-red-100 rounded-[32px] p-8 md:p-12 text-center w-full md:w-1/2 flex flex-col items-center">
                                <span className="bg-white text-red-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm border border-red-100">The Old Way</span>
                                <div className="flex justify-center gap-3 mb-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-red-100 flex items-center justify-center text-2xl">👕</div>
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-red-100 flex items-center justify-center text-2xl">🧴</div>
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-red-100 flex items-center justify-center text-2xl">🥜</div>
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2">3 Different Sites</h4>
                                <div className="space-y-2 mb-6 w-full text-left bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Brand 1 Delivery</span><span className="text-red-500 font-bold">+₹70</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Brand 2 Delivery</span><span className="text-red-500 font-bold">+₹50</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Brand 3 Delivery</span><span className="text-red-500 font-bold">+₹80</span></div>
                                </div>
                                <div className="text-red-500 font-black text-xl bg-white px-6 py-3 rounded-xl border border-red-100 shadow-sm w-full">Total Fees: ₹200</div>
                            </div>

                            <div className="text-gray-300 font-black text-4xl hidden md:block">VS</div>
                            <div className="text-gray-300 font-black text-3xl md:hidden">VS</div>

                            {/* The Solution (Green) */}
                            <div className="bg-emerald-50 border-2 border-[#00FF41]/30 rounded-[32px] p-8 md:p-12 text-center w-full md:w-1/2 flex flex-col items-center shadow-[0_0_40px_rgba(0,255,65,0.1)]">
                                <span className="bg-white text-emerald-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm border border-[#00FF41]/20">The Dash24 Way</span>
                                <div className="w-24 h-24 bg-[#00FF41] rounded-[32px] shadow-lg flex flex-wrap items-center justify-center p-2 gap-1 mb-6 rotate-3">
                                    <span className="text-2xl drop-shadow-md">👕</span>
                                    <span className="text-2xl drop-shadow-md">🧴</span>
                                    <span className="text-2xl drop-shadow-md">🥜</span>
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2">1 Combined Cart</h4>
                                <div className="space-y-4 mb-6 w-full text-left bg-white rounded-xl p-4 shadow-sm border border-[#00FF41]/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Combined AOV crossed ₹999</span>
                                        <span className="text-[#00FF41] font-black text-xl">₹0 Delivery</span>
                                    </div>
                                </div>
                                <div className="bg-gray-900 text-[#00FF41] font-black text-xl px-6 py-3 rounded-xl shadow-lg w-full flex items-center justify-center gap-2">
                                     Instant Savings
                                     <span className="animate-bounce">↑</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. BENEFITS BENTO BOX */}
                <section className="py-20 px-4 bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">Unfair Advantages.</h3>
                            <p className="text-slate-500 text-lg">Designed for maximum convenience and value.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1 */}
                            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    💎
                                </div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-4">Universal Rewards</h4>
                                <p className="text-slate-500 leading-relaxed mb-8">
                                    Earn points buying Snitch shirts, spend them on Minimalist serums. True interoperable loyalty across 50+ D2C brands.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    🏷️
                                </div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-4">Brand-Direct Pricing</h4>
                                <p className="text-slate-500 leading-relaxed mb-8">
                                    No marketplace markups. You pay exactly what you would on their official store, just grouped into a faster delivery.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group">
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    🤖
                                </div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-4">Smart Convenience</h4>
                                <p className="text-slate-500 leading-relaxed mb-8">
                                    Never run out of essentials. Our system learns your consumption rate and intelligently suggests restocks right when you need them.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. BRAND WALL GRID */}
                <section className="py-24 px-4 bg-white border-t border-slate-100">
                     <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-4">The D2C Network</h3>
                            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                                The most requested brands, integrated natively into our micro-fulfillment centers.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {topBrands.map((brand, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border border-slate-100 hover:border-[#00FF41]/50 hover:bg-emerald-50/30 transition-colors cursor-pointer group">
                                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all scale-95 group-hover:scale-110">{brand.logo}</div>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-gray-900 text-center uppercase tracking-widest">{brand.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 text-center">
                            <span className="inline-block bg-slate-100 text-slate-500 px-6 py-2 rounded-full text-sm font-bold border border-slate-200">
                                + 40 More Emerging Brands Added Weekly
                            </span>
                        </div>
                     </div>
                </section>

                {/* Final CTA Bridge */}
                <section className="py-32 px-4 relative flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00FF41]/10 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 max-w-xl mx-auto text-center">
                        <h3 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">Stop waiting. <br/>Start combining.</h3>
                        <p className="text-gray-400 text-lg mb-10">
                            Register now, claim your <span className="text-white font-bold">₹500 Welcome Bonus</span>, and place your first multi-brand order.
                        </p>
                        
                        <form className="flex flex-col gap-4 max-w-sm mx-auto p-8 bg-black/40 border border-white/10 rounded-3xl backdrop-blur-xl" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(true); }}>
                            <input 
                                type="tel" 
                                placeholder="Mobile Number" 
                                value={customerMobile}
                                onChange={(e) => setCustomerMobile(e.target.value)}
                                className="bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 text-center font-mono focus:outline-none focus:border-[#00FF41] transition-colors" 
                            />
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 text-center focus:outline-none focus:border-[#00FF41] transition-colors" 
                            />
                            <button type="submit" className="bg-[#00FF41] text-black font-black py-4 rounded-xl hover:bg-[#00cc33] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] mt-2 uppercase tracking-wide">
                                Activate Account
                            </button>
                        </form>
                    </div>
                </section>

            </main>

            <footer className="bg-gray-900 border-t border-white/10 py-12 text-center text-sm font-mono text-gray-500 flex flex-col items-center">
                <p>&copy; 2026 Dash24 OS. All systems operational.</p>
                <div className="mt-4 flex gap-4 text-xs">
                    <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/" className="hover:text-white transition-colors">Terms</Link>
                    <Link href="/" className="hover:text-white transition-colors">Partner with us</Link>
                </div>
            </footer>

            <ClaimBonusModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
