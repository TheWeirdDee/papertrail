-- PAPERTRAIL SUPABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the posts table (Simplified)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,           -- Author's Stacks Address
    content TEXT DEFAULT 'Said GM!', -- Post content
    tx_id TEXT,                      -- Stacks Transaction ID
    points INT4 DEFAULT 5,           -- Points awarded
    is_pro BOOLEAN DEFAULT false,    -- Whether user was Pro at post time
    avatar_url TEXT,                 -- Cache for author's identity avatar
    media_url TEXT,                  -- URL for attached image or video
    poll_data JSONB,                 -- JSON object for poll options and status
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create post_reactions table (NewEngagementModel)
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('gm', 'fire', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: One user can only have ONE reaction per post
    UNIQUE(post_id, address)
);

-- 3. Create auth_nonces table (Security)
CREATE TABLE IF NOT EXISTS auth_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL UNIQUE, -- ADDED UNIQUE
    nonce TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
    address TEXT PRIMARY KEY,
    username TEXT,
    bio TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_address ON posts(address);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_nonces_address ON auth_nonces(address);

-- 6. Row Level Security (RLS) - CLEAN SLATE
-- We are NOT using Supabase Auth. RLS is only for Public SELECT.
-- Mutations are handled via Backend Proxy + Service Role.

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6a. Explicitly Drop Legacy Policies (Stable/Predictable)
DROP POLICY IF EXISTS "Public read posts" ON posts;
DROP POLICY IF EXISTS "Public read reactions" ON post_reactions;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Enable all for Service Role" ON auth_nonces; -- Just in case

-- 6b. Create Public Read Policies
CREATE POLICY "Public read posts" ON posts FOR SELECT TO anon USING (true);
CREATE POLICY "Public read reactions" ON post_reactions FOR SELECT TO anon USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO anon USING (true);

-- 6c. Hardened Nonce Protection
-- Even with RLS enabled, we explicitly revoke permissions at the role level.
REVOKE ALL ON auth_nonces FROM anon;
REVOKE ALL ON auth_nonces FROM authenticated;

-- 7. Enable Realtime (Safe Idempotent Version)
DO $$ 
BEGIN
  -- Add posts if missing
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
  
  -- Add post_reactions if missing
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'post_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
  END IF;

  -- Add profiles if missing
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
