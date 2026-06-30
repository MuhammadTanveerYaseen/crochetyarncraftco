/**
 * Auth resolver functions — register, login, logout, me, myOrders.
 */

import User from '@/models/User';
import Campaign from '@/models/Campaign';
import Order from '@/models/Order';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/config';
import { validateRegisterInput, validateLoginInput } from '@/lib/validators';
import { isDbConnected, inMemoryUsers, assertAdmin } from './shared';
import { sendMarketingEmail } from '@/lib/email';
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

export async function users(_: unknown, ctx: GraphQLContext) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();
  if (isConnected) {
    const list = await User.find({}).sort({ createdAt: -1 }).lean();
    return list.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role ?? 'user',
      createdAt: u.createdAt?.toISOString?.() || new Date(u.createdAt).toISOString()
    }));
  }
  return inMemoryUsers;
}

export async function campaigns(_: unknown, ctx: GraphQLContext) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();
  if (isConnected) {
    const list = await Campaign.find({}).sort({ sentAt: -1 }).lean();
    return list.map((c: any) => ({
      _id: c._id.toString(),
      subject: c.subject,
      promoCode: c.promoCode,
      discountPercent: c.discountPercent,
      message: c.message,
      segment: c.segment,
      emailsSentCount: c.emailsSentCount,
      sentAt: c.sentAt?.toISOString?.() || new Date(c.sentAt).toISOString()
    }));
  }
  return [];
}

export async function sendBulkPromoEmail(
  args: { subject: string; promoCode: string; discountPercent: number; message: string; segment: string },
  ctx: GraphQLContext
) {
  await assertAdmin(ctx);
  const isConnected = await isDbConnected();
  const { subject, promoCode, discountPercent, message, segment } = args;

  let targetEmails: string[] = [];
  if (segment.startsWith('individual:')) {
    const email = segment.substring(11).trim();
    if (email) targetEmails = [email];
  } else if (segment.startsWith('custom:')) {
    targetEmails = segment
      .substring(7)
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'));
  } else {
    if (isConnected) {
      // Determine customer segments based on order history count
      const allOrders = await Order.find({}).select('customerEmail').lean();
      const orderCountsByEmail: Record<string, number> = {};
      for (const o of allOrders) {
        if (o.customerEmail) {
          const cleanEmail = o.customerEmail.toLowerCase().trim();
          orderCountsByEmail[cleanEmail] = (orderCountsByEmail[cleanEmail] || 0) + 1;
        }
      }

      const allUsers = await User.find({}).select('email').lean();
      
      if (segment === 'non-purchasers') {
        targetEmails = allUsers
          .filter(u => !orderCountsByEmail[u.email.toLowerCase().trim()])
          .map(u => u.email);
      } else if (segment === 'purchasers') {
        targetEmails = allUsers
          .filter(u => (orderCountsByEmail[u.email.toLowerCase().trim()] || 0) >= 1)
          .map(u => u.email);
      } else if (segment === 'vips') {
        targetEmails = allUsers
          .filter(u => (orderCountsByEmail[u.email.toLowerCase().trim()] || 0) >= 3)
          .map(u => u.email);
      } else {
        // 'all'
        targetEmails = allUsers.map(u => u.email);
      }
    } else {
      targetEmails = inMemoryUsers.map(u => u.email);
    }
  }

  if (targetEmails.length === 0) {
    throw new Error(`No registered users match the selected targeting segment: "${segment}".`);
  }

  console.log(`Sending marketing promo email to ${targetEmails.length} segmented users (Segment: ${segment})...`);

  let dynamicSiteUrl: string | undefined = undefined;
  if (ctx?.request) {
    const host = ctx.request.headers.get('host') || 'localhost:3000';
    const proto = ctx.request.headers.get('x-forwarded-proto') || 'http';
    dynamicSiteUrl = `${proto}://${host}`;
  }

  for (const email of targetEmails) {
    try {
      await sendMarketingEmail({
        toEmail: email,
        subject,
        promoCode,
        discountPercent,
        message,
        siteUrl: dynamicSiteUrl
      });
    } catch (err) {
      console.error(`Failed to send marketing email to ${email}:`, err);
    }
  }

  // Save campaign tracking log to database
  if (isConnected) {
    try {
      await Campaign.create({
        subject,
        promoCode,
        discountPercent,
        message,
        segment,
        emailsSentCount: targetEmails.length
      });
    } catch (dbErr) {
      console.error("Failed to write Campaign log to MongoDB:", dbErr);
    }
  }

  return targetEmails.length;
}
