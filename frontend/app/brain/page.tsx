"use client";

import Link from "next/link";
import { Activity, LayoutDashboard, Store, Megaphone, TerminalSquare } from "lucide-react";

export default function BrainHubPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gray-50 opacity-50 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl flex flex-col gap-10">
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <TerminalSquare className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                        Command Hub
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base font-medium">
                        Internal Operations & Management Deck
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Admin Engine */}
                    <Link href="/admin" className="group relative block w-full">
                        <div className="absolute inset-0 bg-blue-50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <div className="relative h-48 bg-white border border-gray-200 hover:border-blue-400 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 transform group-hover:-translate-y-1 shadow-md hover:shadow-xl">
                            <div className="flex items-start justify-between">
                                <Activity className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-700 px-3 py-1 rounded-full border border-gray-200 group-hover:border-blue-200 transition-all">Restricted</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">Admin Engine</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">Superuser controls, catalog management, and core systems.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Operations Dashboard */}
                    <Link href="/dashboard" className="group relative block w-full">
                        <div className="absolute inset-0 bg-blue-50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <div className="relative h-48 bg-white border border-gray-200 hover:border-blue-400 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 transform group-hover:-translate-y-1 shadow-md hover:shadow-xl">
                            <div className="flex items-start justify-between">
                                <LayoutDashboard className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-700 px-3 py-1 rounded-full border border-gray-200 group-hover:border-blue-200 transition-all">Internal</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">Ops Dashboard</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">Real-time metrics, live orders, and node monitoring.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Main Storefront */}
                    <Link href="/" className="group relative block w-full">
                         <div className="absolute inset-0 bg-blue-50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <div className="relative h-48 bg-white border border-gray-200 hover:border-blue-400 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 transform group-hover:-translate-y-1 shadow-md hover:shadow-xl">
                            <div className="flex items-start justify-between">
                                <Store className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-700 px-3 py-1 rounded-full border border-gray-200 group-hover:border-blue-200 transition-all">Public</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">Storefront</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">Consumer-facing marketplace and core purchase flows.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Marketing Front */}
                    <Link href="/landing" className="group relative block w-full">
                         <div className="absolute inset-0 bg-blue-50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <div className="relative h-48 bg-white border border-gray-200 hover:border-blue-400 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 transform group-hover:-translate-y-1 shadow-md hover:shadow-xl">
                             <div className="flex items-start justify-between">
                                <Megaphone className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-700 px-3 py-1 rounded-full border border-gray-200 group-hover:border-blue-200 transition-all">Public</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">Marketing Front</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">Brand landing page, SEO hubs, and customer acquisition.</p>
                            </div>
                        </div>
                    </Link>
                </div>
                
                {/* Status Footer */}
                <div className="flex justify-center mt-8">
                     <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Systems Online | Dash24 Network
                     </span>
                </div>
            </div>
        </div>
    );
}
