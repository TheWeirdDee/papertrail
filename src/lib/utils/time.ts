import { logErrorLevel } from './logger';

export function parseDate(value: any): Date | null {
  try {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isValidDate(date)) return date;
    }
    return null;
  } catch (error: any) {
    logErrorLevel('time.parseDate', 'Failed to parse date', { value: String(value), error: String(error) });
    return null;
  }
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function toISOString(date: any): string | null {
  const parsed = parseDate(date);
  return parsed ? parsed.toISOString() : null;
}

export function formatDate(date: any, options?: Intl.DateTimeFormatOptions): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...options });
}

export function formatDateTime(date: any): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return parsed.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatTime(date: any): string {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatRelativeTime(date: any): string {
  const parsed = parseDate(date);
  if (!parsed) return '';

  const diffSeconds = Math.floor((Date.now() - parsed.getTime()) / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

export function getStartOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isToday(date: any): boolean {
  const parsed = parseDate(date);
  if (!parsed) return false;
  return parsed.toDateString() === new Date().toDateString();
}

export function isPast(date: any): boolean {
  const parsed = parseDate(date);
  return parsed ? parsed.getTime() < Date.now() : false;
}

export function isFuture(date: any): boolean {
  const parsed = parseDate(date);
  return parsed ? parsed.getTime() > Date.now() : false;
}

export function getSecondsDifference(date1: any, date2: any): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return 0;
  return Math.floor(Math.abs(d1.getTime() - d2.getTime()) / 1000);
}

export function getMinutesDifference(date1: any, date2: any): number {
  return Math.floor(getSecondsDifference(date1, date2) / 60);
}

export function getHoursDifference(date1: any, date2: any): number {
  return Math.floor(getMinutesDifference(date1, date2) / 60);
}

export function getDaysDifference(date1: any, date2: any): number {
  return Math.floor(getHoursDifference(date1, date2) / 24);
}

export function addSeconds(date: any, seconds: number): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;
  const result = new Date(parsed);
  result.setSeconds(result.getSeconds() + seconds);
  return result;
}

export function addMinutes(date: any, minutes: number): Date | null {
  return addSeconds(date, minutes * 60);
}

export function addHours(date: any, hours: number): Date | null {
  return addMinutes(date, hours * 60);
}

export function addDays(date: any, days: number): Date | null {
  return addHours(date, days * 24);
}
