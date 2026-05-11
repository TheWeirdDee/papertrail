import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { getUserSession, getUserOnChainData, getOnChainBlockHeight } from '../stacks';
import { supabase } from '../supabase';
import type { RootState } from '../store';

interface UserState {
  address: string | null;
  profile: any | null;
  isConnected: boolean;
  isLoading: boolean;
  gmBalance: number;
  username: string | null;
  bio: string | null;
  streak: number;
  points: number;
  lastGm: number;
  isPro: boolean;
  proExpiry: number;
  healCount: number;
  followers: number;
  following: number;
  totalTipped: number;
  totalReceived: number;
  currentBlockHeight: number;
  isSimulationMode: boolean;
  isOptimisticPro: boolean;
  sessionToken: string | null;
  avatar: string | null;
  website: string | null;
  isStreakBroken: boolean;
}

const getInitialOptimisticState = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gm_is_optimistic_pro') === 'true';
  }
  return false;
};

const getInitialAddress = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gm_user_address');
};

const getInitialUsername = (address: string | null) => {
  if (typeof window === 'undefined' || !address) return null;
  return localStorage.getItem(`username_${address}`);
};

const getInitialSessionToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('gm_session_token');
  if (token && token.split('.').length !== 3) {
    localStorage.removeItem('gm_session_token');
    return null;
  }
  return token;
};

const getInitialNum = (key: string, address: string | null) => {
  if (typeof window === 'undefined' || !address) return 0;
  return Number(localStorage.getItem(`${key}_${address}`) || 0);
};

const getInitialBool = (key: string, address: string | null) => {
  if (typeof window === 'undefined' || !address) return false;
  return localStorage.getItem(`${key}_${address}`) === 'true';
};

const initialAddress = getInitialAddress();
const initialToken = getInitialSessionToken();

