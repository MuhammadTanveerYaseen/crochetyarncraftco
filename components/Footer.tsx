'use client';
 
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-gray-400 border-t border-neutral-800 py-8 px-4 select-none">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        {/* Brand and Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
          <span className="font-sans font-black text-sm tracking-tight text-white">
            Yarn<span className="text-[#A855F7]">Craft Co</span>
          </span>
          <span className="text-gray-500">
            © {new Date().getFullYear()} Yarn Craft Co. All rights reserved.
          </span>
        </div>
        
        {/* Compulsory Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/report" className="hover:text-white transition-colors">Support & Help</Link>
        </div>
      </div>
    </footer>
  );
}
