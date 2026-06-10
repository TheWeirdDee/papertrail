'use client';

import dynamic from 'next/dynamic';
import { Lock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';

const RegisterContent = dynamic(() => import('./RegisterContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]" />
    </div>
  ),
});

export default function RegisterPage() {
  const { isConnected } = useSelector((state: RootState) => state.user);

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="card p-6 md:p-12 bg-[#0A0A0A] border-[var(--color-border)] max-w-2xl w-full">
          <Lock className="h-12 w-12 md:h-16 md:w-16 text-gray-700 mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl font-black text-white mb-4">Wallet Required</h1>
          <p className="text-gray-400 mb-8 text-sm md:text-base">
            Connect your Stacks wallet to register documents on-chain.
          </p>
          <Link
            href="/"
            className="inline-block w-full sm:w-auto bg-[var(--color-accent)] text-black font-black py-4 px-10 rounded-2xl hover:bg-opacity-90 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return <RegisterContent />;
}
