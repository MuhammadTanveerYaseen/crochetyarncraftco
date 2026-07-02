/**
 * Order resolver functions — createOrder, orders (admin), myOrders (user).
 */

import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { sendPatternEmail, sendAdminSaleNotification } from '@/lib/email';
import { PAGE_SIZES } from '@/lib/config';
import { validateOrderInput } from '@/lib/validators';
import { isDbConnected, inMemoryOrders, inMemoryUsers, inMemoryProducts } from './shared';
import { assertAdmin } from './shared';
import type { GraphQLContext, CreateOrderInput, OrdersQueryArgs } from '@/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Admin: list all orders with pagination */
export async function orders(
  { limit, offset }: OrdersQueryArgs,
  ctx: GraphQLContext
) {
  await assertAdmin(ctx);
  const pageLimit = Math.min(Number(limit ?? PAGE_SIZES.ADMIN_ORDERS), 100);
  const pageOffset = Number(offset ?? 0);

  const isConnected = await isDbConnected();
  if (isConnected) {
    return await Order.find()
      .sort({ createdAt: -1 })
      .skip(pageOffset)
      .limit(pageLimit)
      .lean();
  }
  return inMemoryOrders.slice(pageOffset, pageOffset + pageLimit);
}

/** Authenticated user: list their own orders */
export async function myOrders(_: unknown, ctx: GraphQLContext) {
  if (!ctx?.userId) return [];

  const isConnected = await isDbConnected();
  let userEmail = '';

  if (isConnected) {
    const user = await User.findById(ctx.userId).select('email').lean();
    if (user) userEmail = (user as any).email;
  } else {
    const user = inMemoryUsers.find(u => u._id === ctx.userId);
    if (user) userEmail = user.email;
  }

  if (isConnected) {
    const query: any = { $or: [{ userId: ctx.userId }] };
    if (userEmail) query.$or.push({ customerEmail: userEmail });
    return await Order.find(query).sort({ createdAt: -1 }).lean();
  }

  return inMemoryOrders.filter(
    o =>
      o.userId === ctx.userId ||
      (userEmail && o.customerEmail.toLowerCase() === userEmail.toLowerCase())
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput, ctx: GraphQLContext) {
  validateOrderInput(input);

  const isConnected = await isDbConnected();
  const currentUserId = ctx?.userId ?? input.userId ?? null;

  const orderData = {
    userId: currentUserId,
    customerEmail: input.customerEmail.toLowerCase().trim(),
    items: input.items,
    totalAmount: Number(input.totalAmount),
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
  };

  let savedOrder: any;
  if (isConnected) {
    savedOrder = await Order.create(orderData);
  } else {
    savedOrder = { _id: `order-mock-${Date.now()}`, ...orderData };
    inMemoryOrders.unshift(savedOrder);
  }

  // Resolve pattern download URLs for the email
  const resolvedItems: Array<{ title: string; price: number; pdfUrl: string }> = [];

  for (const item of input.items) {
    let pdfUrl = '/uploads/mock-pattern.pdf';
    try {
      if (isConnected) {
        const prod = await Product.findById(item.productId).select('pdfUrl').lean();
        if (prod && (prod as any).pdfUrl) pdfUrl = (prod as any).pdfUrl;
      } else {
        const prod = inMemoryProducts.find(p => p._id === item.productId);
        if (prod?.pdfUrl) pdfUrl = prod.pdfUrl;
      }
    } catch (err) {
      console.warn(`Could not resolve pdfUrl for product ${item.productId}:`, err);
    }
    resolvedItems.push({ title: item.title, price: item.price, pdfUrl });
  }

  let dynamicSiteUrl: string | undefined = undefined;
  if (ctx?.request) {
    const host = ctx.request.headers.get('host') || 'localhost:3000';
    const proto = ctx.request.headers.get('x-forwarded-proto') || 'http';
    dynamicSiteUrl = `${proto}://${host}`;
  }

  // Fire-and-forget email dispatch (non-blocking)
  sendPatternEmail({
    toEmail: orderData.customerEmail,
    orderId: savedOrder._id.toString(),
    total: Number(input.totalAmount),
    items: resolvedItems,
    siteUrl: dynamicSiteUrl
  }).catch(err => console.error('Order email dispatch failed:', err));

  // Notify admin of the new sale
  sendAdminSaleNotification({
    orderId: savedOrder._id.toString(),
    customerEmail: orderData.customerEmail,
    totalAmount: Number(input.totalAmount),
    items: resolvedItems.map(item => ({ title: item.title, price: item.price })),
    siteUrl: dynamicSiteUrl
  }).catch(err => console.error('Admin sale notification email failed:', err));

  return savedOrder;
}
