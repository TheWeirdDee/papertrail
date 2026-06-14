'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FileText, Users, ShieldCheck, XOctagon } from 'lucide-react';
import StatCardVertical from '@/components/StatCardVertical';
import AnalyticsGraph, { type CategoryDatum } from '@/components/AnalyticsGraph';
import { getStats, getDocumentsByOwner, CATEGORY_NAMES } from '@/lib/verification';
import { RootState } from '@/lib/store';

export default function AnalyticsPulse() {
  const { address, isConnected } = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState({ totalRegistrations: 0, totalUniqueOwners: 0 });
  const [mine, setMine] = useState({ total: 0, active: 0, revoked: 0 });
  const [categories, setCategories] = useState<CategoryDatum[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const stats = await getStats();
      if (active) setPlatform(stats);

      if (isConnected && address) {
        const docs = await getDocumentsByOwner(address);
        if (!active) return;

        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let revoked = 0;
        for (const d of docs) {
          counts[d.category] = (counts[d.category] ?? 0) + 1;
          if (d.isRevoked) revoked++;
        }
        setMine({ total: docs.length, active: docs.length - revoked, revoked });
        setCategories(
          Object.entries(CATEGORY_NAMES).map(([id, name]) => ({
            name,
            value: counts[Number(id)] ?? 0,
          }))
        );
      } else {
        setMine({ total: 0, active: 0, revoked: 0 });
        setCategories(
          Object.values(CATEGORY_NAMES).map(name => ({ name, value: 0 }))
        );
      }

      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [address, isConnected]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-12 pb-32 reveal">
      <section className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
          Analytics <span className="text-white/40">Pulse.</span>
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Live numbers straight from the PaperTrail contract on Stacks.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardVertical
          label="Total Registered"
          value={platform.totalRegistrations.toLocaleString()}
          icon={FileText}
          subtext="Documents anchored platform-wide"
          isLoading={loading}
        />
        <StatCardVertical
          label="Unique Owners"
          value={platform.totalUniqueOwners.toLocaleString()}
          icon={Users}
          subtext="Wallets using PaperTrail"
          accentColor="#a855f7"
          isLoading={loading}
        />
        <StatCardVertical
          label="Your Active"
          value={mine.active.toLocaleString()}
          icon={ShieldCheck}
          subtext={isConnected ? 'Your verified documents' : 'Connect a wallet to view'}
          accentColor="#22c55e"
          isLoading={loading}
        />
        <StatCardVertical
          label="Your Revoked"
          value={mine.revoked.toLocaleString()}
          icon={XOctagon}
          subtext={isConnected ? 'Documents you revoked' : 'Connect a wallet to view'}
          accentColor="#f97316"
          isLoading={loading}
        />
      </section>

      <section>
        <AnalyticsGraph title="Your Documents by Category" data={categories} />
      </section>
    </div>
  );
}
