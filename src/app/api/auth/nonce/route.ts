import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const supabase = getServiceRoleClient();
    
    await supabase.from('auth_nonces').delete().eq('address', address);

    const { error } = await supabase
      .from('auth_nonces')
      .insert([{
        address,
        nonce,
        expires_at: expiresAt
      }]);

    if (error) throw error;

    return NextResponse.json({ nonce });
  } catch (error: any) {
    console.error('Nonce generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate nonce',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
