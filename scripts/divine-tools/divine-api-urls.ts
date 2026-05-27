export const DEFAULT_HIRO_API = 'https://api.mainnet.hiro.so';
export const DEFAULT_STX_CHAIN = 'mainnet';

export function normalizeApiBase(url: string): string {
  return url.replace(/\/+$/, '');
}
