/**
 * HTTP Client Utility
 * Provides secure fetch wrapper with error handling and security features
 */

import { getEnvironmentConfig } from './env';
import { logError, retryOperation, handleApiError } from './errors';
import { getSecurityHeaders } from './security';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
}

interface FetchResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  headers: Record<string, string>;
}

/**
 * Secure fetch wrapper with error handling
 * @param url - URL to fetch
 * @param options - Fetch options with security features
 * @returns Fetch response with data or error
 */
export async function secureFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    validateStatus = (status) => status >= 200 && status < 300,
    ...fetchOptions
  } = options;

  // Validate URL
  if (!url || typeof url !== 'string') {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Invalid URL',
      headers: {}
    };
  }

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...getSecurityHeaders(),
    ...fetchOptions.headers
  };

  const fetchWithRetry = async (): Promise<FetchResponse<T>> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const isValid = validateStatus(response.status);
      let data: T | null = null;
      let error: string | null = null;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json() as T;
        } else {
          const text = await response.text();
          data = text as any;
        }
      } catch (parseError) {
        logError('secureFetch - parse response', parseError);
      }

      if (!isValid) {
        error = typeof data === 'object' && data !== null && 'message' in data
          ? (data as any).message
          : `HTTP ${response.status}`;
      }

      return {
        ok: isValid,
        status: response.status,
        data: isValid ? data : null,
        error: !isValid ? error : null,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error: any) {
      logError('secureFetch', error);

      if (error.name === 'AbortError') {
        return {
          ok: false,
          status: 0,
          data: null,
          error: 'Request timeout',
          headers: {}
        };
      }

      return {
        ok: false,
        status: 0,
        data: null,
        error: error.message || 'Network error',
        headers: {}
      };
    }
  };

  if (retries > 0) {
    return retryOperation(
      fetchWithRetry,
      retries + 1,
      retryDelay
    );
  }

  return fetchWithRetry();
}

/**
 * GET request
 */
export async function get<T = any>(
  url: string,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  return secureFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function post<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  let body: string | undefined;
  try {
    body = data === undefined ? undefined : JSON.stringify(data);
  } catch (e) {
    // Fallback: attempt to shallow-copy then stringify
    try {
      body = JSON.stringify(Object.assign({}, data));
    } catch (err) {
      body = undefined;
    }
  }

  return secureFetch<T>(url, {
    ...options,
    method: 'POST',
    body
  return secureFetch<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT request
 */
export async function put<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  let body: string | undefined;
  try {
    body = data === undefined ? undefined : JSON.stringify(data);
  } catch (e) {
    try {
      body = JSON.stringify(Object.assign({}, data));
    } catch (err) {
      body = undefined;
    }
  }

  return secureFetch<T>(url, {
    ...options,
    method: 'PUT',
    body
  return secureFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE request
 */
export async function del<T = any>(
  url: string,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  return secureFetch<T>(url, { ...options, method: 'DELETE' });
}

/**
 * Builds query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Builds full API URL with base path
 */
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  const config = getEnvironmentConfig();
  const baseUrl = config.appUrl;
  const queryString = params ? buildQueryString(params) : '';
  
  return `${baseUrl}/api${endpoint}${queryString}`;
}
