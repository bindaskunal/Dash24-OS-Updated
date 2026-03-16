"use client";

import React from 'react';

interface CheckoutSummaryTableProps {
    subtotal: number;
    pointsEarned: number;
}

export default function CheckoutSummaryTable({ subtotal, pointsEarned }: CheckoutSummaryTableProps) {
    const gstRate = 0.18;
    const gstAmount = Math.round(subtotal * gstRate);
    const deliveryFee = subtotal >= 500 ? 0 : 49;
    const orderTotal = subtotal + gstAmount + deliveryFee;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 text-sm font-sans mb-4">
            <div className="flex justify-between items-center p-2 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Items Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal}</span>
            </div>

            <div className="flex justify-between items-center p-2 border-b border-gray-50">
                <span className="text-gray-500 font-medium flex items-center gap-1">
                    GST <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">18%</span>
                </span>
                <span className="font-bold text-gray-900">₹{gstAmount}</span>
            </div>

            <div className="flex justify-between items-center p-2 border-b border-gray-50">
                <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Delivery Fee</span>
                    <span className="text-[9px] text-gray-400">Waived with Dash24 Points</span>
                </div>
                {deliveryFee === 0 ? (
                    <span className="font-bold text-green-600 uppercase text-[10px] tracking-wider bg-green-50 px-1.5 py-0.5 rounded">Free over ₹500</span>
                ) : (
                    <span className="font-bold text-gray-900">₹{deliveryFee}</span>
                )}
            </div>

            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-xl mt-2 mb-2">
                <span className="font-black text-gray-900 uppercase tracking-widest text-xs">To Pay</span>
                <span className="font-black text-gray-900 text-lg">₹{orderTotal}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-[#FFD700]/10 rounded-xl border border-[#FFD700]/30 text-gray-900 shadow-sm mt-3">
                <span className="font-black text-sm flex items-center gap-2"><span className="text-lg">✨</span> Points Earned</span>
                <span className="font-black text-lg text-[#FFD700] drop-shadow-sm">+{pointsEarned} pt</span>
            </div>
        </div>
    );
}
