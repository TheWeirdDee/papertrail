import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/userSlice';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'react-hot-toast';
import { Star, Info, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';

const NAV_LINKS = [
  { name: 'Features', href: '/#features', icon: Star },
  { name: 'How it works', href: '/#how-it-works', icon: Info },
  { name: 'Verify Document', href: '/verify', icon: Info },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isConnected } = useSelector((state: RootState) => state.user);
  const { login } = useWalletAuth();

  const handleConnect = async () => {
    await login();
  };

  const handleDisconnect = () => {
    dispatch(logout());
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = !link.href.includes('#') && pathname === link.href;
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

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] pl-2 pr-5 py-2 text-sm font-black text-white transition-all hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                <LayoutDashboard className="h-4 w-4 ml-1" />
                Dashboard
              </Link>
              <button
                onClick={handleDisconnect}
                className="hidden md:block text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-5 py-2 text-sm font-black text-white transition-all hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex flex-wrap items-center justify-around bg-[#0a0a0a] p-2 fixed bottom-0 w-full z-50 gap-y-2">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = !link.href.includes('#') && pathname === link.href;
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
        {isConnected ? (
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 text-[10px] sm:text-xs text-[var(--color-accent)] px-2 py-1"
          >
            <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Dashboard</span>
          </Link>
        ) : (
          <button
            onClick={handleConnect}
            className="flex flex-col items-center gap-1 text-[10px] sm:text-xs text-gray-400 px-2 py-1"
          >
            <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Connect</span>
          </button>
        )}
      </div>
    </nav>
  );
}
