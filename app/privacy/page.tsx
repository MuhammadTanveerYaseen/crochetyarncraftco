'use client';

import React from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="w-full flex-grow py-16 sm:py-20 bg-[#FFFDF9] select-none text-[#5C4033]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Header */}
        <div className="border-b border-[#EEDDCC] pb-6 space-y-3">
          <div className="inline-flex p-2 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
          <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-gray-400">Last updated: June 26, 2026</p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans select-text">
          
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">1. Introduction</h3>
            <p>
              At **Yarn Craft Co** (referred to as "we", "our", or "us"), we respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website `yarncraftco.com` and buy our digital crochet patterns.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">2. Information We Collect</h3>
            <p>
              We collect personal information that you voluntarily provide to us when registering an account, purchasing digital patterns, subscribing to our maker newsletter, or filing a support ticket.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs">
              <li>**Identity Data**: Name, username.</li>
              <li>**Contact Data**: Email address.</li>
              <li>**Transaction Data**: Details about payments to and from you, and details of digital patterns you have purchased from us (Order IDs).</li>
              <li>**Technical Data**: Internet protocol (IP) address, browser type and version, time zone setting and location, and browser cookies.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">3. How We Use Your Information</h3>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs">
              <li>Deliver purchased digital PDF patterns directly to your email inbox.</li>
              <li>Maintain your client-side session and save purchased downloads inside your profile history.</li>
              <li>Process checkout payments securely via our payment providers (like **Paddle**).</li>
              <li>Send you newsletter discount codes and new pattern announcements (you can unsubscribe at any time).</li>
              <li>Respond to your stitch support tickets and customer help requests.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">4. How Information is Shared</h3>
            <p>
              We do **not** sell, rent, or trade your personal data with third-party advertisers. We share information only with trusted service partners essential to running the storefront:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs">
              <li>**Payment Gateways (Paddle, PayPal)**: To process credit cards securely. They handle payment payloads directly under their own privacy regulations. We do not store credit card numbers on our servers.</li>
              <li>**Email Services**: To send transaction emails and delivery download links automatically.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">5. Security of Your Data</h3>
            <p>
              We implement industry-standard secure socket layers (SSL) encryption to protect your personal details during checkout and account logins. However, please remember that no transmission method over the internet is 100% secure, and we cannot guarantee absolute data protection.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">6. Cookies and Tracking</h3>
            <p>
              We use functional session cookies to verify your identity and keep you signed in. You can configure your browser to block or alert you about these cookies, but please note that blocking them will prevent you from logging in or using the profile downloads vault.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">7. Your Rights</h3>
            <p>
              Depending on your location (e.g. EU GDPR), you have the right to request access to the personal data we store, ask to correct or update incorrect data, or request the deletion of your account and personal history. To execute these rights, please email us.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-[#5C4033]">8. Contact Privacy Team</h3>
            <p>
              If you have inquiries regarding our data handling or wish to remove your customer profile logs, contact us at **support@yarncraftco.com**.
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
            <span>GDPR Compliance Safeguards</span>
          </div>
        </div>

      </div>
    </div>
  );
}
