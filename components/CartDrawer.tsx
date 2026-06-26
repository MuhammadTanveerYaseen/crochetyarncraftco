'use client';

import React, { useRef, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    originalTotal, 
    discount, 
    total 
  } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent main page scrolling when cart is open
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-md h-full bg-[#FFFDF9] shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-in-out border-l border-[#EEDDCC]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EEDDCC] bg-[#FBF7F0]">
          <div className="flex items-center gap-2 text-[#5C4033] font-serif font-bold text-xl">
            <ShoppingBag className="w-5 h-5 text-[#A855F7]" />
            <span>Your Cart ({cart.length})</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1 rounded-full hover:bg-[#EEDDCC] transition-colors text-[#5C4033]"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-[#E5D5C5]" />
              <div>
                <p className="text-lg font-semibold text-[#5C4033] font-serif">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-1">Explore our patterns to start creating!</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="btn-primary mt-2"
              >
                Browse Patterns
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item._id}
                className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-[#EEDDCC] transition-all hover:border-[#D2BEAC]"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EEDDCC] flex-shrink-0">
                  <Image 
                    src={item.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-[#5C4033] text-sm truncate leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{item.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#A855F7] font-semibold text-sm">
                      ${(item.salePrice ?? item.price).toFixed(2)}
                    </span>
                    {item.salePrice !== undefined && (
                      <span className="text-xs text-gray-400 line-through">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item._id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Billing Details */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#EEDDCC] bg-[#FBF7F0] space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#5C4033]">${originalTotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-[#10B981] font-medium">
                  <span>Buy 2 Get 1 Free Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400">
                <span>Delivery</span>
                <span>Instant Digital Download (PDF)</span>
              </div>
              
              <div className="border-t border-[#EEDDCC] pt-2 flex justify-between text-base font-bold text-[#5C4033] font-serif">
                <span>Total</span>
                <span className="text-lg text-[#A855F7]">${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckoutClick}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-[10px] text-center text-gray-500 leading-tight">
              Patterns are PDF file downloads. An email with download links will be sent immediately upon purchase completion. All sales are final.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
