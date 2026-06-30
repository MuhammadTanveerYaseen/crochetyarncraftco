import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'pattern.pdf';

    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Security: Only allow downloads from res.cloudinary.com to prevent SSRF vulnerabilities
    if (!url.startsWith('https://res.cloudinary.com/')) {
      return new Response('Invalid download URL source', { status: 403 });
    }

    console.log(`Proxying download for URL: ${url} as filename: ${filename}`);

    const response = await fetch(url);
    if (!response.ok) {
      return new Response(`Failed to fetch file: HTTP ${response.status}`, { status: response.status });
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/pdf';

    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store, max-age=0'
      },
    });
  } catch (error: any) {
    console.error('Download proxy error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}
