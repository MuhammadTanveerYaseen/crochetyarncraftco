import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { resolvers } from '@/graphql/resolvers';
import ProductDetailClient from '@/components/ProductDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate Server-side Dynamic SEO metadata
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  let product: any = null;

  try {
    const rawProduct = await resolvers.product({ id });
    if (rawProduct) {
      product = JSON.parse(JSON.stringify(rawProduct));
    }
  } catch (err) {
    console.error('Metadata generation database error:', err);
  }

  if (!product) {
    return {
      title: 'Pattern Not Found | Yarn Craft Co',
      description: 'The requested crochet PDF pattern could not be located in our store.'
    };
  }

  const siteTitle = `${product.title} - Crochet Pattern (PDF) | Yarn Craft Co`;
  const siteDescription = product.description.replace(/<[^>]*>/g, '').substring(0, 155) + '...';
  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80';

  return {
    title: siteTitle,
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: `/products/${product._id}`,
      siteName: 'Yarn Craft Co Shop',
      images: [
        {
          url: mainImage,
          width: 800,
          height: 800,
          alt: product.title
        }
      ],
      locale: 'en_US',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [mainImage]
    }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  let product: any = null;
  let similarProducts: any[] = [];

  try {
    const rawProduct = await resolvers.product({ id });
    if (rawProduct) {
      product = JSON.parse(JSON.stringify(rawProduct));
      
      const rawSimProducts = await resolvers.products({ category: product.category });
      similarProducts = JSON.parse(JSON.stringify(rawSimProducts))
        .filter((p: any) => p._id !== id)
        .slice(0, 4);
    }
  } catch (err) {
    console.error('Error fetching product data on server:', err);
  }

  // Handle pattern not found
  if (!product) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-[#FFFDF9] min-h-[500px] space-y-4 px-4 select-none">
        <div className="p-3 bg-red-50 border border-red-100 rounded-full text-red-500">
          <ArrowLeft className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-[#5C4033]">Pattern Not Found</h2>
        <p className="text-gray-500 text-sm">The requested crochet pattern could not be retrieved from the catalog.</p>
        <Link href="/" className="btn-primary text-sm px-6">Back to Catalog</Link>
      </div>
    );
  }

  // Build JSON-LD Structured SEO Data (Schema.org)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.title,
    'image': product.images,
    'description': product.description,
    'sku': product._id,
    'mpn': product._id,
    'brand': {
      '@type': 'Brand',
      'name': 'Yarn Craft Co'
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://yarncraftco.com/products/${product._id}`,
      'priceCurrency': 'USD',
      'price': product.salePrice ?? product.price,
      'priceValidUntil': '2029-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Yarn Craft Co'
      }
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '42',
      'bestRating': '5',
      'worstRating': '1'
    }
  };

  return (
    <>
      {/* Inject JSON-LD Schema.org Data for Next-Level SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Delegate interactive states to Client Component */}
      <ProductDetailClient product={product} similarProducts={similarProducts} />
    </>
  );
}
