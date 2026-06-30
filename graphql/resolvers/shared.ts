/**
 * Shared state and utilities for all GraphQL resolver modules.
 * Centralises: DB connection logic, in-memory fallback store, mock data, assertAdmin.
 */

import dbConnect from '@/lib/db';
import User from '@/models/User';
import type { GraphQLContext } from '@/types';
import fs from 'fs';
import path from 'path';

// ─── Mock seed data ────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS = [] as const;

// ─── In-memory fallback state ─────────────────────────────────────────────────
// Used when MongoDB is unavailable. Mutable arrays are exported directly so
// each resolver module mutates the same shared array reference.

const MOCK_DB_PATH = path.join(process.cwd(), 'lib/mock_db_products.json');

function loadInMemoryProducts() {
  try {
    if (fs.existsSync(MOCK_DB_PATH)) {
      const data = fs.readFileSync(MOCK_DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read local mock DB:', err);
  }
  
  // Write default mocks on first load
  try {
    const defaultMocks = [...MOCK_PRODUCTS];
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultMocks, null, 2), 'utf8');
    return defaultMocks;
  } catch (err) {
    console.error('Failed to write local mock DB:', err);
  }
  return [...MOCK_PRODUCTS];
}

export let inMemoryProducts: any[] = loadInMemoryProducts();

export function saveInMemoryProducts(products: any[]) {
  inMemoryProducts = products;
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local mock DB:', err);
  }
}

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
