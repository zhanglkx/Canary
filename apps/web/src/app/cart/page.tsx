'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CartItem } from '@/components/features/cart-item';
import { CartSummary } from '@/components/features/cart-summary';
import { ShoppingCart as CartIcon, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/cart');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartApi.get();
      setCart(data);
    } catch (err: any) {
      setError(err.message || '加载购物车失败');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => loadCart()}
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

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <CartIcon className="mx-auto mb-4 text-gray-400" size={48} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">
              You haven't added any items to your cart yet.
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: any) => (
              <CartItem key={item.id} {...item} onUpdate={loadCart} />
            ))}
          </div>

          <div>
            <CartSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}
