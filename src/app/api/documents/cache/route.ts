import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';
import { isValidStacksAddress } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hash, owner, title, category, registeredAt, txid } = body;

    if (!hash || typeof hash !== 'string' || !/^[0-9a-f]{64}$/i.test(hash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400, headers: getSecurityHeaders() });
    }
    if (!owner || !isValidStacksAddress(owner)) {
      return NextResponse.json({ error: 'Invalid owner address' }, { status: 400, headers: getSecurityHeaders() });
    }
    if (!title || typeof title !== 'string' || title.length > 100) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400, headers: getSecurityHeaders() });
    }
    if (!category || typeof category !== 'number' || category < 1 || category > 5) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400, headers: getSecurityHeaders() });
    }

    let db;
    try {
      db = getServiceRoleClient();
    } catch {
      console.warn('[documents/cache POST] service role key not configured — cache write skipped');
      return NextResponse.json({ ok: true, cached: false }, { headers: getSecurityHeaders() });
    }

    const { error } = await db.from('document_cache').upsert(
      {
        hash: hash.toLowerCase(),
        owner: owner.toUpperCase(),
        title,
        category,
        registered_at: typeof registeredAt === 'number' ? registeredAt : 0,
        is_revoked: false,
        txid: txid ?? null,
      },
      { onConflict: 'hash' }
    );

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[documents/cache POST]', err?.message);
    return NextResponse.json({ error: 'Failed to cache document' }, { status: 500, headers: getSecurityHeaders() });
  }
}

// PATCH — mark a cached document as revoked. Owner-scoped to prevent tampering
// with other wallets' rows. The contract remains the source of truth.
export async function PATCH(req: NextRequest) {
  try {
    const { hash, owner, isRevoked } = await req.json();

    if (!hash || typeof hash !== 'string' || !/^[0-9a-f]{64}$/i.test(hash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400, headers: getSecurityHeaders() });
    }
    if (!owner || !isValidStacksAddress(owner)) {
      return NextResponse.json({ error: 'Invalid owner address' }, { status: 400, headers: getSecurityHeaders() });
    }

    let db;
    try {
      db = getServiceRoleClient();
    } catch {
      console.warn('[documents/cache PATCH] service role key not configured');
      return NextResponse.json({ ok: true, cached: false }, { headers: getSecurityHeaders() });
    }
    const { error } = await db
      .from('document_cache')
      .update({ is_revoked: isRevoked === true })
      .eq('hash', hash.toLowerCase())
      .eq('owner', owner.toUpperCase());

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[documents/cache PATCH]', err?.message);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500, headers: getSecurityHeaders() });
  }
}
