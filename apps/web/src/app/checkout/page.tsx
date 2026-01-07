'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi, orderApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './page.module.less';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

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
    } catch (error: any) {
      // 忽略被取消的请求（组件卸载或路由切换时）
      if (error?.canceled || error?.isCanceled || error?.code === 'ERR_CANCELED') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Checkout] 请求被取消，忽略错误');
        }
        return;
      }
      console.error('加载购物车失败:', error);
      setError(error?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckout = async () => {
    // 验证表单
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 创建订单
      const order = await orderApi.create({
        cartId: cart.id,
        shippingAddress: formData,
        paymentMethod
      });

      // 显示成功消息
      router.push(`/orders/${order.id}?success=true`);
    } catch (error: any) {
      setError(error.message || '订单创建失败，请稍后重试');
    } finally {
      setSubmitting(false);
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

  if (!cart || (cart.items && cart.items.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Your cart is empty</h1>
          </div>
          <div className={styles.empty}>
            <Button onClick={() => router.push('/shop')} variant="primary">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Checkout</h1>
        </div>

        {error && (
          <div className={`${styles.notification} ${styles.error}`}>
            {error}
          </div>
        )}

        <div className={styles.content}>
          {/* 左侧：收货信息和支付方式 */}
          <div>
            {/* 收货地址 */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Shipping Address</h2>

              <div className={styles.formGroup}>
                <Input
                  label="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Input
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Input
                    label="Phone *"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <Input
                  label="Address *"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Input
                    label="City *"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Input
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <Input
                  label="Zip Code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>

            {/* 支付方式 */}
            <div className={styles.formSection} style={{ marginTop: '1.5rem' }}>
              <h2 className={styles.sectionTitle}>Payment Method</h2>

              <div className={styles.paymentMethods}>
                <label className={`${styles.methodLabel} ${paymentMethod === 'credit-card' ? styles.methodActive : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit-card"
                    checked={paymentMethod === 'credit-card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Credit / Debit Card</span>
                </label>

                <label className={`${styles.methodLabel} ${paymentMethod === 'paypal' ? styles.methodActive : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>PayPal</span>
                </label>
              </div>
            </div>
          </div>

          {/* 右侧：订单总结 */}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Order Summary</h2>

              <div className={styles.summaryItemsContainer}>
                {cart?.items?.map((item: any) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.itemName}>
                      {item.productName} x {item.quantity}
                    </div>
                    <div className={styles.itemPrice}>
                      ${((item.itemTotal || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Total:</span>
                <span className={styles.totalPrice}>
                  ${((cart?.totalAmount || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                onClick={handleCheckout}
                disabled={submitting}
                variant="primary"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </Button>

              <Button
                onClick={() => router.push('/cart')}
                disabled={submitting}
                variant="secondary"
              >
                Back to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
