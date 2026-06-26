/**
 * Shared state and utilities for all GraphQL resolver modules.
 * Centralises: DB connection logic, in-memory fallback store, mock data, assertAdmin.
 */

import dbConnect from '@/lib/db';
import User from '@/models/User';
import type { GraphQLContext } from '@/types';

// ─── Mock seed data ────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS = [
  {
    _id: 'mock-1',
    title: 'Amigurumi Crochet Giraffe Plushie',
    description:
      'Create your own adorable cuddle companion with this detailed crochet giraffe pattern! It includes step-by-step instructions, clear stitch guides, and over 30 photos to guide you through the process. Perfect as a gift or for nursery decor.',
    price: 7.99,
    salePrice: 4.99,
    category: 'amigurumi',
    difficulty: 'Intermediate',
    images: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-giraffe-pattern.pdf',
    materials: ['DK weight yarn in Yellow, Brown, and White', '2.5mm crochet hook', '10mm safety eyes', 'Polyester fiberfill stuffing', 'Yarn needle and stitch markers'],
    size: '25cm / 10 inches tall',
    languages: ['English', 'Spanish'],
    featured: true,
    createdAt: new Date(Date.now() - 1_000_000).toISOString(),
  },
  {
    _id: 'mock-2',
    title: 'Classic Amigurumi Teddy Bear',
    description: 'An easy-to-follow, classic teddy bear crochet pattern. This design is highly customizable and suitable for beginner makers. Features a soft, chubby belly and sweet floppy ears.',
    price: 5.99,
    salePrice: 3.99,
    category: 'amigurumi',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-teddy-bear.pdf',
    materials: ['Worsted weight yarn in Brown', '3.5mm crochet hook', '8mm safety eyes', 'Embroidery thread for nose', 'Stuffing'],
    size: '18cm / 7 inches tall',
    languages: ['English', 'French'],
    featured: true,
    createdAt: new Date(Date.now() - 2_000_000).toISOString(),
  },
  {
    _id: 'mock-3',
    title: 'Lilac Petal Crochet Dress Pattern',
    description: 'An elegant, vintage-inspired summer dress pattern featuring delicate petal-like skirts and an open lace back detail. Includes sizing adjustments from XS to XXL.',
    price: 12.99,
    salePrice: 8.99,
    category: 'clothing',
    difficulty: 'Advanced',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-dress.pdf',
    materials: ['Lace weight cotton yarn in Lilac', '2.0mm and 2.5mm hooks', 'Tape measure', 'Elastic thread', 'Stitch markers'],
    size: "Women's sizes XS, S, M, L, XL, XXL included",
    languages: ['English'],
    featured: false,
    createdAt: new Date(Date.now() - 3_000_000).toISOString(),
  },
  {
    _id: 'mock-4',
    title: 'Holiday Snowman & Reindeer Bundle',
    description: 'Get ready for the festive season with this duo crochet bundle! Create your own winter snowman with a cozy striped scarf, and a red-nosed reindeer helper. Buy both together and save!',
    price: 15.99,
    salePrice: 10.99,
    category: 'holiday',
    difficulty: 'Intermediate',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-holiday-bundle.pdf',
    materials: ['Yarn in Red, White, Brown, Green, and Orange', '3.0mm crochet hook', 'Safety eyes, orange felt', 'Polyester stuffing'],
    size: 'Snowman: 15cm, Reindeer: 17cm',
    languages: ['English', 'German', 'Spanish'],
    featured: true,
    createdAt: new Date(Date.now() - 4_000_000).toISOString(),
  },
  {
    _id: 'mock-5',
    title: 'Boho Fringe Crochet Shoulder Bag',
    description: 'Style meets function in this crochet shoulder bag pattern. Made using sturdy cotton cord yarn, this bag features a classic boho fringe design and an optional fabric lining instruction set.',
    price: 7.99,
    salePrice: 5.49,
    category: 'accessories',
    difficulty: 'Intermediate',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-bag.pdf',
    materials: ['3mm Cotton cord macrame yarn', '4.5mm crochet hook', 'Magnetic snaps', 'Fabric for lining (optional)'],
    size: '30cm x 28cm (excluding strap)',
    languages: ['English'],
    featured: false,
    createdAt: new Date(Date.now() - 5_000_000).toISOString(),
  },
  {
    _id: 'mock-6',
    title: 'Warm Sage Textured Throw Blanket',
    description: 'A gorgeous, super chunky textured throw blanket pattern utilizing modern waffle stitches. Perfect for keeping cozy during chilly nights or as a decorative accent for your living room couch.',
    price: 9.99,
    salePrice: 6.99,
    category: 'home-decor',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    ],
    pdfUrl: '/uploads/mock-blanket.pdf',
    materials: ['Chunky yarn in Sage Green (10 balls)', '6.5mm crochet hook', 'Tapestry needle for weaving ends'],
    size: '120cm x 150cm / 47 x 59 inches',
    languages: ['English', 'Spanish', 'French'],
    featured: false,
    createdAt: new Date(Date.now() - 6_000_000).toISOString(),
  },
] as const;

// ─── In-memory fallback state ─────────────────────────────────────────────────
// Used when MongoDB is unavailable. Mutable arrays are exported directly so
// each resolver module mutates the same shared array reference.

export let inMemoryProducts: any[] = [...MOCK_PRODUCTS];
export let inMemoryOrders: any[] = [];
export let inMemoryUsers: any[] = [];
export let inMemoryReports: any[] = [];

// ─── DB connection check (with retry throttle) ────────────────────────────────

type ConnectionStatus = 'disconnected' | 'connected' | 'checking';

let connectionStatus: ConnectionStatus = 'disconnected';
let lastCheckTime = 0;
const RETRY_INTERVAL_MS = 30_000;

export async function isDbConnected(): Promise<boolean> {
  const now = Date.now();
  if (connectionStatus === 'connected') return true;
  if (connectionStatus === 'disconnected' && now - lastCheckTime < RETRY_INTERVAL_MS) {
    return false;
  }

  connectionStatus = 'checking';
  lastCheckTime = now;

  try {
    await dbConnect();
    connectionStatus = 'connected';
    return true;
  } catch {
    connectionStatus = 'disconnected';
    return false;
  }
}

// ─── Admin assertion ─────────────────────────────────────────────────────────

export async function assertAdmin(ctx: GraphQLContext): Promise<void> {
  if (!ctx?.userId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const isConnected = await isDbConnected();
  let user: any = null;

  if (isConnected) {
    user = await User.findById(ctx.userId).select('role').lean();
  } else {
    user = inMemoryUsers.find(u => u._id === ctx.userId);
  }

  if (!user || user.role !== 'admin') {
    throw new Error('Forbidden: Administrative access required');
  }
}
