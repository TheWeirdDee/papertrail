import fs from 'node:fs';
import path from 'node:path';

const KEYS_CSV = process.env.FRIEND_KEYS_CSV || path.join(process.cwd(), 'scripts', 'private', 'divine-keys.csv');

function main(): void {
  const raw = fs.readFileSync(KEYS_CSV, 'utf8');
  const wallets = raw.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('index,'));
  console.log(`Wallets loaded: ${wallets.length}`);
  wallets.forEach((line, idx) => {
    const [, address] = line.split(',').map((s) => s.trim());
    console.log(`${idx + 1}. ${address}`);
  });
}

main();