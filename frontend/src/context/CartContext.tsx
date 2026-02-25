"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ENRICHED_CATALOG from "../../data/enriched_catalog.json";
import { MASTER_CATALOG } from "../data/constants";

type CartItem = {
    name: string;
    price: number;
    quantity: number;
};

type CartContextType = {
    cartItems: CartItem[];
    cartCount: number;
    cartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    handleAddToCart: (productName: string, customPrice?: number) => void;
    handleDecrease: (productName: string) => void;
    handleRemoveItem: (productName: string) => void;
    clearCart: () => void;
    total: number;
    subtotal: number;
    localShipping: number;
    brandShipping: number;
    amountRemaining: number;
    progressPercentage: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
    }, [cartItems]);

    const handleAddToCart = (productName: string, customPrice?: number) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.name === productName);
            if (existing) {
                return prev.map((item) =>
                    item.name === productName ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            // Search MASTER_CATALOG first (has all products with correct prices),
            // then fall back to ENRICHED_CATALOG
            const product = (MASTER_CATALOG as any[]).find(p => p.name === productName)
                || (ENRICHED_CATALOG as any[]).find(p => p.name === productName);
            const price = customPrice || (product ? product.price : 0);

            return [...prev, { name: productName, price, quantity: 1 }];
        });
    };

    const handleDecrease = (productName: string) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.name === productName);
            if (existing && existing.quantity > 1) {
                return prev.map((item) =>
                    item.name === productName ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prev.filter((item) => item.name !== productName);
        });
    };

    const handleRemoveItem = (productName: string) => {
        setCartItems((prev) => prev.filter((item) => item.name !== productName));
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Logic from page.tsx
    const localItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return prod && prod.inventory && Object.values(prod.inventory).some((v: any) => v > 0);
    });
    const localSubtotal = localItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const localShipping = localSubtotal >= 500 ? 0 : (localSubtotal > 0 ? 49 : 0);

    const brandItems = cartItems.filter(item => !localItems.includes(item));
    const brandSubtotal = brandItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const brandShipping = brandSubtotal >= 1500 ? 0 : (brandSubtotal > 0 ? 99 : 0);

    const total = subtotal + localShipping + brandShipping;
    const amountRemaining = Math.max(0, 500 - localSubtotal);
    const progressPercentage = Math.min(100, (localSubtotal / 500) * 100);

    const clearCart = () => {
        setCartItems([]);
        setCartCount(0);
    };

    return (
        <CartContext.Provider value={{
            cartItems, cartCount, cartOpen, setCartOpen,
            handleAddToCart, handleDecrease, handleRemoveItem, clearCart,
            total, subtotal, localShipping, brandShipping, amountRemaining, progressPercentage
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
