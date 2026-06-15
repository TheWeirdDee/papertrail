'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bell, ShieldCheck, XOctagon, Info } from 'lucide-react';
import { RootState } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils/time';

type Notification = {
  id: string;
  type: 'register' | 'revoke' | 'info';
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const ICONS = {
  register: <ShieldCheck className="h-4 w-4 text-green-400" />,
  revoke: <XOctagon className="h-4 w-4 text-orange-400" />,
  info: <Info className="h-4 w-4 text-accent" />,
};

export default function NotificationBell() {
  const { address } = useSelector((state: RootState) => state.user);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/notifications?address=${address}`);
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications ?? []);
      setUnread(json.unread ?? 0);
    } catch {
      /* non-critical */
    }
  }, [address]);

  // Poll every 60s while a wallet is connected.
  useEffect(() => {
    if (!address) {
      setItems([]);
      setUnread(0);
      return;
    }
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [address, load]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && address) {
      setUnread(0);
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      }).catch(() => {/* non-critical */});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10 relative"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-black text-[10px] font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-semibold text-white">Notifications</p>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-gray-500">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map(n => (
                <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-white/[0.02]">
                  <span className="mt-0.5 shrink-0">{ICONS[n.type] ?? ICONS.info}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-gray-600 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
