'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './cart-summary.module.scss';

interface CartSummaryProps {
  cart: any;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ cart }) => {
  const router = useRouter();

  const subtotal = (cart.totalAmount || 0) / 100;
  const discount = (cart.totalDiscountCents || 0) / 100;
  const total = subtotal - discount;

  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>Order Summary</h2>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.discountRow}>
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.totalRow}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/checkout')}
        className={styles.checkoutButton}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};
