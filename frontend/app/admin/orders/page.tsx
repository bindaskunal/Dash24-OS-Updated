"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabaseClient";

interface Product {
    id: string;
    name: string;
    price: number;
    is_fbb: boolean;
    image_url: string;
}

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    products: Product;
}

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    user_id: string;
    order_items: OrderItem[];
}

const STATUS_STEPS = ["Pending", "Confirmed", "Packing", "OutForDelivery", "Delivered"];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isSurgeActive, setIsSurgeActive] = useState(false);
    const [surgeLoading, setSurgeLoading] = useState(false);

    // Katzen Weather Agent State
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [newOrderToast, setNewOrderToast] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data || []);

            // Also fetch surge state and weather sync info
            const { data: settingsData } = await supabase
                .from("store_settings")
                .select("*");

            if (settingsData) {
                const surge = settingsData.find(s => s.key === 'is_surge_active');
                const lastSync = settingsData.find(s => s.key === 'last_weather_sync');

                if (surge) setIsSurgeActive(!!surge.value);
                if (lastSync) setLastSyncTime(lastSync.value);
            }

        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Katzen OS - Supercharged Real-Time WebSocket Injection
        const channel = supabase.channel('realtime-orders')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                async (payload) => {
                    const newOrderId = payload.new.id;

                    // 1. WebSocket fired a raw row without relation arrays. Hydrate it instantly:
                    const { data: fullOrder, error } = await supabase
                        .from('orders')
                        .select(`
                            *,
                            order_items (
                                *,
                                products (*)
                            )
                        `)
                        .eq('id', newOrderId)
                        .single();

                    if (!error && fullOrder) {
                        // 2. Unshift into local memory mapping for zero-refresh DOM painting
                        setOrders(prev => [fullOrder, ...prev]);

                        // 3. Trigger visual alarm
                        setNewOrderToast(true);
                        setTimeout(() => setNewOrderToast(false), 5000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleSurge = async () => {
        setSurgeLoading(true);
        try {
            const nextValue = !isSurgeActive;
            const { error } = await supabase
                .from("store_settings")
                .update({ value: nextValue })
                .eq("key", "is_surge_active");

            if (error) throw error;
            setIsSurgeActive(nextValue);
        } catch (err: any) {
            console.error("Error toggling surge:", err);
            alert("Failed to toggle surge: " + err.message);
        } finally {
            setSurgeLoading(false);
        }
    };

    const triggerWeatherSync = async () => {
        setSyncLoading(true);
        setSyncStatus(null);
        try {
            const res = await fetch('/api/katzen/weather-sync');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Sync failed');

            setSyncStatus({ type: 'success', message: `Weather synced: ${data.condition}. Surge is now ${data.is_surge_active ? 'ACTIVE' : 'INACTIVE'}.` });
            setLastSyncTime(data.timestamp);
            setIsSurgeActive(data.is_surge_active);

            // Auto-clear status after 5 seconds
            setTimeout(() => setSyncStatus(null), 5000);
        } catch (err: any) {
            console.error("Error triggering weather sync:", err);
            setSyncStatus({ type: 'error', message: err.message });
        } finally {
            setSyncLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, currentStatus: string) => {
        const currentIndex = STATUS_STEPS.indexOf(currentStatus);
        if (currentIndex === -1 || currentIndex === STATUS_STEPS.length - 1) return;

        const nextStatus = STATUS_STEPS[currentIndex + 1];

        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: nextStatus })
                .eq("id", orderId);

            if (error) throw error;

            // Update local state
            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status: nextStatus } : order
            ));
        } catch (err: any) {
            console.error("Error updating status:", err);
            alert("Failed to update status: " + err.message);
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
                <h2 className="text-red-600 font-bold mb-2">Error Loading Orders</h2>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button onClick={fetchOrders} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24 relative overflow-hidden">
            {/* Real-time Event Toast */}
            {newOrderToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
                    <div className="bg-indigo-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-indigo-500 font-bold tracking-wide">
                        <span className="animate-pulse text-xl">🚨</span> New Order Received!
                    </div>
                </div>
            )}

            <main className="max-w-[1400px] mx-auto px-4 md:px-10 pt-8">
                {/* Katzen OS Environment Dashboard */}
                <div className="mb-10 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none group-hover:bg-amber-500/10 transition-all duration-700"></div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="M15.91 17.91 12 22l-3.91-4.09" /><path d="M12 7c-2.76 0-5 2.24-5 5 0 1.28.48 2.45 1.27 3.33.27.3.56.57.88.82" /><path d="M14.85 16.15c.32-.25.61-.52.88-.82.79-.88 1.27-2.05 1.27-3.33 0-2.76-2.24-5-5-5Z" /></svg>
                                </span>
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-600">Katzen OS Environment Dashboard</h2>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">Surge Orchestration</h3>
                            <p className="text-gray-500 text-sm font-medium">Dynamically adjust global delivery promises based on environmental signals.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {syncStatus && (
                                <div className={`px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${syncStatus.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {syncStatus.message}
                                </div>
                            )}

                            <div className="flex flex-col items-end gap-1">
                                <button
                                    onClick={triggerWeatherSync}
                                    disabled={syncLoading}
                                    className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {syncLoading ? (
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                                    )}
                                    Weather Sync
                                </button>
                                {lastSyncTime && (
                                    <p className="text-[10px] font-bold text-gray-400">
                                        Last sync: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="text-right mr-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Surge Protocol</p>
                                    <p className={`text-xs font-bold ${isSurgeActive ? 'text-amber-600' : 'text-green-600'}`}>
                                        {isSurgeActive ? 'Active (Rain/Surge)' : 'Inactive (Normal)'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleSurge}
                                    disabled={surgeLoading}
                                    className={`relative w-16 h-8 rounded-full transition-all duration-300 ${isSurgeActive ? 'bg-amber-500' : 'bg-gray-200'} ${surgeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isSurgeActive ? 'left-9' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">📦 Incoming Orders</h2>
                        <p className="text-gray-500 font-medium mt-1">Real-time routing and fulfillment management</p>
                    </div>
                    <button onClick={fetchOrders} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition">
                        🔄 Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => {
                        const dash24Items = order.order_items.filter(item => !item.products?.is_fbb);
                        const brandItems = order.order_items.filter(item => item.products?.is_fbb);

                        return (
                            <div key={order.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Order Header */}
                                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Order ID</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'OutForDelivery' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">{order.id}</p>
                                        <p className="text-xs text-gray-400 font-medium">Placed: {new Date(order.created_at).toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Amount</p>
                                            <p className="font-black text-2xl text-gray-900">₹{order.total_amount}</p>
                                        </div>

                                        {/* Quick Steps Actions (Only for Non-Delivered) */}
                                        {order.status !== 'Delivered' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, order.status)}
                                                className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all group"
                                            >
                                                Advance to {STATUS_STEPS[STATUS_STEPS.indexOf(order.status) + 1] || 'Done'}
                                                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Routing Split UI */}
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                    {/* Dash24 Queue */}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-sm uppercase tracking-wider text-blue-600 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                                Dash24 Dispatch Queue (60 Min)
                                            </h3>
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black">{dash24Items.length} Items</span>
                                        </div>

                                        <div className="space-y-3">
                                            {dash24Items.length > 0 ? dash24Items.map(item => (
                                                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                                        <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-900 truncate">{item.products?.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity} • ₹{item.price_at_purchase}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Priority Items</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Brand Queue */}
                                    <div className="p-6 bg-gray-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-sm uppercase tracking-wider text-purple-600 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                                Brand Notification Queue
                                            </h3>
                                            <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] font-black">{brandItems.length} Items</span>
                                        </div>

                                        <div className="space-y-3">
                                            {brandItems.length > 0 ? brandItems.map(item => (
                                                <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100/50 shadow-sm opacity-80">
                                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                                        <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-800 truncate">{item.products?.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity} • ₹{item.price_at_purchase}</p>
                                                    </div>
                                                    <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-[8px] font-black uppercase">FBB</div>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No Brand Shipments</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {orders.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-2xl font-black text-gray-900">No Orders Yet</h3>
                            <p className="text-gray-500 font-medium">When customers place orders, they will appear here.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
