/**
 * Create Post Endpoint
 * Creates new posts with rate limiting and content validation
 * Requires authentication token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit, extractBearerToken } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';
import { isValidStacksAddress, isValidAmount, sanitizeInput } from '@/lib/utils/validation';
import * as jose from 'jose';

const MAX_CONTENT_LENGTH = 5000;
const MIN_CONTENT_LENGTH = 1;
const POST_COOLDOWN_MS = 30000; // 30 seconds
const DUPLICATE_CHECK_WINDOW_MS = 120000; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 50, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json(
        createErrorResponse(401, 'Invalid authorization header', 'INVALID_AUTH'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    // Verify JWT token
    let sessionAddress: string | null = null;
    try {
      const secret = process.env.LOCAL_SESSION_SECRET;
      if (!secret || secret.length < 32) {
        throw new Error('JWT secret not configured');
      }

      const jwtSecret = new TextEncoder().encode(secret);
      const { payload } = await jose.jwtVerify(token, jwtSecret, {
        clockTolerance: 300
      });

      sessionAddress = payload.address as string;
      if (!sessionAddress || !isValidStacksAddress(sessionAddress)) {
        throw new Error('Invalid address in token');
      }
    } catch (error: any) {
      logError('CREATE_POST - token verification', error);
      return NextResponse.json(
        createErrorResponse(401, 'Invalid or expired token', 'INVALID_TOKEN'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    // Parse and validate request body
    const { content, txId, mediaUrl, pollData } = await req.json();

    // Validate content
    let finalContent = '';
    if (content) {
      if (typeof content !== 'string') {
        return NextResponse.json(
          createErrorResponse(400, 'Content must be a string', 'INVALID_CONTENT_TYPE'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }

      finalContent = sanitizeInput(content.trim());

      if (finalContent.length < MIN_CONTENT_LENGTH || finalContent.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
          createErrorResponse(
            400,
            `Content length must be between ${MIN_CONTENT_LENGTH} and ${MAX_CONTENT_LENGTH} characters`,
            'INVALID_CONTENT_LENGTH'
          ),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    } else if (!mediaUrl && !pollData) {
      finalContent = 'Said GM!';
    }

    // Validate optional fields
    if (txId && typeof txId !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'txId must be a string', 'INVALID_TX_ID'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    if (mediaUrl && (typeof mediaUrl !== 'string' || mediaUrl.length > 2048)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid mediaUrl', 'INVALID_MEDIA_URL'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Check rate limiting (30-second cooldown)
    const supabase = getServiceRoleClient();
    const thirtySecondsAgo = new Date(Date.now() - POST_COOLDOWN_MS).toISOString();

    try {
      const { data: lastPost, error: rateError } = await supabase
        .from('posts')
        .select('created_at')
        .eq('address', sessionAddress)
        .gt('created_at', thirtySecondsAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPost) {
        return NextResponse.json(
          createErrorResponse(429, 'Please wait 30 seconds between posts', 'POSTING_COOLDOWN'),
          { status: 429, headers: { ...getSecurityHeaders() } }
        );
      }
    } catch (error: any) {
      logError('CREATE_POST - rate limit check', error);
    }

    // Check for duplicates (within 2 minutes)
    if (finalContent) {
      try {
        const twoMinutesAgo = new Date(Date.now() - DUPLICATE_CHECK_WINDOW_MS).toISOString();
        const { data: dupPost } = await supabase
          .from('posts')
          .select('id')
          .eq('address', sessionAddress)
          .eq('content', finalContent)
          .gt('created_at', twoMinutesAgo)
          .limit(1)
          .maybeSingle();

        if (dupPost) {
          return NextResponse.json(
            createErrorResponse(409, 'Duplicate post detected', 'DUPLICATE_POST'),
            { status: 409, headers: { ...getSecurityHeaders() } }
          );
        }
      } catch (error: any) {
        logError('CREATE_POST - duplicate check', error);
      }
    }

    // Create post
    try {
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert([{
          address: sessionAddress,
          content: finalContent,
          media_url: mediaUrl || null,
          poll_data: pollData || null,
          tx_id: txId || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json(
        createSuccessResponse(newPost, 'Post created successfully'),
        { status: 201, headers: { ...getSecurityHeaders() } }
      );
    } catch (error: any) {
      logError('CREATE_POST - insert', error, { address: sessionAddress });
      return NextResponse.json(
        createErrorResponse(500, 'Failed to create post', 'POST_CREATE_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }
  } catch (error: any) {
    logError('CREATE_POST_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Server error', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
