'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Zap, Trash2, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/store';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'gm' | 'reply' | 'follow' | 'tip' | 'streak_warning';
  actor: string;
  actor_username?: string;
  post_id?: string;
  amount?: number;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { address, isConnected, streak } = useSelector((state: RootState) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address || !isConnected) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient', address)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.warn('--- NOTIFICATIONS TABLE CHECK ---', error.message);
          if (error.code === 'PGRST116' || error.message.includes('relation "public.notifications" does not exist')) {
            console.info('Tip: Run the SQL script in src/app/api/notifications_migration.sql in your Supabase SQL Editor to create the notifications table.');
          }
          return;
        }

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications-${address}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient=eq.${address}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, isConnected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient', address)
      .eq('read', false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'gm': return <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />;
      case 'reply': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'tip': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'streak_warning': return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMessage = (n: Notification) => {
    const actorName = n.actor_username || `${n.actor.substring(0, 5)}...`;
    switch (n.type) {
      case 'gm': return <span><span className="font-black text-white">{actorName}</span> sent a GM to your post</span>;
      case 'reply': return <span><span className="font-black text-white">{actorName}</span> replied to your post</span>;
      case 'follow': return <span><span className="font-black text-white">{actorName}</span> connected with you</span>;
      case 'tip': return <span><span className="font-black text-white">{actorName}</span> tipped you {n.amount ? (n.amount/1000000).toFixed(2) : '0'} STX</span>;
      case 'streak_warning': return <span className="text-orange-400 font-bold">Your {streak}d streak is about to expire! Say GM now.</span>;
      default: return 'New activity detected';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-indigo-500 text-white text-[9px] font-black rounded-full border-2 border-black flex items-center justify-center animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[350px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Social Activity</h3>
            <button 
              onClick={() => setNotifications([])}
              className="text-[10px] font-bold text-gray-700 hover:text-red-500 transition-colors"
            >
               Clear All
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30">
                 <Bell className="h-10 w-10 text-gray-500" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {notifications.map((n) => (
                  <Link 
                    key={n.id} 
                    href={n.post_id ? `/post/${n.post_id}` : `/profile/${n.actor}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors relative group ${!n.read ? 'bg-white/[0.01]' : ''}`}
                  >
                    {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />}
                    <div className="mt-1 shrink-0">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                        {getIcon(n.type)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] leading-relaxed text-gray-400">
                        {getMessage(n)}
                      </p>
                      <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white/[0.01] text-center border-t border-white/5">
             <button className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">
                View Protocol Audit Log
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
// NOTE: ui tweak 4 - 20260523T210951Z - small spacing/responsive adjustment
// NOTE: follow-up ui tweak 4 - review responsiveness
