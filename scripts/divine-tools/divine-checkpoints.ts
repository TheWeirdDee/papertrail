import fs from 'node:fs';
import path from 'node:path';

const STATE_PATH = process.env.FRIEND_STATE || path.join(process.cwd(), 'scripts', 'private', 'state', 'friend-progress.json');

function main(): void {
  if (!fs.existsSync(STATE_PATH)) {
    console.log('No state file to checkpoint.');
    return;
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  console.log('Checkpoint state:');
  console.log(JSON.stringify({
    startedAt: state.startedAt,
    totalAttempted: state.totalAttempted,
    totalSucceeded: state.totalSucceeded,
    totalFailed: state.totalFailed,
  }, null, 2));
}

main();