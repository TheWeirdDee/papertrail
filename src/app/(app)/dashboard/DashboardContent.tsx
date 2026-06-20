'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  PlusCircle, ShieldCheck, XOctagon, FileText, Clock,
  ExternalLink, Loader2, AlertCircle, Search, Download,
  SlidersHorizontal, X, AlertTriangle,
} from 'lucide-react';
import { CATEGORY_NAMES, getDocumentsByOwner } from '@/lib/verification';
import { APP_CONFIG } from '@/lib/config';
import { RootState } from '@/lib/store';

type CachedDoc = {
  hash: string;
  title: string;
  description?: string | null;
  category: number;
  registered_at: number;
  is_revoked: boolean;
  revoked_at: number | null;
  expires_at?: string | null;
  txid: string | null;
  created_at: string;
};

const STACKS_GENESIS_MS = new Date('2021-01-14T00:00:00Z').getTime();

function blockToDate(blockHeight: number, createdAt?: string): string {
  if (createdAt) {
    return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (!blockHeight) return '—';
  return new Date(STACKS_GENESIS_MS + blockHeight * 10 * 60 * 1000)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function exportCSV(docs: CachedDoc[]) {
  const header = ['Title', 'Description', 'Category', 'Status', 'Hash', 'Registered', 'Expires', 'TXID'];
  const rows = docs.map(d => [
    d.title,
    d.description ?? '',
    CATEGORY_NAMES[d.category] ?? 'Unknown',
    d.is_revoked ? 'Revoked' : d.registered_at === 0 ? 'Pending' : 'Active',
    d.hash,
    d.created_at ? new Date(d.created_at).toLocaleDateString() : '',
    d.expires_at ? new Date(d.expires_at).toLocaleDateString() : '',
    d.txid || '',
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `papertrail-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DashboardContent() {
  const { address } = useSelector((state: RootState) => state.user);
  const [docs, setDocs] = useState<CachedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked' | 'pending'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/user/${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load documents');
      const cached: CachedDoc[] = json.documents ?? [];
      setDocs(cached);
      setIsLoading(false);

      try {
        const onchain = await getDocumentsByOwner(address);
        if (onchain.length === 0) return;
        const byHash = new Map<string, CachedDoc>();
        for (const d of cached) byHash.set(d.hash.toLowerCase(), d);
        for (const d of onchain) {
          const key = d.hash.toLowerCase();
          const existing = byHash.get(key);
          byHash.set(key, {
            hash: key,
            title: d.title || existing?.title || 'Untitled',
            description: existing?.description ?? null,
            category: d.category || existing?.category || 5,
            registered_at: d.registeredAt,
            is_revoked: d.isRevoked,
            revoked_at: d.revokedAt,
            expires_at: existing?.expires_at ?? null,
            txid: existing?.txid ?? null,
            created_at: existing?.created_at ?? new Date().toISOString(),
          });
        }
        const merged = Array.from(byHash.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setDocs(merged);
      } catch { /* best-effort */ }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const expiringSoon = docs.filter(d =>
    !d.is_revoked && d.expires_at && daysUntil(d.expires_at) <= 30 && daysUntil(d.expires_at) > 0
  );

  const filtered = docs.filter(d => {
    const q = search.trim().toLowerCase();
    if (q && !d.title.toLowerCase().includes(q) && !d.hash.includes(q)) return false;
    if (filterCat && d.category !== filterCat) return false;
    if (filterStatus === 'active' && (d.is_revoked || d.registered_at === 0)) return false;
    if (filterStatus === 'revoked' && !d.is_revoked) return false;
    if (filterStatus === 'pending' && d.registered_at !== 0) return false;
    return true;
  });

  const total = docs.length;
  const verified = docs.filter(d => !d.is_revoked && d.registered_at !== 0).length;
  const revoked = docs.filter(d => d.is_revoked).length;
  const hasActiveFilters = search || filterCat || filterStatus !== 'all';

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 pb-32 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            Your <span className="text-white/40">Documents.</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">All documents you&apos;ve registered on PaperTrail.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {docs.length > 0 && (
            <button
              onClick={() => exportCSV(docs)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white text-sm font-medium hover:bg-white/10 transition-all"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
          <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-all">
            <PlusCircle size={16} /> Register
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Verified" value={verified} accent="green" />
        <StatCard label="Revoked" value={revoked} accent="orange" />
      </div>

      {expiringSoon.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-yellow-400">
              {expiringSoon.length} document{expiringSoon.length > 1 ? 's' : ''} expiring soon:
            </span>
            <span className="text-yellow-400/70 ml-1">
              {expiringSoon.map(d => `"${d.title}" (${daysUntil(d.expires_at!)}d)`).join(', ')}
            </span>
          </div>
        </div>
      )}

      {!isLoading && docs.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or hash…"
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters || filterCat || filterStatus !== 'all'
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-muted-foreground hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} /> Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-card border border-border">
              <select
                value={filterCat}
                onChange={e => setFilterCat(Number(e.target.value))}
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              >
                <option value={0}>All Categories</option>
                {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {(['all', 'active', 'revoked', 'pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                      filterStatus === s ? 'bg-accent text-black' : 'bg-background border border-border text-muted-foreground hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setFilterCat(0); setFilterStatus('all'); }}
                  className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white border border-border bg-background transition-colors ml-auto"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="text-accent animate-spin" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-400 text-sm py-10 justify-center"><AlertCircle size={16} /> {error}</div>
      ) : docs.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No documents match your search.{' '}
          <button onClick={() => { setSearch(''); setFilterCat(0); setFilterStatus('all'); }} className="text-accent hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => <DocCard key={doc.hash} doc={doc} />)}
          {filtered.length < docs.length && (
            <p className="text-xs text-muted-foreground text-center pt-2">Showing {filtered.length} of {docs.length} documents</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'orange' }) {
  const color = accent === 'green' ? 'text-green-400' : accent === 'orange' ? 'text-orange-400' : 'text-white';
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function DocCard({ doc }: { doc: CachedDoc }) {
  const isPending = doc.registered_at === 0;
  const isRevoked = doc.is_revoked;
  const dateStr = isPending ? 'Confirming…' : blockToDate(doc.registered_at, doc.created_at);
  const expiryDays = doc.expires_at ? daysUntil(doc.expires_at) : null;
  const isExpiringSoon = expiryDays !== null && expiryDays <= 30 && expiryDays > 0;
  const isExpired = expiryDays !== null && expiryDays <= 0;

  return (
    <Link href={`/document/${doc.hash}`} className="block rounded-2xl border border-border bg-card hover:border-white/20 hover:bg-white/[0.03] transition-all p-5 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPending ? 'bg-yellow-500/10 border border-yellow-500/20'
              : isRevoked ? 'bg-orange-500/10 border border-orange-500/20'
              : 'bg-green-500/10 border border-green-500/20'
          }`}>
            {isPending ? <Clock size={14} className="text-yellow-400" />
              : isRevoked ? <XOctagon size={14} className="text-orange-400" />
              : <ShieldCheck size={14} className="text-green-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-accent transition-colors">{doc.title}</p>
            {doc.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.description}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{CATEGORY_NAMES[doc.category] ?? 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
              {isExpired && <span className="text-xs text-red-400 font-medium">Expired</span>}
              {isExpiringSoon && <span className="text-xs text-yellow-400 font-medium">Expires in {expiryDays}d</span>}
              <span className="text-xs font-mono text-white/30">{doc.hash.slice(0, 8)}…{doc.hash.slice(-6)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc.txid && (
            <a href={`${APP_CONFIG.explorerUrl}/txid/0x${doc.txid}`} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-white transition-colors p-1">
              <ExternalLink size={13} />
            </a>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wide ${
            isPending ? 'text-yellow-400' : isRevoked ? 'text-orange-400' : 'text-green-400'
          }`}>
            {isPending ? 'Pending' : isRevoked ? 'Revoked' : 'Active'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-border flex items-center justify-center mb-4">
        <FileText size={22} className="text-muted-foreground" />
      </div>
      <h3 className="text-white font-semibold mb-1">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">Register your first document on Stacks to get started.</p>
      <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-all">
        <PlusCircle size={15} /> Register your first document
      </Link>
    </div>
  );
}
