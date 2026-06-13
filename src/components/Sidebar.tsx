'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Rss,
  User as UserIcon,
  Settings,
  PlusCircle,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/store';
import BrandLogo from './BrandLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { address, isConnected } = useSelector((state: RootState) => state.user);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const publicLinks = [
    { name: 'Verify Document', href: '/verify', icon: Rss },
  ];

  const authLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Register Document', href: '/register', icon: PlusCircle },
    { name: 'Verify Document', href: '/verify', icon: Rss },
    { name: 'Profile', href: `/profile/${address}`, icon: UserIcon },
  ];

  const navLinks = isConnected ? authLinks : publicLinks;

  if (!hasMounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#050505] border-r border-white/5 p-6 flex flex-col gap-8 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-full lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-72 xl:w-24 xl:px-4 xl:items-center overflow-y-auto pb-24 lg:pb-6 custom-scrollbar
      `}>
        {/* Sidebar Header (Mobile Only) */}
        <div className="flex items-center justify-between lg:hidden mb-4 w-full">
          <BrandLogo size={24} />
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-4 w-full">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !link.href.includes('#'));
            
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 px-4 py-3 xl:px-0 xl:justify-center rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-white text-black shadow-xl scale-105' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-black' : 'group-hover:text-white transition-colors'}`} />
                <span className={`font-bold transition-all xl:hidden truncate`}>
                  {link.name}
                </span>

                {/* Tooltip for XL */}
                <div className="hidden xl:group-hover:block absolute left-full ml-4 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg pointer-events-none z-50 whitespace-nowrap shadow-2xl">
                  {link.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-6 w-full">
          <Link
            href="/settings"
            onClick={onClose}
            className={`group relative flex items-center gap-3 px-4 py-3 xl:px-0 xl:justify-center rounded-2xl transition-all ${
              pathname === '/settings' 
                ? 'bg-white/10 text-white font-bold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="xl:hidden">Settings</span>
            
            {/* Tooltip for XL */}
            <div className="hidden xl:group-hover:block absolute left-full ml-4 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg pointer-events-none z-50 whitespace-nowrap shadow-2xl">
              Settings
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
// NOTE: ui tweak 7 - 20260523T210953Z - small spacing/responsive adjustment
// NOTE: follow-up ui tweak 7 - review responsiveness
