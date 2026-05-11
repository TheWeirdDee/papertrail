import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  Flame, 
  Star, 
  Activity, 
  Settings, 
  Link as LinkIcon, 
  Calendar,
  Loader2,
  Crown,
  ExternalLink,
  MapPin,
  Clock,
  Heart,
  Award
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../lib/store';
import { callContract, getUserOnChainData, getGmTokenBalance } from '../lib/stacks';
import { fetchOnChainStats, updateStats } from '../lib/features/userSlice';
import { APP_CONFIG } from '../lib/config';
import { 
  AnchorMode, 
  PostConditionMode, 
  principalCV 
} from '@stacks/transactions';

import IdentityAvatar from './IdentityAvatar';
import EditProfileModal from './EditProfileModal';
import Link from 'next/link';

interface ProfileData {
  address: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isPro: boolean;
}

export default function ProfileHeader({ targetAddress }: { targetAddress: string }) {
  const dispatch = useDispatch();
  const { 
    address: currentAddress, 
    isConnected,
    sessionToken
  } = useSelector((state: RootState) => state.user);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [onChainData, setOnChainData] = useState<{
    streak: number;
    points: number;
    totalTipped: number;
    totalReceived: number;
    gmBalance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isSelf = currentAddress === targetAddress;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/profile/${targetAddress}${currentAddress ? `?observer=${currentAddress}` : ''}`);
      const data = await res.json();
      if (data.data) {
        setProfile(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    const fetchOnChain = async () => {
      try {
        const [chainData, gmBalance] = await Promise.all([
          getUserOnChainData(targetAddress),
          getGmTokenBalance(targetAddress)
        ]);
        
        if (chainData) {
          setOnChainData({
            streak: Number(chainData.streak) || 0,
            points: Number(chainData.points) || 0,
            totalTipped: Number(chainData.totalTipped) || 0,
            totalReceived: Number(chainData.totalReceived) || 0,
            gmBalance: Number(gmBalance) || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch on-chain profile stats:', err);
      }
    };
    
    fetchOnChain();
  }, [targetAddress, currentAddress]);

  const handleFollow = async () => {
    if (!isConnected || !currentAddress || isSelf || isFollowPending) return;
    
    setIsFollowPending(true);
    try {
      console.log('Initiating On-Chain Follow:', { from: currentAddress, to: targetAddress });

      await callContract({
        anchorMode: AnchorMode.Any,
        contractAddress: APP_CONFIG.social.address,
        contractName: APP_CONFIG.social.name,
        functionName: 'follow',
        functionArgs: [principalCV(targetAddress)],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: async (data: any) => {
          console.log('TX Broadcast Success - TXID:', data.txId);
          
          try {
             const confirmRes = await fetch('/api/profile/follow/confirm', {
                method: 'POST',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ targetAddress, txId: data.txId })
             });
             
             if (confirmRes.ok) {
                setProfile(prev => prev ? {
                   ...prev,
                   isFollowing: true,
                   followersCount: prev.followersCount + 1
                } : null);
                
                dispatch(updateStats({ following: (profile?.followingCount || 0) + 1 } as any));
             }
          } catch (syncErr) {
             console.error('Shadow index sync failed:', syncErr);
          }

          setIsFollowPending(false);
        },
        onCancel: () => setIsFollowPending(false),
      });
    } catch (e: any) {
      console.error('Follow Error:', e);
      setIsFollowPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    );
  }

  const joinedDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const displayWebsite = profile?.website?.replace(/^https?:\/\//, '');

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
      {/* Immersive Banner */}
      <div className="h-48 bg-gradient-to-br from-[#111] via-[#0A0A0A] to-[#111] relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),_transparent_70%)] opacity-20"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-dark.png')] opacity-10"></div>
      </div>
      
      <div className="px-10 pb-12 relative">
        <div className="flex justify-between items-end -mt-16 mb-8 px-2">
          <div className="relative group">
            <IdentityAvatar 
              address={targetAddress} 
              src={profile?.avatar_url || undefined} 
              size="lg" 
              className="h-36 w-36 border-8 border-[#0A0A0A] !shadow-[0_20px_50px_rgba(0,0,0,0.5)] !rounded-[3rem] transition-transform duration-500 group-hover:scale-105" 
            />
            {profile?.isFollowing && (
               <div className="absolute -bottom-2 -right-2 bg-[var(--color-accent)] text-black p-2 rounded-2xl shadow-xl animate-in slide-in-from-bottom-2">
                  <UserCheck className="h-4 w-4" />
               </div>
            )}
          </div>
          
          <div className="flex gap-4 mb-4">
            {isSelf ? (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-[11px] bg-white text-black hover:bg-gray-200 transition-all uppercase tracking-[0.2em] shadow-2xl active:scale-95"
              >
                <Settings className="h-4 w-4" />
                Customize Profile
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                disabled={isFollowPending || !isConnected}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-[11px] transition-all uppercase tracking-[0.2em] shadow-2xl ${
                  profile?.isFollowing 
                    ? 'bg-transparent border-2 border-white/10 text-white hover:border-red-500/50 hover:text-red-500 group' 
                    : 'bg-white text-black hover:bg-gray-200'
                } ${isFollowPending ? 'opacity-50 cursor-not-allowed' : ''} ${!isConnected ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {isFollowPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                    <span className="animate-pulse">Broadcasting...</span>
                  </>
                ) : profile?.isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 group-hover:hidden" />
                    <span className="group-hover:hidden">Following</span>
                    <span className="hidden group-hover:inline">Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-6 px-2">
          {/* Identity Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[60vw]">
                {profile?.username || (targetAddress ? `${targetAddress.substring(0, 6)}...${targetAddress.substring(targetAddress.length-4)}` : 'Anonymous')}
              </h1>
              <div className="flex items-center gap-2">
                 {profile?.isPro && (
                    <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/10 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                 )}
                 {(onChainData?.streak || 0) >= 30 && (
                    <div className="group/badge relative">
                       <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          <Flame className="h-4 w-4" />
                       </div>
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap">Streak King</span>
                    </div>
                 )}
                 {Number(onChainData?.points || 0) >= 1000 && (
                    <div className="group/badge relative">
                       <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <Award className="h-4 w-4" />
                       </div>
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap">Influencer</span>
                    </div>
                 )}
              </div>
            </div>
            {/* Mutuals Indicator */}
            {(profile?.followersCount || 0) > 0 && !isSelf && (
              <div className="flex items-center gap-2 text-gray-600">
                 <div className="flex -space-x-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-5 w-5 rounded-full border border-[#0A0A0A] bg-gray-900 flex items-center justify-center overflow-hidden">
                         <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 opacity-50"></div>
                      </div>
                    ))}
                 </div>
                 <span className="text-[9px] font-bold italic tracking-tight">
                    Followed by <span className="text-gray-400 font-black">Community</span> and others you follow
                 </span>
              </div>
            )}
            <p className="text-gray-600 font-mono text-xs tracking-tighter opacity-80">{targetAddress}</p>
          </div>
          
          {/* Social Stats Row */}
          <div className="flex items-center gap-10 py-2">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <span className="font-black text-white text-2xl tracking-tighter group-hover:text-[var(--color-accent)] transition-colors">{profile?.followingCount || 0}</span> 
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Following</span>
            </div>
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <span className="font-black text-white text-2xl tracking-tighter group-hover:text-[var(--color-accent)] transition-colors">{profile?.followersCount || 0}</span> 
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Followers</span>
            </div>
          </div>

          {/* Bio Section */}
          <p className="text-gray-400 font-medium text-base max-w-2xl leading-relaxed italic border-l-2 border-white/5 pl-6">
             {profile?.bio || "No biography provided. This user is a ghost in the protocol."}
          </p>

          {/* Social Metadata Labels */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2">
            {profile?.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[var(--color-accent)] transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                {displayWebsite}
              </a>
            )}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
               <Calendar className="h-4 w-4" />
               Joined {joinedDate}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
               <Clock className="h-4 w-4" />
               Active Protocol Member
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { 
              label: 'Liquid Rewards', 
              val: onChainData ? `${(onChainData.gmBalance / 1000000).toLocaleString()} $GM` : '...', 
              icon: Crown, 
              color: 'text-yellow-500' 
            },
            { 
              label: 'Social Karma', 
              val: onChainData ? `${(onChainData.totalTipped / 1000000).toLocaleString()} STX` : '...', 
              icon: Heart, 
              color: 'text-pink-500' 
            },
            { 
              label: 'Protocol Impact', 
              val: onChainData ? `${(onChainData.totalReceived / 1000000).toLocaleString()} STX` : '...', 
              icon: Star, 
              color: 'text-blue-500' 
            },
            { 
              label: 'Consistency', 
              val: onChainData ? `${onChainData.streak} Day Streak` : '...', 
              icon: Flame, 
              color: 'text-orange-500' 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] rounded-[2rem] p-5 border border-white/5 hover:bg-white/[0.04] transition-colors group">
               <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`h-5 w-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  <ExternalLink className="h-3 w-3 text-gray-800" />
               </div>
               <div className="text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">{stat.label}</div>
               <div className="text-sm font-black text-white">{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </div>
  );
}
