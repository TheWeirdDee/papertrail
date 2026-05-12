'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { fetchOnChainStats } from '@/lib/features/userSlice';
import { 
  Shield, 
  Vote, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  Circle,
  Activity,
  Flame,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function GovernanceHub() {
  const dispatch = useDispatch();
  const { address, streak, points, gmBalance } = useSelector((state: RootState) => state.user);
  const [activeProposals, setActiveProposals] = useState<any[]>([]);
  
  // Custom logic: Voting power = Points + (Streak * 10) + (Balance / 1000)
  const votingPower = Math.floor((points / 10) + (streak * 10) + (gmBalance / 1000000000));

  useEffect(() => {
    if (address) {
      dispatch(fetchOnChainStats(address) as any);
    }
  }, [address, dispatch]);

  const proposals = [
    {
      id: 'GIP-012',
      title: 'Increase Daily $GM Emission Multiplier',
      desc: 'Proposal to increase the base streak multiplier from 2.5x to 3.5x for users with 100+ day streaks.',
      status: 'Active',
      votesFor: '2.4M VP',
      votesAgainst: '1.1M VP',
      expires: '42h 12m',
      category: 'Protocol Economics'
    },
    {
      id: 'GIP-013',
      title: 'Initialize Treasury Burn for v6 Migration',
      desc: 'Strategic burn of 15% of the unallocated treasury to stabilize long-term protocol scarcity.',
      status: 'Draft',
      votesFor: '1.2M VP',
      votesAgainst: '42K VP',
      expires: 'Ends in 5 days',
      category: 'Treasury'
    }
  ];

  const handleVote = (id: string, type: 'for' | 'against') => {
    toast.success(`Vote cast ${type} ${id} with ${votingPower} VP`, {
      icon: <Vote className="h-4 w-4 text-indigo-500" />,
      style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(99,102,241,0.2)' }
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-16 pb-32 reveal">
      
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-10">
         <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 mb-2">
               <Shield className="h-3 w-3" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">DAO Governance Layer</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
               Sovereign <br/> <span className="text-white/40">Consensus.</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl">
               Shape the future of the GM Protocol. Your voting power is calculated based on your historical consistency and reputation score.
            </p>
         </div>
         
         <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] text-center min-w-[340px] group">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Your Voting Power (VP)</p>
            <div className="flex items-baseline gap-3 mb-4">
               <span className="text-7xl font-black text-white tracking-tighter tabular-nums">{votingPower.toLocaleString()}</span>
               <span className="text-xl font-black text-indigo-500 uppercase italic">VP</span>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-gray-700 uppercase tracking-widest">
               <div className="flex items-center gap-1"><Star className="h-2.5 w-2.5" /> Rep</div>
               <div className="flex items-center gap-1"><Flame className="h-2.5 w-2.5" /> Streak</div>
               <div className="flex items-center gap-1"><Activity className="h-2.5 w-2.5" /> $GM</div>
            </div>
         </div>
      </section>

      {/* 2. Proposal Matrix */}
      <section className="space-y-10">
         <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Active Referendums</h2>
            <button className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-[0.3em]">View Archive →</button>
         </div>

         <div className="grid grid-cols-1 gap-8">
            {proposals.map((prop) => (
              <div key={prop.id} className="glass-card p-10 flex flex-col xl:flex-row xl:items-center gap-12 group hover:border-white/10 transition-all">
                 <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{prop.id}</span>
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{prop.category}</span>
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{prop.title}</h3>
                       <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-2xl">{prop.desc}</p>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                          <Clock className="h-3 w-3" />
                          {prop.expires}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                          <Users className="h-3 w-3" />
                          124 Nodes Voted
                       </div>
                    </div>
                 </div>

                 <div className="w-full xl:w-[400px] space-y-6 shrink-0">
                    <div className="space-y-3">
                       <div className="flex items-end justify-between">
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">FOR</p>
                          <p className="text-sm font-black text-white tracking-tight">{prop.votesFor}</p>
                       </div>
                       <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-end justify-between">
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">AGAINST</p>
                          <p className="text-sm font-black text-white tracking-tight">{prop.votesAgainst}</p>
                       </div>
                       <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '25%' }}></div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <button 
                        onClick={() => handleVote(prop.id, 'for')}
                        className="py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30 transition-all active:scale-95"
                       >
                          Vote For
                       </button>
                       <button 
                        onClick={() => handleVote(prop.id, 'against')}
                        className="py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95"
                       >
                          Vote Against
                       </button>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* 3. Governance Stats Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-10 space-y-4 group bg-blue-500/[0.02] border-blue-500/10">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
               <MessageSquare className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Active Discussions</p>
               <p className="text-3xl font-black text-white tracking-tighter">14</p>
            </div>
         </div>

         <div className="glass-card p-10 space-y-4 group bg-purple-500/[0.02] border-purple-500/10">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
               <Activity className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Quorum Threshold</p>
               <p className="text-3xl font-black text-white tracking-tighter">1.2M VP</p>
            </div>
         </div>

         <div className="glass-card p-10 space-y-4 group bg-orange-500/[0.02] border-orange-500/10">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
               <TrendingUp className="h-6 w-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1">Staked Treasury</p>
               <p className="text-3xl font-black text-white tracking-tighter">4.5M $GM</p>
            </div>
         </div>
      </section>

    </div>
  );
}
