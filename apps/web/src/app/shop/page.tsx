'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';
import { ProductCard } from '@/components/features/product-card';
import { AlertCircle, Search, Loader } from 'lucide-react';
import styles from './page.module.less';

export default function ShopPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, [page, limit, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll({
        keyword: keyword || undefined,
        page,
        limit,
      });
      setProducts(response.data || []);
      setTotal(response.total || 0);
      setPages(response.pages || 0);
    } catch (err: any) {
      setError(err.message || '加载产品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <AlertCircle size={24} style={{ color: '@error-color' }} />
            <p className={styles.errorText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Shop</h1>
          <p className={styles.subtitle}>Discover our collection of products</p>
        </div>

        <div className={styles.searchForm}>
          <form onSubmit={handleSearch} className={styles.form}>
            <div className={styles.searchRow}>
              <div className={styles.searchInputContainer}>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search products..."
                  className={styles.searchInput}
                />
                <Search className={styles.searchIcon} size={20} />
              </div>
              <button
                type="submit"
                className={styles.searchButton}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader className={styles.loader} size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            No products found
          </div>
        ) : (
          <>
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {pages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.paginationButton}
                >
                  Previous
                </button>
                <span className={styles.paginationInfo}>
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
