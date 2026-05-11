import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import * as jose from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { content, txId, mediaUrl, pollData } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.LOCAL_SESSION_SECRET) {
      throw new Error('LOCAL_SESSION_SECRET is not configured');
    }
    const secret = new TextEncoder().encode(process.env.LOCAL_SESSION_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      clockTolerance: 300 // 5 minutes tolerance for drift
    });
    const sessionAddress = payload.address as string;

    const supabase = getServiceRoleClient();

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: lastPost, error: rateError } = await supabase
      .from('posts')
      .select('created_at, content')
      .eq('address', sessionAddress)
      .gt('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastPost) {
      return NextResponse.json({ error: 'Please wait 30 seconds between posts' }, { status: 429 });
    }

    if (content) {
      const twoMinutesAgo = new Date(Date.now() - 120 * 1000).toISOString();
      const { data: dupPost } = await supabase
        .from('posts')
        .select('id')
        .eq('address', sessionAddress)
        .eq('content', content)
        .gt('created_at', twoMinutesAgo)
        .limit(1)
        .maybeSingle();

      if (dupPost) {
        return NextResponse.json({ error: 'Duplicate post detected. Please vary your content.' }, { status: 409 });
      }
    }

    const finalContent = content || (mediaUrl || pollData ? '' : 'Said GM!');

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        address: sessionAddress,
        content: finalContent,
        media_url: mediaUrl,
        poll_data: pollData,
        tx_id: txId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Create post API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
