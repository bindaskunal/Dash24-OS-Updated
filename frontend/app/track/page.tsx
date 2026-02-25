"use client";

import Link from "next/link";
import { useState } from "react";

const ORDERS = [
    {
        id: "ORD-9F3A1",
        date: "Today, 10:42 AM",
        status: "Out for delivery",
        total: 1250,
        items: ["Protein Shake", "Vitamin C Serum"],
        eta: "14 mins"
    },
    {
        id: "ORD-K82M2",
        date: "Yesterday, 4:15 PM",
        status: "Pick & pack",
        total: 890,
        items: ["Energy Bars (Pack of 6)"],
        eta: "Processing"
    },
    {
        id: "ORD-T7L9P",
        date: "Feb 22, 2026",
        status: "Delivered",
        total: 2450,
        items: ["Plant Protein Isolate", "Cold Brew Cans"],
        deliveredTime: "45 mins"
    }
];

export default function TrackPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24">
            <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/" className="w-auto h-10 px-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="text-xl font-black text-gray-900">Track Orders</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-10 pt-8">
                <div className="flex items-center gap-3 mb-8">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">📍 Live Tracking</h2>
                </div>

                <div className="space-y-6 max-w-2xl mx-auto">
                    {ORDERS.map((order, idx) => (
                        <div key={idx} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">

                            {/* Header */}
                            <div className="p-5 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">{order.date}</p>
                                    <p className="font-bold text-sm text-gray-900">{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-gray-900">₹{order.total}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.items.length} Items</p>
                                </div>
                            </div>

                            {order.status === "Out for delivery" && (
                                <div className="p-5">
                                    <div className="w-full h-40 bg-blue-50 rounded-2xl mb-4 relative overflow-hidden border border-blue-100 flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]" />

                                        {/* Dummy Map Route */}
                                        <svg className="absolute w-full h-full text-blue-300" preserveAspectRatio="none">
                                            <path d="M 50 120 Q 150 150 200 80 T 350 50" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="8,8" className="animate-pulse" />
                                        </svg>

                                        {/* Dummy Rider */}
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-green-500 flex items-center justify-center animate-bounce z-10">
                                            🛵
                                        </div>

                                        {/* Dummy Destination */}
                                        <div className="absolute right-10 top-10 w-8 h-8 bg-blue-600 rounded-full shadow-lg flex items-center justify-center z-10 text-white text-xs">
                                            🏠
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                            <h3 className="font-bold text-green-600 text-lg uppercase tracking-wide">{order.status}</h3>
                                        </div>
                                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-black shadow-sm">
                                            ETA: {order.eta}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 mt-3 p-3 bg-gray-50 rounded-xl">Suraj is 1.2km away. Please keep your phone handy.</p>
                                </div>
                            )}

                            {order.status === "Pick & pack" && (
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                                        <h3 className="font-bold text-orange-600 text-lg uppercase tracking-wide">{order.status}</h3>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 mb-4">
                                        Your items are being packed at the node. A rider will be assigned shortly.
                                    </p>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-orange-400 h-2 rounded-full w-[40%] animate-pulse"></div>
                                    </div>
                                </div>
                            )}

                            {order.status === "Delivered" && (
                                <div className="p-6 opacity-80">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                                        <h3 className="font-bold text-gray-600 text-lg uppercase tracking-wide">{order.status}</h3>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Delivered in <span className="font-bold text-gray-900">{order.deliveredTime}</span>.
                                    </p>
                                </div>
                            )}

                            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30 flex gap-2 overflow-x-auto hide-scrollbar">
                                {order.items.map((item, i) => (
                                    <span key={i} className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
