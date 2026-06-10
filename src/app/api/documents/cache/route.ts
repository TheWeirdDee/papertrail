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

    const db = getServiceRoleClient();

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
