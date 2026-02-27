"use client";

import React, { useState } from 'react';

export default function TheBrainWidget() {
    const [inputValue, setInputValue] = useState('');
    const [chatOutput, setChatOutput] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    const handleSubmit = (query: string = inputValue) => {
        if (!query.trim()) return;

        setInputValue(query); // Ensure input shows the pill text if clicked
        setIsTyping(true);
        setChatOutput(null);

        // Simulate network delay for AI feel
        setTimeout(() => {
            const lowerQuery = query.toLowerCase();

            if (lowerQuery.includes('piggyback')) {
                setChatOutput('Based on the last 30 days of dark store data, Mamaearth products are most frequently co-purchased with:\n1. The Whole Truth (35% of mixed baskets)\n2. Sleepy Owl (28%)\n3. MCaffeine (15%)');
            } else if (lowerQuery.includes('stock out') || lowerQuery.includes('tea tree')) {
                setChatOutput('⚠️ Inventory Alert: At the current split pulse velocity of 4.2 days, your Tea Tree Face Wash (Current Bangalore Hub Stock: 18 units) is projected to stock out in exactly 4 days. Would you like me to draft a replenishment PO for 50 units?');
            } else if (lowerQuery.includes('weekends vs') || lowerQuery.includes('wtp')) {
                setChatOutput('Your Weekend Willingness to Pay (WTP) averages ₹325, whereas Weekday WTP drops to ₹295.\n\nInsight: You are leaving margin on the table. Consider running premium bundle drops exclusively on Friday evenings.');
            } else {
                setChatOutput('Analyzing live dark store node data... (Demo Mode: Please use the pre-configured quick prompts for this presentation).');
            }
            setIsTyping(false);
        }, 800);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const clearChat = () => {
        setInputValue('');
        setChatOutput(null);
    };

    const quickPrompts = [
        'Show me the top 3 piggyback items',
        'When will my Tea Tree Face Wash stock out?',
        'Compare WTP on weekends vs. weekdays'
    ];

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8 transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            🧠
                        </span>
                        <h2 className="text-xl font-black text-white tracking-tight">The Brain</h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">Analytics Copilot</span>
                    </div>
                </div>

                {/* Input Area */}
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your brand's performance, unit economics, or inventory..."
                        className="w-full bg-white text-gray-900 border border-slate-300 rounded-xl py-4 pl-4 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-gray-500 font-medium shadow-inner"
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-md"
                    >
                        {isTyping ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="text-sm font-bold">→</span>
                        )}
                    </button>
                </div>

                {/* Prompt Chips (Only show if chatOutput is null) */}
                {!chatOutput && !isTyping && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 animate-in fade-in duration-300">
                        <span className="text-xs font-bold text-slate-500 mr-1">Quick Prompts:</span>
                        {quickPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSubmit(prompt)}
                                className="text-[11px] md:text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-500 rounded-full px-3 py-1.5 transition-all text-left truncate max-w-[200px] md:max-w-none cursor-pointer"
                                title={prompt}
                            >
                                "{prompt}"
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat Output Area */}
                {chatOutput && (
                    <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-xl p-5 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400">Insight Generated</h3>
                            <button
                                onClick={clearChat}
                                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <span>⟲</span> Reset
                            </button>
                        </div>
                        <div className="text-gray-100 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">
                            {chatOutput}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
