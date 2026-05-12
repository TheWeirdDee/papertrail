'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import { 
  Loader2, 
  Plus, 
  TrendingUp, 
  Zap, 
  MessageCircle,
  Bell,
  ArrowUp,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { setPosts, addPost } from '@/lib/features/postsSlice';
import CreatePostModal from '@/components/CreatePostModal';
import { toast } from 'react-hot-toast';

export default function FeedContent() {
  const dispatch = useDispatch();
  const posts = useSelector((state: RootState) => state.posts.posts);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchPosts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const mappedPosts: Post[] = (data || []).map(p => ({
        id: p.id,
        content: p.content,
        authorAddress: p.author_address,
        authorUsername: p.author_username,
        avatar: p.avatar_url,
        timestamp: p.created_at,
        txId: p.tx_id,
        reactions: p.reactions || {},
        commentsCount: p.comments_count || 0,
        isPro: p.is_pro || false,
        mediaUrl: p.media_url,
        currentUserReaction: null
      }));

      dispatch(setPosts(mappedPosts));
    } catch (err: any) {
      toast.error("Failed to sync protocol feed");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setNewPostsAvailable(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Protocol Live Subscription
    const channel = supabase
      .channel('protocol-feed-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setNewPostsAvailable(true);
        // Add to store immediately if it's near the top
        if (window.scrollY < 100) {
           fetchPosts(true);
        }
      })
      .subscribe();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 1000);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (newPostsAvailable) fetchPosts(true);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 pb-32 reveal" ref={feedRef}>
      
      {/* 1. Feed Action Bar */}
      <div className="flex items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
               <Sparkles className="h-5 w-5" />
            </div>
            <div>
               <h1 className="text-xl font-black text-white tracking-tight">Mainnet Feed</h1>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Sync: Active</p>
            </div>
         </div>
         
         <button 
           onClick={() => fetchPosts(true)}
           disabled={isRefreshing}
           className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
         >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
         </button>
      </div>

      {/* 2. New Post Entry Shortcut */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="w-full glass-card p-6 flex items-center gap-4 group hover:border-white/20 transition-all bg-white/[0.01]"
      >
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
           <Plus className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
        </div>
        <span className="text-gray-600 font-bold tracking-tight text-sm uppercase tracking-widest">Broadcast a thought to the network...</span>
      </button>

      {/* 3. Real-time Notification HUD */}
      {newPostsAvailable && (
        <button 
          onClick={scrollToTop}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500"
        >
           <ArrowUp className="h-4 w-4" />
           New Protocol Activity
        </button>
      )}

      {/* 4. Feed Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-6 opacity-40">
             <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 relative z-10" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Decentralized Ledger</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-40 text-center space-y-6 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
             <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-10 w-10 text-gray-700" />
             </div>
             <p className="text-gray-500 font-black text-xs uppercase tracking-widest">The social layer is currently silent</p>
             <button 
               onClick={() => setShowCreateModal(true)}
               className="text-indigo-500 font-black text-xs uppercase tracking-widest hover:underline"
             >
                Be the first to speak
             </button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* 5. Scroll to Top shortcut */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 h-14 w-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
        >
           <ArrowUp className="h-6 w-6" />
        </button>
      )}

      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
}
