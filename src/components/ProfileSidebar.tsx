'use client';

import { User, Shield, Users, UserCheck, Bell, CreditCard, Download, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '@/lib/features/userSlice';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'followers', label: 'Followers', icon: UserCheck },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'social-graph', label: 'Social Graph', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'pro-plan', label: 'Pro Plan', icon: CreditCard },
  { id: 'data', label: 'Data Export', icon: Download },
];

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect your wallet? All local session data will be cleared.')) {
      dispatch(logout());
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-white/[0.04] text-white shadow-sm ring-1 ring-white/5' 
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-10">
        <button 
          onClick={handleDisconnect}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-900/40 hover:text-red-500 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
