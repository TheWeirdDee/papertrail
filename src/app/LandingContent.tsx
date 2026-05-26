'use client';

import { 
  ArrowRight, 
  Globe, 
  Shield, 
  Zap, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  BarChart3,
  Flame,
  Award,
  ChevronRight,
  Heart,
  Sparkles,
  CheckCircle2,
  Layers,
  UserPlus,
  Trash2,
  ShieldAlert
} from 'lucide-react';

import Link from 'next/link';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { authenticate, signInWithWallet } from '@/lib/stacks';
import { setAddress, setSessionToken } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';

const Particles = dynamic(() => import('@/components/Particles'), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

export default function LandingContent() {
  const sectionsRef = useRef<HTMLElement[]>([]);
  const { isConnected } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    sectionsRef.current.forEach((section) => {
      if (!section) return;
      gsap.fromTo(
        section,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
          },
        }
      );
    });
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const handleHeroAction = async (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault();
      try {
        console.log('--- LANDING HERO LOGIN INITIATED ---');
        

        const stxAddress = await authenticate();
        if (!stxAddress) return;
        
        dispatch(setAddress(stxAddress));
        

        toast.loading('Verifying identity...', { id: 'auth' });
        const authData: any = await signInWithWallet(stxAddress);
        
        if (!authData) {
          console.log('--- LANDING AUTH CANCELLED ---');
          toast.dismiss('auth');
          return;
        }

        if (authData.token) {
          dispatch(setSessionToken(authData.token));
          toast.success("Identity Verified", { id: 'auth' });
          router.push('/dashboard');
        }
      } catch (err: unknown) {
        console.error('Landing Auth Crash:', err);
        toast.error(err instanceof Error ? err.message : 'Login failed', { id: 'auth' });
      }
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white overflow-x-hidden pb-12 md:pb-32">
      <Navbar />
      

      <section className="relative py-12 md:py-20 lg:py-8 px-6 lg:px-12 xl:px-16 overflow-hidden flex justify-center">

        <div className="absolute inset-0 z-0">
          <Particles
            particleCount={270}
            particleSpread={21}
            speed={1}
            particleColors={["#277754","#e4e2e2","#34288a"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={100}
            sizeRandomness={1}
            cameraDistance={20}
            disableRotation={false}
          />
        </div>

        <div className="absolute top-0 right-0 -z-10 w-full h-full max-w-4xl opacity-50 hidden lg:block left-1/2 -translate-x-1/2">
           <img src="/hero_hands.png" alt="Digital connection" className="w-full h-full object-cover mix-blend-screen opacity-60" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-10 blur-[150px] z-0"></div>
         <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center text-center gap-12">
          <div className="space-y-8 max-w-4xl flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Say GM. Build streaks. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)]">Own your social graph.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl">
              The decentralized social engagement protocol on Stacks. Every daily check-in and interaction builds your permanent, immutable reputation.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-center">
              <button 
                onClick={handleHeroAction}
                className="group rounded-full bg-blue-400/60 px-10 py-5 text-black font-extrabold text-xl transition-all hover:scale-110 flex items-center gap-2 active:scale-95"
              >
                {isConnected ? 'Go to Dashboard' : 'Start GMing'}
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </button>
              <div className="h-[1px] w-12 bg-gray-600 hidden sm:block"></div>
              <span className="text-sm text-gray-500 font-mono tracking-wider uppercase">Built on Stacks</span>
            </div>
          </div>
        </div>
      </section>


      <section id="features" ref={addToRefs} className="py-14 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl text-left md:text-left mx-auto md:mx-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Gamify Your <br /> Daily Engagement</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Every interaction is a blockchain transaction. Your streak, points, and following network are entirely owned by you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[300px]">
          <div className="card lg:col-span-1 rounded-3xl overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black z-0"></div>
             <img src="/bento_orange.png" alt="Streak" className="absolute bottom-0 right-0 w-48 opacity-60 group-hover:scale-110 transition-transform duration-700 z-0" />
             <div className="relative z-10 p-8 h-full flex flex-col">
               <h3 className="text-2xl font-bold mb-3">Daily On-Chain Check-in</h3>
               <p className="text-gray-400 text-sm mt-auto backdrop-blur-sm bg-black/20 p-3 rounded-lg border border-white/5">Say GM once every 24 hours to forge your streak and earn base reputation points.</p>
             </div>
          </div>
          <div className="card lg:col-span-1 rounded-3xl overflow-hidden relative group bg-gradient-to-b from-[#111] to-[#050505]">
             <div className="relative z-10 p-8 h-full flex flex-col justify-center w-full grow">
               <h3 className="text-xl font-bold mb-4 text-center">Build Your Social Graph</h3>
               <div className="w-full mt-auto mb-[-32px] mx-[-32px] w-[calc(100%+64px)]">
                 <img src="/SocialGraph.png" alt="Social Graph" className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
               </div>
             </div>
          </div>
          <div className="card lg:col-span-1 lg:row-span-2 rounded-3xl overflow-hidden relative group">
            <img src="/bento_terrain.png" alt="Terrain" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="relative z-10 p-8 h-full flex flex-col">
               <Sparkles className="h-10 w-10 text-[var(--color-accent)] mb-8" />
               <h3 className="text-3xl font-bold mb-4">True Protocol Ownership</h3>
               <p className="text-gray-400">Smart contracts dictate the rules. No central authority can revoke your followers or erase your streak.</p>
               <div className="mt-auto">
                 <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-sm font-semibold transition-colors backdrop-blur-md">Read the Contract</button>
               </div>
            </div>
          </div>
          <div className="card lg:col-span-2 rounded-3xl overflow-hidden relative bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-secondary)]/10 border-[var(--color-accent)]/30">
             <div className="relative z-10 p-8 h-full flex flex-col justify-center">
               <h3 className="text-3xl lg:text-4xl font-bold mb-4 max-w-md">Composability First</h3>
               <p className="text-gray-300 max-w-md mb-8">Other dApps can read your global GM state. Let your on-chain identity transcend single platforms.</p>
               <div>
                  <button className="bg-blue-400/60 text-black font-bold px-6 py-2 rounded-full hover:bg-opacity-80 transition-colors">Explore Documentation</button>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section ref={addToRefs} className="py-10 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
         <div className="flex flex-col lg:flex-row items-center gap-16 text-left">
            <div className="lg:w-1/2 space-y-8 flex flex-col items-start text-left">
               <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">Your Social Hub, <br/>Secured on Stacks</h2>
               <p className="text-xl text-[var(--color-accent)] font-mono">Secured by Bitcoin finality.</p>
               <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                 Unlike web2 platforms where your followers are locked in a database, Gm writes your relationships directly to the decentralized ledger. 
                 Post, react, and comment knowing your social capital is cryptographically secured.
               </p>
               <button 
                 onClick={handleHeroAction}
                 className="bg-blue-400/60 text-black font-bold px-8 py-3 rounded-full hover:bg-opacity-90 transition-all flex items-center gap-2"
               >
                 {isConnected ? 'Go to Dashboard' : 'Connect Wallet'} <ArrowRight className="h-4 w-4" />
               </button>
            </div>
            <div className="lg:w-1/2 relative w-full flex justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-secondary)] to-transparent opacity-20 blur-3xl rounded-full"></div>
               <img src="/phone_mockup.png" alt="App Mockup" className="relative z-10 w-full max-w-md mx-auto drop-shadow-[0_0_50px_rgba(99,102,241,0.2)]" />
               <div className="absolute bottom-12 -left-8 md:left-0 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl hidden md:flex items-center gap-4 shadow-2xl">
                  <div className="bg-blue-400/60 text-black font-bold rounded-lg p-2 text-center leading-none">
                     <span className="block text-xs uppercase opacity-80">Rank</span>
                     <span className="block text-2xl">8</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">217,924</div>
                    <div className="text-sm text-gray-400">Total Global GMs</div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <section ref={addToRefs} className="py-24 overflow-hidden border-y border-white/5 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 max-w-4xl text-center mb-12">
           <h2 className="text-3xl md:text-5xl font-bold mb-6">Real-time Global Feed</h2>
           <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
             Watch the network grow rapidly as users check in, post alphas, and amplify their streaks.
           </p>
        </div>
        <div className="w-full flex overflow-hidden">
          <div className="flex gap-6 animate-marquee flex-nowrap w-max">
             {[1,2,3,4,5,6,1,2,3,4,5,6].map((i, index) => (
               <div key={index} className="w-[300px] h-[400px] flex-shrink-0 card p-6 relative flex flex-col justify-between group overflow-hidden border-white/10 hover:border-[var(--color-accent)]/50 transition-colors">
                  <div className="w-12 h-12 rounded-full border border-gray-700 bg-gradient-to-br from-gray-700 to-gray-900 mb-4 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold">ST1</span>
                  </div>
                  <p className="text-2xl font-black opacity-30 group-hover:opacity-100 transition-opacity">Say GM #{i}</p>
                  <p className="text-sm text-gray-400 font-mono">ST1PQHQ...VGZJSRTPGZGM</p>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
               </div>
             ))}
          </div>
        </div>
      </section>

      <section ref={addToRefs} id="how-it-works" className="pt-24 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
         <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 text-left">
             <div className="lg:w-1/3 flex flex-col items-start">
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Why Build <br className="hidden lg:block"/>on Gm?</h2>
                <button 
                  onClick={handleHeroAction}
                  className="inline-block bg-blue-400/60 text-black font-bold px-8 py-3 rounded-full hover:bg-opacity-90 transition-all font-black uppercase tracking-widest text-xs"
                >
                  {isConnected ? 'View Dashboard' : 'Secure Your Identity'}
                </button>
             </div>
            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <CheckCircle2 className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Immutable Data</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Your streak and posts live permanently as smart contract state. No database resets.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Layers className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Permissionless</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Anyone can interact, follow, and build on top of the GM protocol architecture natively.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Users className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Gamified Identity</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Turn simple, everyday actions into a verifiable on-chain reputation that travels with your wallet.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Shield className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Bitcoin Security</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Settled entirely on Bitcoin via Stacks. Get unmatched security for your social graph.</p>
               </div>
            </div>
         </div>
      </section>
      <Footer />
    </div>
  );
}
