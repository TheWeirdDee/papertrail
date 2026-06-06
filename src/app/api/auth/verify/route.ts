/**
 * Signature Verification Endpoint
 * Verifies wallet signature and issues JWT token
 * Implements security validation and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import { getAddressFromPublicKey } from '@stacks/transactions';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit, extractBearerToken } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';
import { isValidStacksAddress } from '@/lib/utils/validation';
import * as jose from 'jose';

/**
 * Validates JWT secret is configured
 */
function getJwtSecret(): string {
  const secret = process.env.LOCAL_SESSION_SECRET;
  if (!secret || secret === 'placeholder' || secret.length < 32) {
    throw new Error('JWT secret not properly configured');
  }
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 20, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many verification attempts', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    const body = await req.json();
    const { address, signature, publicKey } = body;

    // Validate required fields
    if (!address || !signature || !publicKey) {
      return NextResponse.json(
        createErrorResponse(400, 'Missing required fields (address, signature, publicKey)', 'INVALID_REQUEST'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate address format
    if (!isValidStacksAddress(address)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid Stacks address', 'INVALID_ADDRESS'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate signature and publicKey are strings
    if (typeof signature !== 'string' || typeof publicKey !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'Signature and publicKey must be strings', 'INVALID_FORMAT'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Verify address derivation
    const network = (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet') as any;
    let derivedAddress: string;

    try {
      derivedAddress = getAddressFromPublicKey(publicKey, network);
    } catch (error: any) {
      logError('VERIFY - address derivation', error, { address });
      return NextResponse.json(
        createErrorResponse(401, 'Invalid public key', 'INVALID_PUBKEY'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    if (derivedAddress !== address) {
      logError('VERIFY - address mismatch', new Error('Address mismatch'), { 
        provided: address, 
        derived: derivedAddress 
      });
      return NextResponse.json(
        createErrorResponse(403, 'Address verification failed', 'ADDRESS_MISMATCH'),
        { status: 403, headers: { ...getSecurityHeaders() } }
      );
    }

    // Retrieve nonce from database
    let nonceData: any;
    try {
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase
        .from('auth_nonces')
        .select('nonce, expires_at')
        .eq('address', address)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return NextResponse.json(
          createErrorResponse(401, 'Nonce expired or not found', 'INVALID_NONCE'),
          { status: 401, headers: { ...getSecurityHeaders() } }
        );
      }

      nonceData = data;
    } catch (error: any) {
      logError('VERIFY - nonce retrieval', error, { address });
      return NextResponse.json(
        createErrorResponse(500, 'Database error', 'DATABASE_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }

    // Verify signature
    const message = `Sign in to PaperTrail\nNonce: ${nonceData.nonce}`;
    let isValid: boolean;

    try {
      isValid = verifyMessageSignatureRsv({
        message,
        publicKey,
        signature,
      });
    } catch (error: any) {
      logError('VERIFY - signature verification', error, { address });
      return NextResponse.json(
        createErrorResponse(401, 'Signature verification failed', 'INVALID_SIGNATURE'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    if (!isValid) {
      logError('VERIFY - invalid signature', new Error('Signature invalid'), { address });
      return NextResponse.json(
        createErrorResponse(401, 'Invalid signature', 'INVALID_SIGNATURE'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    // Clean up used nonce
    try {
      const supabase = getServiceRoleClient();
      await supabase.from('auth_nonces').delete().eq('address', address);
    } catch (error: any) {
      logError('VERIFY - nonce cleanup', error, { address });
    }

    // Issue JWT token
    let token: string;
    try {
      const secret = getJwtSecret();
      const jwtSecret = new TextEncoder().encode(secret);

      token = await new jose.SignJWT({ address })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(jwtSecret);
    } catch (error: any) {
      logError('VERIFY - JWT generation', error, { address });
      return NextResponse.json(
        createErrorResponse(500, 'Token generation failed', 'TOKEN_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }

    const response = NextResponse.json(
      createSuccessResponse({ token }, 'Authentication successful'),
      { status: 200, headers: { ...getSecurityHeaders() } }
    );

    // Set secure cookie
    response.cookies.set('gm_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error: any) {
    logError('VERIFY_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Authentication failed', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
