import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '24'), 50);
    const category = req.nextUrl.searchParams.get('category');
    const q = req.nextUrl.searchParams.get('q');

    let db;
    try {
      db = getServiceRoleClient();
    } catch {
      db = supabase;
    }

    let query = db
      .from('document_cache')
      .select('hash, title, category, registered_at, created_at, owner')
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'all') {
      query = query.eq('category', Number(category));
    }
    if (q && q.trim()) {
      query = query.ilike('title', `%${q.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ documents: data ?? [] }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[documents/recent GET]', err?.message);
    return NextResponse.json({ documents: [] }, { headers: getSecurityHeaders() });
  }
}
