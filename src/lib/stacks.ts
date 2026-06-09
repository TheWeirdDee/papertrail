/**
 * Stacks Blockchain Integration Layer
 * Handles wallet authentication, generic contract calls, and network status
 */

import { APP_CONFIG } from './config';
import { toast } from 'react-hot-toast';
// store is lazy-loaded to break circular dependency
const getStore = () => require('./store').store;
import { addTransaction, updateTransactionStatus } from './features/txSlice';
import { logDebug, logInfo, logWarn, logErrorLevel, logSecurityEvent } from './utils/logger';
import { isValidStacksAddress } from './utils/validation';
import { getEnvironmentConfig } from './utils/env';
import { logError, getUserFriendlyMessage } from './utils/errors';

export const appDetails = {
  name: 'PaperTrail',
  icon: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png` : 'https://papertrail.vercel.app/logo.png',
};

export const network = APP_CONFIG.network;

let userSessionInstance: any = null;

const getTransactions = () => require('@stacks/transactions');
const getAuth = () => require('@stacks/auth');

const getConnect = () => {
  if (typeof window === 'undefined') return null;
  return require('@stacks/connect');
};

/**
 * Converts Stacks address to legacy format
 * @param stxAddress - The Stacks address to convert
 * @returns Legacy user data format
 */
const toLegacyUserData = (stxAddress: string) => {
  if (!isValidStacksAddress(stxAddress)) {
    throw new Error('Invalid Stacks address format');
  }

  const normalizedAddress = stxAddress.toUpperCase();
  const isMainnetAddress = normalizedAddress.startsWith('SP') || normalizedAddress.startsWith('SM');
  
  return {
    profile: {
      stxAddress: {
        mainnet: isMainnetAddress ? normalizedAddress : '',
        testnet: isMainnetAddress ? '' : normalizedAddress,
      },
    },
  };
};

/**
 * Gets or creates user session instance
 * @returns UserSession instance
 */
export const getUserSession = () => {
  if (typeof window === 'undefined') return null;
  
  if (!userSessionInstance) {
    try {
      const { UserSession, AppConfig } = getAuth();
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      userSessionInstance = new UserSession({ appConfig });
    } catch (error) {
      logError('getUserSession', error);
      return null;
    }
  }
  
  return userSessionInstance;
};

/**
 * Authenticates user with wallet
 * @returns User's STX address or null
 */
export const authenticate = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  const { connect } = getConnect();
  if (!connect) {
    throw new Error('Wallet extension not detected');
  }

  try {
    const response = await connect({
      network: APP_CONFIG.isMainnet ? 'mainnet' : 'testnet',
    });

    const addresses: any[] = response?.addresses || [];
    
    const stxAddress =
      addresses.find((a: any) => a.symbol === 'STX')?.address ||
      addresses.find((a: any) => a.address?.startsWith('S'))?.address ||
      addresses[0]?.address;

    if (!stxAddress || !isValidStacksAddress(stxAddress)) {
      throw new Error('Invalid address returned from wallet');
    }

    localStorage.setItem('papertrail_user_address', stxAddress);
    return stxAddress;
  } catch (err: any) {
    logError('authenticate', err);
    throw new Error(err?.message || 'Wallet connection failed');
  }
};

/**
 * Gets stored user data
 * @returns User data or null
 */
export const getUserData = () => {
  if (typeof window === 'undefined') return null;

  const stxAddress = localStorage.getItem('papertrail_user_address');

  if (stxAddress && isValidStacksAddress(stxAddress)) {
    return toLegacyUserData(stxAddress);
  }

  return null;
};

/**
 * Fetches current block height from blockchain
 * @returns Current block height or 0
 */
export const getOnChainBlockHeight = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;

  try {
    const apiUrl = APP_CONFIG.isMainnet 
      ? 'https://api.mainnet.hiro.so/extended/v1/block?limit=1'
      : 'https://api.testnet.hiro.so/extended/v1/block?limit=1';

    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const bdata = await response.json();
    const height = Number(bdata.results?.[0]?.height || 0);
    return isNaN(height) ? 0 : height;
  } catch (error: any) {
    logError('getOnChainBlockHeight', error);
    return 0;
  }
};

/**
 * Calls a smart contract function
 * @param options - Contract call options
 */
export const callContract = async (options: any) => {
  if (typeof window === 'undefined') return;

  const { openContractCall } = getConnect();
  if (!openContractCall) {
    throw new Error('Contract call function not available');
  }

  const storedAddress = localStorage.getItem('papertrail_user_address');
  if (!storedAddress || !isValidStacksAddress(storedAddress)) {
    throw new Error('Wallet not connected or invalid address');
  }

  const session = getUserSession();

  let sessionAddress = null;
  if (session && session.isUserSignedIn()) {
    try {
      const userData = session.loadUserData();
      sessionAddress = userData.profile?.stxAddress?.[APP_CONFIG.isMainnet ? 'mainnet' : 'testnet'];
    } catch (e: any) {
      logWarn('stacks.getUserSession', 'SESSION ERROR', { error: e?.message });
    }
  }

  if (storedAddress && sessionAddress && storedAddress !== sessionAddress) {
    toast.error('Wallet account mismatch! Please re-login to Account ' + sessionAddress.substring(0, 8) + '...');
    logSecurityEvent('Wallet', 'Account mismatch during contract call', 'high', { storedAddress, sessionAddress });
    return;
  }

  logInfo('stacks.callContract', `contract call ${options.functionName}`);

  try {
    await openContractCall({
      postConditionMode: 0x01,
      stxAddress: storedAddress,
      fee: options.fee || APP_CONFIG.defaultFee,
      ...options,
      appDetails,
      network: APP_CONFIG.network,
      onFinish: (data: any) => {
        logInfo('stacks.callContract', 'TRANSACTION BROADCASTED', { txId: data.txId });
        if (!data.txId) {
          logError('callContract', new Error('No txId returned'));
          return;
        }
        getStore().dispatch(addTransaction({
          txId: data.txId,
          status: 'pending',
          type: options.functionName.replace(/-/g, ' ').toUpperCase(),
          timestamp: new Date().toISOString()
        }));

        toast.success('Transaction sent! Tracking status...', { id: data.txId });
        if (options.onFinish) options.onFinish(data);
        
        pollTransactionStatus(data.txId);
      },
      onCancel: () => {
        logWarn('stacks.callContract', 'TRANSACTION CANCELLED');
        toast.error('Transaction cancelled by user.');
      }
    });
  } catch (err: any) {
    logErrorLevel('stacks.callContract', 'CONTRACT CALL ERROR', undefined, err instanceof Error ? err : undefined);
    toast.error(getUserFriendlyMessage(err));
  }
};

/**
 * Polls transaction status until completion
 * @param txId - Transaction ID to poll
 */
async function pollTransactionStatus(txId: string) {
  if (!isValidStacksAddress(txId) && !/^[a-f0-9]{64}$/i.test(txId)) {
    logError('pollTransactionStatus', new Error('Invalid txId format'), { txId });
    return;
  }

  const apiBase = APP_CONFIG.isMainnet 
    ? 'https://api.mainnet.hiro.so' 
    : 'https://api.testnet.hiro.so';

  const maxAttempts = 120; // 20 minutes with 10s interval
  let attempts = 0;

  const check = async () => {
    attempts++;
    
    if (attempts > maxAttempts) {
      logWarn('pollTransactionStatus', 'Polling timed out, transaction still pending', { txId });
      return;
    }

    try {
      const response = await fetch(`${apiBase}/extended/v1/tx/${txId}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (attempts < maxAttempts) {
          setTimeout(check, 10000);
        }
        return;
      }

      const data = await response.json();

      if (data.tx_status === 'success') {
        getStore().dispatch(updateTransactionStatus({ txId, status: 'success' }));
        toast.success('Transaction confirmed!', { id: txId });
        return;
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        getStore().dispatch(updateTransactionStatus({ txId, status: 'failed' }));
        toast.error('Transaction failed', { id: txId });
        return;
      }

      setTimeout(check, 10000);
    } catch (error: any) {
      logError('pollTransactionStatus', error, { txId });
      if (attempts < maxAttempts) {
        setTimeout(check, 15000);
      }
    }
  };

  check();
}

