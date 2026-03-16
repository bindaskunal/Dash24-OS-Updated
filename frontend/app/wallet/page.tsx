"use client";

import { useUserStore } from "../../src/store/useUserStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WalletPage() {
    const pulsePointsRaw = useUserStore(state => state.pulsePoints);
    const isAuthenticatedRaw = useUserStore(state => state.isAuthenticated);
    
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect to landing if not authenticated
    useEffect(() => {
        if (mounted && !isAuthenticatedRaw) {
            router.push('/landing');
        }
    }, [mounted, isAuthenticatedRaw, router]);

    if (!mounted || !isAuthenticatedRaw) return null; // Prevent hydration mismatch

    const pulsePoints = pulsePointsRaw;

    const transactions = [
        { id: 1, date: "Today, 10:45 AM", description: "Welcome Bonus", amount: "+500", validity: "Valid until Apr 14, 2026", type: "credit" },
        { id: 2, date: "Yesterday, 2:15 PM", description: "Snitch Signature Shirt - Refund", amount: "+120", validity: "Valid until Jun 30, 2026", type: "credit" },
        { id: 3, date: "Mar 10, 8:30 PM", description: "Minimalist Order #D4589", amount: "-50", validity: "Used", type: "debit" },
        { id: 4, date: "Mar 1, 1:00 PM", description: "Signup Referral (Alex)", amount: "+100", validity: "Valid until Dec 31, 2026", type: "credit" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <div className="max-w-3xl mx-auto px-4 pt-8 md:pt-12">
                
                {/* Header Back Button */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-gray-900 font-bold transition-colors text-sm">
                        <span>←</span> Back to Store
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Pulse Wallet</h1>
                    <p className="text-slate-500 font-medium mt-1">Your unified rewards and balance.</p>
                </div>

                {/* Focus Card */}
                <div className="bg-gray-900 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-gray-900/20 mb-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF41]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></span>
                                Available Balance
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-7xl font-black tracking-tighter">₹{pulsePoints}</span>
                                <span className="text-xl text-gray-400 font-bold">.00</span>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl md:text-right w-full md:w-auto">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
                            <p className="text-[#00FF41] font-black text-lg">Active</p>
                            <div className="mt-2 text-xs text-gray-400 flex items-center gap-2 md:justify-end">
                                <span>🪙</span> 1 Pulse = ₹1
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Ledger */}
                <div>
                    <h2 className="text-xl font-black text-gray-900 mb-6">Recent Activity</h2>
                    
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="p-5 hover:bg-slate-50 transition-colors flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm border ${tx.type === 'credit' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                            {tx.type === 'credit' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{tx.description}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{tx.date}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-left sm:text-right w-full sm:w-auto pl-16 sm:pl-0">
                                        <p className={`font-black text-lg ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                            {tx.amount}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">{tx.validity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
