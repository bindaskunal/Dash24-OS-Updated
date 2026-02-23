// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LivePulseCard from "../src/components/LivePulseCard";
import ENRICHED_CATALOG from "../data/enriched_catalog.json";

const BRAND_LOGOS: Record<string, string> = {
  "The Whole Truth": "https://miro.medium.com/v2/resize:fit:720/format:webp/1*rM8a2mpgfcZc4WtiHJYC0A.png",
  "Minimalist": "https://media.licdn.com/dms/image/v2/C4D0BAQGEeX1h2U7TwQ/company-logo_200_200/company-logo_200_200/0/1646895741612/beminimalist_logo?e=1773273600&v=beta&t=nMyqQ-FzZJtt9HfVEdLpi9Os7txGkLB92DQYz5TA_0Q",
  "What's Up Wellness": "https://whatsupwellness.in/cdn/shop/files/rectangle_WUW_logo1x_120x.svg?v=1708696270",
  "Kapiva": "https://bazaar5.com/image/catalog/pro/category/100631.jpg",
  "Sleepy Owl": "https://cdn.prod.website-files.com/6502a82cff431778b5d82829/65151ac6741ed951a4d6c965_Sleepy-Owl-unit-Wide-2__FitMaxWzQwMCw0MDBd.png",
  "Titan": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Titan_Company_Logo.jpg",
  "Nothing": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nothing_Logo.svg",
  "Blue Tokai": "https://bluetokaicoffee.com/cdn/shop/files/BT_Logo_200x.png?v=1614332927",
  "Snitch": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Nothing_Logo.svg"
};

const MASTER_CATALOG = [
  {
    name: "Protein Shake",
    brand: "The Whole Truth",
    price: 1499,
    mrp: 1799,
    rating: 4.6,
    low: true,
    lastPurchased: 12,
    consumptionCycle: 15,
    inventory: { "Prestige Koramangala": 3, "Brigade Indiranagar": 0, "Sobha HSR": 12 },
    image_url: "https://www.jiomart.com/images/product/original/rvekvhwpxb/the-whole-truth_light-cocoa-whey-protein-isolate-concentrate-24g-protein-product-images-orvekvhwpxb-p606367622-0-202311282004.jpg?im=Resize=(420,420)"
  },
  {
    name: "Energy Bars (Pack of 6)",
    brand: "The Whole Truth",
    price: 599,
    mrp: 699,
    rating: 4.8,
    low: false,
    lastPurchased: 5,
    consumptionCycle: 20,
    inventory: { "Prestige Koramangala": 15, "Brigade Indiranagar": 8, "Sobha HSR": 0 },
    image_url: "https://www.bbassets.com/media/uploads/p/l/40201406_10-the-whole-truth-protein-bars-all-in-one.jpg"
  },
  {
    name: "Plant Protein Isolate",
    brand: "The Whole Truth",
    price: 1899,
    mrp: 2099,
    rating: 4.5,
    low: false,
    lastPurchased: 6,
    consumptionCycle: 30,
    inventory: { "Prestige Koramangala": 0, "Brigade Indiranagar": 5, "Sobha HSR": 2 },
    image_url: "https://media.thewholetruthfoods.com/public/backend-assets/01K13EVF2K7B4CZ6BDHWPSCPTZ.png"
  },
  {
    name: "Vitamin C Serum",
    brand: "Minimalist",
    price: 699,
    mrp: 799,
    rating: 4.7,
    low: true,
    lastPurchased: 28,
    consumptionCycle: 30,
    inventory: { "Prestige Koramangala": 5, "Brigade Indiranagar": 1, "Sobha HSR": 0 },
    image_url: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000008_a.jpg?tr=w-344,h-344,cm-pad_resize"
  },
  {
    name: "Face Wash",
    brand: "Minimalist",
    price: 399,
    mrp: 499,
    rating: 4.4,
    low: false,
    lastPurchased: 10,
    consumptionCycle: 45,
    inventory: { "Prestige Koramangala": 0, "Brigade Indiranagar": 12, "Sobha HSR": 8 },
    image_url: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000041_a.jpg?tr=w-344,h-344,cm-pad_resize"
  },
  {
    name: "Ashwagandha Gummies",
    brand: "What's Up Wellness",
    price: 899,
    mrp: 999,
    rating: 4.5,
    low: true,
    lastPurchased: 25,
    consumptionCycle: 30,
    inventory: { "Prestige Koramangala": 0, "Brigade Indiranagar": 4, "Sobha HSR": 10 },
    image_url: "https://whatsupwellness.in/cdn/shop/files/stress_51da983c-837f-429d-b235-fb15692d44c0.png?v=1769849561&width=640"
  },
  {
    name: "Amla Juice (1L)",
    brand: "Kapiva",
    price: 349,
    mrp: 399,
    rating: 4.3,
    low: false,
    lastPurchased: 12,
    consumptionCycle: 20,
    inventory: { "Prestige Koramangala": 8, "Brigade Indiranagar": 0, "Sobha HSR": 6 },
    image_url: "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1200-1200,pr-true,f-auto,,q-40,dpr-2/cms/product_variant/e24d3023-db58-49b0-b0c5-20dd428e54f6/Kapiva-Wild-Amla-Juice.jpeg"
  },
  {
    name: "Biotin Gummies",
    brand: "What's Up Wellness",
    price: 799,
    mrp: 899,
    rating: 4.6,
    low: false,
    lastPurchased: 5,
    consumptionCycle: 30,
    inventory: { "Prestige Koramangala": 10, "Brigade Indiranagar": 5, "Sobha HSR": 2 },
    image_url: "https://m.media-amazon.com/images/I/513MzZFVmoL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    name: "Cold Brew Cans",
    brand: "Blue Tokai",
    price: 750,
    mrp: 900,
    rating: 4.9,
    low: false,
    lastPurchased: 8,
    consumptionCycle: 14,
    inventory: { "Prestige Koramangala": 12, "Brigade Indiranagar": 20, "Sobha HSR": 5 },
    image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba9?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Oversized Classic T-Shirt",
    brand: "Snitch",
    price: 1158,
    mrp: 1499,
    rating: 4.4,
    low: false,
    lastPurchased: 0,
    consumptionCycle: 0,
    inventory: { "Prestige Koramangala": 8, "Brigade Indiranagar": 2, "Sobha HSR": 4 },
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Titan Smart 3 Premium",
    brand: "Titan",
    price: 4995,
    mrp: 7995,
    rating: 4.8,
    low: true,
    lastPurchased: 0,
    consumptionCycle: 0,
    inventory: { "Prestige Koramangala": 1, "Brigade Indiranagar": 2, "Sobha HSR": 0 },
    image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Nothing Ear (2)",
    brand: "Nothing",
    price: 8999,
    mrp: 12999,
    rating: 4.9,
    low: false,
    lastPurchased: 0,
    consumptionCycle: 0,
    inventory: { "Prestige Koramangala": 0, "Brigade Indiranagar": 1, "Sobha HSR": 1 },
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80"
  }
];

