'use client';

import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { authenticate, signInWithWallet } from '@/lib/stacks';
import { setAddress, setSessionToken } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';

export const useWalletAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const login = async () => {
    try {
      console.log('--- UNIFIED LOGIN INITIATED ---');
      
      const stxAddress = await authenticate();
      if (!stxAddress) {
        console.warn('--- LOGIN CANCELED: NO ADDRESS RETURNED ---');
        return null;
      }
      
      console.log('--- PHASE 1 SUCCESS: ADDRESS ---', stxAddress);
      
      dispatch(setAddress(stxAddress));
      
      console.log('--- STARTING PHASE 2: SIGNATURE ---');
      toast.loading('Phase 2: Verifying identity...', { id: 'auth' });
      
      try {
        const authData = await signInWithWallet(stxAddress);
        
        if (!authData) {
          console.warn('--- PHASE 2 ABORTED: NO AUTH DATA ---');
          toast.dismiss('auth');
          return null;
        }
        
        if (authData.token) {
          console.log('--- PHASE 2 SUCCESS: JWT RECEIVED ---');
          dispatch(setSessionToken(authData.token));
          toast.success("Security Verification Successful", { id: 'auth' });
          
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
        console.error('--- PHASE 2 ERROR ---', signErr);
        toast.error('Identity verification failed: ' + signErr.message, { id: 'auth' });
        return null;
      }
      
      return null;
    } catch (err: any) {
      console.error('--- UNIFIED AUTH CRASH ---', err);
      toast.error(err.message || 'Login failed', { id: 'auth' });
      return null;
    }
  };

  return { login };
};
