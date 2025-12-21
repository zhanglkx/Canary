'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi, orderApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (error) {
      console.error('加载购物车失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setSubmitting(true);
      await orderApi.create({ cartId: cart.id });
      alert('订单创建成功！');
      router.push('/orders');
    } catch (error: any) {
      alert(error.message || '订单创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          {cart?.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between py-2">
              <span>{item.productName} x {item.quantity}</span>
              <span>${(item.itemTotal / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${((cart?.totalAmount || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={submitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
