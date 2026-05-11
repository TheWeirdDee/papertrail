'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { getProfileGradient, getAddressInitials } from '@/lib/utils/avatarUtils';

interface IdentityAvatarProps {
  address: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function IdentityAvatar({ address, src, size = 'md', className = '' }: IdentityAvatarProps) {
  const { address: currentUserAddress, avatar: currentUserAvatar } = useSelector((state: RootState) => state.user);
  
  const finalSrc = src || (address && currentUserAddress && address === currentUserAddress ? currentUserAvatar : null);

  const sizeClasses = {
    xs: 'h-6 w-6 text-[8px] rounded-lg',
    sm: 'h-8 w-8 text-[10px] rounded-xl',
    md: 'h-11 w-11 text-xs rounded-2xl',
    lg: 'h-24 w-24 text-2xl rounded-[2rem]',
    xl: 'h-32 w-32 text-3xl rounded-[2.5rem]',
  };

  const gradient = getProfileGradient(address);
  const initials = getAddressInitials(address);

  return (
    <div 
      className={`shrink-0 overflow-hidden border border-white/5 flex items-center justify-center font-black text-white/40 shadow-inner group-hover/avatar:scale-105 transition-all ${sizeClasses[size]} ${className}`}
      style={!finalSrc ? { background: gradient } : {}}
    >
      {finalSrc ? (
        <img src={finalSrc} alt="avatar" className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
