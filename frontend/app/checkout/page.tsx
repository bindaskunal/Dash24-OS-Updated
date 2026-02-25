"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../src/context/CartContext';
import { useLocation } from '../../src/context/LocationContext';
import { MASTER_CATALOG } from '../../src/data/constants';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { cartItems, total, subtotal, localShipping, brandShipping, handleAddToCart, clearCart, setCartOpen } = useCart();
    const { selectedNode } = useLocation();

    const isExpress = searchParams.get('express') === 'true';
    const expressProductId = searchParams.get('product');

    // For express: find the product
    const expressProduct = expressProductId ? MASTER_CATALOG.find((p: any) => p.id === expressProductId) : null;

    // Steps: 1 = Address, 2 = Payment, 3 = Confirmation
    const [step, setStep] = useState(isExpress ? 2 : 1);
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

    const displayItems = isExpress && expressProduct
        ? [{ name: expressProduct.name, price: expressProduct.price, quantity: 1, image_url: expressProduct.image_url }]
        : cartItems;

    const displayTotal = isExpress && expressProduct ? expressProduct.price : total;

    const generateOrderId = () => {
        const prefix = 'DASH';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    };

    const handlePlaceOrder = () => {
        const newOrderId = generateOrderId();
        setOrderId(newOrderId);
        setStep(3);
        if (!isExpress) {
            clearCart();
            setCartOpen(false);
        }
    };

    // Express mode: auto-add product to cart
    useEffect(() => {
        if (isExpress && expressProduct) {
            handleAddToCart(expressProduct.name);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                        <span className="text-lg">←</span>
                    </button>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">
                        {step === 3 ? 'Order Confirmed' : isExpress ? 'Express Checkout' : 'Checkout'}
                    </h1>
                    <div className="w-10" />
                </div>

                {/* Step Indicator */}
                {step < 3 && (
                    <div className="max-w-[800px] mx-auto px-6 pb-4">
                        <div className="flex items-center gap-2">
                            {['Address', 'Payment'].map((label, i) => (
                                <div key={label} className="flex items-center gap-2 flex-1">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                                        ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-xs font-bold ${step >= i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                                    {i < 1 && <div className={`flex-1 h-0.5 mx-1 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-[800px] mx-auto px-6 py-6">

                {/* ========== STEP 1: ADDRESS ========== */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-black text-gray-900">📍 Delivery Address</h2>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Verified</span>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Name</label>
                                        <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Phone</label>
                                        <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Address Line 1</label>
                                    <input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Area</label>
                                        <input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">City</label>
                                        <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">PIN</label>
                                        <input value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-yellow-50 rounded-xl p-3 border border-yellow-100 flex items-center gap-2">
                                <span className="text-sm">⚡</span>
                                <p className="text-xs font-bold text-yellow-800">60-minute delivery available to {selectedNode}</p>
                            </div>
                        </div>

                        {/* Order Summary Preview */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 mb-3">Order Summary</h3>
                            <div className="space-y-3">
                                {displayItems.map((item: any) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                                        <span className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-100 pt-3 flex justify-between">
                                    <span className="text-sm font-black text-gray-900">Total</span>
                                    <span className="text-lg font-black text-gray-900">₹{displayTotal}</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                            Continue to Payment →
                        </button>
                    </div>
                )}

                {/* ========== STEP 2: PAYMENT ========== */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-base font-black text-gray-900 mb-4">💳 Payment Method</h2>
                            <div className="space-y-3">
                                {[
                                    { id: 'upi', label: 'UPI / Google Pay', icon: '📱', desc: 'Instant payment via UPI' },
                                    { id: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Rupay' },
                                    { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks supported' },
                                    { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: '₹29 extra charge applies' },
                                ].map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                            ${paymentMethod === method.id
                                                ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-2xl">{method.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{method.label}</p>
                                            <p className="text-xs text-gray-500">{method.desc}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                            {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amount Summary */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500 font-medium">Subtotal</span>
                                <span className="text-sm font-bold text-gray-900">₹{isExpress && expressProduct ? expressProduct.price : subtotal}</span>
                            </div>
                            {!isExpress && localShipping > 0 && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500 font-medium">Delivery</span>
                                    <span className="text-sm font-bold text-gray-900">₹{localShipping}</span>
                                </div>
                            )}
                            {paymentMethod === 'cod' && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500 font-medium">COD Charge</span>
                                    <span className="text-sm font-bold text-gray-900">₹29</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-end">
                                <span className="text-base font-black text-gray-900">Amount to Pay</span>
                                <span className="text-2xl font-black text-gray-900">₹{displayTotal + (paymentMethod === 'cod' ? 29 : 0)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {!isExpress && (
                                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition active:scale-[0.98]">
                                    ← Back
                                </button>
                            )}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={!paymentMethod}
                                className={`flex-1 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition shadow-xl active:scale-[0.98]
                                    ${paymentMethod ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                            >
                                {isExpress ? '⚡ Pay & Dash It' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ========== STEP 3: ORDER CONFIRMATION ========== */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        {/* Confetti-style success card */}
                        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-xl text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500" />
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Order Placed!</h2>
                            <p className="text-gray-500 font-medium mb-4">Your order is being prepared for dispatch</p>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
                                <p className="text-xl font-black text-gray-900 font-mono tracking-wider">{orderId}</p>
                            </div>

                            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 mb-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg">⚡</span>
                                    <p className="text-sm font-bold text-yellow-800">Estimated delivery in 60 minutes to {selectedNode}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => router.push('/track')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition">
                                    Track Order →
                                </button>
                                <button onClick={() => router.push('/')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition">
                                    Continue Shopping
                                </button>
                            </div>
                        </div>

                        {/* Auto Add to Cart Suggestion */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">🤖</span>
                                <span className="text-base font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Auto Add to Cart</span>
                            </div>
                            <p className="text-base text-gray-600 font-medium mb-4 leading-relaxed">Based on your purchase patterns, we predict you'll need this again — we'll auto-add it to your next order.</p>

                            <div className="space-y-3">
                                {MASTER_CATALOG.slice(0, 3).filter((p: any) =>
                                    !displayItems.some((item: any) => item.name === p.name)
                                ).slice(0, 1).map((product: any) => (
                                    <div key={product.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                            <img referrerPolicy="no-referrer" src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.brand} • ₹{product.price}</p>
                                        </div>
                                        <button
                                            onClick={() => { handleAddToCart(product.name); }}
                                            className="px-3 py-2 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-orange-100 hover:bg-orange-100 transition whitespace-nowrap"
                                        >
                                            + Auto Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-black text-gray-400 tracking-widest uppercase">Loading Checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
