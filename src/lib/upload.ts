import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { BadRequestError } from './errors';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function detectImageFormat(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

export async function saveUploadedFile(file: File, directory: string = 'products'): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new BadRequestError('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError('File too large. Maximum size is 4MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const detectedFormat = detectImageFormat(buffer);
  if (!detectedFormat) {
    throw new BadRequestError('Invalid image content. File header does not match allowed image formats.');
  }

  // Extension strictly derived from verified magic bytes
  const extension = detectedFormat === 'jpeg' ? 'jpg' : detectedFormat;
  const fileName = `${nanoid()}.${extension}`;
  
  // Sanitize directory to prevent path traversal
  const safeDir = path.basename(directory).replace(/[^a-zA-Z0-9_-]/g, '') || 'products';
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeDir);
  
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${safeDir}/${fileName}`;
}

export async function deleteUploadedFile(fileUrl: string): Promise<void> {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) return;
  
  try {
    const baseUploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const filePath = path.resolve(process.cwd(), 'public', fileUrl.replace(/^\/+/, ''));
    
    // Prevent path traversal outside of public/uploads
    if (!filePath.startsWith(baseUploadsDir)) {
      console.warn(`Attempted path traversal in deleteUploadedFile: ${fileUrl}`);
      return;
    }

    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${fileUrl}`, error);
  }
}

export { saveUploadedFile as uploadFile };

