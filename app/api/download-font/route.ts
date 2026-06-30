import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  const fontsToDownload = [
    { weight: '300', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDz8V1s.ttf', filename: 'poppins-300.ttf' },
    { weight: '400', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrFJA.ttf', filename: 'poppins-400.ttf' },
    { weight: '500', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9V1s.ttf', filename: 'poppins-500.ttf' },
    { weight: '600', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6V1s.ttf', filename: 'poppins-600.ttf' },
    { weight: '700', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7V1s.ttf', filename: 'poppins-700.ttf' },
    { weight: '800', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4V1s.ttf', filename: 'poppins-800.ttf' },
    { weight: '900', url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLBT5V1s.ttf', filename: 'poppins-900.ttf' },
  ];

  const results: string[] = [];

  for (const item of fontsToDownload) {
    const destPath = path.join(fontDir, item.filename);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      results.push(`Downloaded ${item.filename} successfully.`);
    } catch (err: any) {
      results.push(`Failed to download ${item.filename}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, results });
}
