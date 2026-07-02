import React from 'react';
import HomeClient from '@/components/HomeClient';
import { Metadata } from 'next';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string; difficulty?: string; search?: string }> }) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const difficulty = resolvedParams.difficulty;
  const search = resolvedParams.search;

  let title = 'Yarn Craft Co | Premium Crochet PDF Patterns & Amigurumi Guides';
  let description = 'Download beautiful, easy-to-follow digital crochet patterns instantly. Handcrafted row-by-row PDF guides for amigurumi plushies, cozy blankets, accessories, and clothing.';

  if (search) {
    title = `Search Results for "${search}" | Crochet Patterns | Yarn Craft Co`;
    description = `Browse premium crochet PDF patterns matching your search for "${search}". Instantly download row-by-row instructions and guides.`;
  } else if (category && category !== 'all') {
    const formattedCat = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (difficulty && difficulty !== 'all') {
      title = `${difficulty} ${formattedCat} Crochet Patterns | Yarn Craft Co`;
      description = `Discover premium ${difficulty.toLowerCase()} level ${formattedCat.toLowerCase()} crochet PDF patterns. Detailed stitch guides, instant downloads.`;
    } else {
      title = `${formattedCat} Crochet Patterns | Yarn Craft Co`;
      description = `Browse our selection of premium ${formattedCat.toLowerCase()} crochet PDF patterns. Download row-by-row instructions and material checklists instantly.`;
    }
  } else if (difficulty && difficulty !== 'all') {
    title = `${difficulty} Crochet Patterns | Yarn Craft Co`;
    description = `Explore easy-to-follow ${difficulty.toLowerCase()} level crochet PDF patterns. Get detailed row-by-row directions and creator support.`;
  }

  return {
    title,
    description,
    keywords: [
      'crochet patterns',
      'crochet pattern pdf',
      'amigurumi crochet pattern',
      'easy crochet patterns for beginners',
      'printable crochet patterns',
      'step by step amigurumi tutorial',
      'crochet plushie pattern',
      'how to crochet amigurumi',
      'crochet amigurumi plushies',
      'yarn craft patterns',
      'crochet blanket patterns pdf',
      'crochet clothes patterns',
      'instant download PDF crochet',
      category ? `${category.replace('-', ' ')} crochet patterns` : 'amigurumi patterns',
      difficulty ? `${difficulty.toLowerCase()} level crochet` : 'crochet instructions',
      ...(category ? [`download ${category.replace('-', ' ')} pdf`, `step-by-step ${category.replace('-', ' ')}`] : [])
    ],
    alternates: {
      canonical: 'https://yarncraftco.com',
    },
    openGraph: {
      title,
      description,
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
      title,
      description,
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
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://yarncraftco.com/#organization",
        "name": "Yarn Craft Co",
        "url": "https://yarncraftco.com",
        "logo": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        "email": "support@yarncraftco.com",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@yarncraftco.com",
          "url": "https://yarncraftco.com/report"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://yarncraftco.com/#website",
        "url": "https://yarncraftco.com",
        "name": "Yarn Craft Co",
        "description": "Download beautiful, easy-to-follow digital crochet patterns instantly. Handcrafted row-by-row PDF guides.",
        "publisher": {
          "@id": "https://yarncraftco.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://yarncraftco.com/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
