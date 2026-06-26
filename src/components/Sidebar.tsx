'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User as UserIcon,
  Settings,
  PlusCircle,
  X,
  Globe,
  HelpCircle,
  DollarSign,
  ShieldCheck,

} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/store';
import BrandLogo from './BrandLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTH_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Register Document', href: '/register', icon: PlusCircle },
  { name: 'Explore', href: '/explore', icon: Globe },
  { name: 'Verify Document', href: '/verify', icon: ShieldCheck },
];

const INFO_LINKS = [
  { name: 'Pricing & Fees', href: '/pricing', icon: DollarSign },
  { name: 'FAQ', href: '/faq', icon: HelpCircle },
];

const PUBLIC_LINKS = [
  { name: 'Explore', href: '/explore', icon: Globe },
  { name: 'Verify Document', href: '/verify', icon: ShieldCheck },
  { name: 'Pricing & Fees', href: '/pricing', icon: DollarSign },
  { name: 'FAQ', href: '/faq', icon: HelpCircle },
];

function NavLink({ href, icon: Icon, name, onClick }: {
  href: string; icon: React.ComponentType<{ className?: string }>; name: string; onClick: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href) && !href.includes('#'));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-4 py-3 xl:px-0 xl:justify-center rounded-2xl transition-all ${
        isActive
          ? 'bg-white text-black shadow-xl scale-105'
          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-black' : 'group-hover:text-white transition-colors'}`} />
      <span className="font-bold transition-all xl:hidden truncate">{name}</span>
      <div className="hidden xl:group-hover:block absolute left-full ml-4 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg pointer-events-none z-50 whitespace-nowrap shadow-2xl">
        {name}
      </div>
    </Link>
  );
}
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { address, isConnected } = useSelector((state: RootState) => state.user);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#050505] border-r border-white/5 p-6 flex flex-col gap-6 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-full lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-72 xl:w-24 xl:px-4 xl:items-center overflow-y-auto pb-24 lg:pb-6 custom-scrollbar
      `}>
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:hidden mb-2 w-full">
          <BrandLogo size={24} />
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-2 w-full">
          {isConnected ? (
            AUTH_LINKS.map(link => (
              <NavLink key={link.name} {...link} onClick={onClose} />
            ))
          ) : (
            PUBLIC_LINKS.map(link => (
              <NavLink key={link.name} {...link} onClick={onClose} />
            ))
          )}
        </nav>

        {/* Info section — only for authenticated users */}
        {isConnected && (
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-4 xl:hidden">
              Info
            </p>
            {INFO_LINKS.map(link => (
              <NavLink key={link.name} {...link} onClick={onClose} />
            ))}

            {/* Profile link */}
            <NavLink
              href={`/profile/${address}`}
              icon={UserIcon}
              name="Profile"
              onClick={onClose}
            />
          </div>
        )}

        {/* Settings at bottom */}
        <div className="mt-auto flex flex-col gap-2 w-full">
          <NavLink href="/settings" icon={Settings} name="Settings" onClick={onClose} />
        </div>
      </aside>
    </>
  );
}