// MOBILE UX CONSTANTS
const QUICK_CATEGORIES = [
  { name: "Electronics", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80" },
  { name: "Beauty", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54c28?auto=format&fit=crop&w=150&q=80" },
  { name: "Home", img: "https://images.unsplash.com/photo-1618220179428-22790b46a013?auto=format&fit=crop&w=150&q=80" },
  { name: "Health", img: "https://images.unsplash.com/photo-1584308666744-24d5e4a053de?auto=format&fit=crop&w=150&q=80" },
  { name: "Snacks", img: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=150&q=80" },
  { name: "Wellness", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80" },
];

const HERO_BANNERS = [
  { brand: "Minimalist", title: "Glow Up Sale", subtitle: "Flat 20% on Serums", label: "Brand Days", video: "https://cdn.pixabay.com/video/2016/08/22/4741-180879650_tiny.mp4" },
  { brand: "The Whole Truth", title: "Clean Protein", subtitle: "Zero Added Sugar", label: "New Launch", video: "https://cdn.pixabay.com/video/2019/11/05/28766-372134548_tiny.mp4" },
  { brand: "What's Up Wellness", title: "Sleep Gummies", subtitle: "Buy 1 Get 1 Free", label: "Flash Deal", video: "https://cdn.pixabay.com/video/2021/04/09/70417-535359489_tiny.mp4" },
  // 60‑min Sovereign Fulfillment banner with lightning bolt
  { brand: "Sovereign", title: "60 min Fulfillment", subtitle: "Lightning fast delivery", label: "⚡", video: "https://cdn.pixabay.com/video/2020/01/01/12345-123456789_tiny.mp4" }
];

// LIVE AGENTIC DROP DATA CYCLES
const AGENTIC_DROPS = [
  {
    name: "Titan Smart 3 Premium",
    startPrice: 4995,
    floor: 3995,
    mrp: 7995,
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Nothing Ear (2)",
    startPrice: 8999,
    floor: 7500,
    mrp: 12999,
    img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Oversized Classic T-Shirt",
    startPrice: 1158,
    floor: 850,
    mrp: 1499,
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"
  }
];

const generateNodeItems = (nodeName: string) => {
  return MASTER_CATALOG.map(item => {
    // Find matching enriched data by name
    const enrichedData = ENRICHED_CATALOG.find(e => e.name === item.name);

    // Check if inventory data exists for this node
    let stock = 0;
    if (item.inventory && nodeName in item.inventory) {
      stock = item.inventory[nodeName as keyof typeof item.inventory];
    }

    return {
      ...item,
      id: enrichedData?.id || undefined,
      ai_intent_layers: enrichedData?.ai_intent_layers || null,
      stock: stock,
      localAvailable: stock > 0,
      refillInDays: stock === 0 ? 1 : 0,
      brandDeliveryDays: stock === 0 ? 3 : 0,
    };
  });
};

export default function Home({ searchParams }: { searchParams?: { preview?: string } }) {
  const isPreviewRenderer = searchParams?.preview === "1";
  const router = useRouter();
  const [products, setProducts] = useState(MASTER_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");
  const [activeTab, setActiveTab] = useState("Home");

  // UNIFIED LOCATION STATE
  const [selectedNode, setSelectedNode] = useState("Prestige Koramangala");
  const [nodeOpen, setNodeOpen] = useState(false);

  // ACCOUNT DROPDOWN STATE
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountHover, setAccountHover] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [zoneOrders, setZoneOrders] = useState(12);
  const [aiMode, setAiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{ name: string; price: number; quantity: number }[]>([]);
  const [intent, setIntent] = useState<"product" | "question" | "compare" | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<0 | 1 | 2 | 3>(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [battleStep, setBattleStep] = useState(0);
  const [battleAnswer, setBattleAnswer] = useState<boolean | null>(null);

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
  }, [agenticIndex]);

  // Auto-close the cart drawer if the user removes the last item
  useEffect(() => {
    if (cartCount === 0 && cartOpen) {
      setCartOpen(false);
      setTimeout(() => setCheckoutStep(0), 300);
    }
  }, [cartCount, cartOpen]);

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

  // Click outside listener for Node and Account dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setNodeOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    "Prestige Koramangala": { nearestDistanceKm: 1.2, brandsInZone: 42, highDemandBrands: 18, demandBrands: ["Minimalist", "The Whole Truth", "What's Up Wellness", "Kapiva"] },
    "Brigade Indiranagar": { nearestDistanceKm: 0.8, brandsInZone: 38, highDemandBrands: 24, demandBrands: ["What's Up Wellness", "Minimalist", "Blue Tokai", "The Whole Truth"] },
    "Sobha HSR": { nearestDistanceKm: 1.6, brandsInZone: 46, highDemandBrands: 12, demandBrands: ["Blue Tokai", "The Whole Truth", "Minimalist", "What's Up Wellness"] },
  } as const;

  const currentNode = NODE_DATA[selectedNode as keyof typeof NODE_DATA];

  const [userItems, setUserItems] = useState(() => generateNodeItems("Prestige Koramangala"));

  const scoredItems = userItems.map((item) => {
    let score = item.rating * 10;
    if (item.stock <= 3) score += 15;
    if (item.low) score += 20;
    if (intent === "product" && searchQuery && item.name.toLowerCase().includes(searchQuery.toLowerCase())) score += 30;
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);

  const hasRunningLow = userItems.some((item) => item.lastPurchased >= item.consumptionCycle - 3);

  const handleNodeChange = (node: string) => {
    if (node === selectedNode) return;
    setNodeOpen(false);
    setIsTransitioning(true);
    setCartItems([]);
    setCartCount(0);
    setAddedItem(null);
    setCartOpen(false);
    setCheckoutStep(0);
    setTimeout(() => {
      setSelectedNode(node);
      setUserItems(generateNodeItems(node));
      setIsTransitioning(false);
    }, 200);
  };

  const handleDecrease = (itemName: string) => {
    setCartItems((prev) => prev.map((item) => item.name === itemName ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
    setCartCount((prev) => Math.max(prev - 1, 0));
    setUserItems((prevItems) => prevItems.map((item) => item.name === itemName && item.localAvailable ? { ...item, stock: item.stock + 1 } : item));
  };

  const handleRemoveItem = (itemName: string) => {
    const itemToRemove = cartItems.find((i) => i.name === itemName);
    if (!itemToRemove) return;
    setCartCount((prev) => Math.max(prev - itemToRemove.quantity, 0));
    setCartItems((prev) => prev.filter((item) => item.name !== itemName));
    setUserItems((prevItems) => prevItems.map((item) => item.name === itemName && item.localAvailable ? { ...item, stock: item.stock + itemToRemove.quantity } : item));
  };

  const handleAddToCart = (productOrName: any, customPrice: number | null = null) => {
    const product = typeof productOrName === 'string'
      ? userItems.find(p => p.name === productOrName) || products.find(p => p.name === productOrName)
      : productOrName;
    if (!product) return;

    setAddedItem(product.name);
    setCartOpen(false); // Show the mini-cart strip, not full drawer
    setCartCount((prev) => prev + 1);
    setCartItems((prev) => {
      const existing = prev.find((item) => (product.id && item.id === product.id) || (item.name === product.name));
      if (existing) {
        return prev.map((item) => (product.id && item.id === product.id) || (item.name === product.name) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, price: customPrice || product.price }];
    });
    setTimeout(() => setAddedItem(null), 2000);
  };

  const placeOrder = async () => {
    setIsLoading(true);

    // Generate Unique Order ID
    const generatedId = `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    setOrderId(generatedId);

    try {
      const response = await fetch('https://dash24-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item: any) => ({ product_id: item.id || 1, quantity: item.quantity })),
          total_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }),
      });
      if (response.ok) setCheckoutStep(3);
      else setCheckoutStep(3);
    } catch (error) {
      setCheckoutStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAddSimulation = () => {
    const itemToReadd = cartItems[0]?.name;
    setCartItems([]);
    setCartCount(0);
    setAddedItem(null);
    setCartOpen(false);
    setTimeout(() => setCheckoutStep(0), 300);
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

  const localCartTotal = cartItems.filter((item) => userItems.find((u) => u.name === item.name)?.localAvailable).reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeDeliveryThreshold = 1999;
  const amountRemaining = Math.max(0, freeDeliveryThreshold - localCartTotal);
  const progressPercentage = Math.min((localCartTotal / freeDeliveryThreshold) * 100, 100);

  const localSubtotal = cartItems.filter((item) => userItems.find((u) => u.name === item.name)?.localAvailable).reduce((acc, item) => acc + item.price * item.quantity, 0);
  const brandSubtotal = cartItems.filter((item) => !userItems.find((u) => u.name === item.name)?.localAvailable).reduce((acc, item) => acc + item.price * item.quantity, 0);
  const localShipping = localSubtotal > 0 && localSubtotal < 1999 ? 50 : 0;
  const brandShipping = brandSubtotal > 0 && brandSubtotal < 499 ? 50 : 0;
  const subtotal = localSubtotal + brandSubtotal;
  const total = subtotal + localShipping + brandShipping;

  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
  };
  const dash24DeliveryTime = getDeliveryTime();

  const getBrandDeliveryDate = () => {
    const maxBrandDays = cartItems.reduce((max, item) => {
      const product = userItems.find((u) => u.name === item.name);
      if (!product || product.localAvailable) return max;
      return Math.max(max, product.brandDeliveryDays || 0);
    }, 0);
    if (maxBrandDays === 0) return null;
    const future = new Date();
    future.setDate(future.getDate() + maxBrandDays);
    return future.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };
  const brandDeliveryDate = getBrandDeliveryDate();

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
        <div className="min-h-screen bg-[#111827] flex items-center justify-center p-8 relative">
          <button
            onClick={() => setIsMobilePreview(false)}
            className="fixed left-6 top-6 z-[150] bg-white text-gray-900 px-6 py-3 rounded-full shadow-2xl font-bold items-center gap-3 hover:-translate-y-1 transition transform"
          >
            📱 Exit Mobile Preview
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
          className="hidden md:flex fixed left-6 top-6 z-[150] bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl font-bold items-center gap-3 hover:-translate-y-1 transition transform"
        >
          📱 Switch to Mobile Preview
        </button>
      )}

      {/* Global Wrapper for the Application Background & Mobile Clamp */}
      <div
        className={`min-h-screen bg-[#F8FAFC] text-gray-900 pb-24 selection:bg-orange-200 selection:text-orange-900 overflow-x-hidden ${isPreviewRenderer ? "bg-white pb-32" : ""}`}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const delta = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(delta) > 50) {
            const tabs = ["Home", "Brands", "Arcade", "Track"];
            const currentIdx = tabs.indexOf(activeTab);
            const nextIdx = delta < 0 ? (currentIdx + 1) % tabs.length : (currentIdx - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[nextIdx]);
          }
        }}
      >
        {/* ========================================================= */}
        {/* 1. SINGLE SOURCE LOCATION & TIGHT NAVBAR HEADER             */}
        {/* 2. THE TOP BAR (Location & Wallet) */}
        <header className="hidden md:block sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">

            {/* Left: Favicon & Navigation */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="w-auto h-10 px-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <img src="/logo.png?v=2" alt="Dash24" className="h-6 w-auto object-contain drop-shadow-sm" />
              </div>
              <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-gray-700">
                {["Home", "Brands", "Arcade", "Track"].map(tab => (
                  tab === "Brands" ? (
                    <div className="relative group hover:pt-2 hover:-mt-2" key={tab}>
                      <Link
                        href="/brands"
                        className={`cursor-pointer transition pb-1 border-b-2 border-transparent hover:border-[#F97316] hover:text-[#F97316]`}
                      >
                        {tab}
                      </Link>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50 p-2">
                        {Object.keys(BRAND_LOGOS).map(brand => (
                          <Link href="/brands" key={brand} className="block px-4 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#F97316] cursor-pointer rounded-lg font-medium">
                            {brand}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer transition pb-1 border-b-2 ${activeTab === tab ? "border-[#F97316] text-[#F97316]" : "border-transparent hover:border-[#F97316] hover:text-[#F97316]"}`}
                    >
                      {tab}
                    </span>
                  )
                ))}
              </nav>
            </div>

            {/* Center: Search (Expands to full mobile overlay) */}
            <div className={`flex-1 max-w-xl flex justify-center relative ${searchFocused ? 'max-md:fixed max-md:inset-0 max-md:z-[100] max-md:bg-white max-md:p-4 max-md:flex-col max-md:justify-start max-md:max-w-none max-md:pt-12' : ''}`}>
              {searchFocused && (
                <div className="hidden max-md:flex justify-between items-center w-full mb-6 relative">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Search</h2>
                  <button onClick={() => setSearchFocused(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 absolute right-0">✕</button>
                </div>
              )}
              <div
                className={`flex items-center bg-[#F1F5F9] rounded-full px-5 py-2.5 transition-all w-full md:mt-0 ${searchFocused ? 'ring-2 ring-blue-500/20 bg-white shadow-sm max-md:bg-gray-100 max-md:py-4 max-md:shadow-none' : 'max-md:mt-4 max-md:mx-4'
                  }`}
              >
                <span className="text-gray-400 mr-3 text-sm">🔍</span>
                <input
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    classifyIntent(e.target.value);
                  }}
                  placeholder="Search D2C brands, or ask AI..."
                  className="w-full bg-transparent text-sm font-medium outline-none placeholder-gray-500"
                />
                {aiMode && (
                  <span className="text-[10px] font-bold bg-[#EEF2FF] text-[#1E3A8A] px-2 py-0.5 rounded-full ml-2">
                    AI
                  </span>
                )}
              </div>

              {/* AI DROPDOWN / FULL SCREEN RESULTS */}
              {searchFocused && (
                <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-md:static max-md:shadow-none max-md:border-none max-md:mt-6">

                  {/* Intent Chips (Mobile Default View) */}
                  {searchQuery.length <= 2 && (
                    <div className="hidden max-md:block p-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trending Intents</p>
                      <div className="flex flex-wrap gap-2">
                        {["For Acidity", "Post-Gym Recovery", "Healthy Snacks", "High Protein", "Hydration"].map((chip) => (
                          <button key={chip} onClick={() => setSearchQuery(chip)} className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap active:bg-blue-100">{chip}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery.length > 2 && aiMode && (
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse text-[#1E3A8A]">✨</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          Live {selectedNode} Inventory
                        </span>
                      </div>
                      {detectedCategory && (
                        <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded font-bold text-gray-600">
                          {detectedCategory}
                        </span>
                      )}
                    </div>
                  )}

                  {searchQuery.length > 2 && (
                    <div className="p-4">
                      {intent === "product" && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          Press enter to search marketplace for <span className="font-bold text-gray-900">"{searchQuery}"</span>
                        </p>
                      )}
                      {intent === "question" && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended locally</p>
                          <div className="flex items-center gap-4 p-4 bg-[#EEF2FF]/50 rounded-xl border border-[#1E3A8A]/10 hover:bg-[#EEF2FF] transition cursor-pointer">
                            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center text-xl">
                              {detectedCategory === "Coffee" ? "☕" : "💪"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {detectedCategory === "Coffee" ? "Cold Brew Cans" : "Protein Shake"}
                              </p>
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Highest reorder rate nearby</p>
                            </div>
                            <button onClick={() => handleAddToCart(detectedCategory === "Coffee" ? "Cold Brew Cans" : "Protein Shake")} className="ml-auto text-xs font-bold bg-[#1E3A8A] text-white px-4 py-2 rounded-xl">Add</button>
                          </div>
                        </div>
                      )}
                      {intent === "compare" && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Metric Comparison</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                              <p className="text-sm font-bold mb-1 text-gray-900">Brand A</p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">High Availability</p>
                              <p className="text-xs text-gray-500 font-medium">68% Reorder Rate</p>
                            </div>
                            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                              <p className="text-sm font-bold mb-1 text-gray-900">Brand B</p>
                              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">Low Stock Warning</p>
                              <p className="text-xs text-gray-500 font-medium">61% Reorder Rate</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Society Stash, Account & Cart */}
            <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">

              {/* Society Stash */}
              <div className="group relative cursor-pointer flex items-center gap-4 hover:opacity-90 transition">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest block mb-0.5">
                    Society Stash
                  </span>
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                    42 / 50 Orders
                  </span>
                </div>
                <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden relative">
                  <div className="bg-orange-500 h-full w-[84%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute top-full right-0 mt-4 w-64 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <div className="absolute -top-2 right-12 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100"></div>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed relative z-10">
                    <span className="text-xl mb-2 block">🎉</span>
                    Hit 50 to unlock <span className="font-bold text-orange-500">15% off any product</span> (Up to ₹500) for everyone in {selectedNode}.
                  </p>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              <div className="flex items-center space-x-4">
                {/* Account Icon */}
                <div
                  className="relative cursor-pointer"
                  ref={accountRef}
                  onMouseEnter={() => setAccountHover(true)}
                  onMouseLeave={() => setAccountHover(false)}
                >
                  <button onClick={() => setAccountOpen(!accountOpen)} className="w-10 h-10 bg-blue-50 text-blue-700 flex items-center justify-center rounded-full font-bold transition hover:bg-blue-100 border border-blue-100">
                    K
                  </button>
                  {/* Account Hover State */}
                  {accountHover && !accountOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 text-white p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Last Order</p>
                      <p className="text-xs font-bold truncate">Minimalist Face Wash</p>
                      <p className="text-[10px] text-gray-400 mt-1">Delivered 2 days ago</p>
                    </div>
                  )}
                  {/* Account Click Dropdown */}
                  {accountOpen && (
                    <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden text-sm">
                      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="font-bold text-gray-900 text-base">Kunal Kumar</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1">Dash24 Insider</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition">My Orders</button>
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition">Payment Modes</button>
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition">Saved Addresses</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Icon */}
                <div
                  onClick={() => setCartOpen(true)}
                  className="relative cursor-pointer hover:scale-105 transition"
                >
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-base border border-orange-100">
                    🛒
                  </div>
                  {cartCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white">
                      {cartCount}
                    </div>
                  )}
                </div>

                {/* Pulse Points Icon */}
                <div className="flex flex-col items-center ml-2">
                  <span className="text-sm shadow-sm leading-none bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center border border-blue-100 cursor-pointer hover:scale-105 transition">✨</span>
                  <span className="absolute -bottom-4 text-[8px] font-bold uppercase text-blue-600 whitespace-nowrap">450 pts</span>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* ========================================================= */}
        {/* X. MOBILE HERO BANNER (Amazon-style entry point)          */}
        {/* ========================================================= */}
        {/* NEW COMPACT MOBILE HEADER (Visible Only on Mobile)        */}
        {/* ========================================================= */}
        <div className="md:hidden w-full px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
          {/* Left side: Greeting + Location */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-gray-900 text-sm">{greeting}, Kunal</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.6)] flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider leading-none drop-shadow-md">60Mins</span>
              </div>
              <div className="relative inline-block w-max" ref={nodeRef}>
                <button onClick={() => setNodeOpen(!nodeOpen)} className="flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 transition">
                  <span className="text-[10px] uppercase tracking-widest leading-tight">Delivering to {selectedNode} ▼</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right side: Cart & Pulse Points */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <div onClick={() => setCartOpen(true)} className="relative cursor-pointer transition">
              <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-full text-base border border-orange-100">🛒</div>
              {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                  {cartCount}
                </div>
              )}
            </div>

            {/* Pulse Points */}
            <div className="flex flex-col items-center relative">
              <span className="text-sm shadow-sm leading-none bg-blue-50 w-9 h-9 rounded-full flex items-center justify-center border border-blue-100 cursor-pointer">✨</span>
              <span className="absolute -bottom-3 text-[8px] font-bold uppercase text-blue-600">450 pts</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE ALIGNED CONTENT (Quick Clicks & Hero move here)    */}
        {/* ========================================================= */}
        <div className="md:hidden px-4 pt-4 relative z-0">
          {/* --- QUICK CLICK CATEGORIES --- */}
          <div className="w-full overflow-x-auto hide-scrollbar mb-4 -mx-4 px-4 pb-2">
            <div className="flex gap-4 w-max">
              {QUICK_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 p-0.5 bg-white group-active:scale-95 transition-transform">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover rounded-[14px]" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 text-center w-16 leading-tight break-words">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- DYNAMIC HERO BANNER --- */}
          <div className="-mx-4 w-[calc(100%+32px)] h-[150px] rounded-[24px] overflow-hidden relative mb-2 shadow-lg border border-gray-100/50 group cursor-pointer bg-white">
            {HERO_BANNERS.map((banner, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <video src={banner.video} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-black opacity-90 -z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">{banner.label}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 drop-shadow-md">{banner.brand}</span>
                  </div>
                  <h3 className="text-white font-black text-[22px] leading-tight mb-0.5 drop-shadow-lg">{banner.title}</h3>
                  <p className="text-gray-200 text-[10px] uppercase tracking-wider font-bold w-2/3 mb-1">{banner.subtitle}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] bg-white/10 w-max px-3 py-1.5 rounded-full text-white font-bold uppercase tracking-widest group-active:translate-x-2 transition-transform shadow-sm">
                    Shop Now <span className="text-blue-400">→</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {HERO_BANNERS.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === heroIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Legacy "Cashback Everytime" - HIDDEN ON MOBILE */}
        <div className="hidden md:block w-full px-4 mt-2">
          <div className="w-full h-[180px] rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 group">
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10 flex flex-col justify-center p-6 text-white">
              <h3 className="text-xl font-black mb-1 leading-snug tracking-tight uppercase">Cashback<br />Everytime</h3>
              <p className="text-xs font-bold text-yellow-400 mb-3 tracking-widest uppercase">Zero Platform Fee</p>
              <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full w-max shadow-md hover:scale-105 transition-transform">
                Explore Deals
              </button>
            </div>
            {/* Using a solid bright generic promotional image */}
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80" alt="Promotional Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto md:px-6 py-6 max-md:pt-2">
          <div className="bg-white md:rounded-[32px] md:shadow-sm md:border md:border-gray-100 overflow-hidden">

            {/* ========================================================= */}
            {/* 2. HERO SECTION / DESKTOP TRACKING BLOCK                  */}
            {/* ========================================================= */}
            <div className="hidden md:flex bg-gradient-to-br from-[#111827] via-gray-900 to-[#1e293b] px-10 py-8 relative overflow-hidden rounded-[24px] m-6 border border-gray-800 shadow-xl items-stretch justify-between gap-8">
              {/* Subtle background texture */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>

              {/* Left Side: Tight Greeting (30% width) */}
              <div className="w-[40%] relative z-10 flex flex-col justify-center">

                {/* 60 min Sovereign Fulfillment Tag (With dot on right) */}
                <div className="flex flex-col mb-6 w-max">
                  <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-black tracking-tight text-yellow-500 drop-shadow-lg leading-none">
                      60 min
                    </h1>
                    <span className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]"></span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-yellow-400 drop-shadow-md leading-tight mt-2">
                    Sovereign Fulfillment
                  </h2>
                </div>

                {/* Greeting (Made larger again) */}
                <h2 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                  {greeting}, Kunal.
                </h2>

                {/* Location Selector (Made smaller again) */}
                <div className="relative inline-block w-max" ref={nodeRef}>
                  <button
                    onClick={() => setNodeOpen(!nodeOpen)}
                    className="flex items-center gap-2 font-bold text-gray-400 hover:text-yellow-400 transition"
                  >
                    <span className="text-sm">📍</span>
                    <span className="text-xs uppercase tracking-widest leading-tight">Delivering to {selectedNode} ▼</span>
                  </button>
                  {nodeOpen && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-900 border-t-4 border-t-yellow-400">
                      {Object.keys(NODE_DATA).map((node) => (
                        <div
                          key={node}
                          onClick={() => handleNodeChange(node)}
                          className={`px-5 py-4 text-sm cursor-pointer border-b border-gray-50 transition ${selectedNode === node
                            ? 'bg-yellow-50 font-bold text-yellow-600'
                            : 'hover:bg-gray-50 text-gray-700 font-medium'
                            }`}
                        >
                          {node}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px bg-gray-700/50 my-2 hidden md:block relative z-10"></div>

              {/* Right Side: Track Order / T20 WC (60% width) */}
              <div className="flex-1 flex gap-4 relative z-10">
                {/* Last Order Track View Box */}
                <div className="flex-1 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg flex flex-col justify-between shadow-inner hover:bg-white/10 transition cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live Order Track</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium font-mono border border-gray-700 px-2 py-0.5 rounded-full">ID: {orderId || 'ORD-K9F2A'}</span>
                  </div>

                  {/* Tracking Progress Bar */}
                  <div className="flex items-center justify-between relative mt-4 mb-6 px-1 lg:px-4 flex-1">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-700 -translate-y-1/2"></div>
                    {/* Active Progress */}
                    <div className="absolute top-1/2 left-4 w-[60%] h-0.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] -translate-y-1/2 transition-all duration-1000"></div>

                    {/* Step 1: Ordered */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                        <span className="text-[10px] text-white font-black">✓</span>
                      </div>
                      <span className="text-[9px] text-white font-bold opacity-100 absolute -bottom-5">Ordered</span>
                    </div>

                    {/* Step 2: Packed */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                        <span className="text-[10px] text-white font-black">✓</span>
                      </div>
                      <span className="text-[9px] text-white font-bold opacity-100 absolute -bottom-5">Packed</span>
                    </div>

                    {/* Step 3: Out for Delivery */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-400 ring-4 ring-green-400/20 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,1)] animate-bounce relative z-20">
                        <span className="text-[12px]">🛵</span>
                      </div>
                      <span className="text-[10px] text-green-400 font-bold max-w-[50px] text-center leading-tight absolute -bottom-8 uppercase tracking-wider">Out for Delivery</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center"></div>
                      <span className="text-[9px] text-gray-500 font-bold absolute -bottom-5">Delivered</span>
                    </div>
                  </div>

                  <p className="text-sm text-center text-green-400 font-bold tracking-tight bg-green-400/10 py-2 rounded-xl border border-green-400/20 mt-4 group-hover:bg-green-400/20 transition">Arriving in <span className="text-white text-lg">14 mins</span></p>
                </div>

                {/* T20 World Cup Match Widget */}
                <div className="w-1/3 p-5 rounded-3xl bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e1b4b] border border-blue-500/30 backdrop-blur-md flex flex-col justify-center items-center text-center shadow-[inset_0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden group hover:border-blue-500/60 transition">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 group-hover:opacity-20 transition duration-500"></div>

                  <div className="w-16 h-16 mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 p-2 relative shadow-inner group-hover:scale-110 transition duration-500 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80" alt="T20 World Cup" className="w-full h-full object-cover filter drop-shadow-md z-10 rounded-xl" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse"></div>
                  </div>

                  <h3 className="text-[11px] font-black text-white mb-1.5 uppercase tracking-widest leading-tight w-full truncate">WC 26: Super 8</h3>

                  <div className="bg-blue-900/40 border border-blue-500/30 px-3 py-1.5 rounded-lg w-full mb-1 flex justify-between items-center gap-2">
                    <span className="text-[11px] text-white font-bold tracking-wider">ZIM</span>
                    <span className="text-[8px] text-blue-300 font-black italic">vs</span>
                    <span className="text-[11px] text-white font-bold tracking-wider">WI</span>
                  </div>

                  <p className="text-[9px] text-blue-300 uppercase tracking-widest font-bold mt-1">Upcoming • 7:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. FLOATING INSIGHT                                       */}
          {/* ========================================================= */}
          <div className="mx-4 md:mx-10 mt-6 mb-2">
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sm shrink-0">💡</div>
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-bold text-blue-900 truncate uppercase tracking-widest leading-none mb-1">Neighbourhood Insight</p>
                  <p className="text-[10px] font-medium text-blue-800/80 truncate leading-none">Demand velocity is up 18% locally today.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. CONTENT & HORIZONTAL SCROLL                            */}
          {/* ========================================================= */}
          <div className={`px-4 md:px-10 py-6 md:py-8 space-y-10 md:space-y-14 transition-opacity duration-200 ${isTransitioning ? "opacity-60" : "opacity-100"}`}>



            {/* REORDER / FOR YOU (Horizontal Scroll) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">🛒 For You</h2>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Based on order history</span>
              </div>

              {/* Mobile Feed (Densified 3x2 Horizontal Scroll Grid) */}
              <div className="grid grid-rows-2 grid-flow-col gap-3 md:hidden overflow-x-auto snap-x hide-scrollbar pb-2">
                {scoredItems.filter((item) => intent === "product" && searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true).map((item) => {
                  return (
                    <div
                      key={item.name}
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="cursor-pointer bg-white border border-gray-100/60 rounded-2xl p-3 flex flex-col relative shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-full h-28 mb-3 flex items-center justify-center relative p-1 mix-blend-multiply">
                        {item.localAvailable && item.low && <span className="absolute top-0 right-0 text-[9px] bg-orange-50/80 text-orange-600 px-1.5 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-sm border border-orange-100/50">Low Stock</span>}
                        <span className="absolute top-0 left-0 md:hidden bg-yellow-400 text-yellow-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-yellow-600 animate-pulse"></span>60Mins</span>
                        <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-contain drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-800 leading-snug mb-1 line-clamp-2 min-h-[32px] px-1">{item.name}</p>
                      <div className="flex items-end justify-between mt-auto px-1">
                        <div className="flex flex-col">
                          {item.mrp > item.price && <span className="text-[9px] text-gray-400 line-through leading-none mb-0.5">₹{item.mrp}</span>}
                          <span className="text-sm font-black text-gray-900 leading-none">₹{item.price}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item.name); }} className="w-8 h-8 flex items-center justify-center bg-[#111827] hover:bg-blue-600 text-white rounded-full transition shadow-md active:scale-95 flex-shrink-0">
                          <span className="text-lg leading-none">+</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Snap Scroll */}
              <div className="hidden md:flex md:gap-5 md:overflow-x-auto md:pb-6 md:snap-x hide-scrollbar">
                {scoredItems.filter((item) => intent === "product" && searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true).map((item) => {
                  return (
                    <div key={item.name} className="md:snap-start md:flex-shrink-0 md:w-[260px] w-full">
                      <LivePulseCard product={item} handleAddToCart={() => handleAddToCart(item)} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* THE PULSE MATRIX (Now rendered inline for Continuous Scroll) */}
            {/* ========================================================= */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">⚡ The Pulse Matrix</h2>
                <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Live Operations</span>
              </div>

              {/* Pulse matrix uses flex scroll on mobile, grid on desktop */}
              <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 hide-scrollbar pb-4 md:pb-0 snap-x">

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">

                  {/* Block 1: Agentic Drop (Compact & Vertical) */}
                  <div className="bg-gradient-to-br from-red-950 via-red-900 to-[#111827] rounded-[20px] md:rounded-[32px] p-4 md:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-red-500/30 group hover:border-red-500/60 transition-colors">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

                    <div className="relative z-10 flex flex-col items-center text-center h-full">
                      <div className="w-full flex justify-between items-center mb-3 md:mb-4">
                        <span className="text-[8px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0"></span> Drop
                        </span>
                        <span className="text-[9px] md:text-[10px] bg-red-600 text-white px-2 md:px-2.5 py-0.5 md:py-1 rounded-md font-mono font-bold shadow-sm">
                          00:{agenticSecondsLeft < 10 ? `0${agenticSecondsLeft}` : agenticSecondsLeft}
                        </span>
                      </div>

                      <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-2xl overflow-hidden p-2 shadow-lg mb-3 md:mb-4 group-hover:scale-105 transition-transform duration-500">
                        <img src={AGENTIC_DROPS[agenticIndex].img} alt="Drop Item" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>

                      <p className="text-[11px] md:text-sm text-gray-200 font-bold mb-1 truncate w-full px-1 md:px-2">{AGENTIC_DROPS[agenticIndex].name}</p>

                      <div className="font-mono text-xl md:text-3xl text-white font-black flex items-baseline gap-1 md:gap-2 mb-3 md:mb-6">
                        <span className="text-red-400 font-sans tracking-tighter">₹{agenticPrice}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(AGENTIC_DROPS[agenticIndex].name, agenticPrice)}
                        className="bg-red-600 text-white w-full py-2.5 md:py-3.5 rounded-xl text-xs md:text-sm font-bold hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-1 mt-auto"
                      >
                        Lock
                      </button>
                    </div>
                  </div>

                  {/* Block 2: Daily Pulse Match */}
                  <div className="bg-[#111827] rounded-[20px] md:rounded-[32px] p-5 md:p-8 border border-gray-800 shadow-xl flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
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

                  {/* Block 3: The Sunday Vault (hidden on mobile to keep grid even, or span 2 cols) */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-[20px] md:rounded-[32px] p-5 md:p-8 border border-gray-700 relative overflow-hidden flex flex-col justify-between shadow-xl col-span-2 lg:col-span-1">
                    <div className="absolute -right-6 -bottom-6 opacity-5 text-[140px] leading-none pointer-events-none">🔒</div>
                    <div className="relative z-10">
                      <h2 className="text-[9px] md:text-[11px] font-bold tracking-widest text-gray-400 mb-1 md:mb-2 uppercase">Locked Logistics</h2>
                      <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mb-2 md:mb-3">The Sunday Vault</h1>
                      <p className="text-xs md:text-sm font-medium text-gray-400">Exclusive 1-hour inventory unlocks for VIP tiers.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 mt-4 md:mt-8 relative z-10">
                      <div className="bg-black/50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center flex-1 border border-white/5 shadow-inner backdrop-blur-sm">
                        <span className="block text-xl md:text-3xl font-mono text-white font-black mb-0.5 md:mb-1">48</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Hrs</span>
                      </div>
                      <div className="bg-black/50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center flex-1 border border-white/5 shadow-inner backdrop-blur-sm">
                        <span className="block text-xl md:text-3xl font-mono text-white font-black mb-0.5 md:mb-1">12</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Mins</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Society Stash Gamification (Continuous Scroll) */}
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#111827] rounded-[24px] md:rounded-[32px] p-6 md:p-8 mt-6 text-white shadow-xl border border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-sm">Brand in Focus</span>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">Society Stash</h2>
                  <p className="text-blue-200 font-medium text-sm md:text-base mb-4">50 curated products reserved for the {selectedNode} collective.</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
                  <span className="text-3xl drop-shadow-lg">💎</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-900/50 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mb-1">Total Stash Value</p>
                  <p className="text-xl font-black">₹45,000</p>
                </div>
                <div className="bg-blue-900/50 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mb-1">Extra Discount</p>
                  <p className="text-xl font-black text-yellow-400">Flat 15% Off</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium text-blue-100 flex items-start gap-3">
                <span className="text-lg">🤝</span>
                <p>Because you've purchased from this brand before, you hold early-access rights. Unlock the stash before it opens to the public.</p>
              </div>

              <button className="w-full mt-6 bg-yellow-400 text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/20">
                Unlock Stash
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

              <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x">
                {currentNode.demandBrands.map((brand) => (
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
              </div>
            </div>

            {/* HORIZONTAL HOT DEALS CAROUSEL (Mobile UI Polishing) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">🔥 Hot Deals</h2>
                <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Ending Soon</span>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
                {scoredItems.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="min-w-[160px] max-w-[160px] snap-start bg-white border border-gray-100/60 rounded-2xl p-3 flex flex-col relative shadow-sm">
                    <div className="w-full h-24 mb-3 flex items-center justify-center relative p-1 mix-blend-multiply">
                      <span className="absolute top-0 right-0 lg:hidden bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10">-25%</span>
                      <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-contain drop-shadow-sm" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 leading-snug mb-1 line-clamp-2 min-h-[32px] px-1">{item.name}</p>
                    <div className="flex items-end justify-between mt-auto px-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 line-through leading-none mb-0.5">₹{item.mrp}</span>
                        <span className="text-sm font-black text-gray-900 leading-none">₹{Math.floor(item.price * 0.75)}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item.name); }} className="w-8 h-8 flex items-center justify-center bg-[#111827] text-white rounded-full shadow-md active:scale-95 flex-shrink-0">
                        <span className="text-lg leading-none">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🎮 ARCADE SECTION — Full Gaming Hub                       */}
      {/* ========================================================= */}
      <div className="px-4 md:px-10 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">🎮 Dash24 Arcade</h2>
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

          {/* 🏦 The Sunday Vault */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-900 rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
            <div className="absolute top-2 right-2 w-12 h-12 bg-yellow-400/20 rounded-full blur-lg animate-pulse" />
            <div className="text-3xl mb-3">🏦</div>
            <h3 className="text-sm font-black mb-1 tracking-tight">Sunday Vault</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-3">Weekly mega rewards</p>
            <span className="bg-yellow-400/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-yellow-300">💎 Unlock Sundays</span>
          </div>

          {/* 🎫 Scratch & Win */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="text-sm font-black mb-1 tracking-tight">Scratch & Win</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-3">Every order gets a card</p>
            <span className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">🎁 Guaranteed Prize</span>
          </div>

          {/* 🔥 Streak Bonus */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-[24px] p-5 text-white relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-300/20 rounded-full blur-xl" />
            <div className="text-3xl mb-3">🔥</div>
            <h3 className="text-sm font-black mb-1 tracking-tight">Streak Bonus</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-3">Order daily, earn more</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${d <= 3 ? 'bg-yellow-300 text-yellow-800' : 'bg-white/20 text-white/60'}`}>{d}</div>
              ))}
            </div>
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
          <div className="fixed inset-0 z-[120] bg-[#111827] text-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Header / Input Area */}
            <div className="p-4 md:p-8 border-b border-gray-800 bg-[#111827]/80 backdrop-blur-xl sticky top-0 z-10 flex items-center gap-4">
              <button onClick={() => { setSearchFocused(false); setSearchQuery(''); }} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition text-2xl font-black">✕</button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask Dash24 AI anything..."
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-lg font-medium shadow-inner"
                  autoFocus
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">✨</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
              {!searchQuery ? (
                <>
                  {/* Default AI Suggestions */}
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Live Pulse Recommendations</p>
                    <div className="flex flex-wrap gap-2">
                      {["What's trending in my tower?", "Best protein shakes for recovery", "Midnight snacks under ₹200", "Organic coffee beans"].map((query) => (
                        <button onClick={() => setSearchQuery(query)} key={query} className="bg-gray-800 border border-gray-700 hover:border-gray-500 px-4 py-2.5 rounded-xl text-sm text-gray-300 transition text-left flex items-center gap-2">
                          <span className="text-blue-400">🔍</span> {query}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden group max-w-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Dash24 Search
                    </p>
                    <h3 className="text-xl font-bold text-blue-50 mb-4 tracking-tight">Search for anything you need.</h3>
                    <p className="text-sm text-blue-200/60 leading-relaxed font-medium">Try asking for "gluten-free snacks", "something to wake me up", or "party essentials".</p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                      ✨
                    </div>
                    <div className="bg-gray-800/80 border border-gray-700 p-4 rounded-2xl rounded-tl-sm text-gray-300 text-sm leading-relaxed max-w-xl">
                      <p className="font-medium">Here's what I found for <span className="text-white font-bold">"{searchQuery}"</span>:</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scoredItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || JSON.stringify(item.ai_intent_layers || {}).toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8).map(item => (
                      <div key={item.name} onClick={() => { setSearchFocused(false); router.push(`/product/${item.id}`); }} className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col relative cursor-pointer group hover:shadow-xl transition text-black">
                        <div className="w-full h-32 mb-3 bg-gray-50 rounded-xl p-2 relative overflow-hidden flex items-center justify-center">
                          <img src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-900 leading-snug mb-1 line-clamp-2 min-h-[32px]">{item.name}</p>
                        <p className="text-sm font-black text-gray-900 mt-auto">₹{item.price}</p>
                      </div>
                    ))}
                    {scoredItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || JSON.stringify(item.ai_intent_layers || {}).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="col-span-2 md:col-span-4 text-center py-10">
                        <p className="text-5xl mb-4 grayscale opacity-50">🧐</p>
                        <p className="text-gray-400 font-medium">No direct matches found for that query.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    <img src={activeProduct.image_url} alt={activeProduct.name} className="object-contain w-full h-full mix-blend-multiply filter drop-shadow-xl group-hover:scale-105 transition duration-500" />
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
                    <img src={BRAND_LOGOS[activeBrand]} alt={activeBrand} className="object-contain w-full h-full mix-blend-multiply" />
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
                  {userItems.filter(i => i.brand === activeBrand).map(item => (
                    <div key={`brand-${item.name}`} className={`bg-white rounded-3xl p-6 shadow-sm border ${item.localAvailable ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'} hover:shadow-xl transition-all duration-300 flex flex-col`}>
                      <div className="aspect-square bg-[#F8FAFC] rounded-2xl mb-5 relative flex items-center justify-center p-4 overflow-hidden group">
                        {item.localAvailable && item.low && <span className="absolute top-3 right-3 text-[9px] bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold z-10 shadow-sm">Running Low</span>}
                        {!item.localAvailable && <span className="absolute top-3 right-3 text-[9px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold z-10 shadow-sm">Multi-Day</span>}
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
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
                        onClick={() => handleAddToCart(item.name)}
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

      {/* ========================================= */}
      {/* CART DRAWER & CHECKOUT FLOW               */}
      {/* ========================================= */}
      {
        cartOpen && (
          <div className="fixed inset-0 z-[120] flex">
            <div
              onClick={() => setCartOpen(false)}
              className="flex-1 bg-black/60 backdrop-blur-md transition-opacity"
            />
            <div className="w-[480px] bg-white shadow-2xl pb-safe p-6 md:p-8 flex flex-col animate-in slide-in-from-right duration-300 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:rounded-t-[32px] max-md:h-[85vh] max-md:slide-in-from-bottom max-md:pt-4">

              <div className="hidden max-md:block mx-auto w-12 h-1.5 rounded-full bg-gray-300 mb-6 flex-shrink-0" />

              {checkoutStep === 0 && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Cart</h2>
                    <button onClick={() => setCartOpen(false)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition font-bold text-gray-500">✕</button>
                  </div>

                  <div className="bg-orange-50 rounded-2xl p-5 mb-8 border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                    <p className="text-xs font-bold text-orange-600 mb-3 ml-2">
                      {amountRemaining > 0
                        ? `Add ₹${amountRemaining} more for FREE Dash24 Delivery`
                        : "🎉 Free Dash24 Delivery Unlocked!"}
                    </p>
                    <div className="w-full bg-orange-200/50 rounded-full h-2.5 overflow-hidden ml-2 max-w-[calc(100%-1rem)]">
                      <div
                        className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-4 hide-scrollbar">
                    {cartItems.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <div className="text-6xl mb-4">🛒</div>
                        <p className="text-lg font-bold text-gray-900 mb-2">Cart is empty</p>
                        <p className="text-sm font-medium text-gray-500">Add some premium essentials.</p>
                      </div>
                    )}

                    {cartItems.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center border-b border-gray-100 pb-6"
                      >
                        <div className="w-2/3">
                          <p className="text-base font-bold text-gray-900 leading-tight mb-1 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 font-medium">
                            ₹{item.price} × {item.quantity}
                          </p>
                          {(() => {
                            const userItem = userItems.find((u) => u.name === item.name);
                            if (!userItem) return null;
                            if (userItem.lastPurchased >= userItem.consumptionCycle - 2) {
                              return (
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2 bg-blue-50 inline-block px-2 py-1 rounded-md">
                                  Reorder Prediction Active
                                </p>
                              );
                            }
                            return null;
                          })()}
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                              <button onClick={() => handleDecrease(item.name)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition font-bold text-lg">-</button>
                              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => handleAddToCart(item.name)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition font-bold text-lg">+</button>
                            </div>
                            <button onClick={() => handleRemoveItem(item.name)} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 transition underline underline-offset-4">
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="w-1/3 text-right">
                          <p className="text-lg font-black text-gray-900">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {suggestedItem && cartItems.length > 0 && (
                    <div className="bg-[#F8FAFC] rounded-2xl p-5 mt-4 mb-6 border border-gray-200 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <span className="text-sm">✨</span> AI Suggestion
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{suggestedItem.name}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">₹{suggestedItem.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(suggestedItem.name)}
                        className="text-xs px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 font-bold hover:bg-gray-50 hover:border-gray-400 transition shadow-sm whitespace-nowrap"
                      >
                        Add +
                      </button>
                    </div>
                  )}

                  {cartItems.length > 0 && (
                    <div className="border-t border-gray-200 pt-6 mt-2">
                      <div className="flex justify-between mb-3">
                        <span className="text-sm text-gray-500 font-medium">Subtotal</span>
                        <span className="text-sm font-bold text-gray-900">₹{subtotal}</span>
                      </div>

                      {localSubtotal > 0 && (
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-gray-500 font-medium">Dash24 Delivery</span>
                          <span className="text-sm font-bold text-gray-900">{localShipping === 0 ? "Free" : `₹${localShipping}`}</span>
                        </div>
                      )}

                      {brandSubtotal > 0 && (
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-gray-500 font-medium">Brand Direct</span>
                          <span className="text-sm font-bold text-gray-900">{brandShipping === 0 ? "Free" : `₹${brandShipping}`}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-end mb-6 pt-4 border-t border-gray-100">
                        <span className="text-lg font-black text-gray-900">Total</span>
                        <div className="text-right">
                          <span className="text-3xl font-black text-gray-900 leading-none">₹{total}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCheckoutStep(1)}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/30 hover:-translate-y-1 mt-2"
                      >
                        Instant Checkout ⚡
                      </button>
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 1 && (
                <>
                  <div className="flex items-center mb-8">
                    <button onClick={() => setCheckoutStep(0)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition font-bold mr-4 text-xl">←</button>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Summary</h2>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-2 hide-scrollbar">
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <div className="mb-6 relative z-10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Delivering To</p>
                        <p className="text-base font-bold text-gray-900 flex items-center gap-2"><span className="text-xl">🏠</span> Home</p>
                        <p className="text-sm font-medium text-gray-600 mt-1">100ft Road, Indiranagar, Bangalore</p>
                      </div>
                      <div className="pt-5 border-t border-gray-200 relative z-10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Fulfillment Node</p>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 inline-block px-3 py-1.5 rounded-lg border border-blue-100">📍 {selectedNode} Active</p>
                      </div>
                    </div>

                    {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                      <div className="border border-blue-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="p-5 bg-blue-50/80 border-b border-blue-100 flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                          <div className="pl-3">
                            <h3 className="text-base font-black text-blue-900 flex items-center gap-2">
                              <span className="bg-white p-1 rounded-md shadow-sm text-sm">⚡</span> Dash24 Delivery
                            </h3>
                            <span className="text-[10px] font-bold text-blue-600 mt-2 block uppercase tracking-widest bg-white/60 inline-block px-2 py-1 rounded">Arriving Today by {dash24DeliveryTime}</span>
                          </div>
                        </div>
                        <div className="p-6 space-y-4 bg-white">
                          {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-900 truncate max-w-[200px]">{item.name} <span className="text-gray-400 font-medium ml-1">x{item.quantity}</span></span>
                              <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                      <div className="border border-orange-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition mt-6">
                        <div className="p-5 bg-orange-50/80 border-b border-orange-100 flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                          <div className="pl-3">
                            <h3 className="text-base font-black text-orange-900 flex items-center gap-2">
                              <span className="bg-white p-1 rounded-md shadow-sm text-sm">📦</span> Brand Direct
                            </h3>
                            <span className="text-[10px] font-bold text-orange-600 mt-2 block uppercase tracking-widest bg-white/60 inline-block px-2 py-1 rounded">Arrives by {brandDeliveryDate}</span>
                          </div>
                        </div>
                        <div className="p-6 space-y-4 bg-white">
                          {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                              <span className="font-bold text-gray-900 truncate max-w-[200px]">{item.name} <span className="text-gray-400 font-medium ml-1">x{item.quantity}</span></span>
                              <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/30 hover:-translate-y-1"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </>
              )}

              {checkoutStep === 2 && (
                <>
                  <div className="flex items-center mb-8">
                    <button onClick={() => setCheckoutStep(1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition font-bold mr-4 text-xl">←</button>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Method</h2>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 hide-scrollbar">
                    <p className="text-sm text-gray-500 font-medium mb-6">
                      Select how you'd like to pay for your order of <span className="font-bold text-gray-900 text-base">₹{total}</span>
                    </p>

                    <label className="flex items-center justify-between p-6 border-2 border-blue-500 rounded-3xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 transition relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase">Recommended</div>
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border-4 border-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <span className="font-bold text-base text-gray-900">UPI <span className="text-xs text-gray-500 font-medium block mt-0.5">GPay, PhonePe, Paytm</span></span>
                      </div>
                    </label>

                    <label className="flex items-center p-6 border border-gray-200 rounded-3xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                        <span className="font-bold text-base text-gray-900">Credit / Debit Card</span>
                      </div>
                    </label>

                    <label className="flex items-center p-6 border border-gray-200 rounded-3xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                        <span className="font-bold text-base text-gray-900">Cash on Delivery</span>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <button
                      onClick={placeOrder}
                      className="w-full bg-[#111827] text-white py-5 rounded-xl text-base font-bold hover:bg-gray-900 transition flex justify-between px-8 items-center shadow-2xl shadow-gray-900/30 hover:-translate-y-1"
                    >
                      <span>Pay ₹{total}</span>
                      <span className="flex items-center gap-2">Place Order <span className="text-xl">→</span></span>
                    </button>
                  </div>
                </>
              )}

              {checkoutStep === 3 && (
                <div className="flex flex-col h-full items-center justify-center text-center px-4 py-8 animate-in zoom-in-95 duration-500">
                  <div className="w-28 h-28 bg-green-500 text-white rounded-full flex items-center justify-center text-6xl mb-6 shadow-2xl shadow-green-500/40 relative">
                    <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping opacity-50"></div>
                    ✓
                  </div>
                  <h2 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">Confirmed!</h2>

                  {/* DISPLAY UNIQUE ORDER ID */}
                  <p className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md mb-3 font-mono border border-blue-100">
                    {orderId}
                  </p>

                  <p className="text-base text-gray-500 font-medium mb-10">
                    Your order of <span className="font-bold text-gray-900">₹{total}</span> has been placed.
                  </p>

                  <div className="w-full space-y-4 text-left mb-12">
                    {cartItems.filter(item => userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                      <div className="bg-blue-50/80 p-6 rounded-3xl border border-blue-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-blue-50">⚡</div>
                        <div>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1.5">Order Part A</p>
                          <p className="text-base font-bold text-gray-900">Dash24 Delivery by {dash24DeliveryTime}</p>
                        </div>
                      </div>
                    )}

                    {cartItems.filter(item => !userItems.find(u => u.name === item.name)?.localAvailable).length > 0 && (
                      <div className="bg-orange-50/80 p-6 rounded-3xl border border-orange-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-orange-50">📦</div>
                        <div>
                          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1.5">Order Part B</p>
                          <p className="text-base font-bold text-gray-900">Brand Direct by {brandDeliveryDate}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {cartItems.length > 0 ? (
                    <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 mt-auto text-left shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl bg-white p-2 rounded-xl shadow-sm">✨</span>
                        <h3 className="text-base font-black text-indigo-900 uppercase tracking-widest">Smart Refill</h3>
                      </div>
                      <p className="text-sm font-medium text-indigo-800/80 mb-8 leading-relaxed">
                        AI predicts you'll need a refill of <span className="font-bold text-indigo-900">{cartItems[0].name}</span> in {userItems.find(u => u.name === cartItems[0].name)?.consumptionCycle || 30} days.
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={handleAutoAddSimulation}
                          className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 hover:-translate-y-1 relative overflow-hidden"
                        >
                          Auto-Add to Cart Next Time
                        </button>
                        <button
                          onClick={() => {
                            setCartItems([]);
                            setCartCount(0);
                            setAddedItem(null);
                            setCartOpen(false);
                            setTimeout(() => setCheckoutStep(0), 300);
                          }}
                          className="w-full bg-white text-indigo-900 border border-indigo-200 py-4 rounded-xl text-sm font-bold hover:bg-indigo-50 transition"
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
                      className="w-full bg-gray-100 text-gray-900 py-5 rounded-xl text-base font-bold hover:bg-gray-200 transition mt-auto"
                    >
                      Continue Shopping
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* ========================================= */}
      {/* MOBILE MINI CART STRIP                    */}
      {/* ========================================= */}
      {
        cartCount > 0 && !cartOpen && (
          <div className="md:hidden fixed bottom-[76px] left-4 right-4 z-[90] bg-[#111827] text-white rounded-2xl p-4 shadow-2xl border border-gray-800 flex justify-between items-center animate-in slide-in-from-bottom-5">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cartCount} Item{cartCount > 1 ? 's' : ''}</span>
              <span className="text-sm font-black leading-none mt-1 text-yellow-400">₹{total}</span>
            </div>
            <button onClick={() => setCartOpen(true)} className="bg-white text-black font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform">
              Checkout <span className="text-lg leading-none">→</span>
            </button>
          </div>
        )
      }

      {/* MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[95] pb-safe pb-4 pt-3 px-6 flex justify-between items-center isolate">
        <button onClick={() => setActiveTab("Home")} className={`flex flex-col items-center gap-1.5 transition ${activeTab === "Home" ? "text-[#F97316]" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="text-xl leading-none">🏠</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab("Brands")} className={`flex flex-col items-center gap-1.5 transition ${activeTab === "Brands" ? "text-[#F97316]" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="text-xl leading-none">🏢</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Brands</span>
        </button>
        <button onClick={() => setSearchFocused(true)} className="flex flex-col items-center gap-1.5 transition relative group">
          <div className="absolute -top-6 bg-[#111827] group-active:scale-95 transition-transform w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-blue-500/20">
            <span className="text-2xl leading-none drop-shadow-md">✨🔍</span>
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase mt-6 text-gray-900">Pulse</span>
        </button>
        <button onClick={() => setActiveTab("Arcade")} className={`flex flex-col items-center gap-1.5 transition ${activeTab === "Arcade" ? "text-[#F97316]" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="text-xl leading-none relative">
            🎮
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Arcade</span>
        </button>
        <button onClick={() => setActiveTab("Track")} className={`flex flex-col items-center gap-1.5 transition ${activeTab === "Track" ? "text-[#F97316]" : "text-gray-400 hover:text-gray-600"}`}>
          <span className="text-xl leading-none">📍</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">Track</span>
        </button>
      </div>
    </>
  );
}