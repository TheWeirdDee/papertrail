'use client';

import { CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  REGISTRATION_FEE_MICROSTX,
  COSIGN_FEE_MICROSTX,
  UPDATE_FEE_MICROSTX,
  TRANSFER_FEE_MICROSTX,
  PAPERTRAIL_CONTRACT_ADDRESS,
  PAPERTRAIL_CONTRACT_NAME,
} from '@/lib/config';

function stx(micro: number) {
  return (micro / 1_000_000).toFixed(2).replace(/\.00$/, '');
}

const ACTIONS = [
  {
    name: 'Register',
    stx: stx(REGISTRATION_FEE_MICROSTX),
    description: 'Permanently stamp a document fingerprint on-chain. Creates an immutable timestamp tied to your wallet.',
    includes: [
      'On-chain SHA-256 registration',
      'Permanent timestamp',
      'Shareable verification link',
      'Optional description + expiry (off-chain)',
    ],
    primary: true,
  },
  {
    name: 'Co-sign',
    stx: stx(COSIGN_FEE_MICROSTX),
    description: 'Add your cryptographic witness signature to any existing verified document.',
    includes: [
      'On-chain co-signer record',
      'Block-level timestamp',
      'Visible on document page',
    ],
    primary: false,
  },
  {
    name: 'Update',
    stx: stx(UPDATE_FEE_MICROSTX),
    description: 'Update the title or category of a document you own without re-registering.',
    includes: [
      'On-chain metadata update',
      'Owner-only action',
      'Preserves original registration date',
    ],
    primary: false,
  },
  {
    name: 'Transfer',
    stx: stx(TRANSFER_FEE_MICROSTX),
    description: 'Transfer document ownership to another Stacks wallet address.',
    includes: [
      'On-chain owner update',
      'Recipient can manage document',
      'Transfer history on explorer',
    ],
    primary: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(240, 10%, 3.9%)' }}>
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 py-16 md:py-24">

        {/* Header */}
        <div className="text-center mb-16 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Transparent pricing
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Pay once. Own forever.
          </h1>
          <p className="text-muted-foreground">
            No subscriptions. No monthly fees. Every action is a one-time on-chain transaction in STX.
            Verification is always free.
          </p>
        </div>

        {/* Verify — always free callout */}
        <div className="w-full max-w-3xl mb-8">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-6 py-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Verification is always free</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anyone can verify any document at{' '}
                <Link href="/verify" className="text-accent hover:underline">
                  /verify
                </Link>{' '}
                — no wallet, no account, no cost.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {ACTIONS.map(action => (
            <div
              key={action.name}
              className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                action.primary
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-heading font-bold text-white text-lg">{action.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-2xl font-black font-mono ${action.primary ? 'text-accent' : 'text-white'}`}>
                    {action.stx}
                  </span>
                  <p className="text-xs text-muted-foreground">STX</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {action.includes.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={12} className="text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Gas note */}
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-white">About network fees</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In addition to PaperTrail&apos;s contract fee, each transaction requires a small Stacks network
            gas fee (~0.001–0.003 STX). This is paid to Stacks miners and is not controlled by PaperTrail.
            Your wallet will show the total cost before you confirm any transaction.
          </p>
          <a
            href={`https://explorer.hiro.so/address/${PAPERTRAIL_CONTRACT_ADDRESS}.${PAPERTRAIL_CONTRACT_NAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            View the open-source contract on Hiro Explorer <ExternalLink size={11} />
          </a>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-black font-bold text-sm hover:opacity-90 transition-all"
          >
            Register your first document <ArrowRight size={15} />
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            You need a Stacks wallet to register.{' '}
            <a
              href="https://leather.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Get Leather Wallet
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
