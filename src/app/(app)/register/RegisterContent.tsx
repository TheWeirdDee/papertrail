'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  FileText, Check, Loader2, AlertCircle, ChevronDown,
  ArrowRight, X, Plus, Trash2, Copy, ExternalLink, Layers,
} from 'lucide-react';
import { hashFile, formatHash } from '@/lib/hash';
import { CATEGORY_NAMES, buildVerificationUrl } from '@/lib/verification';
import { registerDocument, getStxBalance } from '@/lib/stacks';
import { REGISTRATION_FEE_MICROSTX } from '@/lib/config';
import { RootState } from '@/lib/store';

const FEE_STX = Number(REGISTRATION_FEE_MICROSTX) / 1_000_000;
const CATEGORIES = Object.entries(CATEGORY_NAMES).map(([id, name]) => ({ id: Number(id), name }));

type BatchItem = {
  id: string;
  file: File;
  hash: string;
  title: string;
  status: 'hashing' | 'ready' | 'submitting' | 'done' | 'failed';
  txid?: string;
};

export default function RegisterContent() {
  const router = useRouter();
  const { isConnected, address } = useSelector((state: RootState) => state.user);

  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // single mode state
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(5);
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txid, setTxid] = useState('');
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null | undefined>(undefined);
  const [copiedLink, setCopiedLink] = useState(false);

  // batch mode state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchCategory, setBatchCategory] = useState(5);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchCurrent, setBatchCurrent] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (isConnected && address) {
      getStxBalance(address).then(b => { if (active) setBalance(b); });
    } else {
      setBalance(undefined);
    }
    return () => { active = false; };
  }, [isConnected, address]);

  const insufficientBalance = typeof balance === 'number' && balance < REGISTRATION_FEE_MICROSTX;

  // ── Single mode ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setHash('');
    setError('');
    setIsHashing(true);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    try {
      const h = await hashFile(f);
      setHash(h);
    } catch {
      setError('Could not read file. Please try again.');
    } finally {
      setIsHashing(false);
    }
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (mode !== 'single') return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile, mode]);

  const reset = () => {
    setFile(null); setHash(''); setTitle(''); setDescription('');
    setCategory(5); setExpiresAt(''); setTxid(''); setError('');
  };

  const handleSubmit = async () => {
    if (!hash || !title.trim() || !isConnected || insufficientBalance) return;
    setIsSubmitting(true);
    setError('');
    try {
      await registerDocument({
        hashHex: hash,
        title: title.trim(),
        category,
        onFinish: (data: any) => {
          setTxid(data.txId);
          setIsSubmitting(false);
          fetch('/api/documents/cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hash, owner: address, title: title.trim(), category,
              registeredAt: 0, txid: data.txId,
              description: description.trim() || null,
              expiresAt: expiresAt || null,
            }),
          }).catch(() => {});
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address, type: 'register', title: 'Document registered',
              body: `"${title.trim()}" was submitted to PaperTrail.`,
            }),
          }).catch(() => {});
        },
        onCancel: () => { setIsSubmitting(false); },
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const canSubmit = hash && title.trim().length > 0 && title.trim().length <= 100
    && isConnected && !insufficientBalance && !isSubmitting;

  // ── Batch mode ───────────────────────────────────────────────────────────

  const handleBatchFiles = useCallback(async (files: FileList) => {
    const newItems: BatchItem[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      hash: '',
      title: f.name.replace(/\.[^.]+$/, ''),
      status: 'hashing' as const,
    }));
    setBatchItems(prev => [...prev, ...newItems]);
    for (const item of newItems) {
      try {
        const h = await hashFile(item.file);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, hash: h, status: 'ready' } : i));
      } catch {
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'failed' } : i));
      }
    }
  }, []);

  const updateBatchTitle = (id: string, val: string) =>
    setBatchItems(prev => prev.map(i => i.id === id ? { ...i, title: val.slice(0, 100) } : i));

  const removeBatchItem = (id: string) =>
    setBatchItems(prev => prev.filter(i => i.id !== id));

  const handleRegisterAll = async () => {
    const readyItems = batchItems.filter(i => i.status === 'ready' && i.title.trim());
    if (!readyItems.length) return;
    setBatchProcessing(true);
    for (let idx = 0; idx < readyItems.length; idx++) {
      const item = readyItems[idx];
      setBatchCurrent(idx);
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'submitting' } : i));
      await new Promise<void>(resolve => {
        registerDocument({
          hashHex: item.hash,
          title: item.title.trim(),
          category: batchCategory,
          onFinish: (data: any) => {
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', txid: data.txId } : i));
            fetch('/api/documents/cache', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hash: item.hash, owner: address, title: item.title.trim(),
                category: batchCategory, registeredAt: 0, txid: data.txId,
              }),
            }).catch(() => {});
            resolve();
          },
          onCancel: () => {
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'failed' } : i));
            resolve();
          },
        }).catch(() => {
          setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'failed' } : i));
          resolve();
        });
      });
    }
    setBatchProcessing(false);
    setBatchCurrent(-1);
  };

  const batchReadyCount = batchItems.filter(i => i.status === 'ready' && i.title.trim()).length;

  // ── Success screen ───────────────────────────────────────────────────────

  if (txid) {
    const verifyUrl = buildVerificationUrl(hash);
    const tweetText = encodeURIComponent(
      `Just registered "${title}" on PaperTrail — verified on the Stacks blockchain.\n\nVerify it: ${verifyUrl} #PaperTrail #Stacks`
    );
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Registration Sent</h2>
        <p className="text-muted-foreground text-sm mb-2">Your document is being registered on Stacks mainnet.</p>
        <p className="text-xs font-mono text-white/40 break-all mb-8">{txid}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <a
            href={`https://twitter.com/intent/tweet?text=${tweetText}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[#1DA1F2] text-sm font-semibold hover:bg-[#1DA1F2]/20 transition-colors"
          >
            <X size={15} /> Share on X
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(verifyUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-border text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            {copiedLink
              ? <><Check size={15} className="text-green-400" /> Copied!</>
              : <><Copy size={15} /> Copy verification link</>}
          </button>
          <a
            href={`/document/${hash}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            <ExternalLink size={15} /> View document
          </a>
        </div>

        <button onClick={reset} className="text-sm text-muted-foreground hover:text-white transition-colors">
          Register another document →
        </button>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 pb-32 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
          Register a <span className="text-white/40">Document.</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Your file is hashed locally — it never leaves your device. Only the hash, title, and
          category are stored on-chain for {FEE_STX} STX.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-card w-fit">
        {(['single', 'batch'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-accent text-black' : 'text-muted-foreground hover:text-white'
            }`}>
            {m === 'single' ? <FileText size={14} /> : <Layers size={14} />}
            {m === 'single' ? 'Single' : 'Batch'}
          </button>
        ))}
      </div>

      {/* ── SINGLE MODE ──────────────────────────────────────────── */}
      {mode === 'single' && (
        <>
          {/* Step 1 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step 1 — Choose file
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isHashing && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-accent/70 bg-accent/5 scale-[1.01]'
                  : 'border-border hover:border-accent/40 hover:bg-white/[0.015]'
              }`}
            >
              <input ref={fileInputRef} type="file" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
              {isHashing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="text-accent animate-spin" />
                  <p className="text-sm text-muted-foreground">Hashing {file?.name}...</p>
                </div>
              ) : file && hash ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <Check size={18} className="text-green-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatHash(hash)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); reset(); }}
                    className="text-muted-foreground hover:text-white transition-colors p-1 shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <FileText size={22} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Drop your document here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse · any file type</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {['PDF', 'DOCX', 'Images', '+ more'].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className={`space-y-4 transition-opacity ${hash ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step 2 — Document details
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Title</span>
                <span className={`text-xs ${title.length > 90 ? 'text-orange-400' : 'text-muted-foreground'}`}>{title.length}/100</span>
              </div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value.slice(0, 100))}
                placeholder="e.g. Employment Contract Q2 2026"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-accent transition-colors outline-none" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Description <span className="text-muted-foreground">(optional, off-chain)</span>
                </span>
                <span className={`text-xs ${description.length > 450 ? 'text-orange-400' : 'text-muted-foreground'}`}>{description.length}/500</span>
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
                rows={3} placeholder="Add notes, context, or client details — stored in PaperTrail only, not on-chain"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-accent transition-colors outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-white/70">Category</span>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(Number(e.target.value))}
                    className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent transition-colors outline-none pr-10 cursor-pointer">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-white/70">
                  Expiry date <span className="text-muted-foreground">(optional)</span>
                </span>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent transition-colors outline-none [color-scheme:dark]" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-white/60">Your privacy is protected.</strong> Only the SHA-256
              hash of your file, your chosen title, and category are written on-chain. The original
              file never leaves your device.
            </div>

            {insufficientBalance && (
              <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3 text-orange-400 text-sm">
                <AlertCircle size={14} className="shrink-0" />
                <span>
                  You need at least {FEE_STX} STX to register. Your balance is{' '}
                  {((balance as number) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })} STX.
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-all">
              {isSubmitting
                ? <><Loader2 size={15} className="animate-spin" /> Waiting for wallet...</>
                : <>Register for {FEE_STX} STX <ArrowRight size={15} /></>}
            </button>
          </div>
        </>
      )}

      {/* ── BATCH MODE ───────────────────────────────────────────── */}
      {mode === 'batch' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-xs text-muted-foreground">
            Add multiple files. Each will be hashed locally and registered as a separate on-chain
            transaction at {FEE_STX} STX each. Your wallet will prompt for each one in sequence.
          </div>

          {batchItems.length > 0 && (
            <div className="space-y-2">
              {batchItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                    {item.status === 'hashing' && <Loader2 size={13} className="text-accent animate-spin" />}
                    {item.status === 'ready' && <FileText size={13} className="text-muted-foreground" />}
                    {item.status === 'submitting' && <Loader2 size={13} className="text-yellow-400 animate-spin" />}
                    {item.status === 'done' && <Check size={13} className="text-green-400" />}
                    {item.status === 'failed' && <X size={13} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input type="text" value={item.title}
                      onChange={e => updateBatchTitle(item.id, e.target.value)}
                      disabled={item.status !== 'ready'}
                      placeholder="Document title"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground disabled:opacity-50" />
                    {item.hash && (
                      <p className="text-[10px] font-mono text-white/30 truncate">{item.hash.slice(0, 16)}…</p>
                    )}
                    {item.txid && (
                      <p className="text-[10px] font-mono text-green-400 truncate">txid: {item.txid.slice(0, 16)}…</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${
                    item.status === 'done' ? 'text-green-400' :
                    item.status === 'failed' ? 'text-red-400' :
                    item.status === 'submitting' ? 'text-yellow-400' :
                    item.status === 'hashing' ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {item.status === 'hashing' ? 'Hashing…' :
                     item.status === 'submitting' ? `(${idx + 1})` :
                     item.status}
                  </span>
                  {(item.status === 'ready' || item.status === 'failed') && (
                    <button onClick={() => removeBatchItem(item.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 p-1">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input ref={batchInputRef} type="file" multiple className="hidden"
            onChange={e => { if (e.target.files?.length) handleBatchFiles(e.target.files); e.target.value = ''; }} />
          <button onClick={() => batchInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/40 text-sm text-muted-foreground hover:text-white transition-all">
            <Plus size={16} /> Add files
          </button>

          {batchItems.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm text-white/70">Category for all</span>
                <div className="relative">
                  <select value={batchCategory} onChange={e => setBatchCategory(Number(e.target.value))}
                    className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent transition-colors outline-none pr-10 cursor-pointer">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {insufficientBalance && (
                <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3 text-orange-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    Insufficient STX. Need at least {(batchReadyCount * FEE_STX).toFixed(4)} STX
                    for {batchReadyCount} document{batchReadyCount !== 1 ? 's' : ''}.
                  </span>
                </div>
              )}

              <button
                onClick={handleRegisterAll}
                disabled={!batchReadyCount || batchProcessing || insufficientBalance || !isConnected}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-all"
              >
                {batchProcessing
                  ? <><Loader2 size={15} className="animate-spin" /> Registering {batchCurrent + 1} of {batchReadyCount}…</>
                  : <>Register {batchReadyCount} document{batchReadyCount !== 1 ? 's' : ''} · {(batchReadyCount * FEE_STX).toFixed(4)} STX <ArrowRight size={15} /></>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
