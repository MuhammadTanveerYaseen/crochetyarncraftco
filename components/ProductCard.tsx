'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Star, Flame, Heart } from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    description?: string;
    price: number;
    salePrice?: number;
    category: string;
    difficulty: string;
    images: string[];
    pdfUrl: string;
    featured?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [hovered, setHovered] = useState(false);
  const isFavorite = isFavorited(product._id);

  const price = product.price;
  const salePrice = product.salePrice;
  const isSale = salePrice !== undefined && salePrice < price;
  
  // Calculate discount percentage
  const discountPercent = isSale 
    ? Math.round(((price - (salePrice ?? price)) / price) * 100) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page when clicking "Add to Cart"
    e.stopPropagation();
    
    const cartItem: CartItem = {
      _id: product._id,
      title: product.title,
      price: product.price,
      salePrice: product.salePrice,
      images: product.images,
      category: product.category,
      pdfUrl: product.pdfUrl
    };
    addToCart(cartItem);
  };

  // Get difficulty badge color style
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Select which image to show based on hover
  const displayImage = (hovered && product.images.length > 1) 
    ? product.images[1] 
    : (product.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80');

  return (
    <Link 
      href={`/products/${product._id}`}
      className="group bg-white rounded-none border border-gray-200 overflow-hidden flex flex-col h-full hover-scale relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badges Container */}
      <div className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 flex flex-col gap-1 z-10">
        {product.featured && (
          <span className="bg-gray-950 text-white text-[8px] sm:text-[9px] font-bold py-0.5 sm:py-1 px-1.5 sm:px-2.5 rounded-none flex items-center gap-1 border border-white/10 uppercase tracking-wider">
            <Flame className="w-2.5 h-2.5 text-[#A855F7] fill-[#A855F7]" />
            <span>Featured</span>
          </span>
        )}
        {isSale && (
          <span className="bg-[#A855F7] text-white text-[8px] sm:text-[9px] font-black py-0.5 sm:py-1 px-1.5 sm:px-2.5 rounded-none border border-[#A855F7]/10 uppercase tracking-wider text-center">
            -{discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(product);
        }}
        className="absolute top-1.5 sm:top-3 right-1.5 sm:right-3 p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-xs border border-gray-200 rounded-none text-gray-900 hover:text-rose-500 transition-all z-10 hover:scale-110 shadow-sm flex items-center justify-center cursor-pointer"
        aria-label="Toggle Favorite"
      >
        <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${isFavorite ? 'text-rose-500 fill-rose-500 scale-110' : ''}`} />
      </button>

      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-200">
        <Image
          src={displayImage}
          alt={product.title}
          fill
          sizes="(max-w-7xl) 25vw, (max-w-md) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={product.featured}
        />
      </div>

      {/* Product Metadata & Details */}
      <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div className="space-y-1 sm:space-y-2">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 tracking-wider uppercase">
              {product.category}
            </span>
            <span className={`text-[8px] sm:text-[10px] font-semibold py-0.5 px-1.5 sm:px-2 rounded-none border ${getDifficultyColor(product.difficulty)}`}>
              {product.difficulty}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-500">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-0.5">4.9</span>
          </div>

          {/* Title */}
          <h3 className="font-sans font-bold text-gray-900 text-xs sm:text-base group-hover:text-[#A855F7] transition-colors leading-tight line-clamp-2">
            {product.title}
          </h3>
        </div>

        {/* Pricing and Action Button */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold uppercase leading-none">Instant PDF</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black text-[#A855F7]">
                ${(salePrice ?? price).toFixed(2)}
              </span>
              {isSale && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            className="p-2 sm:p-3 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-none shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
