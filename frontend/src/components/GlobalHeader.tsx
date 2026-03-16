"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocation } from "../context/LocationContext";
import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";
import { NODE_DATA } from "../data/constants";
import { getDeliveryTimeString } from "../utils/locationUtils";
import ClaimBonusModal from "./ClaimBonusModal";
import { supabase } from "../lib/supabaseClient";

export default function GlobalHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { selectedNode, setSelectedNode, nodeOpen, setNodeOpen } = useLocation();
    const cartCountRaw = useCartStore(state => state.getTotalItems());
    const totalPointsRaw = useCartStore(state => state.getTotalPoints());
    const isAuthenticatedRaw = useUserStore(state => state.isAuthenticated);
    const pulseWalletPointsRaw = useUserStore(state => state.pulsePoints);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const cartCount = mounted ? cartCountRaw : 0;
    const totalPoints = mounted ? totalPointsRaw : 0;
    const activePoints = 450 + totalPoints;
    const isAuthenticated = mounted ? isAuthenticatedRaw : false;
    const pulseWalletPoints = mounted ? pulseWalletPointsRaw : 0;

    // Polyfill setCartOpen event since CartContext is being phased out
    const setCartOpen = (open: boolean) => {
        if (open) window.dispatchEvent(new Event('open-global-cart'));
    };

    const [accountOpen, setAccountOpen] = useState(false);
    const [accountHover, setAccountHover] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [dropHover, setDropHover] = useState(false);
    const [greeting, setGreeting] = useState("Good morning");
    const accountRef = useRef<HTMLDivElement>(null);
    const nodeRef = useRef<HTMLDivElement>(null);
    const mobileNodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting("Good morning");
        else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
                setNodeOpen(false);
            }
            if (mobileNodeRef.current && !mobileNodeRef.current.contains(event.target as Node)) {
                setNodeOpen(false);
            }
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [lastOrderData, setLastOrderData] = useState<any>(null);
    const [orderChecked, setOrderChecked] = useState(false);

    useEffect(() => {
        const fetchLastOrder = async () => {
            if (!isAuthenticatedRaw) {
                setLastOrderData(null);
                setOrderChecked(true);
                return;
            }
            
            try {
                const { data: userAuthData } = await supabase.auth.getUser();
                if (!userAuthData.user) {
                    setOrderChecked(true);
                    return;
                }
                
                // Fetch the most recent order for loged in user
                const { data } = await supabase
                    .from('orders')
                    .select('id, status, created_at')
                    .eq('user_id', userAuthData.user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (data) {
                    setLastOrderData(data);
                }
            } catch (e) {
                console.error("Failed to fetch last order:", e);
            } finally {
                setOrderChecked(true);
            }
        };
        
        if (mounted) fetchLastOrder();
    }, [mounted, isAuthenticatedRaw]);

    const handleNodeChange = (node: string) => {
        setSelectedNode(node);
        setNodeOpen(false);
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Brands", path: "/brands" },
        { name: "Arcade", path: "/arcade" },
        { name: "Track", path: "/track" },
    ];

    if (pathname?.startsWith('/dashboard') || pathname === '/landing') return null;

    return (
        <>
            {/* ============ WEB VIEW HEADER ============ */}
            <header id="global-header-desktop" className="hidden md:flex flex-col sticky top-0 bg-white/95 backdrop-blur-md z-[100] border-b border-gray-100 shadow-sm">
                
                {/* TOP TIER: Main Navigation */}
                <div className="px-6 py-4 flex items-center justify-between gap-6 bg-white w-full max-w-[1400px] mx-auto">
                    
                    {/* Left: Logo & Nav Links */}
                    <div className="flex items-center gap-8 shrink-0">
                        <Link href="/" className="flex items-center gap-1.5 group">
                            <img referrerPolicy="no-referrer" src="/logo.png" alt="Dash24" className="h-8 w-auto object-contain group-hover:scale-105 transition-transform" />
                        </Link>
                        
                        <nav className="flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    className={`text-sm font-semibold transition-all ${pathname === link.path
                                        ? "text-[#F97316] font-bold"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 max-w-xl mx-auto px-4">
                        <div 
                            className={`relative flex items-center bg-gray-50 border rounded-xl px-4 py-2.5 transition-all cursor-pointer ${searchFocused ? 'border-blue-300 shadow-sm ring-2 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            onClick={() => { window.dispatchEvent(new Event('open-pulse-search')); }}
                        >
                            <span className="text-gray-400 mr-2">🔍</span>
                            <span className="text-sm font-medium text-gray-400">Search products, brands...</span>
                        </div>
                    </div>

                    {/* Right Hand Side Icons */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Community Drop */}
                        <div className="relative" onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
                            <Link href="/arcade" className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-100 transition">
                                <span>💎</span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="uppercase tracking-wider text-[8px] leading-none">Drop 🔥 Fast Filling!</span>
                                </div>
                            </Link>
                            {dropHover && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 z-[200]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">💎</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Nothing Ear (2) Drop</p>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">42 of 50 neighbors joined. 8 more to unlock ₹7,500 price.</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Toggle */}
                        <div onClick={() => setCartOpen(true)} className="relative cursor-pointer hover:scale-105 transition">
                            <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-base border border-orange-100">🛒</div>
                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white">
                                    {cartCount}
                                </div>
                            )}
                        </div>

                        {/* Pulse Points / Auth Button */}
                        {isAuthenticated ? (
                            <Link href="/wallet" className="flex items-center gap-1.5 bg-gray-900 text-[#00FF41] px-4 py-1.5 rounded-full font-black border border-[#00FF41]/30 hover:bg-gray-800 transition-colors uppercase tracking-widest text-xs">
                                🪙 {pulseWalletPoints} Pulse
                            </Link>
                        ) : (
                            <button onClick={() => setIsAuthModalOpen(true)} className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm">
                                Login / Register
                            </button>
                        )}

                        {/* Account (Simplifed Icon inline if auth) */}
                        {isAuthenticated && (
                            <div className="relative" ref={accountRef}>
                                <button
                                    onClick={() => setAccountOpen(!accountOpen)}
                                    className="w-8 h-8 bg-blue-50 text-blue-700 flex items-center justify-center rounded-full font-bold transition hover:bg-blue-100 border border-blue-100 text-sm"
                                >
                                    K
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM TIER: Secondary Nav / Sub-bar */}
                <div className="border-t border-gray-100 bg-gray-50/50 hidden md:block w-full">
                    <div className="px-6 py-2 flex items-center justify-between max-w-[1400px] mx-auto w-full text-xs">
                        
                        {/* Left: Greeting */}
                        <div className="text-gray-600 font-medium w-1/3 text-left">
                            {greeting}, <span className="font-bold text-gray-900">Kunal</span>
                        </div>

                        {/* Center: Location Selector (Yellow Box) */}
                        <div className="relative flex items-center justify-center w-1/3 flex-shrink-0" ref={nodeRef}>
                            <button
                                onClick={() => setNodeOpen(!nodeOpen)}
                                className="flex items-center justify-center gap-2 text-gray-900 bg-white px-4 py-1.5 rounded-md border border-yellow-400 shadow-[0_2px_10px_rgba(250,204,21,0.15)] hover:bg-yellow-50 transition-colors group"
                            >
                                <span className="text-sm shadow-sm p-1 rounded-full bg-yellow-100">🛵</span>
                                <span className="font-bold tracking-tight">60 Mins to <span className="text-yellow-700">{selectedNode || "Select Node"}</span></span>
                                <span className="text-[8px] text-gray-400 group-hover:text-yellow-600 transition-colors">▼</span>
                            </button>
                            
                            {nodeOpen && (
                                <div className="absolute top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-[200] overflow-hidden">
                                    <div className="p-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Pulse Node</p>
                                    </div>
                                    <div className="flex flex-col max-h-[250px] overflow-y-auto p-2 gap-1 text-left">
                                        {Object.keys(NODE_DATA).map((node) => (
                                            <button
                                                key={node}
                                                onClick={() => handleNodeChange(node)}
                                                className={`text-left p-1.5 rounded-lg text-xs font-bold transition-colors flex flex-col gap-0.5 ${selectedNode === node ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
                                            >
                                                <span>{node}</span>
                                                <span className="text-[9px] font-medium text-gray-400">
                                                    {getDeliveryTimeString(node)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Last Order */}
                        <div className="w-1/3 text-right flex justify-end">
                            {orderChecked && (
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    {lastOrderData ? (
                                        <>
                                            <Link href="/track" className="hover:text-blue-600 transition flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    {lastOrderData.status !== "Delivered" && lastOrderData.status !== "Cancelled" && (
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    )}
                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${lastOrderData.status === "Delivered" ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                </span>
                                                Last order <span className="font-bold text-gray-900 border-b border-gray-300 border-dashed">{lastOrderData.status}</span>
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            Your first order awaits! 🚀
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </header>

            {/* ============ MOBILE TOP HEADER ============ */}
            <div className="md:hidden w-full px-4 pt-3 pb-2 flex items-center justify-between sticky top-0 z-[100] bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div className="flex flex-col gap-2 max-w-[65%]">
                    {/* Dash24 Brand Logo & Greeting */}
                    <div className="flex flex-col items-start gap-0.5">
                        <Link href="/" className="flex items-center gap-1 shrink-0">
                            <img referrerPolicy="no-referrer" src="/logo.png" alt="Dash24" className="h-6 w-auto object-contain" />
                        </Link>
                        <span className="text-[10px] text-gray-500">{greeting}, <span className="font-bold text-gray-900">Kunal</span></span>
                    </div>

                    {/* Mobile Pulse Location Selector */}
                    <div className="relative" ref={mobileNodeRef}>
                        <button
                            onClick={() => setNodeOpen(!nodeOpen)}
                            className="flex items-center justify-between gap-1 p-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 rounded-lg border border-[#FFD700]/30 transition-colors w-full"
                        >
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{selectedNode || "Select Node"}</span>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-gray-900 bg-[#FFD700] px-1.5 py-0.5 rounded shadow-sm w-max">
                                    {getDeliveryTimeString(selectedNode)}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-600 shadow-sm px-1 py-0.5 rounded bg-white shrink-0">▼</span>
                        </button>

                        {nodeOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-[200] overflow-hidden">
                                <div className="p-2 bg-gray-50 border-b border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Pulse Node</p>
                                </div>
                                <div className="flex flex-col max-h-[250px] overflow-y-auto p-2 gap-2">
                                    {Object.keys(NODE_DATA).map((node) => (
                                        <button
                                            key={node}
                                            onClick={() => handleNodeChange(node)}
                                            className={`text-left p-2 rounded-lg text-xs font-bold transition-colors flex flex-col gap-1 ${selectedNode === node ? 'bg-[#FFD700]/20 text-gray-900 border border-[#FFD700]' : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
                                        >
                                            <span>{node}</span>
                                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 w-max rounded ${selectedNode === node ? 'bg-[#FFD700] text-gray-900' : 'bg-gray-200 text-gray-600'}`}>
                                                {getDeliveryTimeString(node)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {isAuthenticated ? (
                        <Link href="/wallet" className="flex items-center gap-1 bg-gray-900 text-[#00FF41] px-3 py-1.5 rounded-full font-black border border-[#00FF41]/30 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                            <span className="text-sm">🪙</span> <span className="text-[10px] uppercase tracking-wider">{pulseWalletPoints} pts</span>
                        </Link>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Login
                        </button>
                    )}
                    <div onClick={() => setCartOpen(true)} className="relative cursor-pointer transition">
                        <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-sm border border-orange-100 shadow-inner">🛒</div>
                        {cartCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                                {cartCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* In-Place Global Auth Modal */}
            <ClaimBonusModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}
