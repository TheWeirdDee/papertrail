/**
 * CORS Proxy Endpoint
 * Securely proxies requests to external APIs like Hiro to handle CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, isOriginAllowed, isHiroEndpointAllowed, checkRateLimit } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    // Check origin
    const origin = request.headers.get('origin');
    if (!isOriginAllowed(origin)) {
      return NextResponse.json(
        createErrorResponse(403, 'Origin not allowed', 'FORBIDDEN_ORIGIN'),
        { status: 403, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 100, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { url, method = 'GET', headers: customHeaders = {} } = body;
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'URL is required', 'INVALID_REQUEST'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Validate endpoint is allowed (Hiro endpoints only)
    if (!isHiroEndpointAllowed(url)) {
      logError('CORS_PROXY', new Error('Unauthorized endpoint'), { url, origin });
      return NextResponse.json(
        createErrorResponse(403, 'Endpoint not allowed', 'FORBIDDEN_ENDPOINT'),
        { status: 403, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Validate method
    const allowedMethods = ['GET', 'POST'];
    if (!allowedMethods.includes(method.toUpperCase())) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid HTTP method', 'INVALID_METHOD'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Prepare headers (sanitize custom headers)
    const proxyHeaders: Record<string, string> = {
      'User-Agent': 'GM-DApp/1.0',
      'Accept': 'application/json',
    };
    
    // Only allow safe headers to be passed through
    const allowedHeaderNames = ['content-type', 'authorization'];
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (allowedHeaderNames.includes(key.toLowerCase()) && typeof value === 'string') {
        proxyHeaders[key] = value;
      }
    });
    
    // Make the proxied request
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: proxyHeaders,
      body: method.toUpperCase() === 'POST' ? JSON.stringify(body.data || {}) : undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    // Check response status
    if (!response.ok) {
      logError('CORS_PROXY', new Error(`Upstream error: ${response.status}`), {
        url,
        status: response.status,
      });
      
      return NextResponse.json(
        createErrorResponse(
          response.status,
          `Upstream service returned: ${response.status}`,
          `UPSTREAM_${response.status}`
        ),
        { status: response.status, headers: { ...getSecurityHeaders() } }
      );
    }
    
    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return NextResponse.json(
      createSuccessResponse(data, 'Proxied request successful'),
      { 
        status: 200,
        headers: { 
          ...getSecurityHeaders(),
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
    
  } catch (error: any) {
    logError('CORS_PROXY', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        createErrorResponse(504, 'Request timeout', 'TIMEOUT'),
        { status: 504, headers: { ...getSecurityHeaders() } }
      );
    }
    
    return NextResponse.json(
      createErrorResponse(500, 'Proxy request failed', 'PROXY_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowed = isOriginAllowed(origin);
  
  if (!isAllowed) {
    return new NextResponse(null, { status: 403 });
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}
