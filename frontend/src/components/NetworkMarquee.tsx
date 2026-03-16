"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Brand {
  name: string;
  logoUrl?: string;
  text?: string;
  color?: string;
}

const FALLBACK_BRANDS: Brand[] = [
  { name: "Snitch", text: "SNITCH", color: "text-white" },
  { name: "YogaBar", text: "YOGABAR", color: "text-orange-400" },
  { name: "Minimalist", text: "Minimalist", color: "text-gray-300 font-serif" },
  { name: "Dash24", text: "DASH24", color: "text-[#00FF41]" },
  { name: "Gourmet", text: "GOURMET", color: "text-yellow-500 font-black" },
];

export default function NetworkMarquee() {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const { data, error } = await supabase.from('brands').select('name, logo_url');
        if (data && !error && data.length > 0) {
          const mappedBrands = data.map(b => ({
            name: b.name,
            logoUrl: b.logo_url && b.logo_url !== 'null' ? b.logo_url : undefined,
            text: !b.logo_url ? b.name.toUpperCase() : undefined,
            color: 'text-white'
          }));
          
          if (mappedBrands.length > 0) {
              setBrands(mappedBrands);
          }
        }
      } catch (err) {
        console.error("Failed to fetch brands", err);
      }
    }
    
    fetchBrands();
  }, []);

  const displayBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <div className="w-full overflow-hidden bg-black/40 border-y border-white/5 py-4 my-8 relative flex items-center h-24">
        
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />

      {/* Marquee Container */}
      <div className="flex animate-marquee whitespace-nowrap items-center min-w-max">
        {displayBrands.map((brand, i) => (
          <div key={`${brand.name}-${i}`} className="flex items-center mx-8 md:mx-12">
             {brand.logoUrl ? (
                 <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="h-10 md:h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    referrerPolicy="no-referrer"
                 />
             ) : (
                 <span className={`text-2xl md:text-3xl font-black uppercase tracking-tighter opacity-70 hover:opacity-100 transition-opacity cursor-default ${brand.color || 'text-white'}`}>
                     {brand.text || brand.name}
                 </span>
             )}
             <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-8 md:mx-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
