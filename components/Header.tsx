'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag, Heart, Scissors, Settings, User, LogIn } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { graphqlRequest } from '@/lib/graphqlClient';

export default function Header() {
  const { cart, setIsCartOpen, showToast } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const query = `
          query GetHeaderMe {
            me {
              name
              email
            }
          }
        `;
        const data = await graphqlRequest(query);
        if (data && data.me) {
          setCurrentUser(data.me);
        }
      } catch (err) {
        // Suppress session error on first load
      }
    }
    loadUser();
  }, []);

  // Update search state when query params change
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/');
    }
  };

  const navLinks = [
    { label: 'All Patterns', path: '/' },
    { label: 'Amigurumi', path: '/?category=amigurumi' },
    { label: 'Clothing', path: '/?category=clothing' },
    { label: 'Home Decor', path: '/?category=home-decor' },
    { label: 'Accessories', path: '/?category=accessories' },
    { label: 'Holiday', path: '/?category=holiday' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#EEDDCC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-[#5C4033] font-serif font-black text-xl sm:text-2xl hover:opacity-90 select-none flex-shrink-0"
          >
            <div className="bg-[#A855F7]/10 p-2 rounded-full border border-[#A855F7]/20">
              <svg className="w-6 h-6 text-[#A855F7]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 50C32 50 12 36 12 22C12 13 19 8 26 12C29 13.5 31 16 32 18.5C33 16 35 13.5 38 12C45 8 52 13 52 22C52 36 32 50 32 50Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 26C24 20 30 18 34 22C38 26 36 32 30 30C24 28 28 20 32 20C36 20 40 24 38 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M32 50C28 53 22 55 18 53" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="tracking-tight">Yarn<span className="text-[#A855F7]">Craft Co</span></span>
          </Link>

          {/* Search Form */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative"
          >
            <input
              type="text"
              placeholder="Search crochet PDF patterns..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/25 rounded-full py-2 px-5 pl-12 text-sm text-[#1F2937] placeholder-gray-400 outline-none transition-all"
            />
            <Search className="w-5 h-5 text-[#5C4033] absolute left-4 top-1/2 -translate-y-1/2" />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Wishlist Link (visual only) */}
            <button 
              onClick={() => showToast("Favorites feature is coming soon! Browse our patterns to start styling.", "info")}
              className="p-2 text-[#5C4033] hover:bg-[#FBF7F0] rounded-full transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-6 h-6" />
            </button>

            {/* Admin Dashboard Navigation */}
            <Link 
              href="/admin"
              className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-[#EEDDCC] hover:bg-[#FBF7F0] ${
                pathname.startsWith('/admin') ? 'bg-[#A855F7]/10 border-[#A855F7] text-[#A855F7]' : 'text-[#5C4033]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* User Session Link */}
            {currentUser ? (
              <Link
                href="/profile"
                className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-[#EEDDCC] hover:bg-[#FBF7F0] ${
                  pathname === '/profile' ? 'bg-[#A855F7]/10 border-[#A855F7] text-[#A855F7]' : 'text-[#5C4033]'
                }`}
              >
                <User className="w-4 h-4 text-[#A855F7]" />
                <span className="hidden sm:inline font-bold text-[#5C4033]">
                  {currentUser.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-[#EEDDCC] hover:bg-[#FBF7F0] ${
                  pathname === '/login' ? 'bg-[#A855F7]/10 border-[#A855F7] text-[#A855F7]' : 'text-[#5C4033]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline font-bold text-[#5C4033]">Sign In</span>
              </Link>
            )}

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 bg-[#FBF7F0] text-[#5C4033] border border-[#EEDDCC] hover:border-[#A855F7] rounded-full transition-all relative flex items-center justify-center"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#A855F7] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <nav className="border-t border-[#FFF8EF] py-3 overflow-x-auto scrollbar-none flex justify-center md:justify-start">
          <ul className="flex items-center space-x-6 sm:space-x-8 px-2">
            {navLinks.map((link, idx) => {
              const active = searchParams.get('category') === link.path.split('=')[1] || (link.path === '/' && !searchParams.get('category') && pathname === '/');
              return (
                <li key={idx}>
                  <Link 
                    href={link.path}
                    className={`text-sm font-semibold tracking-wide hover:text-[#A855F7] transition-colors whitespace-nowrap ${
                      active ? 'text-[#A855F7] underline underline-offset-4 decoration-2' : 'text-[#5C4033]/85'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile Search Input */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search PDF patterns..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-full py-2 px-5 pl-11 text-xs text-[#1F2937] placeholder-gray-400 outline-none"
          />
          <Search className="w-4 h-4 text-[#5C4033] absolute left-4 top-1/2 -translate-y-1/2" />
        </form>
      </div>
    </header>
  );
}
