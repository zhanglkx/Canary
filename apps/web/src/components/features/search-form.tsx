'use client';

import { useState, FormEvent } from 'react';
import { searchApi } from '@/lib/api';
import { Search } from 'lucide-react';

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
    <div>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
      </form>

      {loading && (
        <div className="mt-4 text-center text-gray-500">搜索中...</div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="font-medium">{result.title || result.name || result.content}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
