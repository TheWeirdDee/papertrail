'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Globe, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_NAMES } from '@/lib/verification';
import { SkeletonCard } from '@/components/Skeleton';

const STACKS_GENESIS_MS = new Date('2021-01-14T00:00:00Z').getTime();

function blockToDate(blockHeight: number): string {
  if (!blockHeight) return '—';
  const ms = STACKS_GENESIS_MS + blockHeight * 10 * 60 * 1000;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

type RecentDoc = {
  hash: string;
  title: string;
  category: number;
  registered_at: number;
  created_at: string;
  owner: string;
};

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  ...Object.entries(CATEGORY_NAMES).map(([k, v]) => ({ value: k, label: v })),
];

const CATEGORY_COLORS: Record<number, string> = {
  1: 'text-green-400 bg-green-400/10 border-green-400/20',
  2: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  3: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  4: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  5: 'text-gray-300 bg-white/5 border-white/10',
};

export default function ExploreContent() {
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '24' });
      if (category !== 'all') params.set('category', category);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await fetch(`/api/documents/recent?${params}`);
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Globe size={13} className="text-accent" />
          Public registry
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Explore Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Recently registered documents on PaperTrail — all verified on-chain.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-white placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-white focus:border-accent focus:outline-none transition-colors"
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <FileText size={36} className="text-muted-foreground mx-auto" />
          <p className="text-white font-medium">No documents found</p>
          <p className="text-sm text-muted-foreground">
            {debouncedSearch || category !== 'all'
              ? 'Try adjusting your search or category filter.'
              : 'No documents have been registered yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => {
            const catColor = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS[5];
            return (
              <Link
                key={doc.hash}
                href={`/document/${doc.hash}`}
                className="group rounded-2xl border border-white/5 bg-[#0d0d0d] p-5 flex flex-col gap-3 hover:border-accent/30 hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {doc.title}
                  </p>
                  <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
                    {CATEGORY_NAMES[doc.category] ?? 'Other'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-mono">{shortHash(doc.hash)}</p>
                  <p>{blockToDate(doc.registered_at)}</p>
                </div>

                <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">
                    {doc.owner ? `${doc.owner.slice(0, 6)}…${doc.owner.slice(-4)}` : '—'}
                  </span>
                  <span className="text-[10px] text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && docs.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {docs.length} most recent documents · All data sourced from the Stacks blockchain
        </p>
      )}
    </div>
  );
}
