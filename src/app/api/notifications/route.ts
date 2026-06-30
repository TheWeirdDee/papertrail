import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';
import { isValidStacksAddress } from '@/lib/utils/validation';

const headers = getSecurityHeaders();

const VALID_TYPES = ['register', 'revoke', 'info'] as const;
type NotificationType = (typeof VALID_TYPES)[number];

function client() {
  try {
    return getServiceRoleClient();
  } catch {
    return supabase;
  }
}

// True when the table doesn't exist yet — allows graceful degradation before migration runs.
function isMissingTable(err: any): boolean {
  const msg = String(err?.message || err?.code || '').toLowerCase();
  return msg.includes('does not exist') || err?.code === '42p01' || msg.includes('not found');
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address');
    if (!address || !isValidStacksAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers });
    }

    const { data, error } = await client()
      .from('notifications')
      .select('id, type, title, body, is_read, created_at')
      .eq('address', address.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ notifications: [], unread: 0 }, { headers });
      throw error;
    }

    const notifications = data ?? [];
    const unread = notifications.filter(n => !n.is_read).length;
    return NextResponse.json({ notifications, unread }, { headers });
  } catch (err: any) {
    console.error('[notifications GET]', err?.message);
    return NextResponse.json({ notifications: [], unread: 0 }, { headers });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { address, type, title, body } = await req.json();

    if (!address || !isValidStacksAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers });
    }
    if (!VALID_TYPES.includes(type as NotificationType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400, headers });
    }
    if (!title || typeof title !== 'string' || title.length > 120) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400, headers });
    }

    const { error } = await client()
      .from('notifications')
      .insert({
        address: address.toUpperCase(),
        type,
        title,
        body: typeof body === 'string' ? body.slice(0, 280) : null,
        is_read: false,
      });

    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ ok: false, skipped: true }, { headers });
      throw error;
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (err: any) {
    console.error('[notifications POST]', err?.message);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500, headers });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !isValidStacksAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers });
    }

    const { error } = await client()
      .from('notifications')
      .update({ is_read: true })
      .eq('address', address.toUpperCase())
      .eq('is_read', false);

    if (error && !isMissingTable(error)) throw error;
    return NextResponse.json({ ok: true }, { headers });
  } catch (err: any) {
    console.error('[notifications PATCH]', err?.message);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500, headers });
  }
}
