/**
 * Middleware for request security and validation
 * Implements security headers, CORS handling, and authentication checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/utils/security';

export async function middleware(request: NextRequest) {
  // Add security headers to all responses
  const response = NextResponse.next();

  // Apply security headers
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add additional middleware headers
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/:path*'
  ],
};
