import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit } from '@/lib/utils/security';
import { isValidEmail, sanitizeInput } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: getSecurityHeaders() });
    }

    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400, headers: getSecurityHeaders() });
    }

    if (!isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400, headers: getSecurityHeaders() });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name too long.' }, { status: 400, headers: getSecurityHeaders() });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message too long.' }, { status: 400, headers: getSecurityHeaders() });
    }

    let db;
    try {
      db = getServiceRoleClient();
    } catch {
      db = supabase;
    }

    const { error } = await db.from('contact_messages').insert({
      name: sanitizeInput(name.trim()),
      email: email.trim().toLowerCase(),
      message: sanitizeInput(message.trim()),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: getSecurityHeaders() });
  } catch (err: any) {
    console.error('[contact POST]', err?.message);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500, headers: getSecurityHeaders() });
  }
}
