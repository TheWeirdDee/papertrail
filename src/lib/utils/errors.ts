export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const logError = (
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
): void => {
  const timestamp = new Date().toISOString();
  const errorMsg = error?.message || String(error);
  const errorCode = error?.code || 'UNKNOWN';

  console.error(`[${timestamp}] ${context} - ${errorCode}: ${errorMsg}`, {
    ...(additionalInfo && { context: additionalInfo }),
    stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
  });
};

export const handleApiError = (error: any): ApiError => {
  if (!error.response) {
    return {
      status: 0,
      message: 'Network error - unable to connect to service',
      code: 'NETWORK_ERROR',
      details: error.message,
    };
  }

  const status = error.response?.status || 500;
  const data = error.response?.data;

  return {
    status,
    message: data?.message || data?.error || 'An error occurred',
    code: data?.code || `HTTP_${status}`,
    details: data?.details,
  };
};

export const getUserFriendlyMessage = (error: any): string => {
  const status = error?.status;
  const code = error?.code;

  if (status === 400 || code === 'VALIDATION_ERROR') return 'Invalid input. Please check your entries.';
  if (status === 401 || code === 'UNAUTHORIZED') return 'Authentication failed. Please log in again.';
  if (status === 403 || code === 'FORBIDDEN') return 'You do not have permission to perform this action.';
  if (status === 404 || code === 'NOT_FOUND') return 'The requested resource was not found.';
  if (status === 429 || code === 'RATE_LIMITED') return 'Too many requests. Please try again later.';
  if (status >= 500) return 'Server error. Please try again later.';
  if (code === 'NETWORK_ERROR') return 'Network connection error. Please check your internet.';
  if (code === 'CORS_ERROR') return 'Unable to reach the service. This may be a temporary issue.';

  return error?.message || 'An unexpected error occurred.';
};

export const safeJsonParse = <T = any>(
  response: any,
  defaultValue: T | null = null
): T | null => {
  try {
    if (!response) return defaultValue;
    if (typeof response === 'string') return JSON.parse(response) as T;
    return response as T;
  } catch {
    return defaultValue;
  }
};

export const isValidApiResponse = (
  response: any,
  requiredFields: string[] = []
): boolean => {
  if (!response || typeof response !== 'object') return false;
  return requiredFields.every(field => field in response && response[field] !== undefined);
};

export const createErrorResponse = (
  status: number,
  message: string,
  code = 'ERROR'
) => ({
  status,
  error: {
    code,
    message,
    timestamp: new Date().toISOString(),
  },
});

export const createSuccessResponse = (data: any, message = 'Success') => ({
  status: 200,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const retryOperation = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError;
};
