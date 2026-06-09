'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  User, 
  Settings, 
  Shield, 
  Wallet, 
  Globe, 
  Bell, 
  Smartphone,
  Save,
  Loader2,
  ExternalLink,
  ChevronRight,
  Database,
  Camera,
  AtSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { updateStats } from '@/lib/features/userSlice';
import IdentityAvatar from '@/components/IdentityAvatar';

export default function SettingsContent() {
  const dispatch = useDispatch();
  const { address, username, avatar, bio, isConnected } = useSelector((state: RootState) => state.user);
  const [activeTab, setActiveTab] = useState<'identity' | 'network' | 'security'>('identity');
  
  const [formData, setFormData] = useState({
    username: username || '',
    bio: bio || '',
    avatar: avatar || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      username: username || '',
      bio: bio || '',
      avatar: avatar || ''
    });
  }, [username, bio, avatar]);

  const handleSave = async () => {
    if (!address) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('papertrail_session_token');
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          address: address,
          username: formData.username,
          bio: formData.bio,
          avatar_url: formData.avatar,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      dispatch(updateStats({
        username: data.username,
        bio: data.bio,
        avatar: data.avatar_url
      }));

      toast.success("Identity synchronized with blockchain metadata", {
        icon: '💎',
        style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to sync identity");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'identity', name: 'Identity Node', icon: User },
    { id: 'network', name: 'Network Config', icon: Globe },
    { id: 'security', name: 'Protocol Security', icon: Shield },
  ];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6 opacity-30">
        <Settings className="h-16 w-16 text-gray-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Connect Wallet to Access Node Settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-12 pb-32 reveal">
      
      {/* 1. Header Area */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-10">
         <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
               Node <span className="text-white/40">Settings.</span>
            </h1>
            <p className="text-gray-500 font-medium">Manage your protocol identity and network parameters.</p>
         </div>
         
         <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white text-black font-black px-10 py-5 rounded-2xl flex items-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl disabled:opacity-50"
            >
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Synchronize Changes
            </button>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
         
         {/* 2. Navigation Sidebar */}
         <div className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-2xl' 
                    : 'text-gray-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-4">
                   <tab.icon className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{tab.name}</span>
                </div>
                <ChevronRight className={`h-3 w-3 transition-transform ${activeTab === tab.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
         </div>

         {/* 3. Main Configuration Pane */}
         <div className="lg:col-span-9 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {activeTab === 'identity' && (
              <div className="space-y-12">
                 {/* Avatar Upload Preview */}
                 <div className="glass-card p-10 bg-white/[0.01] flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group cursor-pointer">
                       <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <IdentityAvatar address={address || ''} src={formData.avatar} size="lg" className="h-32 w-32 border-4 border-white/5 !rounded-[2.5rem] relative z-10" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20">
                          <div className="p-3 rounded-xl bg-black/60 backdrop-blur-md">
                             <Camera className="h-5 w-5 text-white" />
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                       <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">Public Avatar</h3>
                       <p className="text-gray-600 text-xs font-medium leading-relaxed">Recommended size: 400x400. This identity will be synchronized across the Stacks social graph.</p>
                       <input 
                         type="text" 
                         value={formData.avatar}
                         onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                         placeholder="Image URL (IPFS/HTTPS)" 
                         className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-5 text-xs text-gray-400 focus:outline-none focus:border-white/10 transition-all"
                       />
                    </div>
                 </div>

                 {/* Identity Fields */}
                 <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1 flex items-center gap-2">
                          <AtSign className="h-3 w-3" />
                          Protocol Username
                       </label>
                       <input 
                         type="text" 
                         value={formData.username}
                         onChange={(e) => setFormData({...formData, username: e.target.value})}
                         placeholder="your_handle"
                         className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-5 px-8 text-lg font-black text-white placeholder:text-gray-800 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.03] transition-all"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1 flex items-center gap-2">
                          <AtSign className="h-3 w-3" />
                          Broadcast Biography
                       </label>
                       <textarea 
                         rows={4}
                         value={formData.bio}
                         onChange={(e) => setFormData({...formData, bio: e.target.value})}
                         placeholder="Tell the protocol who you are..."
                         className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-5 px-8 text-sm font-medium text-gray-300 placeholder:text-gray-800 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.03] transition-all resize-none"
                       />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="space-y-8">
                 <div className="glass-card p-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Stacks Node Connection</h3>
                          <p className="text-xs text-gray-500 font-medium">Configure your primary RPC endpoint.</p>
                       </div>
                       <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                          <Database className="h-4 w-4" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-4">
                             <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-sm font-black text-white uppercase tracking-widest">Hiro Mainnet API</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-600">api.mainnet.hiro.so</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'security' && (
               <div className="glass-card p-10 flex flex-col items-center justify-center py-32 space-y-6 opacity-30 text-center">
                  <Shield className="h-12 w-12 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Protocol Shield Active</h3>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Governance & Pro Features are locked to your principal.</p>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
