import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  category: 'amigurumi' | 'clothing' | 'home-decor' | 'accessories' | 'holiday';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  images: string[];
  pdfUrl: string;
  materials: string[];
  size?: string;
  languages: string[];
  featured: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  category: { 
    type: String, 
    required: true,
    enum: ['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday']
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  images: { type: [String], required: true, default: [] },
  pdfUrl: { type: String, required: true },
  materials: { type: [String], default: [] },
  size: { type: String },
  languages: { type: [String], default: ['English'] },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Full-text search index (used by $text operator in products resolver)
ProductSchema.index({ title: 'text', description: 'text' });

// Compound indexes matching sort patterns in the storefront query
ProductSchema.index({ featured: -1, createdAt: -1 }); // Sort: featured
ProductSchema.index({ category: 1, createdAt: -1 });  // Category filter + date sort
ProductSchema.index({ price: 1 });                    // Sort: price-asc
ProductSchema.index({ price: -1 });                   // Sort: price-desc
ProductSchema.index({ createdAt: -1 });               // Sort: newest

// Fix to prevent recompilation model in serverless Next.js environment
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
