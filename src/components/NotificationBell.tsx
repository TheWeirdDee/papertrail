'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  return (
    <button 
      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10 relative"
    >
      <Bell className="h-5 w-5" />
    </button>
  );
}
