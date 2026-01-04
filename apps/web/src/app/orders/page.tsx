'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import styles from './page.module.less';

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const showSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      const data = await orderApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return styles.pending;
      case 'processing':
        return styles.processing;
      case 'completed':
        return styles.completed;
      case 'cancelled':
        return styles.cancelled;
      default:
        return styles.pending;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Orders</h1>
          {showSuccess && (
            <span className={styles.success}>✓ Order placed successfully!</span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <p>You haven't placed any orders yet</p>
            <Button onClick={() => router.push('/shop')} variant="primary">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div
                  className={styles.orderHeader}
                  onClick={() => toggleOrderExpand(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.orderInfo}>
                    <div className={styles.orderNumber}>
                      Order #{order.orderNumber}
                    </div>
                    <div className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(order.status)}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>

                {expandedOrders.has(order.id) && (
                  <div className={styles.orderContent}>
                    <div className={styles.itemsList}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Items:
                      </h4>
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className={styles.item}>
                          <div className={styles.itemName}>
                            {item.productName} x {item.quantity}
                          </div>
                          <div className={styles.itemPrice}>
                            ${((item.itemTotal || 0) / 100).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.orderFooter}>
                  <div className={styles.totalAmount}>
                    <span className={styles.totalLabel}>Total Amount</span>
                    <span className={styles.totalPrice}>
                      ${((order.totalAmount || 0) / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.actions}>
                    <Button
                      onClick={() => toggleOrderExpand(order.id)}
                      variant="secondary"
                      className={styles.button}
                    >
                      {expandedOrders.has(order.id) ? 'Hide Details' : 'View Details'}
                    </Button>
                    <Button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      variant="primary"
                      className={styles.button}
                    >
                      Track Order
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
