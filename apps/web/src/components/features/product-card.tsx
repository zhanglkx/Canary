'use client';

import React, { useState } from 'react';
import { cartApi } from '@/lib/api';
import { ShoppingCart } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={image}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">${price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={adding || !product.isAvailable}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
