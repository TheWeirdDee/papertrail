import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Edit2, Shield, Calendar, Copy, Check } from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';
import EditProfileModal from './EditProfileModal';

interface ProfileSettingsCardsProps {
  targetAddress: string;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isAddress(val: string | null | undefined): boolean {
  if (!val) return false;
  return val.startsWith('SP') || val.startsWith('ST') || val.startsWith('SM');
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs font-mono text-gray-500 break-all">{truncateAddress(address)}</span>
      <button
        onClick={copy}
        className="shrink-0 p-1 rounded-md hover:bg-white/5 transition-colors text-gray-600 hover:text-white"
        title="Copy address"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

export default function ProfileSettingsCards({ targetAddress }: ProfileSettingsCardsProps) {
  const { address: currentAddress, ...currentUserData } = useSelector((state: RootState) => state.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isSelf = currentAddress === targetAddress;

  const user = isSelf ? {
    username: currentUserData.username,
    bio: currentUserData.bio,
    avatar: currentUserData.avatar
  } : null;

  if (!user && !isSelf) {
    return (
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-12 text-center opacity-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Principal metadata restricted while indexing...</p>
      </div>
    );
  }

  const rawUsername = user?.username ?? null;
  const displayName = isAddress(rawUsername)
    ? truncateAddress(rawUsername!)
    : (rawUsername || truncateAddress(targetAddress));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">

      {/* SECTION 1: USER SUMMARY */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative group hover:border-white/10 transition-all shadow-2xl">
        <div className="flex items-center gap-8">
          <IdentityAvatar address={targetAddress} src={user?.avatar ?? undefined} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1 truncate">
              {displayName}
            </h2>
            <p className="text-sm font-medium text-gray-500 mb-2">PaperTrail Participant</p>
            <CopyAddress address={targetAddress} />
          </div>
          {isSelf && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: PLATFORM PROFILE */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative group hover:border-white/10 transition-all shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Profile Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">Joined PaperTrail</p>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
              <Calendar className="h-4 w-4 opacity-30" />
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-2">Verification Status</p>
            <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
              <Shield className="h-4 w-4" />
              On-Chain Verified
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-3">Biography</p>
          <p className="text-sm font-medium text-gray-500 leading-relaxed">
            {user?.bio || 'No biography details added for this profile.'}
          </p>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
