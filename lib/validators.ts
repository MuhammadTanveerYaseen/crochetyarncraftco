/**
 * Lightweight input validation for GraphQL resolver arguments.
 * Zero external dependencies — plain TypeScript.
 * Throws structured GraphQLError-compatible errors with HTTP status codes.
 */

import type {
  CreateProductInput,
  RegisterInput,
  LoginInput,
  CreateOrderInput,
  CreateReportInput,
} from '@/types';

// ─── Error helper ─────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'BAD_USER_INPUT';
    this.field = field;
  }
}

function assert(condition: boolean, message: string, field?: string): void {
  if (!condition) throw new ValidationError(message, field);
}

// ─── Email ────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string, field = 'email'): string {
  const trimmed = email.trim().toLowerCase();
  assert(trimmed.length > 0, 'Email is required', field);
  assert(EMAIL_REGEX.test(trimmed), 'Invalid email address format', field);
  assert(trimmed.length <= 254, 'Email address is too long', field);
  return trimmed;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function validatePassword(password: string, field = 'password'): void {
  assert(typeof password === 'string' && password.length >= 8,
    'Password must be at least 8 characters long', field);
  assert(password.length <= 128,
    'Password must not exceed 128 characters', field);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function validateRegisterInput(input: RegisterInput): RegisterInput {
  const name = input.name?.trim() ?? '';
  assert(name.length >= 2, 'Name must be at least 2 characters', 'name');
  assert(name.length <= 80, 'Name must not exceed 80 characters', 'name');

  const email = validateEmail(input.email);
  validatePassword(input.password);

  return { name, email, password: input.password };
}

export function validateLoginInput(input: LoginInput): LoginInput {
  const email = validateEmail(input.email);
  assert(typeof input.password === 'string' && input.password.length > 0,
    'Password is required', 'password');
  return { email, password: input.password };
}

// ─── Product ──────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday'] as const;
const VALID_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
const PDF_REGEX = /\.(pdf)$/i;
const URL_REGEX = /^https?:\/\/.+/;

export function validateProductInput(input: CreateProductInput): void {
  assert(typeof input.title === 'string' && input.title.trim().length >= 3,
    'Title must be at least 3 characters', 'title');
  assert(input.title.trim().length <= 120,
    'Title must not exceed 120 characters', 'title');

  assert(typeof input.description === 'string' && input.description.trim().length >= 20,
    'Description must be at least 20 characters', 'description');
  assert(input.description.trim().length <= 3000,
    'Description must not exceed 3000 characters', 'description');

  const price = Number(input.price);
  assert(!isNaN(price) && price >= 0.5, 'Price must be at least $0.50', 'price');
  assert(price <= 9999, 'Price must not exceed $9999', 'price');

  if (input.salePrice !== undefined && input.salePrice !== null) {
    const salePrice = Number(input.salePrice);
    assert(!isNaN(salePrice) && salePrice >= 0.5,
      'Sale price must be at least $0.50', 'salePrice');
    assert(salePrice < price,
      'Sale price must be less than the regular price', 'salePrice');
  }

  assert(VALID_CATEGORIES.includes(input.category as any),
    `Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 'category');

  assert(VALID_DIFFICULTIES.includes(input.difficulty as any),
    `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`, 'difficulty');

  assert(typeof input.pdfUrl === 'string' && input.pdfUrl.trim().length > 0,
    'PDF URL is required', 'pdfUrl');

  if (input.images && input.images.length > 0) {
    input.images.forEach((img, idx) => {
      assert(URL_REGEX.test(img) || img.startsWith('/'),
        `Image #${idx + 1} must be a valid URL or path`, 'images');
    });
    assert(input.images.length <= 10, 'Maximum 10 images allowed', 'images');
  }

  if (input.materials) {
    assert(Array.isArray(input.materials) && input.materials.length <= 20,
      'Maximum 20 materials allowed', 'materials');
  }

  if (input.languages) {
    assert(Array.isArray(input.languages) && input.languages.length <= 10,
      'Maximum 10 languages allowed', 'languages');
  }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export function validateOrderInput(input: CreateOrderInput): void {
  validateEmail(input.customerEmail, 'customerEmail');

  assert(Array.isArray(input.items) && input.items.length > 0,
    'Order must contain at least one item', 'items');
  assert(input.items.length <= 50, 'Order cannot exceed 50 items', 'items');

  for (const [i, item] of input.items.entries()) {
    assert(typeof item.productId === 'string' && item.productId.trim().length > 0,
      `Item #${i + 1}: productId is required`, 'items');
    assert(typeof item.title === 'string' && item.title.trim().length > 0,
      `Item #${i + 1}: title is required`, 'items');
    const itemPrice = Number(item.price);
    assert(!isNaN(itemPrice) && itemPrice >= 0,
      `Item #${i + 1}: price must be a non-negative number`, 'items');
  }

  const total = Number(input.totalAmount);
  assert(!isNaN(total) && total >= 0,
    'Total amount must be a non-negative number', 'totalAmount');
}

// ─── Report ───────────────────────────────────────────────────────────────────

const VALID_SUBJECTS = [
  'Download Issue',
  'Payment Problem',
  'Wrong Pattern Received',
  'Pattern Quality',
  'Account Issue',
  'Other',
];

export function validateReportInput(input: CreateReportInput): void {
  const name = input.name?.trim() ?? '';
  assert(name.length >= 2, 'Name must be at least 2 characters', 'name');
  assert(name.length <= 80, 'Name must not exceed 80 characters', 'name');

  validateEmail(input.email, 'email');

  assert(typeof input.subject === 'string' && input.subject.trim().length >= 3,
    'Subject is required', 'subject');
  assert(input.subject.trim().length <= 120,
    'Subject must not exceed 120 characters', 'subject');

  assert(typeof input.message === 'string' && input.message.trim().length >= 10,
    'Message must be at least 10 characters', 'message');
  assert(input.message.trim().length <= 5000,
    'Message must not exceed 5000 characters', 'message');
}
