'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { cartApi } from '@/lib/api';

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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{productName}</h3>
          <p className="text-sm text-gray-600">SKU: {skuCode}</p>
          {attributeSnapshot && (
            <p className="text-sm text-gray-600">{attributeSnapshot}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={isUpdating || localQuantity <= 1}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              -
            </button>
            <span className="w-12 text-center">{localQuantity}</span>
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={isUpdating}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              +
            </button>
          </div>

          <div className="text-right min-w-[100px]">
            <p className="font-semibold text-gray-900">${finalPrice.toFixed(2)}</p>
            {discount > 0 && (
              <p className="text-sm text-green-600">-${discount.toFixed(2)}</p>
            )}
          </div>

          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {stockStatus !== 'IN_STOCK' && (
        <div className="mt-4 flex items-center gap-2 text-yellow-600">
          <AlertCircle size={16} />
          <span className="text-sm">Limited stock</span>
        </div>
      )}
    </div>
  );
};
