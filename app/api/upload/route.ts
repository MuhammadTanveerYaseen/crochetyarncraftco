import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary if credentials are provided in .env.local
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary SDK configured successfully for uploads!');
} else {
  console.log('Cloudinary keys missing. Defaulting to local disk storage uploads.');
}

// Upload buffer streaming helper for Cloudinary
const uploadToCloudinary = (buffer: Buffer, filename: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Determine folder and resource type
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const options = {
      folder: 'crafting_pattern_store',
      resource_type: isPdf ? ('raw' as const) : ('auto' as const),
      public_id: filename.substring(0, filename.lastIndexOf('.')) || filename
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    
    uploadStream.end(buffer);
  });
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique name
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;

    // 1. Cloudinary upload branch
    if (isCloudinaryConfigured) {
      try {
        console.log(`Streaming ${file.name} to Cloudinary CDN...`);
        const result = await uploadToCloudinary(buffer, uniqueFilename);
        console.log(`Cloudinary upload success! URL: ${result.secure_url}`);
        return NextResponse.json({ 
          success: true, 
          url: result.secure_url,
          filename: file.name,
          provider: 'cloudinary'
        });
      } catch (cloudinaryErr: any) {
        console.error('Cloudinary API upload failed. Falling back to local disk storage:', cloudinaryErr);
        // Fall through to local storage if Cloudinary fails during runtime
      }
    }

    // 2. Local storage fallback branch
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory already exists, ignore
    }

    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);
    console.log(`Uploaded file saved locally to: ${filePath}`);

    const localUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ 
      success: true, 
      url: localUrl,
      filename: file.name,
      provider: 'local'
    });
  } catch (error: any) {
    console.error('File upload route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
