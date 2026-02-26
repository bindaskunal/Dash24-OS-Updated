// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import LivePulseCard from "../src/components/LivePulseCard";
import ENRICHED_CATALOG from "../data/enriched_catalog.json";

const ScrollableRow = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/scroller w-full overflow-hidden">
      <button onClick={() => scroll('left')} className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-gray-800 w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center opacity-70 md:opacity-30 group-hover/scroller:opacity-100 active:bg-gray-50 transition-all hover:scale-110 active:scale-95 disabled:opacity-0 cursor-pointer pointer-events-auto">
        <span className="text-lg md:text-xl font-bold leading-none -ml-0.5">←</span>
      </button>

      <div ref={scrollRef} className={`overflow-x-auto hide-scrollbar scroll-smooth relative w-full ${className}`}>
        {children}
      </div>

      <button onClick={() => scroll('right')} className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 text-gray-800 w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center opacity-70 md:opacity-30 group-hover/scroller:opacity-100 active:bg-gray-50 transition-all hover:scale-110 active:scale-95 disabled:opacity-0 cursor-pointer pointer-events-auto">
        <span className="text-lg md:text-xl font-bold leading-none -mr-0.5">→</span>
      </button>
    </div>
  );
};
import { BRAND_LOGOS, MASTER_CATALOG, NODE_DATA, HERO_BANNERS, QUICK_CATEGORIES } from "../src/data/constants";
import { useCart } from "../src/context/CartContext";
import { useLocation } from "../src/context/LocationContext";

const generateNodeItems = (nodeName: string) => {
  // Track which brands already have a "brand direct" product
  const brandDirectAssigned = new Set<string>();

  return ENRICHED_CATALOG.map(item => {
    const enrichedData = item;
    let stock = 0;
    if (item.inventory && nodeName in item.inventory) {
      stock = item.inventory[nodeName as keyof typeof item.inventory];
    }

    // Assign 1 product per brand as "Brand Direct" with 4-day delivery
    let brandDeliveryDays = stock === 0 ? 3 : 0;
    if (!brandDirectAssigned.has(item.brand)) {
      brandDirectAssigned.add(item.brand);
      brandDeliveryDays = 4; // Brand Direct fulfillment
    }

    return {
      ...item,
      id: enrichedData?.id || item.id,
      ai_intent_layers: enrichedData?.ai_intent_layers || null,
      fulfilledBy: enrichedData?.fulfilledBy || "Dash24",
      stock: stock,
      localAvailable: stock > 0,
      refillInDays: stock === 0 ? 1 : 0,
      brandDeliveryDays: enrichedData?.fulfilledBy === "Brand" ? 4 : 0,
      isBrandDirect: enrichedData?.fulfilledBy === "Brand",
    };
  });
};

