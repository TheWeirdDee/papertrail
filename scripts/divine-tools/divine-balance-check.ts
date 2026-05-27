import fs from 'node:fs';
import path from 'node:path';

const KEYS_CSV = process.env.FRIEND_KEYS_CSV || path.join(process.cwd(), 'scripts', 'private', 'divine-keys.csv');
const HIRO_API = (process.env.HIRO_API_BASE || 'https://api.mainnet.hiro.so').replace(/\/+$/, '');

function hexToBigInt(h: string | undefined): bigint {
  if (!h) return BigInt(0);
  return BigInt(h.startsWith('0x') ? h : '0x' + h);
}

async function fetchBalance(address: string): Promise<bigint> {
  const res = await fetch(`${HIRO_API}/v2/accounts/${address}?proof=0`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return hexToBigInt(json.balance);
}

async function main(): Promise<void> {
  const raw = fs.readFileSync(KEYS_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('index,'));
  for (const line of lines) {
    const [, address] = line.split(',').map((s) => s.trim());
    if (!address) continue;
    const balance = await fetchBalance(address);
    console.log(`${address} = ${balance} uSTX`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});