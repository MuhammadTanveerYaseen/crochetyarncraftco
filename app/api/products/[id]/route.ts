import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { GET as getProductsHandler } from '../route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, serving in-memory/mock single product:", error);
  }

  try {
    if (isConnected) {
      const product = await Product.findById(id);
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: product });
    } else {
      // Fallback: fetch products from list
      // We can invoke the GET handler's internal data, but here we can just use the search from the general route
      const response = await getProductsHandler(new Request(`http://localhost/api/products`));
      const resJson = await response.json();
      if (resJson.success) {
        const product = resJson.data.find((p: any) => p._id === id);
        if (!product) {
          return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: product });
      }
      return NextResponse.json({ success: false, error: "Failed to read products" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, using simulated PUT:", error);
  }

  try {
    const body = await request.json();

    if (isConnected) {
      const updatedProduct = await Product.findByIdAndUpdate(id, body, { new: true });
      if (!updatedProduct) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updatedProduct });
    } else {
      // Memory update simulation is fine since the state resets on reload anyway
      return NextResponse.json({ success: true, isMock: true, data: { _id: id, ...body } });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, using simulated DELETE:", error);
  }

  try {
    if (isConnected) {
      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Product deleted successfully" });
    } else {
      // Memory delete simulation is fine
      return NextResponse.json({ success: true, isMock: true, message: "Product deleted successfully (simulated)" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
