import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending', required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
