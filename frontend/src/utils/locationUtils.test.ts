import { isSixtyMinDelivery, getDeliveryTimeString } from "./locationUtils";

// Mocking the constants for tests to guarantee deterministic execution without relying on actual file changes
jest.mock("../data/constants", () => ({
    NODE_DATA: {
        "Node Near": { nearestDistanceKm: 1.0 },
        "Node Far": { nearestDistanceKm: 2.0 },
        "Node Threshold": { nearestDistanceKm: 1.5 },
    }
}));

describe("Location Utils - Delivery Logic", () => {
    describe("isSixtyMinDelivery", () => {
        it("should return true for distance < 1.5km", () => {
            expect(isSixtyMinDelivery("Node Near")).toBe(true);
        });

        it("should return true for distance == 1.5km (threshold)", () => {
            expect(isSixtyMinDelivery("Node Threshold")).toBe(true);
        });

        it("should return false for distance > 1.5km", () => {
            expect(isSixtyMinDelivery("Node Far")).toBe(false);
        });

        it("should return false for unknown node", () => {
            expect(isSixtyMinDelivery("Unknown Node")).toBe(false);
        });

        it("should return false for empty node", () => {
            expect(isSixtyMinDelivery("")).toBe(false);
        });
    });

    describe("getDeliveryTimeString", () => {
        it("should return '60-min delivery' for qualifying nodes", () => {
            expect(getDeliveryTimeString("Node Near")).toBe("60-min delivery");
        });

        it("should return 'Standard delivery' for non-qualifying nodes", () => {
            expect(getDeliveryTimeString("Node Far")).toBe("Standard delivery");
        });
    });
});
