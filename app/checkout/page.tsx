'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, Lock, CreditCard, Mail, User, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { graphqlRequest } from '@/lib/graphqlClient';

export default function CheckoutPage() {
  const { cart, originalTotal, discount, total, clearCart } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Simulate short processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const orderItems = cart.map(item => ({
        productId: item._id,
        title: item.title,
        price: item.salePrice ?? item.price
      }));

      const checkoutMutation = `
        mutation PlaceOrder($email: String!, $items: [OrderItemInput!]!, $total: Float!) {
          createOrder(customerEmail: $email, items: $items, totalAmount: $total) {
            _id
            customerEmail
            totalAmount
            items {
              productId
              title
              price
            }
          }
        }
      `;

      const data = await graphqlRequest(checkoutMutation, {
        email,
        items: orderItems.map(item => ({
          productId: item.productId,
          title: item.title,
          price: Number(item.price)
        })),
        total: Number(total)
      });

      if (data.createOrder) {
        const orderData = data.createOrder;
        // Clear cart first
        clearCart();
        // Redirect to success, sending details in query parameters for simple delivery display
        const queryParams = new URLSearchParams();
        queryParams.set('email', email);
        queryParams.set('orderId', orderData._id || `mock-order-${Date.now()}`);
        
        // Pass products details for download
        orderData.items.forEach((item: any) => {
          // Find original PDF path from cart to let them download it
          const original = cart.find(c => c._id === item.productId || c.title === item.title);
          queryParams.append('titles', item.title);
          queryParams.append('pdfs', original?.pdfUrl || '/uploads/mock-pattern.pdf');
        });

        router.push(`/checkout-success?${queryParams.toString()}`);
      } else {
        setError('Failed to complete checkout');
      }
    } catch (err: any) {
      console.error('Checkout submit error:', err);
      setError(err.message || 'Payment system encountered an error');
    } finally {
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
                  1. Contact Information
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

              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#5C4033] border-b border-[#FFF8EF] pb-2">
                  2. Payment Details
                </h3>

                {/* Mock Card Input */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5C4033] uppercase">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#5C4033] uppercase">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="12/28"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-sm text-[#1F2937] outline-none text-center font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#5C4033] uppercase">Security Code (CVV)</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-sm text-[#1F2937] outline-none text-center font-mono"
                      />
                    </div>
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
                className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Authorize Payment & Download (${total.toFixed(2)})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encryption Secure payment gateway checkout.</span>
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
