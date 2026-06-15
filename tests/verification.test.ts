import { describe, it, expect } from 'vitest';
import { isValidHash, parseVerificationUrl, buildVerificationUrl, CATEGORY_NAMES } from '../src/lib/verification';

const HASH = 'a'.repeat(64);

describe('isValidHash', () => {
  it('accepts a 64-char hex string', () => {
    expect(isValidHash(HASH)).toBe(true);
    expect(isValidHash('ABCDEF' + '0'.repeat(58))).toBe(true);
  });

  it('rejects wrong length or non-hex', () => {
    expect(isValidHash('a'.repeat(63))).toBe(false);
    expect(isValidHash('a'.repeat(65))).toBe(false);
    expect(isValidHash('z'.repeat(64))).toBe(false);
    expect(isValidHash('')).toBe(false);
  });
});

describe('parseVerificationUrl', () => {
  it('extracts a raw hash', () => {
    expect(parseVerificationUrl(HASH)).toBe(HASH);
  });

  it('lowercases the result', () => {
    expect(parseVerificationUrl('A'.repeat(64))).toBe('a'.repeat(64));
  });

  it('extracts the hash from a full verification URL', () => {
    expect(parseVerificationUrl(`https://papertrail.vercel.app/verify?hash=${HASH}`)).toBe(HASH);
  });

  it('returns null for invalid input', () => {
    expect(parseVerificationUrl('not-a-hash')).toBeNull();
    expect(parseVerificationUrl('https://example.com/verify?hash=nope')).toBeNull();
  });
});

describe('buildVerificationUrl', () => {
  it('builds a verify URL containing the hash', () => {
    expect(buildVerificationUrl(HASH)).toContain(`/verify?hash=${HASH}`);
  });
});

describe('CATEGORY_NAMES', () => {
  it('covers exactly categories 1-5', () => {
    expect(Object.keys(CATEGORY_NAMES)).toEqual(['1', '2', '3', '4', '5']);
  });
});
