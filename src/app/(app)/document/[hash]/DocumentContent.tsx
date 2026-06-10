'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCircle2,
  XOctagon,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Hash,
  Calendar,
  User,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { bufferCV } from '@stacks/transactions';
import { getDocument, buildVerificationUrl, CATEGORY_NAMES, type VerifyResult } from '@/lib/verification';
import { callContract } from '@/lib/stacks';
import { APP_CONFIG } from '@/lib/config';
import { RootState } from '@/lib/store';

export default function DocumentContent({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);
  const { address, isConnected } = useSelector((state: RootState) => state.user);

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const fetchDoc = useCallback(async () => {
    setIsLoading(true);
    const res = await getDocument(hash);
    setResult(res);
    setIsLoading(false);
  }, [hash]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildVerificationUrl(hash));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    const hashBytes = Buffer.from(hash, 'hex');
    await callContract({
      contractAddress: APP_CONFIG.contractAddress,
      contractName: APP_CONFIG.contractName,
      functionName: 'revoke-document',
      functionArgs: [bufferCV(hashBytes)],
      onFinish: () => {
        setIsRevoking(false);
        setShowRevokeConfirm(false);
        setTimeout(() => fetchDoc(), 3000);
      },
      onCancel: () => {
        setIsRevoking(false);
        setShowRevokeConfirm(false);
      },
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
        <button
          onClick={fetchDoc}
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <RotateCcw size={13} /> Try again
        </button>
      </div>
    );
  }

  if (result.status === 'not_found') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Document not found</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This hash has no record on PaperTrail.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          Register a document <ArrowLeft size={13} className="rotate-180" />
        </Link>
      </div>
    );
  }

  const { doc } = result;
  const isVerified = result.status === 'verified';
  const isOwner =
    isConnected &&
    address != null &&
    address.toLowerCase() === doc.owner.toLowerCase();

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 pb-32 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Status banner */}
      <div
        className={`rounded-2xl border p-5 flex items-center gap-4 ${
          isVerified
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-orange-500/20 bg-orange-500/5'
        }`}
      >
        {isVerified ? (
          <ShieldCheck size={28} className="text-green-400 shrink-0" />
        ) : (
          <XOctagon size={28} className="text-orange-400 shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-bold uppercase tracking-wider ${
              isVerified ? 'text-green-400' : 'text-orange-400'
            }`}
          >
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

        <div className="grid grid-cols-1 gap-4">
          <Detail
            icon={<Tag size={14} />}
            label="Category"
            value={CATEGORY_NAMES[doc.category] ?? 'Unknown'}
          />
          <Detail
            icon={<User size={14} />}
            label="Owner"
            value={doc.owner}
            mono
          />
          <Detail
            icon={<Calendar size={14} />}
            label="Registered at block"
            value={`#${doc.registeredAt.toLocaleString()}`}
          />
          <Detail
            icon={<Hash size={14} />}
            label="Document hash"
            value={hash}
            mono
            small
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-white transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" /> Copied!
            </>
          ) : (
            <>
              <Copy size={13} /> Copy verification link
            </>
          )}
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
          <p className="text-xs text-muted-foreground mb-4">
            Revoking is permanent and on-chain. Anyone verifying this document will see it as
            revoked.
          </p>
          {showRevokeConfirm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRevoke}
                disabled={isRevoking}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {isRevoking ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Revoking...
                  </>
                ) : (
                  'Confirm Revoke'
                )}
              </button>
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="text-sm px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              Revoke document
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  mono = false,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`${small ? 'text-xs' : 'text-sm'} text-white ${
            mono ? 'font-mono break-all' : 'font-medium'
          } mt-0.5`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
