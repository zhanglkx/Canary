'use client';

import React, { useState } from 'react';
import { cartApi } from '@/lib/api';
import { ShoppingCart } from 'lucide-react';
import styles from './product-card.module.less';

interface ProductCardProps {
  product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      // 假设产品有默认的 SKU
      const skuId = product.skus?.[0]?.id || product.id;
      await cartApi.addItem(skuId, 1);
      alert('已添加到购物车');
    } catch (error: any) {
      alert(error.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const price = (product.basePrice || 0) / 100;
  const image = product.images?.[0]?.url || '/placeholder.png';

  return (
    <div className={styles.card}>
      <img
        src={image}
        alt={product.name}
        className={styles.image}
      />
      <div className={styles.content}>
        <h3 className={styles.productName}>{product.name}</h3>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>${price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={adding || !product.isAvailable}
            className={styles.addButton}
          >
            <ShoppingCart size={18} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
