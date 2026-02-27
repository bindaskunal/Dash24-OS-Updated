import React from 'react';

export default function TheBrainWidget() {
    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        🧠
                    </span>
                    <h2 className="text-xl font-black text-white tracking-tight">The Brain</h2>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">Analytics Copilot</span>
                </div>

                {/* Input Area */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask anything about your brand's performance, unit economics, or inventory..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl py-4 pl-4 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-slate-500 font-medium shadow-inner"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md">
                        <span className="text-sm font-bold">→</span>
                    </button>
                </div>

                {/* Prompt Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-500 mr-1">Quick Prompts:</span>
                    {['Show me the top 3 piggyback items', 'When will my Tea Tree Face Wash stock out?', 'Compare WTP on weekends vs. weekdays'].map((prompt, idx) => (
                        <button
                            key={idx}
                            className="text-[11px] md:text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-full px-3 py-1.5 transition-all text-left truncate max-w-[200px] md:max-w-none"
                            title={prompt}
                        >
                            "{prompt}"
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
