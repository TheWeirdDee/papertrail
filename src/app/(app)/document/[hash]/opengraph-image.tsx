import { ImageResponse } from 'next/og';
import { getDocument } from '@/lib/verification';

export const runtime = 'edge';
export const alt = 'PaperTrail Document Verification';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Education',
  2: 'Professional',
  3: 'Financial',
  4: 'Property',
  5: 'General',
};

export default async function OgImage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;

  let title = 'Document';
  let category = 'General';
  let status: 'verified' | 'revoked' | 'not_found' = 'not_found';

  try {
    const result = await getDocument(hash);
    if (result.status === 'verified' || result.status === 'revoked') {
      title = result.doc.title;
      category = CATEGORY_NAMES[result.doc.category] ?? 'General';
      status = result.status;
    }
  } catch {
    // keep defaults
  }

  const isVerified = status === 'verified';
  const isRevoked = status === 'revoked';
  const shortHash = `${hash.slice(0, 12)}…${hash.slice(-8)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#080808',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: '#22c55e',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>PaperTrail</span>
          </div>
          {/* Status badge */}
          {(isVerified || isRevoked) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 100,
                background: isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
                border: `1px solid ${isVerified ? 'rgba(34,197,94,0.4)' : 'rgba(249,115,22,0.4)'}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 100,
                  background: isVerified ? '#22c55e' : '#f97316',
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isVerified ? '#22c55e' : '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {isVerified ? 'Verified' : 'Revoked'}
              </span>
            </div>
          )}
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              fontSize: 13,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            {category}
          </span>
          <h1
            style={{
              fontSize: title.length > 50 ? 44 : 56,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: 0,
              maxWidth: 900,
            }}
          >
            {title}
          </h1>
          <span style={{ fontSize: 14, color: '#4b5563', fontFamily: 'monospace' }}>
            {shortHash}
          </span>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Blockchain document verification · Secured by Bitcoin
          </span>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
            papertrail.app/verify
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
