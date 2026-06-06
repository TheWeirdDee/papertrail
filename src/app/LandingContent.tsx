'use client';

import { 
  ArrowRight, 
  Shield, 
  Zap, 
  HelpCircle, 
  CheckCircle2,
  Layers,
  Lock,
  Globe
} from 'lucide-react';

import Link from 'next/link';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { authenticate, signInWithWallet } from '@/lib/stacks';
import { setAddress, setSessionToken } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';

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
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 lg:py-16 px-6 lg:px-12 xl:px-16 overflow-hidden flex justify-center">
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

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-10 blur-[150px] z-0"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center text-center gap-12">
          <div className="space-y-8 max-w-4xl flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Your documents. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)]">Verified by Bitcoin.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl">
              Register any document onchain. Share a verification link. Anyone can confirm it's genuine — instantly, permanently, for free.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-center">
              <Link
                href="/verify"
                className="group rounded-full bg-white px-10 py-5 text-black font-extrabold text-xl transition-all hover:scale-110 flex items-center gap-2 active:scale-95"
              >
                Verify a Document
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Link>
              <button 
                onClick={handleHeroAction}
                className="group rounded-full bg-blue-400/60 px-10 py-5 text-black font-extrabold text-xl transition-all hover:scale-110 flex items-center gap-2 active:scale-95"
              >
                Register Your Documents
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-6 border-y border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md relative z-10">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row justify-around items-center gap-4 text-center font-mono text-xs text-gray-400">
          <div>
            <span className="text-white font-bold text-sm">0</span> Documents Registered
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>
          <div>
            <span className="text-white font-bold text-sm">0</span> Verified Today
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>
          <div>
            <span className="text-white font-bold text-sm">0</span> Wallets Using PaperTrail
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={addToRefs} className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl text-left md:text-left mx-auto md:mx-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How PaperTrail Works</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Verify files cryptographically without exposing the underlying document or contents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card rounded-3xl p-8 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 flex flex-col justify-between group">
             <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-6 font-bold font-mono">01</div>
             <div>
               <h3 className="text-2xl font-bold mb-3">Upload & Hash</h3>
               <p className="text-gray-400 text-sm">Upload your document. It never leaves your browser. We generate a unique cryptographic fingerprint (SHA-256) locally.</p>
             </div>
          </div>
          <div className="card rounded-3xl p-8 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 flex flex-col justify-between group">
             <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6 font-bold font-mono">02</div>
             <div>
               <h3 className="text-2xl font-bold mb-3">Register Onchain</h3>
               <p className="text-gray-400 text-sm">Register the document fingerprint onchain via Stacks. Your proof is permanently timestamped and tied directly to your wallet.</p>
             </div>
          </div>
          <div className="card rounded-3xl p-8 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 flex flex-col justify-between group">
             <div className="h-12 w-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-6 font-bold font-mono">03</div>
             <div>
               <h3 className="text-2xl font-bold mb-3">Share & Verify</h3>
               <p className="text-gray-400 text-sm">Share your verification link. Employers, landlords, or partners can confirm document integrity instantly without needing a wallet.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section ref={addToRefs} className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
         <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 text-left">
             <div className="lg:w-1/3 flex flex-col items-start">
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Why Use <br className="hidden lg:block"/>PaperTrail?</h2>
                <button 
                  onClick={handleHeroAction}
                  className="inline-block bg-blue-400/60 text-black font-bold px-8 py-3 rounded-full hover:bg-opacity-90 transition-all font-black uppercase tracking-widest text-xs"
                >
                  {isConnected ? 'View Dashboard' : 'Register Now'}
                </button>
             </div>
            <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <CheckCircle2 className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Provably Genuine</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Fake certificates or modified documents are instantly detected. Fingerprints must match the ledger exactly.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Layers className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Bitcoin Finality</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Fingerprints are written directly to Stacks, benefiting from the immutable security of Bitcoin block anchoring.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Lock className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Complete Privacy</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">The original file is never uploaded to any server. Hashing occurs entirely inside your client browser.</p>
               </div>
               <div className="flex flex-col items-start text-left">
                  <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                     <Globe className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Free Verification</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">No account or wallet required to verify. Anyone can check a link or upload a file for verification instantly.</p>
               </div>
            </div>
         </div>
      </section>
      <Footer />
    </div>
  );
}
