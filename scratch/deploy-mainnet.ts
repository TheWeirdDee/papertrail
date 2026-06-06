/**
 * PaperTrail — Mainnet Deployment Script
 *
 * Run from the project directory in Git Bash:
 *   DEPLOYER_PRIVATE_KEY="your-64-char-hex-key" npm run deploy:mainnet
 *
 * Run in PowerShell:
 *   $env:DEPLOYER_PRIVATE_KEY="your-64-char-hex-key"; npm run deploy:mainnet
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs   = require('fs');
const path = require('path');

const {
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  contractPrincipalCV,
  AnchorMode,
  PostConditionMode,
} = require('@stacks/transactions');

// @stacks/network not needed — use string 'mainnet' directly (v7 SDK accepts it)

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const DEPLOYER_ADDRESS    = 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX';
const RAW_KEY: string     = process.env.DEPLOYER_PRIVATE_KEY || '';
// Ensure compressed-key marker '01' is present (required by @stacks/transactions v7)
const DEPLOYER_PRIVATE_KEY: string = RAW_KEY.length === 64 && !RAW_KEY.endsWith('01')
  ? RAW_KEY + '01'
  : RAW_KEY;

const TOKEN_CONTRACT_NAME  = 'gm-token-final-v1';
const SOCIAL_CONTRACT_NAME = 'gm-social-final-v1';

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const HIRO_API      = 'https://api.mainnet.hiro.so';
const NETWORK       = 'mainnet'; // string form — most reliable with CJS require

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function getAccountNonce(address: string): Promise<number> {
  const res  = await fetch(`${HIRO_API}/v2/accounts/${address}?proof=0`);
  if (!res.ok) throw new Error(`Failed to fetch nonce: ${res.status}`);
  const data: any = await res.json();
  return data.nonce;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilConfirmed(txId: string): Promise<void> {
  const cleanId = txId.startsWith('0x') ? txId : `0x${txId}`;
  console.log(`  ⏳ https://explorer.hiro.so/txid/${cleanId}`);

  for (let i = 0; i < 60; i++) {
    await sleep(15_000);
    try {
      const res = await fetch(`${HIRO_API}/extended/v1/tx/${cleanId}`);
      if (!res.ok) { process.stdout.write('.'); continue; }
      const data: any = await res.json();
      const status: string = data.tx_status;

      if (status === 'success') {
        console.log('\n  ✅ Confirmed!');
        return;
      }
      if (status === 'abort_by_response' || status === 'abort_by_post_condition') {
        throw new Error(`TX aborted: ${data.tx_result?.repr ?? 'unknown reason'}`);
      }
      process.stdout.write(` [${status}]`);
    } catch (err: any) {
      if (err.message?.includes('aborted')) throw err;
      process.stdout.write('.');
    }
  }
  throw new Error('Timeout: tx not confirmed after 15 minutes');
}

async function broadcast(tx: any, label: string): Promise<string> {
  console.log(`\n📡 Broadcasting: ${label}`);

  // Inspect the fee actually embedded in the transaction
  const embeddedFee = tx?.auth?.spendingCondition?.fee;
  console.log(`  Fee in tx: ${embeddedFee?.toString() ?? 'UNKNOWN'} microSTX`);

  // Serialize manually
  const serialized: Uint8Array = tx.serialize();
  console.log(`  TX size: ${serialized.length} bytes`);

  // Raw POST — bypasses SDK broadcastTransaction abstraction
  const res = await fetch(`${HIRO_API}/v2/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from(serialized),
  });

  const responseText = await res.text();
  console.log(`  HTTP ${res.status}: ${responseText}`);

  if (!res.ok) {
    throw new Error(`Broadcast failed for ${label}: ${responseText}`);
  }

  const txId: string = responseText.replace(/"/g, '');
  console.log(`  TX: https://explorer.hiro.so/txid/0x${txId}`);
  return txId;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('\n❌ DEPLOYER_PRIVATE_KEY is not set.\n');
    console.error('  Git Bash:    DEPLOYER_PRIVATE_KEY="your-key" npm run deploy:mainnet');
    console.error('  PowerShell:  $env:DEPLOYER_PRIVATE_KEY="your-key"; npm run deploy:mainnet\n');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  PaperTrail — Mainnet Deployment');
  console.log(`  Deployer: ${DEPLOYER_ADDRESS}`);
  console.log('═══════════════════════════════════════════════════\n');

  const tokenSource  = fs.readFileSync(path.join(CONTRACTS_DIR, 'gm-token.clar'),  'utf8');
  const socialSource = fs.readFileSync(path.join(CONTRACTS_DIR, 'gm-social.clar'), 'utf8');

  let nonce = await getAccountNonce(DEPLOYER_ADDRESS);
  console.log(`📋 Starting nonce: ${nonce}`);
  console.log(`🔐 Key: ${DEPLOYER_PRIVATE_KEY.slice(0, 8)}... (compressed ✅)`);
  console.log(`🌐 Network: ${NETWORK}`);

  // ── 1. Deploy gm-token-final-v1 ─────────────────────────────────────────
  console.log('\n── STEP 1/4: Deploy gm-token-final-v1');
  const tokenDeploy = await makeContractDeploy({
    contractName: TOKEN_CONTRACT_NAME,
    codeBody: tokenSource,
    senderKey: DEPLOYER_PRIVATE_KEY,
    network: NETWORK,
    nonce: BigInt(nonce),
    postConditionMode: PostConditionMode.Allow,
    fee: 500000,
  });
  await pollUntilConfirmed(await broadcast(tokenDeploy, TOKEN_CONTRACT_NAME));
  nonce++;

  // ── 2. Deploy gm-social-final-v1 ────────────────────────────────────────────
  console.log('\n── STEP 2/4: Deploy gm-social-final-v1');
  const socialDeploy = await makeContractDeploy({
    contractName: SOCIAL_CONTRACT_NAME,
    codeBody: socialSource,
    senderKey: DEPLOYER_PRIVATE_KEY,
    network: NETWORK,
    nonce: BigInt(nonce),
    postConditionMode: PostConditionMode.Allow,
    fee: 1000000,
  });
  await pollUntilConfirmed(await broadcast(socialDeploy, SOCIAL_CONTRACT_NAME));
  nonce++;

  // ── 3. set-token-contract on social ─────────────────────────────────────────
  console.log('\n── STEP 3/4: set-token-contract on gm-social-final-v1');
  const setTokenTx = await makeContractCall({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: SOCIAL_CONTRACT_NAME,
    functionName: 'set-token-contract',
    functionArgs: [contractPrincipalCV(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME)],
    senderKey: DEPLOYER_PRIVATE_KEY,
    network: NETWORK,
    nonce: BigInt(nonce),
    postConditionMode: PostConditionMode.Allow,
    fee: 10000,
  });
  await pollUntilConfirmed(await broadcast(setTokenTx, 'set-token-contract'));
  nonce++;

  // ── 4. set-governor on token ─────────────────────────────────────────────
  console.log('\n── STEP 4/4: set-governor on gm-token-final-v1');
  const setGovTx = await makeContractCall({
    contractAddress: DEPLOYER_ADDRESS,
    contractName: TOKEN_CONTRACT_NAME,
    functionName: 'set-governor',
    functionArgs: [contractPrincipalCV(DEPLOYER_ADDRESS, SOCIAL_CONTRACT_NAME)],
    senderKey: DEPLOYER_PRIVATE_KEY,
    network: NETWORK,
    nonce: BigInt(nonce),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: BigInt(10_000), // 0.01 STX
  });
  await pollUntilConfirmed(await broadcast(setGovTx, 'set-governor'));

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ MAINNET DEPLOYMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n  Token:  ${DEPLOYER_ADDRESS}.${TOKEN_CONTRACT_NAME}`);
  console.log(`  Social: ${DEPLOYER_ADDRESS}.${SOCIAL_CONTRACT_NAME}`);
  console.log('\n  .env.local is already updated — restart your dev server.');
}

main().catch((err: any) => {
  console.error('\n❌ Deployment failed:', err.message ?? err);
  process.exit(1);
});
