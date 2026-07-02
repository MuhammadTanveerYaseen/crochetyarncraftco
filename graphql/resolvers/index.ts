/**
 * Main resolver index — merges all domain resolver modules into the single
 * rootValue object that the GraphQL execution engine expects.
 *
 * Adding a new domain? Create `resolvers/<domain>.ts` and add it here.
 */

import * as productResolvers from './products';
import * as orderResolvers from './orders';
import * as authResolvers from './auth';
import * as reportResolvers from './reports';
import { dashboardStats } from './stats';
import type { GraphQLContext } from '@/types';

/**
 * The rootValue object passed to graphql({ rootValue }).
 * Each key maps directly to a Query or Mutation field name in the schema.
 *
 * Note: graphql-js rootValue functions receive (args, context, info).
 * We wrap each resolver to pass context correctly.
 */
export const resolvers = {
  // ── Products ──────────────────────────────────────────────────────────────
  products: (args: any) => productResolvers.products(args),
  product: (args: any) => productResolvers.product(args),
  createProduct: (args: any, ctx: GraphQLContext) => productResolvers.createProduct(args, ctx),
  updateProduct: (args: any, ctx: GraphQLContext) => productResolvers.updateProduct(args, ctx),
  deleteProduct: (args: any, ctx: GraphQLContext) => productResolvers.deleteProduct(args, ctx),
  categories: () => productResolvers.categories(),
  notifyAdminProductFavorited: (args: any, ctx: GraphQLContext) => productResolvers.notifyAdminProductFavorited(args, ctx),

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: (args: any, ctx: GraphQLContext) => orderResolvers.orders(args, ctx),
  myOrders: (_: any, ctx: GraphQLContext) => orderResolvers.myOrders(_, ctx),
  createOrder: (args: any, ctx: GraphQLContext) => orderResolvers.createOrder(args, ctx),

  // ── Auth ──────────────────────────────────────────────────────────────────
  me: (_: any, ctx: GraphQLContext) => authResolvers.me(_, ctx),
  register: (args: any, ctx: GraphQLContext) => authResolvers.register(args, ctx),
  login: (args: any, ctx: GraphQLContext) => authResolvers.login(args, ctx),
  logout: (_: any, ctx: GraphQLContext) => authResolvers.logout(_, ctx),
  users: (_: any, ctx: GraphQLContext) => authResolvers.users(_, ctx),
  campaigns: (_: any, ctx: GraphQLContext) => authResolvers.campaigns(_, ctx),
  sendBulkPromoEmail: (args: any, ctx: GraphQLContext) => authResolvers.sendBulkPromoEmail(args, ctx),

  // ── Reports ───────────────────────────────────────────────────────────────
  reports: (args: any, ctx: GraphQLContext) => reportResolvers.reports(args, ctx),
  createReport: (args: any) => reportResolvers.createReport(args),
  resolveReport: (args: any, ctx: GraphQLContext) => reportResolvers.resolveReport(args, ctx),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboardStats: (_: any, ctx: GraphQLContext) => dashboardStats(_, ctx),
};

export default resolvers;
