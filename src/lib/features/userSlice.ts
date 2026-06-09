/**
 * Redux User Slice
 * Manages user authentication state, profile data, and session parameters
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getUserSession, getOnChainBlockHeight } from '../stacks';
import { supabase } from '../supabase';
import { isValidStacksAddress } from '../utils/validation';
import { logErrorLevel as logError, logInfo } from '../utils/logger';
import type { RootState } from '../store';

interface UserState {
  address: string | null;
  profile: any | null;
  isConnected: boolean;
  isLoading: boolean;
  username: string | null;
  bio: string | null;
  currentBlockHeight: number;
  sessionToken: string | null;
  avatar: string | null;
  website: string | null;
}

/**
 * Safely retrieves and validates address from localStorage
 */
const getInitialAddress = () => {
  if (typeof window === 'undefined') return null;
  const address = localStorage.getItem('papertrail_user_address');
  return address && isValidStacksAddress(address) ? address : null;
};

/**
 * Safely retrieves username with length validation
 */
const getInitialUsername = (address: string | null) => {
  if (typeof window === 'undefined' || !address) return null;
  const username = localStorage.getItem(`username_${address}`);
  return username && username.length > 0 && username.length <= 32 ? username : null;
};

/**
 * Safely retrieves and validates session token JWT format
 */
const getInitialSessionToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('papertrail_session_token');
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    localStorage.removeItem('papertrail_session_token');
    return null;
  }
  
  return token;
};

const initialAddress = getInitialAddress();
const initialToken = getInitialSessionToken();

const initialState: UserState = {
  address: initialAddress,
  profile: null,
  isConnected: !!initialToken, 
  isLoading: !!initialToken,
  username: getInitialUsername(initialAddress),
  bio: null,
  currentBlockHeight: 0,
  sessionToken: initialToken,
  avatar: typeof window !== 'undefined' && initialAddress ? localStorage.getItem(`pt_avatar_${initialAddress}`) : null,
  website: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setBlockHeight(state, action: PayloadAction<number>) {
      state.currentBlockHeight = action.payload;
    },
    setUserData(state, action: PayloadAction<{ address: string; profile: any; isConnected?: boolean }>) {
      const stxAddressObj = action.payload.profile.stxAddress;
      const fallbackName = typeof stxAddressObj === 'string' 
        ? stxAddressObj 
        : (stxAddressObj?.mainnet || stxAddressObj?.testnet || action.payload.address);

      state.address = action.payload.address;
      state.profile = action.payload.profile;
      
      if (action.payload.isConnected !== undefined) {
        state.isConnected = action.payload.isConnected;
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('papertrail_user_address', action.payload.address);
      }
      
      if (!state.username || state.username.startsWith('ST')) {
        state.username = fallbackName;
      }
    },
    setAddress(state, action: PayloadAction<string>) {
      if (!isValidStacksAddress(action.payload)) {
        logError('userSlice', 'Invalid address format', { address: action.payload });
        return;
      }
      
      state.address = action.payload;
      state.isConnected = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('papertrail_user_address', action.payload);
      }
    },
    logout(state) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('papertrail_session_token');
        localStorage.removeItem('papertrail_user_address');
      }
      return {
        ...initialState,
        address: null,
        isConnected: false,
        isLoading: false,
        sessionToken: null
      };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    updateStats(state, action: PayloadAction<{ 
      username?: string | null;
      bio?: string | null;
      avatar?: string | null;
      website?: string | null;
    }>) {
      const addr = state.address;
      if (typeof window !== 'undefined' && action.payload && addr) {
        if (action.payload.avatar !== undefined && action.payload.avatar) localStorage.setItem(`pt_avatar_${addr}`, action.payload.avatar);
      }

      if (action.payload.bio !== undefined) state.bio = action.payload.bio;
      if (action.payload.avatar !== undefined) state.avatar = action.payload.avatar;
      if (action.payload.website !== undefined) state.website = action.payload.website;
      
      let incomingName = action.payload.username;

      if (incomingName && !incomingName.startsWith('ST')) {
        state.username = incomingName;
        if (typeof window !== 'undefined' && state.address) {
          localStorage.setItem(`username_${state.address}`, incomingName);
        }
      } 
      else if (state.username && !state.username.startsWith('ST')) {
        // Keep current username
      } 
      else if (typeof window !== 'undefined' && state.address) {
        const cached = localStorage.getItem(`username_${state.address}`);
        if (cached) {
          state.username = cached;
        } else {
          state.username = state.address;
        }
      }
    },
    setUsername(state, action: PayloadAction<string>) {
      const username = action.payload;
      if (!username || username.length < 3 || username.length > 32) {
        logError('userSlice', 'Invalid username length', { length: username.length });
        return;
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        logError('userSlice', 'Username contains invalid characters');
        return;
      }
      
      state.username = username;
      if (typeof window !== 'undefined' && state.address) {
        localStorage.setItem(`username_${state.address}`, username);
      }
    },
    setSessionToken(state, action: PayloadAction<string | null>) {
      if (typeof window !== 'undefined') {
        const token = action.payload;
        
        if (token && typeof token === 'string') {
          const parts = token.split('.');
          if (parts.length === 3 && parts.every(part => part.length > 0)) {
            state.sessionToken = token;
            state.isConnected = true;
            localStorage.setItem('papertrail_session_token', token);
            logInfo('userSlice', 'Session token set');
          } else {
            logError('userSlice', 'Invalid token format');
            state.sessionToken = null;
            state.isConnected = false;
            state.address = null;
            localStorage.removeItem('papertrail_session_token');
            localStorage.removeItem('papertrail_user_address');
          }
        } else {
          state.sessionToken = null;
          state.isConnected = false;
          localStorage.removeItem('papertrail_session_token');
        }
      }
    }
  },
});

export const fetchOnChainStats = (address: string) => async (dispatch: any) => {
  dispatch(userSlice.actions.setLoading(true));
  try {
    const height = await getOnChainBlockHeight();

    if (height > 0) {
      dispatch(userSlice.actions.setBlockHeight(height));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('bio, username, avatar_url, website')
      .eq('address', address)
      .maybeSingle();

    if (profile) {
      const p = profile as any;
      dispatch(userSlice.actions.updateStats({
        bio: p.bio || '',
        username: p.username || null,
        avatar: p.avatar_url || null,
        website: p.website || null,
      }));
    } else {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`username_${address}`);
        if (cached) {
          dispatch(userSlice.actions.updateStats({ username: cached }));
        }
      }
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    dispatch(userSlice.actions.setLoading(false));
  }
};

export const { 
  setUserData, 
  setAddress,
  logout, 
  updateStats, 
  setUsername, 
  setLoading, 
  setBlockHeight, 
  setSessionToken 
} = userSlice.actions;
export default userSlice.reducer;
