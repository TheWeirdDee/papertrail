import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';
import { isValidStacksAddress } from '@/lib/utils/validation';

// GET — fetch a single cached document by hash (used by document detail page for description)
export async function GET(req: NextRequest) {
  try {
    const hash = req.nextUrl.searchParams.get('hash');
    if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400, headers: getSecurityHeaders() });
    }

    let client;
    try {
      client = getServiceRoleClient();
    } catch {
      client = supabase;
    }

    const { data, error } = await client
      .from('document_cache')
      .select('hash, title, description, category, registered_at, is_revoked, revoked_at, expires_at, txid, created_at')
      .eq('hash', hash.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[documents/cache GET]', error.message);
      return NextResponse.json({ document: null }, { headers: getSecurityHeaders() });
    }

    return NextResponse.json({ document: data ?? null }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[documents/cache GET]', err?.message);
    return NextResponse.json({ document: null }, { headers: getSecurityHeaders() });
  }
}

// POST — write a newly registered document into the cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hash, owner, title, category, registeredAt, txid, description, expiresAt } = body;

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
        description: description && typeof description === 'string' && description.length <= 500
          ? description.trim() || null
          : null,
        registered_at: typeof registeredAt === 'number' ? registeredAt : 0,
        is_revoked: false,
        txid: txid ?? null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
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

// PATCH — mark a cached document as revoked
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
