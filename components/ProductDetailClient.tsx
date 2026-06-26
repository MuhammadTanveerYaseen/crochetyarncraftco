'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Star, 
  ChevronRight, 
  ShieldCheck, 
  FileDown, 
  Check, 
  Clock,
  Award
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';

interface ProductDetailClientProps {
  product: any;
  similarProducts: any[];
}

export default function ProductDetailClient({ product, similarProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Check if item is already in cart
  const inCart = !!cart.find(item => item._id === product._id);

  const handleAddToCart = () => {
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

  const price = product.price;
  const salePrice = product.salePrice;
  const isSale = salePrice !== undefined && salePrice < price;
  const discountPercent = isSale ? Math.round(((price - (salePrice ?? price)) / price) * 100) : 0;

  return (
    <div className="w-full flex-grow select-none py-10 bg-[#FFFDF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#5C4033] font-semibold hover:text-[#A855F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all patterns</span>
        </Link>

        {/* Product Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Gallery (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-[#EEDDCC] bg-[#FBF7F0]">
              <Image
                src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80'}
                alt={product.title}
                fill
                priority
                className="object-cover"
              />
            </div>
            
            {/* Image Selector Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx 
                        ? 'border-[#A855F7]' 
                        : 'border-[#EEDDCC] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Specs (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider capitalize">
                  {product.category}
                </span>
                <span className="bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#A855F7]/20 uppercase">
                  {product.difficulty} Level
                </span>
              </div>

              <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#5C4033] tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-semibold mt-0.5">
                  4.9 (42 reviews)
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-[#FBF7F0] border border-[#EEDDCC] rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pattern Price (PDF)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[#A855F7]">
                    ${(salePrice ?? price).toFixed(2)}
                  </span>
                  {isSale && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ${price.toFixed(2)}
                      </span>
                      <span className="bg-red-100 text-red-800 text-[10px] font-black py-0.5 px-2 rounded-full border border-red-200">
                        SAVE {discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-medium block">Delivery</span>
                <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> Instant download
                </span>
              </div>
            </div>

            {/* Add to Cart CTA */}
            <div className="space-y-3">
              {inCart ? (
                <button
                  onClick={() => router.push('/')}
                  className="w-full btn-secondary text-center py-3.5 text-base flex items-center justify-center gap-2 bg-[#FBF7F0] hover:bg-[#EEDDCC]/25 cursor-pointer"
                >
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>In Your Cart - Browse More</span>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full btn-primary py-3.5 text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add PDF Pattern to Cart</span>
                </button>
              )}

              <p className="text-[10px] text-center text-gray-500 leading-normal px-2">
                This is a digital pattern download. You will **NOT** receive a physical finished item. Access links are delivered in PDF format instantly.
              </p>
            </div>

            <div className="border-t border-[#EEDDCC] pt-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-[#A855F7] flex-shrink-0" />
                <span>**Printable PDF**: Standard instructions, charts, and materials table.</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#A855F7] flex-shrink-0" />
                <span>**Verified Pattern**: Tested and reviewed by crochet editors.</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-[#EEDDCC] pt-6 space-y-3">
              
              <details className="group border border-[#EEDDCC] rounded-2xl bg-white overflow-hidden transition-all duration-300" open>
                <summary className="flex items-center justify-between p-4 font-serif font-bold text-[#5C4033] text-sm cursor-pointer select-none hover:bg-[#FBF7F0]">
                  <span>Description & Details</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <div className="p-4 pt-0 border-t border-[#FFF8EF] text-sm text-gray-600 leading-relaxed space-y-2">
                  <p>{product.description}</p>
                  {product.size && (
                    <p className="text-xs mt-2 text-gray-500">
                      **Finished Size**: {product.size}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    **Available Languages**: {product.languages?.join(', ') || 'English'}
                  </p>
                </div>
              </details>

              {product.materials && product.materials.length > 0 && (
                <details className="group border border-[#EEDDCC] rounded-2xl bg-white overflow-hidden transition-all duration-300">
                  <summary className="flex items-center justify-between p-4 font-serif font-bold text-[#5C4033] text-sm cursor-pointer select-none hover:bg-[#FBF7F0]">
                    <span>Materials Needed</span>
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                  </summary>
                  <div className="p-4 pt-0 border-t border-[#FFF8EF]">
                    <ul className="space-y-2 mt-2">
                      {product.materials.map((mat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 leading-tight">
                          <span className="text-[#A855F7] text-sm leading-none">•</span>
                          <span>{mat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              <details className="group border border-[#EEDDCC] rounded-2xl bg-white overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between p-4 font-serif font-bold text-[#5C4033] text-sm cursor-pointer select-none hover:bg-[#FBF7F0]">
                  <span>How Downloads Work & FAQ</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <div className="p-4 pt-0 border-t border-[#FFF8EF] text-xs text-gray-600 space-y-3 leading-relaxed">
                  <p className="mt-2">
                    **Q: How do I open the pattern?**<br />
                    A: Immediately after checkout, you will see a success screen with download links. Additionally, we will email you the download links. The files are standard PDF format, viewable on phones, tablets, or computers.
                  </p>
                  <p>
                    **Q: Can I sell items made from this pattern?**<br />
                    A: Yes! You are welcome to sell finished plushies/products made from this design, provided you credit "Yarn Craft Co" as the designer. Reselling or distributing the PDF file itself is strictly prohibited.
                  </p>
                </div>
              </details>

            </div>

          </div>
        </div>

        {/* Similar Products Recommendation */}
        {similarProducts.length > 0 && (
          <div className="border-t border-[#EEDDCC] pt-12 space-y-6">
            <h2 className="font-serif font-bold text-2xl text-[#5C4033]">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
