'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { 
  Loader2, 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  Crown, 
  Circle, 
  HelpCircle, 
  Users,
  Clock,
  Calendar,
  Globe,
  Zap,
  ChevronDown
} from 'lucide-react';

import LeaderboardTable from '@/components/LeaderboardTable';
import RulesModal from '@/components/RulesModal';
import IdentityAvatar from '@/components/IdentityAvatar';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'streak' | 'points' | 'gm_balance' | 'impact'>('streak');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all-time'>('all-time');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  
  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/leaderboard?type=${activeTab}&timeframe=${timeframe}&limit=50`);
      const data = await res.json();
      if (data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, timeframe]);
  
  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  const getTierMetadata = (rank: number) => {
    if (rank <= 10) return {
      name: 'Grandmaster',
      color: 'text-slate-300',
      borderColor: 'border-slate-300/40',
      glowColor: 'shadow-[0_20px_50px_rgba(203,213,225,0.2)]',
      gradient: 'from-slate-200 via-slate-400 to-slate-600',
      icon: Trophy
    };
    if (rank <= 50) return {
      name: 'Diamond Dev',
      color: 'text-cyan-400',
      borderColor: 'border-cyan-400/40',
      glowColor: 'shadow-[0_20px_50px_rgba(34,211,238,0.2)]',
      gradient: 'from-cyan-400 via-purple-500 to-indigo-600',
      icon: Star
    };
    return {
      name: 'Vanguard',
      color: 'text-blue-500',
      borderColor: 'border-blue-500/40',
      glowColor: 'shadow-[0_20px_50px_rgba(59,130,246,0.1)]',
      gradient: 'from-blue-600 via-blue-700 to-blue-800',
      icon: Circle
    };
  };

  const tabs = [
    { id: 'streak', name: 'Streaks', icon: Flame, color: 'text-orange-500' },
    { id: 'points', name: 'Reputation', icon: Star, color: 'text-yellow-500' },
    { id: 'gm_balance', name: 'Rewards', icon: Crown, color: 'text-purple-500' },
    { id: 'impact', name: 'Impact', icon: Target, color: 'text-blue-500' },
  ];

  const timeframeTabs = [
    { id: 'daily', name: 'Daily', icon: Clock },
    { id: 'weekly', name: 'Weekly', icon: Calendar },
    { id: 'all-time', name: 'All-Time', icon: Globe },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden pb-32">
      
      {/* Perspective Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#050505]"></div>
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{ 
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 60% 80% at 50% 100%, black, transparent)',
            transform: 'perspective(1000px) rotateX(60deg) translateY(100px) scale(2)',
            transformOrigin: 'center bottom'
          }}
        ></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-10 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* 1. Header Hero Section */}
        <section className="relative glass-card overflow-hidden p-12 md:p-24 text-center group border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-900 opacity-10 blur-[120px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-10">
            <div className="flex flex-col items-center gap-4">
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Protocol Hall of Fame</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
                  The Global <br/> <span className="text-white/40">Leaderboard.</span>
               </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
               <button 
                onClick={() => setIsRulesOpen(true)}
                className="bg-white/5 border border-white/10 text-white font-black px-10 py-5 rounded-2xl hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3 group/btn"
               >
                  <HelpCircle className="h-4 w-4 text-gray-500 group-hover/btn:text-white" />
                  Ranking Rules
               </button>
            </div>
          </div>
        </section>

        {/* 2. Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto">
           <div className="md:col-span-8 glass-card p-10 flex flex-col justify-between group overflow-hidden bg-white/[0.01]">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                 <Globe className="h-48 w-48 text-white" />
              </div>
              <div className="relative z-10 space-y-2">
                 <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Network Aggregated Power</h4>
                 <div className="flex items-baseline gap-4">
                    <p className="text-7xl font-black text-white tracking-tighter tabular-nums">4.2M</p>
                    <span className="text-sm font-black text-indigo-500 uppercase italic">RP / Cycle</span>
                 </div>
              </div>
              <p className="text-sm text-gray-500 max-w-sm font-medium leading-relaxed mt-10">
                 The cumulative social reputation generated across all active node operators in the current {timeframe} window.
              </p>
           </div>
           
           <div className="md:col-span-4 grid grid-cols-1 gap-6">
              <div className="glass-card p-8 bg-orange-500/[0.03] border-orange-500/10 flex flex-col justify-center gap-1 group">
                 <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                       <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <Zap className="h-4 w-4 text-orange-900 group-hover:text-orange-500 transition-colors" />
                 </div>
                 <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Global Peak Streak</h4>
                 <p className="text-4xl font-black text-white">422 <span className="text-sm text-gray-600">DAYS</span></p>
              </div>
              
              <div className="glass-card p-8 bg-blue-500/[0.03] border-blue-500/10 flex flex-col justify-center gap-1 group">
                 <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                       <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                 </div>
                 <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Active Participants</h4>
                 <p className="text-4xl font-black text-white">12,842</p>
              </div>
           </div>
        </section>

        {/* 3. Filtering & Rankings Section */}
        <div className="space-y-10">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-white/5 pb-10">
             <div className="space-y-2 text-center xl:text-left">
                <h2 className="text-4xl font-black text-white tracking-tighter">Global Rankings.</h2>
                <p className="text-gray-500 text-sm font-medium">Segmenting the top performing nodes by {activeTab} over {timeframe}.</p>
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all ${
                          isActive 
                            ? 'bg-white text-black shadow-2xl' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                        <span className="hidden sm:inline uppercase tracking-widest">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
                  {timeframeTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = timeframe === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setTimeframe(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline uppercase tracking-widest">{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
             </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 min-h-[500px]">
             {isLoading ? (
                <div className="flex flex-col items-center justify-center py-48 glass-card">
                   <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                      <Loader2 className="h-12 w-12 animate-spin text-indigo-500 relative z-10" />
                   </div>
                   <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Multi-Chain State...</p>
                </div>
             ) : (
                <LeaderboardTable 
                  users={users} 
                  type={activeTab as any} 
                />
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
