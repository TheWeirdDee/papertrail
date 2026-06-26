import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    let db;
    try {
      db = getServiceRoleClient();
    } catch {
      db = supabase;
    }

    const { error } = await db.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[contact POST]', err?.message);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
