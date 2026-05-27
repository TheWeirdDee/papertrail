import fs from 'node:fs';
import path from 'node:path';

const KEYS_CSV = process.env.FRIEND_KEYS_CSV || path.join(process.cwd(), 'scripts', 'private', 'divine-keys.csv');
const STATE_PATH = process.env.FRIEND_STATE || path.join(process.cwd(), 'scripts', 'private', 'state', 'friend-progress.json');

function main(): void {
  const keysExist = fs.existsSync(KEYS_CSV);
  const stateExist = fs.existsSync(STATE_PATH);
  console.log(`Keys file: ${KEYS_CSV} => ${keysExist ? 'found' : 'missing'}`);
  console.log(`State file: ${STATE_PATH} => ${stateExist ? 'found' : 'missing'}`);
  if (keysExist) {
    const lines = fs.readFileSync(KEYS_CSV, 'utf8').split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('index,'));
    console.log(`Wallets loaded: ${lines.length}`);
  }
}

main();