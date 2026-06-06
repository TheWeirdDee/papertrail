-- ============================================================
-- PAPERTRAIL — Complete Supabase Schema Migration
-- Run in: https://supabase.com/dashboard/project/aazwhqzonavoyxbsymgo/sql
-- ============================================================

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────
-- 1. CORE TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  address    TEXT PRIMARY KEY,
  username   TEXT,
  bio        TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id         UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  address    TEXT       NOT NULL,
  content    TEXT       DEFAULT 'Said GM!',
  tx_id      TEXT,
  points     INT4       DEFAULT 5,
  is_pro     BOOLEAN    DEFAULT false,
  avatar_url TEXT,
  media_url  TEXT,
  poll_data  JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  address       TEXT        NOT NULL,
  reaction_type TEXT        NOT NULL CHECK (reaction_type IN ('gm', 'fire', 'laugh')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, address)
);

-- Auth nonces — used by /api/auth/nonce endpoint
CREATE TABLE IF NOT EXISTS auth_nonces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  address    TEXT        NOT NULL,
  nonce      TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(address)
);

-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_address     ON posts(address);
CREATE INDEX IF NOT EXISTS idx_posts_created_at  ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_nonces_address    ON auth_nonces(address);
CREATE INDEX IF NOT EXISTS idx_nonces_expires_at ON auth_nonces(expires_at);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces    ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies (idempotent)
DROP POLICY IF EXISTS "Public read profiles"       ON profiles;
DROP POLICY IF EXISTS "Public read posts"          ON posts;
DROP POLICY IF EXISTS "Public read reactions"      ON post_reactions;
DROP POLICY IF EXISTS "Service role all nonces"    ON auth_nonces;

CREATE POLICY "Public read profiles"       ON profiles       FOR SELECT TO anon       USING (true);
CREATE POLICY "Public read posts"          ON posts          FOR SELECT TO anon       USING (true);
CREATE POLICY "Public read reactions"      ON post_reactions FOR SELECT TO anon       USING (true);
-- auth_nonces is only accessed via the service role (server-side) — no anon access
CREATE POLICY "Service role all nonces"    ON auth_nonces    TO service_role          USING (true);

-- ────────────────────────────────────────────────────────────
-- 4. ALGORITHMIC FEED FUNCTION
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_algorithmic_feed(TEXT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.get_algorithmic_feed(
  viewer_address TEXT DEFAULT 'anonymous',
  post_limit     INT  DEFAULT 20,
  post_cursor    TEXT DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  address        TEXT,
  content        TEXT,
  tx_id          TEXT,
  points         INT4,
  is_pro         BOOLEAN,
  avatar_url     TEXT,
  media_url      TEXT,
  poll_data      JSONB,
  created_at     TIMESTAMPTZ,
  username       TEXT,
  reaction_count BIGINT,
  vigor_score    FLOAT8
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.address,
    p.content,
    p.tx_id,
    p.points,
    p.is_pro,
    p.avatar_url,
    p.media_url,
    p.poll_data,
    p.created_at,
    pr.username,
    COUNT(r.id)                                                AS reaction_count,
    (
      EXTRACT(EPOCH FROM p.created_at) / 3600.0
      + COUNT(r.id) * 2.0
    )                                                          AS vigor_score
  FROM posts p
  LEFT JOIN profiles      pr ON pr.address = p.address
  LEFT JOIN post_reactions r  ON r.post_id  = p.id
  WHERE (post_cursor IS NULL OR p.created_at < post_cursor::TIMESTAMPTZ)
  GROUP BY p.id, p.address, p.content, p.tx_id, p.points,
           p.is_pro, p.avatar_url, p.media_url, p.poll_data,
           p.created_at, pr.username
  ORDER BY vigor_score DESC
  LIMIT post_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_algorithmic_feed(TEXT, INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_algorithmic_feed(TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_algorithmic_feed(TEXT, INT, TEXT) TO service_role;

-- ────────────────────────────────────────────────────────────
-- 5. REALTIME (idempotent guard)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- VERIFY
-- After running, test with:
-- SELECT * FROM public.get_algorithmic_feed('anonymous', 5, NULL);
-- SELECT count(*) FROM auth_nonces;
-- ────────────────────────────────────────────────────────────
