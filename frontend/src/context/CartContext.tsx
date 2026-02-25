"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import ENRICHED_CATALOG from "../../data/enriched_catalog.json";
import { MASTER_CATALOG } from "../data/constants";

type CartItem = {
    name: string;
    price: number;
    quantity: number;
    isPulse?: boolean;
    pulseExpiresAt?: number;
    originalPrice?: number;
    pulseStatus?: "active" | "expired";
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
    showCartToast: boolean;
    toastItem: any;
    lastOrder: CartItem[];
    setLastOrder: React.Dispatch<React.SetStateAction<CartItem[]>>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [showCartToast, setShowCartToast] = useState(false);
    const [toastItem, setToastItem] = useState<any>(null);
    const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastOrder, setLastOrder] = useState<CartItem[]>([]);

    useEffect(() => {
        const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
    }, [cartItems]);

    // Timer to auto-expire pulse deals after 10 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            let hasChanges = false;

            const nextItems = cartItems.map(item => {
                if (item.isPulse && item.pulseStatus === 'active' && item.pulseExpiresAt && now >= item.pulseExpiresAt) {
                    hasChanges = true;
                    return { ...item, pulseStatus: 'expired' as const, price: item.originalPrice || item.price };
                }
                return item;
            });

            if (hasChanges) setCartItems(nextItems);
        }, 1000);
        return () => clearInterval(interval);
    }, [cartItems]);

    const handleAddToCart = (productName: string, customPrice?: number) => {
        const product = (MASTER_CATALOG as any[]).find(p => p.name === productName)
            || (ENRICHED_CATALOG as any[]).find(p => p.name === productName);

        if (product) {
            setToastItem(product);
            setShowCartToast(true);
            if (toastTimeout) clearTimeout(toastTimeout);
            const id = setTimeout(() => setShowCartToast(false), 2000);
            setToastTimeout(id);
        }

        setCartItems((prev) => {
            const existing = prev.find((item) => item.name === productName);
            if (existing) {
                return prev.map((item) =>
                    item.name === productName ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            const price = customPrice || (product ? product.price : 0);
            const isPulse = !!customPrice;
            const originalPrice = product ? product.price : 0;
            const pulseExpiresAt = isPulse ? Date.now() + 10 * 60 * 1000 : undefined;
            const pulseStatus = isPulse ? 'active' : undefined;

            return [...prev, {
                name: productName,
                price,
                quantity: 1,
                isPulse,
                originalPrice,
                pulseExpiresAt,
                pulseStatus
            }];
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

    const localItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return prod && prod.fulfilledBy === "Dash24" && prod.brand !== "Snitch";
    });
    const localSubtotal = localItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const localShipping = localSubtotal >= 699 ? 0 : (localSubtotal > 0 ? 50 : 0);

    const brandItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return prod && prod.fulfilledBy === "Brand" && prod.brand !== "Snitch";
    });
    const brandSubtotal = brandItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const brandShipping = brandSubtotal >= 999 ? 0 : (brandSubtotal > 0 ? 50 : 0);

    // Custom pricing exception: Snitch T-Shirt 
    const snitchItems = cartItems.filter(item => {
        const prod = (ENRICHED_CATALOG as any[]).find(p => p.name === item.name);
        return prod && prod.brand === "Snitch";
    });
    const snitchDelivery = snitchItems.length > 0 ? 49 : 0;

    const total = subtotal + localShipping + brandShipping + snitchDelivery;
    const amountRemaining = Math.max(0, 699 - localSubtotal);
    const progressPercentage = Math.min(100, (localSubtotal / 699) * 100);

    const clearCart = () => {
        setCartItems([]);
        setCartCount(0);
    };

    return (
        <CartContext.Provider value={{
            cartItems, cartCount, cartOpen, setCartOpen,
            handleAddToCart, handleDecrease, handleRemoveItem, clearCart,
            total, subtotal, localShipping, brandShipping, amountRemaining, progressPercentage,
            showCartToast, toastItem, lastOrder, setLastOrder
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
