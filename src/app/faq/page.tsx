'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  REGISTRATION_FEE_MICROSTX,
  COSIGN_FEE_MICROSTX,
  UPDATE_FEE_MICROSTX,
  TRANSFER_FEE_MICROSTX,
} from '@/lib/config';

function stx(micro: number) {
  return (micro / 1_000_000).toFixed(2).replace(/\.00$/, '');
}

const FAQS = [
  {
    q: 'Is my file uploaded to your servers?',
    a: 'No. Your file never leaves your browser. PaperTrail runs SHA-256 hashing entirely client-side using the Web Crypto API. Only the 64-character fingerprint (hash) is sent to the blockchain — never the file itself.',
  },
  {
    q: 'What exactly is a "document hash"?',
    a: 'A SHA-256 hash is a deterministic 64-character fingerprint of a file. The same file always produces the same hash. If even one byte changes, the hash becomes completely different. This makes it impossible to tamper with a document without detection.',
  },
  {
    q: 'Can I delete or remove a registered document?',
    a: "No. Blockchain records are immutable — that's the point. However, you can revoke a document, which marks it as revoked on-chain. Anyone verifying it will see it was revoked and the date it was revoked. The original registration record always remains visible.",
  },
  {
    q: 'How much does it cost?',
    a: `Registration costs ${stx(REGISTRATION_FEE_MICROSTX)} STX. Co-signing costs ${stx(COSIGN_FEE_MICROSTX)} STX. Updating metadata costs ${stx(UPDATE_FEE_MICROSTX)} STX. Transferring ownership costs ${stx(TRANSFER_FEE_MICROSTX)} STX. Verification is always free — no wallet needed.`,
  },
  {
    q: 'What does "co-signing" a document mean?',
    a: 'Co-signing allows a second (or third) party to add their cryptographic signature to a document on-chain. This creates an immutable record that they have seen, reviewed, or approved the document. Useful for witness signatures, client approvals, or multi-party agreements.',
  },
  {
    q: 'Do I need a Stacks wallet to verify documents?',
    a: 'No. Verification is open to anyone. You can upload the file or paste a verification link at papertrail.app/verify and get an instant on-chain result — no wallet, no account, no login required.',
  },
  {
    q: 'What wallets are supported?',
    a: 'PaperTrail uses the Stacks blockchain. Any Stacks-compatible wallet works — including Leather (formerly Hiro Wallet), Xverse, and others that support the Stacks Connect protocol.',
  },
  {
    q: 'What is the Stacks blockchain?',
    a: "Stacks is a Bitcoin layer that enables smart contracts secured by Bitcoin finality. Every Stacks block is anchored to the Bitcoin blockchain, meaning your document registrations benefit from Bitcoin's security and immutability.",
  },
  {
    q: 'What happens if PaperTrail shuts down?',
    a: 'Your data is permanently on-chain. The smart contract is deployed on Stacks mainnet and will continue to function independently of PaperTrail the company. Anyone can read document records directly from the blockchain via the Hiro Explorer or any Stacks API.',
  },
  {
    q: 'Can I register the same document twice?',
    a: "No. The contract prevents duplicate registrations of the same hash. If you try to register a document that already exists on-chain, the transaction will fail. This also means you can't backdate a document — the first registration timestamp is permanent.",
  },
  {
    q: 'What is document "expiry"?',
    a: "Expiry is an optional off-chain label you set when registering a document. It's a reminder that appears on your dashboard — useful for contracts with renewal dates or credentials that need periodic review. It does not affect the on-chain record.",
  },
  {
    q: 'How do I transfer ownership of a document?',
    a: "From your document detail page, use the \"Transfer ownership\" panel. Enter the new owner's Stacks address and pay the transfer fee. The on-chain owner field updates immediately, and both parties can see the history via the blockchain explorer.",
  },
];

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-sm font-semibold transition-colors ${open ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-400 leading-relaxed pb-5 pr-6">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505' }}>
      <Navbar />
      <main className="flex-1 px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">

            {/* Left column */}
            <div className="lg:sticky lg:top-28 flex flex-col gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Support</p>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                  Frequently asked<br />questions
                </h1>
                <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                  Everything you need to know about PaperTrail and document verification on the blockchain.
                </p>
              </div>

              {/* Still have questions card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-white font-semibold text-base">Still have questions?</p>
                  <p className="text-gray-400 text-sm">
                    Can&apos;t find the answer you&apos;re looking for? Send us a message and we&apos;ll get back to you.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 w-fit"
                >
                  Contact us
                </Link>
              </div>
            </div>

            {/* Right column — accordion */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 divide-y-0">
              {FAQS.map((faq, i) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} defaultOpen={i === 0} />
              ))}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
