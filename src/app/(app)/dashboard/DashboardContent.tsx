'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { fetchOnChainStats } from '@/lib/features/userSlice';
import { 
  Flame, 
  Star, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Zap,
  Activity,
  Target,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import StreakCard from '@/components/StreakCard';

export default function DashboardContent() {
  const dispatch = useDispatch();
  const { address, streak, points, gmBalance, isPro, healCount } = useSelector((state: RootState) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (address) {
      dispatch(fetchOnChainStats(address) as any);
    }
  }, [address, dispatch]);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-12 pb-32 reveal">
      
      {/* 1. Profile QuickStats & Greeting */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
         <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mb-2">
               <ShieldCheck className="h-3 w-3" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Protocol Operator</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
               System <span className="text-white/40">Dashboard.</span>
            </h1>
         </div>
         
         <div className="flex items-center gap-4">
            <button className="bg-white text-black font-black px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl">
               Say GM
               <Plus className="h-4 w-4" />
            </button>
         </div>
      </section>

      {/* 2. Gamified Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
         
         {/* Streak Card - Large */}
         <div className="md:col-span-8 md:row-span-1">
            <StreakCard />
         </div>

         {/* GM Balance Card */}
         <div className="md:col-span-4 glass-card p-10 flex flex-col justify-between group bg-yellow-500/[0.02] border-yellow-500/10">
            <div className="flex items-center justify-between">
               <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <Zap className="h-7 w-7 fill-yellow-500/20" />
               </div>
               <TrendingUp className="h-5 w-5 text-yellow-900" />
            </div>
            <div>
               <p className="text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-1">Liquid $GM Yield</p>
               <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                  {(gmBalance / 1000000).toLocaleString(undefined, { minimumFractionDigits: 1 })}
               </h3>
               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  +14% vs Previous Cycle
               </p>
            </div>
         </div>

         {/* Reputation Progress */}
         <div className="md:col-span-4 glass-card p-10 flex flex-col justify-between group bg-indigo-500/[0.02] border-indigo-500/10">
            <div className="flex items-center justify-between">
               <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Star className="h-7 w-7 fill-indigo-500/20" />
               </div>
               <Target className="h-5 w-5 text-indigo-900" />
            </div>
            <div>
               <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Reputation Score</p>
               <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums">
                  {(points / 10).toLocaleString()}
               </h3>
               <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }}></div>
               </div>
               <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mt-3">Next Tier: Grandmaster (800 RP Left)</p>
            </div>
         </div>

         {/* Protocol Health / Activity */}
         <div className="md:col-span-8 glass-card p-10 flex flex-col justify-between group overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
               <Activity className="h-48 w-48 text-white" />
            </div>
            <div className="relative z-10 flex items-center gap-10">
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Network Weight</p>
                  <p className="text-4xl font-black text-white tracking-tighter">0.84%</p>
               </div>
               <div className="h-12 w-px bg-white/5"></div>
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Heal Charges</p>
                  <p className="text-4xl font-black text-white tracking-tighter">{healCount}/3</p>
               </div>
               <div className="h-12 w-px bg-white/5"></div>
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Protocol Tier</p>
                  <p className={`text-4xl font-black tracking-tighter ${isPro ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {isPro ? 'PRO' : 'BASIS'}
                  </p>
               </div>
            </div>
            <div className="relative z-10 flex items-center justify-between">
               <p className="text-xs text-gray-500 font-medium max-w-sm">
                  Your node is currently active and settling social data on the Stacks blockchain. Maintain your streak to maximize yield.
               </p>
               <button className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] hover:text-white transition-colors">
                  Protocol Audit Log →
               </button>
            </div>
         </div>

      </section>

      {/* 3. Action Hub */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
         <div className="glass-card p-12 space-y-6 group hover:border-indigo-500/30 transition-all cursor-pointer bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Rewards <br/> Hub.</h3>
               <div className="h-16 w-16 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white text-gray-500 group-hover:text-black transition-all">
                  <ArrowUpRight className="h-6 w-6" />
               </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">Claim your daily $GM emissions and track your historical protocol distribution.</p>
         </div>

         <div className="glass-card p-12 space-y-6 group hover:border-purple-500/30 transition-all cursor-pointer bg-gradient-to-br from-purple-500/[0.02] to-transparent">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Governance <br/> Portal.</h3>
               <div className="h-16 w-16 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white text-gray-500 group-hover:text-black transition-all">
                  <ArrowUpRight className="h-6 w-6" />
               </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">Use your Reputation Points (RP) to vote on protocol updates and treasury allocations.</p>
         </div>
      </section>

    </div>
  );
}
