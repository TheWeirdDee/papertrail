import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: targetAddress } = await params;
    const { searchParams } = new URL(req.url);
    const observer = searchParams.get('observer'); // The user viewing the profile

    const supabase = getServiceRoleClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('address, username, bio, avatar_url, website, created_at')
      .eq('address', targetAddress)
      .maybeSingle();

    if (profileError) throw profileError;

    return NextResponse.json({
      data: {
        ...(profile || { address: targetAddress }),
        followersCount: 0,
        followingCount: 0,
        isFollowing: false
      }
    });

  } catch (error: any) {
    console.error('Fetch profile API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
