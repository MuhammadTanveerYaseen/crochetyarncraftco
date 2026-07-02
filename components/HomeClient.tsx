'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Search, RotateCcw, Filter, Star, Sparkles, BookOpen, HeartHandshake, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [promotedProducts, setPromotedProducts] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
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
    async function loadPromoted() {
      try {
        const query = `
          query GetPromoted {
            products(runAd: true, limit: 4) {
              _id
              title
              price
              salePrice
              category
              difficulty
              images
              pdfUrl
              featured
              runAd
            }
          }
        `;
        const res = await graphqlRequest(query);
        if (res && res.products) {
          setPromotedProducts(res.products);
        }
      } catch (err) {
        console.warn("Could not load promoted ads:", err);
      }
    }
    loadCategories();
    loadPromoted();
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
      <section className="bg-gradient-to-b from-[#F9FAFB] to-white border-b border-gray-200 py-8 sm:py-20 px-2 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#A855F7]/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-amber-500/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10">
          {/* Left Text Column (renders at the top) */}
          <div className="lg:col-span-7 text-left space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-1 bg-[#A855F7]/8 border border-[#A855F7]/15 text-[#A855F7] text-[9px] sm:text-xs font-black px-2.5 sm:px-4 py-1 sm:py-2 rounded-full uppercase tracking-widest shadow-xs">
              <Sparkles className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 text-[#A855F7]" />
              <span>Premium PDF Shop</span>
            </div>
            
            <h1 className="font-sans font-black text-2xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-[1.1] sm:leading-[1.05]">
              Beautiful, Step-by-Step <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#8B5CF6]">Crochet Patterns</span>
              <span className="block text-xs sm:text-xl font-sans font-normal text-gray-500 mt-1 sm:mt-2 tracking-normal">designed for makers • by Yarn Craft Co</span>
            </h1>
            
            <p className="text-xs sm:text-base text-gray-600 leading-relaxed font-medium">
              <span className="inline sm:hidden">Detailed step-by-step PDF patterns, delivered instantly.</span>
              <span className="hidden sm:inline">Start your next creative project today. Our premium digital patterns feature detailed row-by-row instructions, size checklists, and photo guides. Delivered instantly to your inbox.</span>
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-3 text-[9px] sm:text-xs font-bold text-gray-900">
              <div className="flex items-center gap-1 bg-white border border-gray-200 py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-none shadow-xs hover:shadow-sm transition-shadow">
                <BookOpen className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#A855F7]" />
                <span>Instant Download</span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-gray-200 py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-none shadow-xs hover:shadow-sm transition-shadow">
                <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 fill-amber-500" />
                <span>Easy Guides</span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-gray-200 py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-none shadow-xs hover:shadow-sm transition-shadow">
                <HeartHandshake className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500" />
                <span>Maker Support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Promoted Ad Spotlight (renders below text on mobile) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            {promotedProducts.length > 0 ? (
              (() => {
                const ad = promotedProducts[currentAdIndex];
                const hasSale = ad.salePrice && ad.salePrice < ad.price;
                const totalAds = promotedProducts.length;

                return (
                  <div className="w-full max-w-sm bg-white border border-gray-200 rounded-none p-5 shadow-lg relative flex flex-col gap-4 animate-scaleUp overflow-hidden group">
                    <div className="relative w-full aspect-square overflow-hidden border border-gray-200 bg-gray-50">
                      <Link href={`/products/${ad._id}`} className="block w-full h-full relative">
                        <Image 
                          src={ad.images?.[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'} 
                          alt={ad.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      </Link>

                      {/* Slider Controls Inside Image */}
                      {totalAds > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentAdIndex((prev) => (prev === 0 ? totalAds - 1 : prev - 1));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-100 transition-colors shadow-md rounded-none cursor-pointer z-20"
                            aria-label="Previous slide"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentAdIndex((prev) => (prev === totalAds - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-100 transition-colors shadow-md rounded-none cursor-pointer z-20"
                            aria-label="Next slide"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Index Indicator inside Image (bottom center) */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] font-black px-2.5 py-1 tracking-wider uppercase select-none z-20">
                            {currentAdIndex + 1} / {totalAds}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ad.category}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <span className="text-[9px] text-[#A855F7] font-extrabold uppercase bg-[#A855F7]/10 px-2.5 py-0.5 rounded-full">{ad.difficulty}</span>
                      </div>

                      <Link href={`/products/${ad._id}`} className="hover:underline block">
                        <h3 className="font-sans font-black text-gray-900 text-lg line-clamp-1">
                          {ad.title}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-[#A855F7]">
                          ${(ad.salePrice ?? ad.price).toFixed(2)}
                        </span>
                        {hasSale && (
                          <span className="text-xs text-gray-400 line-through">
                            ${ad.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link 
                      href={`/products/${ad._id}`}
                      className="btn-primary text-center py-3 text-xs font-black uppercase tracking-wider rounded-none shadow-md cursor-pointer block hover:bg-[#9333EA] transition-all"
                    >
                      View Pattern
                    </Link>
                  </div>
                );
              })()
            ) : (
              <div className="w-full max-w-sm bg-white border border-[#EEDDCC] rounded-3xl p-5 shadow-lg relative flex flex-col gap-4 overflow-hidden">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-[#EEDDCC]/50 bg-[#FBF7F0]">
                  <Image 
                    src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80" 
                    alt="Yarn Craft Co Crochet Hooks"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Featured Spotlight</span>
                  <h3 className="font-serif font-black text-[#5C4033] text-lg">Claim Your Free PDF Gift</h3>
                  <p className="text-xs text-gray-500">Register or sign up as a maker to download our starter crochet patterns list free.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promoted Patterns Ads Section */}
      {promotedProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8 pt-8 animate-fadeIn">
          <div className="bg-gradient-to-r from-[#A855F7]/10 via-[#FAF6EE]/50 to-amber-500/5 border border-gray-200 rounded-none p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                <h2 className="font-sans font-black text-xl md:text-2xl text-gray-900">
                  Featured Collections & Deals
                </h2>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Special returns and handpicked pattern deals running today.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
              {promotedProducts.map((p) => (
                <div key={p._id} className="relative">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Browse Catalog Section */}
      <section className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Active Query Info */}
        {searchParam && (
          <div className="bg-[#A855F7]/5 border border-[#A855F7]/10 rounded-none p-4 flex items-center justify-between gap-4">
            <p className="text-gray-900 text-sm">
              Showing search results for <span className="font-bold text-[#A855F7]">"{searchParam}"</span> ({products.length} found)
            </p>
            <button 
              onClick={() => setUrlParam('search', '')}
              className="text-xs text-[#A855F7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear search
            </button>
          </div>
        )}

        {/* Filter Widget Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50 p-4 rounded-none border border-gray-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setUrlParam('category', cat.value)}
                className={`py-1.5 px-4 rounded-none text-xs font-semibold whitespace-nowrap transition-all border ${
                  categoryParam === cat.value
                    ? 'bg-[#A855F7] text-white border-[#A855F7] shadow-sm cursor-pointer'
                    : 'bg-white text-gray-900 border-gray-200 hover:bg-white cursor-pointer'
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
              <Filter className="w-3.5 h-3.5 text-gray-950" />
              <select
                value={difficultyParam}
                onChange={(e) => setUrlParam('difficulty', e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 rounded-none py-1.5 px-3 pr-8 text-xs font-semibold outline-none focus:border-[#A855F7] cursor-pointer"
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
              className="bg-white border border-gray-200 text-gray-900 rounded-none py-1.5 px-3 pr-8 text-xs font-semibold outline-none focus:border-[#A855F7] cursor-pointer"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-none p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-none w-full" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded-md w-1/3" />
                  <div className="h-5 bg-gray-100 rounded-md w-3/4" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-gray-100 rounded-md w-1/4" />
                  <div className="h-10 bg-gray-100 rounded-none w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-red-100 rounded-none space-y-4">
            <p className="text-red-500 font-semibold">Error: {error}</p>
            <button onClick={handleClearFilters} className="btn-secondary text-xs">Try Resetting Filters</button>
          </div>
        ) : products.length === 0 ? (
          /* Empty Catalog screen */
          <div className="text-center py-20 bg-white border border-gray-200 rounded-none space-y-6">
            <div className="mx-auto w-16 h-16 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-gray-400" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-sans font-bold text-xl text-gray-900">No Patterns Found</h3>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
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
