/**
 * Feed Endpoint
 * Returns algorithmic or chronological feed of posts
 * Includes authentication, rate limiting, and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getSecurityHeaders, checkRateLimit, extractBearerToken } from '@/lib/utils/security';
import { createErrorResponse, createSuccessResponse, logError, isValidAmount } from '@/lib/utils/errors';
import { isValidStacksAddress } from '@/lib/utils/validation';
import * as jose from 'jose';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 100, 60000)) {
      return NextResponse.json(
        createErrorResponse(429, 'Too many requests', 'RATE_LIMITED'),
        { status: 429, headers: { ...getSecurityHeaders() } }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '20';
    const cursor = searchParams.get('cursor');

    // Validate limit
    const limit = parseInt(limitParam);
    if (!isValidAmount(limit, 1, 100)) {
      return NextResponse.json(
        createErrorResponse(400, 'Limit must be between 1 and 100', 'INVALID_LIMIT'),
        { status: 400, headers: { ...getSecurityHeaders() } }
      );
    }

    // Validate cursor if provided
    if (cursor && cursor.length > 0) {
      try {
        new Date(cursor);
      } catch {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid cursor format', 'INVALID_CURSOR'),
          { status: 400, headers: { ...getSecurityHeaders() } }
        );
      }
    }

    // Authenticate user if token provided
    const authHeader = req.headers.get('Authorization');
    let sessionAddress: string | null = null;

    if (authHeader) {
      const token = extractBearerToken(authHeader);
      if (token) {
        try {
          const secret = process.env.LOCAL_SESSION_SECRET;
          if (!secret || secret.length < 32) {
            throw new Error('JWT secret not configured');
          }

          const jwtSecret = new TextEncoder().encode(secret);
          const { payload } = await jose.jwtVerify(token, jwtSecret, {
            clockTolerance: 300
          });

          if (payload.address && typeof payload.address === 'string') {
            if (isValidStacksAddress(payload.address)) {
              sessionAddress = payload.address;
            }
          }
        } catch (error: any) {
          logError('FEED - token verification', error);
          // Continue as guest
        }
      }
    }

    const supabase = getServiceRoleClient();
    let postsData: any[] = [];

    // Try algorithmic feed first
    try {
      const { data: algorithmicPosts, error: rpcError } = await supabase.rpc('get_algorithmic_feed', {
        viewer_address: sessionAddress || 'anonymous',
        post_limit: limit,
        post_cursor: cursor || new Date().toISOString()
      });

      if (rpcError) throw rpcError;
      postsData = algorithmicPosts || [];
    } catch (error: any) {
      logError('FEED - algorithmic feed', error);

      // Fallback to chronological feed
      try {
        const { data: rawPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (postsError) throw postsError;
        postsData = rawPosts || [];
      } catch (fallbackError: any) {
        logError('FEED - fallback chronological', fallbackError);
        throw fallbackError;
      }
    }

    // Fetch reactions and profile data
    const reactionsMap: any = {};

    if (postsData.length > 0) {
      try {
        const postIds = postsData.map((p: any) => p.id).filter(id => id);
        
        if (postIds.length > 0) {
          const { data: reactions } = await supabase
            .from('post_reactions')
            .select('*')
            .in('post_id', postIds);

          (reactions || []).forEach((r: any) => {
            if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = [];
            reactionsMap[r.post_id].push(r);
          });
        }
      } catch (error: any) {
        logError('FEED - reactions fetch', error);
      }
    }

    // Format posts response
    const posts = postsData.map((p: any) => {
      const postReactions = reactionsMap[p.id] || [];
      const userReaction = sessionAddress
        ? postReactions.find((r: any) => r.address === sessionAddress)
        : null;

      return {
        id: p.id,
        authorAddress: p.address,
        content: p.content ? String(p.content).substring(0, 5000) : '',
        timestamp: p.created_at,
        txId: p.tx_id,
        reactions: {
          gm: postReactions.filter((r: any) => r.reaction_type === 'gm').length,
          fire: postReactions.filter((r: any) => r.reaction_type === 'fire').length,
          laugh: postReactions.filter((r: any) => r.reaction_type === 'laugh').length,
        },
        commentsCount: 0,
        repostsCount: 0,
        points: p.author_reputation || p.points || 0,
        isPro: p.is_pro || false,
        avatar: p.avatar_url || null,
        username: p.username || null,
        mediaUrl: p.media_url || null,
        pollData: p.poll_data || null,
        vigorScore: p.vigor_score || 0,
        currentUserReaction: userReaction ? userReaction.reaction_type : null
      };
    });

    return NextResponse.json(
      createSuccessResponse({
        posts,
        nextCursor: posts.length === limit ? posts[posts.length - 1].timestamp : null
      }, 'Feed retrieved'),
      { status: 200, headers: { ...getSecurityHeaders() } }
    );

  } catch (error: any) {
    logError('FEED_ENDPOINT', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch feed', 'FEED_ERROR'),
      { status: 500, headers: { ...getSecurityHeaders() } }
    );
  }
}
