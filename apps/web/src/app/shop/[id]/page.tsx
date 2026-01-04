'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productApi, cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Product } from '@/types/ecommerce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './page.module.less';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const productId = params.id as string;

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await productApi.getById(productId);
      setProduct(data);
      if (data.skus && data.skus.length > 0) {
        setSelectedSku(data.skus[0].id);
      }
    } catch (error) {
      console.error('加载产品失败:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/shop');
      return;
    }

    if (!selectedSku || quantity < 1) {
      setError('Please select a valid quantity');
      return;
    }

    try {
      setAddingToCart(true);
      setError('');
      setSuccess('');

      await cartApi.addItem(selectedSku, quantity);

      setSuccess('Added to cart successfully!');
      setQuantity(1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
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

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Product not found</h1>
          <Button onClick={() => router.push('/shop')} variant="primary">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const selectedSkuObj = product.skus?.find((s: any) => s.id === selectedSku);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button className={styles.backButton} onClick={() => router.push('/shop')}>
          ← Back to Shop
        </button>

        <div className={styles.content}>
          {/* 左侧：产品图片 */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0].url} alt={product.name} />
              ) : (
                <div className={styles.noImage}>No image</div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className={styles.thumbnails}>
                {product.images.map((img: any, idx: number) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`${product.name} ${idx + 1}`}
                    className={styles.thumbnail}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右侧：产品信息 */}
          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.description}>{product.description}</div>

            {/* SKU 选择 */}
            {product.skus && product.skus.length > 0 && (
              <div className={styles.skuSection}>
                <label className={styles.label}>Select Variant:</label>
                <div className={styles.skuOptions}>
                  {product.skus.map((sku: any) => (
                    <button
                      key={sku.id}
                      className={`${styles.skuOption} ${selectedSku === sku.id ? styles.selected : ''}`}
                      onClick={() => setSelectedSku(sku.id)}
                      disabled={sku.stock <= 0}
                    >
                      {sku.name} - ${(sku.price / 100).toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 价格和库存 */}
            {selectedSkuObj && (
              <div className={styles.priceSection}>
                <div className={styles.price}>
                  ${(selectedSkuObj.price / 100).toFixed(2)}
                </div>
                <div className={selectedSkuObj.stock > 0 ? styles.inStock : styles.outOfStock}>
                  {selectedSkuObj.stock > 0 ? `${selectedSkuObj.stock} in stock` : 'Out of stock'}
                </div>
              </div>
            )}

            {/* 数量选择 */}
            {selectedSkuObj && selectedSkuObj.stock > 0 && (
              <div className={styles.quantitySection}>
                <label className={styles.label}>Quantity:</label>
                <div className={styles.quantityControl}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={styles.quantityButton}
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={selectedSkuObj.stock}
                    className={styles.quantityInput}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedSkuObj.stock, quantity + 1))}
                    className={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 错误消息 */}
            {error && (
              <div className={`${styles.notification} ${styles.error}`}>
                {error}
              </div>
            )}

            {/* 成功消息 */}
            {success && (
              <div className={`${styles.notification} ${styles.success}`}>
                ✓ {success}
              </div>
            )}

            {/* 操作按钮 */}
            <div className={styles.actions}>
              {selectedSkuObj && selectedSkuObj.stock > 0 ? (
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  variant="primary"
                  className={styles.fullWidth}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              ) : (
                <Button disabled className={styles.fullWidth}>
                  Out of Stock
                </Button>
              )}
            </div>

            {/* 产品属性 */}
            {(product as any).attributes && (product as any).attributes.length > 0 && (
              <div className={styles.attributes}>
                <h3 className={styles.attributesTitle}>Specifications:</h3>
                {(product as any).attributes.map((attr: any) => (
                  <div key={attr.id} className={styles.attribute}>
                    <span className={styles.attributeName}>{attr.name}:</span>
                    <span className={styles.attributeValue}>{attr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
