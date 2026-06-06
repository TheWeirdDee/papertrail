'use client';

import { use, useState } from 'react';
import ProfileSidebar from '@/components/ProfileSidebar';
import ProfileSettingsCards from '@/components/ProfileSettingsCards';
import SecuritySection from '@/components/profile-sections/SecuritySection';
import NotificationsSection from '@/components/profile-sections/NotificationsSection';
import DataExportSection from '@/components/profile-sections/DataExportSection';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft, Zap, X } from 'lucide-react';

export default function ProfileContent({ params }: { params: Promise<{ address: string }> }) {
  const unwrappedParams = use(params);
  const targetAddress = unwrappedParams.address;
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address: currentAddress, isConnected } = useSelector((state: RootState) => state.user);

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="card p-12 bg-[#0A0A0A] border border-white/5 max-w-2xl rounded-[3rem]">
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">Connection Required</h1>
          <p className="text-gray-500 mb-8 font-medium">Please connect your Stacks wallet to view profile parameters.</p>
          <Link href="/" className="inline-block bg-[var(--color-accent)] text-black font-black py-4 px-10 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettingsCards targetAddress={targetAddress} />;
      case 'security':
        return <SecuritySection address={targetAddress} />;
      case 'notifications':
        return <NotificationsSection />;
      case 'data':
        return <DataExportSection />;
      default:
        return <ProfileSettingsCards targetAddress={targetAddress} />;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-10 px-4">
         <h1 className="text-2xl font-black text-white tracking-widest grayscale opacity-30 uppercase flex items-center gap-4">
           {activeTab.replace('-', ' ')}
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
             className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
           >
             {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5 text-[var(--color-accent)]" />}
           </button>
         </h1>
         <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
         </Link>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden mb-8 bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 z-40 relative">
           <ProfileSidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar Navigation (Cols 1-3) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-10 h-fit">
           <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content Area (Cols 4-12) */}
        <div className="lg:col-span-9 space-y-12">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
