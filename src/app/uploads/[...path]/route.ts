import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { connectDB } from '@/lib/db';
import UploadedImage from '@/models/UploadedImage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const safeRelativePath = pathSegments
      .map((seg) => seg.replace(/[^a-zA-Z0-9_.-]/g, ''))
      .filter(Boolean)
      .join('/');

    const pathname = `/uploads/${safeRelativePath}`;

    // 1. Check local filesystem first
    try {
      const diskPath = path.join(process.cwd(), 'public', 'uploads', safeRelativePath);
      const fileBuffer = await fs.readFile(diskPath);
      
      const ext = path.extname(safeRelativePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';

      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (diskErr) {
      // Not on local disk; fallback to MongoDB Atlas
    }

    // 2. Query MongoDB Atlas
    await connectDB();
    const imageDoc = await UploadedImage.findOne({ pathname }).lean();

    if (!imageDoc || !imageDoc.data) {
      return new NextResponse('Image Not Found', { status: 404 });
    }

    return new Response(new Uint8Array(imageDoc.data), {
      headers: {
        'Content-Type': imageDoc.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Upload Serve Error]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
