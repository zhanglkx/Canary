'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CartItem } from '@/components/features/cart-item';
import { CartSummary } from '@/components/features/cart-summary';
import { ShoppingCart as CartIcon, AlertCircle } from 'lucide-react';
import styles from './page.module.less';

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
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <AlertCircle className="flex-shrink-0" size={24} style={{ color: '@error-color' }} />
            <div>
              <h2 className={styles.errorTitle}>Error Loading Cart</h2>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={() => loadCart()}
                className={styles.retryButton}
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
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyContainer}>
            <CartIcon className={styles.emptyIcon} size={48} />
            <h1 className={styles.emptyTitle}>Your Cart is Empty</h1>
            <p className={styles.emptyDescription}>
              You haven't added any items to your cart yet.
            </p>
            <a
              href="/shop"
              className={styles.shopButton}
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Shopping Cart</h1>

        <div className={styles.content}>
          <div className={styles.itemsContainer}>
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
