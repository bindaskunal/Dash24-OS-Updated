import { useCartStore } from './useCartStore';

describe("CartStore", () => {
    beforeEach(() => {
        // Clear store before each test
        const store = useCartStore.getState();
        store.clearCart();
    });

    it("should add item correctly", () => {
        const store = useCartStore.getState();
        store.addItem({
            id: "1",
            name: "Protein Shake",
            price: 150,
            isFastTrack: true,
            brandName: "Whole Truth"
        });

        const state = useCartStore.getState();
        expect(state.items.length).toBe(1);
        expect(state.items[0].quantity).toBe(1);
    });

    it("should update quantity for same item rather than duplicate", () => {
        const store = useCartStore.getState();
        const item = {
            id: "2",
            name: "Cookies",
            price: 50,
            isFastTrack: false,
            brandName: "Local Bakery"
        };

        store.addItem(item);
        store.addItem(item); // Add same item

        const state = useCartStore.getState();
        expect(state.items.length).toBe(1);
        expect(state.items[0].quantity).toBe(2);
    });

    it("should correctly calculate reward points (1 per 10 rupees)", () => {
        const store = useCartStore.getState();
        store.addItem({
            id: "3",
            name: "Gadget",
            price: 155,
            isFastTrack: true,
            brandName: "TechCorp"
        });
        // 155 -> 15 points
        expect(useCartStore.getState().getTotalPoints()).toBe(15);

        store.addItem({
            id: "4",
            name: "Snack",
            price: 49,
            isFastTrack: false,
            brandName: "SnackCorp"
        });
        // 155 + 49 = 204 -> 20 points
        expect(useCartStore.getState().getTotalPoints()).toBe(20);
    });

    it("should correctly split into instant and quick delivery buckets", () => {
        const store = useCartStore.getState();
        store.addItem({
            id: "fast-1",
            name: "Fast Item 1",
            price: 100,
            isFastTrack: true,
            brandName: "Brand A"
        });
        store.addItem({
            id: "slow-1",
            name: "Slow Item 1",
            price: 100,
            isFastTrack: false,
            brandName: "Brand B"
        });
        store.addItem({
            id: "fast-2",
            name: "Fast Item 2",
            price: 100,
            isFastTrack: true,
            brandName: "Brand A"
        });

        const buckets = useCartStore.getState().getDeliveryBuckets();
        expect(buckets.instant.length).toBe(2);
        expect(buckets.quick.length).toBe(1);
        expect(buckets.instant[0].id).toBe("fast-1");
        expect(buckets.quick[0].id).toBe("slow-1");
    });

    it("should remove item completely if quantity hits 0", () => {
        const store = useCartStore.getState();
        store.addItem({
            id: "1",
            name: "Item",
            price: 10,
            isFastTrack: true,
            brandName: "A"
        });

        expect(useCartStore.getState().items.length).toBe(1);
        useCartStore.getState().updateQuantity("1", 0);
        expect(useCartStore.getState().items.length).toBe(0);
    });
});
