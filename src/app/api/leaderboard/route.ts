import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'streak';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('profiles').select('*');

    if (type === 'streak') {
      query = query.order('streak', { ascending: false });
    } else if (type === 'points') {
      query = query.order('reputation', { ascending: false });
    } else if (type === 'gm_balance') {
      query = query.order('gm_balance', { ascending: false });
    } else if (type === 'impact') {
      query = query.order('total_received', { ascending: false });
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return NextResponse.json({ 
        data: data.map(u => ({
            address: u.address,
            username: u.username,
            avatar: u.avatar_url,
            streak: u.streak,
            points: u.reputation,
            gmBalance: u.gm_balance,
            totalTipped: u.total_tipped,
            totalReceived: u.total_received,
            isPro: u.reputation > 5000 // Sample logic for Pro badge in leaderboard
        }))
    });
  } catch (error: any) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
