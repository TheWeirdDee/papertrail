'use client';

import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  Smile,
  Crown,
  Rocket,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../lib/store';
import { Post } from '../lib/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { tipAuthor, callContract } from '../lib/stacks';
import { APP_CONFIG } from '../lib/config';
import { bufferCV } from '@stacks/transactions';

import IdentityAvatar from './IdentityAvatar';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { address: currentAddress, isConnected } = useSelector((state: RootState) => state.user);
  const [showTipOptions, setShowTipOptions] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostWeight, setBoostWeight] = useState(0);
  
  const displayAddress = `${post.authorAddress.substring(0, 5)}...${post.authorAddress.substring(post.authorAddress.length - 4)}`;
  const displayUsername = post.authorAddress === currentAddress ? "You" : `user_${post.authorAddress.substring(post.authorAddress.length - 4)}`;

  const timeAgo = new Date().getTime() - new Date(post.timestamp).getTime();
  const minutesAgo = Math.floor(timeAgo / (1000 * 60));
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);
  const displayTime = daysAgo > 0 ? `${daysAgo} days ago` : hoursAgo > 0 ? `${hoursAgo} hours ago` : `${minutesAgo} minutes ago`;

  const processContent = (text: string) => {
    return text.split(' ').map((word, i) => {
      if (word.startsWith('#')) {
        return <span key={i} className="text-blue-400 hover:underline cursor-pointer transition-all">{word} </span>;
      }
      return word + ' ';
    });
  };

  const dispatch = useDispatch();
  const [isLiked, setIsLiked] = useState(post.currentUserReaction === 'gm');
  const totalLikes = (post.reactions.gm || 0) + (post.reactions.fire || 0) + (post.reactions.laugh || 0);

  useEffect(() => {
    setIsLiked(post.currentUserReaction === 'gm');
  }, [post.currentUserReaction]);

  const handleReaction = async () => {
    if (!currentAddress) {
      toast.error("Connect wallet to react");
      return;
    }
    
    const { reactToPost } = require('../lib/features/postsSlice');
    dispatch(reactToPost({ 
      postId: post.id, 
      reactionType: 'gm',
      decrement: isLiked 
    }));
    
    setIsLiked(!isLiked);

    try {
      const token = localStorage.getItem('gm_session_token');
      await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType: 'gm' })
      });
    } catch (err) {
      console.error("Reaction failed:", err);
      dispatch(reactToPost({ 
        postId: post.id, 
        reactionType: 'gm',
        decrement: !isLiked 
      }));
      setIsLiked(isLiked);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'GM DApp Post',
          text: post.content,
          url: window.location.origin + `/post/${post.id}`,
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleComment = () => {
    window.location.href = `/post/${post.id}`;
  };
  
  const handleTip = async (amount: number) => {
    if (!currentAddress) {
      toast.error("Connect wallet to tip");
      return;
    }
    
    if (currentAddress === post.authorAddress) {
      toast.error("You cannot tip yourself");
      setShowTipOptions(false);
      return;
    }

    try {
      setIsTipping(true);
      setShowTipOptions(false);
      toast.loading(`Tipping ${amount} STX to author...`, { id: 'tip' });
      
      await tipAuthor(post.authorAddress, amount, currentAddress);
      
      try {
        await fetch('/api/posts/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, type: 'tip', amount: amount * 1000000 }) // Sync in microSTX
        });
      } catch (e) {
        console.warn('Post Tip Sync failed:', e);
      }

      toast.success(`Successfully tipped ${amount} STX!`, { id: 'tip' });
      
      const { fetchOnChainStats } = require('../lib/features/userSlice');
      dispatch(fetchOnChainStats(currentAddress) as any);
    } catch (err: any) {
      console.error("Tip failed:", err);
      toast.error(err.message || "Tipping failed", { id: 'tip' });
    } finally {
      setIsTipping(false);
    }
  };

  const handleBoost = async () => {
    if (!isConnected) return toast.error('Connect wallet to boost');
    
    try {
      setIsBoosting(true);
      
      const options = {
        contractAddress: APP_CONFIG.social.address,
        contractName: APP_CONFIG.social.name,
        functionName: 'boost-post',
        functionArgs: [bufferCV(Buffer.from(post.id.replace('tx-', ''), 'hex'))],
        stxAddress: currentAddress,
        onFinish: (data: any) => {
          toast.success('Post Boosted! Scarcity Increased.', {
            icon: '🚀',
            style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,165,0,0.2)' }
          });
          setBoostWeight(prev => prev + 1);

          fetch('/api/posts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id, type: 'boost' })
          }).catch(e => console.warn('Post Boost Sync failed:', e));
        },
        onCancel: () => setIsBoosting(false)
      };

      await callContract(options);
    } catch (error) {
      console.error('Boost error:', error);
      toast.error('Boost failed');
    } finally {
      setIsBoosting(false);
    }
  };

  const { avatar: currentUserAvatar } = useSelector((state: RootState) => state.user);
  const postAvatar = post.avatar || (post.authorAddress === currentAddress ? currentUserAvatar : null);
  const handleBookmark = () => {
    toast.success("Post archived to your collection");
  };

  const getExplorerUrl = (txId: string) => {
    return `https://explorer.hiro.so/txid/${txId}?chain=${APP_CONFIG.isMainnet ? 'mainnet' : 'testnet'}`;
  };

  return (
    <div className="glass-card overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl reveal">
      {/* Header */}
      <div className="p-6 flex items-start justify-between">
        <div className="flex gap-4">
          <Link href={`/profile/${post.authorAddress}`} className="shrink-0 group/avatar">
            <IdentityAvatar address={post.authorAddress} src={postAvatar} size="md" className="ring-2 ring-white/5 group-hover/avatar:ring-[var(--color-accent)]/30 transition-all" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${post.authorAddress}`} className="text-sm font-black text-white hover:text-[var(--color-accent)] transition-colors tracking-tight">
                {displayUsername}
              </Link>
              {post.isPro && (
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-500">
                   <Crown className="w-2.5 h-2.5 fill-yellow-500/20" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[11px] font-medium text-gray-500 tracking-tight">{displayTime}</span>
               {post.txId && (
                 <a 
                   href={getExplorerUrl(post.txId)} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="text-gray-700 hover:text-white transition-colors"
                   title="View on Explorer"
                 >
                    <ExternalLink className="h-2.5 w-2.5" />
                 </a>
               )}
            </div>
          </div>
        </div>
        <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.02] text-gray-700 hover:text-white transition-all hover:bg-white/5">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content */}
      {post.content && post.content.trim() && (
        <div className="px-6 pb-4">
          <p className="text-[14px] leading-relaxed text-gray-200 font-medium whitespace-pre-wrap">
            {processContent(post.content)}
          </p>
        </div>
      )}

      {/* Media Area */}
      {post.mediaUrl && (
        <div className="px-6 pb-6 mt-2">
           <div className="max-h-[350px] bg-white/[0.02] rounded-[1.5rem] overflow-hidden border border-white/5 group-hover:border-white/10 transition-all flex items-center justify-center">
              {post.mediaUrl.match(/\.(mp4|webm|ogg)$/) ? (
                <video 
                  src={post.mediaUrl} 
                  controls 
                  className="max-h-[350px] w-auto max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
                />
              ) : (
                <img 
                  src={post.mediaUrl} 
                  alt="post-media" 
                  className="max-h-[350px] w-auto max-w-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
                />
              )}
           </div>
        </div>
      )}

      {/* Footer Interactions */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/[0.03] bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleReaction}
            className="flex items-center gap-2 group/btn"
          >
            <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
              isLiked 
                ? 'bg-pink-500/20 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                : 'bg-white/[0.03] text-gray-600 group-hover/btn:bg-pink-500/10 group-hover/btn:text-pink-500'
            }`}>
               <Heart className={`h-4 w-4 ${isLiked ? 'fill-pink-500' : ''}`} />
            </div>
            <span className={`text-xs font-black transition-colors ${isLiked ? 'text-pink-500/80' : 'text-gray-600 group-hover/btn:text-gray-400'}`}>
              {totalLikes}
            </span>
          </button>
          
          <button 
            onClick={handleComment}
            className="flex items-center gap-2 group/btn"
          >
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.03] text-gray-600 group-hover/btn:bg-blue-500/10 group-hover/btn:text-blue-500 transition-all">
               <MessageCircle className="h-4 w-4" />
            </div>
            <span className="text-xs font-black text-gray-600 group-hover/btn:text-gray-400">{post.commentsCount}</span>
          </button>

            {/* Boost Button */}
            <button 
              onClick={handleBoost}
              disabled={isBoosting}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all group ${
                boostWeight > 0 ? 'bg-orange-500/10 text-orange-500' : 'text-gray-500 hover:bg-orange-500/10 hover:text-orange-500'
              }`}
            >
              <div className="relative">
                {boostWeight > 0 && <div className="absolute inset-0 bg-orange-500/50 blur-sm rounded-full animate-pulse"></div>}
                <Rocket className={`h-4 w-4 relative z-10 ${isBoosting ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isBoosting ? '...' : boostWeight > 0 ? `${boostWeight}x` : 'Boost'}
              </span>
            </button>

            {/* Tipping Feature */}
            <div className="relative">
              <button 
                onClick={() => setShowTipOptions(!showTipOptions)}
                className={`flex items-center gap-2 group/btn transition-all ${showTipOptions ? 'scale-110' : ''}`}
              >
              <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                showTipOptions 
                  ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                  : 'bg-white/[0.03] text-gray-600 group-hover/btn:bg-yellow-500/10 group-hover/btn:text-yellow-500'
              }`}>
                 <span className="text-xs font-black italic">$</span>
              </div>
              <span className={`text-xs font-black transition-colors ${showTipOptions ? 'text-yellow-500' : 'text-gray-600 group-hover/btn:text-gray-400'}`}>
                Tip
              </span>
            </button>

            {showTipOptions && (
              <div className="absolute bottom-full left-0 mb-4 w-52 bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-xl">
                {isTipping ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/50">Broadcasting...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] uppercase font-black text-gray-600 px-3 py-2 tracking-widest text-center opacity-70">Support Author</p>
                    <div className="grid grid-cols-3 gap-2">
                       {[1, 5, 10].map(amount => (
                         <button 
                           key={amount}
                           onClick={() => handleTip(amount)}
                           className="py-3 rounded-2xl bg-white/[0.03] hover:bg-yellow-500/20 text-white font-black text-xs transition-all border border-white/5 hover:border-yellow-500/30 active:scale-95"
                         >
                           {amount}
                         </button>
                       ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.02] text-gray-700 hover:text-white transition-all hover:bg-white/5"
        >
           <Share className="h-4 w-4" />
        </button>
      </div>

      {/* Inline Comment Input */}
      <div className="px-6 py-5 bg-white/[0.01] flex items-center gap-3 border-t border-white/[0.02]">
        <IdentityAvatar address={currentAddress || ''} src={currentUserAvatar} size="sm" className="ring-1 ring-white/5" />
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors">
           <span>Add a thought...</span>
           <Smile className="h-4 w-4 opacity-30" />
        </div>
      </div>
    </div>
  );
}
