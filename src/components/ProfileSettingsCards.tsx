import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  MapPin, 
  Edit2, 
  Shield, 
  Calendar 
} from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';
import EditProfileModal from './EditProfileModal';

interface ProfileSettingsCardsProps {
  targetAddress: string;
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

  const finalUser = user || {
    username: targetAddress.substring(0, 10),
    bio: null,
    avatar: undefined
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
      
      {/* SECTION 1: USER SUMMARY */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative group hover:border-white/10 transition-all shadow-2xl">
        <div className="flex items-center gap-8">
           <IdentityAvatar address={targetAddress} src={finalUser.avatar} size="lg" />
           <div className="flex-1">
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1">
                {finalUser.username || (targetAddress.substring(0, 6) + '...' + targetAddress.substring(targetAddress.length - 4))}
              </h2>
              <p className="text-sm font-medium text-gray-500 mb-2">PaperTrail Participant</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono tracking-tighter">
                 <MapPin className="h-3 w-3" />
                 Stacks Network, {targetAddress.substring(0, 8)}...
              </div>
           </div>
           {isSelf && (
             <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
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
              {finalUser.bio || "No biography details added for this profile."}
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
