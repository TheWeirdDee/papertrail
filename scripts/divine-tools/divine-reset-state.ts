import fs from 'node:fs';
import path from 'node:path';

const STATE_PATH = process.env.FRIEND_STATE || path.join(process.cwd(), 'scripts', 'private', 'state', 'friend-progress.json');

function main(): void {
  if (!fs.existsSync(STATE_PATH)) {
    console.log(`State file not found: ${STATE_PATH}`);
    return;
  }
  fs.unlinkSync(STATE_PATH);
  console.log(`Removed state file: ${STATE_PATH}`);
}

main();