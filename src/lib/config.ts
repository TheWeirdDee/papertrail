import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { isValidStacksAddress, isValidContractName } from './utils/validation';

const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
const IS_MAINNET = networkType === 'mainnet';

const SOCIAL_ADDRESS = process.env.NEXT_PUBLIC_SOCIAL_ADDRESS || 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX';
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX';

export const APP_CONFIG = {
  social: {
    address: SOCIAL_ADDRESS,
    name: 'gm-social-final-v5',
  },

  token: {
    address: TOKEN_ADDRESS,
    name: 'gm-social-token-v4',
  },

  contractAddress: SOCIAL_ADDRESS,
  contractName: 'gm-social-final-v1',

  network: IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET,
  isMainnet: IS_MAINNET,

  explorerUrl: IS_MAINNET 
    ? 'https://explorer.hiro.so' 
    : 'https://testnet.hiro.so',
  
  defaultFee: 100000,
};

/**
 * Validates APP_CONFIG at load time
 */
const validateConfig = (): void => {
  const errors: string[] = [];
  
  if (!isValidStacksAddress(APP_CONFIG.social.address)) {
    errors.push(`Invalid social contract address: ${APP_CONFIG.social.address}`);
  }
  
  if (!isValidStacksAddress(APP_CONFIG.token.address)) {
    errors.push(`Invalid token contract address: ${APP_CONFIG.token.address}`);
  }
  
  if (!isValidContractName(APP_CONFIG.social.name)) {
    errors.push(`Invalid social contract name: ${APP_CONFIG.social.name}`);
  }
  
  if (!isValidContractName(APP_CONFIG.token.name)) {
    errors.push(`Invalid token contract name: ${APP_CONFIG.token.name}`);
  }
  
  if (errors.length > 0) {
    console.error('APP_CONFIG Validation Errors:', errors);
    if (IS_MAINNET) {
      throw new Error(`Critical config errors: ${errors.join('; ')}`);
    }
  }
};

// Validate on import
validateConfig();

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
