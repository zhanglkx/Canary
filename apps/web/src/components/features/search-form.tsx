'use client';

import { useState, FormEvent } from 'react';
import { searchApi } from '@/lib/api';
import { Search } from 'lucide-react';
import styles from './search-form.module.less';

export function SearchForm() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await searchApi.search({ query, limit: 10 });
      setResults(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch} className={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索..."
          className={styles.input}
        />
        <Search className={styles.searchIcon} size={18} />
      </form>

      {loading && (
        <div className={styles.loading}>搜索中...</div>
      )}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((result, index) => (
            <div key={index} className={styles.resultItem}>
              <p className={styles.resultTitle}>{result.title || result.name || result.content}</p>
              <p className={styles.resultType}>{result.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
