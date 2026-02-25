"use client";

import Link from "next/link";

export default function ArcadePage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24">
            <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/" className="w-auto h-10 px-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="text-xl font-black text-gray-900">Arcade Hub</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-10 pt-8">
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">🎮 Arcade</h2>
                    <span className="text-[10px] bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Play & Earn</span>
                </div>
                <p className="text-gray-500 font-medium mb-8">Win coins, discounts, and exclusive deals by playing games.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* 🎰 777 Spin & Win */}
                    <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-[24px] p-8 text-white relative overflow-hidden cursor-pointer group hover:shadow-2xl transition-all h-64 flex flex-col items-start justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-4 -translate-y-4 blur-xl group-hover:scale-150 transition-transform" />
                        <div className="text-6xl mb-4 drop-shadow-lg">🎰</div>
                        <h3 className="text-3xl font-black mb-2 tracking-tight">777 Spin & Win</h3>
                        <p className="text-sm font-bold opacity-90 mb-4 tracking-wide">Match 3 to win big prizes</p>
                        <div className="flex gap-2">
                            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">🪙 Free Spin Daily</span>
                        </div>
                    </div>

                    {/* ⚔️ 1:1 Neighbor Battle */}
                    <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-[#1E3A8A] to-[#111827] rounded-[24px] p-8 text-white relative overflow-hidden cursor-pointer group hover:shadow-2xl transition-all h-64 flex flex-col items-start justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                        <div className="text-6xl mb-4">⚔️</div>
                        <h3 className="text-3xl font-black mb-2 tracking-tight">1:1 Battle</h3>
                        <p className="text-sm font-bold opacity-80 mb-4 tracking-wide">Challenge your neighbor</p>
                        <span className="bg-blue-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-blue-500/50">🏆 Win Free Shipping</span>
                    </div>

                    {/* 📊 Daily Pulse Match */}
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[24px] p-6 text-white relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all h-48 flex flex-col justify-center items-center text-center">
                        <div className="text-4xl mb-3">📊</div>
                        <h3 className="text-lg font-black mb-1 tracking-tight">Daily Pulse Match</h3>
                        <p className="text-[10px] uppercase font-bold opacity-80 mb-3">Predict trending items</p>
                    </div>

                    {/* 🏦 The Sunday Vault */}
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-violet-600 to-purple-900 rounded-[24px] p-6 text-white relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all h-48 flex flex-col justify-center items-center text-center">
                        <div className="text-4xl mb-3">🏦</div>
                        <h3 className="text-lg font-black mb-1 tracking-tight">Sunday Vault</h3>
                        <p className="text-[10px] uppercase font-bold opacity-80 mb-3">Weekly mega rewards</p>
                    </div>

                    {/* 🎫 Scratch & Win */}
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[24px] p-6 text-white relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all h-48 flex flex-col justify-center items-center text-center">
                        <div className="text-4xl mb-3">🎫</div>
                        <h3 className="text-lg font-black mb-1 tracking-tight">Scratch & Win</h3>
                        <p className="text-[10px] uppercase font-bold opacity-80 mb-3">Guaranteed Prize</p>
                    </div>

                    {/* 🔥 Streak Bonus */}
                    <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500 to-orange-700 rounded-[24px] p-6 text-white relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all h-48 flex flex-col justify-center items-center text-center">
                        <div className="text-4xl mb-3">🔥</div>
                        <h3 className="text-lg font-black mb-1 tracking-tight">Streak Bonus</h3>
                        <p className="text-[10px] uppercase font-bold opacity-80 mb-3">Order daily, earn more</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
