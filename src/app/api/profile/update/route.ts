import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import * as jose from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { 
      username, 
      bio, 
      avatar_url, 
      website,
      streak,
      reputation,
      gm_balance,
      total_tipped,
      total_received
    } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.LOCAL_SESSION_SECRET) {
      throw new Error('LOCAL_SESSION_SECRET is not configured');
    }
    const secret = new TextEncoder().encode(process.env.LOCAL_SESSION_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const sessionAddress = payload.address as string;

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        address: sessionAddress,
        username,
        bio,
        avatar_url,
        website,
        streak: streak || 0,
        reputation: reputation || 0,
        gm_balance: gm_balance || 0,
        total_tipped: total_tipped || 0,
        total_received: total_received || 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
