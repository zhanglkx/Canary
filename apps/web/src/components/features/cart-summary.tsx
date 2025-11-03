'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { CLEAR_CART, GET_MY_CART } from '@/lib/graphql/cart';

interface CartSummaryProps {
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  itemCount: number;
  isEmpty: boolean;
  isAbandoned: boolean;
}

/**
 * CartSummary Component
 * Displays cart totals and checkout/continue shopping buttons
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotalCents,
  taxCents,
  discountCents,
  totalCents,
  itemCount,
  isEmpty,
  isAbandoned,
}) => {
  const [clearCart, { loading: clearingCart }] = useMutation(CLEAR_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
    onError: (error) => {
      alert(`Failed to clear cart: ${error.message}`);
    },
  });

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart();
    }
  };

  const subtotal = subtotalCents / 100;
  const tax = taxCents / 100;
  const discount = discountCents / 100;
  const total = totalCents / 100;

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

      {/* Status Warning */}
      {isAbandoned && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          This cart has been marked as abandoned
        </div>
      )}

      {/* Summary Items */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span>¥{subtotal.toFixed(2)}</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>¥{tax.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-¥{discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">¥{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/checkout"
          className={`block w-full py-3 text-center rounded-lg font-semibold transition ${
            isEmpty
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={(e) => isEmpty && e.preventDefault()}
        >
          Proceed to Checkout
        </Link>

        <Link
          href="/shop"
          className="block w-full py-3 text-center rounded-lg font-semibold bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition"
        >
          Continue Shopping
        </Link>

        <button
          onClick={handleClearCart}
          disabled={isEmpty || clearingCart}
          className="w-full py-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearingCart ? 'Clearing...' : 'Clear Cart'}
        </button>
      </div>

      {/* Additional Info */}
      {isEmpty && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-center text-sm text-blue-800">
          Your cart is empty. <Link href="/shop" className="font-semibold hover:underline">Start shopping</Link>
        </div>
      )}
    </div>
  );
};
