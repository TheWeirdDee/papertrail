import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/utils/security';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set('X-Request-ID', crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/:path*'
  ],
};
