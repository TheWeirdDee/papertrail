'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Bell, ShieldCheck, XOctagon, Info } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/time';

type Notification = {
  id: string;
  type: 'register' | 'revoke' | 'info';
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<Notification['type'], React.ReactNode> = {
  register: <ShieldCheck className="h-5 w-5 text-green-400" />,
  revoke: <XOctagon className="h-5 w-5 text-orange-400" />,
  info: <Info className="h-5 w-5 text-[#22d3ee]" />,
};

export default function NotificationsPage() {
  const { address } = useSelector((state: RootState) => state.user);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?address=${address}`);
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.notifications ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    load();
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    }).catch(() => {});
  }, [address, load]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">Notifications</h1>
          <p className="text-[11px] text-gray-600 font-mono uppercase tracking-widest mt-0.5">
            Protocol events for your wallet
          </p>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin mx-auto mb-4" />
            <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">Indexing events...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-8 w-8 text-gray-700 mx-auto mb-4" />
            <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">No protocol events yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {items.map(n => (
              <li
                key={n.id}
                className={`flex gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors ${!n.is_read ? 'bg-white/[0.01]' : ''}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mt-0.5">
                  {ICONS[n.type] ?? ICONS.info}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-bold text-white leading-tight">{n.title}</p>
                    {!n.is_read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-[#22d3ee] mt-1.5" />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                  )}
                  <p className="text-[10px] text-gray-600 font-mono mt-2 uppercase tracking-widest">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
