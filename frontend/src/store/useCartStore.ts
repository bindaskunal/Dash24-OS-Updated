import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    isFastTrack: boolean;
    brandName: string;
    imageUrl?: string;
    isPulse?: boolean;
    pulseStatus?: "active" | "expired";
    pulseExpiresAt?: number;
    originalPrice?: number;
    deliveryBucket?: "instant" | "quick";
}

export interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    setIsCartOpen: (open: boolean) => void;
    customerMobile: string | null;
    setCustomerMobile: (mobile: string | null) => void;

    // Computed getters
    getTotalItems: () => number;
    getTotalAmount: () => number;
    getTotalPoints: () => number; // 1 point per 10 rupees spent
    getDeliveryBuckets: () => { instant: CartItem[], quick: CartItem[], standard: CartItem[] };
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isCartOpen: false,
            customerMobile: null,

            setCustomerMobile: (mobile) => set({ customerMobile: mobile }),
            setIsCartOpen: (open) => set({ isCartOpen: open }),

            addItem: (newItem) => set((state) => {
                const existingItem = state.items.find(item => item.id === newItem.id);
                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            item.id === newItem.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    };
                }
                return { items: [...state.items, { ...newItem, quantity: 1 }] };
            }),

            removeItem: (id) => set((state) => ({
                items: state.items.filter(item => item.id !== id)
            })),

            updateQuantity: (id, quantity) => set((state) => {
                if (quantity <= 0) {
                    return { items: state.items.filter(item => item.id !== id) };
                }
                return {
                    items: state.items.map(item =>
                        item.id === id ? { ...item, quantity } : item
                    )
                };
            }),

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalAmount: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            getTotalPoints: () => {
                // 1 point per ₹10 spent. Math.floor ensures deterministic int values.
                const total = get().getTotalAmount();
                return Math.floor(total / 10);
            },

            getDeliveryBuckets: () => {
                const items = get().items;
                const instant: CartItem[] = [];
                const quick: CartItem[] = [];
                const standard: CartItem[] = [];
                items.forEach(item => {
                    if (item.deliveryBucket === 'instant') {
                        instant.push(item);
                    } else if (item.deliveryBucket === 'quick') {
                        quick.push(item);
                    } else {
                        standard.push(item); // FBB and un-tagged items go here
                    }
                });
                return { instant, quick, standard };
            }
        }),
        {
            name: 'dash24-cart-storage', // key for localStorage
        }
    )
);
