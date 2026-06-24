'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle2, XOctagon, Copy, Check, ExternalLink,
  Loader2, AlertCircle, ShieldCheck, RotateCcw, Hash,
  Calendar, User, Tag, ArrowLeft, Download, X as XIcon, QrCode,
  Users, Pencil, ArrowRightLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  getDocument, buildVerificationUrl, CATEGORY_NAMES,
  getCosignerCount, isCosigner, type VerifyResult,
} from '@/lib/verification';
import {
  revokeDocument, coSignDocument, updateDocument, transferDocument,
} from '@/lib/stacks';
import {
  APP_CONFIG,
  COSIGN_FEE_MICROSTX, UPDATE_FEE_MICROSTX, TRANSFER_FEE_MICROSTX,
} from '@/lib/config';
import { isValidStacksAddress } from '@/lib/utils/validation';
import { RootState } from '@/lib/store';

const CATEGORIES = Object.entries(CATEGORY_NAMES).map(([id, name]) => ({ id: Number(id), name }));
const stx = (micro: number) => `${(micro / 1_000_000).toFixed(2)} STX`;

const STACKS_GENESIS_MS = new Date('2021-01-14T00:00:00Z').getTime();
function blockToDate(block: number): string {
  if (!block) return '—';
  return new Date(STACKS_GENESIS_MS + block * 10 * 60 * 1000)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Canvas certificate download ───────────────────────────────────────────────

async function downloadCertificate(
  hash: string, title: string, owner: string, category: number,
  registeredAt: number, isVerified: boolean,
  description?: string | null, expiresAt?: string | null,
) {
  const verifyUrl = buildVerificationUrl(hash);
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 580;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, 960, 580);
  ctx.fillStyle = '#22d3ee'; ctx.fillRect(0, 0, 6, 580);
  ctx.fillStyle = '#111111'; ctx.fillRect(6, 0, 954, 80);
  ctx.font = 'bold 22px system-ui, sans-serif'; ctx.fillStyle = '#22d3ee';
  ctx.fillText('PaperTrail', 40, 38);
  ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#444';
  ctx.fillText('BLOCKCHAIN DOCUMENT REGISTRY', 40, 58);

  const badgeX = 40, badgeY = 100;
  ctx.fillStyle = isVerified ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)';
  roundRect(ctx, badgeX, badgeY, isVerified ? 130 : 110, 30, 6); ctx.fill();
  ctx.fillStyle = isVerified ? '#22c55e' : '#f97316';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(isVerified ? '✓  VERIFIED & ACTIVE' : '✗  REVOKED', badgeX + 12, badgeY + 20);

  ctx.font = 'bold 28px system-ui, sans-serif'; ctx.fillStyle = '#ffffff';
  wrapText(ctx, title, 40, 168, 620, 36);

  let detailsY = description ? 230 : 210;
  if (description) {
    ctx.font = '14px system-ui, sans-serif'; ctx.fillStyle = '#888';
    wrapText(ctx, description, 40, 208, 620, 20);
    detailsY = 248;
  }

  ctx.fillStyle = '#1f1f1f'; ctx.fillRect(40, detailsY, 540, 1); detailsY += 16;

  const details: Array<[string, string]> = [
    ['Category', CATEGORY_NAMES[category] ?? 'Unknown'],
    ['Owner', owner.slice(0, 16) + '...' + owner.slice(-8)],
    ['Registered', blockToDate(registeredAt)],
    ['Hash', hash.slice(0, 20) + '...' + hash.slice(-12)],
  ];
  if (expiresAt) details.push(['Expires', new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]);

  details.forEach(([label, value], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * 290, y = detailsY + row * 56;
    ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = '#555';
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#ccc';
    ctx.fillText(value, x, y + 18);
  });

  try {
    const qrSize = 110, qrX = 820, qrY = 100;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=${qrSize}x${qrSize}&bgcolor=0A0A0A&color=22d3ee&format=png&margin=6`;
    const qrImg = new Image(); qrImg.crossOrigin = 'anonymous';
    await new Promise<void>(resolve => { qrImg.onload = qrImg.onerror = () => resolve(); qrImg.src = qrUrl; });
    if (qrImg.naturalWidth > 0) {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#444';
      ctx.textAlign = 'center'; ctx.fillText('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 14);
      ctx.textAlign = 'left';
    }
  } catch { /* skip QR if unavailable */ }

  ctx.fillStyle = '#111'; ctx.fillRect(6, 540, 954, 40);
  ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#333';
  ctx.fillText('Anchored on the Stacks Blockchain  ·  papertrail.vercel.app', 40, 565);
  ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.fillText('Verify: ' + verifyUrl, 920, 565);
  ctx.textAlign = 'left';

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `papertrail-cert-${hash.slice(0, 12)}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '', currentY = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY); line = word; currentY += lineHeight;
    } else { line = test; }
  }
  ctx.fillText(line, x, currentY);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentContent({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const { address, isConnected } = useSelector((state: RootState) => state.user);

  const [result, setResult]                   = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [copied, setCopied]                   = useState(false);
  const [copiedHash, setCopiedHash]           = useState(false);
  const [isRevoking, setIsRevoking]           = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showQr, setShowQr]                   = useState(false);

  // Off-chain cache data
  const [description, setDescription]         = useState<string | null>(null);
  const [expiresAt, setExpiresAt]             = useState<string | null>(null);

  // Co-sign state
  const [cosignerCount, setCosignerCount]     = useState(0);
  const [alreadyCosigned, setAlreadyCosigned] = useState(false);
  const [isCosigning, setIsCosigning]         = useState(false);

  // Update metadata state
  const [showUpdate, setShowUpdate]           = useState(false);
  const [updateTitle, setUpdateTitle]         = useState('');
  const [updateCategory, setUpdateCategory]   = useState(5);
  const [isUpdating, setIsUpdating]           = useState(false);

  // Transfer ownership state
  const [showTransfer, setShowTransfer]       = useState(false);
  const [transferTo, setTransferTo]           = useState('');
  const [isTransferring, setIsTransferring]   = useState(false);
  const [transferError, setTransferError]     = useState('');

  const fetchDoc = useCallback(async () => {
    setIsLoading(true);
    const res = await getDocument(hash);
    setResult(res);
    setIsLoading(false);

    // Fetch off-chain metadata (fire-and-forget errors)
    fetch(`/api/documents/cache?hash=${hash}`)
      .then(r => r.json())
      .then(data => {
        if (data?.document) {
          setDescription(data.document.description ?? null);
          setExpiresAt(data.document.expires_at ?? null);
        }
      })
      .catch(() => {});

    // Cosigner data
    const count = await getCosignerCount(hash);
    setCosignerCount(count);

    if (isConnected && address) {
      const signed = await isCosigner(hash, address);
      setAlreadyCosigned(signed);
    }
  }, [hash, isConnected, address]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  useEffect(() => {
    if (showUpdate && result && result.status !== 'error' && result.status !== 'not_found') {
      setUpdateTitle(result.doc.title);
      setUpdateCategory(result.doc.category);
    }
  }, [showUpdate, result]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildVerificationUrl(hash));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    await revokeDocument({
      hashHex: hash,
      onFinish: () => {
        setIsRevoking(false); setShowRevokeConfirm(false);
        if (address) {
          const docTitle = result && result.status !== 'error' && result.status !== 'not_found'
            ? result.doc.title : undefined;
          fetch('/api/documents/cache', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash, owner: address, isRevoked: true }),
          }).catch(() => {});
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address, type: 'revoke', title: 'Document revoked',
              body: docTitle ? `"${docTitle}" was revoked.` : undefined,
            }),
          }).catch(() => {});
        }
        setTimeout(() => fetchDoc(), 3000);
      },
      onCancel: () => { setIsRevoking(false); setShowRevokeConfirm(false); },
    });
  };

  const handleCoSign = async () => {
    setIsCosigning(true);
    await coSignDocument({
      hashHex: hash,
      onFinish: () => { setIsCosigning(false); setAlreadyCosigned(true); setCosignerCount(c => c + 1); },
      onCancel: () => { setIsCosigning(false); },
    });
  };

  const handleUpdate = async () => {
    if (!updateTitle.trim() || isUpdating) return;
    setIsUpdating(true);
    await updateDocument({
      hashHex: hash, title: updateTitle.trim(), category: updateCategory,
      onFinish: () => { setIsUpdating(false); setShowUpdate(false); setTimeout(() => fetchDoc(), 3000); },
      onCancel: () => { setIsUpdating(false); },
    });
  };

  const handleTransfer = async () => {
    setTransferError('');
    if (!isValidStacksAddress(transferTo.trim())) {
      setTransferError('Enter a valid Stacks address (starts with SP or ST).'); return;
    }
    if (transferTo.trim().toLowerCase() === address?.toLowerCase()) {
      setTransferError('Cannot transfer to yourself.'); return;
    }
    setIsTransferring(true);
    await transferDocument({
      hashHex: hash, newOwner: transferTo.trim(),
      onFinish: () => { setIsTransferring(false); setShowTransfer(false); setTransferTo(''); setTimeout(() => fetchDoc(), 3000); },
      onCancel: () => { setIsTransferring(false); },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!result || result.status === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Could not load document</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {result?.status === 'error' ? result.message : 'Unknown error'}
        </p>
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
  const verifyUrl = buildVerificationUrl(hash);
  const tweetText = encodeURIComponent(`I just verified "${doc.title}" on PaperTrail — anchored on the Stacks blockchain.\n\nVerify it yourself: ${verifyUrl} #PaperTrail #Stacks`);

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 pb-32 space-y-6">
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Status banner */}
      <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
        isVerified ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'
      }`}>
        {isVerified
          ? <ShieldCheck size={28} className="text-green-400 shrink-0" />
          : <XOctagon size={28} className="text-orange-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold uppercase tracking-wider ${isVerified ? 'text-green-400' : 'text-orange-400'}`}>
            {isVerified ? 'Verified & Active' : 'Revoked'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isVerified
              ? 'This document is registered and authentic on Stacks mainnet.'
              : `Revoked at block #${doc.revokedAt?.toLocaleString() ?? '—'}.`}
          </p>
        </div>
        {cosignerCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-accent font-semibold shrink-0">
            <Users size={13} /> {cosignerCount} co-signer{cosignerCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Expiry warning */}
      {isVerified && expiresAt && (() => {
        const d = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
        return d <= 30 ? (
          <div className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            d <= 0
              ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
          }`}>
            <AlertCircle size={13} />
            {d <= 0 ? 'This document has expired.' : `Expires in ${d} day${d !== 1 ? 's' : ''} (${new Date(expiresAt).toLocaleDateString()}).`}
          </div>
        ) : null;
      })()}

      {/* Details card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-2xl font-bold text-white break-words">{doc.title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-b border-border pb-4">{description}</p>
        )}
        <div className="grid grid-cols-1 gap-4">
          <Detail icon={<Tag size={14} />} label="Category" value={CATEGORY_NAMES[doc.category] ?? 'Unknown'} />
          <Detail icon={<User size={14} />} label="Owner" value={doc.owner} mono />
          <Detail
            icon={<Calendar size={14} />}
            label="Registered"
            value={blockToDate(doc.registeredAt)}
            subValue={`block #${doc.registeredAt.toLocaleString()}`}
          />
          {expiresAt && (
            <Detail icon={<Calendar size={14} />} label="Expires" value={new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          )}
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground mt-0.5 shrink-0"><Hash size={14} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Document hash</p>
              <p className="text-xs text-white font-mono break-all mt-0.5">{hash}</p>
            </div>
            <button onClick={handleCopyHash}
              className="text-muted-foreground hover:text-white transition-colors shrink-0 p-1 mt-0.5">
              {copiedHash ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleCopyLink}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors">
          {copied ? <><Check size={13} className="text-green-400" /> Copied!</> : <><Copy size={13} /> Copy link</>}
        </button>

        <a href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors">
          <XIcon size={13} /> Share on X
        </a>

        <button onClick={() => setShowQr(v => !v)}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors">
          <QrCode size={13} /> {showQr ? 'Hide QR' : 'QR Code'}
        </button>

        <button
          onClick={() => downloadCertificate(hash, doc.title, doc.owner, doc.category, doc.registeredAt, isVerified, description, expiresAt)}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors">
          <Download size={13} /> Certificate
        </button>

        <a href={`${APP_CONFIG.explorerUrl}/txid/${doc.registeredAt}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors">
          <ExternalLink size={13} /> Explorer
        </a>

        <Link href={`/verify?hash=${hash}`}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors">
          <CheckCircle2 size={13} /> Public verify
        </Link>
      </div>

      {/* QR Code */}
      {showQr && (
        <div className="flex flex-col items-center gap-3 py-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=200x200&bgcolor=0A0A0A&color=22d3ee&format=png&margin=8`}
            alt="QR code"
            width={200} height={200}
            className="rounded-xl border border-border"
          />
          <p className="text-xs text-muted-foreground">Scan to verify this document</p>
        </div>
      )}

      {/* ── Co-sign panel (non-owners) ──────────────────────────────── */}
      {isConnected && isVerified && !isOwner && (
        <div className="rounded-2xl border border-accent/10 bg-accent/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-accent">Co-sign this document</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your cryptographic signature to endorse this document's authenticity on-chain.
                Costs {stx(COSIGN_FEE_MICROSTX)}.
              </p>
            </div>
            <Users size={16} className="text-accent shrink-0 mt-0.5" />
          </div>
          {alreadyCosigned ? (
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-semibold">
              <Check size={14} /> You have co-signed this document
            </div>
          ) : (
            <button onClick={handleCoSign} disabled={isCosigning}
              className="mt-4 flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-colors disabled:opacity-40">
              {isCosigning ? <><Loader2 size={13} className="animate-spin" /> Waiting for wallet…</> : <>Co-sign · {stx(COSIGN_FEE_MICROSTX)}</>}
            </button>
          )}
        </div>
      )}

      {/* ── Owner actions ────────────────────────────────────────────── */}
      {isOwner && isVerified && (
        <div className="space-y-3">
          {/* Update metadata */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => setShowUpdate(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-white hover:bg-white/[0.02] transition-colors">
              <span className="flex items-center gap-2 font-semibold">
                <Pencil size={14} className="text-muted-foreground" />
                Update title / category
                <span className="text-xs text-muted-foreground font-normal">· {stx(UPDATE_FEE_MICROSTX)}</span>
              </span>
              {showUpdate ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showUpdate && (
              <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">New title</label>
                  <input type="text" value={updateTitle} onChange={e => setUpdateTitle(e.target.value.slice(0, 100))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-accent outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select value={updateCategory} onChange={e => setUpdateCategory(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-accent outline-none transition-colors">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={handleUpdate}
                  disabled={isUpdating || !updateTitle.trim() || (updateTitle === doc.title && updateCategory === doc.category)}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors disabled:opacity-40">
                  {isUpdating ? <><Loader2 size={13} className="animate-spin" /> Waiting for wallet…</> : <>Save · {stx(UPDATE_FEE_MICROSTX)}</>}
                </button>
              </div>
            )}
          </div>

          {/* Transfer ownership */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => { setShowTransfer(v => !v); setTransferError(''); }}
              className="w-full flex items-center justify-between px-5 py-4 text-sm text-white hover:bg-white/[0.02] transition-colors">
              <span className="flex items-center gap-2 font-semibold">
                <ArrowRightLeft size={14} className="text-muted-foreground" />
                Transfer ownership
                <span className="text-xs text-muted-foreground font-normal">· {stx(TRANSFER_FEE_MICROSTX)}</span>
              </span>
              {showTransfer ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showTransfer && (
              <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Transfer this document to another Stacks wallet. The recipient becomes the on-chain owner. Permanent.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Recipient address</label>
                  <input type="text" value={transferTo}
                    onChange={e => { setTransferTo(e.target.value); setTransferError(''); }}
                    placeholder="SP... or ST..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-accent outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground" />
                </div>
                {transferError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={11} /> {transferError}
                  </p>
                )}
                <button onClick={handleTransfer} disabled={isTransferring || !transferTo.trim()}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-white/5 border border-border text-white hover:bg-white/10 transition-colors disabled:opacity-40">
                  {isTransferring ? <><Loader2 size={13} className="animate-spin" /> Waiting for wallet…</> : <>Transfer · {stx(TRANSFER_FEE_MICROSTX)}</>}
                </button>
              </div>
            )}
          </div>

          {/* Revoke */}
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">
            <p className="text-sm font-semibold text-red-400 mb-1">Danger zone</p>
            <p className="text-xs text-muted-foreground mb-4">
              Revoking is permanent and on-chain. Anyone verifying this document will see it as revoked.
            </p>
            {showRevokeConfirm ? (
              <div className="flex items-center gap-3">
                <button onClick={handleRevoke} disabled={isRevoking}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40">
                  {isRevoking ? <><Loader2 size={13} className="animate-spin" /> Revoking…</> : 'Confirm Revoke'}
                </button>
                <button onClick={() => setShowRevokeConfirm(false)}
                  className="text-sm text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setShowRevokeConfirm(true)}
                className="text-sm px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors">
                Revoke document
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon, label, value, subValue, mono = false, small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`${small ? 'text-xs' : 'text-sm'} text-white ${mono ? 'font-mono break-all' : 'font-medium'} mt-0.5`}>
          {value}
        </p>
        {subValue && <p className="text-[10px] text-white/30 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
