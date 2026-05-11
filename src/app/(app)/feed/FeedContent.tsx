'use client';

import PostCard from '@/components/PostCard';
import CreatePostCard from '@/components/CreatePostCard';
import FeedSidebar from '@/components/FeedSidebar';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Clock, Flame, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { fetchPostsFromSupabase, fetchPaginatedPosts, addRealtimePost } from '@/lib/features/postsSlice';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';

export default function FeedContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { feed, isLoading, hasMore, lastCursor } = useSelector((state: RootState) => state.posts);
  const { isConnected } = useSelector((state: RootState) => state.user);
  const [activeTab, setActiveTab] = useState('Recent');
  const [sortBy, setSortBy] = useState('Recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    dispatch(fetchPostsFromSupabase());
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPostRaw = payload.new as any;
          const formattedPost: Post = {
            id: newPostRaw.id,
            authorAddress: newPostRaw.address,
            content: newPostRaw.content,
            timestamp: newPostRaw.created_at,
            txId: newPostRaw.tx_id,
            reactions: { gm: 0, fire: 0, laugh: 0 },
            commentsCount: 0,
            repostsCount: 0,
            points: newPostRaw.points || 0,
            isPro: newPostRaw.is_pro || false,
            avatar: newPostRaw.avatar_url || null,
            mediaUrl: newPostRaw.media_url || null,
            pollData: newPostRaw.poll_data || null,
          };
          dispatch(addRealtimePost(formattedPost));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && lastCursor) {
        dispatch(fetchPaginatedPosts(lastCursor));
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, lastCursor, dispatch]);

  const tabs = [
    { name: 'Recent', icon: Clock },
    { name: 'Trending', icon: Flame },
    { name: 'Top', icon: Sparkles },
    { name: 'Global', icon: Globe },
  ];

  const getDisplayFeed = () => {
    let list = [...feed];
    
    if (activeTab === 'Trending') {
      list = list.sort((a, b) => {
        const aTotal = (a.reactions?.gm || 0) + (a.reactions?.fire || 0) + (a.reactions?.laugh || 0) + (a.commentsCount || 0);
        const bTotal = (b.reactions?.gm || 0) + (b.reactions?.fire || 0) + (b.reactions?.laugh || 0) + (b.commentsCount || 0);
        return bTotal - aTotal;
      });
    } else if (activeTab === 'Top') {
      list = list.sort((a, b) => (b.points || 0) - (a.points || 0));
    }
    
    if (sortBy === 'Oldest') {
      list = list.reverse();
    }
    
    return list;
  };

  const displayFeed = getDisplayFeed();

  return (
    <div className={`${isConnected ? 'max-w-[1400px]' : 'max-w-[1000px]'} mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Feed Content */}
        <div className={`space-y-8 ${isConnected ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Create Post Area */}
          <CreatePostCard />

          {/* Feed Header & Sort */}
          <div className="flex items-center justify-between pt-4">
             <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-white text-black shadow-xl ring-4 ring-white/5' 
                        : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-gray-600 font-bold text-xs uppercase tracking-widest relative">
               <span>Sort by : </span>
               <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  {sortBy} <ChevronDown className="h-3.5 w-3.5" />
               </button>

               {showSortDropdown && (
                 <div className="absolute top-full right-0 mt-2 w-32 rounded-xl bg-[#0A0A0A] border border-white/10 shadow-2xl py-2 z-50">
                    {['Recent', 'Oldest', 'Trending'].map(s => (
                      <button 
                        key={s}
                        onClick={() => { setSortBy(s); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                 </div>
               )}
            </div>
          </div>

          {/* Feed List */}
          <div className="flex flex-col gap-8">
            {displayFeed.length > 0 ? (
              displayFeed.map((post, index) => (
                <div 
                  key={post.id} 
                  ref={index === displayFeed.length - 1 ? lastPostRef : null}
                  className="animate-in fade-in slide-in-from-bottom-6 duration-1000"
                >
                  <PostCard post={post} />
                </div>
              ))
            ) : !isLoading ? (
              <div className="py-20 text-center space-y-6 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem]">
                 <div className="h-20 w-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-white/5">
                    <Globe className="h-8 w-8 text-gray-800" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-white font-black text-xl tracking-tight">Quiet on the network...</h3>
                    <p className="text-gray-500 font-medium">Be the first player to say GM and start the pulse!</p>
                 </div>
              </div>
            ) : null}

            {isLoading && (
               <div className="py-10 flex flex-col items-center justify-center gap-4 text-gray-700">
                  <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying More Nodes...</p>
               </div>
            )}

            {!hasMore && displayFeed.length > 0 && (
              <div className="py-20 text-center">
                 <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/[0.01] border border-white/5 backdrop-blur-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">End of Transmission</span>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Cols 9-12) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-10 h-fit">
          <FeedSidebar />
        </div>

      </div>
    </div>
  );
}
