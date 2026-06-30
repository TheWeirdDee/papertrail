import { getEnvironmentConfig } from './env';
import { logError, retryOperation } from './errors';
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

  if (!url || typeof url !== 'string') {
    return { ok: false, status: 0, data: null, error: 'Invalid URL', headers: {} };
  }

  const headers = {
    'Content-Type': 'application/json',
    ...getSecurityHeaders(),
    ...fetchOptions.headers,
  };

  const fetchWithRetry = async (): Promise<FetchResponse<T>> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const isValid = validateStatus(response.status);
      let data: T | null = null;
      let error: string | null = null;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json() as T;
        } else {
          data = (await response.text()) as any;
        }
      } catch (parseError) {
        logError('secureFetch - parse response', parseError);
      }

      if (!isValid) {
        error =
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as any).message
            : `HTTP ${response.status}`;
      }

      return {
        ok: isValid,
        status: response.status,
        data: isValid ? data : null,
        error: !isValid ? error : null,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      logError('secureFetch', error);

      if (error.name === 'AbortError') {
        return { ok: false, status: 0, data: null, error: 'Request timeout', headers: {} };
      }

      return { ok: false, status: 0, data: null, error: error.message || 'Network error', headers: {} };
    }
  };

  if (retries > 0) {
    return retryOperation(fetchWithRetry, retries + 1, retryDelay);
  }

  return fetchWithRetry();
}

export async function get<T = any>(url: string, options?: FetchOptions): Promise<FetchResponse<T>> {
  return secureFetch<T>(url, { ...options, method: 'GET' });
}

export async function post<T = any>(url: string, data?: any, options?: FetchOptions): Promise<FetchResponse<T>> {
  let body: string | undefined;
  try {
    body = data === undefined ? undefined : JSON.stringify(data);
  } catch {
    try {
      body = JSON.stringify(Object.assign({}, data));
    } catch {
      body = undefined;
    }
  }
  return secureFetch<T>(url, { ...options, method: 'POST', body });
}

export async function put<T = any>(url: string, data?: any, options?: FetchOptions): Promise<FetchResponse<T>> {
  let body: string | undefined;
  try {
    body = data === undefined ? undefined : JSON.stringify(data);
  } catch {
    try {
      body = JSON.stringify(Object.assign({}, data));
    } catch {
      body = undefined;
    }
  }
  return secureFetch<T>(url, { ...options, method: 'PUT', body });
}

export async function del<T = any>(url: string, options?: FetchOptions): Promise<FetchResponse<T>> {
  return secureFetch<T>(url, { ...options, method: 'DELETE' });
}

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

export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  const config = getEnvironmentConfig();
  const queryString = params ? buildQueryString(params) : '';
  return `${config.appUrl}/api${endpoint}${queryString}`;
}
