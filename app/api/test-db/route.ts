import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt Mongoose connection
    await dbConnect();
    
    const readyState = mongoose.connection.readyState;
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    
    // Query product counts in DB
    const count = await Product.countDocuments();
    
    return NextResponse.json({
      success: true,
      status: 'Connected to MongoDB Atlas successfully!',
      connectionState: states[readyState] || 'Unknown',
      productsInDatabase: count,
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name
    });
  } catch (error: any) {
    console.error('Database diagnostic failure:', error);
    return NextResponse.json({
      success: false,
      status: 'Failed to connect to MongoDB',
      error: error.message || 'Unknown connection error',
      stack: error.stack
    });
  }
}
