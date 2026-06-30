import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  subject: string;
  promoCode: string;
  discountPercent: number;
  message: string;
  segment: string;
  emailsSentCount: number;
  sentAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  subject: { type: String, required: true },
  promoCode: { type: String, required: true },
  discountPercent: { type: Number, required: true },
  message: { type: String, required: true },
  segment: { type: String, required: true },
  emailsSentCount: { type: Number, required: true },
  sentAt: { type: Date, default: Date.now }
});

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
