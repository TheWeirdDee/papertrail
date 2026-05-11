'use client';

import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '../lib/store';
import { useState, useEffect } from 'react';
import { getUserSession } from '../lib/stacks';
import { setUserData, setUsername, fetchOnChainStats, updateStats, setSessionToken } from '../lib/features/userSlice';

function AuthHydrator({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode, 
  initialUser: { address: string; username: string | null; avatar: string | null } | null 
}) {
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);

  if (!mounted && initialUser) {
    dispatch(setUserData({
      address: initialUser.address,
      profile: { stxAddress: initialUser.address } // Minimal profile to bridge hydration
    }));
    
    dispatch(updateStats({
      username: initialUser.username,
      avatar: initialUser.avatar
    }));
  }

  useEffect(() => {
    setMounted(true);
    
    const storedAddress = localStorage.getItem('gm_user_address');
    const storedToken = localStorage.getItem('gm_session_token');
    const effectiveAddress = initialUser?.address || storedAddress;
    
    if (effectiveAddress) {
      console.log('--- HYDRATOR: Recovering session for', effectiveAddress);
      
      if (storedToken) {
        dispatch(setSessionToken(storedToken));
      }

      if (!initialUser) {
        try {
          const session = getUserSession();
          if (session?.isUserSignedIn()) {
            const userData = session.loadUserData();
            dispatch(setUserData({
              address: effectiveAddress,
              profile: userData.profile
            }));
          } else {
            dispatch(setUserData({
              address: effectiveAddress,
              profile: { stxAddress: effectiveAddress }
            }));
          }
        } catch (e) {
          console.warn('--- HYDRATOR: Stacks session corrupted. Clearing cache. ---', e);
          localStorage.removeItem('blockstack-session'); // The exact key used by @stacks/auth
          localStorage.removeItem('gm_user_address');
          localStorage.removeItem('gm_session_token');
          window.location.reload(); 
        }
      }
      
      dispatch(fetchOnChainStats(effectiveAddress) as any);
    } else {
      console.log('--- HYDRATOR: No active session found ---');
    }
  }, [dispatch, initialUser]);

  return <>{children}</>;
}

export function Providers({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode, 
  initialUser: { address: string; username: string | null; avatar: string | null } | null 
}) {
  return (
    <Provider store={store}>
      <AuthHydrator initialUser={initialUser}>
        {children}
      </AuthHydrator>
    </Provider>
  );
}
