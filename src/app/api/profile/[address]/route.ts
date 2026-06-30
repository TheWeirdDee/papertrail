import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders } from '@/lib/utils/security';
import { isValidStacksAddress } from '@/lib/utils/validation';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: targetAddress } = await params;

    if (!targetAddress || !isValidStacksAddress(targetAddress)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const supabase = getServiceRoleClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('address, username, bio, avatar_url, website, created_at')
      .eq('address', targetAddress)
      .maybeSingle();

    if (profileError) throw profileError;

    return NextResponse.json(
      {
        data: {
          ...(profile || { address: targetAddress }),
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
        },
      },
      { headers: getSecurityHeaders() }
    );
  } catch (error: any) {
    console.error('Fetch profile API error:', error?.message);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
