import { useMemo } from 'react';
import { NODE_DATA, BRAND_LOGOS } from '../data/constants';

export type DeliveryZone = keyof typeof NODE_DATA;

export interface RankedBrand {
    name: string;
    logoUrl: string;
    isFastTrack: boolean;
    isDemanded: boolean;
}

/**
 * Pure function to calculate ranked brands.
 */
export function calculateRankedBrands(selectedNode: string): RankedBrand[] {
    if (!selectedNode || !(selectedNode in NODE_DATA)) {
        return [];
    }

    const nodeData = NODE_DATA[selectedNode as DeliveryZone];
    const isFastTrack = nodeData.nearestDistanceKm <= 1.0;
    const allBrandNames = Object.keys(BRAND_LOGOS);
    const demandedSet: Set<string> = new Set((nodeData.demandBrands as readonly string[]) || []);

    const ranked: RankedBrand[] = allBrandNames.map((name) => ({
        name,
        logoUrl: BRAND_LOGOS[name],
        isFastTrack,
        isDemanded: demandedSet.has(name)
    }));

    ranked.sort((a, b) => {
        if (a.isDemanded && !b.isDemanded) return -1;
        if (!a.isDemanded && b.isDemanded) return 1;
        return a.name.localeCompare(b.name);
    });

    return ranked;
}

/**
 * Hook to get a ranked list of brands based on the user's Pulse Location.
 */
export function useRankedBrands(selectedNode: string): RankedBrand[] {
    return useMemo(() => calculateRankedBrands(selectedNode), [selectedNode]);
}
