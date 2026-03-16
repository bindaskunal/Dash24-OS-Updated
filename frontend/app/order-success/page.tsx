"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "../../src/store/useCartStore";

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get('orderId');
    
    const [mounted, setMounted] = useState(false);
    const { getTotalAmount } = useCartStore();
    const [statusStep, setStatusStep] = useState(0); // 0: Confirmed, 1: Packing, 2: Out, 3: Arrived
    const [riderPos, setRiderPos] = useState({ top: 30, left: 30 }); // Percentage coordinates

    // Agentic Pulse State
    const [pulseStep, setPulseStep] = useState(0);
    const [pulseText, setPulseText] = useState("");
    const pulseLogs = [
        "Locality: Securing inventory near you...",
        "Intent: Fast tracking your order via Priority Node...",
        "Logistics: Rider assigned - ETA 14 Mins...",
        "Solution: Package verified & secure."
    ];

    useEffect(() => {
        setMounted(true);

        const statusInterval = setInterval(() => {
            setStatusStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 10000);

        const riderInterval = setInterval(() => {
            setRiderPos(prev => ({
                top: Math.max(10, Math.min(90, prev.top + (Math.random() * 20 - 10))),
                left: Math.max(10, Math.min(90, prev.left + (Math.random() * 20 - 10)))
            }));
        }, 30000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(riderInterval);
        };
    }, []);

    // Agentic Pulse Typewriter Effect
    useEffect(() => {
        if (!mounted || pulseStep >= pulseLogs.length) return;

        const currentLog = pulseLogs[pulseStep];
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            if (charIndex <= currentLog.length) {
                setPulseText(currentLog.substring(0, charIndex));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    setPulseStep(prev => prev + 1);
                }, 2000);
            }
        }, 40);

        return () => clearInterval(typeInterval);
    }, [mounted, pulseStep]);

    if (!mounted) return null;

    const orderTotal = getTotalAmount() || 1250; 
    const displayOrderId = orderIdParam || `#DSH-${Math.floor(Math.random() * 90000) + 10000}`;

    // Section 1: The Tracking Map (Light Theme)
    const TrackingMap = () => (
        <div className="bg-white border rounded-3xl overflow-hidden w-full h-[300px] md:h-96 relative shadow-sm flex flex-col">
           <div className="flex-1 relative bg-slate-50 overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 20%, #e2e8f0 2px, transparent 2px), radial-gradient(circle at 80% 80%, #00FF41 2px, transparent 2px)',
                    backgroundSize: '40px 40px'
                }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0 100 Q 150 50 300 200 T 600 150 T 1000 300" stroke="#cbd5e1" strokeWidth="2" fill="transparent" />
                        <path d="M 100 0 Q 50 150 200 300 T 150 600 T 300 1000" stroke="#cbd5e1" strokeWidth="2" fill="transparent" />
                    </svg>
                </div>

                <div className="absolute top-[20%] left-[20%] w-6 h-6 bg-white border-4 border-[#00FF41] rounded-full shadow-[0_0_15px_rgba(0,255,65,0.3)] z-10" />
                <div className="absolute top-[80%] left-[80%] w-6 h-6 bg-white border-4 border-slate-300 rounded-full shadow-sm z-10" />

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#00FF41" strokeWidth="2" strokeDasharray="6 6" className="opacity-80 animate-[pulse_2s_infinite]" />
                </svg>

                {statusStep >= 2 && statusStep < 3 && (
                    <div
                        className="absolute w-12 h-12 -ml-6 -mt-6 bg-[#00FF41] rounded-full flex items-center justify-center text-xl shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all duration-[20s] ease-linear z-20 text-white border-2 border-white"
                        style={{ top: `${riderPos.top}%`, left: `${riderPos.left}%` }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M15 15v3.375c0 .344.116.662.312.915a3 3 0 1 1 5.376 0c.196-.253.312-.571.312-.915V13.5h-5.918l-.082-.02A19.431 19.431 0 0 0 15 15Z" />
                        </svg>
                    </div>
                )}
            </div>
            
            <div className="bg-slate-50 border-t p-4 shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[#00FF41] font-black animate-pulse text-sm">⚡</span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-slate-700 font-mono tracking-tight leading-snug">
                        {pulseStep < pulseLogs.length ? (
                            <>
                                {pulseText}
                                <span className="inline-block w-1.5 h-3 bg-[#00FF41] ml-1 animate-pulse align-middle" />
                            </>
                        ) : (
                            <span className="text-emerald-700">System: Optimal route locked.</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );

    // Predictive Restock Module (Mocked Auto-Add functionality retaining clean light UI)
    const PredictiveRestockModule = () => {
        const resetItems = [
            { name: "Face Wash", category: "Skincare", cycle: "Every 30 Days", icon: "🧴", price: 349 },
            { name: "Peanut Butter", category: "Pantry", cycle: "Every 15 Days", icon: "🥜", price: 420 },
            { name: "Ashwagandha", category: "Supplements", cycle: "Every 45 Days", icon: "💊", price: 599 },
            { name: "Coffee Pods", category: "Beverages", cycle: "Every 10 Days", icon: "☕", price: 299 },
        ];

        return (
            <div className="mt-12 py-10 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                            Predictive Restock
                        </h2>
                        <p className="text-slate-500 font-medium">Smart suggestions for your next order based on consumption rates.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full mt-4 md:mt-0">
                        <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></span> Auto-Add Engine Active
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {resetItems.map((item, idx) => (
                        <div key={idx} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-[#00FF41] transition-colors" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl border">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF41] bg-emerald-50 px-2 py-1 rounded-md">
                                    {item.cycle}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-xs text-slate-400 mb-4">{item.category}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <span className="font-black text-gray-900">₹{item.price}</span>
                                <button className="text-sm font-extrabold text-[#00FF41] hover:text-emerald-600 transition-colors uppercase tracking-wider">
                                    Schedule +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden p-0 bg-slate-50 text-gray-900 font-sans selection:bg-[#00FF41]/30 pb-20 md:pb-0">
            {/* Header */}
            <div className="p-4 md:px-8 border-b bg-white sticky top-0 z-50 flex items-center justify-between h-16 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">DASH24</h1>
                </div>
                <Link href="/" className="px-5 py-2 rounded-full border text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">
                    Back to Store
                </Link>
            </div>

            <div className="max-w-6xl mx-auto w-full flex flex-col pt-8 md:pt-12 px-4 md:px-8 gap-8">
                
                {/* HEADLINE */}
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Order Confirmed.
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 font-medium">
                        Sit tight, it's on the way.
                    </p>
                </div>

                {/* SECTION 1: Utility First (Top Fold) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left: Map (First on Mobile) */}
                    <div className="order-1">
                        <TrackingMap />
                    </div>

                    {/* Right: Order Status & Minimal Receipt */}
                    <div className="order-2 flex flex-col gap-6">
                        <div className="bg-white border rounded-3xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">Live Status</h3>
                            <div className="flex items-end gap-3 mb-6">
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
                                    {statusStep < 3 ? "14 mins" : "Arrived"}
                                </h2>
                                {statusStep < 3 && <span className="text-lg text-slate-500 font-medium mb-1">ETA</span>}
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div 
                                    className="h-full bg-[#00FF41] rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(statusStep / 3) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-400">
                                <span className={statusStep >= 0 ? "text-gray-900" : ""}>Confirmed</span>
                                <span className={statusStep >= 1 ? "text-gray-900" : ""}>Packing</span>
                                <span className={statusStep >= 2 ? "text-gray-900" : ""}>En Route</span>
                            </div>
                        </div>

                        <div className="bg-white border rounded-3xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Order Summary</h3>
                                <span className="font-mono text-xs md:text-sm text-slate-500 truncate max-w-[150px]">{displayOrderId}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">🛍️</div>
                                    <span className="font-medium text-slate-700">Dash24 Combined Delivery</span>
                                </div>
                                <span className="font-bold text-gray-900">₹{orderTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Predictive Restock */}
                <PredictiveRestockModule />
                
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-500 font-bold">Loading Order...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
