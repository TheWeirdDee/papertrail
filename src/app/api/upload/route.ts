/**
 * File Upload Endpoint
 * Handles secure file uploads with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_BUCKETS = ['media', 'avatars'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 20, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many upload requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'media';

    // Validate file
    if (!file) {
      return NextResponse.json(
        createErrorResponse(400, 'No file provided', 'NO_FILE'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate bucket
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid bucket', 'INVALID_BUCKET'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        createErrorResponse(400, 'File exceeds 5MB limit', 'FILE_TOO_LARGE'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid file type', 'INVALID_FILE_TYPE'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid file extension', 'INVALID_EXTENSION'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Generate safe filename
    const randomId = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    try {
      const supabase = getServiceRoleClient();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        logError('UPLOAD - storage error', error, { bucket, fileName });
        return NextResponse.json(
          createErrorResponse(500, 'Upload failed', 'UPLOAD_ERROR'),
          { status: 500, headers: { ...getSecurityHeaders() } }
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!publicUrl) {
        return NextResponse.json(
          createErrorResponse(500, 'Failed to get upload URL', 'URL_ERROR'),
          { status: 500, headers: { ...getSecurityHeaders() } }
        );
      }

      return NextResponse.json(
        createSuccessResponse({ url: publicUrl }, 'File uploaded successfully'),
        { status: 201, headers: { ...getSecurityHeaders() } }
      );
    } catch (error: any) {
      logError('UPLOAD - process', error, { bucket });
      return NextResponse.json(
        createErrorResponse(500, 'Upload processing failed', 'PROCESS_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }
  } catch (error: any) {
    logError('UPLOAD_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Server error', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
