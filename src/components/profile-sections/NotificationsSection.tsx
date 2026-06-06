'use client';

import { Bell, Mail, Smartphone, Zap } from 'lucide-react';
import { useState } from 'react';

export default function NotificationsSection() {
  const [settings, setSettings] = useState({
    dailyGm: true,
    socialAlerts: false,
    proAlerts: true
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Notification Preferences</h3>
            <Zap className="h-4 w-4 text-amber-500/40" />
         </div>

         <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                     <Bell className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">Daily Digest</p>
                     <p className="text-xs text-gray-500">Alert me when my daily document verification digest is ready</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSettings({...settings, dailyGm: !settings.dailyGm})}
                 className={`w-12 h-6 rounded-full transition-all relative ${settings.dailyGm ? 'bg-white' : 'bg-white/10'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.dailyGm ? 'right-1 bg-black' : 'left-1 bg-gray-600'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                     <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">Document Verification Alerts</p>
                     <p className="text-xs text-gray-500">Notify me when someone verifies one of my documents</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSettings({...settings, socialAlerts: !settings.socialAlerts})}
                 className={`w-12 h-6 rounded-full transition-all relative ${settings.socialAlerts ? 'bg-white' : 'bg-white/10'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.socialAlerts ? 'right-1 bg-black' : 'left-1 bg-gray-600'}`}></div>
               </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                     <Zap className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">System Alerts</p>
                     <p className="text-xs text-gray-500">Notify me of contract and protocol status updates</p>
                  </div>
               </div>
               <button 
                 onClick={() => setSettings({...settings, proAlerts: !settings.proAlerts})}
                 className={`w-12 h-6 rounded-full transition-all relative ${settings.proAlerts ? 'bg-white' : 'bg-white/10'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.proAlerts ? 'right-1 bg-black' : 'left-1 bg-gray-600'}`}></div>
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
