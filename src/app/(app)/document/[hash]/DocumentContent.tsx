'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle2, XOctagon, Copy, Check, ExternalLink,
  Loader2, AlertCircle, ShieldCheck, RotateCcw, Hash,
  Calendar, User, Tag, ArrowLeft, Download, Twitter, QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { getDocument, buildVerificationUrl, CATEGORY_NAMES, type VerifyResult } from '@/lib/verification';
import { revokeDocument } from '@/lib/stacks';
import { APP_CONFIG } from '@/lib/config';
import { RootState } from '@/lib/store';

const STACKS_GENESIS_MS = new Date('2021-01-14T00:00:00Z').getTime();

function blockToDate(block: number): string {
  if (!block) return '—';
  return new Date(STACKS_GENESIS_MS + block * 10 * 60 * 1000)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function downloadCertificate(
  hash: string,
  title: string,
  owner: string,
  category: number,
  registeredAt: number,
  isVerified: boolean,
  description?: string | null,
  expiresAt?: string | null,
) {
  const verifyUrl = buildVerificationUrl(hash);
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 580;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, 960, 580);

  // Teal left stripe
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(0, 0, 6, 580);

  // Top border line (subtle)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(6, 0, 954, 1);

  // Header band
  ctx.fillStyle = '#111111';
  ctx.fillRect(6, 0, 954, 80);

  // PaperTrail wordmark
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText('PaperTrail', 40, 38);

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#444';
  ctx.fillText('BLOCKCHAIN DOCUMENT REGISTRY', 40, 58);

  // Status badge
  const badgeX = 40;
  const badgeY = 100;
  ctx.fillStyle = isVerified ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)';
  roundRect(ctx, badgeX, badgeY, isVerified ? 130 : 110, 30, 6);
  ctx.fill();
  ctx.fillStyle = isVerified ? '#22c55e' : '#f97316';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(isVerified ? '✓  VERIFIED & ACTIVE' : '✗  REVOKED', badgeX + 12, badgeY + 20);

  // Title
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  const maxWidth = 620;
  wrapText(ctx, title, 40, 168, maxWidth, 36);

  // Description
  let detailsY = description ? 230 : 210;
  if (description) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#888';
    wrapText(ctx, description, 40, 208, maxWidth, 20);
    detailsY = 248;
  }

  // Divider
  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(40, detailsY, 540, 1);
  detailsY += 16;

  // Details grid
  const details: Array<[string, string]> = [
    ['Category', CATEGORY_NAMES[category] ?? 'Unknown'],
    ['Owner', owner.slice(0, 16) + '...' + owner.slice(-8)],
    ['Registered', blockToDate(registeredAt)],
    ['Hash', hash.slice(0, 20) + '...' + hash.slice(-12)],
  ];
  if (expiresAt) details.push(['Expires', new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]);

  details.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * 290;
    const y = detailsY + row * 56;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText(value, x, y + 18);
  });

  // QR code (attempt to load from API)
  const qrSize = 110;
  const qrX = 820;
  const qrY = 100;
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=${qrSize}x${qrSize}&bgcolor=0A0A0A&color=22d3ee&format=png&margin=6`;
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    await new Promise<void>(resolve => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
      qrImg.src = qrUrl;
    });
    if (qrImg.naturalWidth > 0) {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = '#444';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 14);
      ctx.textAlign = 'left';
    }
  } catch { /* skip QR if unavailable */ }

  // Footer
  ctx.fillStyle = '#111';
  ctx.fillRect(6, 540, 954, 40);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Anchored on the Stacks Blockchain  ·  papertrail.vercel.app', 40, 565);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Verify: ' + verifyUrl, 920, 565);
  ctx.textAlign = 'left';

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papertrail-cert-${hash.slice(0, 12)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, currentY);
}

export default function DocumentContent({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const { address, isConnected } = useSelector((state: RootState) => state.user);

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const fetchDoc = useCallback(async () => {
    setIsLoading(true);
    const res = await getDocument(hash);
    setResult(res);
    setIsLoading(false);
    // Fetch cached description & expiry
    try {
      const cr = await fetch(`/api/documents/cache?hash=${hash}`);
      if (cr.ok) {
        const cj = await cr.json();
        if (cj.document) {
          setDescription(cj.document.description ?? null);
          setExpiresAt(cj.document.expires_at ?? null);
        }
      }
    } catch { /* non-critical */ }
  }, [hash]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  const verifyUrl = buildVerificationUrl(hash);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    await revokeDocument({
      hashHex: hash,
      onFinish: () => {
        setIsRevoking(false);
        setShowRevokeConfirm(false);
        if (address) {
          const docTitle = result && result.status !== 'error' && result.status !== 'not_found' ? result.doc.title : undefined;
          fetch('/api/documents/cache', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash, owner: address, isRevoked: true }),
          }).catch(() => {});
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, type: 'revoke', title: 'Document revoked', body: docTitle ? `"${docTitle}" was revoked.` : undefined }),
          }).catch(() => {});
        }
        setTimeout(() => fetchDoc(), 3000);
      },
      onCancel: () => { setIsRevoking(false); setShowRevokeConfirm(false); },
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="text-accent animate-spin" /></div>;
  }

  if (!result || result.status === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Could not load document</h2>
        <p className="text-muted-foreground text-sm mb-6">{result?.status === 'error' ? result.message : 'Unknown error'}</p>
        <button onClick={fetchDoc} className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <RotateCcw size={13} /> Try again
        </button>
      </div>
    );
  }

  if (result.status === 'not_found') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Document not found</h2>
        <p className="text-muted-foreground text-sm mb-6">This hash has no record on PaperTrail.</p>
        <Link href="/register" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
          Register a document <ArrowLeft size={13} className="rotate-180" />
        </Link>
      </div>
    );
  }

  const { doc } = result;
  const isVerified = result.status === 'verified';
  const isOwner = isConnected && address != null && address.toLowerCase() === doc.owner.toLowerCase();
  const registeredDate = blockToDate(doc.registeredAt);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=200x200&bgcolor=0A0A0A&color=22d3ee&format=svg&margin=8`;
  const twitterText = encodeURIComponent(`"${doc.title}" is registered on PaperTrail — verified on the Stacks blockchain.\n\nVerify it: ${verifyUrl} #PaperTrail #Stacks`);

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 pb-32 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Status banner */}
      <div className={`rounded-2xl border p-5 flex items-center gap-4 ${isVerified ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
        {isVerified
          ? <ShieldCheck size={28} className="text-green-400 shrink-0" />
          : <XOctagon size={28} className="text-orange-400 shrink-0" />}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider ${isVerified ? 'text-green-400' : 'text-orange-400'}`}>
            {isVerified ? 'Verified & Active' : 'Revoked'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isVerified
              ? 'This document is registered and authentic on Stacks mainnet.'
              : `Revoked at block #${doc.revokedAt?.toLocaleString() ?? '—'}.`}
          </p>
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-2xl font-bold text-white break-words">{doc.title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-accent/30 pl-3">{description}</p>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Detail icon={<Tag size={14} />} label="Category" value={CATEGORY_NAMES[doc.category] ?? 'Unknown'} />
          <Detail icon={<User size={14} />} label="Owner" value={doc.owner} mono
            action={{ label: copiedHash ? 'Copied!' : 'Copy', onClick: handleCopyHash }} />
          <Detail icon={<Calendar size={14} />} label="Registered" value={`${registeredDate} (block #${doc.registeredAt.toLocaleString()})`} />
          {expiresAt && (
            <Detail icon={<Calendar size={14} />} label="Expires"
              value={new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          )}
          <Detail icon={<Hash size={14} />} label="Document hash" value={hash} mono small />
        </div>
      </div>

      {/* QR code (toggle) */}
      {showQr && (
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scan to verify</p>
          <img src={qrUrl} alt="Verification QR code" width={160} height={160} className="rounded-xl" />
          <p className="text-[10px] text-muted-foreground font-mono text-center break-all max-w-xs">{verifyUrl}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
        >
          {copied ? <><Check size={13} className="text-green-400" /> Copied!</> : <><Copy size={13} /> Copy verification link</>}
        </button>

        <button
          onClick={() => setShowQr(p => !p)}
          className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors ${showQr ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-border hover:bg-white/10 text-white'}`}
        >
          <QrCode size={13} /> {showQr ? 'Hide QR' : 'Show QR'}
        </button>

        <a
          href={`https://twitter.com/intent/tweet?text=${twitterText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-colors"
        >
          <Twitter size={13} /> Share on X
        </a>

        <button
          onClick={() => downloadCertificate(hash, doc.title, doc.owner, doc.category, doc.registeredAt, isVerified, description, expiresAt)}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
        >
          <Download size={13} /> Download Certificate
        </button>

        <a
          href={`${APP_CONFIG.explorerUrl}/address/${doc.owner}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
        >
          <ExternalLink size={13} /> View on Explorer
        </a>

        <Link
          href={`/verify?hash=${hash}`}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
        >
          <CheckCircle2 size={13} /> Public verify page
        </Link>
      </div>

      {/* Revoke — owner only */}
      {isOwner && isVerified && (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">
          <p className="text-sm font-semibold text-red-400 mb-1">Danger zone</p>
          <p className="text-xs text-muted-foreground mb-4">Revoking is permanent and on-chain. Anyone verifying this document will see it as revoked.</p>
          {showRevokeConfirm ? (
            <div className="flex items-center gap-3">
              <button onClick={handleRevoke} disabled={isRevoking}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40">
                {isRevoking ? <><Loader2 size={13} className="animate-spin" /> Revoking...</> : 'Confirm Revoke'}
              </button>
              <button onClick={() => setShowRevokeConfirm(false)} className="text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowRevokeConfirm(true)}
              className="text-sm px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors">
              Revoke document
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  icon, label, value, mono = false, small = false, action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`${small ? 'text-xs' : 'text-sm'} text-white ${mono ? 'font-mono break-all' : 'font-medium'}`}>{value}</p>
          {action && (
            <button onClick={action.onClick} className="text-xs text-muted-foreground hover:text-accent transition-colors shrink-0">{action.label}</button>
          )}
        </div>
      </div>
    </div>
  );
}
