'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface CartSummaryProps {
  cart: any;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ cart }) => {
  const router = useRouter();

  const subtotal = (cart.totalAmount || 0) / 100;
  const discount = (cart.totalDiscountCents || 0) / 100;
  const total = subtotal - discount;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between font-semibold text-gray-900 text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/checkout')}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};
