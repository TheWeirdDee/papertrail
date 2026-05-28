/**
 * Error Handling Utilities
 * Centralized error handling and logging
 */

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

/**
 * Logs error safely without exposing sensitive data
 * @param context - Context where error occurred
 * @param error - The error object
 * @param additionalInfo - Additional context
 */
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

/**
 * Safely handle API errors
 * @param error - Error from API call
 * @returns Normalized error response
 */
export const handleApiError = (error: any): ApiError => {
  // Network errors
  if (!error.response) {
    return {
      status: 0,
      message: 'Network error - unable to connect to service',
      code: 'NETWORK_ERROR',
      details: error.message,
    };
  }
  
  // HTTP error responses
  const status = error.response?.status || 500;
  const data = error.response?.data;
  
  return {
    status,
    message: data?.message || data?.error || 'An error occurred',
    code: data?.code || `HTTP_${status}`,
    details: data?.details,
  };
};

/**
 * Returns user-friendly error message
 * @param error - The error object
 * @returns Safe message to show user
 */
export const getUserFriendlyMessage = (error: any): string => {
  const status = error?.status;
  const code = error?.code;
  
  // Common error scenarios
  if (status === 400 || code === 'VALIDATION_ERROR') {
    return 'Invalid input. Please check your entries.';
  }
  
  if (status === 401 || code === 'UNAUTHORIZED') {
    return 'Authentication failed. Please log in again.';
  }
  
  if (status === 403 || code === 'FORBIDDEN') {
    return 'You do not have permission to perform this action.';
  }
  
  if (status === 404 || code === 'NOT_FOUND') {
    return 'The requested resource was not found.';
  }
  
  if (status === 429 || code === 'RATE_LIMITED') {
    return 'Too many requests. Please try again later.';
  }
  
  if (status === 500 || status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  if (code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your internet.';
  }
  
  if (code === 'CORS_ERROR') {
    return 'Unable to reach the service. This may be a temporary issue.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

/**
 * Safely parse JSON response
 * @param response - Response data
 * @returns Parsed data or default
 */
export const safeJsonParse = <T = any>(
  response: any,
  defaultValue: T | null = null
): T | null => {
  try {
    if (!response) return defaultValue;
    
    if (typeof response === 'string') {
      return JSON.parse(response) as T;
    }
    
    return response as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
};

/**
 * Validates API response format
 * @param response - Response data
 * @param requiredFields - Fields that must exist
 * @returns True if response is valid
 */
export const isValidApiResponse = (
  response: any,
  requiredFields: string[] = []
): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => field in response && response[field] !== undefined);
};

/**
 * Creates standardized error response for API routes
 * @param status - HTTP status code
 * @param message - Error message
 * @param code - Error code
 * @returns Response object
 */
export const createErrorResponse = (
  status: number,
  message: string,
  code: string = 'ERROR'
) => {
  return {
    status,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Creates standardized success response for API routes
 * @param data - Response data
 * @param message - Success message
 * @returns Response object
 */
export const createSuccessResponse = (
  data: any,
  message: string = 'Success'
) => {
  return {
    status: 200,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Retry logic for failed operations
 * @param fn - Function to retry
 * @param maxAttempts - Maximum retry attempts
 * @param delayMs - Delay between retries
 * @returns Result or throws error
 */
export const retryOperation = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
