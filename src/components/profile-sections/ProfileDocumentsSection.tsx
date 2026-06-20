'use client';

import { useEffect, useState } from 'react';
import { FileText, ExternalLink, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_NAMES } from '@/lib/verification';

type Doc = {
  hash: string;
  title: string;
  category: number;
  registered_at: number;
  is_revoked: boolean;
  expires_at: string | null;
  txid: string | null;
  created_at: string;
};

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ doc }: { doc: Doc }) {
  if (doc.is_revoked) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
        <XCircle size={10} /> Revoked
      </span>
    );
  }
  if (doc.expires_at) {
    const d = daysUntil(doc.expires_at);
    if (d <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={10} /> Expired
        </span>
      );
    }
    if (d <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
          <Clock size={10} /> Expires in {d}d
        </span>
      );
    }
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
      <CheckCircle2 size={10} /> Verified
    </span>
  );
}

export default function ProfileDocumentsSection({ address }: { address: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/documents/user/${address}`)
      .then(r => r.json())
      .then(data => {
        setDocs(data.documents ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load documents.');
        setLoading(false);
      });
  }, [address]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Registered Documents</h3>
          <FileText className="h-4 w-4 text-gray-700" />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm">
            Loading…
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-white/60 font-bold text-sm">No documents yet</p>
              <p className="text-gray-600 text-xs mt-1">Documents registered on-chain will appear here.</p>
            </div>
            <Link href="/register"
              className="mt-2 px-5 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:bg-accent/90 transition-colors">
              Register a document
            </Link>
          </div>
        )}

        {!loading && !error && docs.length > 0 && (
          <div className="space-y-3">
            {docs.map(doc => (
              <Link key={doc.hash} href={`/document/${doc.hash}`}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{doc.title}</p>
                    <p className="text-[10px] text-gray-600 font-mono truncate">{doc.hash.slice(0, 20)}…</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-600">
                        {CATEGORY_NAMES[doc.category] ?? 'Unknown'} · {formatDate(doc.created_at)}
                      </span>
                      {doc.expires_at && (
                        <span className="text-[10px] text-gray-600">· expires {formatDate(doc.expires_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <StatusBadge doc={doc} />
                  <ExternalLink size={13} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && docs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
            <span>{docs.length} document{docs.length !== 1 ? 's' : ''} registered</span>
            <Link href="/register" className="text-accent hover:text-accent/80 font-bold transition-colors">
              + Register another
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
