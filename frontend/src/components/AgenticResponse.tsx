"use client";
import React, { useState, useEffect } from 'react';

export default function AgenticResponse({ 
  data, 
  catalog,
  onAddToCart,
  onProductClick 
}: { 
  data: any, 
  catalog: any[], 
  onAddToCart: (name: string) => void,
  onProductClick: (id: string) => void
}) {
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [primaryImgError, setPrimaryImgError] = useState(false);

  const thoughts = data?.thought_process || [];
  const primaryProductId = data?.primary_product_id;
  const alternativeIds = data?.alternative_product_ids || [];

  const primaryProduct = (primaryProductId ? catalog.find(p => p.id === primaryProductId) : null) || {
    id: primaryProductId || 1,
    name: data?.comparisonData?.products?.[0]?.name || "Minimalist 10% Vitamin C Serum",
    price: 699,
    mrp: 799,
    brand: data?.comparisonData?.products?.[0]?.name?.split(' ')?.[0] || "Minimalist",
    image_url: "https://placehold.co/600x600/1a1a1a/ffffff?text=Product",
    ai_intent_layers: { clarification: data?.reasoning || "Highly rated comparison match" }
  };
  const alternatives = alternativeIds.map((id:string) => catalog.find(p => p.id === id)).filter(Boolean);

  // Typewriter effect logic
  useEffect(() => {
    if (!thoughts.length) {
      setIsTyping(false);
      return;
    }

    if (currentThoughtIndex >= thoughts.length) {
      setIsTyping(false);
      return;
    }

    const currentThought = thoughts[currentThoughtIndex];
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex <= currentThought.length) {
        setDisplayedText(currentThought.substring(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentThoughtIndex((prev) => prev + 1);
        }, 800); // UI delay between thoughts
      }
    }, 30); // typing speed

    return () => clearInterval(typeInterval);
  }, [currentThoughtIndex, thoughts]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Typewriter AI Thoughts */}
      {thoughts.length > 0 && isTyping && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse shrink-0 border border-blue-200">
             <span className="text-blue-600 text-xl font-black">AI</span>
          </div>
          <p className="text-sm font-medium text-blue-900 font-mono tracking-tight">
            {displayedText}
            <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      )}

      {/* Headline Once Thinking is Over */}
      {!isTyping && data?.headline && (
         <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl text-gray-900 font-bold text-lg flex items-center gap-3">
           <span className="text-blue-600 text-2xl">✨</span>
           <span className="tracking-tight">{data.headline}</span>
         </div>
      )}

      {/* Focus Card (Primary Product) */}
      {!isTyping && primaryProduct && (
        <div className="w-full bg-gradient-to-br from-[#0f172a] to-[#1e1e1e] rounded-[32px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group border border-gray-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 relative z-10 items-center">
            <div 
               className="w-full h-64 md:h-96 bg-white/95 rounded-[32px] p-8 cursor-pointer hover:scale-[1.02] transition-transform duration-500 shadow-inner flex items-center justify-center"
               onClick={() => onProductClick(primaryProduct.id)}
            >
              <img 
                src={primaryImgError 
                  ? `https://placehold.co/600x600/1a1a1a/ffffff?text=${encodeURIComponent(primaryProduct.name)}` 
                  : (primaryProduct.image_url || primaryProduct.imageUrl || primaryProduct.image || 'https://placehold.co/600x600/1a1a1a/ffffff?text=No+Image')
                } 
                alt={primaryProduct.name} 
                className="w-full h-full object-cover mix-blend-multiply drop-shadow-2xl"
                referrerPolicy="no-referrer"
                onError={() => setPrimaryImgError(true)}
              />

            </div>
            <div className="flex-1 flex flex-col justify-center w-full h-full">
               <div className="mb-6">
                  {data?.pitch_title && (
                    <h2 className="text-4xl font-black mb-4 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                      {data.pitch_title}
                    </h2>
                  )}
                  {data?.reasoning && (
                    <p className="text-lg font-bold text-gray-300 mb-6 leading-relaxed">
                      {data.reasoning}
                    </p>
                  )}
                  <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 inline-block shadow-sm">
                    AI Top Match
                  </span>
                  <h3 className="text-2xl font-black mb-1 leading-tight tracking-tight text-white">{primaryProduct.name}</h3>
                  <p className="text-gray-400 font-medium text-sm mb-8 line-clamp-2 leading-relaxed">
                    {primaryProduct.ai_intent_layers?.clarification || `A highly rated item from ${primaryProduct.brand}`}
                  </p>
               </div>
               
               <div className="flex items-center justify-between mt-auto bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
                  <div className="flex flex-col">
                     <span className="text-gray-400 text-xs line-through mb-0.5">₹{primaryProduct.mrp}</span>
                     <span className="text-3xl font-black tracking-tight">₹{primaryProduct.price}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddToCart(primaryProduct.name); }}
                    className="bg-[#00FF41] hover:bg-[#00D135] text-gray-900 font-black px-6 py-3.5 rounded-xl uppercase tracking-wider text-sm transition-transform active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
                  >
                    Quick-Buy Now
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MISSION 46: AI Comparison Table Grid */}
      {!isTyping && data?.isComparison && data.comparisonData && (
        <div className="w-full bg-[#1e1e1e] border border-gray-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#00FF41] text-2xl">📊</span>
            <h3 className="text-lg font-black text-white tracking-tight">Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-[#1a1a1a] rounded-tl-xl">Feature</th>
                  {data.comparisonData.products.map((p: any, i: number) => (
                    <th key={i} className={`py-3 px-4 text-xs font-black text-white bg-[#111827] ${i === data.comparisonData.products.length - 1 ? 'rounded-tr-xl' : ''}`}>
                      {p.name.split(' ').slice(0, 3).join(' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.comparisonData.features.map((feature: string, idx: number) => (
                  <tr key={idx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-bold text-gray-400 bg-[#1a1a1a]/50">{feature}</td>
                    {data.comparisonData.products.map((p: any, i: number) => (
                      <td key={i} className={`py-3.5 px-4 text-xs font-medium ${i === 0 ? 'text-[#00FF41] font-bold' : 'text-gray-300'}`}>
                        {p.values[idx]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alternative Products Carousel */}
      {!isTyping && alternatives.length > 0 && (
         <div className="mt-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Alternative Options</p>
            <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
               {alternatives.map((item: any) => (
                  <AlternativeCard key={item.id} item={item} onProductClick={onProductClick} onAddToCart={onAddToCart} />
               ))}
            </div>
         </div>
      )}

    </div>
  );
}

function AlternativeCard({ item, onProductClick, onAddToCart }: any) {
  const [imgError, setImgError] = useState(false);
  return (
    <div 
      className="min-w-[170px] max-w-[170px] snap-start bg-white border border-gray-100 rounded-3xl p-3 flex flex-col cursor-pointer hover:border-gray-300 hover:shadow-md transition-all shadow-sm group"
      onClick={() => onProductClick(item.id)}
    >
       <div className="w-full h-28 mb-3 flex items-center justify-center p-2 bg-gray-50/50 rounded-2xl">
          <img 
            src={imgError 
              ? `https://placehold.co/600x600/1a1a1a/ffffff?text=${encodeURIComponent(item.name)}` 
              : (item.image_url || item.image || `https://placehold.co/600x600/1a1a1a/ffffff?text=${encodeURIComponent(item.name)}`)
            } 
            alt={item.name} 
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
       </div>
       <p className="text-xs font-bold text-gray-800 line-clamp-2 mb-2 leading-snug h-8 px-1">{item.name}</p>
       <div className="flex items-center justify-between mt-auto px-1">
          <span className="text-base font-black text-gray-900 tracking-tight">₹{item.price}</span>
          <button 
             onClick={(e) => { e.stopPropagation(); onAddToCart(item.name); }}
             className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center shadow-sm active:scale-95"
          >
             <span className="text-lg leading-none font-medium">+</span>
          </button>
       </div>
    </div>
  );
}
