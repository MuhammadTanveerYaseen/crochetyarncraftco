'use client';

import React, { useState, useEffect } from 'react';
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
  Award,
  Plus,
  Gift,
  Heart,
  Sparkles,
  ThumbsUp
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ProductCard';
import { graphqlRequest } from '@/lib/graphqlClient';

interface ProductDetailClientProps {
  product: any;
  similarProducts: any[];
  promotedProducts?: any[];
}

export default function ProductDetailClient({ product, similarProducts, promotedProducts = [] }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, addMultipleToCart, cart, showToast } = useCart();
  const { toggleFavorite, isFavorited } = useFavorites();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isFavorite = isFavorited(product._id);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const fetchReviews = async () => {
    try {
      const query = `
        query GetProductReviews($productId: ID!) {
          reviews(productId: $productId) {
            _id
            name
            rating
            comment
            helpfulCount
            createdAt
          }
        }
      `;
      const data = await graphqlRequest(query, { productId: product._id });
      if (data && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product._id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    setReviewSubmitting(true);
    try {
      const mutation = `
        mutation SubmitProductReview($productId: ID!, $name: String!, $rating: Int!, $comment: String!) {
          createReview(productId: $productId, name: $name, rating: $rating, comment: $comment) {
            _id
            name
            rating
            comment
            helpfulCount
            createdAt
          }
        }
      `;
      const data = await graphqlRequest(mutation, {
        productId: product._id,
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      if (data && data.createReview) {
        showToast('Review submitted successfully! Thank you.', 'success');
        setReviews(prev => [data.createReview, ...prev]);
        // Reset form
        setReviewName('');
        setReviewRating(5);
        setReviewComment('');
        setWriteOpen(false);
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      showToast(err.message || 'Error submitting review.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (helpfulClicked[reviewId]) return;
    try {
      const mutation = `
        mutation VoteReviewHelpful($reviewId: ID!) {
          markReviewHelpful(reviewId: $reviewId) {
            _id
            helpfulCount
          }
        }
      `;
      const data = await graphqlRequest(mutation, { reviewId });
      if (data && data.markReviewHelpful) {
        setHelpfulClicked(prev => ({ ...prev, [reviewId]: true }));
        setReviews(prev =>
          prev.map(r =>
            r._id === reviewId
              ? { ...r, helpfulCount: data.markReviewHelpful.helpfulCount }
              : r
          )
        );
        showToast('Marked as helpful.', 'success');
      }
    } catch (err) {
      console.error('Error voting helpful:', err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
          />
        ))}
      </div>
    );
  };

  // Bundle Selector State
  const [selectedBundleTier, setSelectedBundleTier] = useState<number>(
    similarProducts && similarProducts.length >= 2 ? 3 : (similarProducts && similarProducts.length >= 1 ? 2 : 1)
  );
  const [slot1Product, setSlot1Product] = useState<any>(
    similarProducts && similarProducts.length >= 1 ? similarProducts[0] : null
  );
  const [slot2Product, setSlot2Product] = useState<any>(
    similarProducts && similarProducts.length >= 2 ? similarProducts[1] : null
  );

  const handleSwapSlot1 = (id: string) => {
    const selected = similarProducts.find((p: any) => p._id === id);
    if (selected) setSlot1Product(selected);
  };

  const handleSwapSlot2 = (id: string) => {
    const selected = similarProducts.find((p: any) => p._id === id);
    if (selected) setSlot2Product(selected);
  };

  // Bundle calculation pricing
  const p0 = product.salePrice ?? product.price;
  const p1 = slot1Product ? (slot1Product.salePrice ?? slot1Product.price) : 0;
  const p2 = slot2Product ? (slot2Product.salePrice ?? slot2Product.price) : 0;

  let originalBundleTotal = p0;
  let bundleDiscount = 0;
  let finalTotal = p0;

  if (selectedBundleTier === 2 && slot1Product) {
    originalBundleTotal = p0 + p1;
    bundleDiscount = Math.min(p0, p1);
    finalTotal = originalBundleTotal - bundleDiscount;
  } else if (selectedBundleTier === 3 && slot1Product && slot2Product) {
    originalBundleTotal = p0 + p1 + p2;
    bundleDiscount = Math.min(p0, p1, p2);
    finalTotal = originalBundleTotal - bundleDiscount;
  }

  const handleAddBundleToCart = () => {
    const itemsToAdd: CartItem[] = [
      {
        _id: product._id,
        title: product.title,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        category: product.category,
        pdfUrl: product.pdfUrl
      }
    ];

    if (selectedBundleTier >= 2 && slot1Product) {
      itemsToAdd.push({
        _id: slot1Product._id,
        title: slot1Product.title,
        price: slot1Product.price,
        salePrice: slot1Product.salePrice,
        images: slot1Product.images,
        category: slot1Product.category,
        pdfUrl: slot1Product.pdfUrl
      });
    }

    if (selectedBundleTier === 3 && slot2Product) {
      itemsToAdd.push({
        _id: slot2Product._id,
        title: slot2Product.title,
        price: slot2Product.price,
        salePrice: slot2Product.salePrice,
        images: slot2Product.images,
        category: slot2Product.category,
        pdfUrl: slot2Product.pdfUrl
      });
    }

    addMultipleToCart(itemsToAdd);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_ids: [product._id],
        content_name: product.title,
        content_category: product.category,
        value: product.salePrice ?? product.price,
        currency: 'USD'
      });
    }
  }, [product]);

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
    <div className="w-full flex-grow select-none py-10 bg-white">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-900 font-semibold hover:text-[#A855F7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all patterns</span>
        </Link>

        {/* Product Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Gallery (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square w-full rounded-none border border-gray-200 bg-gray-50 group">
              <Image
                src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80'}
                alt={product.title}
                fill
                priority
                className="object-cover transition-all duration-500 ease-in-out"
              />

              {/* Slider Next/Prev Chevrons */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setActiveImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#5C4033] hover:text-[#A855F7] border border-[#EEDDCC] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveImageIndex(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#5C4033] hover:text-[#A855F7] border border-[#EEDDCC] flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Slider Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-[#5C4033]/20 px-3 py-1.5 rounded-full backdrop-blur-xs">
                    {product.images.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          activeImageIndex === idx ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
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

              <h1 className="font-sans font-black text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
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
            <div className="bg-gray-50 border border-gray-200 rounded-none p-5 flex items-center justify-between">
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

            {/* Add to Cart & Favorite CTA */}
            <div className="space-y-3">
              <div className="flex gap-3">
                {inCart ? (
                  <button
                    onClick={() => router.push('/')}
                    className="flex-grow btn-secondary text-center py-3.5 text-base flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>In Your Cart</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="flex-grow btn-primary py-3.5 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Add PDF to Cart</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleFavorite(product)}
                  className={`p-3.5 rounded-none border flex items-center justify-center transition-all cursor-pointer ${
                    isFavorite 
                      ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                      : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:text-rose-500'
                  }`}
                  aria-label="Add to favorites"
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-6 h-6 transition-transform duration-200 ${isFavorite ? 'fill-current scale-110' : ''}`} />
                </button>
              </div>

              <p className="text-[10px] text-center text-gray-500 leading-normal px-2">
                This is a digital pattern download. You will **NOT** receive a physical finished item. Access links are delivered in PDF format instantly.
              </p>
            </div>

            {/* Bundle & Save Widget */}
            {similarProducts && similarProducts.length >= 1 && (
              <div className="border border-gray-200 rounded-none p-6 bg-white space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#A855F7]" />
                  <h3 className="font-sans font-black text-sm text-gray-900 uppercase tracking-wider">
                    Bundle & Save Specials
                  </h3>
                </div>
                
                {/* Tiers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tier 1: Single */}
                  <div 
                    onClick={() => setSelectedBundleTier(1)}
                    className={`bundle-card flex flex-col justify-between p-3.5 ${selectedBundleTier === 1 ? 'active' : ''}`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-gray-900 text-xs">1 Pattern</h4>
                      <p className="text-[9px] text-gray-400 font-semibold">Standard price</p>
                    </div>
                    <div className="mt-3 pt-1.5 border-t border-gray-100">
                      <span className="text-xs font-black text-gray-900">
                        ${p0.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Duo (10% Off) */}
                  {similarProducts.length >= 1 && (
                    <div 
                      onClick={() => setSelectedBundleTier(2)}
                      className={`bundle-card flex flex-col justify-between p-3.5 ${selectedBundleTier === 2 ? 'active' : ''}`}
                    >
                      <span className="bundle-badge">Buy 1 Get 1 FREE</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-gray-900 text-xs">BOGO Special</h4>
                        <p className="text-[9px] text-gray-400 font-semibold">Cheaper item is free!</p>
                      </div>
                      <div className="mt-3 pt-1.5 border-t border-gray-100 flex items-baseline gap-1">
                        <span className="text-xs font-black text-[#A855F7]">
                          ${((p0 + p1) - Math.min(p0, p1)).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 line-through">
                          ${(p0 + p1).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
 
                  {/* Tier 3: Trio (Buy 2 Get 1 FREE!) */}
                  {similarProducts.length >= 2 && (
                    <div 
                      onClick={() => setSelectedBundleTier(3)}
                      className={`bundle-card flex flex-col justify-between p-3.5 ${selectedBundleTier === 3 ? 'active' : ''}`}
                    >
                      <span className="bundle-badge best">Buy 2 Get 1 FREE</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-gray-900 text-xs">Deluxe Trio</h4>
                        <p className="text-[9px] text-gray-400 font-semibold">Get cheapest FREE!</p>
                      </div>
                      <div className="mt-3 pt-1.5 border-t border-gray-100 flex items-baseline gap-1">
                        <span className="text-xs font-black text-[#A855F7]">
                          ${(p0 + p1 + p2 - Math.min(p0, p1, p2)).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 line-through">
                          ${(p0 + p1 + p2).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Preview List */}
                {selectedBundleTier > 1 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-none p-3.5 space-y-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      Select Bundle Patterns
                    </span>
                    
                    <div className="space-y-2">
                      {/* Slot 0: Current Item */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-none overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                          <Image 
                            src={product.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'} 
                            alt={product.title} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-xs text-gray-900 line-clamp-1">{product.title}</p>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">This Pattern (Current)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xs text-gray-600">${p0.toFixed(2)}</span>
                        </div>
                      </div>
 
                      {/* Slot 1: Suggested Item 1 */}
                      {selectedBundleTier >= 2 && slot1Product && (
                        <>
                          <div className="bundle-plus-circle w-6 h-6 text-xs"><Plus className="w-3 h-3" /></div>
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-none overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                              <Image 
                                src={slot1Product.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'} 
                                alt={slot1Product.title} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-xs text-gray-900 line-clamp-1">{slot1Product.title}</p>
                              <select
                                value={slot1Product._id}
                                onChange={(e) => handleSwapSlot1(e.target.value)}
                                className="text-[9px] text-[#A855F7] font-black border-none bg-transparent hover:underline outline-none cursor-pointer p-0"
                              >
                                {similarProducts
                                  .filter((p: any) => !slot2Product || p._id !== slot2Product._id)
                                  .map((p: any) => (
                                    <option key={p._id} value={p._id}>Swap: {p.title}</option>
                                  ))}
                              </select>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="font-black text-xs text-gray-600">${p1.toFixed(2)}</span>
                              {selectedBundleTier === 3 && p1 === Math.min(p0, p1, p2) && (
                                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 rounded px-1 mt-0.5 leading-none">FREE</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Slot 2: Suggested Item 2 */}
                      {selectedBundleTier === 3 && slot2Product && (
                        <>
                          <div className="bundle-plus-circle w-6 h-6 text-xs"><Plus className="w-3 h-3" /></div>
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-none overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                              <Image 
                                src={slot2Product.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'} 
                                alt={slot2Product.title} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-xs text-gray-900 line-clamp-1">{slot2Product.title}</p>
                              <select
                                value={slot2Product._id}
                                onChange={(e) => handleSwapSlot2(e.target.value)}
                                className="text-[9px] text-[#A855F7] font-black border-none bg-transparent hover:underline outline-none cursor-pointer p-0"
                              >
                                {similarProducts
                                  .filter((p: any) => p._id !== slot1Product._id)
                                  .map((p: any) => (
                                    <option key={p._id} value={p._id}>Swap: {p.title}</option>
                                  ))}
                              </select>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="font-black text-xs text-gray-600">${p2.toFixed(2)}</span>
                              {p2 === Math.min(p0, p1, p2) && (
                                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 rounded px-1 mt-0.5 leading-none">FREE</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Bundle Summary & Buy CTA */}
                <div className="pt-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Bundle Price</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-black text-[#A855F7]">
                        ${finalTotal.toFixed(2)}
                      </span>
                      {bundleDiscount > 0 && (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            ${originalBundleTotal.toFixed(2)}
                          </span>
                          <span className="bg-red-50 border border-red-100 text-red-700 text-[9px] font-black py-0.5 px-1.5 rounded-full block sm:inline-block leading-none mt-0.5 sm:mt-0">
                            SAVE ${bundleDiscount.toFixed(2)} {selectedBundleTier === 3 ? '(Buy 2 Get 1 FREE!)' : '(10% OFF!)'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBundleToCart}
                    className="btn-primary py-2.5 px-5 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md w-full sm:w-auto"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add Bundle to Cart</span>
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 space-y-4 text-sm text-gray-600">
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
            <div className="border-t border-gray-200 pt-6 space-y-3">
              
              <details className="group border border-gray-200 rounded-none bg-white overflow-hidden transition-all duration-300" open>
                <summary className="flex items-center justify-between p-3.5 sm:p-4 font-sans font-bold text-gray-900 text-xs sm:text-sm cursor-pointer select-none hover:bg-gray-50">
                  <span>Description & Details</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <div className="p-3.5 sm:p-4 pt-0 border-t border-[#FFF8EF] text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2">
                  <div 
                    className="rich-text-content whitespace-pre-wrap text-xs sm:text-sm" 
                    dangerouslySetInnerHTML={{ __html: product.description }} 
                  />
                  {product.size && (
                    <p className="text-[11px] sm:text-xs mt-2 text-gray-500">
                      **Finished Size**: {product.size}
                    </p>
                  )}
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    **Available Languages**: {product.languages?.join(', ') || 'English'}
                  </p>
                </div>
              </details>

              {product.materials && product.materials.length > 0 && (
                <details className="group border border-gray-200 rounded-none bg-white overflow-hidden transition-all duration-300">
                  <summary className="flex items-center justify-between p-4 font-sans font-bold text-gray-900 text-sm cursor-pointer select-none hover:bg-gray-50">
                    <span>Materials Needed</span>
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                  </summary>
                  <div className="p-4 pt-0 border-t border-gray-100">
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
 
              <details className="group border border-gray-200 rounded-none bg-white overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between p-4 font-sans font-bold text-gray-900 text-sm cursor-pointer select-none hover:bg-gray-50">
                  <span>How Downloads Work & FAQ</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-open:rotate-90" />
                </summary>
                <div className="p-4 pt-0 border-t border-gray-100 text-xs text-gray-600 space-y-3 leading-relaxed">
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

        {/* Dynamic Etsy-Style Reviews Section */}
        <div className="border-t border-gray-200 pt-12 space-y-8 font-sans">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Customer Reviews ({reviews.length})</span>
            </h2>
            
            <button
              onClick={() => setWriteOpen(!writeOpen)}
              className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-wider rounded-none cursor-pointer hover:bg-[#9333EA]"
            >
              {writeOpen ? 'Close Form' : 'Write a Review'}
            </button>
          </div>

          {/* Expanded Write a Review Form */}
          {writeOpen && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 border border-gray-200 p-6 space-y-4 max-w-xl animate-scaleUp">
              <h3 className="font-bold text-gray-900 text-sm">Write Your Crochet Review</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Your Rating *</label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isLit = hoverRating !== null ? starVal <= hoverRating : starVal <= reviewRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="cursor-pointer focus:outline-none transition-colors"
                      >
                        <Star className={`w-6 h-6 transition-all ${isLit ? 'text-amber-400 fill-amber-400 scale-110' : 'text-gray-300'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Your Name / Nickname *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah M."
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#A855F7] rounded-none py-2 px-3 text-xs text-gray-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block">Review Comments *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell other makers how easy the stitches were, your finished dimensions, or any tips..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#A855F7] rounded-none py-2 px-3 text-xs text-gray-900 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="btn-primary w-full py-3 text-xs font-black uppercase tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-2 hover:bg-[#9333EA] disabled:opacity-50"
              >
                {reviewSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Publish Review</span>
                )}
              </button>
            </form>
          )}

          {/* Breakdown Statistics Grid */}
          {reviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gray-50 border border-gray-200 p-6">
              {/* Average Rating Block */}
              <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
                <p className="text-5xl font-black text-gray-900 tracking-tight">
                  {(() => {
                    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    return avg.toFixed(1);
                  })()}
                </p>
                <div className="flex justify-center">
                  {renderStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length))}
                </div>
                <p className="text-xs text-gray-500 font-semibold">Average rating from {reviews.length} reviews</p>
              </div>

              {/* Ratios Breakdown Block */}
              <div className="md:col-span-2 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter(r => r.rating === stars).length;
                  const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-gray-600 font-semibold">{stars} stars</span>
                      <div className="flex-grow h-2.5 bg-gray-200 overflow-hidden rounded-none">
                        <div 
                          className="h-full bg-amber-400 transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-500 font-semibold">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border border-gray-200 p-5 space-y-3 animate-pulse bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                    <div className="space-y-1 flex-grow">
                      <div className="h-3 bg-gray-100 rounded-md w-1/4" />
                      <div className="h-3 bg-gray-100 rounded-md w-1/5" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 font-bold">Be the first to review this pattern! Tap "Write a Review" above to share your stitches.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white border border-gray-200 p-5 space-y-3 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#A855F7]">
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{rev.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      {renderStars(rev.rating)}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed font-medium pl-1 select-text">
                    {rev.comment}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-[10px] pl-1">
                    <span className="text-gray-400 font-semibold">Was this review helpful?</span>
                    <button
                      onClick={() => handleMarkHelpful(rev._id)}
                      disabled={helpfulClicked[rev._id]}
                      className={`inline-flex items-center gap-1 py-1 px-2.5 border transition-all ${
                        helpfulClicked[rev._id]
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 cursor-default'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="font-bold">Yes ({rev.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promoted Listings Related to This Item */}
        {promotedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="font-sans font-bold text-2xl text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A855F7]" />
                  <span>Related Designs & Collections</span>
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
              {promotedProducts.map((p) => (
                <div key={p._id} className="relative">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Products Recommendation */}
        {similarProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12 space-y-6">
            <h2 className="font-sans font-bold text-2xl text-gray-900">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
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
