import { APP_CONFIG, PAPERTRAIL_CONTRACT_ADDRESS, PAPERTRAIL_CONTRACT_NAME } from './config';

const apiBase = () =>
  APP_CONFIG.isMainnet ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';

// Calls a read-only contract function via the Hiro node and returns the decoded value.
async function callRead(fn: string, args: string[]): Promise<unknown> {
  const { deserializeCV, cvToValue } = await import('@stacks/transactions');

  const res = await fetch(
    `${apiBase()}/v2/contracts/call-read/${PAPERTRAIL_CONTRACT_ADDRESS}/${PAPERTRAIL_CONTRACT_NAME}/${fn}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: PAPERTRAIL_CONTRACT_ADDRESS, arguments: args }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) throw new Error(`Hiro API returned ${res.status}`);

  const { okay, result } = await res.json();
  if (!okay || !result) throw new Error('Contract read failed');

  return cvToValue(deserializeCV(result));
}

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
  1: 'Education',
  2: 'Professional',
  3: 'Financial',
  4: 'Property',
  5: 'General',
};

export function isValidHash(hex: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hex);
}

// Encodes a 32-byte hex string as a Clarity (buff 32) value: 0x02 + 4-byte BE length + data
function encodeClarityBuffer(hexStr: string): string {
  const len = hexStr.length / 2;
  return '0x02' + len.toString(16).padStart(8, '0') + hexStr;
}

// Decodes the raw cvToValue result of `get-document` into a DocumentRecord.
function decodeDocument(value: any): DocumentRecord | null {
  if (value === null || value === undefined) return null;
  return {
    owner: String(value.owner ?? ''),
    title: String(value.title ?? ''),
    category: Number(value.category ?? 5),
    registeredAt: Number(value['registered-at'] ?? 0),
    isRevoked: Boolean(value['is-revoked']),
    revokedAt: value['revoked-at'] != null ? Number(value['revoked-at']) : null,
  };
}

export async function getDocument(hashHex: string): Promise<VerifyResult> {
  try {
    const value = await callRead('get-document', [encodeClarityBuffer(hashHex)]);
    const doc = decodeDocument(value);
    if (!doc) return { status: 'not_found' };
    return { status: doc.isRevoked ? 'revoked' : 'verified', doc };
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Verification failed' };
  }
}

export type OwnerDocument = DocumentRecord & { hash: string };

// Reads a wallet's documents directly from the contract (source of truth).
// Uses the on-chain pagination index: get-document-count + get-owner-document-at.
export async function getDocumentsByOwner(address: string): Promise<OwnerDocument[]> {
  const { principalCV, uintCV, serializeCV } = await import('@stacks/transactions');
  const ownerArg = '0x' + serializeCV(principalCV(address));

  const countValue = await callRead('get-document-count', [ownerArg]);
  const count = Number(countValue ?? 0);
  if (!count) return [];

  const indices = Array.from({ length: count }, (_, i) => i);
  const results = await Promise.all(
    indices.map(async i => {
      try {
        const at = (await callRead('get-owner-document-at', [
          ownerArg,
          '0x' + serializeCV(uintCV(i)),
        ])) as any;
        const hash = at?.hash;
        if (!hash) return null;
        const hashHex = String(hash).replace(/^0x/, '');
        const doc = decodeDocument(await callRead('get-document', [encodeClarityBuffer(hashHex)]));
        return doc ? ({ ...doc, hash: hashHex } as OwnerDocument) : null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((d): d is OwnerDocument => d !== null);
}

export type PlatformStats = {
  totalRegistrations: number;
  totalUniqueOwners: number;
  totalStxCollected: number;
};

// Reads global platform stats from the contract's get-stats read function.
export async function getStats(): Promise<PlatformStats> {
  try {
    const value = (await callRead('get-stats', [])) as any;
    return {
      totalRegistrations: Number(value?.['total-registrations'] ?? 0),
      totalUniqueOwners: Number(value?.['total-unique-owners'] ?? 0),
      totalStxCollected: Number(value?.['total-stx-collected'] ?? 0),
    };
  } catch {
    return { totalRegistrations: 0, totalUniqueOwners: 0, totalStxCollected: 0 };
  }
}

// Returns the number of co-signers for a document.
export async function getCosignerCount(hashHex: string): Promise<number> {
  try {
    const value = await callRead('get-cosigner-count', [encodeClarityBuffer(hashHex)]);
    return Number(value ?? 0);
  } catch {
    return 0;
  }
}

// Returns whether a given principal has co-signed a document.
export async function isCosigner(hashHex: string, cosigner: string): Promise<boolean> {
  try {
    const { principalCV, serializeCV } = await import('@stacks/transactions');
    const cosignerArg = '0x' + serializeCV(principalCV(cosigner));
    const value = await callRead('is-cosigner', [
      encodeClarityBuffer(hashHex),
      cosignerArg,
    ]);
    return Boolean(value);
  } catch {
    return false;
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
