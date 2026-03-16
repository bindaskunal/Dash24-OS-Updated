"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabaseClient";

interface Brand {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    image_url: string;
    stock_inventory: number;
    replenishment_period_days: number;
    brands: Brand;
}

const DAILY_SALES_VELOCITY = 5;

type HealthStatus = 'Healthy' | 'Restock Required' | 'Critical/Stockout';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    const seedDatabase = async () => {
        if (!confirm("Caution: This will execute the database seeding script. Proceed?")) return;
        try {
            setSeeding(true);
            setToastMessage("Seeding in progress... please wait.");
            const res = await fetch("/api/admin/seed", { method: "POST" });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to seed database.");

            setToastMessage(`Success! Seeded ${result.brandsInserted} brands and ${result.productsInserted} products.`);
            fetchInventory();
        } catch (err: any) {
            console.error("Seeding Error:", err);
            setError(err.message);
        } finally {
            setSeeding(false);
            setTimeout(() => setToastMessage(null), 5000);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select(`*, brands(id, name)`)
                .order("stock_inventory", { ascending: true }); // Show lowest stock first

            if (error) throw error;
            setProducts(data || []);
        } catch (err: any) {
            console.error("Error fetching inventory:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const generatePO = (product: Product) => {
        const threshold = product.replenishment_period_days * DAILY_SALES_VELOCITY;
        const suggestion = Math.max(threshold * 2, 50); // Suggest 2x threshold or at least 50

        setToastMessage(`PO Generated: ${suggestion} units of ${product.name} requested from ${product.brands?.name || 'Vendor'}.`);

        setTimeout(() => setToastMessage(null), 4000);
    };

    const getHealthStatus = (stock: number, days: number): { status: HealthStatus, color: string, bg: string, threshold: number } => {
        const threshold = days * DAILY_SALES_VELOCITY;

        if (stock === 0) {
            return { status: 'Critical/Stockout', color: 'text-red-700', bg: 'bg-red-100', threshold };
        } else if (stock <= threshold) {
            return { status: 'Restock Required', color: 'text-amber-700', bg: 'bg-amber-100', threshold };
        } else {
            return { status: 'Healthy', color: 'text-green-700', bg: 'bg-green-100', threshold };
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
                <h2 className="text-red-600 font-bold mb-2">Error Loading Inventory</h2>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button onClick={fetchInventory} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition">Retry</button>
            </div>
        </div>
    );

    const criticalItems = products.filter(p => (p.stock_inventory || 0) === 0).length;
    const restockItems = products.filter(p => (p.stock_inventory || 0) > 0 && (p.stock_inventory || 0) <= ((p.replenishment_period_days || 1) * DAILY_SALES_VELOCITY)).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -mt-40 -mr-40" />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                        <p className="font-bold text-sm">{toastMessage}</p>
                    </div>
                </div>
            )}


            <main className="max-w-[1400px] mx-auto px-4 md:px-10 pt-8 relative z-10">

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-2xl border border-gray-100">📦</div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total SKUs Configured</p>
                            <p className="text-3xl font-black text-gray-900">{products.length}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 border border-red-100 shadow-[0_8px_30px_rgb(239,68,68,0.12)] flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-red-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-2xl relative z-10">🚨</div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Critical Stockouts</p>
                            <p className="text-3xl font-black text-red-700">{criticalItems}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 border border-amber-100 shadow-[0_8px_30px_rgb(245,158,11,0.12)] flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-2xl relative z-10">⚠️</div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Restock Required</p>
                            <p className="text-3xl font-black text-amber-700">{restockItems}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                📊 Automated Inventory Monitor
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                            </h2>
                            <p className="text-gray-500 font-medium mt-1 text-sm">Dynamic health calculated at <span className="font-bold text-gray-700">{DAILY_SALES_VELOCITY} units/day</span> velocity assumption.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={seedDatabase}
                                disabled={seeding}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white border border-indigo-700 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                {seeding ? "Seeding..." : "Seed Database"}
                            </button>
                            <button onClick={fetchInventory} className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                Refresh Data
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                                    <th className="p-4 md:p-6 w-[350px]">Product & SKU</th>
                                    <th className="p-4 md:p-6">Brand Partner</th>
                                    <th className="p-4 md:p-6 text-center">Lead Time (Days)</th>
                                    <th className="p-4 md:p-6 text-center">Critical Threshold</th>
                                    <th className="p-4 md:p-6 text-center">Current Stock</th>
                                    <th className="p-4 md:p-6">Health Indicator</th>
                                    <th className="p-4 md:p-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.map((product) => {
                                    const { status, color, bg, threshold } = getHealthStatus(product.stock_inventory || 0, product.replenishment_period_days || 1);
                                    const isAtRisk = status === 'Restock Required' || status === 'Critical/Stockout';

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 p-1">
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mt-0.5">{product.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                                                    {product.brands?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-center font-bold text-gray-600">
                                                {product.replenishment_period_days || "N/A"}
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className="font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-xs">
                                                    {threshold} units
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-center">
                                                <span className={`font-black text-lg ${(product.stock_inventory || 0) === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {product.stock_inventory || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${bg} ${color} border border-white/20 shadow-sm`}>
                                                    {status === 'Critical/Stockout' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                                                    {status === 'Restock Required' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                                                    {status === 'Healthy' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-right">
                                                {isAtRisk ? (
                                                    <button
                                                        onClick={() => generatePO(product)}
                                                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 hover:shadow-xl hover:shadow-gray-200 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-gray-200 inline-flex items-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                        Generate PO
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-300 italic">No Action Needed</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
