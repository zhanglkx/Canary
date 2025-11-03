'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_MY_ORDERS, GET_MY_ORDER_STATS } from '@/lib/graphql/order';
import { useAuth } from '@/lib/auth-context';
import { Package, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

/**
 * Orders Page
 * Displays user's order history and statistics
 */
export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);

  const { data: orderData, loading: ordersLoading, error: ordersError } = useQuery(GET_MY_ORDERS, {
    skip: !isAuthenticated,
    variables: { skip, take },
  });

  const { data: statsData, loading: statsLoading } = useQuery(GET_MY_ORDER_STATS, {
    skip: !isAuthenticated,
  });

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || ordersLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Orders</h2>
              <p className="text-red-700">{ordersError.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orders = orderData?.myOrders?.orders || [];
  const total = orderData?.myOrders?.total || 0;
  const stats = statsData?.myOrderStats;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your purchases</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">¥{(stats.totalSpent / 100).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Delivered</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.deliveredOrders}</p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 text-lg mb-4">No orders yet</p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order Number</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ¥{(order.totalCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > take && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setSkip(Math.max(0, skip - take))}
              disabled={skip === 0}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {Math.floor(skip / take) + 1} of {Math.ceil(total / take)}
            </span>
            <button
              onClick={() => setSkip(skip + take)}
              disabled={skip + take >= total}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
