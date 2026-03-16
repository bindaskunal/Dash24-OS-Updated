"use client";

import React from 'react';
import { useLocation } from '../context/LocationContext';
import { useRankedBrands } from '../hooks/useRankedBrands';
import BrandCard from './BrandCard';

export default function BrandDiscoveryFeed() {
    const { selectedNode } = useLocation();
    const rankedBrands = useRankedBrands(selectedNode);

    if (!rankedBrands || rankedBrands.length === 0) {
        return null;
    }

    return (
        <section className="w-full max-w-[1200px] mx-auto px-4 py-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Discovery Pulse
                </h2>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                    {rankedBrands.length} Brands Base
                </span>
            </div>

            {/* 8px Grid system gap-2 = 8px. Fixed template controls layout shift */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {rankedBrands.map((brand) => (
                    <BrandCard key={brand.name} brand={brand} />
                ))}
            </div>
        </section>
    );
}
