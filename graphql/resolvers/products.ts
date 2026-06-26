/**
 * Product resolver functions — query and mutation handlers for the Product domain.
 * Extracted from monolithic resolvers.ts for maintainability.
 */

import Product from '@/models/Product';
import { isDbConnected, inMemoryProducts, MOCK_PRODUCTS } from './shared';
import { validateProductInput } from '@/lib/validators';
import { PAGE_SIZES } from '@/lib/config';
import { assertAdmin } from './shared';
import type {
  ProductFilters,
  CreateProductInput,
  GraphQLContext,
} from '@/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function products(args: ProductFilters) {
  const queryLimit = args.limit ? Math.min(Number(args.limit), PAGE_SIZES.MAX_PRODUCTS) : PAGE_SIZES.STOREFRONT;
  const queryOffset = args.offset ? Number(args.offset) : 0;
  const { category, difficulty, search, sort } = args;

  const isConnected = await isDbConnected();

  if (isConnected) {
    const query: Record<string, any> = {};

    if (category && category !== 'all') query.category = category;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

    if (search) {
      // Use indexed $text search for performance (vs full-scan $regex)
      query.$text = { $search: search };
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'featured') sortOption = { featured: -1, createdAt: -1 };

    // When using $text search, also sort by text relevance score
    if (search) {
      sortOption = { score: { $meta: 'textScore' }, ...sortOption };
    }

    let dbQuery = Product.find(query).sort(sortOption).skip(queryOffset).limit(queryLimit);
    if (search) {
      dbQuery = (dbQuery as any).select({ score: { $meta: 'textScore' } });
    }

    let dbList = await dbQuery;

    // Auto-seed empty DB with mock data for first-run experience
    if (
      dbList.length === 0 &&
      !search &&
      (!category || category === 'all') &&
      (!difficulty || difficulty === 'all') &&
      !queryOffset
    ) {
      const cleanMocks = MOCK_PRODUCTS.map(({ _id, ...rest }) => rest);
      await Product.insertMany(cleanMocks);
      dbList = await Product.find({}).sort(sortOption).skip(0).limit(queryLimit);
    }

    return dbList;
  }

  // In-memory fallback
  let list = [...inMemoryProducts];
  if (category && category !== 'all') list = list.filter(p => p.category === category);
  if (difficulty && difficulty !== 'all') list = list.filter(p => p.difficulty === difficulty);
  if (search) {
    const term = search.toLowerCase();
    list = list.filter(
      p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );
  }

  if (sort === 'price-asc') {
    list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  } else if (sort === 'price-desc') {
    list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  } else if (sort === 'featured') {
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list.slice(queryOffset, queryOffset + queryLimit);
}

export async function product({ id }: { id: string }) {
  const isConnected = await isDbConnected();
  if (isConnected) {
    return await Product.findById(id);
  }
  return inMemoryProducts.find(p => p._id === id) ?? null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProduct(args: CreateProductInput, ctx: GraphQLContext) {
  await assertAdmin(ctx);
  validateProductInput(args);

  const isConnected = await isDbConnected();
  const cleanArgs = {
    ...args,
    title: args.title.trim(),
    description: args.description.trim(),
    price: Number(args.price),
    salePrice: args.salePrice != null ? Number(args.salePrice) : undefined,
    images: args.images?.length ? args.images : [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    ],
    materials: args.materials ?? [],
    languages: args.languages ?? ['English'],
    featured: !!args.featured,
    createdAt: new Date().toISOString(),
  };

  if (isConnected) {
    return await Product.create(cleanArgs);
  }

  const newProd = { _id: `mock-${Date.now()}`, ...cleanArgs };
  inMemoryProducts.unshift(newProd as any);
  return newProd;
}

export async function updateProduct(
  { id, ...rest }: { id: string } & Partial<CreateProductInput>,
  ctx: GraphQLContext
) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();

  if (isConnected) {
    return await Product.findByIdAndUpdate(id, rest, { new: true });
  }

  const idx = inMemoryProducts.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Product not found');
  inMemoryProducts[idx] = { ...inMemoryProducts[idx], ...rest } as any;
  return inMemoryProducts[idx];
}

export async function deleteProduct({ id }: { id: string }, ctx: GraphQLContext) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();

  if (isConnected) {
    const deleted = await Product.findByIdAndDelete(id);
    return !!deleted;
  }

  const before = inMemoryProducts.length;
  const idx = inMemoryProducts.findIndex(p => p._id === id);
  if (idx !== -1) inMemoryProducts.splice(idx, 1);
  return inMemoryProducts.length < before;
}
