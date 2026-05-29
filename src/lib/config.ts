import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { logWarn } from './utils/logger';

const networkType = (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet').trim();
const IS_MAINNET = networkType === 'mainnet';

const envSocialAddress = (process.env.NEXT_PUBLIC_SOCIAL_ADDRESS || '').trim();
if (envSocialAddress && !/^S[P|T|M]/.test(envSocialAddress)) {
  logWarn('config', 'NEXT_PUBLIC_SOCIAL_ADDRESS looks malformed');
}

export const APP_CONFIG = {
  social: {
    address: envSocialAddress || 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX',
    name: 'gm-social-final-v5',
  },

  token: {
    address: 'SP1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSRKP54QX',
    name: 'gm-social-token-v4',
  },

  contractAddress: envSocialAddress || 'ST1MQE0HMB765Z9EVF0CM6SPMMKW4VPDDSVRTT2RF',
  contractName: 'gm-social-final-v1',

  network: IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET,
  isMainnet: IS_MAINNET,

  explorerUrl: IS_MAINNET 
    ? 'https://explorer.hiro.so' 
    : 'https://explorer.hiro.so?chain=testnet',
  defaultFee: 100000,
};


export const getExplorerLink = (id: string) => {
  if (!id) return APP_CONFIG.explorerUrl;
  const trimmed = id.trim();
  const isAddress = /^S[A-Z0-9]/.test(trimmed);
  const path = isAddress ? 'address' : 'txid';
  const cleanId = isAddress || trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  return `${APP_CONFIG.explorerUrl}/${path}/${cleanId}`;
};
