import { execSync } from 'node:child_process';

const command = process.argv[2];
if (!command) {
  console.log('Usage: ts-node-esm scripts/divine-tools/divine-cli.ts <command>');
  process.exit(1);
}

const mapping: Record<string, string> = {
  bot: 'npm run bot',
  balance: 'npm run divine:balance-check',
  syncusernames: 'npm run divine:username-sync',
  state: 'npm run divine:state-report',
  reset: 'npm run divine:reset-state',
  health: 'npm run divine:health-check',
};

if (!mapping[command]) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

execSync(mapping[command], { stdio: 'inherit' });
