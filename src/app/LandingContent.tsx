'use client';

import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Layers,
  Lock,
  Globe,
  FileText,
  Briefcase,
  Home,
  GraduationCap,
  Pencil,
  Cpu,
  Users,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { authenticate } from '@/lib/stacks';
import { setAddress } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { getStats } from '@/lib/verification';
import {
  REGISTRATION_FEE_MICROSTX,
  COSIGN_FEE_MICROSTX,
  UPDATE_FEE_MICROSTX,
  TRANSFER_FEE_MICROSTX,
  PAPERTRAIL_CONTRACT_ADDRESS,
  PAPERTRAIL_CONTRACT_NAME,
} from '@/lib/config';

const Particles = dynamic(() => import('@/components/Particles'), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

function microToStx(micro: number) {
  return (micro / 1_000_000).toFixed(2).replace(/\.00$/, '');
}

const USE_CASES = [
  {
    icon: Home,
    title: 'Real Estate',
    desc: 'Lease agreements, deeds, and inspection reports — timestamped before signatures fly.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
  },
  {
    icon: Briefcase,
    title: 'Employment',
    desc: 'NDAs, offer letters, performance reviews. Prove a version existed at a specific date.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  {
    icon: Cpu,
    title: 'IP & Software',
    desc: 'Commit design specs, source files, or prototypes to the chain before going public.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
  },
  {
    icon: GraduationCap,
    title: 'Academic Credentials',
    desc: 'Diplomas, transcripts, and certifications that can\'t be faked or backdated.',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
  },
  {
    icon: Pencil,
    title: 'Creative Work',
    desc: 'Screenplays, designs, manuscripts. Establish prior art without a notary.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10 border-pink-400/20',
  },
  {
    icon: FileText,
    title: 'Freelance Contracts',
    desc: 'Client agreements and deliverable records — on-chain proof of what was agreed.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/20',
  },
];

const PRICING = [
  { action: 'Register document', stx: microToStx(REGISTRATION_FEE_MICROSTX), highlight: true },
  { action: 'Co-sign (witness)', stx: microToStx(COSIGN_FEE_MICROSTX), highlight: false },
  { action: 'Update metadata', stx: microToStx(UPDATE_FEE_MICROSTX), highlight: false },
  { action: 'Transfer ownership', stx: microToStx(TRANSFER_FEE_MICROSTX), highlight: false },
  { action: 'Verify document', stx: 'Free', highlight: false },
];

export default function LandingContent() {
  const sectionsRef = useRef<HTMLElement[]>([]);
  const { isConnected } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const dispatch = useDispatch();

  const [stats, setStats] = useState({ totalRegistrations: 0, totalUniqueOwners: 0, totalStxCollected: 0 });

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

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
          scrollTrigger: { trigger: section, start: 'top 85%' },
        }
      );
    });
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  };

  const handleHeroAction = async (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault();
      try {
        const stxAddress = await authenticate();
        if (!stxAddress) return;
        dispatch(setAddress(stxAddress));
        toast.success('Wallet connected!', { id: 'auth' });
        router.push('/dashboard');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Login failed', { id: 'auth' });
      }
    } else {
      router.push('/dashboard');
    }
  };

  const stxCollected = (stats.totalStxCollected / 1_000_000).toFixed(1);

  return (
    <div className="bg-[#050505] min-h-screen text-white overflow-x-hidden pb-12 md:pb-32">
      <Navbar />

      {/* Hero */}
      <section className="relative py-12 md:py-20 lg:py-16 px-6 lg:px-12 xl:px-16 overflow-hidden flex justify-center">
        <div className="absolute inset-0 z-0">
          <Particles
            particleCount={270}
            particleSpread={21}
            speed={1}
            particleColors={['#277754', '#e4e2e2', '#34288a']}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={100}
            sizeRandomness={1}
            cameraDistance={20}
            disableRotation={false}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-10 blur-[150px] z-0" />

        <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center text-center gap-12">
          <div className="space-y-8 max-w-4xl flex flex-col items-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              Secured by Bitcoin via Stacks
              <a
                href={`https://explorer.hiro.so/address/${PAPERTRAIL_CONTRACT_ADDRESS}.${PAPERTRAIL_CONTRACT_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 flex items-center gap-0.5 text-[var(--color-accent)] hover:underline"
              >
                View contract <ExternalLink size={9} />
              </a>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
              Your documents. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)]">
                Verified by Bitcoin.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl">
              Register any document onchain. Share a verification link. Anyone can confirm it&apos;s genuine — instantly, permanently, for free.
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
                className="group rounded-full bg-[var(--color-accent)] px-10 py-5 text-black font-extrabold text-xl transition-all hover:scale-110 flex items-center gap-2 active:scale-95"
              >
                Register Your Documents
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="py-6 border-y border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md relative z-10">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row justify-around items-center gap-4 text-center font-mono text-xs text-gray-400">
          <div>
            <span className="text-white font-bold text-sm tabular-nums">
              {stats.totalRegistrations.toLocaleString()}
            </span>{' '}
            Documents Registered
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
          <div>
            <span className="text-white font-bold text-sm tabular-nums">
              {stats.totalUniqueOwners.toLocaleString()}
            </span>{' '}
            Wallets Using PaperTrail
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
          <div>
            <span className="text-[var(--color-accent)] font-bold text-sm tabular-nums">
              {stxCollected}
            </span>{' '}
            STX Secured Onchain
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        ref={addToRefs}
        className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl"
      >
        <div className="mb-16 max-w-3xl text-left mx-auto md:mx-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How PaperTrail Works</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Verify files cryptographically without exposing the underlying document or contents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { num: '01', color: 'indigo', title: 'Upload & Hash', body: "Upload your document. It never leaves your browser. We generate a unique cryptographic fingerprint (SHA-256) locally." },
            { num: '02', color: 'purple', title: 'Register Onchain', body: "Register the document fingerprint onchain via Stacks. Your proof is permanently timestamped and tied directly to your wallet." },
            { num: '03', color: 'green', title: 'Share & Verify', body: "Share your verification link. Employers, landlords, or partners can confirm document integrity instantly without needing a wallet." },
          ].map(({ num, color, title, body }) => (
            <div key={num} className="card rounded-3xl p-8 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 flex flex-col justify-between group">
              <div className={`h-12 w-12 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-500 mb-6 font-bold font-mono`}>{num}</div>
              <div>
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-gray-400 text-sm">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section
        id="use-cases"
        ref={addToRefs}
        className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl"
      >
        <div className="mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 mb-4">
            <Users size={12} /> Use Cases
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Built for the real world</h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            From freelancers to legal firms — anyone who needs irrefutable proof of a document&apos;s existence uses PaperTrail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 flex flex-col gap-4 hover:border-white/10 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
              <button
                onClick={handleHeroAction}
                className={`mt-auto flex items-center gap-1 text-xs font-semibold ${color} opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                Get started <ChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Section */}
      <section ref={addToRefs} className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 text-left">
          <div className="lg:w-1/3 flex flex-col items-start">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Why Use <br className="hidden lg:block" />PaperTrail?
            </h2>
            <button
              onClick={handleHeroAction}
              className="inline-block bg-[var(--color-accent)] text-black font-black px-8 py-3 rounded-full hover:opacity-90 transition-all uppercase tracking-widest text-xs"
            >
              {isConnected ? 'View Dashboard' : 'Register Now'}
            </button>
          </div>
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
            {[
              { icon: CheckCircle2, title: 'Provably Genuine', body: 'Fake certificates or modified documents are instantly detected. Fingerprints must match the ledger exactly.' },
              { icon: Layers, title: 'Bitcoin Finality', body: 'Fingerprints are written directly to Stacks, benefiting from the immutable security of Bitcoin block anchoring.' },
              { icon: Lock, title: 'Complete Privacy', body: 'The original file is never uploaded to any server. Hashing occurs entirely inside your client browser.' },
              { icon: Globe, title: 'Free Verification', body: 'No account or wallet required to verify. Anyone can check a link or upload a file for verification instantly.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col items-start text-left">
                <div className="bg-[var(--color-accent)]/20 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                  <Icon className="text-[var(--color-accent)]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        ref={addToRefs}
        className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl"
      >
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 mb-4">
            <Shield size={12} /> Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Pay once. Permanent forever.</h2>
          <p className="text-gray-400 text-lg mb-10">
            No subscriptions, no monthly fees. Every action is a one-time on-chain transaction in STX.
          </p>

          <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
            {PRICING.map(({ action, stx, highlight }) => (
              <div
                key={action}
                className={`flex items-center justify-between px-6 py-4 ${highlight ? 'bg-[var(--color-accent)]/10' : 'bg-[#0d0d0d]'}`}
              >
                <span className={`text-sm ${highlight ? 'text-white font-semibold' : 'text-gray-400'}`}>
                  {action}
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    stx === 'Free'
                      ? 'text-green-400'
                      : highlight
                      ? 'text-[var(--color-accent)]'
                      : 'text-white'
                  }`}
                >
                  {stx === 'Free' ? stx : `${stx} STX`}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * Network gas fees (~0.001 STX) apply separately. Verification is always free.
          </p>
        </div>
      </section>

      {/* Trust Section */}
      <section
        ref={addToRefs}
        className="py-20 px-6 lg:px-12 xl:px-16 container mx-auto max-w-7xl"
      >
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0d0d0d] to-black p-10 md:p-16 flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400">
              <Shield size={12} className="text-[var(--color-accent)]" /> Trustless by design
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              No company to trust.<br />
              <span className="text-[var(--color-accent)]">Just the blockchain.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed max-w-lg">
              PaperTrail stores only a cryptographic hash — never your file. The contract is open-source, immutable, and verifiable by anyone on the Stacks explorer. Even if PaperTrail went offline tomorrow, your documents remain provably registered on-chain forever.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
              <a
                href={`https://explorer.hiro.so/address/${PAPERTRAIL_CONTRACT_ADDRESS}.${PAPERTRAIL_CONTRACT_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:border-[var(--color-accent)]/40 hover:text-white transition-colors"
              >
                <ExternalLink size={11} /> View contract on explorer
              </a>
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-colors"
              >
                Read FAQ <ChevronRight size={11} />
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {[
              { label: 'Bitcoin Anchored', sub: 'via Stacks' },
              { label: 'Open Source', sub: 'Clarity 4 contract' },
              { label: 'No File Upload', sub: 'client-side only' },
              { label: 'Free Verification', sub: 'no wallet needed' },
            ].map(({ label, sub }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center"
              >
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={addToRefs}
        className="py-16 px-6 lg:px-12 xl:px-16 container mx-auto max-w-5xl text-center"
      >
        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
          Start registering documents today.
        </h2>
        <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
          Connect your Stacks wallet and register your first document in under 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={handleHeroAction}
            className="group rounded-full bg-[var(--color-accent)] px-10 py-5 text-black font-extrabold text-lg transition-all hover:scale-105 flex items-center gap-2 active:scale-95"
          >
            {isConnected ? 'Go to Dashboard' : 'Connect Wallet & Register'}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <Link
            href="/explore"
            className="group rounded-full border border-white/10 px-10 py-5 text-white font-bold text-lg transition-all hover:border-white/20 hover:bg-white/5 flex items-center gap-2"
          >
            Browse Documents <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
