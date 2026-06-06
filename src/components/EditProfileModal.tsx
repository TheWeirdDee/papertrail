'use client';

import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, X, Loader2, Save, User as UserIcon } from 'lucide-react';
import { RootState, AppDispatch } from '@/lib/store';
import { uploadFile, getSupaClient } from '@/lib/supabase';
import { updateStats, fetchOnChainStats } from '@/lib/features/userSlice';
import IdentityAvatar from './IdentityAvatar';


interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { address, bio: initialBio, username: initialUsername, website: initialWebsite, avatar: initialAvatar } = useSelector((state: RootState) => state.user);
  const [bio, setBio] = useState(initialBio || '');
  const [newUsername, setNewUsername] = useState(initialUsername || '');
  const [website, setWebsite] = useState(initialWebsite || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    setIsUploading(true);
    try {
      const url = await uploadFile('avatars', file);
      if (url) {
        setAvatarPreview(url);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!address || isSaving) return;

    setIsSaving(true);
    try {
      // Profile details are updated directly in Supabase for PaperTrail identity metadata

      const token = localStorage.getItem('gm_session_token');
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address,
          username: newUsername,
          bio,
          avatar_url: avatarPreview || undefined,
          website
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      dispatch(updateStats({ 
        bio, 
        username: newUsername,
        avatar: avatarPreview || undefined,
        website 
      } as any));

      if (address) {
        dispatch(fetchOnChainStats(address) as any);
      }

      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-[#0A0A0A] border border-white/10 p-6 md:p-10 rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-all z-10">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tighter">Edit Identity</h2>

        <div className="space-y-8 pb-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="h-28 w-28 rounded-[2.5rem] overflow-hidden border-4 border-white/5 group-hover:border-[var(--color-accent)] transition-all shadow-2xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <IdentityAvatar address={address || ''} src={initialAvatar} size="lg" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]"
              >
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">Change Profile Photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-1">Display Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Your handle..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all font-bold placeholder:text-gray-800"
                disabled={!!initialUsername && !initialUsername.startsWith('ST')}
              />
              {initialUsername && !initialUsername.startsWith('ST') && (
                <p className="text-[9px] text-gray-500 ml-1">Username is locked on-chain.</p>
              )}
            </div>

            {/* Website Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all font-bold placeholder:text-gray-800"
              />
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-1">Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the protocol about yourself..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all font-medium placeholder:text-gray-800 min-h-[140px] resize-none"
              maxLength={160}
            />
            <div className="text-right text-[10px] font-bold text-gray-700">
              {bio.length}/160
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="w-full bg-[var(--color-accent)] text-black font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-300 transition-all active:scale-[0.98] disabled:opacity-30 shadow-[0_10px_30px_rgba(34,211,238,0.2)]"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Confirm Updates
          </button>
        </div>
      </div>
    </div>
  );
}
