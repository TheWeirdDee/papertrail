/**
 * Logging Utilities
 * Centralized logging with levels and formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  data?: any;
  stack?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Format log entry
 */
function formatLog(entry: LogEntry): string {
  const { level, timestamp, context, message, data } = entry;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${context}: ${message}${dataStr}`;
}

/**
 * Log message at debug level
 */
export function logDebug(context: string, message: string, data?: any): void {
  if (!isDevelopment) return;

  const entry: LogEntry = {
    level: 'debug',
    timestamp: new Date().toISOString(),
    context,
    message,
    data
  };

  console.debug(formatLog(entry));
}

/**
 * Log message at info level
 */
export function logInfo(context: string, message: string, data?: any): void {
  const entry: LogEntry = {
    level: 'info',
    timestamp: new Date().toISOString(),
    context,
    message,
    data
  };

  console.log(formatLog(entry));
}

/**
 * Log message at warn level
 */
export function logWarn(context: string, message: string, data?: any): void {
  const entry: LogEntry = {
    level: 'warn',
    timestamp: new Date().toISOString(),
    context,
    message,
    data
  };

  console.warn(formatLog(entry));
}

/**
 * Log message at error level
 */
export function logErrorLevel(context: string, message: string, data?: any, error?: Error): void {
  const entry: LogEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    context,
    message,
    data,
    stack: error?.stack
  };

  console.error(formatLog(entry));
}

/**
 * Log performance metric
 */
export function logPerformance(context: string, operation: string, durationMs: number): void {
  const threshold = 1000; // 1 second
  const level = durationMs > threshold ? 'warn' : 'debug';
  
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context,
    message: `${operation} completed`,
    data: { durationMs, threshold, warning: durationMs > threshold }
  };

  if (level === 'warn') {
    console.warn(formatLog(entry));
  } else if (isDevelopment) {
    console.debug(formatLog(entry));
  }
}

/**
 * Creates a performance timer
 */
export function createTimer(context: string, operation: string) {
  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      logPerformance(context, operation, durationMs);
      return durationMs;
    }
  };
}

/**
 * Log API call
 */
export function logApiCall(
  method: string,
  url: string,
  status: number,
  durationMs: number
): void {
  const level = status >= 400 ? 'warn' : 'debug';
  const message = `${method} ${url} - ${status}`;

  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context: 'API',
    message,
    data: { method, url, status, durationMs }
  };

  if (level === 'warn') {
    console.warn(formatLog(entry));
  } else if (isDevelopment) {
    console.debug(formatLog(entry));
  }
}

/**
 * Log security event
 */
export function logSecurityEvent(context: string, event: string, severity: 'low' | 'medium' | 'high', data?: any): void {
  const entry: LogEntry = {
    level: severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info',
    timestamp: new Date().toISOString(),
    context: `SECURITY/${context}`,
    message: event,
    data
  };

  const logFn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
  logFn(formatLog(entry));
}
