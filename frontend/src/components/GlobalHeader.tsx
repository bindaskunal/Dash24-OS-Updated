"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocation } from "../context/LocationContext";
import { useCart } from "../context/CartContext";
import { NODE_DATA } from "../data/constants";

export default function GlobalHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { selectedNode, setSelectedNode, nodeOpen, setNodeOpen } = useLocation();
    const { cartCount, setCartOpen } = useCart();

    const [accountOpen, setAccountOpen] = useState(false);
    const [accountHover, setAccountHover] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [dropHover, setDropHover] = useState(false);
    const [greeting, setGreeting] = useState("Good morning");
    const accountRef = useRef<HTMLDivElement>(null);
    const nodeRef = useRef<HTMLDivElement>(null);

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
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    if (pathname?.startsWith('/dashboard')) return null;

    return (
        <>
            {/* ============ WEB VIEW HEADER ============ */}
            <header id="global-header-desktop" className="hidden md:block sticky top-0 bg-white/95 backdrop-blur-md z-[100] border-b border-gray-100 shadow-sm">
                {/* Row 1: Logo + Nav Tabs + Right Actions */}
                <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
                    {/* Left: Logo + Nav */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-1.5 group shrink-0">
                            <img referrerPolicy="no-referrer" src="/logo.png" alt="Dash24" className="h-8 w-auto object-contain group-hover:scale-105 transition-transform" />
                        </Link>

                        <nav className="flex items-center gap-0.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${pathname === link.path
                                        ? "text-[#F97316] border-b-2 border-[#F97316]"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Center: Search */}
                    <div className="flex-1 max-w-md">
                        <div className={`relative flex items-center bg-gray-50 border rounded-xl px-4 py-2.5 transition-all cursor-pointer ${searchFocused ? 'border-blue-300 shadow-sm ring-2 ring-blue-50' : 'border-gray-200'}`}
                            onClick={() => { window.dispatchEvent(new Event('open-pulse-search')); }}
                        >
                            <span className="text-gray-400 mr-2">🔍</span>
                            <span className="text-sm font-medium text-gray-400">Search products, brands...</span>
                        </div>
                    </div>

                    {/* Right: Account, Cart, Community Drop, Pulse Points */}
                    <div className="flex items-center gap-3">
                        {/* Community Drop with Progress Bar */}
                        <div className="relative" onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
                            <Link href="/arcade" className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-xs font-bold border border-orange-100 hover:bg-orange-100 transition">
                                <span>💎</span>
                                <div className="flex flex-col gap-1">
                                    <span className="uppercase tracking-wider text-[9px] leading-none">Community Drop</span>
                                    <div className="w-16 bg-orange-200/50 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full w-[84%] rounded-full" />
                                    </div>
                                </div>
                            </Link>
                            {dropHover && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 z-[200] pointer-events-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">💎</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Nothing Ear (2) Drop</p>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">42 of 50 neighbors have joined. 8 more to unlock ₹7,500 price.</p>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                                        <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full w-[84%] rounded-full" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold">Currently ₹12,999 → Unlock at ₹7,500</p>
                                </div>
                            )}
                        </div>

                        {/* Account Dropdown */}
                        <div className="relative" ref={accountRef}>
                            <button
                                onClick={() => setAccountOpen(!accountOpen)}
                                onMouseEnter={() => setAccountHover(true)}
                                onMouseLeave={() => setAccountHover(false)}
                                className="w-10 h-10 bg-blue-50 text-blue-700 flex items-center justify-center rounded-full font-bold transition hover:bg-blue-100 border border-blue-100"
                            >
                                K
                            </button>
                            {accountHover && !accountOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 text-white p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Last Order</p>
                                    <p className="text-xs font-bold truncate">Face Wash</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Delivered 2 days ago</p>
                                </div>
                            )}
                            {accountOpen && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden text-sm">
                                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                                        <p className="font-bold text-gray-900 text-base">Kunal Kumar</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1">Dash24 Insider</p>
                                    </div>
                                    <div className="p-2">
                                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition">My Orders</button>
                                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition">Payment Modes</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart Toggle */}
                        <div onClick={() => setCartOpen(true)} className="relative cursor-pointer hover:scale-105 transition">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-base border border-orange-100">🛒</div>
                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white">
                                    {cartCount}
                                </div>
                            )}
                        </div>

                        {/* Pulse Points */}
                        <div className="flex flex-col items-center relative gap-0.5">
                            <span className="text-sm bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center border border-blue-100 cursor-pointer hover:scale-105 transition shadow-sm">✨</span>
                            <span className="text-[8px] font-black uppercase text-blue-600">450 pts</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============ MOBILE TOP HEADER ============ */}
            <div className="md:hidden w-full px-4 pt-3 pb-2 flex items-center justify-between sticky top-0 z-[100] bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div className="flex flex-col max-w-[65%]">
                    <div className="flex items-center gap-1.5">
                        {/* Dash24 Brand Logo */}
                        <Link href="/" className="flex items-center gap-1">
                            <img referrerPolicy="no-referrer" src="/logo.png" alt="Dash24" className="h-6 w-auto object-contain" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <div onClick={() => setCartOpen(true)} className="relative cursor-pointer transition">
                        <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-sm border border-orange-100 shadow-inner">🛒</div>
                        {cartCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                                {cartCount}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center relative">
                        <span className="text-sm bg-blue-50 text-blue-600 w-9 h-9 rounded-full flex items-center justify-center border border-blue-100 cursor-pointer shadow-inner">✨</span>
                        <span className="absolute -bottom-3 text-[8px] font-bold uppercase text-blue-600">450 pts</span>
                    </div>
                </div>
            </div>
        </>
    );
}
