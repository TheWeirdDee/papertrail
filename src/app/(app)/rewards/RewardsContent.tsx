'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  Zap, 
  TrendingUp, 
  History, 
  ArrowUpRight, 
  Crown, 
  CircleDollarSign,
  PieChart,
  Target,
  Gift,
  Clock,
  ArrowRight
} from 'lucide-react';
import { fetchOnChainStats } from '@/lib/features/userSlice';

export default function RewardsContent() {
  const dispatch = useDispatch();
  const { address, gmBalance, isPro, points, totalTipped, totalReceived } = useSelector((state: RootState) => state.user);
  const [activeTab, setActiveTab] = useState<'emissions' | 'history' | 'analytics'>('emissions');

  useEffect(() => {
    if (address) {
      dispatch(fetchOnChainStats(address) as any);
    }
  }, [address, dispatch]);

  const stats = [
    { name: 'Lifetime Yield', value: '14,242 $GM', icon: CircleDollarSign, color: 'text-yellow-500' },
    { name: 'Protocol Support', value: `${(totalTipped / 1000000).toFixed(2)} STX`, icon: Gift, color: 'text-indigo-500' },
    { name: 'Community Tipped', value: `${(totalReceived / 1000000).toFixed(2)} STX`, icon: Zap, color: 'text-orange-500' },
    { name: 'Yield Multiplier', value: isPro ? '3.5x' : '1.0x', icon: TrendingUp, color: 'text-green-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-12 pb-32 reveal">
      
      {/* 1. Header / Hero */}
      <section className="relative glass-card overflow-hidden p-12 md:p-20 group">
         <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-6 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 mb-2">
                  <Crown className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protocol Yield Layer</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
                  Rewards <br/> <span className="text-white/40">Hub.</span>
               </h1>
               <p className="text-gray-500 font-medium max-w-md leading-relaxed">
                  The central node for your social capital. Claim emissions, track community tips, and manage your $GM yield multipliers.
               </p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center min-w-[320px]">
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Claimable Protocol Yield</p>
               <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-7xl font-black text-white tracking-tighter tabular-nums">422.5</span>
                  <span className="text-xl font-black text-yellow-500 uppercase italic">$GM</span>
               </div>
               <button className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-gray-100 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3">
                  Claim Yield
                  <Zap className="h-4 w-4 fill-black" />
               </button>
            </div>
         </div>
      </section>

      {/* 2. Key Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="glass-card p-8 space-y-4 hover:border-white/10 transition-all group">
              <div className={`h-12 w-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                 <s.icon className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{s.name}</p>
                 <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
              </div>
           </div>
         ))}
      </section>

      {/* 3. Detailed Analysis Area */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Navigation */}
         <div className="lg:col-span-3 flex flex-col gap-2">
            {[
              { id: 'emissions', name: 'Yield Emissions', icon: PieChart },
              { id: 'history', name: 'Transaction History', icon: History },
              { id: 'analytics', name: 'Growth Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-2xl' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="uppercase tracking-widest text-[10px]">{tab.name}</span>
              </button>
            ))}
         </div>

         {/* Content Pane */}
         <div className="lg:col-span-9 glass-card p-10 bg-white/[0.01]">
            {activeTab === 'emissions' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-xl font-black text-white tracking-tight">Active Emission Schedule</h3>
                       <p className="text-xs text-gray-500 font-medium">Your node receives $GM based on streak length and RP.</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                       <TrendingUp className="h-3 w-3" />
                       Optimized
                    </div>
                 </div>

                 <div className="space-y-6">
                    {[
                      { name: 'Daily Base Emission', value: '10 $GM', sub: 'Standard Social Yield', progress: 100 },
                      { name: 'Streak Multiplier (x3.5)', value: '+25 $GM', sub: 'Calculated from 12d streak', progress: 85 },
                      { name: 'Governance Bonus', value: '+5 $GM', sub: 'Active voter incentive', progress: 40 }
                    ].map((item, i) => (
                      <div key={i} className="space-y-3">
                         <div className="flex items-end justify-between">
                            <div>
                               <p className="text-sm font-black text-white tracking-tight">{item.name}</p>
                               <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{item.sub}</p>
                            </div>
                            <p className="text-sm font-black text-white">{item.value}</p>
                         </div>
                         <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${item.progress}%` }}></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="py-20 flex flex-col items-center justify-center space-y-6 opacity-30 animate-in fade-in duration-500">
                 <History className="h-12 w-12 text-gray-500" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">No recent yield events</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                       <Target className="h-6 w-6 text-indigo-500" />
                       <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Projection (30D)</p>
                       <p className="text-3xl font-black text-white tracking-tighter">+1,200 $GM</p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 space-y-4">
                       <Clock className="h-6 w-6 text-purple-500" />
                       <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest">Next Halving</p>
                       <p className="text-3xl font-black text-white tracking-tighter">142 Days</p>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </section>

      {/* 4. Pro Tier Upsell */}
      {!isPro && (
        <section className="glass-card p-12 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="space-y-4 text-center md:text-left">
              <h3 className="text-3xl font-black text-white tracking-tighter">Unlock Pro Protocol Yield.</h3>
              <p className="text-gray-400 font-medium max-w-lg">
                 Upgrade to Pro to double your $GM emissions, unlock governance power, and get exclusive profile identities.
              </p>
           </div>
           <button className="bg-white text-black font-black px-12 py-5 rounded-2xl flex items-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl shrink-0">
              Go Pro for 10 STX
              <ArrowRight className="h-4 w-4" />
           </button>
        </section>
      )}

    </div>
  );
}

import { BarChart3 } from 'lucide-react';
