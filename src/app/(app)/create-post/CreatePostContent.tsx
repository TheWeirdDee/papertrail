'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import IdentityAvatar from '@/components/IdentityAvatar';
import { RootState } from '@/lib/store';
import { fetchPostsFromSupabase, addOptimisticPost } from '@/lib/features/postsSlice';
import { useRouter } from 'next/navigation';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'react-hot-toast';
import { 
  Image as ImageIcon, Video, BarChart2, Globe, ChevronDown, 
  Smile, X, ArrowLeft, Sparkles, Hash, AtSign, Loader2,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const SUGGESTIONS = ['#gm', '#stacks', '#web3', '#bitcoin', '#btc', '#defi', '#nft', '#dao'];

const PRIVACY_OPTIONS = [
  { id: 'public', label: 'Public', desc: 'Visible to all network participants' },
  { id: 'connections', label: 'Connections Only', desc: 'Only your followers can see this' },
];

export default function CreatePostContent() {
  const { address, isConnected, username, streak, points, followers, avatar } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const { login } = useWalletAuth();

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [postState, setPostState] = useState<'idle' | 'posting' | 'success'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayAddress = address ? `${address.substring(0, 8)}...${address.substring(address.length - 5)}` : '';
  const maxLength = 280;
  const remaining = maxLength - content.length;
  const overLimit = remaining < 0;
  const isNearLimit = remaining <= 40 && !overLimit;

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(120, el.scrollHeight)}px`;
    }
  }, [content]);

  const handleHashtag = (tag: string) => {
    setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag + ' ');
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!content.trim() || !address || overLimit || postState !== 'idle') return;

    setPostState('posting');
    await new Promise(r => setTimeout(r, 1200)); // Simulate broadcast delay

    dispatch(addOptimisticPost({
      id: `opt_${Date.now()}`,
      authorAddress: address,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      reactions: { gm: 0, fire: 0, laugh: 0 },
      commentsCount: 0,
      repostsCount: 0,
      points: 0
    }));
    setPostState('success');

    setTimeout(() => {
      router.push('/feed');
    }, 1500);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="bg-[#0A0A0A] border border-white/5 max-w-md w-full rounded-[3rem] p-12 space-y-6">
          <h1 className="text-2xl font-black text-white tracking-tighter">Connect First</h1>
          <p className="text-gray-500 text-sm font-medium">You need a connected Stacks wallet to broadcast a post.</p>
          <button 
            onClick={() => login()}
            className="inline-block bg-white text-black font-black py-3 px-10 rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (postState === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center space-y-6 animate-in zoom-in fade-in duration-700">
          <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tighter">Post Broadcast!</h2>
            <p className="text-gray-500 text-sm font-medium">Your message is live on the Gm network.</p>
          </div>
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest animate-pulse">Redirecting to feed...</p>
        </div>
      </div>
    );
  }

  const processedContent = (text: string) => {
    if (!text) return null;
    return text.split(' ').map((word, i) => {
      if (word.startsWith('#')) return <span key={i} className="text-blue-400">{word} </span>;
      if (word.startsWith('@')) return <span key={i} className="text-purple-400">{word} </span>;
      return word + ' ';
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <Link href="/feed" className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Feed</span>
        </Link>
        <h1 className="text-sm font-black text-white uppercase tracking-[0.2em] opacity-40">Create Post</h1>
      </div>

      {/* Main Card */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* Author Strip */}
        <div className="flex items-center gap-4 px-8 py-6 border-b border-white/[0.03]">
          <IdentityAvatar address={address || ''} src={avatar} size="md" className="h-12 w-12 !rounded-2xl" />
          <div>
            <p className="text-sm font-black text-white uppercase tracking-tight">You</p>
            <p className="text-[10px] text-gray-600 font-mono">{displayAddress}</p>
          </div>
          
          {/* Privacy dropdown */}
          <div className="ml-auto relative">
            <button
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              {PRIVACY_OPTIONS.find(p => p.id === privacy)?.label}
              <ChevronDown className={`h-3 w-3 transition-transform ${showPrivacy ? 'rotate-180' : ''}`} />
            </button>
            {showPrivacy && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setPrivacy(opt.id); setShowPrivacy(false); }}
                    className={`w-full flex flex-col text-left px-4 py-3 hover:bg-white/5 transition-colors ${privacy === opt.id ? 'bg-white/[0.04]' : ''}`}
                  >
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    <span className="text-[10px] text-gray-600">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="px-8 py-6 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share a thought with the Gm network..."
            className="w-full bg-transparent border-none text-white resize-none outline-none text-lg placeholder-gray-700 font-medium leading-relaxed min-h-[140px]"
            maxLength={500}
          />
          
          {/* Hashtag suggestions */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleHashtag(tag)}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="px-8 py-5 border-t border-white/[0.03] flex items-center gap-6">
          <div className="flex items-center gap-5">
            <button title="Add image" className="text-gray-600 hover:text-white transition-colors group">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.02] group-hover:bg-white/5 transition-all">
                <ImageIcon className="h-4 w-4" />
              </div>
            </button>
            <button title="Add video" className="text-gray-600 hover:text-white transition-colors group">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.02] group-hover:bg-white/5 transition-all">
                <Video className="h-4 w-4" />
              </div>
            </button>
            <button title="Add poll" className="text-gray-600 hover:text-white transition-colors group">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.02] group-hover:bg-white/5 transition-all">
                <BarChart2 className="h-4 w-4" />
              </div>
            </button>
            <button
              title="Add hashtag"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`text-gray-600 hover:text-white transition-colors group ${showSuggestions ? 'text-blue-400' : ''}`}
            >
              <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${showSuggestions ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/[0.02] group-hover:bg-white/5'}`}>
                <Hash className="h-4 w-4" />
              </div>
            </button>
            <button title="Emoji" className="text-gray-600 hover:text-white transition-colors group">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/[0.02] group-hover:bg-white/5 transition-all">
                <Smile className="h-4 w-4" />
              </div>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-5">
            {/* Character counter */}
            <div className={`text-xs font-black tabular-nums ${overLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-700'}`}>
              {overLimit ? `-${Math.abs(remaining)}` : remaining}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-white/10" />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || overLimit || postState !== 'idle'}
              className="flex items-center gap-2.5 bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-20 disabled:grayscale hover:bg-gray-200 active:scale-95 shadow-xl"
            >
              {postState === 'posting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <div className="mt-6 p-6 bg-white/[0.01] border border-white/[0.04] rounded-[2rem]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-4">Protocol Tips</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Hash, text: 'Use #hashtags to categorize your post and boost reach across the network.' },
            { icon: AtSign, text: 'Tag other participants using @address to create on-chain social connections.' },
            { icon: Sparkles, text: 'Posts are stored locally. Only GM transactions are broadcast on-chain.' },
          ].map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <Icon className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-gray-700 leading-relaxed">{tip.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
