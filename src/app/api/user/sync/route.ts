/**
 * User Profile Sync Endpoint
 * Synchronizes user data from blockchain with database
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';
import { isValidStacksAddress } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 50, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many sync requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    const { address } = await req.json();

    // Validate address
    if (!address || !isValidStacksAddress(address)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid Stacks address', 'INVALID_ADDRESS'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Fetch user profile from database
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .single();

      // Record not found is OK, will create new
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (profile) {
        // Update profile with last_active timestamp
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            last_active: new Date().toISOString(),
          })
          .eq('address', address);

        if (updateError) {
          logError('USER_SYNC - update profile', updateError, { address });
          throw updateError;
        }
      }

      return NextResponse.json(
        createSuccessResponse({ synced: true }, 'User profile synced'),
        { status: 200, headers: { ...getSecurityHeaders() } }
      );
    } catch (error: any) {
      logError('USER_SYNC', error, { address });
      return NextResponse.json(
        createErrorResponse(500, 'Sync failed', 'SYNC_ERROR'),
        { status: 500, headers: { ...getSecurityHeaders() } }
      );
    }
  } catch (error: any) {
    logError('USER_SYNC_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Server error', 'SERVER_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
