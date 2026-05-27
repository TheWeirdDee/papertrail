import fs from 'node:fs';
import path from 'node:path';

const STATE_PATH = process.env.FRIEND_STATE || path.join(process.cwd(), 'scripts', 'private', 'state', 'friend-progress.json');

function main(): void {
  if (!fs.existsSync(STATE_PATH)) {
    console.log(`State file not found: ${STATE_PATH}`);
    process.exit(0);
  }
  const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const wallets = Object.keys(data.walletsState || {}).length;
  console.log(`State path: ${STATE_PATH}`);
  console.log(`Started at: ${data.startedAt}`);
  console.log(`Wallets tracked: ${wallets}`);
  console.log(`Total attempted: ${data.totalAttempted}`);
  console.log(`Total succeeded: ${data.totalSucceeded}`);
  console.log(`Total failed: ${data.totalFailed}`);
}

main();