const initialState: UserState = {
  address: initialAddress,
  profile: null,
  isConnected: !!initialToken, 
  isLoading: !!initialToken,
  gmBalance: getInitialNum('gm_token_balance', initialAddress),
  username: getInitialUsername(initialAddress),
  bio: null,
  streak: getInitialNum('gm_streak', initialAddress),
  points: getInitialNum('gm_points', initialAddress),
  lastGm: getInitialNum('gm_last_gm', initialAddress),
  isPro: getInitialBool('gm_is_pro', initialAddress),
  proExpiry: getInitialNum('gm_pro_expiry', initialAddress),
  healCount: getInitialNum('gm_heals', initialAddress),
  followers: getInitialNum('gm_followers', initialAddress),
  following: getInitialNum('gm_following', initialAddress),
  totalTipped: getInitialNum('gm_total_tipped', initialAddress),
  totalReceived: getInitialNum('gm_total_received', initialAddress),
  currentBlockHeight: 0,
  isSimulationMode: false,
  isOptimisticPro: getInitialOptimisticState(),
  sessionToken: initialToken,
  avatar: typeof window !== 'undefined' && initialAddress ? localStorage.getItem(`gm_avatar_${initialAddress}`) : null,
  website: null,
  isStreakBroken: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setBlockHeight(state, action: PayloadAction<number>) {
      state.currentBlockHeight = action.payload;
    },
    setUserData(state, action: PayloadAction<{ address: string; profile: any }>) {
      const stxAddressObj = action.payload.profile.stxAddress;
      const fallbackName = typeof stxAddressObj === 'string' 
        ? stxAddressObj 
        : (stxAddressObj?.mainnet || stxAddressObj?.testnet || action.payload.address);

      state.address = action.payload.address;
      state.profile = action.payload.profile;
      state.isConnected = true;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('gm_user_address', action.payload.address);
      }
      
      if (!state.username || state.username.startsWith('ST')) {
        state.username = fallbackName;
      }
    },
    setAddress(state, action: PayloadAction<string>) {
      state.address = action.payload;
      state.isConnected = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('gm_user_address', action.payload);
      }
    },
    logout(state) {

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
      streak?: number; 
      points?: number; 
      lastGm?: number;
      username?: string | null;
      bio?: string | null;
      avatar?: string | null;
      gmBalance?: number;
      isPro?: boolean;
      proExpiry?: number;
      followers?: number;
      following?: number;
      healCount?: number;
      totalTipped?: number;
      totalReceived?: number;
      website?: string | null;
      isStreakBroken?: boolean;
    }>) {
      if (typeof window !== 'undefined' && action.payload && state.address) {
        const addr = state.address;
        if (action.payload.streak !== undefined) localStorage.setItem(`gm_streak_${addr}`, action.payload.streak.toString());
        if (action.payload.points !== undefined) localStorage.setItem(`gm_points_${addr}`, action.payload.points.toString());
        if (action.payload.lastGm !== undefined) localStorage.setItem(`gm_last_gm_${addr}`, action.payload.lastGm.toString());
        if (action.payload.gmBalance !== undefined) localStorage.setItem(`gm_token_balance_${addr}`, action.payload.gmBalance.toString());
        if (action.payload.isPro !== undefined) localStorage.setItem(`gm_is_pro_${addr}`, action.payload.isPro.toString());
        if (action.payload.proExpiry !== undefined) localStorage.setItem(`gm_pro_expiry_${addr}`, action.payload.proExpiry.toString());
        if (action.payload.followers !== undefined) localStorage.setItem(`gm_followers_${addr}`, action.payload.followers.toString());
        if (action.payload.following !== undefined) localStorage.setItem(`gm_following_${addr}`, action.payload.following.toString());
        if (action.payload.healCount !== undefined) localStorage.setItem(`gm_heals_${addr}`, action.payload.healCount.toString());
        if (action.payload.avatar !== undefined && action.payload.avatar) localStorage.setItem(`gm_avatar_${addr}`, action.payload.avatar);
        if (action.payload.totalTipped !== undefined) localStorage.setItem(`gm_total_tipped_${addr}`, action.payload.totalTipped.toString());
        if (action.payload.totalReceived !== undefined) localStorage.setItem(`gm_total_received_${addr}`, action.payload.totalReceived.toString());
      }

      if (action.payload.isPro !== undefined) state.isPro = action.payload.isPro;
      if (action.payload.proExpiry !== undefined) state.proExpiry = action.payload.proExpiry;
      if (action.payload.followers !== undefined) state.followers = action.payload.followers;
      if (action.payload.following !== undefined) state.following = action.payload.following;
      if (action.payload.bio !== undefined) state.bio = action.payload.bio;
      if (action.payload.avatar !== undefined) state.avatar = action.payload.avatar;
      if (action.payload.website !== undefined) state.website = action.payload.website;
      if (action.payload.healCount !== undefined) state.healCount = action.payload.healCount;
      if (action.payload.gmBalance !== undefined) state.gmBalance = action.payload.gmBalance;
      if (action.payload.totalTipped !== undefined) state.totalTipped = action.payload.totalTipped;
      if (action.payload.totalReceived !== undefined) state.totalReceived = action.payload.totalReceived;
      if (action.payload.isStreakBroken !== undefined) state.isStreakBroken = action.payload.isStreakBroken;
      
      if (action.payload.streak !== undefined) {
        state.streak = action.payload.streak;
      }
      if (action.payload.points !== undefined) {
        state.points = action.payload.points; // Trust the incoming on-chain/API sync data
      }
      if (action.payload.lastGm !== undefined) {
        state.lastGm = action.payload.lastGm;
      }
      
      let incomingName = action.payload.username;
      

      if (incomingName && !incomingName.startsWith('ST')) {
        state.username = incomingName;
        if (typeof window !== 'undefined' && state.address) {
          localStorage.setItem(`username_${state.address}`, incomingName);
        }
      } 
      else if (state.username && !state.username.startsWith('ST')) {

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
      state.username = action.payload;
      if (typeof window !== 'undefined' && state.address) {
        localStorage.setItem(`username_${state.address}`, action.payload);
      }
    },
    setOptimisticPro(state, action: PayloadAction<boolean>) {
      state.isOptimisticPro = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('gm_is_optimistic_pro', action.payload.toString());
      }
    },
    setSessionToken(state, action: PayloadAction<string | null>) {
      if (typeof window !== 'undefined') {
        const token = action.payload;
        if (token && token.split('.').length === 3) {
          state.sessionToken = token;
          localStorage.setItem('gm_session_token', token);
        } else {
          state.sessionToken = null;
          localStorage.removeItem('gm_session_token');
        }
      }
    }
  },
});

