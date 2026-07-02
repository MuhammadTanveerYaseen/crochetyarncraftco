'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ProductCard';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className="w-full flex-grow py-12 bg-[#FFFDF9] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#5C4033] font-semibold hover:text-[#A855F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all patterns</span>
        </Link>

        <div className="space-y-2 border-b border-[#EEDDCC] pb-6">
          <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#5C4033] tracking-tight flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
            <span>Your Favorite Patterns</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Keep track of the designs you love and build your next crafting project.
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-400">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="font-serif font-bold text-xl text-[#5C4033]">Your favorites list is empty</h2>
            <p className="text-gray-500 text-sm max-w-md text-center">
              Click the heart icon on any pattern in our catalog to save it here for later.
            </p>
            <Link href="/" className="btn-primary text-sm px-6 py-3">
              Browse Patterns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
