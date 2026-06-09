import { APP_CONFIG, PAPERTRAIL_CONTRACT_ADDRESS, PAPERTRAIL_CONTRACT_NAME } from './config';

export type DocumentRecord = {
  owner: string;
  title: string;
  category: number;
  registeredAt: number;
  isRevoked: boolean;
  revokedAt: number | null;
};

export type VerifyResult =
  | { status: 'verified'; doc: DocumentRecord }
  | { status: 'revoked'; doc: DocumentRecord }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export const CATEGORY_NAMES: Record<number, string> = {
  1: 'Legal',
  2: 'Education',
  3: 'Medical',
  4: 'Financial',
  5: 'Identity',
  6: 'Real Estate',
  7: 'Other',
};

export function isValidHash(hex: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hex);
}

// Encodes a 32-byte hex string as a Clarity (buff 32) value: 0x02 + 4-byte BE length + data
function encodeClarityBuffer(hexStr: string): string {
  const len = hexStr.length / 2;
  return '0x02' + len.toString(16).padStart(8, '0') + hexStr;
}

export async function getDocument(hashHex: string): Promise<VerifyResult> {
  try {
    const { deserializeCV, cvToValue } = await import('@stacks/transactions');

    const apiBase = APP_CONFIG.isMainnet
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    const res = await fetch(
      `${apiBase}/v2/contracts/call-read/${PAPERTRAIL_CONTRACT_ADDRESS}/${PAPERTRAIL_CONTRACT_NAME}/get-document`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: PAPERTRAIL_CONTRACT_ADDRESS,
          arguments: [encodeClarityBuffer(hashHex)],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) throw new Error(`Hiro API returned ${res.status}`);

    const { okay, result } = await res.json();
    if (!okay || !result) throw new Error('Contract read failed');

    const cv = deserializeCV(result);
    const value = cvToValue(cv);

    if (value === null || value === undefined) return { status: 'not_found' };

    const doc: DocumentRecord = {
      owner: String(value.owner ?? ''),
      title: String(value.title ?? ''),
      category: Number(value.category ?? 7),
      registeredAt: Number(value['registered-at'] ?? 0),
      isRevoked: Boolean(value['is-revoked']),
      revokedAt: value['revoked-at'] != null ? Number(value['revoked-at']) : null,
    };

    return { status: doc.isRevoked ? 'revoked' : 'verified', doc };
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Verification failed' };
  }
}

export function buildVerificationUrl(hash: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://papertrail.vercel.app');
  return `${base}/verify?hash=${hash}`;
}

export function parseVerificationUrl(input: string): string | null {
  const trimmed = input.trim();

  // Raw 64-char hex
  if (isValidHash(trimmed)) return trimmed.toLowerCase();

  // Full URL
  try {
    const u = new URL(trimmed);
    const hash = u.searchParams.get('hash');
    if (hash && isValidHash(hash)) return hash.toLowerCase();
  } catch {
    // not a URL
  }

  return null;
}
