import React from 'react';

type InventoryItem = {
    sku: string;
    stock: number;
    velocity: number; // Items sold per day
};

const DUMMY_INVENTORY: InventoryItem[] = [
    { sku: 'Vitamin C Serum 30ml', stock: 12, velocity: 5 }, // Stock out in 2.4 days (WARNING)
    { sku: 'Salicylic Acid Cleanser', stock: 45, velocity: 3 }, // Stock out in 15 days (SAFE)
    { sku: 'Niacinamide 10% Zinc 1%', stock: 8, velocity: 4 }, // Stock out in 2 days (WARNING)
    { sku: 'Oat Extract Moisturizer', stock: 120, velocity: 15 }, // Stock out in 8 days (SAFE)
    { sku: 'Multi-Peptide Hair Serum', stock: 4, velocity: 2 }, // Stock out in 2 days (WARNING)
];

export default function InventoryRadar() {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col mt-8">
            <div className="mb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Dark Store Inventory Health
                </h3>
                <p className="text-xs text-slate-500 mt-1">Real-time stock depletion tracking based on Pulse Velocity.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 font-bold rounded-tl-lg">SKU Name</th>
                            <th className="px-4 py-3 font-bold">Current Stock</th>
                            <th className="px-4 py-3 font-bold">Pulse Velocity</th>
                            <th className="px-4 py-3 font-bold rounded-tr-lg">Reorder Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DUMMY_INVENTORY.map((item, idx) => {
                            const daysUntilStockout = item.stock / item.velocity;
                            const isCritical = daysUntilStockout < 3;

                            return (
                                <tr key={idx} className={`border-b border-slate-50 transition-colors ${isCritical ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-4 py-4 font-bold text-slate-900">{item.sku}</td>
                                    <td className="px-4 py-4 text-slate-600 font-medium">
                                        <span className={isCritical ? 'text-rose-600 font-bold' : ''}>
                                            {item.stock} units left
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600 font-medium">Selling {item.velocity}/day</td>
                                    <td className="px-4 py-4">
                                        {isCritical ? (
                                            <button className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-rose-200">
                                                Dispatch to Bangalore Hub
                                            </button>
                                        ) : (
                                            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-100">
                                                Stock Healthy
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
