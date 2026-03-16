"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../../src/lib/supabaseClient";
import FulfillmentTimeline from "../../src/components/FulfillmentTimeline";

export default function TrackPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user) {
                const { data, error: dbError } = await supabase
                    .from('orders')
                    .select(`
                        id, 
                        created_at, 
                        status, 
                        total_amount,
                        order_items (
                            quantity,
                            products (
                                name,
                                is_fbb
                            )
                        )
                    `)
                    .eq('user_id', authData.user.id)
                    .order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    setOrderHistory(data);
                    setOrder(data[0]);
                }
            }
        };
        fetchHistory();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError("");
        setOrder(null);

        try {
            // Fetch order and related items
            const { data, error: dbError } = await supabase
                .from('orders')
                .select(`
                    id, 
                    created_at, 
                    status, 
                    total_amount,
                    order_items (
                        quantity,
                        products (
                            name,
                            is_fbb
                        )
                    )
                `)
                .eq('id', searchQuery.trim())
                .single();

            if (dbError || !data) {
                setError("Order not found. Please check your Order ID.");
            } else {
                setOrder(data);
            }
        } catch (err: any) {
            setError("Failed to fetch tracking details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Parse items for FulfillmentTimeline
    const getCategorizedItems = () => {
        if (!order || !order.order_items) return { instant: [], quick: [] };
        
        const instant: any[] = [];
        const quick: any[] = [];
        
        order.order_items.forEach((item: any) => {
            const product = item.products;
            if (!product) return;
            
            const formattedItem = { id: product.name, name: product.name, price: 0, isFastTrack: !product.is_fbb, brandName: '', quantity: item.quantity };
            if (product.is_fbb) {
                quick.push(formattedItem);
            } else {
                instant.push(formattedItem);
            }
        });
        
        return { instant, quick };
    };

    const { instant, quick } = getCategorizedItems();

    const getStatusStep = (status: string) => {
        const lower = status.toLowerCase();
        if (lower === 'pending') return 1;
        if (lower === 'paid' || lower === 'processing' || lower.includes('pack')) return 2;
        if (lower.includes('out') || lower.includes('transit')) return 3;
        if (lower === 'delivered') return 4;
        return 0;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24 font-sans">
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
                <div className="flex flex-col items-center justify-center max-w-2xl mx-auto mb-12">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-blue-100">
                        📍
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Live Tracking</h2>
                    <p className="text-gray-500 font-medium text-center">Enter your Order ID below to get real-time fulfillment updates.</p>

                    <form onSubmit={handleSearch} className="w-full mt-6 flex flex-col md:flex-row gap-3">
                        <input 
                            type="text" 
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-bold focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition shadow-sm"
                        />
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white font-black px-8 py-4 rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? "Tracking..." : "Track Order"}
                        </button>
                    </form>
                    
                    {error && (
                        <div className="mt-4 w-full p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
                            {error}
                        </div>
                    )}
                </div>

                {orderHistory.length > 1 && (
                    <div className="max-w-2xl mx-auto mb-8 animate-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-black text-gray-900 mb-3 uppercase tracking-widest px-2">Order History</h3>
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-2">
                            {orderHistory.map((histOrder, idx) => (
                                <button
                                    key={histOrder.id}
                                    onClick={() => setOrder(histOrder)}
                                    className={`shrink-0 text-left p-3 rounded-xl border transition-all min-w-[200px] flex flex-col gap-2 ${order?.id === histOrder.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                                >
                                    <div className="flex justify-between items-start w-full gap-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{new Date(histOrder.created_at).toLocaleDateString()}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${histOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {histOrder.status}
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">₹{histOrder.total_amount}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {order && (
                    <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">

                            {/* Header */}
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                    <p className="font-mono font-bold text-xs text-gray-900 break-all">{order.id}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-xl text-gray-900">₹{order.total_amount}</p>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">{order.order_items?.length || 0} Items</p>
                                </div>
                            </div>

                            {/* Status Stepper */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8 relative">
                                    <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                                            style={{ width: `${((getStatusStep(order.status) - 1) / 3) * 100}%` }}
                                        />
                                    </div>
                                    
                                    {[
                                        { step: 1, label: "Placed", icon: "📝" },
                                        { step: 2, label: "Packed", icon: "📦" },
                                        { step: 3, label: "Transit", icon: "🛵" },
                                        { step: 4, label: "Delivered", icon: "✅" }
                                    ].map((s) => {
                                        const isPast = getStatusStep(order.status) > s.step;
                                        const isCurrent = getStatusStep(order.status) === s.step;
                                        return (
                                            <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-4 transition-all duration-500
                                                    ${isCurrent ? 'bg-blue-600 text-white border-blue-100 scale-110 shadow-blue-500/30' : 
                                                      isPast ? 'bg-blue-100 text-blue-600 border-white' : 'bg-white text-gray-300 border-gray-100'}`}
                                                >
                                                    {s.icon}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl shrink-0">
                                         {getStatusStep(order.status) === 4 ? "🎉" : "🔄"}
                                     </div>
                                     <div>
                                         <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Status: {order.status}</h3>
                                         <p className="text-xs text-gray-600 font-medium">
                                             {getStatusStep(order.status) === 1 && "Your order has been received and is waiting to be processed."}
                                             {getStatusStep(order.status) === 2 && "Your items are being packed at our local micro-fulfillment node."}
                                             {getStatusStep(order.status) === 3 && "Your order is out for delivery. A rider is assigned."}
                                             {getStatusStep(order.status) === 4 && "Your order has been successfully delivered."}
                                         </p>
                                     </div>
                                </div>
                            </div>
                            
                            {/* Dynamic ETA Timeline */}
                            {(getStatusStep(order.status) < 4) && (instant.length > 0 || quick.length > 0) && (
                                <div className="px-6 pb-6 w-full overflow-hidden">
                                     <FulfillmentTimeline instantItems={instant} quickItems={quick} />
                                </div>
                            )}

                            {/* Items Scrollable List */}
                            <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex gap-2 overflow-x-auto hide-scrollbar">
                                {order.order_items?.map((item: any, i: number) => (
                                    <span key={i} className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] text-gray-500">{item.quantity}</span>
                                        {item.products?.name || "Unknown Item"}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
