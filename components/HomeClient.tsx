'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Search, RotateCcw, Filter, Star, Sparkles, BookOpen, HeartHandshake } from 'lucide-react';
import { graphqlRequest } from '@/lib/graphqlClient';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters
  const categoryParam = searchParams.get('category') || 'all';
  const difficultyParam = searchParams.get('difficulty') || 'all';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  const [products, setProducts] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday']);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 8;

  // Trigger load when parameters change
  useEffect(() => {
    setProducts([]);
    setOffset(0);
    setHasMore(true);
    fetchBatch(0, true);
  }, [categoryParam, difficultyParam, searchParam, sortParam]);

  async function fetchBatch(startOffset: number, isNewQuery: boolean) {
    if (isNewQuery) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const gqlQuery = `
        query GetProducts($category: String, $difficulty: String, $search: String, $sort: String, $limit: Int, $offset: Int) {
          products(category: $category, difficulty: $difficulty, search: $search, sort: $sort, limit: $limit, offset: $offset) {
            _id
            title
            description
            price
            salePrice
            category
            difficulty
            images
            pdfUrl
            featured
          }
        }
      `;

      const data = await graphqlRequest(gqlQuery, {
        category: categoryParam,
        difficulty: difficultyParam,
        search: searchParam,
        sort: sortParam,
        limit: PAGE_SIZE,
        offset: startOffset
      });

      const newProducts = data.products || [];
      
      if (isNewQuery) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      if (newProducts.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.error('Error fetching patterns:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        const query = `
          query GetCategories {
            categories
          }
        `;
        const res = await graphqlRequest(query);
        if (res && res.categories) {
          const defaults = ['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday'];
          const merged = Array.from(new Set([...defaults, ...res.categories]));
          setCategoriesList(merged);
        }
      } catch (err) {
        console.warn("Could not fetch categories list dynamically on homepage:", err);
      }
    }
    loadCategories();
  }, []);

  const handleLoadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchBatch(nextOffset, false);
  };

  // Handle setting filters in URL
  const setUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/');
  };

  const categories = [
    { value: 'all', label: 'All Patterns' },
    ...categoriesList.map(cat => ({
      value: cat,
      label: cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  return (
    <div className="w-full flex-grow select-none animate-fadeIn">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#FAF6EE] via-[#FFFDF9] to-[#FFFDF9] border-b border-[#EEDDCC] py-20 sm:py-24 px-4 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#A855F7]/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-amber-500/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#A855F7]/8 border border-[#A855F7]/15 text-[#A855F7] text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Premium PDF Shop</span>
          </div>
          
          <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-7xl text-[#5C4033] tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Beautiful, Step-by-Step <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#8B5CF6]">Crochet Patterns</span>
            <span className="text-lg sm:text-2xl font-serif font-normal text-gray-500 mt-3 block tracking-normal">designed for creative makers • by Yarn Craft Co</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Start your next creative project today. Our premium digital patterns feature detailed row-by-row instructions, size checklists, and photo guides. Delivered instantly to your inbox.
          </p>

          <div className="flex justify-center flex-wrap gap-4 pt-4 text-xs font-bold text-[#5C4033]">
            <div className="flex items-center gap-1.5 bg-white border border-[#EEDDCC] py-2.5 px-5 rounded-full shadow-xs hover:shadow-sm transition-shadow">
              <BookOpen className="w-4 h-4 text-[#A855F7]" />
              <span>Instant Download</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#EEDDCC] py-2.5 px-5 rounded-full shadow-xs hover:shadow-sm transition-shadow">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Easy-to-Follow Guides</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#EEDDCC] py-2.5 px-5 rounded-full shadow-xs hover:shadow-sm transition-shadow">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span>Help & Maker Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Active Query Info */}
        {searchParam && (
          <div className="bg-[#A855F7]/5 border border-[#A855F7]/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-[#5C4033] text-sm">
              Showing search results for <span className="font-bold text-[#A855F7]">"{searchParam}"</span> ({products.length} found)
            </p>
            <button 
              onClick={() => setUrlParam('search', '')}
              className="text-xs text-[#A855F7] font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear search
            </button>
          </div>
        )}

        {/* Filter Widget Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FBF7F0] p-4 rounded-3xl border border-[#EEDDCC]">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setUrlParam('category', cat.value)}
                className={`py-1.5 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  categoryParam === cat.value
                    ? 'bg-[#A855F7] text-white border-[#A855F7] shadow-sm'
                    : 'bg-white text-[#5C4033] border-[#EEDDCC] hover:bg-[#FFFDF9]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Difficulty and Sort Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Difficulty Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#5C4033]" />
              <select
                value={difficultyParam}
                onChange={(e) => setUrlParam('difficulty', e.target.value)}
                className="bg-white border border-[#EEDDCC] text-[#5C4033] rounded-xl py-1.5 px-3 pr-8 text-xs font-semibold outline-none focus:border-[#A855F7] cursor-pointer"
              >
                {difficulties.map((diff) => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortParam}
              onChange={(e) => setUrlParam('sort', e.target.value)}
              className="bg-white border border-[#EEDDCC] text-[#5C4033] rounded-xl py-1.5 px-3 pr-8 text-xs font-semibold outline-none focus:border-[#A855F7] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Catalog Output */}
        {loading ? (
          /* Grid Skeleton Loader */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-[#EEDDCC] rounded-3xl p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-2xl w-full" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded-md w-1/3" />
                  <div className="h-5 bg-gray-100 rounded-md w-3/4" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-gray-100 rounded-md w-1/4" />
                  <div className="h-10 bg-gray-100 rounded-2xl w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-red-100 rounded-3xl space-y-4">
            <p className="text-red-500 font-semibold">Error: {error}</p>
            <button onClick={handleClearFilters} className="btn-secondary text-xs">Try Resetting Filters</button>
          </div>
        ) : products.length === 0 ? (
          /* Empty Catalog screen */
          <div className="text-center py-20 bg-white border border-[#EEDDCC] rounded-3xl space-y-6">
            <div className="mx-auto w-16 h-16 bg-[#FBF7F0] border border-[#EEDDCC] rounded-full flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-gray-400" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#5C4033]">No Patterns Found</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We couldn't find any crochet patterns matching your current filter selections. Try broadening your filters or clearing search queries.
              </p>
            </div>
            <button 
              onClick={handleClearFilters}
              className="btn-primary py-2 px-6 text-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Products Grid Output */
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-primary min-w-[200px] flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More Patterns</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center bg-[#FFFDF9] min-h-[500px]">
        <div className="spinner" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
