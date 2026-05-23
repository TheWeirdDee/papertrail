import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout, setSessionToken, setAddress } from '@/lib/features/userSlice';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'react-hot-toast';
import { 
  Star, Info, Rss, Trophy, LayoutDashboard, 
  User as UserIcon, Wallet, ChevronDown, LogOut, Send 
} from 'lucide-react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import IdentityAvatar from './IdentityAvatar';
import SendSTXModal from './SendSTXModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { address, isConnected, username, avatar, sessionToken } = useSelector((state: RootState) => state.user);
  const { login } = useWalletAuth();
  
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const authInProgress = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

  }, [isConnected, address, sessionToken, dispatch]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const publicLinks = [
    { name: 'Features', href: '/#features', icon: Star },
    { name: 'How it works', href: '/#how-it-works', icon: Info },
    { name: 'Feed', href: '/feed', icon: Rss },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const authLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: `/profile/${address}`, icon: UserIcon },
  ];

  const displayLinks = isConnected ? [...publicLinks, ...authLinks] : publicLinks;

  const handleWalletSelect = async () => {
    await login();
    setShowWalletDropdown(false);
  };

  const handleDisconnect = () => {
    dispatch(logout());
    setShowWalletDropdown(false);
    router.push('/');
    toast.success('Disconnected successfully', {
      style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-12">

        <Link href="/" className="transition-transform hover:scale-105">
           <BrandLogo size={32} />
        </Link>


        <div className="hidden md:flex items-center gap-6">
          {displayLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !link.href.includes('#'));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--color-accent)] ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-gray-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </div>


        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              if (isConnected) {
                setShowWalletDropdown(!showWalletDropdown);
              } else {
                void handleWalletSelect();
              }
            }}
            className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] pl-2 pr-5 py-2 text-sm font-black text-white transition-all hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
          >
            {isConnected ? (
              <div className="flex items-center gap-2">
                <IdentityAvatar address={address} src={avatar} size="xs" className="h-7 w-7 !rounded-full bg-white/10" />
                <span>
                  {address?.substring(0, 4)}...{address?.substring(address.length - 4)}
                </span>
                <ChevronDown 
                  className={`h-4 w-4 opacity-50 transition-transform duration-300 ${showWalletDropdown ? 'rotate-180' : 'rotate-0'}`} 
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 ml-3" />
                <span>Connect Wallet</span>
              </div>
            )}
          </button>


          {showWalletDropdown && isConnected && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/5 bg-[#0A0A0A] shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="px-5 py-3 flex items-center gap-3 border-b border-white/[0.03] mb-2">
                  <IdentityAvatar address={address} src={avatar} size="xs" className="h-8 w-8 !rounded-xl" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{username || 'User'}</span>
                    <span className="text-[9px] text-gray-500 font-mono truncate">{address}</span>
                  </div>
               </div>

               
               <Link 
                 href={`/profile/${address}`}
                 onClick={() => setShowWalletDropdown(false)}
                 className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-white group"
               >
                 <UserIcon className="h-4 w-4 text-gray-500 group-hover:text-[var(--color-accent)]" />
                 <span className="font-bold text-sm">My Profile</span>
               </Link>

               <button 
                 onClick={() => {
                   setShowSendModal(true);
                   setShowWalletDropdown(false);
                 }}
                 className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-[var(--color-accent)] group"
               >
                 <Send className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                 <span className="font-bold text-sm">Send STX</span>
               </button>

               <button 
                 onClick={handleDisconnect}
                 className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-red-400 group"
               >
                 <LogOut className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                 <span className="font-bold text-sm text-red-500/80 group-hover:text-red-400">Disconnect</span>
               </button>
            </div>
          )}
        </div>
      </div>
      
      <SendSTXModal 
        isOpen={showSendModal} 
        onClose={() => setShowSendModal(false)} 
      />


      <div className="md:hidden flex flex-wrap items-center justify-around bg-[#0a0a0a] p-2 fixed bottom-0 w-full z-50 gap-y-2">
        {displayLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !link.href.includes('#'));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs transition-colors px-2 py-1 ${
                isActive ? 'text-[var(--color-accent)]' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center">{link.name}</span>
            </Link>
          );
        })}
        {isConnected && (
          <button
            onClick={() => setShowSendModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] sm:text-xs text-[var(--color-accent)] transition-colors px-2 py-1"
          >
            <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-center">Send</span>
          </button>
        )}
      </div>
    </nav>
  );
}
// NOTE: ui tweak 6 - 20260523T210953Z - small spacing/responsive adjustment
// NOTE: follow-up ui tweak 6 - review responsiveness
