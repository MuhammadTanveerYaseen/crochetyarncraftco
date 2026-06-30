'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, FileText, ArrowRight, Mail, User, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { graphqlRequest } from '@/lib/graphqlClient';
import ProductCard from '@/components/ProductCard';

function SuccessContent() {
  const { clearCart } = useCart();

  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const orderId = searchParams.get('orderId') || `order-${Date.now()}`;
  
  // Extract lists of titles and pdf paths
  const titles = searchParams.getAll('titles');
  const pdfs = searchParams.getAll('pdfs');

  const orderedItems = titles.map((title, index) => ({
    title,
    pdfUrl: pdfs[index] || '/uploads/mock-pattern.pdf'
  }));

  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Clear shopping cart on successful checkout completion
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    async function loadRecommendations() {
      const query = `
        query GetRecommendations {
          products(limit: 6) {
            items {
              _id
              title
              description
              price
              salePrice
              images
              category
              difficulty
              pdfUrl
              featured
            }
          }
        }
      `;
      try {
        const data = await graphqlRequest(query);
        if (data?.products?.items) {
          // Filter out already purchased items in this order
          const filtered = data.products.items.filter((item: any) => {
            return !pdfs.includes(item.pdfUrl);
          });
          setRecommendations(filtered.slice(0, 3));
        }
      } catch (err) {
        console.warn("Failed to load recommendations:", err);
      }
    }
    loadRecommendations();
  }, [pdfs]);


  return (
    <div className="w-full flex-grow py-16 bg-[#FFFDF9] select-none text-center">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* Success Header */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h1 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-[#5C4033] tracking-tight">
            Order Completed!
          </h1>
          
          <p className="text-gray-600 max-w-lg mx-auto text-sm sm:text-base">
            Thank you for supporting crochet designers! Your payment has been authorized and your PDF patterns are ready for download below.
          </p>
        </div>

        {/* Order Details Panel */}
        <div className="bg-[#FBF7F0] border border-[#EEDDCC] rounded-3xl p-5 text-left text-sm text-[#5C4033] space-y-2.5 max-w-xl mx-auto">
          <div className="flex justify-between border-b border-[#EEDDCC]/55 pb-2">
            <span className="font-semibold text-gray-500 uppercase text-xs">Order ID</span>
            <span className="font-mono font-bold">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500 uppercase text-xs">Delivery Email</span>
            <span className="font-semibold flex items-center gap-1">
              <Mail className="w-4 h-4 text-[#A855F7]" />
              {email}
            </span>
          </div>
        </div>

        {/* Account Info Notice */}
        <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl max-w-xl mx-auto flex items-start gap-3 text-left animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#A855F7] flex-shrink-0">
            <User className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#5C4033] uppercase tracking-wider">Account Profile Active</h4>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              We have automatically logged you into your new profile. We sent your temporary password credentials to <strong>{email}</strong> so you can sign in next time.
            </p>
          </div>
        </div>

        {/* PDF Download list */}
        <div className="space-y-4 max-w-xl mx-auto text-left">
          <h3 className="font-serif font-bold text-lg text-[#5C4033] px-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#A855F7]" />
            <span>Download Your Patterns</span>
          </h3>

          <div className="space-y-3">
            {orderedItems.length === 0 ? (
              <div className="p-4 bg-white border border-[#EEDDCC] rounded-2xl flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5C4033]">Default Amigurumi Crochet Pattern (PDF)</span>
                <a 
                  href="/uploads/mock-giraffe-pattern.pdf"
                  download
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            ) : (
              orderedItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-white border border-[#EEDDCC] rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-[#D2BEAC] shadow-sm hover:shadow"
                >
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Item {idx + 1}</span>
                    <h4 className="text-sm font-serif font-bold text-[#5C4033] truncate mt-0.5">{item.title}</h4>
                  </div>
                  
                  {/* Download Link */}
                  <a 
                    href={item.pdfUrl}
                    download={item.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'}
                    onClick={(e) => {
                      // Let's print details to server logs for convenience
                      console.log(`Downloading: ${item.title} from path ${item.pdfUrl}`);
                    }}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/profile" 
            className="btn-primary py-3 px-8 text-sm font-semibold flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
          >
            <span>Go to My Profile Library</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/" 
            className="btn-secondary py-3 px-8 text-sm hover:bg-[#FBF7F0] font-semibold w-full sm:w-auto text-center"
          >
            <span>Back to Homepage</span>
          </Link>
        </div>

        {/* Recommended Products Upsell */}
        {recommendations.length > 0 && (
          <div className="border-t border-[#EEDDCC] pt-12 space-y-6 max-w-4xl mx-auto text-left animate-fadeIn">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif font-black text-xl text-[#5C4033] flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-[#A855F7]" />
                <span>Keep Stitching! Recommended Patterns for You</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">Add more premium patterns to your collection and start your next project today.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recommendations.map((prod) => (
                <div key={prod._id} className="h-full">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center bg-[#FFFDF9] min-h-[500px]">
        <div className="spinner" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
