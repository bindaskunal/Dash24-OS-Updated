"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MobileBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname?.startsWith('/dashboard')) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[999] pb-safe pb-4 pt-3 px-6 flex justify-between items-center isolate">
            <button onClick={() => router.push("/")} className={`flex flex-col items-center gap-1.5 transition ${pathname === '/' ? 'text-[#F97316]' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="text-xl leading-none">🏠</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Home</span>
            </button>
            <button onClick={() => router.push("/brands")} className={`flex flex-col items-center gap-1.5 transition ${pathname === '/brands' ? 'text-[#F97316]' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="text-xl leading-none">🏢</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Brands</span>
            </button>
            <button onClick={() => {
                if (pathname !== '/') {
                    router.push('/?search=1');
                } else {
                    window.dispatchEvent(new CustomEvent('open-pulse-search'));
                }
            }} className="flex flex-col items-center gap-1.5 transition relative group">
                <div className="absolute -top-6 bg-[#111827] group-active:scale-95 transition-transform w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-blue-500/20">
                    <span className="text-2xl leading-none drop-shadow-md">✨🔍</span>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase mt-6 text-gray-900">Pulse</span>
            </button>
            <button onClick={() => router.push("/arcade")} className={`flex flex-col items-center gap-1.5 transition ${pathname === '/arcade' ? 'text-[#F97316]' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="text-xl leading-none relative">
                    🎮
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Arcade</span>
            </button>
            <button onClick={() => router.push("/track")} className={`flex flex-col items-center gap-1.5 transition ${pathname === '/track' ? 'text-[#F97316]' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="text-xl leading-none">📍</span>
                <span className="text-[10px] font-bold tracking-widest uppercase">Track</span>
            </button>
        </div>
    );
}
