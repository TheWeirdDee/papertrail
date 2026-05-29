/**
 * Nonce Generation Endpoint
 * Generates secure nonce for wallet signature verification
 * Stores in database with TTL for validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';
import { isValidStacksAddress } from '@/lib/utils/validation';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 30, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many nonce requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    const body = await req.json();
    const { address } = body;

    // Validate address
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'Address is required', 'INVALID_REQUEST'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    if (!isValidStacksAddress(address)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid Stacks address', 'INVALID_ADDRESS'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Generate nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store in database
    try {
      const supabase = getServiceRoleClient();

      await supabase.from('auth_nonces').delete().eq('address', address);

      const { error } = await supabase
        .from('auth_nonces')
        .insert([{ address, nonce, expires_at: expiresAt }]);

      if (error) throw error;
    } catch (dbError: any) {
      logError('NONCE_DB', dbError, { address });
      return NextResponse.json(
        createErrorResponse(500, 'Failed to generate nonce', 'DATABASE_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ nonce }, 'Nonce generated'),
      { status: 200, headers: { ...getSecurityHeaders() } }
    );

  } catch (error: any) {
    logError('NONCE_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to generate nonce', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
