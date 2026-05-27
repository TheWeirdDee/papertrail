import fs from 'node:fs';
import path from 'node:path';

const KEYS_CSV = process.env.FRIEND_KEYS_CSV || path.join(process.cwd(), 'scripts', 'private', 'divine-keys.csv');
const HIRO_API = (process.env.HIRO_API_BASE || 'https://api.mainnet.hiro.so').replace(/\/+$/, '');

async function fetchUsername(address: string): Promise<string | null> {
  const res = await fetch(`${HIRO_API}/v2/accounts/${address}/smart?function=set-username`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.result || null;
}

async function main(): Promise<void> {
  const raw = fs.readFileSync(KEYS_CSV, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('index,'));
  for (const line of lines) {
    const [, address] = line.split(',').map((s) => s.trim());
    if (!address) continue;
    const result = await fetchUsername(address);
    console.log(`${address} username=${result ?? 'unknown'}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});