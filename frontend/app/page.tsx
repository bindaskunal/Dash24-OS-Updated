// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";

const MASTER_CATALOG = [
  { name: "Protein Shake", brand: "The Whole Truth", price: 1499, mrp: 1799, rating: 4.6, low: true, lastPurchased: 12, consumptionCycle: 15, inventory: { Koramangala: 3, Indiranagar: 0, HSR: 12 }, image_url: "https://www.jiomart.com/images/product/original/rvekvhwpxb/the-whole-truth_light-cocoa-whey-protein-isolate-concentrate-24g-protein-product-images-orvekvhwpxb-p606367622-0-202311282004.jpg?im=Resize=(420,420)" },
  { name: "Energy Bars (Pack of 6)", brand: "The Whole Truth", price: 599, mrp: 699, rating: 4.8, low: false, lastPurchased: 5, consumptionCycle: 20, inventory: { Koramangala: 15, Indiranagar: 8, HSR: 0 }, image_url: "https://www.bbassets.com/media/uploads/p/l/40201406_10-the-whole-truth-protein-bars-all-in-one.jpg" },
  { name: "Plant Protein Isolate", brand: "The Whole Truth", price: 1899, mrp: 2099, rating: 4.5, low: false, lastPurchased: 6, consumptionCycle: 30, inventory: { Koramangala: 0, Indiranagar: 5, HSR: 2 }, image_url: "https://media.thewholetruthfoods.com/public/backend-assets/01K13EVF2K7B4CZ6BDHWPSCPTZ.png" },
  { name: "Vitamin C Serum", brand: "Minimalist", price: 699, mrp: 799, rating: 4.7, low: true, lastPurchased: 28, consumptionCycle: 30, inventory: { Koramangala: 5, Indiranagar: 1, HSR: 0 }, image_url: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000008_a.jpg?tr=w-344,h-344,cm-pad_resize" },
  { name: "Face Wash", brand: "Minimalist", price: 399, mrp: 499, rating: 4.4, low: false, lastPurchased: 10, consumptionCycle: 45, inventory: { Koramangala: 0, Indiranagar: 12, HSR: 8 }, image_url: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000041_a.jpg?tr=w-344,h-344,cm-pad_resize" },
  { name: "Ashwagandha Gummies", brand: "What's Up Wellness", price: 899, mrp: 999, rating: 4.5, low: true, lastPurchased: 25, consumptionCycle: 30, inventory: { Koramangala: 0, Indiranagar: 4, HSR: 10 }, image_url: "https://whatsupwellness.in/cdn/shop/files/stress_51da983c-837f-429d-b235-fb15692d44c0.png?v=1769849561&width=640" },
  { name: "Amla Juice (1L)", brand: "Kapiva", price: 349, mrp: 399, rating: 4.3, low: false, lastPurchased: 12, consumptionCycle: 20, inventory: { Koramangala: 8, Indiranagar: 0, HSR: 6 }, image_url: "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,,q-40,dpr-2/cms/product_variant/e24d3023-db58-49b0-b0c5-20dd428e54f6/Kapiva-Wild-Amla-Juice.jpeg" },
  { name: "Biotin Gummies", brand: "What's Up Wellness", price: 799, mrp: 899, rating: 4.6, low: false, lastPurchased: 5, consumptionCycle: 30, inventory: { Koramangala: 10, Indiranagar: 5, HSR: 2 }, image_url: "https://m.media-amazon.com/images/I/513MzZFVmoL._AC_UF1000,1000_QL80_.jpg" }
];

const generateNodeItems = (nodeName: string) => {
  return MASTER_CATALOG.map(item => {
    const stock = item.inventory[nodeName as keyof typeof item.inventory];
    return {
      ...item,
      stock: stock,
      localAvailable: stock > 0,
      refillInDays: stock === 0 ? 1 : 0,
      brandDeliveryDays: stock === 0 ? 3 : 0,
    };
  });
};

export default function Home() {
  const [products, setProducts] = useState(MASTER_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");
  const [selectedNode, setSelectedNode] = useState("Koramangala");
  const [nodeOpen, setNodeOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [zoneOrders, setZoneOrders] = useState(12);
  const [aiMode, setAiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<
    { name: string; price: number; quantity: number }[]
  >([]);
  const [intent, setIntent] = useState<"product" | "question" | "compare" | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<0 | 1 | 2 | 3>(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  // Auto-close the cart drawer if the user removes the last item
  useEffect(() => {
    if (cartCount === 0 && cartOpen) {
      setCartOpen(false);
      setTimeout(() => setCheckoutStep(0), 300); // Resets checkout flow silently
    }
  }, [cartCount, cartOpen]);
useEffect(() => {
    async function syncWithBackend() {
      try {
        const response = await fetch('https://dash24-backend.onrender.com/api/products');
        if (response.ok) {
          const freshData = await response.json();
          // This replaces the hardcoded list with your backend catalog.json
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
    function handleClickOutside(event: MouseEvent) {
      if (
        nodeRef.current &&
        !nodeRef.current.contains(event.target as Node)
      ) {
        setNodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
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

  const NODE_DATA = {
    Koramangala: {
      nearestDistanceKm: 1.2,
      brandsInZone: 42,
      highDemandBrands: 18,
      demandBrands: ["Minimalist", "The Whole Truth", "Sleepy Owl", "Kapiva"],
    },
    Indiranagar: {
      nearestDistanceKm: 0.8,
      brandsInZone: 38,
      highDemandBrands: 24,
      demandBrands: ["Sleepy Owl", "Minimalist", "Kapiva", "The Whole Truth"],
    },
    HSR: {
      nearestDistanceKm: 1.6,
      brandsInZone: 46,
      highDemandBrands: 12,
      demandBrands: ["Kapiva", "The Whole Truth", "Minimalist", "Sleepy Owl"],
    },
  } as const;

  const currentNode = NODE_DATA[selectedNode as keyof typeof NODE_DATA];

  const [userItems, setUserItems] = useState(() => generateNodeItems("Koramangala"));
  const scoredItems = userItems.map((item) => {
    let score = 0;

    // Base score from rating
    score += item.rating * 10;

    // Scarcity boost
    if (item.stock <= 3) score += 15;

    // Reorder window boost
    if (item.low) score += 20;

    // Search relevance boost
    if (
      intent === "product" &&
      searchQuery &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      score += 30;
    }

    return { ...item, score };
  }).sort((a, b) => b.score - a.score);
  const hasRunningLow = userItems.some(
    (item) =>
      item.lastPurchased >= item.consumptionCycle - 3
  );

  const handleNodeChange = (node: string) => {
    if (node === selectedNode) return;
    setNodeOpen(false);
    setIsTransitioning(true);

    // Clear the cart when changing locations to prevent dead inventory
    setCartItems([]);
    setCartCount(0);
    setAddedItem(null);
    setCartOpen(false);
    setCheckoutStep(0);

    setTimeout(() => {
      setSelectedNode(node);
      setUserItems(generateNodeItems(node)); // Instantly calculates new local stock
      setIsTransitioning(false);
    }, 200);
  };
  const handleDecrease = (itemName: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.name === itemName
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setCartCount((prev) => Math.max(prev - 1, 0));

    setUserItems((prevItems) =>
      prevItems.map((item) =>
        item.name === itemName && item.localAvailable
          ? { ...item, stock: item.stock + 1 }
          : item
      )
    );
  };

  const handleRemoveItem = (itemName: string) => {
    const itemToRemove = cartItems.find((i) => i.name === itemName);
    if (!itemToRemove) return;

    setCartCount((prev) => Math.max(prev - itemToRemove.quantity, 0));

    setCartItems((prev) =>
      prev.filter((item) => item.name !== itemName)
    );

    setUserItems((prevItems) =>
      prevItems.map((item) =>
        item.name === itemName && item.localAvailable
          ? { ...item, stock: item.stock + itemToRemove.quantity }
          : item
      )
    );
  };
const handleAddToCart = (productOrName: any) => {
    // 1. Smart Lookup: If a text string was passed, find the full product object.
    const product = typeof productOrName === 'string' 
      ? userItems.find(p => p.name === productOrName) || products.find(p => p.name === productOrName)
      : productOrName;

    if (!product) return; // Failsafe

    // 2. Visual Feedback
    setAddedItem(product.name);
    setCartOpen(true);
    setCartCount((prev) => prev + 1);

    // 3. Robust Cart Logic (Handles both Backend IDs and Local Names)
    setCartItems((prev) => {
      // Find if the item is already in the cart (using ID if available, otherwise Name)
      const existing = prev.find((item) => 
        (product.id && item.id === product.id) || (item.name === product.name)
      );

      if (existing) {
        return prev.map((item) =>
          (product.id && item.id === product.id) || (item.name === product.name)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // If new, add the whole product object plus quantity
      return [...prev, { ...product, quantity: 1 }];
    });

    // 4. Auto-hide "Added" toast after 2 seconds
    setTimeout(() => setAddedItem(null), 2000);
  };

  const placeOrder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://dash24-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Maps your cart items into the format the backend expects
          items: cartItems.map((item: any) => ({
            product_id: item.id || 1, 
            quantity: item.quantity
          })),
          // Calculate the total right here
          total_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }),
      });

      if (response.ok) {
        setCheckoutStep(3); // Go to Success Screen
        // We do NOT clear the cart here, so the Success Screen can still show the order breakdown!
      } else {
        console.error("Order failed on server");
        setCheckoutStep(3); // Move forward anyway for the demo
      }
    } catch (error) {
      console.error("Network error during checkout:", error);
      setCheckoutStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const classifyIntent = (query: string) => {
    const q = query.toLowerCase().trim();

    if (!q) {
      setIntent(null);
      setAiMode(false);
      setDetectedCategory(null);
      return;
    }

    // Simulate AI Entity Extraction (Understanding what product they want)
    if (q.includes("protein") || q.includes("whey")) setDetectedCategory("Protein");
    else if (q.includes("coffee") || q.includes("brew")) setDetectedCategory("Coffee");
    else if (q.includes("face") || q.includes("wash") || q.includes("skin")) setDetectedCategory("Skincare");
    else setDetectedCategory(null);

    // Simulate AI Intent Classification (Understanding what kind of help they need)
    if (q.includes("vs") || q.includes("compare") || q.includes("difference")) {
      setIntent("compare");
      setAiMode(true);
    } else if (q.includes("best") || q.includes("recommend") || q.includes("which") || q.includes("what") || q.includes("?")) {
      setIntent("question");
      setAiMode(true);
    } else {
      setIntent("product");
      setAiMode(false);
    }
  };
  let sectionsOrder: string[] = [];

  if (intent === "question") {
    sectionsOrder = ["smart", "reorder", "demand"];
  } else if (intent === "product") {
    sectionsOrder = ["reorder", "demand", "smart"];
  } else if (hasRunningLow) {
    sectionsOrder = ["reorder", "demand", "smart"];
  } else if (currentNode.highDemandBrands > 15) {
    sectionsOrder = ["demand", "reorder", "smart"];
  } else {
    sectionsOrder = ["smart", "reorder", "demand"];
  }
  const localCartTotal = cartItems
    .filter((item) => userItems.find((u) => u.name === item.name)?.localAvailable)
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const freeDeliveryThreshold = 1999;
  const amountRemaining = Math.max(0, freeDeliveryThreshold - localCartTotal);
  const progressPercentage = Math.min((localCartTotal / freeDeliveryThreshold) * 100, 100);

  const localSubtotal = cartItems
    .filter((item) =>
      userItems.find((u) => u.name === item.name)?.localAvailable
    )
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const brandSubtotal = cartItems
    .filter((item) =>
      !userItems.find((u) => u.name === item.name)?.localAvailable
    )
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const localShipping = localSubtotal > 0 && localSubtotal < 1999 ? 50 : 0;
  const brandShipping = brandSubtotal > 0 && brandSubtotal < 499 ? 50 : 0;

  const subtotal = localSubtotal + brandSubtotal;
  const total = subtotal + localShipping + brandShipping;
  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);

    const hours = now.getHours();
    const minutes = now.getMinutes();

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${formattedMinutes}`;
  };

  const deliveryTime = getDeliveryTime();
  const getDash24DeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${formattedMinutes}`;
  };

  const getBrandDeliveryDate = () => {
    const maxBrandDays = cartItems.reduce((max, item) => {
      const product = userItems.find((u) => u.name === item.name);
      if (!product || product.localAvailable) return max;
      return Math.max(max, product.brandDeliveryDays || 0);
    }, 0);

    if (maxBrandDays === 0) return null;

    const future = new Date();
    future.setDate(future.getDate() + maxBrandDays);

    return future.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const dash24DeliveryTime = getDash24DeliveryTime();
  const brandDeliveryDate = getBrandDeliveryDate();
  const suggestedItem =
    cartItems.length === 1
      ? userItems
        .filter(
          (item) =>
            item.name !== cartItems[0].name &&
            item.localAvailable &&
            item.stock > 0
        )
        .sort((a, b) => b.rating - a.rating)[0]
      : null;

  const hasLocalItems = cartItems.some((item) => {
    const product = userItems.find((u) => u.name === item.name);
    return product?.localAvailable;
  });
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#F5F6FA] to-[#EDEFF3] text-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

            {/* TOP BAR */}
            <div className="flex items-center justify-between px-10 py-5 border-b border-gray-100">

              {/* SEARCH */}
              <div className="w-[420px] relative z-50">
                <div className={`flex items-center bg-[#F3F4F6] rounded-full px-4 py-2.5 transition-all ${searchFocused ? 'ring-2 ring-[#1E3A8A]/20 bg-white shadow-sm' : ''}`}>
                  <span className="text-gray-400 mr-2 text-sm">🔍</span>
                  <input
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      classifyIntent(e.target.value);
                    }}
                    placeholder="Search products or ask a question…"
                    className="w-full bg-transparent text-sm outline-none placeholder-gray-400"
                  />
                  {aiMode && <span className="text-[10px] font-medium bg-[#EEF2FF] text-[#1E3A8A] px-2 py-0.5 rounded-full ml-2">AI Mode</span>}
                </div>

                {/* AI DROPDOWN */}
                {searchFocused && searchQuery.length > 2 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    {/* AI Thinking/Context Strip */}
                    {aiMode && (
                      <div className="bg-slate-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="animate-pulse text-[#1E3A8A]">✨</span>
                          <span className="text-[10px] text-gray-500 font-medium">Constrained to live {selectedNode} inventory</span>
                        </div>
                        {detectedCategory && (
                          <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-gray-600">Category: {detectedCategory}</span>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      {intent === "product" && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          Press enter to search marketplace for <span className="font-semibold text-gray-900">"{searchQuery}"</span>
                        </p>
                      )}

                      {intent === "question" && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-900">Recommended for you locally</p>
                          <div className="flex items-center gap-3 p-3 bg-[#EEF2FF]/50 rounded-xl border border-[#1E3A8A]/10">
                            <div className="w-10 h-10 bg-white rounded shadow-sm flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-semibold">{detectedCategory === "Coffee" ? "Coffee Pods" : "Protein Shake"}</p>
                              <p className="text-[11px] text-gray-500">Highest reorder rate in {selectedNode}</p>
                            </div>
                            <button onClick={() => handleAddToCart(detectedCategory === "Coffee" ? "Coffee Pods" : "Protein Shake")} className="ml-auto text-[10px] bg-[#1E3A8A] text-white px-3 py-1.5 rounded-full">Add</button>
                          </div>
                        </div>
                      )}

                      {intent === "compare" && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-900">Live Metric Comparison</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 border rounded-xl bg-gray-50">
                              <p className="text-xs font-semibold mb-1">Brand A</p>
                              <p className="text-[10px] text-emerald-600 font-medium">High Zone Availability</p>
                              <p className="text-[10px] text-gray-500">68% Reorder Rate</p>
                            </div>
                            <div className="p-3 border rounded-xl bg-white">
                              <p className="text-xs font-semibold mb-1">Brand B</p>
                              <p className="text-[10px] text-orange-500 font-medium">Low Stock Warning</p>
                              <p className="text-[10px] text-gray-500">61% Reorder Rate</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCOUNT + CART */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 cursor-pointer hover:text-[#1E3A8A] transition">
                  <div className="w-8 h-8 bg-[#EEF2FF] text-[#1E3A8A] flex items-center justify-center rounded-full text-sm">
                    👤
                  </div>
                  <span className="text-sm text-gray-600">Account</span>
                </div>

                <div
                  onClick={() => setCartOpen(true)}
                  className="relative cursor-pointer hover:text-[#F97316] transition"
                >
                  <div className="w-8 h-8 bg-[#FFF7ED] text-[#F97316] flex items-center justify-center rounded-full text-sm">
                    🛒
                  </div>
                  <div className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </div>
                </div>
              </div>

            </div>

            {/* HERO */}
            <div className="bg-gradient-to-r from-[#111827] to-[#1E293B] text-white px-12 py-10">
              <p className="text-sm text-gray-400 mb-2">
                Delivering to {selectedNode}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                {greeting}, Kunal.
              </h1>
              <p className="text-sm text-gray-400">
                Your essentials are stocked nearby — delivered within 60 minutes.
              </p>
            </div>

            {/* INFRA STRIP */}
            <div className="px-12 py-4 bg-[#F9FAFB] border-b border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <div className="relative" ref={nodeRef}>
                  <button
                    onClick={() => setNodeOpen(!nodeOpen)}
                    className="font-medium text-gray-700 hover:text-black transition"
                  >
                    📍 Delivering to: {selectedNode}
                  </button>

                  {nodeOpen && (
                    <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-md border border-gray-100 z-50">
                      {Object.keys(NODE_DATA).map((node) => (
                        <div
                          key={node}
                          onClick={() => handleNodeChange(node)}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
                        >
                          {node}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-12 py-2 text-[11px] text-gray-500">
                  Demand velocity in {selectedNode} is up 18% this evening
                </div>

                <span>
                  <span className="font-medium text-gray-700">
                    {currentNode.nearestDistanceKm} km
                  </span>{" "}
                  nearest node
                </span>

                <span>
                  <span className="font-medium text-gray-700">
                    {currentNode.brandsInZone}
                  </span>{" "}
                  brands stocked
                </span>

                <span>
                  <span className="font-medium text-gray-700">
                    {currentNode.highDemandBrands}
                  </span>{" "}
                  in high demand today
                </span>
              </div>
            </div>
            {intent === "question" && (
              <div className="px-12 pt-8">
                <div className="bg-[#EEF2FF] rounded-2xl p-6">
                  <p className="text-sm font-medium text-[#1E3A8A]">
                    AI Insight
                  </p>
                  <p className="text-sm mt-2">
                    Based on demand velocity and reorder patterns in {selectedNode},
                    hydration-focused proteins are currently performing strongest.
                  </p>
                </div>
              </div>
            )}
            {cartCount > 0 && (
              <div className="px-12 py-4 bg-[#FFF7ED] border-b border-[#F97316]/10 transition-all">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-[#F97316]">
                    {amountRemaining > 0
                      ? `₹${amountRemaining} away from free delivery`
                      : "🎉 You’ve unlocked free delivery!"}
                  </span>
                  {amountRemaining > 0 && (
                    <span className="text-[10px] text-[#F97316]/80 font-medium">Add one more essential</span>
                  )}
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-orange-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#F97316] h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
            {/* CONTENT */}
            <div
              className={`px-12 py-12 space-y-14 transition-opacity duration-200 ${isTransitioning ? "opacity-60" : "opacity-100"
                }`}
            >
              {sectionsOrder.map((section) => {

                if (section === "reorder") {
                  return (
                    <div key="reorder" className="bg-[#FFF7ED] rounded-2xl p-8">
                      <h2 className="text-sm font-semibold text-[#F97316] mb-6">
                        For You
                      </h2>
                      {aiMode && (
                        <p className="text-[11px] text-gray-500 mb-6">
                          Prioritized based on reorder window + zone scarcity
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-6">
                        {scoredItems
                          .filter((item) =>
                            intent === "product" && searchQuery
                              ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
                              : true
                          )
                          .map((item) => {
                            const discount = Math.round(
                              ((item.mrp - item.price) / item.mrp) * 100
                            );

                            return (
                              <div
                                key={item.name}
                                className={`bg-white rounded-2xl p-6 transition ${intent === "product" &&
                                    searchQuery &&
                                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    ? "ring-2 ring-[#1E3A8A] shadow-md"
                                    : "hover:shadow-md"
                                  }`}
                              >
                                {/* Clickable Image Area */}
                                <div
                                  onClick={() => setActiveProduct(item)}
                                  className="aspect-square bg-white rounded-xl mb-4 relative cursor-pointer group overflow-hidden border border-gray-100 flex items-center justify-center"
                                >
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name} 
                                      className="object-contain w-full h-full p-4 group-hover:scale-105 transition-transform duration-300" 
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300 group-hover:scale-110 transition-transform duration-300">📦</div>
                                  )}
                                  
                                  {item.localAvailable && item.low && (
                                    <div className="absolute top-2 right-2 text-[10px] px-2 py-1 bg-[#F97316]/10 text-[#F97316] rounded-full font-medium z-10">
                                      Reorder Window Active
                                    </div>
                                  )}
                                </div>  

                                {/* Clickable Title */}
                                <p
                                  onClick={() => setActiveProduct(item)}
                                  className="text-sm font-medium cursor-pointer hover:text-[#1E3A8A] transition"
                                >
                                  {item.name}
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                  <p className="text-sm font-semibold">
                                    ₹{item.price}
                                  </p>
                                  <p className="text-xs text-gray-400 line-through">
                                    ₹{item.mrp}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {discount}% savings
                                  </span>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  ★ {item.rating}
                                </p>

                                {aiMode && (
                                  <p className="text-[10px] text-[#1E3A8A] mt-1">
                                    AI Confidence: High
                                  </p>
                                )}

                                {item.localAvailable ? (
                                  item.stock > 0 ? (
                                    item.stock <= 3 && (
                                      <p className="text-[11px] text-[#DC2626] mt-2 font-medium">
                                        {item.stock === 1
                                          ? "Last unit available in this zone"
                                          : `Only ${item.stock} left in this zone`}
                                      </p>
                                    )
                                  ) : (
                                    item.refillInDays ? (
                                      <p className="text-[11px] text-gray-500 mt-2 font-medium">
                                        Out of stock – Refill arriving in {item.refillInDays} day
                                      </p>
                                    ) : null
                                  )
                                ) : (
                                  <p className="text-[11px] text-gray-500 mt-2 font-medium">
                                    Delivered in {item.brandDeliveryDays} days
                                  </p>
                                )}

                                {/* Cleaned up Add to Cart Button */}
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className={`mt-4 w-full text-xs py-2.5 rounded-full font-medium transition ${addedItem === item.name
                                      ? "bg-green-600 text-white"
                                      : "bg-black text-white hover:opacity-90"
                                    }`}
                                >
                                  {addedItem === item.name ? "Added ✓" : "Add to Cart"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                }
                if (section === "demand") {
                  return (
                    <div key="demand" className="bg-[#EEF2FF] rounded-2xl p-8">
                      <h2 className="text-sm font-semibold text-[#1E3A8A] mb-2">
                        Brands in Demand
                      </h2>

                      <p className="text-[11px] text-[#1E3A8A] mb-4">
                        🔥 {zoneOrders} orders placed in {selectedNode} in last 30 mins
                      </p>
                      {aiMode && (
                        <p className="text-[11px] text-gray-500 mb-6">
                          Ranked by local demand velocity index
                        </p>
                      )}
                      <div className="grid grid-cols-4 gap-6">
                        {currentNode.demandBrands.map((brand) => (
                          <div
                            key={brand}
                            className="bg-white rounded-2xl p-6 hover:shadow-md transition"
                          >
                            <div className="aspect-square bg-gray-50 rounded-xl mb-4"></div>
                            <p className="text-sm font-medium">{brand}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Strong local traction
                            </p>
                            <button onClick={() => setActiveBrand(brand)} className="mt-3 text-xs px-3 py-1 rounded-full bg-black text-white hover:opacity-90 transition">
                              View Brand
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section === "smart") {
                  return (
                    <div key="smart" className="bg-[#F3F4F6] rounded-2xl p-8">
                      <h2 className="text-sm font-semibold text-gray-700 mb-6">
                        Smart Picks
                      </h2>

                      <div className="bg-white rounded-2xl p-8">
                        <p className="text-sm font-medium">
                          {aiMode
                            ? "Velocity threshold crossed in this zone."
                            : "Elevated reorder velocity in this zone."}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Stock rotation accelerating across hydration and wellness.
                        </p>
                        <p className="text-[11px] text-gray-600 mt-3">
                          Early action recommended to avoid replacement gaps.
                        </p>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* PRODUCT PAGE OVERLAY                      */}
      {/* ========================================= */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex animate-in fade-in zoom-in-95 duration-200">

            {/* Left Side: Product Imagery */}
            <div className="w-1/2 bg-gray-50 p-10 flex flex-col items-center justify-center relative border-r border-gray-100">
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition"
              >
                ✕
              </button>

              <div className="w-72 h-72 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-7xl relative overflow-hidden p-6">
                {activeProduct.image_url ? (
                  <img src={activeProduct.image_url} alt={activeProduct.name} className="object-contain w-full h-full" />
                ) : (
                  "📦"
                )}
                {activeProduct.localAvailable && activeProduct.low && (
                  <div className="absolute top-4 right-4 text-xs px-3 py-1 bg-[#F97316]/10 text-[#F97316] rounded-full font-semibold">
                    Running Low
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Details & Actions */}
            <div className="w-1/2 p-12 overflow-y-auto flex flex-col bg-white">
              <div className="mb-3">
                <span className="text-[11px] font-bold tracking-widest uppercase text-gray-500">{activeProduct.brand}</span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">{activeProduct.name}</h2>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-semibold flex items-center text-yellow-500">★ {activeProduct.rating}</span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                <span className={`text-sm font-semibold ${activeProduct.localAvailable ? 'text-green-600' : 'text-blue-600'}`}>
                  {activeProduct.localAvailable ? `✓ In Stock • ${selectedNode} Node` : `📦 Ships in ${activeProduct.brandDeliveryDays} Days`}
                </span>
              </div>

              <div className="flex items-end gap-3 mb-10">
                <span className="text-4xl font-bold text-gray-900">₹{activeProduct.price}</span>
                <span className="text-xl text-gray-400 line-through mb-1">₹{activeProduct.mrp}</span>
              </div>

              <div className="space-y-4 mt-auto">

                {/* Action 1: Subscribe & Save */}
                <div className="border-2 border-green-500 rounded-2xl p-5 bg-green-50/40 cursor-pointer hover:bg-green-50 transition relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="purchaseType" defaultChecked className="w-5 h-5 accent-green-600" />
                      <span className="font-bold text-gray-900 text-lg">Subscribe & Save 10%</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">₹{Math.round(activeProduct.price * 0.9)}</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8 mb-4">
                    Auto-delivered every <span className="font-semibold">{activeProduct.consumptionCycle} days</span>. Cancel anytime.
                  </p>
                  <button
                    onClick={() => {
                      handleAddToCart(activeProduct.name);
                      setActiveProduct(null); // Closes page after adding to cart
                    }}
                    className="w-full ml-8 max-w-[calc(100%-2rem)] bg-green-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-md shadow-green-600/20"
                  >
                    Set up Subscription
                  </button>
                </div>

                {/* Action 2: One-time Purchase */}
                <div className="border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-gray-300 transition bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="purchaseType" className="w-5 h-5 accent-gray-900" />
                      <span className="font-semibold text-gray-900 text-lg">One-time purchase</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">₹{activeProduct.price}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleAddToCart(activeProduct.name);
                      setActiveProduct(null); // Closes page after adding to cart
                    }}
                    className="w-full ml-8 max-w-[calc(100%-2rem)] bg-[#111827] text-white py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition"
                  >
                    Add to Cart
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* BRAND PROFILE OVERLAY                     */}
      {/* ========================================= */}
      {activeBrand && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

            {/* Brand Header */}
            <div className="bg-gradient-to-r from-[#111827] to-[#1E3A8A] text-white p-10 relative">
              <button
                onClick={() => setActiveBrand(null)}
                className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl transition"
              >
                ✕
              </button>
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/20 flex items-center justify-center text-2xl">
                📦
              </div>
              <h2 className="text-3xl font-bold tracking-tight">{activeBrand}</h2>
              <p className="text-sm text-blue-200 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Live Local Inventory • {selectedNode} Node
              </p>
            </div>

            {/* Brand Products Grid */}
            <div className="p-10 overflow-y-auto bg-gray-50 flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-gray-900">Brand Portfolio</h3>
                <span className="text-[11px] font-medium text-gray-500">Live feed from {selectedNode} Node</span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {userItems.filter(i => i.brand === activeBrand).map(item => (
                  <div key={`brand-${item.name}`} className={`bg-white rounded-2xl p-5 shadow-sm border ${item.localAvailable ? 'border-gray-100' : 'border-blue-100 bg-blue-50/20'} hover:shadow-md transition`}>
                    <div className="aspect-square bg-gray-50 rounded-xl mb-4 relative flex items-center justify-center">
                      {item.localAvailable && item.low && <span className="absolute top-2 right-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Running Low</span>}
                      {!item.localAvailable && <span className="absolute top-2 right-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Multi-Day</span>}
                      <span className="text-4xl text-gray-300">📦</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 leading-tight mb-2 h-10">{item.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold">₹{item.price}</p>
                      <p className="text-xs text-gray-400 line-through">₹{item.mrp}</p>
                    </div>

                    {item.localAvailable ? (
                      <p className="text-[10px] text-green-600 font-medium mb-3">✓ In Stock Locally</p>
                    ) : (
                      <p className="text-[10px] text-blue-600 font-medium mb-3">Arrives in {item.brandDeliveryDays} Days</p>
                    )}

                    <button
                      onClick={() => handleAddToCart(item.name)}
                      className={`w-full text-xs py-2.5 rounded-full font-medium transition ${addedItem === item.name ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:opacity-90"
                        }`}
                    >
                      {addedItem === item.name ? "Added ✓" : "Add to Cart"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setCartOpen(false)}
            className="flex-1 bg-black/30"
          />
          <div className="w-[400px] bg-white shadow-2xl p-6 flex flex-col">
            {checkoutStep === 0 && (
              <>
                <h2 className="text-lg font-semibold mb-4">Your Cart</h2>

                {/* IN-CART PROGRESS BAR */}
                <div className="bg-[#FFF7ED] rounded-xl p-4 mb-6 border border-[#F97316]/20 shadow-sm">
                  <p className="text-xs font-semibold text-[#F97316] mb-3 text-center">
                    {amountRemaining > 0
                      ? `Add ₹${amountRemaining} more for FREE Dash24 Delivery`
                      : "🎉 Free Dash24 Delivery Unlocked!"}
                  </p>
                  <div className="w-full bg-orange-200/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#F97316] h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  {cartItems.length === 0 && (
                    <p className="text-sm text-gray-500">Cart is empty</p>
                  )}

                  {cartItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center border-b pb-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          ₹{item.price} × {item.quantity}
                        </p>
                        {(() => {
                          const userItem = userItems.find((u) => u.name === item.name);
                          if (!userItem) return null;

                          if (
                            userItem.lastPurchased >=
                            userItem.consumptionCycle - 2
                          ) {
                            return (
                              <p className="text-[11px] text-[#1E3A8A] mt-1">
                                You typically reorder this every {userItem.consumptionCycle} days
                              </p>
                            );
                          }

                          return null;
                        })()}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleDecrease(item.name)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAddToCart(item.name)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.name)}
                            className="text-xs text-red-500 ml-2"
                          >
                            Remove
                          </button>
                        </div>

                      </div>

                      <p className="text-sm font-semibold">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
                {suggestedItem && (
                  <div className="bg-[#F3F4F6] rounded-xl p-4 mb-4">
                    <p className="text-[12px] font-medium text-gray-700 mb-2">
                      Frequently purchased together in your zone
                    </p>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {suggestedItem.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{suggestedItem.price}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(suggestedItem.name)}
                        className="text-xs px-3 py-1 rounded-full bg-black text-white hover:opacity-90 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                {hasLocalItems && (
                  <p className="text-[11px] text-gray-500 mb-3">
                    {zoneOrders} orders placed in {selectedNode} in the last 30 minutes
                  </p>
                )}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-semibold">₹{subtotal}</span>
                  </div>

                  {localSubtotal > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Dash24 Delivery
                      </span>
                      <span className="text-sm font-semibold">
                        {localShipping === 0 ? "Free" : `₹${localShipping}`}
                      </span>
                    </div>
                  )}

                  {brandSubtotal > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Brand Direct Delivery
                      </span>
                      <span className="text-sm font-semibold">
                        {brandShipping === 0 ? "Free" : `₹${brandShipping}`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between mb-4">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-semibold">₹{total}</span>
                  </div>
                  {localSubtotal > 0 && (
                    <p className="text-[12px] text-gray-600 mb-1">
                      Dash24 Delivery — Today before {dash24DeliveryTime}
                    </p>
                  )}

                  {brandSubtotal > 0 && brandDeliveryDate && (
                    <p className="text-[12px] text-gray-600 mb-3">
                      Brand Direct Delivery — Arrives by {brandDeliveryDate}
                    </p>
                  )}

                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="w-full bg-black text-white py-3 rounded-full text-sm hover:opacity-90 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}

            {checkoutStep === 1 && (
              <>
                {/* HEADER WITH BACK BUTTON */}
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCheckoutStep(0)}
                    className="mr-3 text-gray-400 hover:text-black transition"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-semibold">Delivery Summary</h2>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2">

                  {/* ADDRESS & NODE CONFIRMATION */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="mb-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Delivering To</p>
                      <p className="text-sm font-medium">Home • 100ft Road, Indiranagar</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Fulfillment Node</p>
                      <p className="text-sm font-medium text-[#1E3A8A]">📍 {selectedNode} Active</p>
                    </div>
                  </div>

                  {/* ORDER PART A: DASH24 DELIVERY */}
                  {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                    <div className="border border-[#1E3A8A]/20 rounded-xl overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#1E3A8A]"></div>
                      <div className="p-4 bg-[#EEF2FF]/50 border-b border-[#1E3A8A]/10 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-[#1E3A8A] flex items-center">
                            Dash24 Delivery
                          </h3>
                          <span className="text-[11px] font-medium text-[#1E3A8A] mt-0.5 block">Arriving Today by {dash24DeliveryTime}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).map(item => (
                          <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0"></div>
                              <span className="font-medium text-gray-700">{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                            </div>
                            <span className="font-semibold text-gray-600">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ORDER PART B: BRAND DIRECT DELIVERY */}
                  {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                    <div className="border border-[#F97316]/20 rounded-xl overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#F97316]"></div>
                      <div className="p-4 bg-[#FFF7ED]/50 border-b border-[#F97316]/10 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-[#F97316] flex items-center">
                            Brand Direct
                          </h3>
                          <span className="text-[11px] font-medium text-[#F97316] mt-0.5 block">Arrives by {brandDeliveryDate}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).map(item => (
                          <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0"></div>
                              <span className="font-medium text-gray-700">{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                            </div>
                            <span className="font-semibold text-gray-600">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROCEED BUTTON TO STEP 2 */}
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="w-full bg-[#1E3A8A] text-white py-3 rounded-full text-sm font-medium hover:opacity-90 transition"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            )}
            {checkoutStep === 2 && (
              <>
                {/* HEADER WITH BACK BUTTON */}
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="mr-3 text-gray-400 hover:text-black transition"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Select how you'd like to pay for your order of <span className="font-semibold text-gray-900">₹{total}</span>
                  </p>

                  {/* UPI OPTION */}
                  <label className="flex items-center justify-between p-4 border border-[#1E3A8A]/30 rounded-xl cursor-pointer bg-[#EEF2FF]/30">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-medium text-sm text-gray-800">UPI (GPay, PhonePe, Paytm)</span>
                    </div>
                    <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">Recommended</div>
                  </label>

                  {/* CREDIT/DEBIT CARD OPTION */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-[#1E3A8A]/30 transition bg-white">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-medium text-sm text-gray-800">Credit / Debit Card</span>
                    </div>
                  </label>

                  {/* CASH ON DELIVERY OPTION */}
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-[#1E3A8A]/30 transition bg-white">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-medium text-sm text-gray-800">Cash on Delivery</span>
                    </div>
                  </label>
                </div>

                {/* PLACE ORDER BUTTON TO STEP 3 */}
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={placeOrder}
                    className="w-full bg-black text-white py-4 rounded-full text-sm font-medium hover:opacity-90 transition flex justify-between px-6 items-center"
                  >
                    <span>Pay ₹{total}</span>
                    <span>Place Order →</span>
                  </button>
                </div>
              </>
            )}
            {checkoutStep === 3 && (
              <div className="flex flex-col h-full items-center justify-center text-center px-2 py-8 mt-10">

                {/* SUCCESS ANIMATION / ICON */}
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-green-100">
                  ✓
                </div>

                <h2 className="text-2xl font-bold mb-2 text-gray-900">Order Confirmed!</h2>
                <p className="text-sm text-gray-500 mb-10">
                  Your order of <span className="font-semibold text-gray-900">₹{total}</span> has been successfully placed.
                </p>

                {/* INVESTOR CRITICAL: ORDER SPLIT VISUALIZATION */}
                <div className="w-full space-y-4 text-left mb-10">

                  {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                    <div className="bg-[#EEF2FF] p-4 rounded-xl border border-[#1E3A8A]/20 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">⚡</div>
                      <div>
                        <p className="text-[10px] text-[#1E3A8A] font-bold uppercase tracking-wider mb-0.5">Order Part A</p>
                        <p className="text-sm font-medium text-gray-900">Dash24 Delivery by {dash24DeliveryTime}</p>
                      </div>
                    </div>
                  )}

                  {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                    <div className="bg-[#FFF7ED] p-4 rounded-xl border border-[#F97316]/20 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">📦</div>
                      <div>
                        <p className="text-[10px] text-[#F97316] font-bold uppercase tracking-wider mb-0.5">Order Part B</p>
                        <p className="text-sm font-medium text-gray-900">Brand Direct by {brandDeliveryDate}</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* POST-PURCHASE AI HABIT ENFORCEMENT */}
                {cartItems.length > 0 ? (
                  <div className="w-full bg-[#EEF2FF] p-5 rounded-2xl border border-[#1E3A8A]/20 mt-auto text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✨</span>
                      <h3 className="text-sm font-bold text-[#1E3A8A]">Smart Refill</h3>
                    </div>
                    <p className="text-xs text-[#1E3A8A]/80 mb-5 leading-relaxed">
                      AI predicts you'll need a refill of <span className="font-semibold">{cartItems[0].name}</span> in {userItems.find(u => u.name === cartItems[0].name)?.consumptionCycle || 30} days.
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          // Simulating opting into the habit
                          setCartItems([]);
                          setCartCount(0);
                          setAddedItem(null);
                          setCartOpen(false);
                          setTimeout(() => setCheckoutStep(0), 300);
                        }}
                        className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-full text-xs font-semibold hover:opacity-90 transition"
                      >
                        Auto-Add to Cart Next Time
                      </button>
                      <button
                        onClick={() => {
                          // Standard continue
                          setCartItems([]);
                          setCartCount(0);
                          setAddedItem(null);
                          setCartOpen(false);
                          setTimeout(() => setCheckoutStep(0), 300);
                        }}
                        className="w-full bg-white text-[#1E3A8A] border border-[#1E3A8A]/20 py-3.5 rounded-full text-xs font-semibold hover:bg-blue-50 transition"
                      >
                        No thanks, Continue Shopping
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCartItems([]);
                      setCartCount(0);
                      setAddedItem(null);
                      setCartOpen(false);
                      setTimeout(() => setCheckoutStep(0), 300);
                    }}
                    className="w-full bg-gray-100 text-gray-900 py-4 rounded-full text-sm font-semibold hover:bg-gray-200 transition mt-auto"
                  >
                    Continue Shopping
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}