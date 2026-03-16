"use client";

import React from 'react';

export default function OrderSuccessMap() {
    return (
        <div className="relative w-full h-64 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 isolate mb-6">
            {/* Embedded map of Whitefield (~12.9698, 77.7499) */}
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15551.487056269438!2d77.7381676!3d12.9698188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae11f35d0dfc83%3A0x30cfa512d80115f9!2sWhitefield%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin"
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 filter grayscale"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Whitefield Pulse Node"
            />

            {/* Dark overlay to make the pulse pop */}
            <div className="absolute inset-0 bg-gray-900/40 z-10 mix-blend-multiply"></div>

            {/* The Pulse Animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                {/* Ripples */}
                <div className="absolute w-24 h-24 bg-[#FFD700]/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute w-16 h-16 bg-[#FFD700]/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>

                {/* Core Dot */}
                <div className="relative w-6 h-6 bg-[#FFD700] rounded-full shadow-[0_0_20px_#FFD700] border-2 border-white flex flex-col items-center justify-center">
                    <span className="absolute -top-6 text-[10px] font-black uppercase tracking-wider text-white bg-gray-900 px-2 py-0.5 rounded shadow-lg whitespace-nowrap">Pulse Origin</span>
                </div>
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10 pointer-events-none"></div>

            <div className="absolute bottom-3 left-3 z-20">
                <p className="text-white text-xs font-black uppercase tracking-widest drop-shadow-md">Whitefield Pilot Node</p>
                <p className="text-[#FFD700] text-[10px] font-bold mt-0.5">Fulfillment sequence initiated</p>
            </div>
        </div>
    );
}
