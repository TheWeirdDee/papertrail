'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Flame, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { callContract } from '@/lib/stacks';
import { APP_CONFIG } from '@/lib/config';
import { AnchorMode, PostConditionMode } from '@stacks/transactions';
import { fetchOnChainStats } from '@/lib/features/userSlice';

export default function HealStreakButton() {
  const [state, setState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { address, isPro, isOptimisticPro, healCount } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const activePro = isPro || isOptimisticPro;

  const handleHeal = async () => {
    if (!address || state !== 'idle' || !activePro) return;

    setState('pending');
    setError(null);

    try {
      await callContract({
        anchorMode: AnchorMode.Any,
        contractAddress: APP_CONFIG.social.address,
        contractName: APP_CONFIG.social.name,
        functionName: 'heal-streak',
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data: any) => {
          console.log('Streak healed!', data.txId);
          setState('success');
          setTimeout(() => {
            dispatch(fetchOnChainStats(address) as any);
            setState('idle');
          }, 5000);
        },
        onCancel: () => {
          setState('idle');
        },
      });
    } catch (err: any) {
      console.error('Heal error:', err);
      setError(err.message || 'Heal failed');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  if (!activePro) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={handleHeal}
        disabled={state !== 'idle'}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
          state === 'idle' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20' :
          state === 'pending' ? 'bg-white/5 border-white/10 text-gray-500 animate-pulse' :
          state === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
          'bg-red-500/10 border-red-500/20 text-red-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${state === 'idle' ? 'bg-orange-500/20' : 'bg-white/5'}`}>
            {state === 'idle' && <Flame className="h-5 w-5" />}
            {state === 'pending' && <Loader2 className="h-5 w-5 animate-spin" />}
            {state === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {state === 'error' && <AlertCircle className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Heal Broken Streak</p>
            <p className="text-[10px] opacity-60 font-medium">Use 1 of 2 monthly restoration charges</p>
          </div>
        </div>
        <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
          {2 - (healCount || 0)} Left
        </div>
      </button>
      
      {error && (
        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest px-2">{error}</p>
      )}
    </div>
  );
}
