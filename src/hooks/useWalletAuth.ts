'use client';

import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { authenticate, signInWithWallet } from '@/lib/stacks';
import { setAddress, setSessionToken } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';
import { logError, getUserFriendlyMessage } from '@/lib/utils/errors';

/**
 * Custom hook for wallet authentication
 * Handles login flow with wallet connection and signature verification
 */
export const useWalletAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const login = async () => {
    try {
      const stxAddress = await authenticate();
      
      if (!stxAddress) {
        return null;
      }

      dispatch(setAddress(stxAddress));

      toast.loading('Verifying identity...', { id: 'auth' });

      try {
        const authData = await signInWithWallet(stxAddress);

        if (!authData) {
          dispatch(setSessionToken(null));
          toast.dismiss('auth');
          return null;
        }

        if (authData.token) {
          dispatch(setSessionToken(authData.token));
          toast.success('Authentication successful', { id: 'auth' });

          setTimeout(() => {
            if (window.location.pathname === '/') {
              router.push('/dashboard');
            } else {
              window.location.reload();
            }
          }, 800);

          return { address: stxAddress, token: authData.token };
        }
      } catch (signErr: any) {
        logError('useWalletAuth - signin phase', signErr);
        dispatch(setSessionToken(null));
        toast.error(getUserFriendlyMessage(signErr), { id: 'auth' });
        return null;
      }

      return null;
    } catch (err: any) {
      logError('useWalletAuth - auth phase', err);
      dispatch(setSessionToken(null));
      toast.error(err.message || 'Authentication failed', { id: 'auth' });
      return null;
    }
  };

  return { login };
};
