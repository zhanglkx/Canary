'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { cartApi } from '@/lib/api';
import styles from './cart-item.module.scss';

interface CartItemProps {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  itemDiscountCents: number;
  promoCode?: string;
  stockStatus: string;
  attributeSnapshot?: string;
  onUpdate?: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  skuId,
  productName,
  skuCode,
  quantity,
  unitPrice,
  itemTotal,
  itemDiscountCents,
  promoCode,
  stockStatus,
  attributeSnapshot,
  onUpdate,
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const discount = itemDiscountCents / 100;
  const price = itemTotal / 100;
  const finalPrice = (itemTotal - itemDiscountCents) / 100;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setIsUpdating(true);
      await cartApi.updateItem(id, newQuantity);
      setLocalQuantity(newQuantity);
      onUpdate?.();
    } catch (error) {
      console.error('更新数量失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUpdating(true);
      await cartApi.removeItem(id);
      onUpdate?.();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <h3 className={styles.productName}>{productName}</h3>
          <p className={styles.skuCode}>SKU: {skuCode}</p>
          {attributeSnapshot && (
            <p className={styles.attributeSnapshot}>{attributeSnapshot}</p>
          )}
        </div>

        <div className={styles.rightSection}>
          <div className={styles.quantityControls}>
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={isUpdating || localQuantity <= 1}
              className={styles.quantityButton}
            >
              -
            </button>
            <span className={styles.quantityValue}>{localQuantity}</span>
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={isUpdating}
              className={styles.quantityButton}
            >
              +
            </button>
          </div>

          <div className={styles.priceSection}>
            <p className={styles.finalPrice}>${finalPrice.toFixed(2)}</p>
            {discount > 0 && (
              <p className={styles.discount}>-${discount.toFixed(2)}</p>
            )}
          </div>

          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className={styles.removeButton}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {stockStatus !== 'IN_STOCK' && (
        <div className={styles.stockWarning}>
          <AlertCircle size={16} />
          <span className={styles.stockWarningText}>Limited stock</span>
        </div>
      )}
    </div>
  );
};
