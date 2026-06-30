import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { createPolarCheckoutSession } from '@/lib/polar';

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
    const { customerEmail, customerName, items, totalAmount } = body;

    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json({ success: false, error: "Missing required checkout fields" }, { status: 400 });
    }

    let savedOrder;

    if (isConnected) {
      savedOrder = await Order.create({
        customerEmail,
        items,
        totalAmount,
        status: 'pending'
      });
    } else {
      // Mock order create
      savedOrder = {
        _id: `order-mock-${Date.now()}`,
        customerEmail,
        items,
        totalAmount,
        status: 'pending',
        createdAt: new Date()
      };
    }

    // Call Polar API or helper to create checkout session
    const session = await createPolarCheckoutSession({
      customerEmail,
      customerName: customerName || '',
      totalAmount,
      orderId: savedOrder._id.toString(),
      items: items.map(item => ({
        productId: item.productId,
        title: item.title,
        price: Number(item.price),
        pdfUrl: item.pdfUrl
      }))
    });

    return NextResponse.json({ 
      success: true, 
      url: session.url,
      isMock: session.isMock,
      orderId: savedOrder._id
    });
  } catch (error: any) {
    console.error('Polar checkout initialization error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
