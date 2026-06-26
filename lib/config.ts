/**
 * Centralized application configuration for Yarn Craft Co.
 * All runtime constants live here — import from this file, never hardcode inline.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

// JWT_SECRET: loaded from env, with a safe fallback for dev and a runtime
// warning for production. We intentionally do NOT throw at module load time
// because Next.js executes server modules at build time (page data collection)
// and a module-level throw breaks the entire build. Auth operations will fail
// naturally at request time if the secret is truly missing.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn(
    '[WARN] JWT_SECRET is not set in production. ' +
    'Auth operations will fail. Set it in .env.local or your deployment environment.'
  );
}

export const JWT_SECRET: string =
  process.env.JWT_SECRET ?? 'dev-only-jwt-secret-please-set-in-env';

export const JWT_EXPIRES_IN = '7d';

/** Number of bcrypt salt rounds. 12 is the recommended production value. */
export const BCRYPT_ROUNDS = 12;

// ─── Cookie ───────────────────────────────────────────────────────────────────

/** The HTTP-only auth cookie name. Changed from old brand `crafting_pattern_token`. */
export const AUTH_COOKIE_NAME = 'yarncraft_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  path: '/',
  sameSite: 'lax' as const,
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGE_SIZES = {
  /** Default products per page on the storefront */
  STOREFRONT: 8,
  /** Max products allowed per request (prevents abuse) */
  MAX_PRODUCTS: 50,
  /** Orders per page in admin panel */
  ADMIN_ORDERS: 20,
  /** Reports per page in admin panel */
  ADMIN_REPORTS: 30,
} as const;

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** General GraphQL queries: 60 requests per minute per IP */
  QUERY: { max: 60, windowMs: 60_000 },
  /** Mutations (login, register, order): 10 per minute per IP */
  MUTATION: { max: 10, windowMs: 60_000 },
} as const;

// ─── Cloudinary ───────────────────────────────────────────────────────────────

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  apiKey: process.env.CLOUDINARY_API_KEY ?? '',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  get isConfigured() {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  },
};

// ─── Site ─────────────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const SUPPORT_EMAIL = 'support@yarncraftco.com';

export const BRAND_NAME = 'Yarn Craft Co';
