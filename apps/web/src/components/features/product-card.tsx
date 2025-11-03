'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { ADD_TO_CART, GET_MY_CART } from '@/lib/graphql/cart';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  image?: {
    url: string;
    alt: string;
  };
  category?: {
    name: string;
  };
  skus?: Array<{
    id: string;
    skuCode: string;
    stock: number;
    price: number;
    isActive: boolean;
  }>;
  isAvailable: boolean;
}

/**
 * ProductCard Component
 * Displays a product in a card format with quick add to cart
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  basePrice,
  status,
  image,
  category,
  skus = [],
  isAvailable,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addToCart, { loading: adding }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_MY_CART }],
    onCompleted: () => {
      setQuantity(1);
      alert('Added to cart!');
    },
    onError: (error) => {
      alert(`Failed to add to cart: ${error.message}`);
    },
  });

  const handleAddToCart = async () => {
    if (!skus || skus.length === 0) {
      alert('No SKUs available for this product');
      return;
    }

    // Get the first active SKU
    const activeSku = skus.find((sku) => sku.isActive && sku.stock > 0);
    if (!activeSku) {
      alert('No available SKUs for this product');
      return;
    }

    await addToCart({
      variables: {
        input: {
          skuId: activeSku.id,
          quantity,
        },
      },
    });
  };

  const price = basePrice / 100;
  const isOutOfStock = !isAvailable || (skus?.every((sku) => sku.stock === 0) ?? true);
  const totalStock = skus?.reduce((sum, sku) => sum + sku.stock, 0) ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-100 h-48">
        {image ? (
          <img
            src={image.url}
            alt={image.alt || name}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!isAvailable && (
            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
              Out of Stock
            </span>
          )}
          {category && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {category.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-2">
            {name}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>

        {/* Stock Info */}
        <p className={`text-sm mt-2 ${totalStock > 10 ? 'text-green-600' : totalStock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
          {isOutOfStock ? 'Out of Stock' : `${totalStock} in stock`}
        </p>

        {/* Price */}
        <div className="mt-3 mb-4">
          <p className="text-lg font-bold text-gray-900">¥{price.toFixed(2)}</p>
        </div>

        {/* Quantity Selector & Add to Cart */}
        <div className="flex gap-2">
          {!isOutOfStock && (
            <>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-center border-0 outline-none"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                {adding ? 'Adding...' : 'Add'}
              </button>
            </>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-2 rounded border transition ${
              isFavorited
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'border-gray-300 text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {isOutOfStock && (
          <button className="w-full py-2 border rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">
            Notify Me
          </button>
        )}
      </div>
    </div>
  );
};