/**
 * Signs in user with wallet signature
 * @param address - User's Stacks address
 * @returns Auth token if successful
 */
export const signInWithWallet = async (address: string): Promise<{ token: string } | null> => {
  if (typeof window === 'undefined') return null;

  if (!isValidStacksAddress(address)) {
    throw new Error('Invalid address format');
  }

  try {
    const connect = getConnect();
    const openSignatureRequest =
      connect.openSignatureRequest ||
      connect.openSignatureRequestPopup ||
      connect.default?.openSignatureRequest ||
      connect.default?.openSignatureRequestPopup;

    if (!openSignatureRequest) {
      logErrorLevel('stacks.signIn', 'SIGNATURE FUNCTION MISSING', { exports: Object.keys(connect) });
      toast.error('Wallet signature function not found. Please try a different browser or update your wallet extension.');
      throw new Error('Wallet signature function not found.');
    }

    logDebug('stacks.signIn', `fetching nonce for ${address}`);
    const response = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      logErrorLevel('stacks.signIn', 'NONCE FETCH FAILED', errData?.error ? { error: errData.error } : undefined);
      throw new Error(errData.error || 'Failed to fetch nonce');
    }

    const { nonce } = await response.json();
    logDebug('stacks.signIn', 'RECEIVED NONCE', { nonce: typeof nonce === 'string' ? '***' : nonce });

    return new Promise((resolve, reject) => {
      logDebug('stacks.signIn', 'OPENING SIGNATURE REQUEST');

      openSignatureRequest({
        message: `Sign in to PaperTrail\nNonce: ${nonce}`,
        network: APP_CONFIG.network,
        appDetails,
        onFinish: async (data: any) => {
          logDebug('stacks.signIn', 'SIGNATURE FINISHED');
          try {
            if (!data.signature || !data.publicKey) {
              throw new Error('Invalid signature data');
            }

            const verifyRes = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address,
                nonce,
                signature: data.signature,
                publicKey: data.publicKey
              }),
              signal: AbortSignal.timeout(10000),
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({}));
              logErrorLevel('stacks.signIn', 'VERIFY FAILED', verifyErr?.error ? { error: verifyErr.error } : undefined);
              throw new Error(verifyErr.error || 'Verification failed');
            }

            const authData = await verifyRes.json();
            logInfo('stacks.signIn', 'VERIFY SUCCESS');
            resolve(authData);
          } catch (e: any) {
            logErrorLevel('stacks.signIn', 'VERIFY CRASH', undefined, e instanceof Error ? e : undefined);
            reject(e);
          }
        },
        onCancel: () => {
          logInfo('stacks.signIn', 'SIGNATURE CANCELLED BY USER');
          resolve(null);
        },
      });
    });
  } catch (err: any) {
    logErrorLevel('stacks.signIn', 'CORE CRASH', undefined, err instanceof Error ? err : undefined);
    throw err;
  }
};

// PaperTrail contract functions will be added here
