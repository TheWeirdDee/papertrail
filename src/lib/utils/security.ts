const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://papertrail.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const ALLOWED_HIRO_ENDPOINTS = [
  'https://api.mainnet.hiro.so',
  'https://api.testnet.hiro.so',
];

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

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
};

export const isHiroEndpointAllowed = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ALLOWED_HIRO_ENDPOINTS.some(
      allowed => urlObj.origin === allowed || urlObj.hostname === new URL(allowed).hostname
    );
  } catch {
    return false;
  }
};

export const getEnvVariable = (key: string, required = false): string | null => {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Required environment variable missing: ${key}`);
  }

  if (value && (value === 'undefined' || value === 'null' || value === 'placeholder')) {
    if (required) throw new Error(`Invalid environment variable: ${key}`);
    return null;
  }

  return value || null;
};

export const isValidToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  return parts.every(part => part.length > 0 && /^[A-Za-z0-9_\-]+$/.test(part));
};

export const maskSensitive = (value: string, showChars = 4): string => {
  if (!value || value.length <= showChars * 2) return '***';
  return value.substring(0, showChars) + '***' + value.substring(value.length - showChars);
};

export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+([A-Za-z0-9_\-\.]+)$/);
  return match ? match[1] : null;
};

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
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
