import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, using simulated order checkout:", error);
  }

  try {
    const body = await request.json();
    const { customerEmail, items, totalAmount } = body;

    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json({ success: false, error: "Missing required checkout fields" }, { status: 400 });
    }

    let savedOrder;

    if (isConnected) {
      savedOrder = await Order.create({
        customerEmail,
        items,
        totalAmount,
        status: 'completed'
      });
    } else {
      // Mock order create
      savedOrder = {
        _id: `order-mock-${Date.now()}`,
        customerEmail,
        items,
        totalAmount,
        status: 'completed',
        createdAt: new Date()
      };
    }

    return NextResponse.json({ 
      success: true, 
      isMock: !isConnected, 
      orderId: savedOrder._id,
      data: savedOrder 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
