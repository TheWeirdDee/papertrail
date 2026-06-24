'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
    a: 'No. Blockchain records are immutable — that\'s the point. However, you can revoke a document, which marks it as revoked on-chain. Anyone verifying it will see it was revoked and the date it was revoked. The original registration record always remains visible.',
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
    a: 'Stacks is a Bitcoin layer that enables smart contracts secured by Bitcoin finality. Every Stacks block is anchored to the Bitcoin blockchain, meaning your document registrations benefit from Bitcoin\'s security and immutability.',
  },
  {
    q: 'What happens if PaperTrail shuts down?',
    a: 'Your data is permanently on-chain. The smart contract is deployed on Stacks mainnet and will continue to function independently of PaperTrail the company. Anyone can read document records directly from the blockchain via the Hiro Explorer or any Stacks API.',
  },
  {
    q: 'Can I register the same document twice?',
    a: 'No. The contract prevents duplicate registrations of the same hash. If you try to register a document that already exists on-chain, the transaction will fail. This also means you can\'t backdate a document — the first registration timestamp is permanent.',
  },
  {
    q: 'What is document "expiry"?',
    a: 'Expiry is an optional off-chain label you set when registering a document. It\'s a reminder that appears on your dashboard — useful for contracts with renewal dates or credentials that need periodic review. It does not affect the on-chain record.',
  },
  {
    q: 'How do I transfer ownership of a document?',
    a: 'From your document detail page, use the "Transfer ownership" panel. Enter the new owner\'s Stacks address and pay the transfer fee. The on-chain owner field updates immediately, and both parties can see the history via the blockchain explorer.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(240, 10%, 3.9%)' }}>
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 py-16 md:py-24">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Frequently Asked Questions
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Got questions?
            </h1>
            <p className="text-muted-foreground">
              Everything you need to know about PaperTrail and document verification.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card px-6">
            {FAQS.map(faq => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Still have questions?{' '}
            <a
              href="mailto:support@papertrail.app"
              className="text-accent hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
