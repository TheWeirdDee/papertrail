'use client';

import { useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  X,
} from 'lucide-react';
import { bufferCV, stringAsciiCV, uintCV } from '@stacks/transactions';
import { hashFile, formatHash } from '@/lib/hash';
import { CATEGORY_NAMES } from '@/lib/verification';
import { callContract } from '@/lib/stacks';
import { APP_CONFIG, REGISTRATION_FEE_MICROSTX } from '@/lib/config';
import { RootState } from '@/lib/store';

const CATEGORIES = Object.entries(CATEGORY_NAMES).map(([id, name]) => ({
  id: Number(id),
  name,
}));

export default function RegisterContent() {
  const router = useRouter();
  const { isConnected, address } = useSelector((state: RootState) => state.user);

  const { isConnected } = useSelector((state: RootState) => state.user);
 

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txid, setTxid] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setHash('');
    setError('');
    setIsHashing(true);
    try {
      const h = await hashFile(f);
      setHash(h);
    } catch {
      setError('Could not read file. Please try again.');
    } finally {
      setIsHashing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const reset = () => {
    setFile(null);
    setHash('');
    setTitle('');
    setCategory(5);
    setTxid('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!hash || !title.trim() || !isConnected) return;
    setIsSubmitting(true);
    setError('');

    try {
      const hashBytes = Buffer.from(hash, 'hex');
      await callContract({
        contractAddress: APP_CONFIG.contractAddress,
        contractName: APP_CONFIG.contractName,
        functionName: 'register-document',
        functionArgs: [
          bufferCV(hashBytes),
          stringAsciiCV(title.trim()),
          uintCV(BigInt(category)),
        ],
        onFinish: (data: any) => {
          setTxid(data.txId);
          setIsSubmitting(false);
          // Write to Supabase cache (fire-and-forget)
          fetch('/api/documents/cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hash,
              owner: address,
              title: title.trim(),
              category,
              registeredAt: 0,
              txid: data.txId,
            }),
          }).catch(() => {/* non-critical */});
          setTimeout(() => {
            router.push(`/app/document/${hash}`);
          }, 1500);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    hash &&
    title.trim().length > 0 &&
    title.trim().length <= 100 &&
    isConnected &&
    !isSubmitting;

  if (txid) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Registration Sent</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your document is being registered on Stacks mainnet. Redirecting...
        </p>
        <p className="text-xs font-mono text-white/40 break-all">{txid}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8 pb-32">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
          Register a <span className="text-white/40">Document.</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Your file is hashed locally — it never leaves your device. Only the hash, title, and
          category are stored on-chain for {Number(REGISTRATION_FEE_MICROSTX) / 1_000_000} STX.
        </p>
      </div>

      {/* Step 1 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step 1 — Choose file
        </label>
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isHashing && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
            ${
              isDragging
                ? 'border-accent/70 bg-accent/5 scale-[1.01]'
                : 'border-border hover:border-accent/40 hover:bg-white/[0.015]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
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
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  reset();
                }}
                className="text-muted-foreground hover:text-white transition-colors p-1 shrink-0"
              >
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
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2 */}
      <div
        className={`space-y-4 transition-opacity ${
          hash ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step 2 — Document details
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Title</span>
            <span
              className={`text-xs ${title.length > 90 ? 'text-orange-400' : 'text-muted-foreground'}`}
            >
              {title.length}/100
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 100))}
            placeholder="e.g. Employment Contract Q2 2026"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-accent transition-colors outline-none"
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm text-white/70">Category</span>
          <div className="relative">
            <select
              value={category}
              onChange={e => setCategory(Number(e.target.value))}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-accent transition-colors outline-none pr-10 cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
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

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Waiting for wallet...
            </>
          ) : (
            <>
              Register for 0.05 STX <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
