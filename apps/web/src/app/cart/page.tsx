'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_MY_CART } from '@/lib/graphql/cart';
import { useAuth } from '@/lib/auth-context';
import { CartItem } from '@/components/features/cart-item';
import { CartSummary } from '@/components/features/cart-summary';
import { ShoppingCart as CartIcon, AlertCircle } from 'lucide-react';

/**
 * Shopping Cart Page
 * Displays the user's shopping cart with items, totals, and checkout options
 */
export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_MY_CART, {
    skip: !isAuthenticated,
    pollInterval: 5000, // Refetch every 5 seconds to keep cart in sync
  });

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/cart');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Cart</h2>
              <p className="text-red-700 mb-4">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cart = data?.myCart;

  if (!cart || cart.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <CartIcon className="mx-auto mb-4 text-gray-400" size={48} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              You haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <a
              href="/shop"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {/* Abandoned Cart Warning */}
        {cart.isAbandoned && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900">Abandoned Cart</h3>
              <p className="text-sm text-yellow-800">
                This cart hasn't been updated in 24 hours. Items may have been restocked or prices may have changed.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  skuId={item.skuId}
                  productName={item.productName}
                  skuCode={item.skuCode}
                  quantity={item.quantity}
                  unitPrice={item.unitPrice}
                  itemTotal={item.itemTotal}
                  itemDiscountCents={item.itemDiscountCents}
                  promoCode={item.promoCode}
                  stockStatus={item.stockStatus}
                  attributeSnapshot={item.attributeSnapshot}
                />
              ))}
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotalCents={cart.subtotalCents}
              taxCents={cart.taxCents}
              discountCents={cart.discountCents}
              totalCents={cart.totalCents}
              itemCount={cart.items.length}
              isEmpty={cart.isEmpty}
              isAbandoned={cart.isAbandoned}
            />
          </div>
        </div>

        {/* Additional Notes */}
        {cart.items.some((item) => item.stockStatus === 'LOW_STOCK') && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">Low Stock Items</h3>
              <p className="text-sm text-blue-800">
                Some items in your cart are running low on stock. We recommend checking out soon!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
