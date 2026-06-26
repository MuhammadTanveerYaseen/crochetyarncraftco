'use client';

import React from 'react';
import { ShieldCheck, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

export default function RefundsPage() {
  return (
    <div className="w-full flex-grow py-16 sm:py-20 bg-[#FFFDF9] select-none text-[#5C4033]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Header */}
        <div className="border-b border-[#EEDDCC] pb-6 space-y-3">
          <div className="inline-flex p-2 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-xl">
            <HeartHandshake className="w-5 h-5 animate-pulse" />
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight">Refund & Support Guarantee</h1>
          <p className="text-xs text-gray-400">Last updated: June 26, 2026</p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans select-text">
          
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">1. Nature of Digital Goods</h3>
            <p>
              All products sold on **Yarn Craft Co** (purchases processed via **Paddle**) are digital PDF documents delivered instantly to your web browser and email inbox. Because digital files are downloaded immediately and are irrevocable, all transactions are considered final. We cannot offer standard returns, refunds, or exchanges on downloaded patterns.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">2. The 100% Stitch-Help Guarantee</h3>
            <p>
              We want you to succeed with every craft project you start! Even though all sales are final, we stand behind the quality of our patterns with our **100% Stitch-Help Guarantee**:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-xs">
              <li>If you encounter a row instruction, abbreviation, or step that is confusing, simply submit a ticket via our <Link href="/report" className="text-[#A855F7] hover:underline font-bold">Report Support</Link> page.</li>
              <li>Our expert crochet editors will reply to you within 24 hours to explain the stitch, send close-up screenshots, or guide you through finishing the rows!</li>
              <li>We will not close your ticket until you successfully complete the confusing portion of the pattern.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">3. Exceptional Refund Circumstances</h3>
            <p>
              We want to be fair. We will review refund requests on a case-by-case basis under the following exceptional circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs">
              <li>**Double Purchases**: If you accidentally purchase the exact same pattern twice in separate transactions, contact us and we will immediately refund the duplicate payment.</li>
              <li>**Un-downloaded Orders**: If you made a purchase but never opened the download links or logged into your dashboard to retrieve the file, we can process a full refund within 14 days of purchase.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">4. How to Request Support or Refund</h3>
            <p>
              To submit a claim, please:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mt-2 text-xs">
              <li>Navigate to our support page at `yarncraftco.com/report` (or click "Report an Issue / Help" in the footer).</li>
              <li>Fill out your full name, email, and choose **Order Delivery Issue** or **Stitch Instruction Help** as the topic.</li>
              <li>Specify your **Order ID** (found in your email receipt) and describe your issue.</li>
            </ol>
            <p className="mt-2">
              Alternatively, you can email our refund processing team directly at **support@yarncraftco.com** with your purchase details.
            </p>
          </div>

        </div>

        {/* Footer Link back */}
        <div className="border-t border-[#EEDDCC] pt-8 flex items-center justify-between text-xs text-gray-500">
          <Link href="/" className="font-semibold hover:text-[#A855F7] flex items-center gap-1.5">
            Return to storefront
          </Link>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Stitch Support Guaranteed</span>
          </div>
        </div>

      </div>
    </div>
  );
}
