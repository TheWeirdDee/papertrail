import fs from 'node:fs';
import path from 'node:path';

const STATE_DIR = process.env.FRIEND_STATE ? path.dirname(process.env.FRIEND_STATE) : path.join(process.cwd(), 'scripts', 'private', 'state');

function main(): void {
  if (!fs.existsSync(STATE_DIR)) {
    console.log(`State directory not found: ${STATE_DIR}`);
    return;
  }
  const files = fs.readdirSync(STATE_DIR).filter((f) => f.endsWith('.json'));
  console.log(`JSON state files in ${STATE_DIR}:`);
  files.forEach((file) => console.log(`- ${file}`));
}

main();