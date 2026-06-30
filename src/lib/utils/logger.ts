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

function formatLog(entry: LogEntry): string {
  const { level, timestamp, context, message, data } = entry;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${context}: ${message}${dataStr}`;
}

export function logDebug(context: string, message: string, data?: any): void {
  if (!isDevelopment) return;
  const entry: LogEntry = { level: 'debug', timestamp: new Date().toISOString(), context, message, data };
  console.debug(formatLog(entry));
}

export function logInfo(context: string, message: string, data?: any): void {
  const entry: LogEntry = { level: 'info', timestamp: new Date().toISOString(), context, message, data };
  console.log(formatLog(entry));
}

export function logWarn(context: string, message: string, data?: any): void {
  const entry: LogEntry = { level: 'warn', timestamp: new Date().toISOString(), context, message, data };
  console.warn(formatLog(entry));
}

export function logErrorLevel(context: string, message: string, data?: any, error?: Error): void {
  const entry: LogEntry = {
    level: 'error',
    timestamp: new Date().toISOString(),
    context,
    message,
    data,
    stack: error?.stack,
  };
  console.error(formatLog(entry));
}

export function logPerformance(context: string, operation: string, durationMs: number): void {
  const threshold = 1000; // 1 second
  const level = durationMs > threshold ? 'warn' : 'debug';

  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context,
    message: `${operation} completed`,
    data: { durationMs, threshold, warning: durationMs > threshold },
  };

  if (level === 'warn') {
    console.warn(formatLog(entry));
  } else if (isDevelopment) {
    console.debug(formatLog(entry));
  }
}

export function createTimer(context: string, operation: string) {
  const startTime = performance.now();
  return {
    end: () => {
      const durationMs = performance.now() - startTime;
      logPerformance(context, operation, durationMs);
      return durationMs;
    },
  };
}

export function logApiCall(method: string, url: string, status: number, durationMs: number): void {
  const level = status >= 400 ? 'warn' : 'debug';
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context: 'API',
    message: `${method} ${url} - ${status}`,
    data: { method, url, status, durationMs },
  };

  if (level === 'warn') {
    console.warn(formatLog(entry));
  } else if (isDevelopment) {
    console.debug(formatLog(entry));
  }
}

export function logSecurityEvent(
  context: string,
  event: string,
  severity: 'low' | 'medium' | 'high',
  data?: any
): void {
  const level: LogLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    context: `SECURITY/${context}`,
    message: event,
    data,
  };

  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logFn(formatLog(entry));
}
