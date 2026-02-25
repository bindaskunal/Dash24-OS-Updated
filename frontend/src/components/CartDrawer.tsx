"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { MASTER_CATALOG } from "../data/constants";

export default function CartDrawer() {
    const {
        cartItems, cartOpen, setCartOpen,
        handleAddToCart, handleDecrease, handleRemoveItem, clearCart,
        total, subtotal, localShipping, brandShipping, amountRemaining, progressPercentage
    } = useCart();

    const { selectedNode } = useLocation();

    // Checkout flow states: 'cart' | 'address' | 'payment' | 'confirmed'
    const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'confirmed'>('cart');
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [orderId, setOrderId] = useState('');

    const [address, setAddress] = useState({
        name: 'Kunal Kumar',
        phone: '+91 98765 43210',
        line1: 'Flat 42, Tower B',
        line2: `Prestige ${selectedNode}`,
        city: 'Bangalore',
        pin: '560095',
    });

    // Reset step when drawer closes
    useEffect(() => {
        if (!cartOpen) {
            setStep('cart');
            setPaymentMethod(null);
            setOrderId('');
        }
    }, [cartOpen]);

    const generateOrderId = () => {
        const prefix = 'DASH';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    };

    const handlePlaceOrder = () => {
        const newOrderId = generateOrderId();
        setOrderId(newOrderId);
        clearCart();
        setStep('confirmed');
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

    if (!cartOpen) return null;

    // Auto Add suggestions (products not in current cart)
    const autoAddSuggestions = (MASTER_CATALOG as any[]).filter((p: any) =>
        !cartItems.some(item => item.name === p.name)
    ).slice(0, 1);

    const drawerTitle = step === 'cart' ? 'Your Cart'
        : step === 'address' ? 'Delivery Address'
            : step === 'payment' ? 'Payment'
                : 'Order Confirmed';

    return (
        <div className="fixed inset-0 z-[120]">
            {/* Backdrop */}
            <div
                onClick={() => setCartOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            {/* Wider side panel */}
            <div className="
                absolute bg-white shadow-2xl flex flex-col
                right-0 top-0 bottom-0 w-[100vw] md:w-[33vw] md:min-w-[420px] md:max-w-[520px]
                md:animate-in md:slide-in-from-right md:duration-300
                max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-auto max-md:h-[90vh] max-md:rounded-t-[32px] max-md:animate-in max-md:slide-in-from-bottom max-md:duration-300
            ">
                {/* Drag handle (mobile) */}
                <div className="hidden max-md:block mx-auto w-12 h-1.5 rounded-full bg-gray-300 mt-3 mb-2 flex-shrink-0" />

                {/* Header */}
                <div className="flex justify-between items-center px-6 md:px-8 pt-6 pb-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== 'cart' && step !== 'confirmed' && (
                            <button onClick={() => setStep(step === 'payment' ? 'address' : 'cart')} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition text-sm">←</button>
                        )}
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{drawerTitle}</h2>
                    </div>
                    <button onClick={() => setCartOpen(false)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition font-bold text-gray-500">✕</button>
                </div>

                {/* Step indicator for checkout */}
                {(step === 'address' || step === 'payment') && (
                    <div className="px-6 md:px-8 py-3 border-b border-gray-50 shrink-0">
                        <div className="flex items-center gap-2">
                            {['Address', 'Payment'].map((label, i) => {
                                const stepNum = i + 1;
                                const isActive = (step === 'address' && stepNum === 1) || (step === 'payment' && stepNum === 2);
                                const isDone = (step === 'payment' && stepNum === 1);
                                return (
                                    <div key={label} className="flex items-center gap-2 flex-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                                            ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {isDone ? '✓' : stepNum}
                                        </div>
                                        <span className={`text-[11px] font-bold ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                                        {i < 1 && <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                                    </div>
                                );
                            })}
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
                                                <img src="https://beminimalist.co/cdn/shop/products/FaceWashSalicylic_1.jpg?v=1625141011" alt="Face Wash" className="w-full h-full object-contain mix-blend-multiply" />
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
                            {cartItems.map((item) => (
                                <div key={item.name} className="flex justify-between items-center border-b border-gray-100 pb-5 mb-5">
                                    <div className="w-2/3">
                                        <p className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate">{item.name}</p>
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
                                    </div>
                                </div>
                            ))}
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
                                        <input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="Area" />
                                        <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="City" />
                                        <input value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-900 border border-gray-200 focus:border-blue-400 outline-none" placeholder="PIN" />
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

                    {/* ============ PAYMENT STEP ============ */}
                    {step === 'payment' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="space-y-2.5">
                                {[
                                    { id: 'upi', label: 'UPI / Google Pay', icon: '📱', desc: 'Instant via UPI' },
                                    { id: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Rupay' },
                                    { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
                                    { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: '+₹29 extra' },
                                ].map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all
                                            ${paymentMethod === method.id
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-xl">{method.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{method.label}</p>
                                            <p className="text-[11px] text-gray-500">{method.desc}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                            {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Amount */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{subtotal}</span>
                                </div>
                                {localShipping > 0 && (
                                    <div className="flex justify-between mb-1 text-xs">
                                        <span className="text-gray-500">Delivery</span>
                                        <span className="font-bold text-gray-900">₹{localShipping}</span>
                                    </div>
                                )}
                                {paymentMethod === 'cod' && (
                                    <div className="flex justify-between mb-1 text-xs">
                                        <span className="text-gray-500">COD Charge</span>
                                        <span className="font-bold text-gray-900">₹29</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-end">
                                    <span className="text-sm font-black text-gray-900">Total</span>
                                    <span className="text-xl font-black text-gray-900">₹{total + (paymentMethod === 'cod' ? 29 : 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ CONFIRMED ============ */}
                    {step === 'confirmed' && (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            {/* Success */}
                            <div className="text-center py-4">
                                <div className="text-5xl mb-3">🎉</div>
                                <h2 className="text-2xl font-black text-gray-900 mb-1">Order Placed!</h2>
                                <p className="text-sm text-gray-500 font-medium">Being prepared for dispatch</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
                                <p className="text-lg font-black text-gray-900 font-mono tracking-wider">{orderId}</p>
                            </div>

                            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 flex items-center justify-center gap-2">
                                <span className="text-base">⚡</span>
                                <p className="text-xs font-bold text-yellow-800">Estimated 60 min to {selectedNode}</p>
                            </div>

                            {/* AUTO ADD TO CART — Prominent Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🤖</span>
                                    <h3 className="text-lg font-black text-blue-700 uppercase tracking-wide">Auto Add to Cart</h3>
                                </div>
                                <p className="text-base text-gray-600 font-medium mb-4 leading-relaxed">
                                    Based on your purchase patterns, we predict you'll need these again. Enable auto-add and we'll add them to your cart when it's time.
                                </p>

                                <div className="space-y-3">
                                    {autoAddSuggestions.map((product: any) => {
                                        const days = getConsumptionDays(product.name);

                                        return (
                                            <div key={product.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-gray-900 truncate">{product.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{product.brand} • ₹{product.price}</p>
                                                        <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                                                            🔄 Predicted reorder in <span className="text-blue-800">{days} days</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => startAutoAdd(product.name)}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-[0.98]"
                                                >
                                                    🔄 Auto Add in {days} Days
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                                <button onClick={() => { setCartOpen(false); window.location.href = '/track'; }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition">
                                    Track Order
                                </button>
                                <button onClick={() => setCartOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition">
                                    Continue Shopping
                                </button>
                            </div>
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
                    <div className="border-t border-gray-200 px-6 md:px-8 pt-4 pb-6 shrink-0">
                        <button
                            onClick={() => setStep('payment')}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/30 active:scale-[0.98]"
                        >
                            Continue to Payment →
                        </button>
                    </div>
                )}

                {/* Payment footer */}
                {step === 'payment' && (
                    <div className="border-t border-gray-200 px-6 md:px-8 pt-4 pb-6 shrink-0">
                        <button
                            onClick={handlePlaceOrder}
                            disabled={!paymentMethod}
                            className={`w-full py-4 rounded-xl text-base font-bold transition shadow-xl active:scale-[0.98]
                                ${paymentMethod ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                        >
                            Place Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
