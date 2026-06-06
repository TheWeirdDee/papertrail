/**
 * Security Utilities
 * Provides security-focused helper functions for tokens, headers, and secrets
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://papertrail.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const ALLOWED_HIRO_ENDPOINTS = [
  'https://api.mainnet.hiro.so',
  'https://api.testnet.hiro.so',
];

/**
 * Gets secure headers for CORS and security
 * @returns Security headers object
 */
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
};

/**
 * Validates origin for CORS requests
 * @param origin - Origin header to validate
 * @returns True if origin is allowed
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
};

/**
 * Validates Hiro endpoint is allowed
 * @param url - The URL to validate
 * @returns True if endpoint is allowed
 */
export const isHiroEndpointAllowed = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return ALLOWED_HIRO_ENDPOINTS.some(allowed => 
      urlObj.origin === allowed || urlObj.hostname === new URL(allowed).hostname
    );
  } catch {
    return false;
  }
};

/**
 * Safely retrieves environment variable
 * @param key - Environment variable key
 * @param required - Whether the variable is required
 * @returns Environment value or null
 */
export const getEnvVariable = (key: string, required: boolean = false): string | null => {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable missing: ${key}`);
  }
  
  if (value && (value === 'undefined' || value === 'null' || value === 'placeholder')) {
    if (required) {
      throw new Error(`Invalid environment variable: ${key}`);
    }
    return null;
  }
  
  return value || null;
};

/**
 * Validates token format (JWT-like)
 * @param token - Token to validate
 * @returns True if token appears valid
 */
export const isValidToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Basic JWT validation: should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check each part is base64-like (no spaces, reasonable length)
  return parts.every(part => 
    part.length > 0 && 
    /^[A-Za-z0-9_\-]+$/.test(part)
  );
};

/**
 * Safely masks sensitive data for logging
 * @param value - The value to mask
 * @param showChars - Number of characters to show at start/end
 * @returns Masked value
 */
export const maskSensitive = (value: string, showChars: number = 4): string => {
  if (!value || value.length <= showChars * 2) return '***';
  
  return value.substring(0, showChars) + '***' + value.substring(value.length - showChars);
};

/**
 * Validates and sanitizes authorization header
 * @param header - Authorization header value
 * @returns Token if valid, null otherwise
 */
export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header || typeof header !== 'string') return null;
  
  const match = header.match(/^Bearer\s+([A-Za-z0-9_\-\.]+)$/);
  return match ? match[1] : null;
};

/**
 * Rate limiting helper - returns true if request should be allowed
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if request is allowed
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const current = requestCounts.get(identifier);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count < maxRequests) {
    current.count++;
    return true;
  }
  
  return false;
};
