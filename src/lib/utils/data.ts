/**
 * Data Processing Utilities
 * Safe data transformation, sanitization, and conversion functions
 */
import { logErrorLevel } from './logger';
=======
import { logError } from './logger';

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    if (!json || typeof json !== 'string') {
      return fallback;
    }
    return JSON.parse(json) as T;
  } catch (error: any) {
    logErrorLevel('safeJsonParse', 'Failed to parse JSON', { error: String(error) });
  } catch (error) {
    logError('safeJsonParse', 'Failed to parse JSON', { error: String(error) });
    return fallback;
  }
}

/**
 * Safely stringify object
 */
export function safeJsonStringify(obj: any, fallback = '{}'): string {
  try {
    if (obj === undefined) {
      return fallback;
    }
    return JSON.stringify(obj);
  } catch (error: any) {
    logErrorLevel('safeJsonStringify', 'Failed to stringify', { error: String(error) });
  } catch (error) {
    logError('safeJsonStringify', 'Failed to stringify', { error: String(error) });
    return fallback;
  }
}

/**
 * Safely convert number with bounds checking
 */
export function toNumber(value: any, defaultValue = 0, min?: number, max?: number): number {
  try {
    const num = Number(value);
    
    if (!Number.isFinite(num)) {
      return defaultValue;
    }
    
    if (min !== undefined && num < min) {
      return min;
    }
    
    if (max !== undefined && num > max) {
      return max;
    }
    
    return num;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely convert string with trimming
 */
export function toString(value: any, defaultValue = ''): string {
  try {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return String(value).trim();
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely convert boolean
 */
export function toBoolean(value: any, defaultValue = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return defaultValue;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= length) {
    return str;
  }
  
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert camelCase to Title Case
 */
export function camelCaseToTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Format number with commas
 */
export function formatNumber(num: any, decimals = 0): string {
  try {
    const n = Number(num);
    if (!Number.isFinite(n)) {
      return '0';
    }
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    return '0';
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: any, currency = 'USD'): string {
  try {
    const num = Number(amount);
    if (!Number.isFinite(num)) {
      return '$0.00';
    }
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'USD'
    });
  } catch (error) {
    return '$0.00';
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: any, decimals = 1): string {
  try {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return '0%';
    }
    return `${num.toFixed(decimals)}%`;
  } catch (error) {
    return '0%';
  }
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Deep clone object (simple version, not for circular references)
 */
export function deepClone<T = any>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch (error: any) {
    logErrorLevel('deepClone', 'Failed to clone object', { error: String(error) });
=======
  } catch (error) {
    logError('deepClone', 'Failed to clone object');

    return obj;
  }
}

/**
 * Merge objects shallow
 */
export function mergeObjects<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign({}, target, ...sources) as T;
}
