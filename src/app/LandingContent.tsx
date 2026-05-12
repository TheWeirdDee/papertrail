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
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingContent() {
  const [stats, setStats] = useState({
    activeUsers: '12.4K',
    totalGms: '842K',
    distributed: '45.2K STX'
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      
      {/* 1. Global Perspective Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{ 
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 60% 80% at 50% 100%, black, transparent)',
            transform: 'perspective(1000px) rotateX(60deg) translateY(200px) scale(2)',
            transformOrigin: 'center bottom'
          }}
        ></div>
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10">
        
        {/* 2. Hero Section */}
        <section className="pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Mainnet Protocol v5.0 Live</span>
            </div>

            <div className="space-y-6 max-w-5xl mx-auto">
               <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  The Sovereign <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Social Layer.</span>
               </h1>
               <p className="text-lg md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                  A high-fidelity social reputation protocol built on Stacks. Connect, interact, and secure your identity on the Bitcoin settlement layer.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
               <Link href="/feed" className="w-full sm:w-auto bg-white text-black font-black px-12 py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                  Launch Protocol
                  <ArrowRight className="h-4 w-4" />
               </Link>
               <Link href="/leaderboard" className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-black px-12 py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 backdrop-blur-xl">
                  Explore Network
               </Link>
            </div>

            {/* Protocol HUD Snapshot */}
            <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
               <div className="glass-card p-8 group hover:border-white/20 transition-all">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Nodes</p>
                  <p className="text-4xl font-black text-white tracking-tighter">{stats.activeUsers}</p>
               </div>
               <div className="glass-card p-8 group hover:border-white/20 transition-all">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Daily GMs</p>
                  <p className="text-4xl font-black text-white tracking-tighter">{stats.totalGms}</p>
               </div>
               <div className="glass-card p-8 group hover:border-white/20 transition-all">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Yield Distributed</p>
                  <p className="text-4xl font-black text-white tracking-tighter">{stats.distributed}</p>
               </div>
            </div>
          </div>
        </section>

        {/* 3. Feature Matrix */}
        <section className="py-32 px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
           <div className="max-w-7xl mx-auto">
              <div className="mb-20 text-center space-y-4">
                 <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Engineered for Permanence.</h2>
                 <p className="text-gray-500 text-lg font-medium">Bitcoin security meet modern social interaction.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {/* Feature 1 */}
                 <div className="glass-card p-10 space-y-6 group hover:bg-white/[0.03]">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                       <Shield className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-xl font-black text-white tracking-tight">On-Chain Identity</h3>
                       <p className="text-gray-500 leading-relaxed font-medium">Your profile data is settled on the Stacks blockchain, ensuring permanent ownership of your social graph.</p>
                    </div>
                 </div>

                 {/* Feature 2 */}
                 <div className="glass-card p-10 space-y-6 group hover:bg-white/[0.03]">
                    <div className="h-14 w-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                       <Zap className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-xl font-black text-white tracking-tight">Rapid Settlement</h3>
                       <p className="text-gray-500 leading-relaxed font-medium">High-frequency social interactions with fast block confirmations via the Stacks Social Protocol.</p>
                    </div>
                 </div>

                 {/* Feature 3 */}
                 <div className="glass-card p-10 space-y-6 group hover:bg-white/[0.03]">
                    <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                       <TrendingUp className="h-7 w-7" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-xl font-black text-white tracking-tight">Reputation Staking</h3>
                       <p className="text-gray-500 leading-relaxed font-medium">Earn Reputation Points (RP) for consistency and community impact. Unlock governance influence.</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 4. Social Layer CTA */}
        <section className="py-32 px-6">
           <div className="max-w-5xl mx-auto glass-card p-12 md:p-24 relative overflow-hidden text-center space-y-12 border-indigo-500/20">
              <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none"></div>
              <div className="relative z-10 space-y-6">
                 <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter">Ready to Node?</h2>
                 <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl mx-auto">Join thousands of active collectors building the future of decentralized social networks.</p>
              </div>
              <div className="relative z-10">
                 <Link href="/feed" className="bg-indigo-600 text-white font-black px-16 py-6 rounded-2xl hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl inline-flex items-center gap-3">
                    Launch Application
                    <ChevronRight className="h-5 w-5" />
                 </Link>
              </div>
           </div>
        </section>

        {/* 5. Footer */}
        <footer className="py-20 px-6 border-t border-white/5">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 opacity-50">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-black font-black text-xs">GM</div>
                 <span className="text-xs font-black uppercase tracking-widest text-white">GM Protocol © 2026</span>
              </div>
              <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                 <a href="#" className="hover:text-white transition-colors">Explorer</a>
                 <a href="#" className="hover:text-white transition-colors">Documentation</a>
                 <a href="#" className="hover:text-white transition-colors">Governance</a>
                 <a href="#" className="hover:text-white transition-colors">Twitter</a>
              </div>
           </div>
        </footer>

      </div>
    </div>
  );
}
