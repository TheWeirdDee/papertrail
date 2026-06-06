'use client';

import Link from 'next/link';
import { Globe, Code, Cpu } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer className="relative bg-[#050505] border-t border-white/5 pt-24 pb-6 md:pb-12 overflow-hidden">
      {/* Background Faded Brand Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.05] flex gap-10 md:gap-40 items-center justify-center w-full">
        {/* Desktop Version (Very Big) */}
        <div className="hidden lg:flex gap-40">
          <BrandLogo size={250} />
          <BrandLogo size={250} />
        </div>
        {/* Mobile/Medium Version (Appropriately large but fitting) */}
        <div className="flex lg:hidden gap-12">
          <BrandLogo size={130} />
          <BrandLogo size={130} />
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-4 lg:gap-8 mb-16">
          
          <div className="col-span-3 lg:col-span-5">
            <Link href="/" className="transition-transform hover:scale-105 active:scale-95 inline-flex">
              <BrandLogo size={24} />
            </Link>
          </div>

          {/* Brand Description Column - Spans All on Mobile, 2 on Desktop */}
          <div className="col-span-3 lg:col-span-2 space-y-6">
            <p className="text-gray-500 max-w-xs text-sm leading-relaxed">
              Onchain document verification on Stacks. Register any document permanently. Verify instantly.
            </p>
          </div>

          {/* Product Links - 1 col on Mobile */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">How It Works</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Verify</Link></li>
              <li><Link href="/leaderboard" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Leaderboard</Link></li>
            </ul>
          </div>

          {/* Developers Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Developers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="https://github.com/TheWeirdDee/papertrail" target="_blank" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">GitHub</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Contract</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">API Reference</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-[var(--color-accent)] transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-xs text-gray-600 font-medium tracking-tight">
              © {new Date().getFullYear()} PaperTrail. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <Cpu className="h-3 w-3 text-[var(--color-accent)]" />
                Built on Stacks
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Secured by Bitcoin
              </span>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-4">
            <Link href="#" className="text-gray-600 hover:text-white transition-colors">
              <Globe className="h-5 w-5" />
            </Link>
            <Link href="https://github.com/TheWeirdDee/papertrail" target="_blank" className="text-gray-600 hover:text-white transition-colors">
              <Code className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
