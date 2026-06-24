import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
const IS_MAINNET = networkType === 'mainnet';

export const PAPERTRAIL_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '').trim();
export const PAPERTRAIL_CONTRACT_NAME = 'papertrail-v3';
export const REGISTRATION_FEE_MICROSTX = 500000; // 0.5 STX
export const COSIGN_FEE_MICROSTX       = 250000; // 0.25 STX
export const UPDATE_FEE_MICROSTX       = 100000; // 0.1 STX
export const TRANSFER_FEE_MICROSTX     = 250000; // 0.25 STX

// Fail loud in development if the contract address is missing — otherwise
// read calls silently build malformed URLs and fail at runtime.
if (!PAPERTRAIL_CONTRACT_ADDRESS) {
  const msg =
    '[config] NEXT_PUBLIC_CONTRACT_ADDRESS is not set. Contract reads/writes will fail. ' +
    'Set it in .env.local (see .env.example).';
  if (process.env.NODE_ENV === 'production') {
    console.error(msg);
  } else {
    console.warn(msg);
  }
}

export const QUALIFIED_CONTRACT = `${PAPERTRAIL_CONTRACT_ADDRESS}.${PAPERTRAIL_CONTRACT_NAME}` as const;

export const APP_CONFIG = {
  contractAddress: PAPERTRAIL_CONTRACT_ADDRESS,
  contractName: PAPERTRAIL_CONTRACT_NAME,
  network: IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET,
  isMainnet: IS_MAINNET,
  explorerUrl: IS_MAINNET
    ? 'https://explorer.hiro.so'
    : 'https://explorer.hiro.so?chain=testnet',
  defaultFee: 100000,
};
/**
 * Gets explorer link with validation
 */
export const getExplorerLink = (id: string): string => {
  if (!id || typeof id !== 'string') return APP_CONFIG.explorerUrl;
  const sanitizedId = id.trim();
  if (sanitizedId.length === 0) return APP_CONFIG.explorerUrl;
  const isAddress = sanitizedId.startsWith('S');
  const path = isAddress ? 'address' : 'txid';
  const cleanId = (isAddress || sanitizedId.startsWith('0x')) ? sanitizedId : `0x${sanitizedId}`;
  return `${APP_CONFIG.explorerUrl}/${path}/${encodeURIComponent(cleanId)}`;
};
