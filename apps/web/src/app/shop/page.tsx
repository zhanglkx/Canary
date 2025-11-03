'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '@/lib/graphql/product';
import { ProductCard } from '@/components/features/product-card';
import { AlertCircle, Search, Loader } from 'lucide-react';
import type { Product } from '@/types/ecommerce';

/**
 * Shop/Products Page
 * Displays a catalog of products with filtering and pagination
 */
export default function ShopPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: {
      filter: {
        keyword: keyword || undefined,
        page,
        limit,
        sort: sortBy,
        order: sortOrder,
      },
    },
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const products = data?.products?.data || [];
  const total = data?.products?.total || 0;
  const pages = data?.products?.pages || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop</h1>
          <p className="text-gray-600">
            Discover our collection of products
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Search
              </button>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Newest</option>
                  <option value="basePrice">Price: Low to High</option>
                  <option value="salesCount">Best Sellers</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4 items-start">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Products</h2>
              <p className="text-red-700 mb-4">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-blue-600" size={32} />
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              {keyword ? 'No products found matching your search.' : 'No products available.'}
            </p>
            {keyword && (
              <button
                onClick={() => {
                  setKeyword('');
                  setPage(1);
                }}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  basePrice={product.basePrice}
                  status={product.status}
                  image={product.images?.[0]}
                  category={product.category}
                  skus={product.skus}
                  isAvailable={product.isAvailable}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.min(pages, page + 2))
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-2 rounded-lg transition ${
                          p === page
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className="text-center mt-8 text-gray-600 text-sm">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
            </div>
          </>
        )}
      </div>
    </div>
  );
}
