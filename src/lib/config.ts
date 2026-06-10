import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
const IS_MAINNET = networkType === 'mainnet';

export const PAPERTRAIL_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '').trim();
export const PAPERTRAIL_CONTRACT_NAME = 'papertrail-v';
export const REGISTRATION_FEE_MICROSTX = 50000; // 0.05 STX

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

export const getExplorerLink = (id: string): string => {
  if (!id || typeof id !== 'string') return APP_CONFIG.explorerUrl;
  const sanitizedId = id.trim();
  if (sanitizedId.length === 0) return APP_CONFIG.explorerUrl;
  const isAddress = sanitizedId.startsWith('S');
  const path = isAddress ? 'address' : 'txid';
  const cleanId = (isAddress || sanitizedId.startsWith('0x')) ? sanitizedId : `0x${sanitizedId}`;
  return `${APP_CONFIG.explorerUrl}/${path}/${encodeURIComponent(cleanId)}`;
};
