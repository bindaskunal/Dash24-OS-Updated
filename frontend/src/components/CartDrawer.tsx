"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { MASTER_CATALOG } from "../data/constants";

import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";
import ENRICHED_CATALOG from "../../data/enriched_catalog.json";
import PredictiveRestock from "./PredictiveRestock";
import { supabase } from "../lib/supabaseClient";

export default function CartDrawer() {
    // ---------------- HOOKS (Top Level) ----------------
    const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, getTotalAmount, getTotalItems, isCartOpen: cartOpen, setIsCartOpen: setCartOpenState, getTotalPoints, getDeliveryBuckets, setCustomerMobile } = useCartStore();
    const cartCount = getTotalItems();
    
    // User Store for Pulse Points
    const { isAuthenticated, addPulsePoints } = useUserStore();

    const [showCartToast, setShowCartToast] = useState(false);
    const [toastItem, setToastItem] = useState<any>(null);
    const [lastOrder, setLastOrder] = useState<any[]>([]);

    const [mounted, setMounted] = useState(false);
    const { selectedNode } = useLocation();

    // Checkout flow states: 'cart' | 'address' | 'success'
    const [step, setStep] = useState<'cart' | 'address' | 'success'>('cart');

    const pathname = usePathname();
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [address, setAddress] = useState({
        name: 'Kunal Kumar',
        phone: '+91 98765 43210',
        line1: 'Flat 42, Tower B',
        line2: `Prestige ${selectedNode}`,
        city: 'Bangalore',
        pin: '560095',
    });

    const [currentTime, setCurrentTime] = useState(Date.now());
    
    // Mission 57: Graceful Checkout Error Handling
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // ---------------- EFFECTS ----------------
    useEffect(() => {
        const handleOpen = () => setCartOpenState(true);
        window.addEventListener('open-global-cart', handleOpen);
        return () => window.removeEventListener('open-global-cart', handleOpen);
    }, []);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const hasActivePulse = cartItems.some(item => item.isPulse && item.pulseStatus === 'active');
        if (!hasActivePulse) return;
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [cartItems]);

    // Reset step when drawer closes
    useEffect(() => {
        if (!cartOpen) {
            setStep('cart');
            setOrderId('');
            setIsProcessing(false);
        }
    }, [cartOpen]);

    // ---------------- HANDLERS AND CALCULATIONS ----------------
    const setCartOpen = (open: boolean) => {
        setCartOpenState(open);
        if (open) window.dispatchEvent(new Event('open-global-cart'));
    };

    const handleAddToCart = (productName: string) => {
        const product = (MASTER_CATALOG as any[]).find(p => p.name === productName)
            || (ENRICHED_CATALOG as any[]).find(p => p.name === productName);

        if (product) {
            addItem({ id: product.id || product.name, name: product.name, price: product.price, isFastTrack: product.fulfilledBy !== 'Brand', brandName: product.brand || 'Unknown', imageUrl: product.image_url, deliveryBucket: product.deliveryBucket });
            setToastItem(product);
            setShowCartToast(true);
            setTimeout(() => setShowCartToast(false), 2000);
        } else {
            addItem({ id: productName, name: productName, price: 0, isFastTrack: true, brandName: 'Unknown' });
        }
    };

    const handleDecrease = (productName: string) => {
        const item = cartItems.find(i => i.name === productName);
        if (item) {
            updateQuantity(item.id, item.quantity - 1);
        }
    };

    const handleRemoveItem = (productName: string) => {
        const item = cartItems.find(i => i.name === productName);
        if (item) removeItem(item.id);
    };

    const generateOrderId = () => {
        const prefix = 'DASH';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        setCheckoutError(null);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: cartItems,
                    totalAmount: total,
                }),
            });

            const textData = await response.text();

            if (!response.ok) {
                let errorMsg = "Checkout failed. Some items may be unavailable.";
                try {
                    const jsonData = JSON.parse(textData);
                    errorMsg = jsonData.error || errorMsg;
                } catch (parseError) {
                    console.error("Non-JSON error from checkout API:", textData);
                }
                throw new Error(errorMsg);
            }

            const orderData = JSON.parse(textData);
            if (orderData.error) throw new Error(orderData.error);

            // 2. Load Razorpay Script Dynamically
            const res = await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });

            if (!res) throw new Error("Razorpay SDK failed to load");

            // 3. Initialize Razorpay Checkout Window
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Dash24",
                description: "Premium Quick-Commerce Purchase",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        console.log("Razorpay Success! Starting Database Writes...");
                        
                        const { data: userAuthData } = await supabase.auth.getUser();
                        const activeUserId = userAuthData?.user?.id || null;

                        // 1. Write the Order
                        try {
                            const orderPayload = {
                                ...(orderData.dbOrderId ? { id: orderData.dbOrderId } : {}),
                                user_id: activeUserId,
                                total_amount: total,
                                payment_status: 'Paid',
                                status: 'Confirmed',
                                razorpay_order_id: response.razorpay_order_id || orderData.id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                items: cartItems
                            };

                            const { error: syncError } = await supabase.from('orders').upsert(orderPayload).select().single();
                            if (syncError) {
                                console.error("Supabase Order Upsert Error:", syncError);
                                alert(`Order DB Error: ${syncError.message}`);
                            } else {
                                console.log("✅ Order saved successfully.");
                            }
                        } catch (err) {
                            console.error("Fatal order sync error:", err);
                        }

                        // 2. Write the Pulse Points
                        if (activeUserId && isAuthenticated) {
                            try {
                                const pointsEarned = Math.floor(total * 0.1);
                                
                                // Make sure profile exists first (upsert)
                                const { data: currentProfile } = await supabase.from('profiles').select('pulse_points').eq('id', activeUserId).single();
                                const newPoints = (currentProfile?.pulse_points || 0) + pointsEarned;
                                
                                const { error: profileError } = await supabase.from('profiles').upsert({ id: activeUserId, pulse_points: newPoints });
                                if (profileError) console.error("Profile Upsert Error:", profileError);
                                
                                // Write to Wallet Logs
                                const { error: walletError } = await supabase.from('wallet_logs').insert({
                                    user_id: activeUserId,
                                    amount: pointsEarned,
                                    type: 'earned',
                                    description: `Order Reward (+${pointsEarned} Pulse)`
                                });
                                
                                if (walletError) {
                                    console.error("Supabase Wallet Log Insert Error:", walletError);
                                    alert(`Wallet DB Error: ${walletError.message}`);
                                } else {
                                    addPulsePoints(pointsEarned);
                                    console.log(`✅ Added ${pointsEarned} Pulse Points!`);
                                }
                            } catch (walletErr) {
                                console.error("Fatal wallet sync error:", walletErr);
                            }
                        }

                        await new Promise(resolve => setTimeout(resolve, 500));

                        // 3. Verify Payment
                        const verifyRes = await fetch('/api/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                dbOrderId: orderData.dbOrderId
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.status === 'ok') {
                            const finalOrderId = verifyData.dbOrderId || orderData.dbOrderId || response.razorpay_payment_id;
                            setOrderId(response.razorpay_payment_id);
                            setLastOrder([...cartItems]);
                            setCustomerMobile(address.phone);

                            clearCart();
                            setCartOpen(false);
                            setStep('cart');
                            setIsProcessing(false);

                            router.push(`/order-success?orderId=${finalOrderId}`);
                        } else {
                            throw new Error(verifyData.error || "Payment Verification Failed");
                        }
                    } catch (error: any) {
                        console.error("Post-Payment Flow Crash:", error);
                        setCheckoutError(error.message || "Payment verification failed.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: address.name,
                    contact: address.phone.replace(/[^0-9]/g, ''),
                },
                theme: { color: "#000000" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error("Razorpay UI Error:", response.error);
                setCheckoutError(response.error.description || "Payment failed or was cancelled.");
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error: any) {
            console.error("Handle Place Order Error:", error);
            setCheckoutError(error.message || "Could not initialize checkout.");
            setIsProcessing(false);
        }
    };

    // Auto Add: close drawer, wait 5s, add product, reopen (desktop) or show mini bar (mobile)
    const startAutoAdd = useCallback((productName: string) => {
        setCartOpen(false);
        setTimeout(() => {
            handleAddToCart(productName);
            setStep('cart');
            // On mobile (<768px), don't reopen full drawer — mini bar will show
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            if (!isMobile) {
                setCartOpen(true);
            }
        }, 5000);
    }, [setCartOpen, handleAddToCart]);

    // Calculate derived values exactly as CartContext did
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const localItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return (!prod || prod.fulfilledBy === "Dash24") && item.brandName !== "Snitch";
    });
    const localSubtotal = localItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const localShipping = localSubtotal >= 699 ? 0 : (localSubtotal > 0 ? 50 : 0);

    const brandItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return prod && prod.fulfilledBy === "Brand" && item.brandName !== "Snitch";
    });
    const brandSubtotal = brandItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const brandShipping = brandSubtotal >= 999 ? 0 : (brandSubtotal > 0 ? 50 : 0);

    const snitchItems = cartItems.filter(item => item.brandName === "Snitch");
    const snitchDelivery = snitchItems.length > 0 ? 49 : 0;

    const total = subtotal + localShipping + brandShipping + snitchDelivery;
    const amountRemaining = Math.max(0, 699 - localSubtotal);
    const progressPercentage = Math.min(100, (localSubtotal / 699) * 100);

    const renderCartItem = (item: any) => {
        const isPulseActive = item.isPulse && item.pulseStatus === 'active';
        const isPulseExpired = item.isPulse && item.pulseStatus === 'expired';
        const timeLeft = isPulseActive && item.pulseExpiresAt ? Math.max(0, item.pulseExpiresAt - currentTime) : 0;
        const mins = Math.floor(timeLeft / 60000).toString().padStart(2, '0');
        const secs = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');

        return (
            <div key={item.name} className="flex justify-between items-center border-b border-gray-100 pb-5 mb-5">
                <div className="w-2/3">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">{item.name}</p>
                        {isPulseActive && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse whitespace-nowrap drop-shadow-sm">
                                Expires in {mins}:{secs}
                            </span>
                        )}
                        {isPulseExpired && (
                            <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                Pulse Price Expired
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">₹{item.price} × {item.quantity}</p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200">
                            <button onClick={() => handleDecrease(item.name)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition font-bold text-sm">-</button>
                            <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button onClick={() => handleAddToCart(item.name)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition font-bold text-sm">+</button>
                        </div>
                        <button onClick={() => handleRemoveItem(item.name)} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 transition">Remove</button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-base font-black text-gray-900">₹{item.price * item.quantity}</p>
                    {isPulseExpired && item.originalPrice && (
                        <p className="text-[10px] text-gray-400 line-through">₹{item.originalPrice * item.quantity}</p>
                    )}
                </div>
            </div>
        );
    };

    // ---------------- CONDITIONAL RETURNS ----------------
    // Hydration bailout prevention
    if (!mounted) return null;

    // Hide CartDrawer on dashboard
    if (pathname?.startsWith('/dashboard')) return null;

    // Product consumption cycle data (days after which customer likely re-orders)
    const getConsumptionDays = (productName: string) => {
        const cycles: Record<string, number> = {
            'Face Wash': 30, 'Wild Amla Juice (1L)': 25, 'Ashwagandha Gummies': 30,
            'Plant Protein Isolate': 30, 'Protein Shake': 20, 'Energy Bars (Pack of 6)': 14,
            'Cold Brew Cans': 10, 'Brightening Serum': 45, 'Vitamin C Serum': 45,
            'Peanut Butter (1kg)': 30, "What's Up Wellness": 30, 'Overnight Oats': 7,
        };
        return cycles[productName] || 30;
    };

    // Auto Add suggestions (products not in current cart)
    const autoAddSuggestions = (MASTER_CATALOG as any[]).filter((p: any) =>
        !cartItems.some(item => item.name === p.name)
    ).slice(0, 1);

    const drawerTitle = step === 'cart' ? 'Your Cart'
        : step === 'address' ? 'Delivery Address'
            : 'Order Confirmed';

    const handleAutoAddDemo = () => {
        // 1. Close drawer and reset to simulate time passing
        setCartOpen(false);
        setStep('cart');

        console.log('Fast forwarding time...');
        // 2. Wait 5 seconds, then autonomously act
        setTimeout(() => {
            // Add the saved items back into the cart state
            lastOrder.forEach(item => {
                // Add the item multiple times if quantity > 1
                for (let i = 0; i < item.quantity; i++) {
                    handleAddToCart(item.name);
                }
            });
            // Pop the drawer open autonomously to shock the user
            setCartOpen(true);
        }, 5000);
    };

    return (
        <>
            {/* MOBILE ADD TO CART TOAST FEEDBACK */}
            {showCartToast && toastItem && (
                <div style={{ position: 'fixed', bottom: '80px', top: 'unset', left: '16px', right: '16px', zIndex: 999998 }} className="md:hidden rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-[#111827] text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                <img referrerPolicy="no-referrer" src={toastItem.image_url} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Added ✓</span>
                                <span className="text-xs font-bold line-clamp-1">{toastItem.name}</span>
                            </div>
                        </div>
                        <span className="text-sm font-black">₹{toastItem.price}</span>
                    </div>
                </div>
            )}

            {/* FULL CART DRAWER */}
            {cartOpen && (
                <div className="fixed inset-0 z-[9999]">
                    {/* The Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* The Drawer */}
                    <div
                        className="absolute bg-white shadow-2xl transition-all duration-1000 animate-in slide-in-from-bottom-full md:slide-in-from-right-full flex flex-col bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl md:top-0 md:bottom-auto md:right-0 md:left-auto md:h-full md:w-[450px] md:rounded-none overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle (mobile) */}
                        <div className="hidden max-md:block mx-auto w-12 h-1.5 rounded-full bg-gray-300 mt-3 mb-2 flex-shrink-0" />

                        {/* Header */}
                        <div className="flex justify-between items-center px-6 md:px-8 pt-6 pb-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                {step !== 'cart' && step !== 'success' && (
                                    <button onClick={() => setStep('cart')} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition text-sm">←</button>
                                )}
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">{drawerTitle}</h2>
                            </div>
                            <button onClick={() => setCartOpen(false)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition font-bold text-gray-500">✕</button>
                        </div>

                        {/* Step indicator for checkout */}
                        {step === 'address' && (
                            <div className="px-6 md:px-8 py-3 border-b border-gray-50 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-blue-600 text-white">
                                            1
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-900">Address</span>
                                        <div className="flex-1 h-0.5 mx-1 bg-gray-200" />
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-gray-200 text-gray-400">
                                            2
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-400">Payment</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 md:px-8 py-4">

                            {/* ============ CART VIEW ============ */}
                            {step === 'cart' && (
                                <>
                                    {/* Free Shipping Progress */}
                                    <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                                        <p className="text-xs font-bold text-orange-600 mb-2 ml-2">
                                            {amountRemaining > 0
                                                ? `Add ₹${amountRemaining} more for FREE Dash24 Delivery`
                                                : "🎉 Free Dash24 Delivery Unlocked!"}
                                        </p>
                                        <div className="w-full bg-orange-200/50 rounded-full h-2 overflow-hidden ml-2 max-w-[calc(100%-1rem)]">
                                            <div
                                                className="bg-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {brandShipping > 0 && cartItems.length > 0 && (
                                        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                            <p className="text-xs font-bold text-blue-600 ml-2">
                                                🚚 Brand Direct items have a flat ₹50 shipping fee below ₹999.
                                            </p>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {cartItems.length === 0 && (
                                        <div className="flex flex-col items-center justify-center text-center pt-6">
                                            <div className="text-5xl mb-4 grayscale opacity-60">🛒</div>
                                            <p className="text-xl font-black text-gray-900 mb-2 tracking-tight leading-none">Your cart is empty</p>
                                            <p className="text-sm font-medium text-gray-500 mb-6 max-w-[250px] leading-relaxed">Let's stock up on some premium essentials.</p>

                                            {/* Intelligent Suggestion */}
                                            <div className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl p-4 text-left shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-sm">💡</span>
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">Intelligent Suggestion</span>
                                                </div>
                                                <div className="flex items-center gap-3 mb-3 border border-gray-100 bg-white p-3 rounded-xl shadow-sm">
                                                    <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                                        <img referrerPolicy="no-referrer" src="https://beminimalist.co/cdn/shop/products/FaceWashSalicylic_1.jpg?v=1625141011" alt="Face Wash" className="w-full h-full object-contain mix-blend-multiply" />
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                                                        <span className="font-bold text-gray-900">14 Days ago</span> you purchased <span className="font-bold text-gray-900">Face Wash</span>.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAddToCart("Face Wash")}
                                                    className="w-full bg-[#111827] text-white font-bold py-3 rounded-xl text-sm hover:bg-gray-800 transition shadow-lg active:scale-95"
                                                >
                                                    Buy Again +
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cart Items */}
                                    {(() => {
                                        const { instant, quick, standard } = getDeliveryBuckets();

                                        return (
                                            <>
                                                {instant.length > 0 && (
                                                    <div className="mb-6 animate-in slide-in-from-bottom-2">
                                                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-xl">⚡</span> Pulse (30 Mins)
                                                        </h3>
                                                        {instant.map(item => renderCartItem(item))}
                                                    </div>
                                                )}
                                                {quick.length > 0 && (
                                                    <div className="mb-6 animate-in slide-in-from-bottom-2">
                                                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-xl">🏃</span> Quick (60 Mins)
                                                        </h3>
                                                        {quick.map(item => renderCartItem(item))}
                                                    </div>
                                                )}
                                                {standard.length > 0 && (
                                                    <div className="mb-6 animate-in slide-in-from-bottom-2">
                                                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                                            <span className="text-xl">📦</span> Brand Direct (3-5 Days)
                                                        </h3>
                                                        {standard.map(item => renderCartItem(item))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            )}

                            {/* ============ ADDRESS STEP ============ */}
                            {step === 'address' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="bg-white rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-900">📍 Delivery to</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Verified</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div>
                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 block">Name</label>
                                                    <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 block">Phone</label>
                                                    <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 block">Address</label>
                                                <input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2.5">
                                                <input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="Landmark/Area" />
                                                <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="City" />
                                                <input value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="PIN Code" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {['Home', 'Work', 'Other'].map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold cursor-pointer hover:bg-gray-200">{tag}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-3 bg-yellow-50 rounded-lg p-2.5 border border-yellow-100 flex items-center gap-2">
                                            <span className="text-sm">⚡</span>
                                            <p className="text-[11px] font-bold text-yellow-800">60-minute delivery to {selectedNode}</p>
                                        </div>
                                    </div>

                                    {/* Order Summary compact */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h3 className="text-xs font-black text-gray-900 mb-2">Order Summary</h3>
                                        {cartItems.map((item: any) => (
                                            <div key={item.name} className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600 truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                                                <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                            <span className="text-xs font-black text-gray-900">Total</span>
                                            <span className="text-sm font-black text-gray-900">₹{total}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ============ SUCCESS ============ */}
                            {step === 'success' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 p-2 md:p-6">
                                    <div className="text-center py-6 mt-4">
                                        <div className="text-green-500 flex justify-center mb-4 text-6xl animate-bounce">
                                            🎊
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Order Confirmed!</h2>
                                        <p className="text-lg font-mono font-bold text-gray-500 mt-4">Order ID: {orderId}</p>
                                        <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl p-4 mt-6 mx-auto max-w-[90%]">
                                            <p className="text-base md:text-lg font-black text-gray-200 leading-tight">
                                                You earned <span className="text-[#0066FF] text-xl md:text-2xl ml-1">{getTotalPoints()}</span> Dash24 Points on this order!
                                            </p>
                                        </div>
                                    </div>

                                    {/* The Retention UI - Intelligent Suggestion */}
                                    <div className="mt-6 w-full flex flex-col items-center">
                                        <div className="w-full">
                                            {lastOrder.slice(0, 1).map(item => (
                                                <PredictiveRestock 
                                                    key={item.name} 
                                                    productName={item.name} 
                                                    category={(ENRICHED_CATALOG.find((c: any) => c.name === item.name) as any)?.category || "Snacks"} 
                                                    onSchedule={(date) => {
                                                        // Demo hook for scheduling
                                                        console.log(`Scheduled ${item.name} for ${date}`);
                                                    }} 
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-500 text-center mt-3 px-2">
                                            Based on your historical orders, we can intelligently restock your most frequent items.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            clearCart();
                                            setCartOpen(false);
                                            setStep('cart');
                                        }}
                                        className="w-full bg-[#111827] text-white py-4 mt-8 rounded-2xl text-base font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-xl shadow-gray-900/20 active:scale-[0.98]"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ============ FOOTER ACTIONS ============ */}
                        {/* Cart footer with totals + checkout button */}
                        {step === 'cart' && cartItems.length > 0 && (
                            <div className="border-t border-gray-200 px-6 md:px-8 pt-4 pb-6 shrink-0">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{subtotal}</span>
                                </div>
                                {localShipping > 0 && (
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-gray-500 font-medium">Dash24 Delivery</span>
                                        <span className="font-bold text-gray-900">₹{localShipping}</span>
                                    </div>
                                )}
                                {brandShipping > 0 && (
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-gray-500 font-medium">Brand Direct Delivery</span>
                                        <span className="font-bold text-gray-900">₹{brandShipping}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end mb-4 pt-3 border-t border-gray-100">
                                    <span className="text-base font-black text-gray-900">Total</span>
                                    <span className="text-2xl font-black text-gray-900">₹{total}</span>
                                </div>
                                <button
                                    onClick={() => setStep('address')}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/30 active:scale-[0.98]"
                                >
                                    Proceed to Checkout →
                                </button>
                            </div>
                        )}

                        {/* Address footer */}
                        {step === 'address' && (
                            <div className="border-t border-gray-200 px-6 md:px-8 pt-4 pb-6 shrink-0 relative overflow-hidden">
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className={`relative z-10 w-full py-4 rounded-xl text-base font-bold transition-all shadow-xl bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30
                                    ${isProcessing ? 'opacity-90 overflow-hidden' : 'active:scale-[0.98]'}`}
                                >
                                    <span className={`transition-opacity duration-200 ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
                                        Proceed to Pay (₹{total})
                                    </span>
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="text-white font-bold">Processing Securely...</span>
                                        </div>
                                    )}
                                    {isProcessing && <div className="absolute top-0 bottom-0 left-[-20%] w-[150%] animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}