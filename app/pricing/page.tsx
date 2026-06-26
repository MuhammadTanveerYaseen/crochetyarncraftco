'use client';

import React, { useState } from 'react';
import { Check, Sparkles, BookOpen, Star, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Single PDF Patterns',
      price: '$4.99',
      unit: 'per pattern',
      description: 'Perfect for makers working on a single, specific project.',
      features: [
        'Instant high-quality PDF download',
        'Lifetime access to file updates',
        'Standard stitch instructions',
        'Photo-guided tutorial sheets',
        'Standard customer support email'
      ],
      cta: 'Browse Catalog',
      href: '/',
      featured: false,
      badge: 'Pay as You Go'
    },
    {
      name: 'All-Access Maker Pass',
      price: billingCycle === 'monthly' ? '$9.99' : '$6.66',
      unit: billingCycle === 'monthly' ? 'per month' : 'per month, billed annually',
      description: 'Unlimited access to our entire pattern vault. Designed for dedicated makers.',
      features: [
        'Unlimited PDF downloads of all patterns',
        'Access to new patterns immediately on release',
        'Exclusive premium-only patterns',
        'Priority support (responses within 12h)',
        'Stitch-help consulting from expert editors',
        '10% discount on print tools (coming soon)'
      ],
      cta: 'Start Free Trial',
      href: '/login?redirect=/profile',
      featured: true,
      badge: 'Best Value'
    },
    {
      name: 'Curated Pattern Bundles',
      price: '$15.99',
      unit: 'per bundle pack',
      description: 'Get themed seasonal collections and save up to 30% on single prices.',
      features: [
        '3 to 5 matching themed patterns',
        'Print-optimized worksheets',
        'Cohesive project yarn suggestions',
        'Lifetime download access',
        'Includes accessories & decorations'
      ],
      cta: 'View Store Bundles',
      href: '/?category=holiday',
      featured: false,
      badge: 'Bundle & Save'
    }
  ];

  return (
    <div className="w-full flex-grow py-16 sm:py-20 bg-[#FFFDF9] select-none text-[#5C4033]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Pricing Options</span>
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-5xl tracking-tight leading-none">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Get instant download access to our beautiful, easy-to-follow crochet designs. Pick a single pattern or unlock unlimited downloads.
          </p>

          {/* Toggle Monthly/Yearly */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-[#FBF7F0] border border-[#EEDDCC] rounded-2xl mt-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-[#A855F7] text-white shadow-sm' : 'text-[#5C4033]/70 hover:text-[#A855F7]'
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-[#A855F7] text-white shadow-sm' : 'text-[#5C4033]/70 hover:text-[#A855F7]'
              }`}
            >
              Billed Annually (Save 33%)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white border rounded-3xl p-8 flex flex-col justify-between transition-all ${
                plan.featured 
                  ? 'border-[#A855F7] ring-2 ring-[#A855F7]/10 shadow-lg scale-105 z-10' 
                  : 'border-[#EEDDCC] shadow-sm hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#A855F7] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                  Recommended Plan
                </div>
              )}

              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif font-black text-xl">{plan.name}</h3>
                    <span className="text-[9px] font-extrabold bg-[#FBF7F0] text-[#5C4033] border border-[#EEDDCC] px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 min-h-[32px] leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 border-b border-[#FFF8EF] pb-4">
                  <span className="text-4xl font-black text-[#5C4033]">{plan.price}</span>
                  <span className="text-xs text-gray-400 font-medium">/{plan.unit}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3.5">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-600">
                      <div className={`p-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                        plan.featured ? 'bg-[#A855F7]/10 text-[#A855F7]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call to Action */}
              <div className="pt-8">
                <Link
                  href={plan.href}
                  className={`w-full py-3.5 text-xs font-bold rounded-2xl flex items-center justify-center transition-all ${
                    plan.featured
                      ? 'bg-[#A855F7] text-white hover:bg-[#A855F7]/95 shadow-md shadow-[#A855F7]/15 hover:shadow-lg'
                      : 'bg-[#FBF7F0] text-[#5C4033] border border-[#EEDDCC] hover:bg-[#EEDDCC]/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>

            </div>
          ))}
        </div>

        {/* Support Assurances FAQ */}
        <div className="border-t border-[#EEDDCC] pt-16 max-w-4xl mx-auto space-y-8">
          <h3 className="font-serif font-black text-2xl text-center">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-gray-600">
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#5C4033]">How do I download my patterns?</h4>
              <p className="leading-relaxed">
                Immediately upon completing payment (via Paddle credit card or PayPal), you will be redirected to a download screen. We also email you a download link immediately.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#5C4033]">Can I cancel my Maker Pass subscription?</h4>
              <p className="leading-relaxed">
                Yes, absolutely! You can cancel your Maker Pass at any time from your User Profile dashboard with a single click. You will retain library access until the end of your billing cycle.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#5C4033]">Are there any stitch tutorials included?</h4>
              <p className="leading-relaxed">
                Yes! Every pattern includes a detailed yarn weights guide, hook dimension lists, clear abbreviations tables, and step-by-step close-up photography.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#5C4033]">What is your refund guarantee?</h4>
              <p className="leading-relaxed">
                Since digital files are delivered instantly and cannot be returned, all sales are final. However, we offer a **100% stitch-help guarantee**—if you get stuck on any row, submit a ticket and our support team will help you finish.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
