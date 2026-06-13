import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';
import { isValidStacksAddress } from '@/lib/utils/validation';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || !isValidStacksAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers: getSecurityHeaders() });
    }

    let client;
    try {
      client = getServiceRoleClient();
    } catch {
      client = supabase;
    }

    const { data, error } = await client
      .from('document_cache')
      .select('hash, title, category, registered_at, is_revoked, revoked_at, txid, created_at')
      .eq('owner', address.toUpperCase())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: data ?? [] }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[documents/user GET]', err?.message);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500, headers: getSecurityHeaders() });
  }
}
