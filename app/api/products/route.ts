import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const MOCK_PRODUCTS = [
  {
    _id: "mock-1",
    title: "Amigurumi Crochet Giraffe Plushie",
    description: "Create your own adorable cuddle companion with this detailed crochet giraffe pattern! It includes step-by-step instructions, clear stitch guides, and over 30 photos to guide you through the process. Perfect as a gift or for nursery decor.",
    price: 7.99,
    salePrice: 4.99,
    category: "amigurumi",
    difficulty: "Intermediate",
    images: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-giraffe-pattern.pdf",
    materials: [
      "DK weight yarn in Yellow, Brown, and White",
      "2.5mm crochet hook",
      "10mm safety eyes",
      "Polyester fiberfill stuffing",
      "Yarn needle and stitch markers"
    ],
    size: "25cm / 10 inches tall",
    languages: ["English", "Spanish"],
    featured: true,
    createdAt: new Date(Date.now() - 1000000)
  },
  {
    _id: "mock-2",
    title: "Classic Amigurumi Teddy Bear",
    description: "An easy-to-follow, classic teddy bear crochet pattern. This design is highly customizable and suitable for beginner makers. Features a soft, chubby belly and sweet floppy ears.",
    price: 5.99,
    salePrice: 3.99,
    category: "amigurumi",
    difficulty: "Beginner",
    images: [
      "https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-teddy-bear.pdf",
    materials: [
      "Worsted weight yarn in Brown",
      "3.5mm crochet hook",
      "8mm safety eyes",
      "Embroidery thread for nose",
      "Stuffing"
    ],
    size: "18cm / 7 inches tall",
    languages: ["English", "French"],
    featured: true,
    createdAt: new Date(Date.now() - 2000000)
  },
  {
    _id: "mock-3",
    title: "Lilac Petal Crochet Dress Pattern",
    description: "An elegant, vintage-inspired summer dress pattern featuring delicate petal-like skirts and an open lace back detail. Includes sizing adjustments from XS to XXL.",
    price: 12.99,
    salePrice: 8.99,
    category: "clothing",
    difficulty: "Advanced",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-dress.pdf",
    materials: [
      "Lace weight cotton yarn in Lilac",
      "2.0mm and 2.5mm hooks",
      "Tape measure",
      "Elastic thread",
      "Stitch markers"
    ],
    size: "Women's sizes XS, S, M, L, XL, XXL included",
    languages: ["English"],
    featured: false,
    createdAt: new Date(Date.now() - 3000000)
  },
  {
    _id: "mock-4",
    title: "Holiday Snowman & Reindeer Bundle",
    description: "Get ready for the festive season with this duo crochet bundle! Create your own winter snowman with a cozy striped scarf, and a red-nosed reindeer helper. Buy both together and save!",
    price: 15.99,
    salePrice: 10.99,
    category: "holiday",
    difficulty: "Intermediate",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-holiday-bundle.pdf",
    materials: [
      "Yarn in Red, White, Brown, Green, and Orange",
      "3.0mm crochet hook",
      "Safety eyes, orange felt",
      "Polyester stuffing"
    ],
    size: "Snowman: 15cm, Reindeer: 17cm",
    languages: ["English", "German", "Spanish"],
    featured: true,
    createdAt: new Date(Date.now() - 4000000)
  },
  {
    _id: "mock-5",
    title: "Boho Fringe Crochet Shoulder Bag",
    description: "Style meets function in this crochet shoulder bag pattern. Made using sturdy cotton cord yarn, this bag features a classic boho fringe design and an optional fabric lining instruction set.",
    price: 7.99,
    salePrice: 5.49,
    category: "accessories",
    difficulty: "Intermediate",
    images: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-bag.pdf",
    materials: [
      "3mm Cotton cord macrame yarn",
      "4.5mm crochet hook",
      "Magnetic snaps",
      "Fabric for lining (optional)"
    ],
    size: "30cm x 28cm (excluding strap)",
    languages: ["English"],
    featured: false,
    createdAt: new Date(Date.now() - 5000000)
  },
  {
    _id: "mock-6",
    title: "Warm Sage Textured Throw Blanket",
    description: "A gorgeous, super chunky textured throw blanket pattern utilizing modern waffle stitches. Perfect for keeping cozy during chilly nights or as a decorative accent for your living room couch.",
    price: 9.99,
    salePrice: 6.99,
    category: "home-decor",
    difficulty: "Beginner",
    images: [
      "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80"
    ],
    pdfUrl: "/uploads/mock-blanket.pdf",
    materials: [
      "Chunky yarn in Sage Green (10 balls)",
      "6.5mm crochet hook",
      "Tapesty needle for weaving ends"
    ],
    size: "120cm x 150cm / 47 x 59 inches",
    languages: ["English", "Spanish", "French"],
    featured: false,
    createdAt: new Date(Date.now() - 6000000)
  }
];

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
      
      // If DB connected but empty, pre-populate with mock data to make review easy
      if (products.length === 0 && !search && (!category || category === 'all') && (!difficulty || difficulty === 'all')) {
        console.log("DB is empty. Auto-populating mock products...");
        const cleanMocks = MOCK_PRODUCTS.map(({ _id, ...rest }) => rest);
        await Product.insertMany(cleanMocks);
        products = await Product.find(query).sort(sortOption);
      }
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
