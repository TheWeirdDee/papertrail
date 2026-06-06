'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import BrandLogo from './BrandLogo';
import { Bell, Settings, LogOut, User, Menu, Search, ChevronDown, Home, Wallet, Send } from 'lucide-react';
import Link from 'next/link';
import IdentityAvatar from './IdentityAvatar';
import NotificationBell from './NotificationBell';
import TransactionTracker from './TransactionTracker';
import { logout } from '@/lib/features/userSlice';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { usePathname } from 'next/navigation';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { address, isConnected, username, avatar } = useSelector((state: RootState) => state.user);
  const { login } = useWalletAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="max-w-[1800px] mx-auto flex h-20 items-center justify-between px-4 lg:px-12">
        
        {/* Left: Logo & Burger */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onMenuClick}
            className={`p-2.5 text-gray-400 hover:text-white transition-all bg-white/5 rounded-xl lg:hidden ${!isConnected ? 'hidden' : ''}`}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Link href="/" className="transition-all hover:scale-105 group">
            <BrandLogo size={28} />
          </Link>
        </div>

        {/* Center: Search - High Fidelity */}
        <div className={`hidden lg:flex flex-1 max-w-xl mx-12 ${!isConnected ? 'opacity-0' : ''}`}>
          <div className="relative w-full group">
            <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-xl group-focus-within:bg-indigo-500/10 transition-all"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search protocol data..." 
              className="relative w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-gray-700 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
            />
          </div>
        </div>

        {/* Right: Actions & Profile HUD */}
        <div className="flex items-center gap-4">
          


          {/* Global Functional Elements */}
          {hasMounted && isConnected && (
            <div className="flex items-center gap-2">
               <TransactionTracker />
               <NotificationBell />
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            {hasMounted && (
              isConnected ? (
                <>
                  <button 
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-3 rounded-[1.5rem] bg-white/5 border border-white/10 p-1.5 pr-4 transition-all hover:bg-white/10 active:scale-95 shadow-lg group"
                  >
                    <IdentityAvatar address={address} src={avatar} size="xs" className="h-9 w-9 !rounded-xl ring-2 ring-white/5 group-hover:ring-[var(--color-accent)]/30 transition-all" />
                    <div className="hidden sm:flex flex-col items-start">
                       <span className="text-[11px] font-black text-white tracking-tight leading-none mb-0.5">
                         {username || 'Guest'}
                       </span>
                       <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-none">Identity Node</span>
                    </div>
                    <ChevronDown 
                      className={`h-3 w-3 text-gray-600 transition-transform duration-500 ${showUserDropdown ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 sm:-right-4 mt-5 w-[90vw] sm:w-64 rounded-[2.5rem] border border-white/10 bg-[#0A0A0A] shadow-[0_30px_100px_rgba(0,0,0,0.8)] py-4 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="px-6 py-4 border-b border-white/[0.03] mb-3 bg-white/[0.01]">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 font-black mb-1.5">Authorized Wallet</p>
                        <p className="text-[10px] font-mono text-gray-400 truncate opacity-60">{address}</p>
                      </div>
                      
                      <Link href={`/profile/${address}`} onClick={() => setShowUserDropdown(false)} className="mx-3 flex items-center gap-4 px-4 py-3 text-sm text-gray-400 hover:bg-white/[0.03] hover:text-white rounded-2xl transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors border border-white/5">
                          <User className="h-4 w-4 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Public Identity</span>
                      </Link>



                      <Link href="/settings" onClick={() => setShowUserDropdown(false)} className="mx-3 flex items-center gap-4 px-4 py-3 text-sm text-gray-400 hover:bg-white/[0.03] hover:text-white rounded-2xl transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Node Settings</span>
                      </Link>

                      <div className="mt-3 pt-3 border-t border-white/[0.03]">
                        <button 
                          onClick={() => {
                            dispatch(logout());
                            router.push('/');
                          }}
                          className="mx-3 w-[calc(100%-1.5rem)] flex items-center gap-4 px-4 py-3 text-sm text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center border border-red-500/10">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <span className="font-black text-xs uppercase tracking-widest">Kill Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button 
                  onClick={() => void login()}
                  className="flex items-center gap-3 rounded-[1.5rem] bg-white text-black px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-gray-100 active:scale-95 shadow-2xl"
                >
                  <Wallet className="h-4 w-4" />
                  Initialize
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
    

    </>
  );
}
