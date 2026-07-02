/**
 * Shared TypeScript type definitions for Yarn Craft Co.
 * Used across: frontend components, GraphQL resolvers, API routes.
 * Eliminates `any` types and keeps the data contracts consistent.
 */

// ─── Product ────────────────────────────────────────────────────────────────

export type ProductCategory = string;

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  category: ProductCategory;
  difficulty: DifficultyLevel;
  images: string[];
  pdfUrl: string;
  materials?: string[];
  size?: string;
  languages?: string[];
  featured?: boolean;
  runAd?: boolean;
  tags?: string[];
  createdAt?: string;
}

export interface ProductFilters {
  category?: ProductCategory | 'all';
  difficulty?: DifficultyLevel | 'all';
  search?: string;
  sort?: SortOption;
  limit?: number;
  offset?: number;
  runAd?: boolean;
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  category: ProductCategory;
  difficulty: DifficultyLevel;
  images?: string[];
  pdfUrl: string;
  materials?: string[];
  size?: string;
  languages?: string[];
  featured?: boolean;
  runAd?: boolean;
  tags?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput> & { id: string };

// ─── Order ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'completed';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
}

export interface Order {
  _id: string;
  userId?: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt?: string;
}

export interface CreateOrderInput {
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  userId?: string;
}

export interface OrdersQueryArgs {
  limit?: number;
  offset?: number;
}

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ─── Report ──────────────────────────────────────────────────────────────────

export type ReportStatus = 'pending' | 'resolved';

export interface Report {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ReportStatus;
  createdAt?: string;
}

export interface CreateReportInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatterns: number;
  totalSales: number;
  activeCategories: number;
  popularCategory: string;
  averageOrderValue: number;
  storageProvider: string;
}

// ─── GraphQL Context ─────────────────────────────────────────────────────────

export interface GraphQLContext {
  userId?: string;
  cookieStore?: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options: object) => void;
    delete: (name: string) => void;
  };
  request?: any;
}

// ─── API Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
