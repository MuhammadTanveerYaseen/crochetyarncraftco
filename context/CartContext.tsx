'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  _id: string;
  title: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  pdfUrl: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  addMultipleToCart: (items: CartItem[]) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  originalTotal: number;
  discount: number;
  total: number;
  
  // Custom Toast System
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('crafting_pattern_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart storage:', e);
      }
    }
  }, []);

  // Sync cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('crafting_pattern_cart', JSON.stringify(newCart));
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const addToCart = (item: CartItem) => {
    const exists = cart.find((i) => i._id === item._id);
    if (!exists) {
      const newCart = [...cart, item];
      saveCart(newCart);
      showToast(`"${item.title}" added to cart!`, 'success');
      setIsCartOpen(true); // Auto-open cart sidebar on add

      // Track AddToCart event in Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_ids: [item._id],
          content_name: item.title,
          content_type: 'product',
          value: item.salePrice ?? item.price,
          currency: 'USD'
        });
      }
    } else {
      showToast('This pattern is already in your cart!', 'info');
    }
  };

  const addMultipleToCart = (items: CartItem[]) => {
    const newItems = items.filter(item => !cart.some(i => i._id === item._id));
    if (newItems.length > 0) {
      const newCart = [...cart, ...newItems];
      saveCart(newCart);
      if (newItems.length === 1) {
        showToast(`"${newItems[0].title}" added to cart!`, 'success');
      } else {
        showToast(`${newItems.length} patterns added to cart!`, 'success');
      }
      setIsCartOpen(true);

      // Track AddToCart event in Facebook Pixel for each new item
      if (typeof window !== 'undefined' && (window as any).fbq) {
        newItems.forEach(item => {
          (window as any).fbq('track', 'AddToCart', {
            content_ids: [item._id],
            content_name: item.title,
            content_type: 'product',
            value: item.salePrice ?? item.price,
            currency: 'USD'
          });
        });
      }
    } else {
      showToast('Selected patterns are already in your cart!', 'info');
    }
  };

  const removeFromCart = (itemId: string) => {
    const item = cart.find((i) => i._id === itemId);
    const newCart = cart.filter((i) => i._id !== itemId);
    saveCart(newCart);
    if (item) {
      showToast(`Removed "${item.title}" from cart.`, 'info');
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Calculate pricing rules
  // Buy 2 Get 1 Free (cheapest of every 3 items is free), or 10% off for exactly 2 items
  const getPrices = () => {
    const sortedPrices = cart.map(item => item.salePrice ?? item.price).sort((a, b) => a - b);
    
    const originalTotal = sortedPrices.reduce((sum, price) => sum + price, 0);
    
    let discount = 0;
    if (sortedPrices.length >= 2) {
      const freeItemsCount = Math.floor(sortedPrices.length / 2);
      discount = sortedPrices.slice(0, freeItemsCount).reduce((sum, price) => sum + price, 0);
    }
    
    const total = Math.max(0, originalTotal - discount);

    return {
      originalTotal,
      discount,
      total
    };
  };

  const { originalTotal, discount, total } = getPrices();

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        originalTotal,
        discount,
        total,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