const AGENTIC_DROPS = [
  { name: "Vitamin C Serum", img: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000008_a.jpg?tr=w-344,h-344,cm-pad_resize", startPrice: 699, floor: 549 },
  { name: "Cold Brew Cans", img: "https://bluetokaicoffee.com/cdn/shop/files/2.-Mocha-Cold-_Double.jpg?v=1723805313&width=1800", startPrice: 750, floor: 549 },
  { name: "Plant Protein Isolate", img: "https://media.thewholetruthfoods.com/public/backend-assets/01K13EVF2K7B4CZ6BDHWPSCPTZ.png", startPrice: 1899, floor: 1399 },
];

export default function Home({ searchParams }: { searchParams?: { preview?: string; search?: string } }) {
  const isPreviewRenderer = searchParams?.preview === "1";
  const router = useRouter();
  const [products, setProducts] = useState(ENRICHED_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");

  // USE CONTEXTS
  const { selectedNode, setSelectedNode, setNodeOpen } = useLocation();
  const { cartItems, cartCount, cartOpen, setCartOpen, handleAddToCart, handleDecrease, handleRemoveItem, clearCart, total, subtotal, localShipping, brandShipping, amountRemaining, progressPercentage, showCartToast, toastItem } = useCart();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [zoneOrders, setZoneOrders] = useState(12);
  const [aiMode, setAiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || "");
  const [intent, setIntent] = useState<"product" | "question" | "compare" | null>(searchParams?.search ? "product" : null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Agentic Search States
  const [isSearching, setIsSearching] = useState(false);
  const [agenticMatches, setAgenticMatches] = useState<any[]>([]);
  const [agenticReasoning, setAgenticReasoning] = useState<string | null>(null);
  const [agenticComparison, setAgenticComparison] = useState<any>(null);
  const [agenticRawData, setAgenticRawData] = useState<any>(null);

  const [showBattle, setShowBattle] = useState(false);
  const [battleStep, setBattleStep] = useState(0);
  const [battleAnswer, setBattleAnswer] = useState<boolean | null>(null);
  const [lockedProducts, setLockedProducts] = useState<Set<string>>(new Set());

  // NEW: Floating Mobile Insight Bubble State
  const [showInsight, setShowInsight] = useState(false);
  const [insightData, setInsightData] = useState({ title: "", text: "", icon: "" });
  const [opsAlertActive, setOpsAlertActive] = useState(true);

  useEffect(() => {
    // Show insight bubble every 45 to 60 seconds (throttled)
    const interval = setInterval(() => {
      const insights = [
        { title: "Trending Locally", text: "Demand for Protein supplements is up 18% in your tower today.", icon: "📈" },
        { title: "Weather Alert", text: "Looks like rain. Get your hot snacks delivered in 15 mins.", icon: "🌧️" },
        { title: "Hot Feature", text: "Try the new 1:1 Battle in Arcade to win free shipping!", icon: "🎮" }
      ];
      setInsightData(insights[Math.floor(Math.random() * insights.length)]);
      setShowInsight(true);

      // Auto-hide the bubble after 8 seconds
      setTimeout(() => setShowInsight(false), 8000);
    }, 45000); // 45 seconds

    const handleOpenSearch = () => setSearchFocused(true);
    window.addEventListener('open-pulse-search', handleOpenSearch);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('search') === '1') {
      setSearchFocused(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('open-pulse-search', handleOpenSearch);
    };
  }, []);

  // NEW: Mobile specific features
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_BANNERS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // --- AGENTIC DROP UNPREDICTABLE STATE ---
  const [agenticIndex, setAgenticIndex] = useState(0);
  const [agenticPrice, setAgenticPrice] = useState(AGENTIC_DROPS[0].startPrice);
  const [agenticSecondsLeft, setAgenticSecondsLeft] = useState(60);

  // Agentic Drop Timer Logic (Random fluctuation every 5 seconds)
  useEffect(() => {
    const activeDrop = AGENTIC_DROPS[agenticIndex];
    if (lockedProducts.has(activeDrop.name)) return;

    const ticker = setInterval(() => {
      setAgenticSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextIndex = (agenticIndex + 1) % AGENTIC_DROPS.length;
          setAgenticIndex(nextIndex);
          setAgenticPrice(AGENTIC_DROPS[nextIndex].startPrice);
          return 60;
        }

        // Every 5 seconds, change the price randomly (drops or rises, but never below floor)
        if (prev % 5 === 0 && prev !== 60) {
          setAgenticPrice((curr) => {
            const shift = Math.floor(Math.random() * 80) - 50;
            return Math.max(curr + shift, activeDrop.floor);
          });
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [agenticIndex, lockedProducts]);

  // --- VAULT TIMER STATE ---
  const [vaultSecondsLeft, setVaultSecondsLeft] = useState((48 * 3600) + (12 * 60)); // 48h 12m

  useEffect(() => {
    const vaultTicker = setInterval(() => {
      setVaultSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(vaultTicker);
  }, []);

  const vDays = Math.floor(vaultSecondsLeft / (24 * 3600));
  const vHrs = Math.floor((vaultSecondsLeft % (24 * 3600)) / 3600);
  const vMins = Math.floor((vaultSecondsLeft % 3600) / 60);
  const vSecs = vaultSecondsLeft % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');


  useEffect(() => {
    async function syncWithBackend() {
      try {
        const response = await fetch('https://dash24-backend.onrender.com/api/products');
        if (response.ok) {
          const freshData = await response.json();
          setProducts(freshData);
        }
      } catch (error) {
        console.error("Backend not ready, staying with local data.");
      } finally {
        setIsLoading(false);
      }
    }
    syncWithBackend();
  }, []);


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setZoneOrders((prev) => prev + Math.floor(Math.random() * 2));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync search query from URL params
  useEffect(() => {
    if (searchParams?.search) {
      setSearchQuery(searchParams.search);
      setIntent('product');
    }
  }, [searchParams?.search]);

  // Debounced Agentic Search Fetch
  useEffect(() => {
    if (!searchQuery || !searchFocused) {
      setAgenticMatches([]);
      setAgenticReasoning(null);
      setAgenticComparison(null);
      setAgenticRawData(null);
      return;
    }
    const timer = setTimeout(async () => {
      const sanitizedQuery = searchQuery.toLowerCase().trim();
      const cachedResponse = sessionStorage.getItem(sanitizedQuery);

      if (cachedResponse) {
        try {
          const parsedCache = JSON.parse(cachedResponse);
          setAgenticRawData(parsedCache);
          setAgenticReasoning(parsedCache.globalHook);
          setAgenticComparison(parsedCache.isComparison ? parsedCache.comparisonData : null);

          if (parsedCache.recommendations && Array.isArray(parsedCache.recommendations)) {
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeRecommendations = parsedCache.recommendations || [];
            const matchedProducts = safeRecommendations.map((rec: any) => {
              if (!rec || !rec.productName) return null;
              const normalizedRec = normalize(rec.productName);
              const lp = [...MASTER_CATALOG, ...scoredItems];
              const found = lp.find(p => {
                const normalizedCatalog = normalize(p.name);
                return normalizedCatalog.includes(normalizedRec) || normalizedRec.includes(normalizedCatalog);
              });
              if (found) {
                return { id: found.id, reason: rec.reason, name: found.name };
              }
              return null;
            }).filter(Boolean);
            setAgenticMatches(matchedProducts);
          } else {
            setAgenticMatches([]);
          }
        } catch (e) {
          setAgenticReasoning(cachedResponse);
          setAgenticMatches([]);
          setAgenticComparison(null);
        }
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: searchQuery,
            lastOrderContext: "User previously bought: Whole Truth Protein Bars, Blue Tokai Coffee"
          })
        });
        const resJson = await response.json();

        if (resJson.data) {
          console.log("Parsed AI Data:", resJson.data);
          const { isComparison, globalHook, comparisonData, recommendations } = resJson.data;

          sessionStorage.setItem(sanitizedQuery, JSON.stringify(resJson.data));
          setAgenticRawData(resJson.data);
          setAgenticReasoning(globalHook);
          setAgenticComparison(isComparison ? comparisonData : null);

          if (recommendations && Array.isArray(recommendations)) {
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
            const safeRecommendations = recommendations || [];
            const matchedProducts = safeRecommendations.map((rec: any) => {
              if (!rec || !rec.productName) return null;
              const normalizedRec = normalize(rec.productName);
              const lp = [...MASTER_CATALOG, ...scoredItems];
              const found = lp.find(p => {
                const normalizedCatalog = normalize(p.name);
                return normalizedCatalog.includes(normalizedRec) || normalizedRec.includes(normalizedCatalog);
              });
              if (found) {
                return { id: found.id, reason: rec.reason, name: found.name };
              }
              return null;
            }).filter(Boolean);
            setAgenticMatches(matchedProducts);
          } else {
            setAgenticMatches([]);
          }
        }
      } catch (err) {
        console.error("Search API failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce


    return () => clearTimeout(timer);
  }, [searchQuery, searchFocused]);

  const currentNode = NODE_DATA[selectedNode as keyof typeof NODE_DATA];

  const [userItems, setUserItems] = useState(() => generateNodeItems("Prestige Koramangala"));

  const scoredItems = userItems.map((item) => {
    let score = item.rating * 10;
    if (item.stock <= 3) score += 15;
    if (item.low) score += 20;
    if (searchQuery && (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))) score += 30;
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);

  const hasRunningLow = userItems.some((item) => item.lastPurchased >= item.consumptionCycle - 3);

  const handleNodeChange = (node: string) => {
    if (node === selectedNode) return;
    setNodeOpen(false);
    setIsTransitioning(true);
    clearCart();
    setAddedItem(null);
    setCartOpen(false);
    setTimeout(() => {
      setSelectedNode(node);
      setUserItems(generateNodeItems(node));
      setIsTransitioning(false);
    }, 200);
  };

  const handleAutoAddSimulation = () => {
    const itemToReadd = cartItems[0]?.name;
    clearCart();
    setAddedItem(null);
    setCartOpen(false);
    if (itemToReadd) {
      setTimeout(() => {
        handleAddToCart(itemToReadd);
      }, 2000);
    }
  };

  const classifyIntent = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) { setIntent(null); setAiMode(false); setDetectedCategory(null); return; }
    if (q.includes("protein") || q.includes("whey")) setDetectedCategory("Protein");
    else if (q.includes("coffee") || q.includes("brew")) setDetectedCategory("Coffee");
    else if (q.includes("face") || q.includes("wash") || q.includes("skin")) setDetectedCategory("Skincare");
    else setDetectedCategory(null);

    if (q.includes("vs") || q.includes("compare")) { setIntent("compare"); setAiMode(true); }
    else if (q.includes("best") || q.includes("recommend") || q.includes("which")) { setIntent("question"); setAiMode(true); }
    else { setIntent("product"); setAiMode(false); }
  };

  let sectionsOrder: string[] = [];
  if (intent === "question") sectionsOrder = ["smart", "reorder", "demand"];
  else if (intent === "product") sectionsOrder = ["reorder", "demand", "smart"];
  else if (hasRunningLow) sectionsOrder = ["reorder", "demand", "smart"];
  else if (currentNode.highDemandBrands > 15) sectionsOrder = ["demand", "reorder", "smart"];
  else sectionsOrder = ["smart", "reorder", "demand"];


  const suggestedItem = cartItems.length === 1 ? userItems.filter((item) => item.name !== cartItems[0].name && item.localAvailable && item.stock > 0).sort((a, b) => b.rating - a.rating)[0] : null;
  const hasLocalItems = cartItems.some((item) => userItems.find((u) => u.name === item.name)?.localAvailable);

  const handleStartBattle = () => {
    setShowBattle(true);
    setBattleStep(0);
    setTimeout(() => { setBattleStep(1); }, 2500);
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    setBattleAnswer(isCorrect);
    setTimeout(() => { setBattleStep(2); }, 1500);
  };

  if (isMobilePreview && !isPreviewRenderer) {
    return (
      <>
        {/* Hide GlobalHeader when in mobile preview */}
        <style>{`#global-header-desktop { display: none !important; }`}</style>
        <div className="min-h-screen bg-[#111827] flex items-center justify-center p-8 relative">
          <button
            onClick={() => setIsMobilePreview(false)}
            className="fixed left-6 bottom-6 z-[150] bg-white text-gray-900 px-6 py-3 rounded-full shadow-2xl font-bold items-center gap-3 hover:-translate-y-1 transition transform"
          >
            🖥️ Web
          </button>
          <div className="w-[400px] h-[850px] bg-white rounded-[16px] md:rounded-[48px] shadow-2xl border-[4px] md:border-[12px] border-black overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-7 bg-black rounded-b-[24px] w-40 mx-auto z-50"></div>
            <iframe src="/?preview=1" className="w-full h-full border-none hide-scrollbar bg-white" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* NEW: Floating Mobile Preview Toggle (Desktop Only) - Top Left */}
      {(!isPreviewRenderer) && (
        <button
          onClick={() => setIsMobilePreview(true)}
          className="hidden md:flex fixed left-6 bottom-6 z-[150] bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl font-bold items-center gap-3 hover:-translate-y-1 transition transform"
        >
          📱 Mobile
        </button>
      )}



      <main className="min-h-screen bg-white md:bg-[#F8FAFC]">

        {/* Ops Alert Banner */}
        {opsAlertActive && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-start md:items-center justify-between text-xs md:text-sm font-bold shadow-md z-[100] relative animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3 max-w-[1200px] mx-auto w-full pr-2">
              <span className="text-xl animate-pulse">🚨</span>
              <span className="leading-tight">
                <span className="uppercase tracking-widest text-red-200 mr-2 md:inline hidden">Dynamic Ops Alert:</span>
                Heavy traffic detected in Indiranagar. Dash24 ETAs temporarily adjusted from 60 mins to 90 mins.
              </span>
              <button onClick={() => setOpsAlertActive(false)} className="ml-auto w-7 h-7 shrink-0 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition shadow-sm text-sm">✕</button>
            </div>
          </div>
        )}

        {/* Mobile Quick Categories (Hidden on Desktop) */}
        <div className="md:hidden w-full mb-2 px-1 pb-2">
          <ScrollableRow className="flex gap-4 w-max px-3">
            {QUICK_CATEGORIES.map((cat, idx) => (
              <div key={idx} onClick={() => {
                if (cat.name === "Top Brands") {
                  router.push("/brands");
                } else {
                  setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
                }
              }} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                <div className={`w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] border p-0 bg-white group-active:scale-95 group-hover:shadow-md transition-all flex items-center justify-center ${selectedCategory === cat.name ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-100'}`}>
                  <img referrerPolicy="no-referrer" src={cat.img} alt={cat.name} className="w-[85%] h-[85%] object-contain" />
                </div>
                <span className={`text-[10px] font-bold text-center w-16 leading-tight break-words ${selectedCategory === cat.name ? 'text-orange-600' : 'text-gray-700'}`}>{cat.name}</span>
              </div>
            ))}
          </ScrollableRow>
        </div>

        {/* Mobile: Greeting + Shortened Location (above hero) */}
        <div className="md:hidden px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600">{greeting}, Kunal 👋</span>
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-lg">
            <span className="text-xs">⚡</span>
            <span className="text-[11px] font-bold text-yellow-800">{selectedNode}</span>
          </div>
        </div>

        {/* Desktop: Greeting + Location + Last Order Bar (between header and hero) */}
        <div className="hidden md:flex max-w-[1200px] mx-auto px-6 py-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-600">{greeting}, Kunal 👋</span>
            <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${opsAlertActive ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
              <span className={opsAlertActive ? "animate-pulse" : ""}>{opsAlertActive ? "🚨" : "⚡"}</span>
              <span>{opsAlertActive ? "90Mins" : "60Mins"} to {selectedNode}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Last Order</span>
            <span className="text-xs font-bold text-gray-700">Face Wash • Delivered 2 days ago</span>
          </div>
        </div>

        {/* --- DYNAMIC HERO BANNER --- */}
        <div className="max-w-[1200px] mx-auto md:px-6 w-full h-[150px] md:h-[280px] rounded-none md:rounded-[32px] overflow-hidden relative mb-2 shadow-lg border-0 md:border md:border-gray-100/50 group cursor-pointer bg-[#111827]">
          {HERO_BANNERS.map((banner, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              onClick={() => { if (banner.link) router.push(banner.link); }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-black" />

              {/* Product image with zoom close-up effect (right side) */}
              {banner.productImage && (
                <div className="absolute right-0 top-0 w-[40%] md:w-[35%] h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={banner.productImage}
                    alt={banner.brand}
                    className="w-full h-full object-cover scale-[1.15] opacity-90 hover:scale-[1.25] transition-transform duration-[2000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />
                </div>
              )}

              {/* Dash24 ⚡ branding for 60min fulfillment */}
              {banner.speedAnimation && (
                <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 md:gap-2 opacity-80">
                  <span className={`text-[48px] md:text-[100px] leading-none animate-pulse ${opsAlertActive ? 'drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]'}`}>{opsAlertActive ? '🚨' : '⚡'}</span>
                  <span className="text-lg md:text-3xl font-black tracking-tighter text-white drop-shadow-lg">DASH24</span>
                  <span className={`text-[8px] md:text-xs font-bold uppercase tracking-[0.3em] ${opsAlertActive ? 'text-red-400' : 'text-orange-400'}`}>{opsAlertActive ? '90 Minutes' : '60 Minutes'}</span>
                </div>
              )}

              {/* Text content (left side) */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center p-6 md:p-12">
                <div className="flex items-center gap-2 mb-2 md:mb-4">
                  <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[8px] md:text-xs uppercase tracking-widest px-2.5 py-1 md:px-4 flex items-center rounded-full shadow-sm">{banner.label}</span>
                  <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-yellow-400 drop-shadow-md">{banner.brand}</span>
                </div>
                <h3 className="text-white font-black text-[22px] md:text-5xl leading-tight mb-0.5 md:mb-2 drop-shadow-lg max-w-[60%]">{banner.title}</h3>
                <p className="text-gray-200 text-[10px] md:text-sm uppercase tracking-wider font-bold w-1/2 md:w-1/3 mb-1 md:mb-4 opacity-90">{banner.subtitle}</p>

                {banner.hasCTA && (
                  <div className="mt-2 md:mt-4 flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm bg-white/10 hover:bg-white/20 w-max px-3 md:px-5 py-1.5 md:py-3 rounded-full text-white font-bold uppercase tracking-widest active:translate-x-2 transition-transform shadow-sm">
                    Shop Now <span className="text-blue-400 text-lg leading-none">→</span>
                  </div>
                )}

                {banner.speedAnimation && (
                  <div className="mt-2 md:mt-4 flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm w-max font-bold uppercase tracking-widest text-[#F97316]">
                    <div className="flex gap-1 md:gap-1.5">
                      <span className="animate-[slide-right_1s_infinite] text-[#F97316] opacity-30">»</span>
                      <span className="animate-[slide-right_1s_infinite_0.2s] text-[#F97316] opacity-60">»</span>
                      <span className="animate-[slide-right_1s_infinite_0.4s] text-[#F97316] opacity-100">»</span>
                    </div>
                    Fast Tracked Fulfillment
                  </div>
                )}
              </div>
            </div>
          ))
          }
          {/* Indicators */}
          <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-20">
            {HERO_BANNERS.map((_, idx) => (
              <div key={idx} className={`h-1.5 md:h-2 rounded-full transition-all duration-300 shadow-sm ${idx === heroIndex ? 'w-5 md:w-8 bg-white' : 'w-1.5 md:w-2 bg-white/50'}`} />
            ))}
          </div>
        </div>

        {/* Desktop Quick Categories (Hidden on Mobile) */}
        <div className="hidden md:block max-w-[1200px] mx-auto px-6 mb-6">
          <div className="flex justify-between items-center bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            {QUICK_CATEGORIES.map((cat, idx) => (
              <div key={idx} onClick={() => {
                if (cat.name === "Top Brands") {
                  router.push("/brands");
                } else {
                  setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
                }
              }} className="flex flex-col items-center gap-2 cursor-pointer group px-4">
                <div className={`w-20 h-20 rounded-2xl overflow-hidden shadow-sm border p-0 bg-gray-50 group-active:scale-95 group-hover:shadow-md transition-all flex items-center justify-center ${selectedCategory === cat.name ? 'border-orange-500 ring-4 ring-orange-200 bg-orange-50' : 'border-gray-100'}`}>
                  <img referrerPolicy="no-referrer" src={cat.img} alt={cat.name} className="w-[80%] h-[80%] object-contain mix-blend-multiply" />
                </div>
                <span className={`text-xs font-bold text-center leading-tight ${selectedCategory === cat.name ? 'text-orange-600' : 'text-gray-700 group-hover:text-gray-900'}`}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto md:px-6 py-6 max-md:pt-2">
          {/* ========================================================= */}
          {/* CATEGORY VIEW (Independent blocks for Desktop/Mobile)       */}
          {/* ========================================================= */}
          {selectedCategory && (
            <>
              {/* Mobile Category View */}
              <div className="md:hidden px-4 md:px-10 py-2 space-y-6 mb-8 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Top Brands</h2>
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md font-bold uppercase">{selectedCategory}</span>
                </div>
                <ScrollableRow className="w-full">
                  <div className="flex gap-4 snap-x hide-scrollbar pb-2 w-max px-1">
                    {Object.keys(BRAND_LOGOS).map(brand => {
                      const hasBrand = scoredItems.some(item =>
                        item.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase() &&
                        item.brand?.trim().toLowerCase() === brand.trim().toLowerCase()
                      );
                      if (!hasBrand) return null;
                      return (
                        <div key={brand} onClick={() => { setSearchFocused(false); setActiveBrand(brand); }} className="snap-start flex-shrink-0 w-[100px] h-[100px] bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center p-3 cursor-pointer active:scale-95 transition-transform">
                          <img referrerPolicy="no-referrer" src={BRAND_LOGOS[brand]} alt={brand} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollableRow>

                <h2 className="text-xl font-black text-gray-900 tracking-tight mt-6">Top Products</h2>
                <div className="grid grid-cols-2 gap-3">
                  {scoredItems.filter(item => item.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()).slice(0, 10).map((item) => (
                    <div key={item.id} className="w-full">
                      <LivePulseCard
                        product={item}
                        handleAddToCart={(p: any) => { handleAddToCart(p.name); setCartOpen(true); }}
                        handleCardClick={() => router.push(`/product/${item.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Category View */}
              <div className="hidden md:block px-4 md:px-10 py-2 space-y-8 mb-10 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Top Brands</h2>
                    <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-md font-bold uppercase tracking-widest">{selectedCategory}</span>
                  </div>
                </div>
                <ScrollableRow className="w-full">
                  <div className="flex gap-6 snap-x hide-scrollbar pb-4 w-max px-1">
                    {Object.keys(BRAND_LOGOS).map(brand => {
                      const hasBrand = scoredItems.some(item =>
                        item.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase() &&
                        item.brand?.trim().toLowerCase() === brand.trim().toLowerCase()
                      );
                      if (!hasBrand) return null;
                      return (
                        <div key={brand} onClick={() => { setSearchFocused(false); setActiveBrand(brand); }} className="snap-start flex-shrink-0 w-[140px] h-[140px] bg-white border border-gray-200 hover:border-orange-400 hover:shadow-lg rounded-[24px] flex items-center justify-center p-4 cursor-pointer transition-all hover:-translate-y-1">
                          <img referrerPolicy="no-referrer" src={BRAND_LOGOS[brand]} alt={brand} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollableRow>

                <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-8">Top Products</h2>
                <div className="grid grid-cols-4 gap-6">
                  {scoredItems.filter(item => item.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()).slice(0, 12).map((item) => (
                    <div key={item.id} className="w-full">
                      <LivePulseCard
                        product={item}
                        handleAddToCart={(p: any) => handleAddToCart(p.name)}
                        handleCardClick={() => router.push(`/product/${item.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 4. CONTENT & HORIZONTAL SCROLL                            */}
          {/* ========================================================= */}
          {!selectedCategory && (
            <div className={`px-4 md:px-10 py-6 md:py-8 space-y-10 md:space-y-14 transition-opacity duration-200 ${isTransitioning ? "opacity-60" : "opacity-100"}`}>



              {/* REORDER / FOR YOU (Horizontal Scroll) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">🛒 For You</h2>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Based on order history</span>
                </div>

                {/* Unified Responsive Feed (Scrollable) */}
                <ScrollableRow className="w-full">
                  <div className="flex gap-3 md:gap-5 snap-x hide-scrollbar pb-2 md:pb-6 w-max px-0.5 md:px-0">
                    {scoredItems.filter((item) => searchQuery ? (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))) : true).map((item) => {
                      return (
                        <div key={item.name} className="snap-start flex-shrink-0 w-[140px] md:w-[260px]">
                          <LivePulseCard
                            product={item}
                            handleAddToCart={(p: any) => { handleAddToCart(p.name); setCartOpen(true); }}
                            handleCardClick={() => router.push(`/product/${item.id}`)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollableRow>
              </div>

              {/* ========================================================= */}
              {/* THE PULSE MATRIX (Now rendered inline for Continuous Scroll) */}
              {/* ========================================================= */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">⚡ The Pulse Matrix</h2>
                  <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Live Operations</span>
                </div>

                {/* Pulse matrix uses grid on both mobile and desktop for equal symmetry */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 hide-scrollbar pb-4 md:pb-0 w-full mb-2">

                  {/* Block 1: Agentic Drop (Compact & Vertical) */}
                  <div className="bg-gradient-to-br from-red-950 via-red-900 to-[#111827] rounded-[16px] md:rounded-[32px] p-3 md:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-red-500/30 group hover:border-red-500/60 transition-colors aspect-square md:aspect-auto">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

                    <div className="relative flex flex-col items-center text-center h-full">
                      <div className="w-full flex justify-between items-center mb-1.5 md:mb-4">
                        <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0 hidden md:block"></span> Drop
                        </span>
                        <span className="text-[10px] md:text-[12px] bg-red-600 text-white px-1.5 md:px-2.5 py-0.5 md:py-1 rounded font-mono font-bold shadow-sm inline-block">
                          00:{agenticSecondsLeft < 10 ? `0${agenticSecondsLeft}` : agenticSecondsLeft}
                        </span>
                      </div>

                      <div className="w-10 h-10 md:w-28 md:h-28 bg-white rounded-xl overflow-hidden p-1.5 shadow-lg mb-1.5 md:mb-4 group-hover:scale-105 transition-transform duration-500 mx-auto">
                        <img referrerPolicy="no-referrer" src={AGENTIC_DROPS[agenticIndex].img} alt="Drop Item" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>

                      <p className="text-[10px] md:text-sm text-gray-200 font-bold mb-0.5 truncate w-full px-1">{AGENTIC_DROPS[agenticIndex].name}</p>

                      <div className="font-mono text-[15px] md:text-3xl text-white font-black flex items-baseline justify-center gap-1 md:gap-2 mb-2 md:mb-6">
                        <span className="text-red-400 font-sans tracking-tighter shadow-sm">₹{agenticPrice}</span>
                      </div>

                      <button
                        onClick={() => { handleAddToCart(AGENTIC_DROPS[agenticIndex].name, agenticPrice); setLockedProducts(prev => new Set([...prev, AGENTIC_DROPS[agenticIndex].name])); setCartOpen(true); }}
                        disabled={lockedProducts.has(AGENTIC_DROPS[agenticIndex].name)}
                        className={`w-full py-1.5 md:py-3.5 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all shadow-lg hover:-translate-y-1 mt-auto ${lockedProducts.has(AGENTIC_DROPS[agenticIndex].name) ? 'bg-green-600 text-white shadow-green-600/40 cursor-default' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/40'}`}
                      >
                        {lockedProducts.has(AGENTIC_DROPS[agenticIndex].name) ? "Locked ✓" : "Lock the Deal"}
                      </button>
                    </div>
                  </div>

                  {/* Block 2: Daily Pulse Match (Hidden on Mobile) */}
                  <div className="hidden md:flex bg-[#111827] rounded-[20px] md:rounded-[32px] p-5 md:p-8 border border-gray-800 shadow-xl flex-col justify-between group hover:border-blue-500/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <span className="text-lg md:text-2xl">✨</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-blue-400 uppercase tracking-widest">Daily Pulse</span>
                      </div>
                      <h3 className="text-sm md:text-xl font-bold text-white mb-1.5 md:mb-3">1:1 Neighbor Battle</h3>
                      <p className="text-[11px] md:text-sm text-gray-400 leading-snug md:leading-relaxed font-medium line-clamp-3">
                        You and someone in {selectedNode} both follow cricket. Win for Free Shipping.
                      </p>
                    </div>
                    <button
                      onClick={handleStartBattle}
                      className="w-full py-2.5 md:py-4 rounded-xl bg-blue-600 text-white text-xs md:text-sm font-bold shadow-lg shadow-blue-600/20 group-hover:bg-blue-500 transition-all mt-4 md:mt-6"
                    >
                      Enter Arena
                    </button>
                  </div>

                  {/* Block 3: The Sunday Vault */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[16px] md:rounded-[32px] p-3 md:p-8 border border-gray-700 relative overflow-hidden flex flex-col justify-between shadow-xl aspect-square md:aspect-auto">
                    <div className="absolute -right-4 -bottom-4 opacity-5 text-[80px] md:text-[140px] leading-none pointer-events-none">🔒</div>
                    <div className="relative flex flex-col items-center text-center h-full w-full">
                      <h2 className="text-[6px] md:text-[11px] font-bold tracking-widest text-[#F97316] mb-1 uppercase drop-shadow-sm">VIP INVENTORY • GADGETS</h2>
                      <h1 className="text-[10px] md:text-2xl font-black tracking-tight text-white mb-1.5 md:mb-3">Sunday Vault</h1>
                      <p className="text-[6px] md:text-sm font-medium text-gray-400 leading-snug line-clamp-2 md:line-clamp-none mb-1 md:mb-2">Exclusive high-demand gadget unlocks.</p>

                      <div className="bg-gradient-to-r from-red-600/20 to-orange-500/20 rounded-lg md:rounded-2xl p-1.5 md:p-4 mt-auto w-full border border-red-500/30 shadow-inner backdrop-blur-sm flex flex-col justify-center items-center relative gap-0.5 md:gap-1.5 overflow-hidden">
                        <span className="text-[6px] md:text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse leading-none">Unlocking In</span>
                        <span className="font-mono text-[10px] md:text-2xl font-black text-white tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] flex items-center leading-none">
                          {pad(vDays)}<span className="text-[6px] md:text-[10px] text-gray-400 ml-0.5 mr-1 md:ml-1 md:mr-1.5">D</span>:
                          <span className="ml-1 md:ml-1.5">{pad(vHrs)}</span><span className="text-[6px] md:text-[10px] text-gray-400 ml-0.5 mr-1 md:ml-1 md:mr-1.5">H</span>:
                          <span className="ml-1 md:ml-1.5">{pad(vMins)}</span><span className="text-[6px] md:text-[10px] text-gray-400 ml-0.5 mr-1 md:ml-1 md:mr-1.5">M</span>:
                          <span className="ml-1 md:ml-1.5">{pad(vSecs)}</span><span className="text-[6px] md:text-[10px] text-gray-400 ml-0.5 md:ml-1">S</span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Community Drop Gamification (Continuous Scroll) */}
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#111827] rounded-[24px] md:rounded-[32px] p-6 md:p-8 mt-6 text-white shadow-xl border border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex justify-between items-start mb-6 relative flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-sm">Brand in Focus</span>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">Community Drop</h2>
                    <p className="text-blue-200 font-medium text-sm md:text-base mb-4">50 curated products reserved for the {selectedNode} collective.</p>
                  </div>
                  {/* Progress bar instead of just diamond */}
                  <div className="bg-white/10 p-4 md:p-5 rounded-3xl border border-white/20 backdrop-blur-md w-full md:w-[320px]">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-yellow-400 mb-1">Community Drop</p>
                        <p className="font-black text-white text-base">Nothing Ear (2)</p>
                      </div>
                      <span className="text-3xl drop-shadow-lg">💎</span>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/10">
                      <div className="flex justify-between text-xs font-bold text-gray-300 mb-2.5">
                        <span>₹12,999 currently</span>
                        <span className="text-yellow-400">8 away</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden mb-3 shadow-inner">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full w-[84%] rounded-full shadow-[0_0_10px_rgba(253,224,71,0.5)]"></div>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">
                        Unlock <span className="text-yellow-400 text-sm">₹7,500</span> Price
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium text-blue-100 flex items-start gap-3">
                  <span className="text-lg">🤝</span>
                  <p>Because you've purchased from this brand before, you hold early-access rights. Unlock the drop before it opens to the public.</p>
                </div>

                <button className="w-full mt-6 bg-yellow-400 text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/20">
                  Unlock Drop
                </button>
              </div>

              {/* TRENDING BRANDS & DEALS (Horizontal Scroll Sections)      */}
              {/* ========================================================= */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-[24px] md:rounded-[32px] p-6 md:p-10 mb-8 mt-6">
                <div className="flex flex-col mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">🏷️ Trending Brands</h2>
                    <span className="text-[11px] text-orange-600 font-bold bg-orange-100 px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">🔥 {zoneOrders} orders locally</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">Over 234 customers shopped these today in your neighbourhood.</p>
                </div>

                <ScrollableRow className="grid grid-rows-2 grid-flow-col gap-4 pb-2 snap-x">
                  {Array.from(new Set([...currentNode.demandBrands, ...Object.keys(BRAND_LOGOS)])).slice(0, 10).map((brand) => (
                    <div
                      key={brand}
                      className="w-[180px] snap-start bg-white rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center border border-gray-100 group cursor-pointer"
                      onClick={() => setActiveBrand(brand)}
                    >
                      <div className="h-16 w-full flex items-center justify-center mb-4">
                        {BRAND_LOGOS[brand] ? (
                          <img
                            src={BRAND_LOGOS[brand]}
                            alt={brand}
                            className="max-h-full max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-gray-300">{brand.substring(0, 2)}</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{brand}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                        Strong Local Traction
                      </p>
                      <button className="mt-auto text-[10px] font-bold px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-[#111827] group-hover:text-white transition-colors duration-300 w-full uppercase tracking-widest">
                        Explore
                      </button>
                    </div>
                  ))}
                </ScrollableRow>
              </div>

              {/* HORIZONTAL HOT DEALS CAROUSEL (Mobile UI Polishing) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">🔥 Hot Deals</h2>
                  <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Ending Soon</span>
                </div>
                <ScrollableRow className="flex gap-4 pb-4 snap-x">
                  {scoredItems.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="min-w-[160px] max-w-[160px] snap-start bg-white border border-gray-100/60 rounded-2xl p-3 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-full h-24 mb-3 flex items-center justify-center relative p-1 mix-blend-multiply">
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">-25%</span>
                        <img referrerPolicy="no-referrer" src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-800 leading-snug mb-1 line-clamp-2 min-h-[32px] px-1">{item.name}</p>
                      <div className="flex items-end justify-between mt-auto px-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 line-through leading-none mb-0.5">₹{item.mrp || Math.floor(item.price * 1.33)}</span>
                          <span className="text-sm font-black text-gray-900 leading-none">₹{item.price}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item.name); }} className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md active:scale-95 flex-shrink-0 transition">
                          <span className="text-lg leading-none">+</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </ScrollableRow>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 🎮 ARCADE SECTION — Full Gaming Hub                       */}
        {/* ========================================================= */}
        {/* 🎮 ARCADE SECTION — Full Gaming Hub                       */}
        {/* ========================================================= */}
        <div className="max-w-[1200px] mx-auto md:px-6 py-8 px-4 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">🎮 Arcade</h2>
            <span className="text-[10px] bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Play & Earn</span>
          </div>
          <p className="text-xs text-gray-500 font-medium -mt-4">Win coins, discounts, and exclusive deals by playing games.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* 🎰 777 Spin & Win */}
            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-x-4 -translate-y-4 blur-xl group-hover:scale-150 transition-transform" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full translate-x-2 translate-y-4 blur-lg" />
              <div className="text-4xl mb-3 drop-shadow-lg">🎰</div>
              <h3 className="text-lg font-black mb-1 tracking-tight">777 Spin & Win</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-3">Match 3 to win big prizes</p>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">🪙 Free Spin Daily</span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">🎁 Up to ₹500</span>
              </div>
            </div>

            {/* ⚔️ 1:1 Neighbor Battle */}
            <div onClick={handleStartBattle} className="bg-gradient-to-br from-[#1E3A8A] to-[#111827] rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-xl" />
              <div className="text-3xl mb-3">⚔️</div>
              <h3 className="text-sm font-black mb-1 tracking-tight">1:1 Battle</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-3">Challenge your neighbor</p>
              <span className="bg-blue-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">🏆 Win 50 pts</span>
            </div>

            {/* 📊 Daily Pulse Match */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-lg" />
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-sm font-black mb-1 tracking-tight">Daily Pulse Match</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-3">Predict trending products</p>
              <span className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">⏰ Resets Daily</span>
            </div>

          </div>
        </div>

        {/* ========================================= */}
        {/* 1:1 BATTLE GAME OVERLAY                     */}
        {/* ========================================= */}
        {
          showBattle && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
              <div className="bg-[#111827] w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-800 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300 text-white">

                <button onClick={() => setShowBattle(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition font-bold text-lg z-10">✕</button>

                {battleStep === 0 && (
                  <div className="p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
                    <h2 className="text-3xl font-black mb-3 tracking-tight">Scanning Network...</h2>
                    <p className="text-gray-400 font-medium text-lg">Looking for a neighbor in {selectedNode} with similar interests.</p>
                  </div>
                )}

                {battleStep === 1 && (
                  <div className="p-14 text-center">
                    <div className="inline-block px-5 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold uppercase tracking-widest rounded-full mb-10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      Opponent Found
                    </div>

                    <div className="flex items-center justify-center gap-10 mb-12">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black border-2 border-gray-700">K</div>
                        <p className="font-bold text-lg">You</p>
                      </div>
                      <div className="text-4xl font-black italic text-gray-700 bg-gray-900 w-16 h-16 flex items-center justify-center rounded-full">VS</div>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black border-2 border-blue-700 shadow-[0_0_20px_rgba(30,58,138,0.5)]">A</div>
                        <p className="font-bold text-lg">Amit <span className="text-xs text-gray-400 block font-medium mt-1">Tower C</span></p>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 p-10 rounded-[32px] mb-6 shadow-inner text-left">
                      <p className="text-[11px] text-blue-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        T20 World Cup Trivia
                      </p>
                      <h3 className="text-2xl font-bold leading-tight mb-8">In the current T20 World Cup, which Indian spinner has taken 9 wickets to control the middle overs?</h3>

                      <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => handleAnswerSubmit(false)} className="w-full py-5 rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-600 transition font-bold text-left px-8 text-lg hover:-translate-y-1 hover:shadow-lg">A) Kuldeep Yadav</button>
                        <button onClick={() => handleAnswerSubmit(true)} className="w-full py-5 rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-600 transition font-bold text-left px-8 text-lg hover:-translate-y-1 hover:shadow-lg">B) Varun Chakaravarthy</button>
                        <button onClick={() => handleAnswerSubmit(false)} className="w-full py-5 rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-600 transition font-bold text-left px-8 text-lg hover:-translate-y-1 hover:shadow-lg">C) Axar Patel</button>
                      </div>
                    </div>
                  </div>
                )}

                {battleStep === 2 && (
                  <div className="p-16 text-center flex flex-col items-center">
                    {battleAnswer ? (
                      <>
                        <div className="text-8xl mb-8 animate-bounce">🏆</div>
                        <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">You Won!</h2>
                        <p className="text-lg text-gray-300 mb-10 font-medium">You beat Amit. Your reaction time was faster.</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-8 rounded-3xl mb-10 w-full shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                          <p className="text-xs text-yellow-500 uppercase tracking-widest font-bold mb-3">Reward Unlocked</p>
                          <p className="text-2xl font-black text-white">100% Free Shipping</p>
                          <p className="text-sm text-gray-400 mt-2 font-medium">Automatically applied to your next 2 orders.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-8xl mb-8 grayscale opacity-50">🤝</div>
                        <h2 className="text-5xl font-black mb-4 text-white">Amit Won</h2>
                        <p className="text-lg text-gray-400 mb-10 font-medium">Amit got the correct answer (Varun Chakaravarthy) first.</p>
                        <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-3xl mb-10 w-full">
                          <p className="text-base font-bold text-gray-300">Don't worry, the Pulse resets tomorrow at 8 AM.</p>
                        </div>
                      </>
                    )}
                    <button onClick={() => setShowBattle(false)} className="w-full py-5 rounded-2xl bg-white text-black text-lg font-black hover:bg-gray-200 transition shadow-xl hover:-translate-y-1">
                      Return to Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* ========================================= */}
        {/* PULSE SEARCH OVERLAY                        */}
        {/* ========================================= */}
        {
          searchFocused && (
            <div className="fixed inset-0 z-[120] bg-white text-gray-900 flex flex-col animate-in slide-in-from-bottom-full duration-300">
              {/* Header / Input Area + Mobile Filters */}
              <div className="p-4 md:p-8 border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-10 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <button onClick={() => { setSearchFocused(false); setSearchQuery(''); }} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition text-2xl font-black shrink-0">✕</button>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ask Dash24 AI anything..."
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-lg font-medium shadow-inner"
                      autoFocus
                    />
                    {isSearching ? (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50 animate-spin">⏳</span>
                    ) : (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">✨</span>
                    )}
                  </div>
                </div>

                {/* Mobile Quick Filters (Inside Search Overlay) */}
                <div className="md:hidden hide-scrollbar overflow-x-auto flex gap-3 pb-1 -mx-4 px-4 w-[calc(100%+32px)]">
                  {QUICK_CATEGORIES.map(cat => (
                    <button key={cat.name} onClick={() => setSearchQuery(cat.name)} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-4 py-2 whitespace-nowrap active:scale-95 transition text-xs text-gray-800 font-bold shadow-sm flex-shrink-0">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                        <img referrerPolicy="no-referrer" src={cat.img} alt={cat.name} className="w-[85%] h-[85%] object-contain mix-blend-multiply" />
                      </div>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area - Constrained to 60% Center View */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
                <div className="w-full max-w-md mx-auto space-y-8">
                  {!searchQuery ? (
                    <>
                      {/* Default AI Suggestions */}
                      <div className="space-y-4">
                        <p className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Live Pulse Recommendations</p>
                        <div className="flex flex-wrap gap-2">
                          {["Gym recovery products", "Best Vitamin C for glow", "Sugar-free energy snacks", "Hyperlocal favorites in Bangalore", "Amla juice for acidity"].map((query) => (
                            <button onClick={() => setSearchQuery(query)} key={query} className="bg-white border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md px-4 py-2.5 rounded-xl text-sm text-gray-700 font-medium transition text-left flex items-center gap-2">
                              <span className="text-blue-500">✨</span> {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      {/* TEMPORARY DASH AI DEBUGGER */}
                      {agenticRawData && (
                        <div className="w-full bg-red-50 border border-red-200 p-4 my-4 rounded-md overflow-x-auto text-left">
                          <p className="text-red-800 font-bold text-xs mb-2">🚨 DEBUG MODE: RAW AI RESPONSE 🚨</p>
                          <pre className="text-[10px] text-red-900 font-mono whitespace-pre-wrap">
                            {JSON.stringify(agenticRawData, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm text-gray-800 text-sm leading-relaxed max-w-xl shadow-sm">
                          <p className="font-medium flex items-center gap-2">
                            <span className="text-blue-600">✨</span>
                            Here's what I found for <span className="text-gray-900 font-bold">"{searchQuery}"</span>:
                          </p>
                        </div>
                      </div>

                      {/* Brand Tile Match for Search */}
                      {Object.keys(BRAND_LOGOS).find(b => b.toLowerCase().includes(searchQuery.toLowerCase())) && (
                        <div className="mb-6 max-w-xs">
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Brand Match</p>
                          <div
                            onClick={() => { setSearchFocused(false); setActiveBrand(Object.keys(BRAND_LOGOS).find(b => b.toLowerCase().includes(searchQuery.toLowerCase()))!); }}
                            className="bg-white border border-gray-200 p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-gray-50 hover:shadow-md transition shadow-sm"
                          >
                            <div className="w-12 h-12 bg-white rounded-xl p-1 border border-gray-100 flex items-center justify-center">
                              <img referrerPolicy="no-referrer" src={BRAND_LOGOS[Object.keys(BRAND_LOGOS).find(b => b.toLowerCase().includes(searchQuery.toLowerCase()))!]} alt="Brand" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{Object.keys(BRAND_LOGOS).find(b => b.toLowerCase().includes(searchQuery.toLowerCase()))}</h3>
                              <p className="text-[10px] text-blue-600 font-bold mt-0.5">Visit Brand Store ↗</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Premium AI Reasoning Block - Clean Typography */}
                      {agenticReasoning && (
                        <div className="mb-6 relative text-gray-900">
                          <h2 className="text-lg font-semibold text-gray-800 leading-snug tracking-tight mb-4 mt-2">
                            <ReactMarkdown>{agenticReasoning}</ReactMarkdown>
                          </h2>
                        </div>
                      )}

                      {/* AI Product Comparison Table */}
                      {agenticComparison && agenticComparison.features && agenticComparison.products && (
                        <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                          <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                              <tr>
                                <th className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">
                                  Features
                                </th>
                                {agenticComparison.products.map((p: any, idx: number) => (
                                  <th key={idx} className="p-3 bg-gray-50 border-b border-r last:border-r-0 border-gray-200 text-sm font-bold text-gray-900 min-w-[150px]">
                                    {p.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {agenticComparison.features.map((feature: string, featureIdx: number) => (
                                <tr key={featureIdx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-3 bg-gray-50/30 text-xs font-semibold text-gray-700">
                                    {feature}
                                  </td>
                                  {agenticComparison.products.map((p: any, pIdx: number) => (
                                    <td key={pIdx} className="p-3 border-r last:border-r-0 border-gray-100 text-sm text-gray-700">
                                      {p.values[featureIdx] || "-"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {agenticMatches.length > 0 ? (
                          agenticMatches.map(match => {
                            const item = scoredItems.find(i => i.id === match.id) || MASTER_CATALOG.find(i => i.id === match.id);
                            if (!item) return null;
                            return (
                              <div key={`rec-${item.id}`} onClick={() => { setSearchFocused(false); router.push(`/product/${item.id || 0}`); }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col justify-between cursor-pointer group hover:shadow-md transition text-black">
                                <div className="w-full h-28 mb-3 relative overflow-hidden flex items-center justify-center">
                                  <img referrerPolicy="no-referrer" src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>

                                {/* Inject specific AI reason text here right above price/cart */}
                                {match.reason && (
                                  <div className="mt-2 mb-3 p-2 bg-indigo-50/50 rounded-lg text-[11px] text-gray-600 font-medium leading-relaxed border border-indigo-100/50">
                                    ✨ {match.reason}
                                  </div>
                                )}

                                <div className="mt-auto flex items-center justify-between">
                                  <p className="text-base font-bold text-gray-900">₹{item.price}</p>
                                  <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); handleAddToCart(item.name); }}>
                                    <span className="text-lg leading-none">+</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          scoredItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 8).map(item => (
                            <div key={`search-${item.id}`} onClick={() => { setSearchFocused(false); router.push(`/product/${item.id || 0}`); }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col justify-between cursor-pointer group hover:shadow-md transition text-black">
                              <div className="w-full h-28 mb-3 relative overflow-hidden flex items-center justify-center">
                                <img referrerPolicy="no-referrer" src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                              <div className="mt-auto flex items-center justify-between pt-2">
                                <p className="text-base font-bold text-gray-900">₹{item.price}</p>
                                <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); handleAddToCart(item.name); }}>
                                  <span className="text-lg leading-none">+</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}

                        {!isSearching && !agenticReasoning && agenticMatches.length === 0 && scoredItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && !Object.keys(BRAND_LOGOS).find(b => b.toLowerCase().includes(searchQuery.toLowerCase())) && (
                          <div className="col-span-2 mt-4">
                            <div className="bg-white border border-gray-200 p-8 rounded-3xl text-center shadow-sm w-full mx-auto">
                              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-orange-100 shadow-inner">
                                <span className="opacity-70">🔍</span>
                              </div>
                              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">We don't have exact matches</h3>
                              <p className="text-sm font-medium text-gray-500 mb-6">But check out these top brands for equivalent products:</p>

                              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                                {Object.keys(BRAND_LOGOS).slice(0, 6).map(brand => (
                                  <div key={brand} onClick={() => { setSearchFocused(false); setActiveBrand(brand); }} className="w-16 h-16 md:w-20 md:h-20 bg-white border border-gray-200 hover:border-orange-300 rounded-[18px] p-2 flex items-center justify-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                                    <img referrerPolicy="no-referrer" src={BRAND_LOGOS[brand]} alt={brand} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }

        {/* ========================================= */}
        {/* PRODUCT PAGE OVERLAY                      */}
        {/* ========================================= */}
        {
          activeProduct && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
              <div className="bg-white w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300 mt-20 md:mt-0">

                <div className="w-full md:w-1/2 bg-[#F8FAFC] p-6 md:p-10 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100">
                  <button
                    onClick={() => setActiveProduct(null)}
                    className="absolute top-6 left-6 w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition text-xl font-bold"
                  >
                    ✕
                  </button>

                  <div className="w-80 h-80 md:w-96 md:h-96 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-7xl relative overflow-hidden p-8 group">
                    {activeProduct.ai_intent_layers && activeProduct.ai_intent_layers.risk && (
                      <div className="absolute top-4 right-4 z-[20] bg-[#f0fdf4]/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-green-200 flex items-center gap-1.5 animate-in slide-in-from-top-4 duration-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-green-700">Hyperlocal Verified</span>
                      </div>
                    )}
                    {activeProduct.image_url ? (
                      <img referrerPolicy="no-referrer" src={activeProduct.image_url} alt={activeProduct.name} className="object-contain w-full h-full mix-blend-multiply filter drop-shadow-xl group-hover:scale-105 transition duration-500" />
                    ) : (
                      "📦"
                    )}
                    {activeProduct.localAvailable && activeProduct.low && (
                      <div className="absolute top-5 right-5 text-xs px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full font-bold shadow-sm">
                        Running Low
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-1/2 p-6 md:p-14 overflow-y-auto flex flex-col bg-white">
                  <div className="mb-4">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-500">{activeProduct.brand}</span>
                  </div>

                  <h2 className="hidden md:block text-4xl font-black text-gray-900 mb-4 tracking-tight">{activeProduct.name}</h2>
                  <h2 className="md:hidden text-2xl font-black text-gray-900 mb-4 tracking-tight leading-snug">
                    {activeProduct.ai_intent_layers && (activeProduct.ai_intent_layers.personalization || activeProduct.ai_intent_layers.outcome)
                      ? String(activeProduct.ai_intent_layers.personalization || activeProduct.ai_intent_layers.outcome).replace(/^["']|["']$/g, '')
                      : activeProduct.name}
                  </h2>

                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-sm font-bold flex items-center text-yellow-500 bg-yellow-50 px-3 py-1 rounded-full">★ {activeProduct.rating}</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${activeProduct.localAvailable ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {activeProduct.localAvailable ? `✓ In Stock • ${selectedNode}` : `📦 Ships in ${activeProduct.brandDeliveryDays} Days`}
                    </span>
                  </div>

                  <div className="flex items-end gap-3 mb-12">
                    <span className="text-5xl font-black text-gray-900 tracking-tight">₹{activeProduct.price}</span>
                    <span className="text-2xl text-gray-400 line-through mb-1 font-medium">₹{activeProduct.mrp}</span>
                  </div>

                  <div className="space-y-5 mt-auto">
                    <div className="border-2 border-green-500 rounded-3xl p-6 bg-green-50/40 cursor-pointer hover:bg-green-50 transition relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl tracking-wider">RECOMMENDED</div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full border-4 border-green-500 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                          </div>
                          <span className="font-bold text-gray-900 text-xl">Subscribe & Save 10%</span>
                        </div>
                        <span className="text-xl font-black text-green-700">₹{Math.round(activeProduct.price * 0.9)}</span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium ml-10 mb-6">
                        Auto-delivered every <span className="font-bold text-gray-900">{activeProduct.consumptionCycle} days</span>. Cancel anytime.
                      </p>
                      <button
                        onClick={() => { handleAddToCart(activeProduct.name); setActiveProduct(null); }}
                        className="w-[calc(100%-2.5rem)] ml-10 bg-green-600 text-white py-4 rounded-xl text-sm font-bold group-hover:bg-green-500 transition shadow-lg shadow-green-600/20"
                      >
                        Set up Subscription
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-3xl p-6 cursor-pointer hover:border-gray-300 transition bg-white group">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                          <span className="font-bold text-gray-900 text-xl">One-time purchase</span>
                        </div>
                        <span className="text-xl font-black text-gray-900">₹{activeProduct.price}</span>
                      </div>
                      <button
                        onClick={() => { handleAddToCart(activeProduct.name); setActiveProduct(null); }}
                        className="w-[calc(100%-2.5rem)] ml-10 bg-[#111827] text-white py-4 rounded-xl text-sm font-bold group-hover:bg-gray-800 transition shadow-lg shadow-gray-900/20"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* ========================================= */}
        {/* BRAND PROFILE OVERLAY                     */}
        {/* ========================================= */}
        {
          activeBrand && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
              <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

                <div className="bg-gradient-to-r from-[#111827] to-[#1E3A8A] text-white p-12 relative">
                  <button
                    onClick={() => setActiveBrand(null)}
                    className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition text-xl font-bold"
                  >
                    ✕
                  </button>

                  <div className="w-24 h-24 bg-white rounded-3xl mb-6 flex items-center justify-center overflow-hidden p-4 shadow-2xl">
                    {activeBrand && BRAND_LOGOS[activeBrand] ? (
                      <img referrerPolicy="no-referrer" src={BRAND_LOGOS[activeBrand]} alt={activeBrand} className="object-contain w-full h-full mix-blend-multiply" />
                    ) : (
                      <span className="text-4xl">🏢</span>
                    )}
                  </div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">{activeBrand}</h2>
                  <p className="text-sm font-medium text-blue-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                    Live Local Inventory • {selectedNode}
                  </p>
                </div>

                <div className="p-12 overflow-y-auto bg-[#F8FAFC] flex-1">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-gray-900">Brand Portfolio</h3>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200 px-4 py-2 rounded-full">Feed from {selectedNode}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-4 md:gap-6">
                    {userItems.filter(i => i.brand?.trim().toLowerCase() === activeBrand.trim().toLowerCase()).map(item => (
                      <div key={`brand-${item.name}`} className={`bg-white rounded-3xl p-6 shadow-sm border ${item.localAvailable ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'} hover:shadow-xl transition-all duration-300 flex flex-col`}>
                        <div className="aspect-square bg-[#F8FAFC] rounded-2xl mb-5 relative flex items-center justify-center p-4 overflow-hidden group">
                          {item.localAvailable && item.low && <span className="absolute top-3 right-3 text-[9px] bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold z-10 shadow-sm">Running Low</span>}
                          {!item.localAvailable && <span className="absolute top-3 right-3 text-[9px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold z-10 shadow-sm">Multi-Day</span>}
                          {item.image_url ? (
                            <img referrerPolicy="no-referrer" src={item.image_url} alt={item.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-4xl text-gray-300 group-hover:scale-110 transition-transform">📦</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-tight mb-3 flex-1">{item.name}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <p className="text-base font-black text-gray-900">₹{item.price}</p>
                          <p className="text-xs text-gray-400 line-through font-medium">₹{item.mrp}</p>
                        </div>

                        {item.localAvailable ? (
                          <p className="text-[10px] text-green-600 font-bold mb-4 uppercase tracking-wider flex items-center gap-1"><span className="text-sm">✓</span> In Stock</p>
                        ) : (
                          <p className="text-[10px] text-blue-600 font-bold mb-4 uppercase tracking-wider">Arrives in {item.brandDeliveryDays} Days</p>
                        )}

                        <button
                          onClick={() => { handleAddToCart(item.name); setCartOpen(true); }}
                          className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all shadow-sm ${addedItem === item.name ? "bg-green-500 text-white shadow-green-500/20" : "bg-[#111827] text-white hover:bg-gray-800 hover:shadow-gray-900/20"}`}
                        >
                          {addedItem === item.name ? "Added ✓" : "Add to Cart"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        }


        {/* Floating Insight Bubble */}
        {
          showInsight && (
            <div className={`fixed bottom-24 left-4 z-[100] bg-white border border-blue-100 rounded-2xl p-4 shadow-2xl w-[85%] md:w-80 animate-in slide-in-from-bottom-5 ${cartCount > 0 ? 'max-md:hidden' : ''}`}>
              <div className="flex items-start justify-between gap-3 relative">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex flex-shrink-0 items-center justify-center text-xl shadow-inner border border-blue-100">
                  {insightData.icon}
                </div>
                <div className="flex-1 pr-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-1">{insightData.title}</h4>
                  <p className="text-sm font-medium text-gray-700 leading-snug">{insightData.text}</p>
                </div>
                <button
                  onClick={() => setShowInsight(false)}
                  className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        }
      </main >
    </>
  );
}
