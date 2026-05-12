'use client';

import { Flame, Info, Timer, Zap, Heart, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/store';

export default function StreakCard() {
  const { streak, lastGm } = useSelector((state: RootState) => state.user);

  // Simple countdown logic (mock for UI)
  const [timeLeft, setTimeLeft] = useState("21h 14m");

  return (
    <div className="h-full glass-card p-10 flex flex-col justify-between relative overflow-hidden group bg-orange-500/[0.02] border-orange-500/10">
      
      {/* Background Aesthetic */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-[2000ms]">
        <Flame className="h-64 w-64 text-orange-500" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Flame className="h-5 w-5 fill-orange-500/20" />
             </div>
             <div>
                <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest leading-none">Social Continuity</p>
                <p className="text-sm font-bold text-white tracking-tight">Active Streak Protocol</p>
             </div>
          </div>
          
          <div className="flex items-baseline gap-3">
             <h2 className="text-8xl font-black text-white tracking-tighter tabular-nums">{streak}</h2>
             <span className="text-xl font-black text-orange-500 uppercase italic">Days</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Timer className="h-3 w-3" />
              Expires in {timeLeft}
           </div>
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              <Sparkles className="h-3 w-3" />
              5.2x RP Multiplier
           </div>
        </div>
      </div>

      <div className="relative z-10 pt-10">
         <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Streak Resilience</p>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">92% to next tier</p>
         </div>
         <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full w-[92%] shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
         </div>
      </div>

    </div>
  );
}

import { useState } from 'react';
