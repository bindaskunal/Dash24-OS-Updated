import { NODE_DATA } from "../data/constants";

export type DeliveryZone = keyof typeof NODE_DATA;

/**
 * Deterministically checks if a node qualifies for 60-min delivery.
 * Dash24 business logic: A location with nearestDistanceKm <= 1.5 qualifies.
 */
export function isSixtyMinDelivery(nodeName: string): boolean {
    if (!nodeName) return false;

    // Check if the node exists in our data
    const nodeData = NODE_DATA[nodeName as DeliveryZone];
    if (!nodeData) return false;

    // Deterministic rule: distance <= 1.5km
    return nodeData.nearestDistanceKm <= 1.5;
}

/**
 * Returns the formatted delivery time string based on the node.
 */
export function getDeliveryTimeString(nodeName: string): string {
    return isSixtyMinDelivery(nodeName) ? "60-min delivery" : "Standard delivery";
}
