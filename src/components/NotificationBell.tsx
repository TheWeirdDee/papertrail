'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import { RootState } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { address } = useSelector((state: RootState) => state.user);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/notifications?address=${address}`);
      if (!res.ok) return;
      const json = await res.json();
      setUnread(json.unread ?? 0);
    } catch {
      /* non-critical */
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setUnread(0);
      return;
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [address, load]);

  return (
    <button
      onClick={() => router.push('/notifications')}
      aria-label="View notifications"
      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10 relative"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-black text-[10px] font-bold">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
