'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client';
import {
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM_QUANTITY,
  GET_MY_CART,
} from '@/lib/graphql/cart';

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
}

/**
 * CartItem Component
 * Displays a single item in the shopping cart with options to update quantity or remove
 */
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
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const discount = itemDiscountCents / 100;
  const price = itemTotal / 100;
  const finalPrice = (itemTotal - itemDiscountCents) / 100;

  // Mutation to update quantity
  const [updateQuantity] = useMutation(UPDATE_CART_ITEM_QUANTITY, {
    refetchQueries: [{ query: GET_MY_CART }],
    onCompleted: () => {
      setIsUpdating(false);
    },
    onError: (error) => {
      setIsUpdating(false);
      setLocalQuantity(quantity);
      alert(`Failed to update quantity: ${error.message}`);
    },
  });

  // Mutation to remove item
  const [removeItem] = useMutation(REMOVE_FROM_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
    onError: (error) => {
      alert(`Failed to remove item: ${error.message}`);
    },
  });

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setLocalQuantity(newQuantity);
    setIsUpdating(true);

    await updateQuantity({
      variables: {
        input: {
          skuId,
          quantity: newQuantity,
        },
      },
    });
  };

  const handleRemove = async () => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      await removeItem({
        variables: { skuId },
      });
    }
  };

  const isOutOfStock = stockStatus === 'OUT_OF_STOCK';
  const isLowStock = stockStatus === 'LOW_STOCK';

  return (
    <div className="flex gap-4 border-b pb-4 py-4">
      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{productName}</h3>
        <p className="text-sm text-gray-500">SKU: {skuCode}</p>

        {attributeSnapshot && (
          <p className="text-sm text-gray-600 mt-1">
            {JSON.stringify(JSON.parse(attributeSnapshot), null, 2)}
          </p>
        )}

        {promoCode && (
          <p className="text-sm text-green-600 mt-1">Promo: {promoCode}</p>
        )}

        {/* Stock Status */}
        <div className="mt-2 flex items-center gap-2">
          {isOutOfStock && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle size={16} />
              Out of Stock
            </div>
          )}
          {isLowStock && (
            <div className="flex items-center gap-1 text-yellow-600 text-sm">
              <AlertCircle size={16} />
              Low Stock
            </div>
          )}
        </div>
      </div>

      {/* Quantity Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(localQuantity - 1)}
          disabled={isUpdating || isOutOfStock}
          className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          value={localQuantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          disabled={isUpdating || isOutOfStock}
          className="w-12 text-center border rounded disabled:bg-gray-50 disabled:opacity-50"
        />
        <button
          onClick={() => handleQuantityChange(localQuantity + 1)}
          disabled={isUpdating || isOutOfStock}
          className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {/* Price */}
      <div className="text-right min-w-24">
        <p className="font-semibold text-gray-900">¥{finalPrice.toFixed(2)}</p>
        <p className="text-sm text-gray-500">
          ¥{(unitPrice / 100).toFixed(2)} × {localQuantity}
        </p>
        {discount > 0 && (
          <p className="text-sm text-green-600">
            -¥{discount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isUpdating}
        title="Remove item"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
