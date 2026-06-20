-- PaperTrail document cache table.
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).
-- If you already created this table from a previous version, run the ALTER TABLE
-- statements at the bottom instead.

create table if not exists public.document_cache (
  hash          text primary key,
  owner         text not null,
  title         text not null,
  category      integer not null check (category between 1 and 5),
  description   text,
  registered_at bigint not null default 0,
  is_revoked    boolean not null default false,
  revoked_at    timestamptz,
  expires_at    timestamptz,
  txid          text,
  created_at    timestamptz not null default now()
);

create index if not exists document_cache_owner_created_idx
  on public.document_cache (owner, created_at desc);

alter table public.document_cache enable row level security;

-- If you already have the table, run these to add the new columns:
-- alter table public.document_cache add column if not exists description text;
-- alter table public.document_cache add column if not exists expires_at timestamptz;
