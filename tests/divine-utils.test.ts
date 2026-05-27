import { describe, expect, it } from 'vitest';
import { retryDelay } from '../scripts/divine-tools/divine-ratelimit-helper';

describe('divine-ratelimit-helper', () => {
  it('retries failed attempts before succeeding', async () => {
    let tries = 0;
    const result = await retryDelay(async () => {
      tries += 1;
      if (tries < 2) throw new Error('fail');
      return 'ok';
    }, 3, 10);
    expect(result).toBe('ok');
    expect(tries).toBe(2);
  });
});