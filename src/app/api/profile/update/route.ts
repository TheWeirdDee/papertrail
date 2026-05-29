/**
 * Profile Update Endpoint
 * Updates user profile information with validation and authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit, extractBearerToken } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';
import { isValidStacksAddress, isValidUsername, isValidUrl, sanitizeInput, isValidAmount } from '@/lib/utils/validation';
import * as jose from 'jose';

const MAX_BIO_LENGTH = 500;
const MAX_USERNAME_LENGTH = 32;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 30, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED'),
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
      const { payload } = await jose.jwtVerify(token, jwtSecret);

      sessionAddress = payload.address as string;
      if (!sessionAddress || !isValidStacksAddress(sessionAddress)) {
        throw new Error('Invalid address in token');
      }
    } catch (error: any) {
      logError('PROFILE_UPDATE - token verification', error);
      return NextResponse.json(
        createErrorResponse(401, 'Invalid or expired token', 'INVALID_TOKEN'),
        { status: 401, headers: { ...getSecurityHeaders() } }
      );
    }

    // Parse and validate request body
    const {
      username,
      bio,
      avatar_url,
      website,
      streak,
      reputation,
      gm_balance,
      total_tipped,
      total_received
    } = await req.json();

    // Validate optional fields
    if (username !== undefined && username !== null) {
      if (!isValidUsername(username)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid username format', 'INVALID_USERNAME'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    }

    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return NextResponse.json(
          createErrorResponse(400, 'Bio must be a string', 'INVALID_BIO_TYPE'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }

      if (bio.length > MAX_BIO_LENGTH) {
        return NextResponse.json(
          createErrorResponse(400, `Bio must be under ${MAX_BIO_LENGTH} characters`, 'BIO_TOO_LONG'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    }

    if (avatar_url !== undefined && avatar_url !== null) {
      if (typeof avatar_url !== 'string' || !isValidUrl(avatar_url)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid avatar URL', 'INVALID_AVATAR_URL'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    }

    if (website !== undefined && website !== null) {
      if (typeof website !== 'string' || !isValidUrl(website)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid website URL', 'INVALID_WEBSITE_URL'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    }

    // Validate numeric fields
    const validNumbers = {
      streak: streak,
      reputation: reputation,
      gm_balance: gm_balance,
      total_tipped: total_tipped,
      total_received: total_received
    };

    for (const [field, value] of Object.entries(validNumbers)) {
      if (value !== undefined && value !== null) {
        if (!isValidAmount(value, 0)) {
          return NextResponse.json(
            createErrorResponse(400, `${field} must be a valid number`, `INVALID_${field.toUpperCase()}`),
            { status: 400, headers: { ...getSecurityHeaders() } }
          );
        }
      }
    }

    // Update profile
    try {
      const supabase = getServiceRoleClient();
      const updateData: any = {
        address: sessionAddress,
        updated_at: new Date().toISOString()
      };

      // Only include fields that were provided
      if (username !== undefined) updateData.username = username;
      if (bio !== undefined) updateData.bio = bio ? sanitizeInput(bio) : bio;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      if (website !== undefined) updateData.website = website;
      if (streak !== undefined) updateData.streak = Math.max(0, streak || 0);
      if (reputation !== undefined) updateData.reputation = Math.max(0, reputation || 0);
      if (gm_balance !== undefined) updateData.gm_balance = Math.max(0, gm_balance || 0);
      if (total_tipped !== undefined) updateData.total_tipped = Math.max(0, total_tipped || 0);
      if (total_received !== undefined) updateData.total_received = Math.max(0, total_received || 0);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(
        createSuccessResponse(updatedProfile, 'Profile updated'),
        { status: 200, headers: { ...getSecurityHeaders() } }
      );
    } catch (error: any) {
      logError('PROFILE_UPDATE - upsert', error, { address: sessionAddress });
      return NextResponse.json(
        createErrorResponse(500, 'Failed to update profile', 'UPDATE_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }
  } catch (error: any) {
    logError('PROFILE_UPDATE_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Server error', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
