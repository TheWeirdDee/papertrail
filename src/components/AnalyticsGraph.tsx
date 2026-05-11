'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

export default function AnalyticsGraph() {
  const { streak, points, address, isPro, isOptimisticPro } = useSelector((state: RootState) => state.user);
  const feed = useSelector((state: RootState) => state.posts.feed);
  
  const userPosts = useMemo(() => {
    const lowerAddress = address?.toLowerCase();
    return feed.filter(p => p.authorAddress?.toLowerCase() === lowerAddress);
  }, [feed, address]);

  const hasActivity = userPosts.length > 0 || streak > 0;

  const chartPoints = useMemo(() => {
    const days = 30;
    const data: { day: number; active: boolean; label: string }[] = [];

    const postDates = new Set(userPosts.map(p => 
      new Date(p.timestamp).toISOString().split('T')[0]
    ));

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      
      let active = postDates.has(isoDate) || i < (streak || 0);

      data.push({ day: days - i, active, label });
    }
    return data;
  }, [userPosts]);

  const activeCount = chartPoints.filter(p => p.active).length;
  const totalDays = chartPoints.length;

  const svgPoints = chartPoints.map((p, i) => ({
    x: (i / (chartPoints.length - 1)) * 100,
    y: p.active ? 20 : 85,
    ...p,
  }));

  const pathD = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y}`).join(' ');

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden group">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white mb-1">GM Activity</h3>
          <p className="text-gray-500 text-xs md:text-sm">
            {hasActivity
              ? `Your last ${streak} active day${streak !== 1 ? 's' : ''} — ${activeCount} GMs in 30 days`
              : 'No GM activity recorded yet — say your first GM!'}
          </p>
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">30 Days</span>
          <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        </div>
      </div>

      {!hasActivity ? (
        <div className="h-40 flex flex-col items-center justify-center gap-3 border border-dashed border-white/5 rounded-2xl">
          <div className="h-10 w-10 rounded-full bg-white/[0.03] flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-gray-700" />
          </div>
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Say GM to start your chart</p>
        </div>
      ) : (
        <>
          <div className="relative h-32 md:h-44 w-full mt-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              {[20, 50, 85].map(val => (
                <line key={val} x1="0" y1={val} x2="100" y2={val}
                  stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
              ))}

              {/* Fill area */}
              <path
                d={`${pathD} L 100 100 L 0 100 Z`}
                fill="url(#areagradient)"
                opacity="0.15"
              />

              {/* Main Line */}
              <path d={pathD} fill="none" stroke="url(#linegradient)"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Active dots */}
              {svgPoints.filter(p => p.active).map((p, i) => (
                <circle key={i} cx={p.x.toFixed(1)} cy={p.y} r="2"
                  fill="var(--color-accent)"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ transitionDelay: `${i * 20}ms` }}
                />
              ))}

              <defs>
                <linearGradient id="linegradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-secondary)" />
                </linearGradient>
                <linearGradient id="areagradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>

            {/* Live badge */}
            <div className="absolute top-2 right-0 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse inline-block" />
              {activeCount} Active
            </div>
          </div>

          {/* Summary bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-4">
            {[
              { label: 'Streak', value: `${streak}d` },
              { label: 'This Month', value: `${activeCount} GMs` },
              { label: 'Reputation', value: `${(points / 10).toFixed(1)} RP` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