export const fetchOnChainStats = (address: string) => async (dispatch: any, getState: any) => {
  dispatch(userSlice.actions.setLoading(true));
  try {
    const heightPromise = getOnChainBlockHeight();
    const dataPromise = getUserOnChainData(address);
    const { getGmTokenBalance } = require('../stacks');
    const gmBalancePromise = getGmTokenBalance(address);

    const [height, data, gmBalance] = await Promise.all([
      heightPromise,
      dataPromise,
      gmBalancePromise
    ]);

    if (height > 0) {
      dispatch(userSlice.actions.setBlockHeight(height));
    }
    const userState = (getState() as RootState).user;

    const lastGmBlock = data?.lastGm || 0;
    const blocksSinceLastGm = height > 0 && lastGmBlock > 0 ? (height - lastGmBlock) : 0;
    
    const GRACE_PERIOD_BLOCKS = 288;
    const isStreakBroken = blocksSinceLastGm > GRACE_PERIOD_BLOCKS;

    let finalStreak = data?.streak !== undefined ? data.streak : userState.streak;
    
    if (isStreakBroken) {
      console.log('--- HYBRID SYNC: Streak has decayed due to inactivity (missing > 48h) ---');
    }

    const today = new Date().toISOString().split('T')[0];
    const hasLocalGmToday = localStorage.getItem(`gm_date_${address}`) === today;
    
    const isChainLagging = hasLocalGmToday && (
      lastGmBlock === 0 || 
      (blocksSinceLastGm > 144) // Chain's last GM was from a previous cycle (> 24h ago)
    );

    let finalPoints = data?.points !== undefined ? data.points : userState.points;
    const finalIsPro = data?.isPro !== undefined ? data.isPro : userState.isPro;
    
    const isProUser = finalIsPro || userState.isOptimisticPro;
    const pointsPerGm = isProUser ? 10 : 5;

    if (isChainLagging) {
      console.log('--- HYBRID SYNC: Blockchain is lagging. Using optimistic increment ---');
      
      finalStreak = Math.max(finalStreak, (data?.streak || 0) + 1);
      finalPoints = Math.max(finalPoints, (data?.points || 0) + pointsPerGm);
    }
    
    
    console.log('--- SYNC COMPLETE: FINAL STREAK:', finalStreak, 'FINAL POINTS:', finalPoints, 'IS_PRO:', isProUser);


    dispatch(userSlice.actions.updateStats({
      streak: finalStreak,
      points: finalPoints,
      username: data?.username || userState.username,
      isPro: finalIsPro,
      proExpiry: data?.proExpiry || userState.proExpiry,
      followers: data?.followers || userState.followers,
      following: data?.following || userState.following,
      healCount: data?.healCount || userState.healCount,
      totalTipped: data?.totalTipped || userState.totalTipped,
      totalReceived: data?.totalReceived || userState.totalReceived,
      isStreakBroken: isStreakBroken,
      gmBalance: gmBalance !== undefined ? gmBalance : userState.gmBalance
    }));

    if (data) {
      console.log('--- FETCH SUCCESS: Chain data received ---', data);
    } else {
      console.warn('--- FETCH WARNING: No data returned from chain, using local sync ---');
    }

    const { data: profile, error: supabaseError } = await supabase
      .from('profiles')
      .select('bio, username, avatar_url')
      .eq('address', address)
      .maybeSingle();

    if (profile) {
      const p = profile as any;
      dispatch(userSlice.actions.updateStats({
        bio: p.bio || '',
        username: p.username || null,
        avatar: p.avatar_url || null,
        website: p.website || null
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
  setOptimisticPro,
  setSessionToken 
} = userSlice.actions;
export default userSlice.reducer;
