import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  price: number;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  customerEmail: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed';
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true }
});

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerEmail: { type: String, required: true },
  items: { type: [OrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for common query patterns
OrderSchema.index({ customerEmail: 1 });           // myOrders lookup by email
OrderSchema.index({ userId: 1 });                  // myOrders lookup by userId
OrderSchema.index({ createdAt: -1 });              // Admin orders sorted by newest
OrderSchema.index({ userId: 1, createdAt: -1 });   // Compound for user order history

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
