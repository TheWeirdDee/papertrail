'use client';

import dynamic from 'next/dynamic';

const DocumentContent = dynamic(() => import('./DocumentContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]" />
    </div>
  ),
});

export default function DocumentPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  return <DocumentContent params={params} />;
}
