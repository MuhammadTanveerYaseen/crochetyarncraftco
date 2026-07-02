import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Index to find reviews by product ID quickly sorted by newest reviews
ReviewSchema.index({ productId: 1, createdAt: -1 });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
