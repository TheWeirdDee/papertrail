'use client';

import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { authenticate } from '@/lib/stacks';
import { setAddress } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils/errors';

export const useWalletAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const login = async () => {
    try {
      const stxAddress = await authenticate();
      if (!stxAddress) return null;

      dispatch(setAddress(stxAddress));
      toast.success('Wallet connected!', { id: 'auth' });

      setTimeout(() => {
        if (window.location.pathname === '/') {
          router.push('/dashboard');
        } else {
          window.location.reload();
        }
      }, 400);

      return { address: stxAddress };
    } catch (err: any) {
      logError('useWalletAuth', err);
      toast.error(err.message || 'Wallet connection failed', { id: 'auth' });
      return null;
    }
  };

  return { login };
};
