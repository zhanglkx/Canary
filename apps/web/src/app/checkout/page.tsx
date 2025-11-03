'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_MY_CART } from '@/lib/graphql/cart';
import { CREATE_ORDER } from '@/lib/graphql/order';
import { useAuth } from '@/lib/auth-context';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types/ecommerce';

/**
 * Checkout Page
 * Handles order creation and payment setup
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    shippingAddress: '',
    recipientName: '',
    recipientPhone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const { data: cartData, loading: cartLoading } = useQuery(GET_MY_CART, {
    skip: !isAuthenticated,
  });

  const [createOrder] = useMutation(CREATE_ORDER, {
    onCompleted: (data) => {
      setOrderCreated(true);
      setCreatedOrderId(data.createOrder.id);
      setTimeout(() => {
        router.push(`/orders/${data.createOrder.id}`);
      }, 2000);
    },
    onError: (error) => {
      setIsSubmitting(false);
      alert(`Failed to create order: ${error.message}`);
    },
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && cartData?.myCart?.isEmpty) {
      router.push('/cart');
    }
  }, [cartData, cartLoading, router]);

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </div>
    );
  }

  const cart = cartData?.myCart;
  if (!cart || cart.isEmpty) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shippingAddress || !formData.recipientName || !formData.recipientPhone) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    await createOrder({
      variables: {
        input: {
          cartId: cart.id,
          shippingAddress: formData.shippingAddress,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          notes: formData.notes || undefined,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Success Message */}
        {orderCreated && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex gap-4 items-start">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-green-900 mb-2">Order Created Successfully!</h2>
              <p className="text-green-700">
                Order ID: {createdOrderId}. Redirecting to order details...
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Recipient Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Address *
                    </label>
                    <textarea
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address, city, state, postal code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSubmitting || orderCreated}
                >
                  {isSubmitting ? 'Creating Order...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.items.map((item: CartItemType) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-900 font-medium">{item.productName}</p>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      ¥{((item.itemTotal - item.itemDiscountCents) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>¥{(cart.subtotalCents / 100).toFixed(2)}</span>
                </div>

                {cart.taxCents > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>¥{(cart.taxCents / 100).toFixed(2)}</span>
                  </div>
                )}

                {cart.discountCents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-¥{(cart.discountCents / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ¥{(cart.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <p>After placing your order, you'll be able to proceed to payment on the order details page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
