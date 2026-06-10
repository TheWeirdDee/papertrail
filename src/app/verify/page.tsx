'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XOctagon,
  FileQuestion,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  FileText,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { hashFile, formatHash } from '@/lib/hash';
import {
  getDocument,
  buildVerificationUrl,
  parseVerificationUrl,
  isValidHash,
  CATEGORY_NAMES,
  type VerifyResult,
} from '@/lib/verification';
import { APP_CONFIG } from '@/lib/config';

type Mode = 'upload' | 'link';

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ hash?: string }>;
}) {
  const params = use(searchParams);

  const [mode, setMode] = useState<Mode>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentHash, setCurrentHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verify = useCallback(async (hash: string, name?: string) => {
    setIsChecking(true);
    setResult(null);
    setCurrentHash(hash);
    if (name) setFileName(name);
    const res = await getDocument(hash);
    setResult(res);
    setIsChecking(false);
  }, []);

  // Auto-verify from URL param
  useEffect(() => {
    const hash = params.hash;
    if (hash && isValidHash(hash)) {
      verify(hash.toLowerCase());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = useCallback(
    async (file: File) => {
      try {
        setIsChecking(true);
        setResult(null);
        setFileName(file.name);
        const hash = await hashFile(file);
        await verify(hash, file.name);
      } catch {
        setResult({ status: 'error', message: 'Could not read file.' });
        setIsChecking(false);
      }
    },
    [verify]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleLinkVerify = () => {
    const hash = parseVerificationUrl(linkInput);
    if (!hash) return;
    verify(hash);
  };

  const handleCopyLink = async () => {
    if (!currentHash) return;
    await navigator.clipboard.writeText(buildVerificationUrl(currentHash));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult(null);
    setCurrentHash('');
    setFileName('');
    setLinkInput('');
  };

  const explorerUrl = currentHash
    ? `${APP_CONFIG.explorerUrl}/txid/0x${currentHash}`
    : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(240, 10%, 3.9%)' }}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            No wallet required
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Verify a Document
          </h1>
          <p className="text-muted-foreground text-base">
            Anyone can verify. Upload the original file or paste a verification link — we&apos;ll check the blockchain instantly.
          </p>
        </div>

        <div className="w-full max-w-xl">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl border border-border bg-card mb-6">
            {(['upload', 'link'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                  ${mode === m
                    ? 'bg-accent text-black'
                    : 'text-muted-foreground hover:text-white'}
                `}
              >
                {m === 'upload' ? <Upload size={15} /> : <LinkIcon size={15} />}
                {m === 'upload' ? 'Upload File' : 'Paste Link'}
              </button>
            ))}
          </div>

          {/* Content area */}
          {mode === 'upload' ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isChecking && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
                ${isChecking ? 'cursor-default' : 'cursor-pointer'}
                ${isDragging
                  ? 'border-accent/70 bg-accent/5 scale-[1.01]'
                  : 'border-border hover:border-accent/40 hover:bg-white/[0.015]'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {isChecking ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-accent animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    {fileName ? `Hashing ${fileName}...` : 'Checking blockchain...'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <FileText size={22} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Drop your file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse · any file type</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">PDF</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">DOCX</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Images</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">+ more</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a PaperTrail verification link or a raw 64-character document hash.
              </p>
              <input
                type="text"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLinkVerify()}
                placeholder="https://papertrail.vercel.app/verify?hash=abc123..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-accent transition-colors"
              />
              <button
                onClick={handleLinkVerify}
                disabled={isChecking || !parseVerificationUrl(linkInput)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-all"
              >
                {isChecking ? (
                  <><Loader2 size={15} className="animate-spin" /> Checking...</>
                ) : (
                  <><ArrowRight size={15} /> Verify</>
                )}
              </button>
            </div>
          )}

          {/* Result */}
          {result && !isChecking && (
            <ResultCard
              result={result}
              hash={currentHash}
              fileName={fileName}
              copied={copied}
              onCopyLink={handleCopyLink}
              onReset={reset}
              explorerUrl={explorerUrl}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ResultCard({
  result,
  hash,
  fileName,
  copied,
  onCopyLink,
  onReset,
  explorerUrl,
}: {
  result: VerifyResult;
  hash: string;
  fileName: string;
  copied: boolean;
  onCopyLink: () => void;
  onReset: () => void;
  explorerUrl: string;
}) {
  if (result.status === 'error') {
    return (
      <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Verification Error</p>
            <p className="text-sm text-red-400 mt-1">{result.message}</p>
            <button onClick={onReset} className="mt-3 text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
              <RotateCcw size={11} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'not_found') {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <FileQuestion size={24} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">Not Registered</p>
            <p className="text-sm text-muted-foreground mt-1">
              This document has no record on PaperTrail.
            </p>
            {hash && (
              <p className="text-xs text-muted-foreground mt-2 font-mono truncate">{hash}</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <a
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
              >
                Register this document <ArrowRight size={11} />
              </a>
              <button onClick={onReset} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                <RotateCcw size={11} /> Verify another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { doc } = result;
  const isVerified = result.status === 'verified';

  return (
    <div className={`
      mt-6 rounded-2xl border p-6 transition-all
      ${isVerified
        ? 'border-green-500/20 bg-green-500/5'
        : 'border-orange-500/20 bg-orange-500/5'}
    `}>
      <div className="flex items-start gap-4">
        {isVerified ? (
          <CheckCircle2 size={24} className="text-green-400 shrink-0 mt-0.5" />
        ) : (
          <XOctagon size={24} className="text-orange-400 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-widest ${isVerified ? 'text-green-400' : 'text-orange-400'}`}>
              {isVerified ? 'Verified' : 'Revoked'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
              {CATEGORY_NAMES[doc.category] ?? 'Other'}
            </span>
          </div>

          <p className="font-heading font-bold text-white text-lg mt-1 break-words">{doc.title}</p>

          {fileName && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <FileText size={11} /> {fileName}
            </p>
          )}

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              Owner: <span className="text-white font-mono">{doc.owner.slice(0, 8)}...{doc.owner.slice(-6)}</span>
            </p>
            <p>Registered at block <span className="text-white">#{doc.registeredAt.toLocaleString()}</span></p>
            {!isVerified && doc.revokedAt && (
              <p className="text-orange-400">Revoked at block #{doc.revokedAt.toLocaleString()}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {isVerified && (
              <button
                onClick={onCopyLink}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
              >
                {copied ? <><Check size={11} className="text-green-400" /> Copied!</> : <><Copy size={11} /> Copy verification link</>}
              </button>
            )}
            <a
              href={`${APP_CONFIG.explorerUrl}/address/${doc.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
            >
              <ExternalLink size={11} /> View on Explorer
            </a>
            <button onClick={onReset} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 ml-auto transition-colors">
              <RotateCcw size={11} /> Verify another
            </button>
          </div>
        </div>
      </div>

      {hash && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground mb-1">Document hash</p>
          <p className="text-xs font-mono text-white/60 break-all">{hash}</p>
        </div>
      )}
    </div>
  );
}
