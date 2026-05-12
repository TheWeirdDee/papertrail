/**
 * THE STACKS BRIDGE
 * 
 * This file is designed to hide the Stacks SDK from the Next.js build-time prerenderer.
 * It uses dynamic logic to ensure no side-effecting code runs outside of the browser.
 */

import { APP_CONFIG } from './config';
import { toast } from 'react-hot-toast';
import { store } from './store';
import { addTransaction, updateTransactionStatus } from './features/txSlice';

export const appDetails = {
  name: 'GM DApp',
  icon: 'https://gm-dapp.vercel.app/logo.png',
};

export const network = APP_CONFIG.network;

let userSessionInstance: any = null;

const getTransactions = () => require('@stacks/transactions');
const getAuth = () => require('@stacks/auth');

const getConnect = () => {
  if (typeof window === 'undefined') return null;
  return require('@stacks/connect');
};

const toLegacyUserData = (stxAddress: string) => {
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

export const getUserSession = () => {
  if (typeof window === 'undefined') return null;
  if (!userSessionInstance) {
    const { UserSession, AppConfig } = getAuth();
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    userSessionInstance = new UserSession({ appConfig });
  }
  return userSessionInstance;
};


export const authenticate = async () => {
  if (typeof window === 'undefined') return;
  const { connect } = getConnect();
  try {
    const response = await connect({
      network: APP_CONFIG.isMainnet ? 'mainnet' : 'testnet',
    });
    const addresses: any[] = response?.addresses || [];
    const stxAddress =
      addresses.find((a: any) => a.symbol === 'STX')?.address ||
      addresses.find((a: any) => a.address?.startsWith('S'))?.address ||
      addresses[0]?.address;
    if (stxAddress) localStorage.setItem('gm_user_address', stxAddress);
    return stxAddress || null;
  } catch (err: any) {
    throw new Error(err?.message || 'Wallet connection failed');
  }
};


export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  const stxAddress = localStorage.getItem('gm_user_address');
  if (stxAddress) return toLegacyUserData(stxAddress);
  return null;
};


export const getGmTokenBalance = async (userAddress: string) => {
  if (typeof window === 'undefined') return 0;
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
      return Number(val.value);
    }
    return 0;
  } catch (error: any) {
    return 0;
  }
};


export const getUserOnChainData = async (userAddress: string) => {
  if (typeof window === 'undefined') return null;
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
      return typeof field === 'bigint' ? Number(field) : Number(field);
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
  } catch (error) {
    return null;
  }
};

export const getOnChainBlockHeight = async () => {
  if (typeof window === 'undefined') return 0;
  try {
    const response = await fetch(`${APP_CONFIG.isMainnet ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so'}/extended/v1/block?limit=1`);
    const bdata = await response.json();
    return Number(bdata.results?.[0]?.height || 0);
  } catch (e) {
    return 0;
  }
};


export const callContract = async (options: any) => {
  if (typeof window === 'undefined') return;
  const { openContractCall } = getConnect();
  

  const storedAddress = localStorage.getItem('gm_user_address');
  const session = getUserSession();
  
  let sessionAddress = null;
  if (session && session.isUserSignedIn()) {
    try {
      const userData = session.loadUserData();
      sessionAddress = userData.profile?.stxAddress?.[APP_CONFIG.isMainnet ? 'mainnet' : 'testnet'];
    } catch (e) {
      console.warn('--- SESSION ERROR ---', e);
    }
  }

  if (storedAddress && sessionAddress && storedAddress !== sessionAddress) {
    toast.error('Wallet account mismatch! Please re-login to Account ' + sessionAddress.substring(0, 8) + '...');
    return;
  }

  console.log('--- CONTRACT CALL ---', options.functionName);
  
  try {
    await openContractCall({
      postConditionMode: 0x01,
      stxAddress: storedAddress || undefined,
      fee: options.fee || APP_CONFIG.defaultFee,
      ...options,
      appDetails,
      network: APP_CONFIG.network,
      onFinish: (data: any) => {
        console.log('--- TRANSACTION BROADCASTED ---', data.txId);
        
        // Track in Redux
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
        console.log('--- TRANSACTION CANCELLED ---');
        toast.error('Transaction cancelled by user.');
      }
    });
  } catch (err: any) {
    console.error('--- CONTRACT CALL ERROR ---', err);
    toast.error('Failed to open wallet: ' + (err.message || 'Unknown error'));
  }
};


async function pollTransactionStatus(txId: string) {
  const apiBase = APP_CONFIG.isMainnet ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';
  const check = async () => {
    try {
      const response = await fetch(`${apiBase}/extended/v1/tx/${txId}`);
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.tx_status === 'success') {
        store.dispatch(updateTransactionStatus({ txId, status: 'success' }));
        toast.success('Transaction confirmed!', { id: txId });
        return;
      }
      
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        store.dispatch(updateTransactionStatus({ txId, status: 'failed' }));
        const reason = data.tx_result?.repr || '';
        let msg = 'Transaction failed.';
        if (reason.includes('u101')) msg = 'Cooldown active (24h).';
        if (data.tx_status === 'abort_by_post_condition') msg = 'Post-condition mismatch.';
        if (reason.includes('u401')) msg = 'Not authorized (Governor check failed).';
        toast.error(msg, { id: txId });
        return;
      }
      setTimeout(check, 10000);
    } catch (e) {
      setTimeout(check, 10000);
    }
  };
  check();
}


export const tipAuthor = async (recipient: string, amountStx: number, senderAddress: string | null) => {
  if (typeof window === 'undefined') return;
  const { Cl, Pc } = getTransactions();
  const amountMicroStx = Math.round(amountStx * 1000000);
  const finalSender = senderAddress || localStorage.getItem('gm_user_address');
  if (!finalSender) throw new Error("Wallet not connected");
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
      console.log('--- TIP BROADCASTED ---', data.txId);
    }
  });
};


export const signInWithWallet = async (address: string): Promise<{ token: string } | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const connect = getConnect();
    const openSignatureRequest = 
      connect.openSignatureRequest || 
      connect.openSignatureRequestPopup ||
      connect.default?.openSignatureRequest || 
      connect.default?.openSignatureRequestPopup ||
      (typeof window !== 'undefined' ? (window as any).StacksProvider?.openSignatureRequest : null);
    
    if (!openSignatureRequest) {
      console.error('--- DEBUG: @stacks/connect exports ---', Object.keys(connect));
      toast.error('Wallet signature function not found. Please try a different browser or update your wallet extension.');
      throw new Error('Wallet signature function not found.');
    }

    const response = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const { nonce } = await response.json();
    return new Promise((resolve, reject) => {
      openSignatureRequest({
        message: `Sign in to GM DApp\nNonce: ${nonce}`,
        network: APP_CONFIG.network,
        appDetails,
        onFinish: async (data: any) => {
          try {
            const verifyRes = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address,
                nonce,
                signature: data.signature,
                publicKey: data.publicKey
              })
            });
            const { token } = await verifyRes.json();
            resolve({ token });
          } catch (err) {
            reject(err);
          }
        },
        onCancel: () => reject(new Error('Signature cancelled')),
      });
    });
  } catch (err) {
    throw err;
  }
};


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
