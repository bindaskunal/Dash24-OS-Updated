"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, ArrowRight } from "lucide-react";

const placeholders = [
    "Find me a matching hoodie for these sneakers...",
    "What's a healthy snack arriving in 10 mins?",
    "Show me new arrivals from Snitch.",
    "I need protein bars under ₹500.",
];

export default function MiniAISearch() {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [query, setQuery] = useState("");

    // Cycle placeholders
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            // Note: In a real app this would trigger the actual AI search context or redirect
            alert(`AI Search Triggered: "${query}" - Navigating to store...`);
            window.location.href = `/?q=${encodeURIComponent(query)}`;
        }
    };

    return (
        <div className="w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-[#00FF41] to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            
            <form onSubmit={handleSearch} className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex items-center p-2 shadow-2xl">
                <div className="pl-4 pr-3 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#00FF41] animate-pulse" />
                </div>
                
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm md:text-base h-12 w-full placeholder-gray-500 font-medium transition-all"
                />
                
                <button
                    type="submit"
                    className="h-10 w-10 bg-white/10 hover:bg-[#00FF41]/20 rounded-xl flex items-center justify-center text-white hover:text-[#00FF41] transition-colors border border-white/5 mx-1"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>
            
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-gray-500">
               <span>Powered by DashAI</span>
               <span className="w-1 h-1 rounded-full bg-gray-600"></span>
               <span>Instant Trial</span>
            </div>
        </div>
    );
}
