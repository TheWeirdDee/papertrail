import { logErrorLevel } from './logger';

export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    if (!json || typeof json !== 'string') return fallback;
    return JSON.parse(json) as T;
  } catch (error: any) {
    logErrorLevel('safeJsonParse', 'Failed to parse JSON', { error: String(error) });
    return fallback;
  }
}

export function safeJsonStringify(obj: any, fallback = '{}'): string {
  try {
    if (obj === undefined) return fallback;
    return JSON.stringify(obj);
  } catch (error: any) {
    logErrorLevel('safeJsonStringify', 'Failed to stringify', { error: String(error) });
    return fallback;
  }
}

export function toNumber(value: any, defaultValue = 0, min?: number, max?: number): number {
  try {
    const num = Number(value);
    if (!Number.isFinite(num)) return defaultValue;
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  } catch {
    return defaultValue;
  }
}

export function toString(value: any, defaultValue = ''): string {
  try {
    if (value === null || value === undefined) return defaultValue;
    return String(value).trim();
  } catch {
    return defaultValue;
  }
}

export function toBoolean(value: any, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

export function capitalize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function camelCaseToTitleCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export function formatNumber(num: any, decimals = 0): string {
  try {
    const n = Number(num);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return '0';
  }
}

export function formatCurrency(amount: any, currency = 'USD'): string {
  try {
    const num = Number(amount);
    if (!Number.isFinite(num)) return '$0.00';
    return num.toLocaleString('en-US', { style: 'currency', currency });
  } catch {
    return '$0.00';
  }
}

export function formatPercent(value: any, decimals = 1): string {
  try {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0%';
    return `${num.toFixed(decimals)}%`;
  } catch {
    return '0%';
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function deepClone<T = any>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch (error: any) {
    logErrorLevel('deepClone', 'Failed to clone object', { error: String(error) });
    return obj;
  }
}

export function mergeObjects<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign({}, target, ...sources) as T;
}
