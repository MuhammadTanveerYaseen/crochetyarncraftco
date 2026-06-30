import React from 'react';
import HomeClient from '@/components/HomeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yarn Craft Co | Premium Crochet PDF Patterns & Amigurumi Guides',
  description: 'Download beautiful, easy-to-follow digital crochet patterns instantly. Handcrafted row-by-row PDF guides for amigurumi plushies, cozy blankets, accessories, and clothing.',
  keywords: [
    'crochet patterns',
    'amigurumi guides',
    'pdf patterns',
    'crochet plushies',
    'knitting guides',
    'digital patterns',
    'yarn craft',
    'handmade plushies',
    'crochet instructions'
  ],
  alternates: {
    canonical: 'https://yarncraftco.com',
  },
  openGraph: {
    title: 'Yarn Craft Co | Premium Crochet PDF Patterns & Amigurumi Guides',
    description: 'Download beautiful, easy-to-follow digital crochet patterns instantly. Handcrafted row-by-row PDF guides for amigurumi plushies, cozy blankets, accessories, and clothing.',
    url: 'https://yarncraftco.com',
    siteName: 'Yarn Craft Co',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'Yarn Craft Co Premium Crochet PDF Patterns Catalog'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yarn Craft Co | Premium Crochet PDF Patterns & Amigurumi Guides',
    description: 'Download beautiful, easy-to-follow digital crochet patterns instantly.',
    images: ['https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function HomePage() {
  return <HomeClient />;
}
