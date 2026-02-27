"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';
import SIMULATED_ORDERS from '../../data/simulated_orders.json';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b'];

import TheBrainWidget from '../../src/components/TheBrainWidget';
import InventoryRadar from '../../src/components/InventoryRadar';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'simulator' | 'monthly' | 'brand'>('simulator');
    const [selectedBrand, setSelectedBrand] = useState('Mamaearth');

    // Tier 2: Simulator State
    const [baseTraffic, setBaseTraffic] = useState(4000);
    const [piggybackConv, setPiggybackConv] = useState(10);
    const [appDownloadPct, setAppDownloadPct] = useState(20);
    const [aiSearchConv, setAiSearchConv] = useState(15);
    const [autoCartPct, setAutoCartPct] = useState(5);
    const [paidBudget, setPaidBudget] = useState(50000);
    const [paidCac, setPaidCac] = useState(850);

    // Simulator Math Logic
    const simMetrics = useMemo(() => {
        const webPiggybackOrders = Math.round(baseTraffic * (piggybackConv / 100));
        const webAiSearchOrders = Math.round(baseTraffic * (aiSearchConv / 100));
        const webPaidOrders = Math.round(paidBudget / paidCac);

        const totalWebOrders = webPiggybackOrders + webAiSearchOrders + webPaidOrders;

        const appDownloads = Math.round(totalWebOrders * (appDownloadPct / 100));
        const appGamificationOrders = Math.round(appDownloads * 0.30);
        const appSubscriptionOrders = Math.round(appDownloads * (autoCartPct / 100));

        const totalAppOrders = appGamificationOrders + appSubscriptionOrders;
        const totalPlatformOrders = totalWebOrders + totalAppOrders;

        const blendedCac = totalPlatformOrders > 0 ? (paidBudget / totalPlatformOrders) : 0;
        const aov = 450;
        const projectedGmv = totalPlatformOrders * aov;

        const orderSourcesData = [
            { name: 'Piggyback (Web)', orders: webPiggybackOrders },
            { name: 'AI Search (Web)', orders: webAiSearchOrders },
            { name: 'Paid Ads (Web)', orders: webPaidOrders },
            { name: 'Gamification (App)', orders: appGamificationOrders },
            { name: 'Subscriptions (App)', orders: appSubscriptionOrders }
        ].sort((a, b) => b.orders - a.orders);

        const pointsIssued = totalPlatformOrders * 45;
        const pointsBurned = appGamificationOrders * 100;

        return {
            totalPlatformOrders, blendedCac, appDownloads, projectedGmv,
            orderSourcesData, pointsIssued, pointsBurned,
            webPiggybackOrders, appGamificationOrders, totalWebOrders
        };
    }, [baseTraffic, piggybackConv, appDownloadPct, aiSearchConv, autoCartPct, paidBudget, paidCac]);

    // Monthly Overview Mock/Derived Data
    const monthlyData = useMemo(() => {
        // Generate daily volume trends for 30 days
        const dailyVolume = Array.from({ length: 30 }).map((_, i) => ({
            day: `Day ${i + 1}`,
            organic: Math.floor(100 + Math.random() * 50),
            paid: Math.floor(20 + Math.random() * 30),
            gamified: Math.floor(40 + Math.random() * 40),
        }));

        const campaigns = [
            { name: 'Sunday Vault', runs: 4, conversions: 1250, revenue: '₹5.6L', cac: '₹45' },
            { name: 'Community Drop', runs: 8, conversions: 3400, revenue: '₹14.2L', cac: '₹12' },
            { name: 'Live Pulse Flash', runs: 15, conversions: 890, revenue: '₹3.1L', cac: '₹8' },
            { name: '777 Spin & Win', runs: 30, conversions: 5200, revenue: '₹18.4L', cac: '₹0' },
            { name: 'Scratch & Win', runs: 12, conversions: 2100, revenue: '₹7.2L', cac: '₹0' },
        ];

        return { dailyVolume, campaigns };
    }, []);

    // Brand Deep Dive Mock/Derived Data
    const brandData = useMemo(() => {
        const data: Record<string, any> = {
            'Mamaearth': {
                wtp: [
                    { name: 'Onion Shampoo', mrp: 349, captured: 310 },
                    { name: 'Face Wash', mrp: 259, captured: 245 },
                ],
                intentsConverted: ['hair fall', 'summer skincare', 'glow'],
                intentsUnfulfilled: ['acne treatment pads', 'dry scalp overnight mask'],
                eventLift: '+145%',
                timeSpent: '1m 24s',
                repeatPct: '32%',
                avgWtp: { captured: 310, mrp: 349 },
                dailyVolume: Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, orders: Math.floor(40 + Math.random() * 60) })),
                trafficSource: [
                    { name: 'AI Search', value: 40 },
                    { name: 'Piggyback', value: 25 },
                    { name: 'Direct App', value: 20 },
                    { name: 'Gamification', value: 15 },
                ],
                coOccurrence: [
                    { brand: 'The Whole Truth', pct: '35%' },
                    { brand: 'Sleepy Owl', pct: '28%' },
                    { brand: 'MCaffeine', pct: '15%' }
                ],
                localHeatmap: [
                    { area: 'Indiranagar', density: '42%' },
                    { area: 'Koramangala', density: '31%' },
                    { area: 'HSR Layout', density: '18%' }
                ],
                pulseVelocity: { crossBrand: '4.2 days', sameBrand: '28 days' },
                basketAffinity: '68%'
            },
            'Minimalist': {
                wtp: [
                    { name: 'Vitamin C Serum', mrp: 699, captured: 650 },
                    { name: 'Salicylic Acid', mrp: 549, captured: 520 },
                ],
                intentsConverted: ['pigmentation', 'open pores', 'dermatologist recommended'],
                intentsUnfulfilled: ['under eye retinol', 'acne deep scars'],
                eventLift: '+210%',
                timeSpent: '2m 10s',
                repeatPct: '48%',
                avgWtp: { captured: 585, mrp: 624 },
                dailyVolume: Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, orders: Math.floor(30 + Math.random() * 50) })),
                trafficSource: [
                    { name: 'AI Search', value: 50 },
                    { name: 'Piggyback', value: 20 },
                    { name: 'Direct App', value: 20 },
                    { name: 'Gamification', value: 10 },
                ],
                coOccurrence: [
                    { brand: 'Snitch', pct: '40%' },
                    { brand: 'The Whole Truth', pct: '22%' },
                    { brand: 'Kapiva', pct: '12%' }
                ],
                localHeatmap: [
                    { area: 'HSR Layout', density: '38%' },
                    { area: 'Indiranagar', density: '35%' },
                    { area: 'Whitefield', density: '15%' }
                ],
                pulseVelocity: { crossBrand: '3.8 days', sameBrand: '24 days' },
                basketAffinity: '75%'
            },
            'The Whole Truth': {
                wtp: [
                    { name: 'Protein Bar', mrp: 100, captured: 85 },
                    { name: 'Dark Chocolate', mrp: 199, captured: 175 },
                ],
                intentsConverted: ['no sugar', 'healthy snack', 'clean protein'],
                intentsUnfulfilled: ['midnight craving pizza', 'bulk protein powder'],
                eventLift: '+380%',
                timeSpent: '45s',
                repeatPct: '65%',
                avgWtp: { captured: 130, mrp: 149 },
                dailyVolume: Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, orders: Math.floor(50 + Math.random() * 80) })),
                trafficSource: [
                    { name: 'AI Search', value: 30 },
                    { name: 'Piggyback', value: 30 },
                    { name: 'Direct App', value: 20 },
                    { name: 'Gamification', value: 20 },
                ],
                coOccurrence: [
                    { brand: 'Sleepy Owl', pct: '45%' },
                    { brand: 'Yoga Bar', pct: '25%' },
                    { brand: 'Kapiva', pct: '18%' }
                ],
                localHeatmap: [
                    { area: 'Koramangala', density: '45%' },
                    { area: 'Indiranagar', density: '28%' },
                    { area: 'HSR Layout', density: '20%' }
                ],
                pulseVelocity: { crossBrand: '5.1 days', sameBrand: '14 days' },
                basketAffinity: '82%'
            }
        };
        return data[selectedBrand] || data['Mamaearth'];
    }, [selectedBrand]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            {/* Header (Non-sticky) */}
            <div className="bg-white border-b border-slate-200 px-6 md:px-12 py-8">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm mb-4 transition-colors">
                            <span>←</span> Back to Platform
                        </Link>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">D24</div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Dash24 Intelligence Portal</h1>
                        </div>
                        <p className="text-slate-500 font-medium max-w-2xl mt-2 text-sm md:text-base">B2B SaaS portal for unit economics, acquisition analysis, and brand partner deep-dives.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-max border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setActiveTab('simulator')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Simulator
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('brand')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'brand' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Brand Deep Dive
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 mt-8">

                {/* THE BRAIN: AI Analytics Overlay */}
                <TheBrainWidget />

                {/* =========================================
            TAB 1: SIMULATOR
        ========================================= */}
                {activeTab === 'simulator' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Simulator Tier 1: KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Platform Orders</p>
                                <p className="text-2xl md:text-3xl font-black text-slate-900">{simMetrics.totalPlatformOrders.toLocaleString()}</p>
                            </div>

                            <div className={`bg-white border rounded-xl p-5 shadow-sm transition-colors ${simMetrics.blendedCac < 100 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-start">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Blended CAC</p>
                                    {simMetrics.blendedCac < 100 && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold uppercase">Exceptional</span>}
                                </div>
                                <p className={`text-2xl md:text-3xl font-black ${simMetrics.blendedCac < 100 ? 'text-emerald-600' : 'text-slate-900'}`}>₹{simMetrics.blendedCac.toFixed(0)}</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">App Downloads</p>
                                <p className="text-2xl md:text-3xl font-black text-blue-600">{simMetrics.appDownloads.toLocaleString()}</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Projected GMV</p>
                                <p className="text-2xl md:text-3xl font-black text-slate-900">₹{(simMetrics.projectedGmv / 100000).toFixed(2)}L</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Simulator Tier 2: Controls */}
                            <div className="lg:col-span-1 space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-base font-black text-slate-900 mb-6">Assumption Engine</h3>

                                <div className="space-y-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Brand Tracking Traffic</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{baseTraffic.toLocaleString()}</span>
                                        </div>
                                        <input type="range" min="1000" max="10000" step="500" value={baseTraffic} onChange={(e) => setBaseTraffic(Number(e.target.value))} className="w-full accent-blue-600" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Base traffic from partner 60-min delivery links across nodes.</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Piggyback Conversion %</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{piggybackConv}%</span>
                                        </div>
                                        <input type="range" min="1" max="20" step="1" value={piggybackConv} onChange={(e) => setPiggybackConv(Number(e.target.value))} className="w-full accent-blue-600" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Industry avg is 5%. We assume 10% due to zero shipping cost.</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Value-Prop App Downloads</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{appDownloadPct}%</span>
                                        </div>
                                        <input type="range" min="5" max="40" step="1" value={appDownloadPct} onChange={(e) => setAppDownloadPct(Number(e.target.value))} className="w-full accent-blue-600" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Users downloading app to claim missed Pulse Points.</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">AI Search Conversion</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{aiSearchConv}%</span>
                                        </div>
                                        <input type="range" min="5" max="25" step="1" value={aiSearchConv} onChange={(e) => setAiSearchConv(Number(e.target.value))} className="w-full accent-blue-600" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Semantic routing drastically reduces time-to-cart over standard 3% avg.</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Auto-Cart / Subs %</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{autoCartPct}%</span>
                                        </div>
                                        <input type="range" min="1" max="15" step="1" value={autoCartPct} onChange={(e) => setAutoCartPct(Number(e.target.value))} className="w-full accent-blue-600" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Predictable repeat volume on consumables.</p>
                                    </div>

                                    <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Paid Ad Budget</span>
                                            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">₹{(paidBudget / 1000).toFixed(0)}k</span>
                                        </div>
                                        <input type="range" min="10000" max="500000" step="10000" value={paidBudget} onChange={(e) => setPaidBudget(Number(e.target.value))} className="w-full accent-rose-500" />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-700">Paid CAC Target</span>
                                            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">₹{paidCac}</span>
                                        </div>
                                        <input type="range" min="400" max="1200" step="50" value={paidCac} onChange={(e) => setPaidCac(Number(e.target.value))} className="w-full accent-rose-500" />
                                        <p className="text-[10px] text-slate-500 font-medium">Rationale: Used strictly for seeding new micro-neighborhoods.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Simulator Chart */}
                            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-base font-black text-slate-900 mb-1">Origin Logic</h3>
                                    <p className="text-xs text-slate-500">Total orders mapped to discovery (web) vs retention (app).</p>
                                </div>
                                <div className="flex-1 min-h-[300px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={simMetrics.orderSourcesData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="orders" radius={[0, 4, 4, 0]} barSize={24}>
                                                {simMetrics.orderSourcesData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Simulator Insights Feed */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Acquisition Economics</h4>
                                    {simMetrics.blendedCac < 100 ? (
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                            <span className="font-bold text-emerald-600">Insight:</span> Extreme capital efficiency. Zero-CAC channels are dragging blended CAC to ₹{simMetrics.blendedCac.toFixed(0)}.
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                            Paid channels hold too much weight. Blended CAC is ₹{simMetrics.blendedCac.toFixed(0)}.
                                        </p>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Algorithm Efficacy</h4>
                                    {aiSearchConv > 10 ? (
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                            <span className="font-bold text-blue-600">Insight:</span> Memory-augmented routing outperforming keyword search at {aiSearchConv}% conversion rate.
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                            AI Search conversion is falling behind. Tweak the LLM logic.
                                        </p>
                                    )}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Pulse Point Economy</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs text-slate-500 font-bold">Issued Points</span>
                                                <span className="text-sm font-black text-slate-900">{simMetrics.pointsIssued.toLocaleString()} PTS</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400 w-full"></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs text-slate-500 font-bold">Burned (Redeemed)</span>
                                                <span className="text-sm font-black text-orange-500">{simMetrics.pointsBurned.toLocaleString()} PTS</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-400 transition-all duration-300" style={{ width: `${Math.min(100, (simMetrics.pointsBurned / Math.max(1, simMetrics.pointsIssued)) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================
            TAB 2: MONTHLY OVERVIEW
        ========================================= */}
                {activeTab === 'monthly' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Insights Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Auto-Cart Dependency</p>
                                <p className="text-2xl font-black text-slate-900 mb-2">18.4%</p>
                                <p className="text-xs text-slate-500 font-medium">% of total monthly volume strictly driven by auto-add / subscriptions.</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pulse Velocity</p>
                                <p className="text-2xl font-black text-slate-900 mb-2">3.2 Days</p>
                                <p className="text-xs text-slate-500 font-medium">Avg. days for a customer to redeem earned Pulse Points.</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">LLM Inbound</p>
                                <p className="text-lg font-black text-blue-600 mb-2 truncate">"quick protein delivery"</p>
                                <p className="text-xs text-slate-500 font-medium">Top external AI search query routing directly to Dash24 Web.</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Internal Intent Demand</p>
                                <p className="text-lg font-black text-rose-600 mb-2 truncate">"sugar free redbull"</p>
                                <p className="text-xs text-slate-500 font-medium">Top unfulfilled search on the Dash24 platform this month.</p>
                            </div>
                        </div>

                        {/* Daily Order Volume - Full Width */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-black text-slate-900">Total Platform Daily Orders</h3>
                                <p className="text-xs text-slate-500 mt-1">Organic vs. Paid vs. Gamified across 30 days.</p>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData.dailyVolume} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="day" hide />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                                        <Line type="monotone" dataKey="organic" stroke="#3b82f6" strokeWidth={3} dot={false} name="Organic (Web/Piggyback)" />
                                        <Line type="monotone" dataKey="gamified" stroke="#f59e0b" strokeWidth={3} dot={false} name="Gamified (App)" />
                                        <Line type="monotone" dataKey="paid" stroke="#ec4899" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Paid Growth" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* ROI Table */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Campaign ROI Tracker</h3>
                                    <p className="text-xs text-slate-500 mt-1">Factoring in 5-10% discount costs and operational overhead.</p>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 font-bold rounded-tl-lg">Campaign</th>
                                                <th className="px-4 py-3 font-bold">Runs</th>
                                                <th className="px-4 py-3 font-bold">Conversions</th>
                                                <th className="px-4 py-3 font-bold">Revenue</th>
                                                <th className="px-4 py-3 font-bold rounded-tr-lg">Specific CAC</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyData.campaigns.map((camp, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-4 font-bold text-slate-900">{camp.name}</td>
                                                    <td className="px-4 py-4 text-slate-600 font-medium">{camp.runs}</td>
                                                    <td className="px-4 py-4 text-slate-600 font-medium">{camp.conversions.toLocaleString()}</td>
                                                    <td className="px-4 py-4 text-green-600 font-bold">{camp.revenue}</td>
                                                    <td className="px-4 py-4 text-blue-600 font-bold bg-blue-50/30">{camp.cac}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Ops & Inventory Insight Block */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center flex-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock-outs Prevented (Internal Node Balancing)</p>
                                    <p className="text-4xl font-black text-slate-900 mb-2">1,204</p>
                                    <p className="text-sm text-slate-500 font-medium pb-4 mb-4 border-b border-slate-100">Times stock moved between Indiranagar & Koramangala to save an order.</p>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                        <span>Avg Transfer Time: 14m</span>
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Efficiency +42%</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center flex-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">SLA Performance</p>
                                    <p className="text-4xl font-black text-slate-900 mb-2">98.4%</p>
                                    <p className="text-sm text-slate-500 font-medium pb-4 mb-4 border-b border-slate-100">% of orders delivered strictly under 60 mins.</p>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                        <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">Breaches: 420</span>
                                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">On-Time: 24,050</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* =========================================
            TAB 3: BRAND DEEP DIVE
        ========================================= */}
                {activeTab === 'brand' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-max">
                            <span className="text-sm font-bold text-slate-900">Select Brand Partner:</span>
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2 font-semibold outline-none"
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                            >
                                <option value="Mamaearth">Mamaearth</option>
                                <option value="Minimalist">Minimalist</option>
                                <option value="The Whole Truth">The Whole Truth</option>
                            </select>
                        </div>

                        {/* KPI Row: WTP & Affinities */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {/* WTP Massive KPI */}
                            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 relative z-10">Willingness to Pay (WTP)</h3>
                                <div className="flex flex-col items-center gap-1 relative z-10">
                                    <p className="text-4xl md:text-5xl font-black text-white">Avg. Captured: ₹{brandData.avgWtp.captured}</p>
                                    <p className="text-xl font-bold text-rose-400 line-through mt-1">vs MRP: ₹{brandData.avgWtp.mrp}</p>
                                </div>
                            </div>

                            {/* Velocity Stats */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Split Pulse Velocity</p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="text-2xl font-black text-emerald-600 leading-tight">{brandData.pulseVelocity.crossBrand}</p>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Cross-Brand Repeat</p>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="text-2xl font-black text-blue-600 leading-tight">{brandData.pulseVelocity.sameBrand}</p>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Same-Brand Replenish</p>
                                    </div>
                                </div>
                            </div>

                            {/* Basket Affinity & Event Lift */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="p-5 border-b border-slate-100 flex-1 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Basket Affinity</p>
                                    <p className="text-3xl font-black text-purple-600">{brandData.basketAffinity}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">% of orders with another brand.</p>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-center bg-slate-50 rounded-b-2xl">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Event Lift</p>
                                    <p className="text-2xl font-black text-slate-900">{brandData.eventLift}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Brand Daily Graph & Inventory Radar */}
                            <div className="lg:col-span-2 flex flex-col gap-8">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-black text-slate-900">Brand-Specific Daily Volume</h3>
                                        <p className="text-xs text-slate-500 mt-1">30-day order volume specifically for {selectedBrand}.</p>
                                    </div>
                                    <div className="h-[280px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={brandData.dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="day" hide />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={3} dot={false} name="Daily Orders" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Dash24 Feature: Inventory Radar */}
                                <InventoryRadar />
                            </div>

                            {/* Dash24 Right Column: Piggyback Matrix, Intents, Local Heatmap */}
                            <div className="lg:col-span-1 space-y-6 flex flex-col">
                                {/* Co-Occurrence Matrix */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="mb-4">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Co-Occurrence Matrix</h3>
                                        <p className="text-xs text-slate-400 mt-1">Top Piggyback / Companion Brands</p>
                                    </div>
                                    <div className="space-y-3">
                                        {brandData.coOccurrence.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                                <span className="text-slate-700">Bought with: <span className="text-slate-900">{item.brand}</span></span>
                                                <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs">{item.pct}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Semantic Intents with Toggle Style View */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex-1">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Semantic Intents</h3>
                                        <div className="flex bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold text-slate-500">
                                            <span className="bg-white text-slate-800 px-2 py-1 rounded shadow-sm">Converted</span>
                                            <span className="px-2 py-1 text-slate-400">Unfulfilled</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2 font-semibold">Actioned & Delivered:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {brandData.intentsConverted.map((intent: string, idx: number) => (
                                                    <span key={idx} className="bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                                        "{intent}"
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-slate-200/60">
                                            <p className="text-xs text-rose-400 opacity-80 mb-2 font-semibold">Missed / Stock-out:</p>
                                            <div className="flex flex-wrap gap-2 opacity-60 grayscale">
                                                {brandData.intentsUnfulfilled.map((intent: string, idx: number) => (
                                                    <span key={idx} className="bg-white text-slate-500 border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                        "{intent}"
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hyper-Local Heatmap Placeholder */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 relative z-10">Hyper-Local Demand (Bangalore Pilot)</h3>
                                    <div className="space-y-2 relative z-10">
                                        {brandData.localHeatmap.map((loc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                                <span>{loc.area}</span>
                                                <span className="text-orange-400">{loc.density}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
