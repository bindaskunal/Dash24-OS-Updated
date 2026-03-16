import { calculateRankedBrands } from "./useRankedBrands";

// Mocking constants
jest.mock("../data/constants", () => ({
    BRAND_LOGOS: {
        "Brand A": "logoA.png",
        "Brand B": "logoB.png",
        "Brand C": "logoC.png",
        "Brand D": "logoD.png",
    },
    NODE_DATA: {
        "Node Fast": { nearestDistanceKm: 0.8, demandBrands: ["Brand C", "Brand A"] },
        "Node Slow": { nearestDistanceKm: 1.5, demandBrands: ["Brand B"] },
        "Node Empty": { nearestDistanceKm: 2.0, demandBrands: [] },
    }
}));

describe("calculateRankedBrands", () => {
    it("returns empty array for unknown node", () => {
        expect(calculateRankedBrands("Unknown Node")).toEqual([]);
        expect(calculateRankedBrands("")).toEqual([]);
    });

    it("identifies Fast Track brands (<30 mins / < 1.0km)", () => {
        const result = calculateRankedBrands("Node Fast");
        expect(result.length).toBe(4);
        result.forEach(brand => {
            expect(brand.isFastTrack).toBe(true);
        });
    });

    it("identifies Non-Fast Track brands", () => {
        const result = calculateRankedBrands("Node Slow");
        expect(result.length).toBe(4);
        result.forEach(brand => {
            expect(brand.isFastTrack).toBe(false);
        });
    });

    it("ranks demanded brands first, then sorts alphabetically", () => {
        const result = calculateRankedBrands("Node Fast");
        // Demanded: Brand C, Brand A (sorted alphabetically -> A, then C)
        // Others: Brand B, Brand D (sorted alphabetically -> B, then D)
        expect(result[0].name).toBe("Brand A");
        expect(result[0].isDemanded).toBe(true);

        expect(result[1].name).toBe("Brand C");
        expect(result[1].isDemanded).toBe(true);

        expect(result[2].name).toBe("Brand B");
        expect(result[2].isDemanded).toBe(false);

        expect(result[3].name).toBe("Brand D");
        expect(result[3].isDemanded).toBe(false);
    });

    it("returns correctly formed RankedBrand objects", () => {
        const result = calculateRankedBrands("Node Slow");
        const brandB = result.find(b => b.name === "Brand B");
        expect(brandB).toEqual({
            name: "Brand B",
            logoUrl: "logoB.png",
            isFastTrack: false,
            isDemanded: true
        });
    });
});
