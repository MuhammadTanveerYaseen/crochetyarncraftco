import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Hashed password, optional when returning user object
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Explicit indexes (email uniqueness enforced at schema level too)
UserSchema.index({ email: 1 }, { unique: true }); // Fast login lookup
UserSchema.index({ createdAt: -1 });               // Admin user listing

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
