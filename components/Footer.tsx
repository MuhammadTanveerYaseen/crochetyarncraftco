'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Heart } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#5C4033] text-[#FFFDF9] border-t border-[#EEDDCC] select-none">
      
      {/* Top Newsletter / Community Section */}
      <div className="bg-[#4E3529] py-12 border-b border-[#6E4F41]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h3 className="font-serif font-bold text-xl sm:text-2xl tracking-tight">Join Our Maker Community</h3>
            <p className="text-sm text-gray-300 mt-2">
              Subscribe to get notified about new pattern releases, bundle sales, and receive a **10% discount** code in your inbox!
            </p>
          </div>
          
          <div className="w-full max-w-md">
            {subscribed ? (
              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4 text-center">
                <p className="text-[#10B981] font-semibold text-sm">🎉 Thank you for subscribing! Check your email for your 10% code: MAKER10</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex relative">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#5C4033] border border-[#6E4F41] focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] rounded-full py-3 px-5 pr-14 text-sm text-[#FFFDF9] placeholder-gray-400 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#A855F7] hover:bg-[#9333EA] text-white p-2 rounded-full transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Col 1: Bio */}
        <div className="space-y-4">
          <span className="font-serif font-black text-2xl tracking-tight">Yarn<span className="text-[#A855F7]">Craft Co</span></span>
          <p className="text-sm text-gray-300 leading-relaxed">
            Your destination for premium, beautifully designed digital crochet and knitting patterns. Handcrafted with love, featuring clear step-by-step instructions, materials checklists, and supportive tutorials.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Mail className="w-4 h-4 text-[#A855F7]" />
            <span>support@yarncraftco.com</span>
          </div>
        </div>

        {/* Col 2: Categories */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-lg tracking-tight text-white border-b border-[#6E4F41] pb-2">Pattern Shop</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/?category=amigurumi" className="hover:text-[#A855F7] transition-colors">Amigurumi Plushies</Link></li>
            <li><Link href="/?category=clothing" className="hover:text-[#A855F7] transition-colors">Fashion Clothing</Link></li>
            <li><Link href="/?category=home-decor" className="hover:text-[#A855F7] transition-colors">Home Decor & Throw Blankets</Link></li>
            <li><Link href="/?category=accessories" className="hover:text-[#A855F7] transition-colors">Accessories & Purses</Link></li>
            <li><Link href="/?category=holiday" className="hover:text-[#A855F7] transition-colors">Holiday Special Bundles</Link></li>
          </ul>
        </div>

        {/* Col 3: Customer Care */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-lg tracking-tight text-white border-b border-[#6E4F41] pb-2">Help & Info</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/pricing" className="hover:text-[#A855F7] text-left transition-colors">Pricing & Maker Pass</Link></li>
            <li><Link href="/terms" className="hover:text-[#A855F7] text-left transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-[#A855F7] text-left transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-[#A855F7] text-left transition-colors">Refund Policy</Link></li>
            <li><Link href="/report" className="hover:text-[#A855F7] text-left transition-colors">Report an Issue / Help</Link></li>
          </ul>
        </div>

        {/* Col 4: Assurances */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-lg tracking-tight text-white border-b border-[#6E4F41] pb-2">Our Guarantees</h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2.5">
              <span className="text-[#A855F7] text-base leading-none">✔</span>
              <span>**Instant Access**: Download instantly as a high-quality, printable PDF file.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#A855F7] text-base leading-none">✔</span>
              <span>**Step-by-Step**: Includes detailed stitch counts and tutorial photos.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#A855F7] text-base leading-none">✔</span>
              <span>**Help & Support**: Message our shop at any time if you get stuck on a stitch.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-[#4E3529] py-6 border-t border-[#6E4F41] text-center text-xs text-gray-400 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Yarn Craft Co. All rights reserved. Created for crochet makers.</p>
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-[#A855F7] fill-[#A855F7]" /> for the crafting community.
          </p>
        </div>
      </div>

    </footer>
  );
}
