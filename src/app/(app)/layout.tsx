'use client';

import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useState, useEffect } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
      <div className="flex flex-col h-screen bg-black overflow-hidden">
        {/* AppHeader is at the top of the flex-col container */}
        <AppHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex flex-1 max-w-[1800px] mx-auto w-full lg:px-6 relative overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden pb-20 lg:pb-10 scrollbar-hide">
            {children}
          </main>
        </div>
      </div>
  );
}
