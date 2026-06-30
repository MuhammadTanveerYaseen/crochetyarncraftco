import type { Metadata } from 'next';
import { Poppins, Fraunces } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import PromoBar from '@/components/PromoBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ToastContainer from '@/components/ToastContainer';
import { Suspense } from 'react';
import FacebookPixel from '@/components/FacebookPixel';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yarncraftco.com'),
  title: {
    default: 'Yarn Craft Co | Cozy Crochet PDF Patterns',
    template: '%s | Yarn Craft Co'
  },
  description: 'Download beautiful, premium digital crochet and knitting patterns instantly. Step-by-step PDF instructions for plushies, clothing, and home decor.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yarncraftco.com',
    siteName: 'Yarn Craft Co',
  },
  twitter: {
    card: 'summary_large_image',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className={`${poppins.variable} ${fraunces.variable} min-h-full flex flex-col bg-[#FFFDF9] text-[#1F2937] font-sans selection:bg-[#A855F7]/10 selection:text-[#A855F7]`}>
        <FacebookPixel />
        <Suspense fallback={<div className="h-2 w-full bg-[#A855F7] animate-pulse" />}>
          <CartProvider>
            <PromoBar />
            <Header />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
            <CartDrawer />
            <ToastContainer />
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}
