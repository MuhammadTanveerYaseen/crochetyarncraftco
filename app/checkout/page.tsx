'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { graphqlRequest } from '@/lib/graphqlClient';

export default function CheckoutPage() {
  const { cart, originalTotal, discount, total } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load error from query params if redirected back from checkout callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setError(urlError);
        // Clean URL query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Redirect to catalog if cart is empty, unless we are currently submitting/successing
  useEffect(() => {
    if (cart.length === 0 && !submitting) {
      router.push('/');
    }
  }, [cart, submitting, router]);

  // Pre-fill user profile details if logged in
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const meQuery = `
          query GetMe {
            me {
              name
              email
            }
          }
        `;
        const response = await graphqlRequest(meQuery);
        if (response && response.me) {
          setEmail(response.me.email || '');
          setName(response.me.name || '');
        }
      } catch (err) {
        console.warn('Error pre-filling user details from session:', err);
      }
    }
    loadCurrentUser();
  }, []);

  if (cart.length === 0 && !submitting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const orderItems = cart.map(item => ({
        productId: item._id,
        title: item.title,
        price: item.salePrice ?? item.price,
        pdfUrl: item.pdfUrl
      }));

      const response = await fetch('/api/checkout/polar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name,
          items: orderItems,
          totalAmount: Number(total)
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to initialize Polar checkout session');
      }

      // Redirect to Polar checkout page
      window.location.href = resData.url;
    } catch (err: any) {
      console.error('Polar checkout initialization error:', err);
      setError(err.message || 'Payment system encountered an error');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow py-12 select-none bg-[#FFFDF9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#5C4033] font-semibold hover:text-[#A855F7]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to shopping</span>
        </Link>

        <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#5C4033] tracking-tight">
          Secure Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Billing Form Column (lg:col-span-7) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white border border-[#EEDDCC] rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#5C4033] border-b border-[#FFF8EF] pb-2">
                  Customer Information
                </h3>
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C4033] uppercase">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-gray-400">PDF download links will be sent immediately to this email.</p>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C4033] uppercase">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF5FF]/30 border border-[#EEDDCC] space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#A855F7]" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#5C4033]">Secure Checkout via Polar.sh</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      You will be redirected to the Polar.sh hosted checkout to securely pay. Polar supports Credit Card, Apple Pay, Google Pay, and other local payment methods.
                    </p>
                  </div>
                </div>
                
                {/* Credit card/payment badges to improve credibility */}
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#EEDDCC]/55 opacity-70">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Accepted Payments:</span>
                  <div className="flex gap-2">
                    <div className="px-2 py-0.5 text-[9px] font-bold border border-gray-300 rounded text-gray-500 bg-white">VISA</div>
                    <div className="px-2 py-0.5 text-[9px] font-bold border border-gray-300 rounded text-gray-500 bg-white">MC</div>
                    <div className="px-2 py-0.5 text-[9px] font-bold border border-gray-300 rounded text-gray-500 bg-white">Apple Pay</div>
                    <div className="px-2 py-0.5 text-[9px] font-bold border border-gray-300 rounded text-gray-500 bg-white">Google Pay</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:shadow-none cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Redirecting to Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Proceed to Secure Payment (${total.toFixed(2)})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encryption Secure payment gateway.</span>
              </div>

            </form>
          </div>

          {/* Cart Summary Column (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#EEDDCC] rounded-3xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#5C4033] border-b border-[#FFF8EF] pb-2">
                Order Summary ({cart.length})
              </h3>

              <div className="divide-y divide-[#FFF8EF] max-h-80 overflow-y-auto space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="flex gap-3 pt-3 first:pt-0">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#EEDDCC] flex-shrink-0">
                      <Image
                        src={item.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-xs text-[#5C4033] leading-tight truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 capitalize">{item.category}</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#A855F7]">
                          ${(item.salePrice ?? item.price).toFixed(2)}
                        </span>
                        {item.salePrice && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="border-t border-[#EEDDCC] pt-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#5C4033]">${originalTotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#10B981] font-semibold">
                    <span>Buy 2 Get 1 Free Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-emerald-600 font-bold">Instant Download</span>
                </div>
                <div className="border-t border-[#EEDDCC] pt-2 flex justify-between text-sm font-bold text-[#5C4033] font-serif">
                  <span>Total Amount</span>
                  <span className="text-base text-[#A855F7]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

