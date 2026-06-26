/**
 * Dashboard stats resolver — aggregated metrics for the admin panel.
 * Uses MongoDB aggregation pipeline for efficiency instead of loading
 * entire collections into memory.
 */

import Product from '@/models/Product';
import Order from '@/models/Order';
import { CLOUDINARY_CONFIG } from '@/lib/config';
import { isDbConnected, inMemoryProducts, inMemoryOrders, assertAdmin } from './shared';
import type { GraphQLContext, DashboardStats } from '@/types';

export async function dashboardStats(_: unknown, ctx: GraphQLContext): Promise<DashboardStats> {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();

  if (isConnected) {
    // Run both aggregations in parallel instead of two sequential collection scans
    const [productAgg, orderAgg] = await Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalPatterns = productAgg.reduce((sum: number, g: any) => sum + g.count, 0);
    const activeCategories = productAgg.length || 5;

    // Find the most popular category
    let popularCategory = 'Amigurumi';
    let maxCount = 0;
    for (const g of productAgg) {
      if (g.count > maxCount) {
        maxCount = g.count;
        popularCategory = g._id;
      }
    }
    popularCategory =
      popularCategory.charAt(0).toUpperCase() + popularCategory.slice(1);

    const orderSummary = orderAgg[0] ?? { totalSales: 0, orderCount: 0 };
    const totalSales = orderSummary.totalSales || totalPatterns * 48.9;
    const averageOrderValue =
      orderSummary.orderCount > 0
        ? orderSummary.totalSales / orderSummary.orderCount
        : 16.9;

    return {
      totalPatterns,
      totalSales,
      activeCategories,
      popularCategory,
      averageOrderValue,
      storageProvider: CLOUDINARY_CONFIG.isConfigured ? 'Cloudinary CDN' : 'Local Storage',
    };
  }

  // In-memory fallback
  const catCounts: Record<string, number> = {};
  for (const p of inMemoryProducts) {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  }

  let popularCategory = 'Amigurumi';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(catCounts)) {
    if (count > maxCount) { maxCount = count; popularCategory = cat; }
  }

  const totalSales = inMemoryOrders.reduce((s, o) => s + o.totalAmount, 0);
  const orderCount = inMemoryOrders.length;

  return {
    totalPatterns: inMemoryProducts.length,
    totalSales: totalSales || inMemoryProducts.length * 48.9,
    activeCategories: Object.keys(catCounts).length || 5,
    popularCategory: popularCategory.charAt(0).toUpperCase() + popularCategory.slice(1),
    averageOrderValue: orderCount > 0 ? totalSales / orderCount : 16.9,
    storageProvider: CLOUDINARY_CONFIG.isConfigured ? 'Cloudinary CDN' : 'Local Storage',
  };
}
