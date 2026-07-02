import React from 'react';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service & Maker Licenses | Yarn Craft Co',
  description: 'Read the Yarn Craft Co terms of service. Guidelines for digital pattern downloads, maker licenses, personal craft projects, and selling finished toys.',
  alternates: {
    canonical: 'https://yarncraftco.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="w-full flex-grow py-16 sm:py-20 bg-[#FFFDF9] select-none text-[#5C4033]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Header */}
        <div className="border-b border-[#EEDDCC] pb-6 space-y-3">
          <div className="inline-flex p-2 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight">Terms of Service</h1>
          <p className="text-xs text-gray-400">Last updated: June 26, 2026</p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans select-text">
          
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">1. Agreement to Terms</h3>
            <p>
              Welcome to **Yarn Craft Co** (referred to as "we", "our", or "us"). By accessing or using our website located at `yarncraftco.com` and purchasing our digital crochet PDF patterns (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">2. Description of Service</h3>
            <p>
              Yarn Craft Co is an online platform selling downloadable digital documents in PDF format containing crochet and knitting patterns, instructions, and worksheets (referred to as "Digital Products"). We do not sell finished physical goods or shipping items.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">3. User Accounts</h3>
            <p>
              To access certain features of the site, including your permanent downloaded pattern library ("My Patterns"), you must create an account. You are responsible for safeguarding your account password and for any activities or actions under your account. You agree not to disclose your password to any third party.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">4. Digital Product License</h3>
            <p>
              When you purchase a Digital Product from Yarn Craft Co, you are granted a **limited, non-exclusive, non-transferable, personal license** to download and print the PDF file for your personal, non-commercial use.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs">
              <li>**Prohibited Conduct**: You may not share, sell, distribute, copy, upload, or email the PDF file (or printouts of the file) to others.</li>
              <li>**Finished Items License**: You **are permitted** to sell physical crochet plushies, clothes, or products made using our patterns, provided you credit "Yarn Craft Co" as the original designer.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">5. Payments, Pricing & billing</h3>
            <p>
              Payment processing is processed via secure third-party payment gateways (like **Paddle** or **PayPal**). By initiating a transaction, you authorize our payment partner to charge your credit card, debit card, or account for the total purchase price (including any applicable taxes).
            </p>
            <p className="mt-2">
              Prices for our patterns are subject to change without notice. We reserve the right to modify or discontinue any pattern listing at any time.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">6. Intellectual Property Rights</h3>
            <p>
              All content included on this website, including but not limited to PDF file text, stitch instructions, photographs, illustrations, vector graphics, logos, and site layout designs, is the exclusive intellectual property of Yarn Craft Co and protected by international copyright laws. Any unauthorized reuse of photographs or text is strictly prohibited.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">7. Limitation of Liability</h3>
            <p>
              In no event shall Yarn Craft Co, its directors, or employees, be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of (or inability to use) our digital patterns or instructions, even if advised of the possibility of such damages.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">8. Changes to Terms</h3>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 15 days' notice on our homepage before any new terms take effect.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">9. Contact Us</h3>
            <p>
              If you have any questions about these Terms of Service, please contact us at **support@yarncraftco.com** or file a ticket on our <Link href="/report" className="text-[#A855F7] hover:underline font-bold">Report Support</Link> page.
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
            <span>Secure SSL Agreement</span>
          </div>
        </div>

      </div>
    </div>
  );
}
