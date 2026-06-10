'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  PlusCircle,
  ShieldCheck,
  XOctagon,
  FileText,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CATEGORY_NAMES } from '@/lib/verification';
import { APP_CONFIG } from '@/lib/config';
import { RootState } from '@/lib/store';

type CachedDoc = {
  hash: string;
  title: string;
  category: number;
  registered_at: number;
  is_revoked: boolean;
  revoked_at: number | null;
  txid: string | null;
  created_at: string;
};

export default function DashboardContent() {
  const { address } = useSelector((state: RootState) => state.user);

  const [docs, setDocs] = useState<CachedDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocs = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/user/${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load documents');
      setDocs(json.documents ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const total = docs.length;
  const verified = docs.filter(d => !d.is_revoked).length;
  const revoked = docs.filter(d => d.is_revoked).length;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 pb-32 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            Your <span className="text-white/40">Documents.</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            All documents you&apos;ve registered on PaperTrail.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-all shrink-0"
        >
          <PlusCircle size={16} /> Register Document
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Verified" value={verified} accent="green" />
        <StatCard label="Revoked" value={revoked} accent="orange" />
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-accent animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-400 text-sm py-10 justify-center">
          <AlertCircle size={16} /> {error}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <DocCard key={doc.hash} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'green' | 'orange';
}) {
  const color =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'orange'
      ? 'text-orange-400'
      : 'text-white';

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

  return (
    <Link
      href={`/document/${doc.hash}`}
      className="block rounded-2xl border border-border bg-card hover:border-white/20 hover:bg-white/[0.03] transition-all p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isPending
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : isRevoked
                ? 'bg-orange-500/10 border border-orange-500/20'
                : 'bg-green-500/10 border border-green-500/20'
            }`}
          >
            {isPending ? (
              <Clock size={14} className="text-yellow-400" />
            ) : isRevoked ? (
              <XOctagon size={14} className="text-orange-400" />
            ) : (
              <ShieldCheck size={14} className="text-green-400" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-accent transition-colors">
              {doc.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                {CATEGORY_NAMES[doc.category] ?? 'Unknown'}
              </span>
              {isPending ? (
                <span className="text-xs text-yellow-400">Confirming...</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Block #{doc.registered_at.toLocaleString()}
                </span>
              )}
              <span className="text-xs font-mono text-white/30">
                {doc.hash.slice(0, 8)}…{doc.hash.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {doc.txid && (
            <a
              href={`${APP_CONFIG.explorerUrl}/txid/0x${doc.txid}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-white transition-colors p-1"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${
              isPending ? 'text-yellow-400' : isRevoked ? 'text-orange-400' : 'text-green-400'
            }`}
          >
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
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Register your first document on Stacks to get started. It takes less than a minute.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-all"
      >
        <PlusCircle size={15} /> Register your first document
      </Link>
    </div>
  );
}
