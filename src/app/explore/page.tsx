'use client';

import ExploreContent from './ExploreContent';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505' }}>
      <Navbar />
      <main className="flex-1">
        <ExploreContent />
      </main>
      <Footer />
    </div>
  );
}
