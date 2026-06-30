import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const MOCK_PRODUCTS: any[] = [];

// Memory fallback to support dynamic uploads when Mongo is not connected
let inMemoryProducts = [...MOCK_PRODUCTS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort');

  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, serving in-memory/mock data instead:", error);
  }

  try {
    let products: any[] = [];
    
    if (isConnected) {
      // Setup query filters
      const query: any = {};
      if (category && category !== 'all') {
        query.category = category;
      }
      if (difficulty && difficulty !== 'all') {
        query.difficulty = difficulty;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Setup sorting
      let sortOption: any = { createdAt: -1 };
      if (sort === 'price-asc') {
        sortOption = { price: 1 };
      } else if (sort === 'price-desc') {
        sortOption = { price: -1 };
      } else if (sort === 'featured') {
        sortOption = { featured: -1, createdAt: -1 };
      }

      products = await Product.find(query).sort(sortOption);
    } else {
      // Local filter logic for Mock Data
      let list = [...inMemoryProducts];

      if (category && category !== 'all') {
        list = list.filter(p => p.category === category);
      }
      if (difficulty && difficulty !== 'all') {
        list = list.filter(p => p.difficulty === difficulty);
      }
      if (search) {
        const term = search.toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      }

      if (sort === 'price-asc') {
        list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      } else if (sort === 'price-desc') {
        list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      } else if (sort === 'featured') {
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      } else {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      products = list;
    }

    return NextResponse.json({ success: true, isMock: !isConnected, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB, executing POST in-memory fallback:", error);
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, description, price, category, difficulty, images, pdfUrl } = body;
    if (!title || !description || !price || !category || !difficulty || !pdfUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (title, description, price, category, difficulty, pdfUrl)" },
        { status: 400 }
      );
    }

    let savedProduct;

    if (isConnected) {
      savedProduct = await Product.create({
        title,
        description,
        price: Number(price),
        salePrice: body.salePrice ? Number(body.salePrice) : undefined,
        category,
        difficulty,
        images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"],
        pdfUrl,
        materials: body.materials || [],
        size: body.size || "",
        languages: body.languages || ["English"],
        featured: !!body.featured
      });
    } else {
      // Local fallback create
      savedProduct = {
        _id: `mock-${Date.now()}`,
        title,
        description,
        price: Number(price),
        salePrice: body.salePrice ? Number(body.salePrice) : null,
        category,
        difficulty,
        images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"],
        pdfUrl,
        materials: body.materials || [],
        size: body.size || "",
        languages: body.languages || ["English"],
        featured: !!body.featured,
        createdAt: new Date()
      };
      inMemoryProducts.unshift(savedProduct as any);
    }

    return NextResponse.json({ success: true, isMock: !isConnected, data: savedProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
