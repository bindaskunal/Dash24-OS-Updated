"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MASTER_CATALOG } from "../../src/data/constants";

const CATEGORIES = ["All", "Health & Wellness", "Beauty", "Snacks", "Electronics", "Wearables", "Fashion"];

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "All";
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    // Filter products
    const filteredProducts = activeCategory === "All"
        ? MASTER_CATALOG
        : MASTER_CATALOG.filter(p => p.category === activeCategory);

    const handleAddToCart = (product: any) => {
        alert(`Added ${product.name} to cart.`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-24">
            <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4 md:gap-8">
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/" className="w-auto h-10 px-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition">
                            <span className="text-xl">←</span>
                        </Link>
                        <h1 className="text-xl font-black text-gray-900">All Products</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-10 pt-6">
                <div className="flex overflow-x-auto gap-3 pb-6 hide-scrollbar mb-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#111827] text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredProducts.map((item, idx) => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-[20px] p-4 flex flex-col items-center hover:shadow-xl transition relative cursor-pointer" onClick={() => router.push(`/product/${item.id}`)}>
                            <div className="w-full h-32 mb-4 bg-gray-50 rounded-xl p-2 relative overflow-hidden flex items-center justify-center">
                                {item.low && <span className="absolute top-2 right-2 text-[9px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold shadow-sm">Low Stock</span>}
                                <img src={item.image_url} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm text-center leading-snug min-h-[40px] mb-2">{item.name}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{item.brand}</p>
                            <div className="flex justify-between items-center w-full mt-auto">
                                <span className="text-lg font-black text-gray-900">₹{item.price}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center hover:bg-blue-600 transition">
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 font-bold">
                            No products found in this category.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Products...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
