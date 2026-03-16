"use client";

import React from 'react';
import Link from 'next/link';
import { RankedBrand } from '../hooks/useRankedBrands';

interface BrandCardProps {
    brand: RankedBrand;
}

export default function BrandCard({ brand }: BrandCardProps) {
    return (
        <Link
            href={`/brands?name=${encodeURIComponent(brand.name)}`}
            className={`
                group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border 
                ${brand.isFastTrack ? 'border-[#FFD700] ring-1 ring-[#FFD700]/30' : 'border-gray-100'} 
                overflow-hidden p-2 gap-2 h-full relative
            `}
        >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2 mb-1">
                <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                />
            </div>

            <div className="flex flex-col items-center justify-between w-full h-full mt-auto">
                <div className="flex flex-col items-center mb-2">
                    <span className="text-[10px] sm:text-xs font-bold text-center text-gray-800 line-clamp-1 w-full px-1">
                        {brand.name}
                    </span>
                    {brand.isDemanded && (
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                            High Demand
                        </span>
                    )}
                </div>

                <span className="w-full mt-auto flex items-center justify-center bg-[#FFD700] hover:bg-[#FFD700]/90 text-gray-900 text-[10px] font-bold py-1.5 rounded-lg border border-[#FFD700]/30 transition-colors uppercase tracking-wider relative z-20">
                    Explore Brand →
                </span>
            </div>
        </Link>
    );
}
