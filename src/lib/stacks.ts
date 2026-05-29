/**
 * Stacks Blockchain Integration Layer
 * Handles wallet authentication, contract calls, and on-chain data fetching
 * with improved error handling and security validation
 */

import { APP_CONFIG } from './config';
import { toast } from 'react-hot-toast';
import { store } from './store';
import { addTransaction, updateTransactionStatus } from './features/txSlice';

import { logDebug, logInfo, logWarn, logErrorLevel, logSecurityEvent } from './utils/logger';
import { isValidStacksAddress } from './utils/validation';
import { getEnvironmentConfig } from './utils/env';
import { logError, getUserFriendlyMessage } from './utils/errors';


export const appDetails = {
  name: 'GM DApp',
  icon: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png` : 'https://gm-dapp.vercel.app/logo.png',
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

    localStorage.setItem('gm_user_address', stxAddress);
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

  const stxAddress = localStorage.getItem('gm_user_address');
  
  if (stxAddress && isValidStacksAddress(stxAddress)) {
    return toLegacyUserData(stxAddress);
  }

  return null;
};

/**
 * Fetches GM token balance for user
 * @param userAddress - User's Stacks address
 * @returns Token balance or 0
 */
export const getGmTokenBalance = async (userAddress: string): Promise<number> => {
  if (typeof window === 'undefined') return 0;

  if (!isValidStacksAddress(userAddress)) {
    logError('getGmTokenBalance', new Error('Invalid address'), { userAddress });
    return 0;
  }

  try {
    const { fetchCallReadOnlyFunction, cvToValue, Cl } = getTransactions();
    const result = await fetchCallReadOnlyFunction({
      network: APP_CONFIG.network,
      contractAddress: APP_CONFIG.token.address,
      contractName: APP_CONFIG.token.name,
      functionName: 'get-balance',
      functionArgs: [Cl.principal(userAddress)],
      senderAddress: userAddress,
    });

    const val = cvToValue(result);
    
    if (val && typeof val === 'object' && (val.type === 20 || val.type === 'response-ok')) {
      const balance = Number(val.value);
      return isNaN(balance) ? 0 : Math.max(0, balance);
    }

    return 0;
  } catch (error: any) {
    logError('getGmTokenBalance', error, { userAddress });
    return 0;
  }
};

/**
 * Fetches on-chain user data from social contract
 * @param userAddress - User's Stacks address
 * @returns User on-chain data or null
 */
export const getUserOnChainData = async (userAddress: string) => {
  if (typeof window === 'undefined') return null;

  if (!isValidStacksAddress(userAddress)) {
    logError('getUserOnChainData', new Error('Invalid address'), { userAddress });
    return null;
  }

  try {
    const { fetchCallReadOnlyFunction, cvToValue, Cl } = getTransactions();
    const result = await fetchCallReadOnlyFunction({
      network: APP_CONFIG.network,
      contractAddress: APP_CONFIG.social.address,
      contractName: APP_CONFIG.social.name,
      functionName: 'get-user-data',
      functionArgs: [Cl.principal(userAddress)],
      senderAddress: userAddress,
    });

    const val = cvToValue(result);
    let unwrapped = val;
    
    if (val && typeof val === 'object' && (val.type === 20 || val.type === 'response-ok')) {
      unwrapped = val.value;
    }

    const getNum = (field: any) => {
      if (field === undefined || field === null) return 0;
      if (typeof field === 'object' && 'value' in field) field = field.value;
      const num = typeof field === 'bigint' ? Number(field) : Number(field);
      return isNaN(num) ? 0 : num;
    };

    const extractOptional = (optVal: any): string | null => {
      if (!optVal || optVal.type === 9) return null;
      if (optVal.value) return extractOptional(optVal.value);
      return typeof optVal === 'string' ? optVal : null;
    };

    return {
      lastGm: getNum(unwrapped['last-gm'] || unwrapped.lastGm),
      points: getNum(unwrapped.points),
      streak: getNum(unwrapped.streak),
      username: extractOptional(unwrapped.username),
      isPro: (unwrapped['is-pro'] || unwrapped.isPro) === true,
      proExpiry: getNum(unwrapped['pro-expiry'] || unwrapped.proExpiry),
      healCount: getNum(unwrapped['heal-count'] || unwrapped.healCount),
      totalTipped: getNum(unwrapped['total-tipped'] || unwrapped.totalTipped),
      totalReceived: getNum(unwrapped['total-received'] || unwrapped.totalReceived),
      followers: getNum(unwrapped.followers),
      following: getNum(unwrapped.following),
    };
  } catch (error: any) {
    logError('getUserOnChainData', error, { userAddress });
    return null;
  }
};

/**
 * Fetches current block height from blockchain
 * @returns Current block height or 0
 */
export const getOnChainBlockHeight = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;

  try {
    const config = getEnvironmentConfig();
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

  const storedAddress = localStorage.getItem('gm_user_address');
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
    } catch (error) {
      logError('callContract - session load', error);
    }
  }

  if (storedAddress && sessionAddress && storedAddress !== sessionAddress) {
    toast.error('Wallet account mismatch! Please re-login to Account ' + sessionAddress.substring(0, 8) + '...');
    logSecurityEvent('Wallet', 'Account mismatch during contract call', 'high', { storedAddress, sessionAddress });
    return;
  }

  logInfo('stacks.callContract', `contract call ${options.functionName}`);

    toast.error('Wallet mismatch! Please re-login.');
    return;
  }
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
        store.dispatch(addTransaction({
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
    toast.error('Failed to open wallet: ' + (err?.message || 'Unknown error'));
    logError('callContract', err);
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
      store.dispatch(updateTransactionStatus({ txId, status: 'pending' }));
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
        store.dispatch(updateTransactionStatus({ txId, status: 'success' }));
        toast.success('Transaction confirmed!', { id: txId });
        return;
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        store.dispatch(updateTransactionStatus({ txId, status: 'failed' }));
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
 * Tips an author with STX
 * @param recipient - Recipient address
 * @param amountStx - Amount in STX
 * @param senderAddress - Sender address
 */
export const tipAuthor = async (
  recipient: string,
  amountStx: number,
  senderAddress: string | null
) => {
  if (typeof window === 'undefined') return;

  if (!isValidStacksAddress(recipient)) {
    throw new Error('Invalid recipient address');
  }

  if (amountStx <= 0 || amountStx > 1000000) {
    throw new Error('Invalid amount');
  }

  const { Cl, Pc } = getTransactions();
  const amountMicroStx = Math.round(amountStx * 1000000);
  const finalSender = senderAddress || localStorage.getItem('gm_user_address');

  if (!finalSender || !isValidStacksAddress(finalSender)) {
    throw new Error('Wallet not connected');
  }

  const postCondition = Pc.principal(finalSender).willSendLte(amountMicroStx).ustx();

  await callContract({
    contractAddress: APP_CONFIG.social.address,
    contractName: APP_CONFIG.social.name,
    functionName: 'tip-author',
    functionArgs: [Cl.principal(recipient), Cl.uint(amountMicroStx)],
    stxAddress: finalSender,
    postConditionMode: 0x01,
    postConditions: [postCondition],
    onFinish: (data: any) => {
      logInfo('stacks.tipAuthor', 'TIP BROADCASTED', { txId: data.txId });
    }
  });
};

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
      throw new Error('Wallet signature not available');
    }
    const response = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      logErrorLevel('stacks.signIn', 'NONCE FETCH FAILED', errData?.error ? { error: errData.error } : undefined);
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to fetch nonce');
    }

    const { nonce } = await response.json();
    logDebug('stacks.signIn', 'RECEIVED NONCE', { nonce: typeof nonce === 'string' ? '***' : nonce });

    return new Promise((resolve, reject) => {
      logDebug('stacks.signIn', 'OPENING SIGNATURE REQUEST');

    return new Promise((resolve, reject) => {
      openSignatureRequest({
        message: `Sign in to GM DApp\nNonce: ${nonce}`,
        network: APP_CONFIG.network,
        appDetails,
          onFinish: async (data: any) => {
          logDebug('stacks.signIn', 'SIGNATURE FINISHED');
        onFinish: async (data: any) => {
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

              const verifyErr = await verifyRes.json();

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
            resolve(authData);
          } catch (error: any) {
            logError('signInWithWallet - verify', error);
            reject(error);
          }
        },
        onCancel: () => {
          resolve(null);
        },
      });
    });
  } catch (err: any) {
    logErrorLevel('stacks.signIn', 'CORE CRASH', undefined, err instanceof Error ? err : undefined);
    logError('signInWithWallet', err, { address });
    throw err;
  }
};

/**
 * Initializes protocol (sets token governor and links contracts)
 */
export const initializeProtocol = async () => {
  const { Cl } = getTransactions();

  toast.loading('Step 1/2: Setting Token Governor...', { id: 'init-protocol' });

  await callContract({
    contractAddress: APP_CONFIG.token.address,
    contractName: APP_CONFIG.token.name,
    functionName: 'set-governor',
    functionArgs: [Cl.principal(`${APP_CONFIG.social.address}.${APP_CONFIG.social.name}`)],
    onFinish: () => {
      toast.loading('Step 2/2: Linking Token to Social Contract...', { id: 'init-protocol' });
      
      setTimeout(async () => {
        await callContract({
          contractAddress: APP_CONFIG.social.address,
          contractName: APP_CONFIG.social.name,
          functionName: 'set-token-contract',
          functionArgs: [Cl.principal(`${APP_CONFIG.token.address}.${APP_CONFIG.token.name}`)],
          onFinish: () => {
            toast.success('Protocol Initialized Successfully!', { id: 'init-protocol' });
          }
        });
      }, 5000);
    }
  });
};
