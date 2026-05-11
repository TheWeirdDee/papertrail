'use client';

import GMButton from '@/components/GMButton';
import IdentityAvatar from '@/components/IdentityAvatar';
import PostCard from '@/components/PostCard';
import AnalyticsGraph from '@/components/AnalyticsGraph';
import StatCardVertical from '@/components/StatCardVertical';
import SetUsernameModal from '@/components/SetUsernameModal';
import ProPlanModal from '@/components/ProPlanModal';
import NetworkStats from '@/components/NetworkStats';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  TrendingUp, 
  History,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  LayoutDashboard,
  Award,
  Crown,
  Heart,
  Loader2
} from 'lucide-react';

import { callContract, getUserOnChainData } from '@/lib/stacks';
import { APP_CONFIG } from '@/lib/config';
import { useDispatch } from 'react-redux';
import { updateStats, fetchOnChainStats } from '@/lib/features/userSlice';
import { fetchPostsFromSupabase } from '@/lib/features/postsSlice';
import toast from 'react-hot-toast';

export default function DashboardContent() {
  const dispatch = useDispatch();
  const { 
    address, 
    isConnected, 
    username,
    points,
    streak,
    isLoading, 
    followers, 
    following, 
    isPro, 
    isOptimisticPro,
    isStreakBroken,
    avatar
  } = useSelector((state: RootState) => state.user);
  const activePro = isPro || isOptimisticPro;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const dismissed = useRef(false);
  const feed = useSelector((state: RootState) => state.posts.feed);
  const [isMounted, setIsMounted] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (feed.length === 0) {
      dispatch(fetchPostsFromSupabase() as any);
    }
    
    if (isConnected && address) {
      dispatch(fetchOnChainStats(address) as any);
    }
  }, [dispatch, isConnected, address]);

  useEffect(() => {
    if (!isLoading && isConnected && !username && !dismissed.current) {
      setShowOnboarding(true);
    } else if (username) {
      setShowOnboarding(false);
    }
  }, [isConnected, username, isLoading]);

  const handleCloseOnboarding = () => {
    dismissed.current = true;
    setShowOnboarding(false);
  };

  const [isConfirmedToday, setIsConfirmedToday] = useState(false);
  
  useEffect(() => {
    if (!address) return;
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(`gm_date_${address}`);
    if (savedDate === today) {
      setIsConfirmedToday(true);
    }
  }, [address, isConnected]);

  const handleHealStreak = async () => {
    if (!address || isHealing) return;
    
    setIsHealing(true);
    try {
      await callContract({
        contractAddress: APP_CONFIG.social.address,
        contractName: APP_CONFIG.social.name,
        functionName: 'heal-streak',
        functionArgs: [],
        onFinish: (data: any) => {
          toast.success("Streak Healed Successfully!");
          dispatch(fetchOnChainStats(address) as any);
          setIsHealing(false);
        },
        onCancel: () => {
          setIsHealing(false);
        }
      });
    } catch (err) {
      console.error('Heal Streak Error:', err);
      toast.error("Failed to heal streak");
      setIsHealing(false);
    }
  };

  const addressShort = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'GM User';
  const greeting = isLoading && !username 
    ? "Loading profile..." 
    : (username || addressShort);

  if (!isMounted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-white/10 animate-spin" />
      </div>
    );
  }

  if (isLoading && !isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-white/20 animate-spin mb-4" />
        <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Verifying Session...</p>
      </div>
    );
  }


  return (
    <div className="p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-[1600px] mx-auto">
      
      <SetUsernameModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <ProPlanModal isOpen={showProModal} onClose={() => setShowProModal(false)} />

      {/* Network Health Stats */}
      <NetworkStats />

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
        
        {/* Main Content Area (Column 1-8) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* 1. Hero Greeting */}
          <section className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 md:p-12 rounded-[3rem] border border-white/5 relative overflow-hidden group order-1">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] transition-transform group-hover:scale-110 duration-1000">
               <Zap className="h-48 w-48 text-[var(--color-accent)]" />
            </div>
            
            <div className="relative z-10 max-w-xl">
               <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight truncate">
                    Hi, {username || addressShort}.
                  </h1>
                  {activePro && (
                    <div className="flex items-center justify-center p-1.5 transition-all">
                      <Crown className="w-5 h-5 text-white fill-white/10 animate-pulse" />
                    </div>
                  )}
               </div>
               <p className="text-gray-400 text-lg md:text-xl font-medium mb-8 leading-relaxed">
                  Welcome back! Your streak is active and your reputation is growing. Inspire the network today.
               </p>
               <button onClick={() => setShowOnboarding(true)} className="bg-white text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-2xl">
                  {(!username || username.length > 25) ? 'Set Username' : 'View Details'}
                  <ArrowRight className="h-5 w-5" />
               </button>
            </div>
          </section>

          {/* 2. GM Button (Mobile) */}
          <div className="lg:hidden order-2">
            <div className="bg-[#0A0A0A] border border-[var(--color-accent)]/20 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 relative overflow-hidden group shadow-[0_0_50px_rgba(34,197,94,0.05)]">
               <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]/50"></div>
               <div className="scale-90">
                  <GMButton />
               </div>
               <p className="text-xs font-black text-gray-600 uppercase tracking-[0.2em] text-center">Maintain your status</p>
            </div>
          </div>

          {/* 3. Stats Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 order-3">
               <StatCardVertical 
                  label="Days Streak" 
                  value={streak || 0} 
                  icon={History} 
                  subtext={
                    isStreakBroken 
                      ? "Your streak has decayed!" 
                      : activePro ? "Streak protection active" : "Keep it up for bonuses!"
                  }
                  isLoading={isLoading}
                  cta={isStreakBroken && (
                    <button 
                      onClick={() => activePro ? handleHealStreak() : setShowProModal(true)}
                      disabled={isHealing}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                        activePro ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                      }`}
                    >
                      {isHealing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : activePro ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Crown className="w-3 h-3" />
                      )}
                      {isHealing ? 'Healing...' : activePro ? 'Heal Streak' : 'Restore with Pro'}
                    </button>
                  )}
               />
             <StatCardVertical 
                label="Social Reputation" 
                value={((points || 0) / 10).toFixed(1)} 
                icon={Award} 
                subtext={
                  activePro 
                    ? "2x Rep Multiplier active" 
                    : (points || 0) > 100 ? "Top 5% of all users" :
                      (points || 0) > 50 ? "Top 15% of all users" :
                      (points || 0) > 10 ? "Top 30% of all users" : "New Network Member"
                }
                accentColor="#818cf8"
                isLoading={isLoading}
             />
             <StatCardVertical 
                label="Total Followers" 
                value={followers || 0} 
                icon={Users} 
                subtext={`${following} following`}
                accentColor="#f472b6"
                isLoading={isLoading}
             />
          </section>

          {/* 4. Analytics Graph */}
          <div className="order-5">
            <AnalyticsGraph />
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 flex flex-col gap-8 order-2 lg:order-none">
          
          {/* GM Button (Desktop) */}
          <div className="hidden lg:flex bg-[#0A0A0A] border border-[var(--color-accent)]/20 p-8 rounded-[2.5rem] flex-col items-center justify-center gap-6 relative overflow-hidden group shadow-[0_0_50px_rgba(34,197,94,0.05)]">
             <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]/50"></div>
             <div className="scale-90">
                <GMButton />
             </div>
             <p className="text-xs font-black text-gray-600 uppercase tracking-[0.2em] text-center">Maintain your status</p>
          </div>

          {/* Followers Preview */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 order-4">
             <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Followers</h4>
                <Link href="/followers" className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors">View All</Link>
             </div>
             {followers === 0 ? (
               <div className="flex flex-col items-center gap-3 py-4 text-center">
                 <div className="flex -space-x-3">
                   <IdentityAvatar address={address || ''} src={avatar} size="xs" className="h-10 w-10 !rounded-full border-2 border-[#0a0a0a]" />
                   {[1,2].map(i => (
                     <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0a0a0a] bg-white/[0.03] flex items-center justify-center">
                       <Users className="h-4 w-4 text-gray-700" />
                     </div>
                   ))}
                 </div>
                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No followers yet</p>
                 <Link href="/feed" className="text-[10px] font-black text-[var(--color-accent)] hover:underline uppercase tracking-widest">Explore Feed</Link>
               </div>
             ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{followers} connected nodes</p>
                   <Link href="/followers" className="text-[10px] font-black text-[var(--color-accent)] hover:underline uppercase tracking-widest">Manage Network</Link>
                </div>
             )}
          </div>

          {/* Pro Account CTA */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl order-6">
             <Zap className="absolute top-[-20px] right-[-20px] h-32 w-32 opacity-20 rotate-12 transition-transform group-hover:scale-110" />
             <h4 className="text-xl font-black text-white mb-2 relative z-10">{activePro ? "Welcome Pro" : "Go Pro."}</h4>
             <p className="text-indigo-100 text-sm mb-6 relative z-10 opacity-80">
                {activePro ? "You are enjoying double reputation points and streak protection." : "Unlock custom avatars, higher streak multipliers, and exclusive badges."}
             </p>
             <button 
                onClick={() => setShowProModal(true)}
                className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl relative z-10 transition-transform active:scale-95 shadow-xl"
             >
                {activePro ? "View Membership" : "Purchase Now"}
             </button>
          </div>

        </div>

      </div>
    </div>
  );
}
