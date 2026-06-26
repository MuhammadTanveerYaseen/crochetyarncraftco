/**
 * Auth resolver functions — register, login, logout, me, myOrders.
 */

import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/config';
import { validateRegisterInput, validateLoginInput } from '@/lib/validators';
import { isDbConnected, inMemoryUsers } from './shared';
import type { GraphQLContext, RegisterInput, LoginInput } from '@/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function me(_: unknown, ctx: GraphQLContext) {
  if (!ctx?.userId) return null;

  const isConnected = await isDbConnected();
  if (isConnected) {
    const user = await User.findById(ctx.userId).select('-password').lean();
    if (!user) return null;
    return {
      _id: (user as any)._id.toString(),
      name: (user as any).name,
      email: (user as any).email,
      role: (user as any).role ?? 'user',
      createdAt: (user as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  const user = inMemoryUsers.find(u => u._id === ctx.userId);
  if (!user) return null;
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role ?? 'user',
    createdAt: user.createdAt,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput, ctx: GraphQLContext) {
  const validated = validateRegisterInput(input);
  const { name, email, password } = validated;

  const isConnected = await isDbConnected();

  // Check for duplicate email
  if (isConnected) {
    const existing = await User.findOne({ email }).lean();
    if (existing) throw new Error('Email is already registered');
  } else {
    if (inMemoryUsers.find(u => u.email === email)) {
      throw new Error('Email is already registered');
    }
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Admin role is ONLY assigned via explicit ADMIN_BOOTSTRAP_EMAIL env var, not by email pattern
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase().trim();
  const role = bootstrapEmail && email === bootstrapEmail ? 'admin' : 'user';

  let user: any;
  if (isConnected) {
    user = await User.create({ name, email, password: hashedPassword, role, createdAt: new Date() });
  } else {
    user = {
      _id: `user-mock-${Date.now()}`,
      name, email, password: hashedPassword, role,
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.push(user);
  }

  const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  ctx?.cookieStore?.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt?.toString?.() ?? user.createdAt,
    },
    token,
  };
}

export async function login(input: LoginInput, ctx: GraphQLContext) {
  const { email, password } = validateLoginInput(input);

  const isConnected = await isDbConnected();
  let user: any = null;

  if (isConnected) {
    user = await User.findOne({ email });
  } else {
    user = inMemoryUsers.find(u => u.email === email);
  }

  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password ?? '');
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  ctx?.cookieStore?.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role ?? 'user',
      createdAt: user.createdAt?.toString?.() ?? user.createdAt,
    },
    token,
  };
}

export async function logout(_: unknown, ctx: GraphQLContext) {
  ctx?.cookieStore?.delete(AUTH_COOKIE_NAME);
  return true;
}
