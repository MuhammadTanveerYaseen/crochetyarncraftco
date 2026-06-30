import { NextResponse } from 'next/server';
import { graphql } from 'graphql';
import { schema } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, AUTH_COOKIE_NAME } from '@/lib/config';
import { queryLimiter, mutationLimiter, getClientIp, isMutation } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'Invalid JSON in request body' }] },
      { status: 400 }
    );
  }

  const { query, variables } = body;

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { errors: [{ message: 'GraphQL query is missing or invalid' }] },
      { status: 400 }
    );
  }

  // Apply tighter rate limits for mutations (login, register, order creation)
  const limiter = isMutation(body) ? mutationLimiter : queryLimiter;
  const rateResult = limiter.check(ip);

  if (!rateResult.success) {
    return NextResponse.json(
      {
        errors: [{
          message: `Too many requests. Please retry after ${rateResult.retryAfterSeconds} seconds.`,
          extensions: { code: 'RATE_LIMITED', retryAfterSeconds: rateResult.retryAfterSeconds },
        }],
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateResult.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateResult.resetAt / 1000)),
        },
      }
    );
  }

  // ── Auth context ─────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(AUTH_COOKIE_NAME);

  let userId: string | null = null;
  if (tokenCookie?.value) {
    try {
      const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      // Invalid or expired token — continue as unauthenticated
    }
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: resolvers,
      variableValues: variables,
      contextValue: { userId, cookieStore, request },
    });

    const response = NextResponse.json(result);
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
    return response;
  } catch (error: any) {
    console.error('GraphQL execution error:', error);
    return NextResponse.json(
      { errors: [{ message: error.message || 'Internal server error' }] },
      { status: 500 }
    );
  }
}
