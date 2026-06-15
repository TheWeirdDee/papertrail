-- PaperTrail document cache table.
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).
-- This is a read-through cache of on-chain registrations; the contract is the
-- source of truth. Rows are written server-side via the service-role key.

create table if not exists public.document_cache (
  hash          text primary key,
  owner         text not null,
  title         text not null,
  category      integer not null check (category between 1 and 5),
  registered_at bigint not null default 0,
  is_revoked    boolean not null default false,
  revoked_at    timestamptz,
  txid          text,
  created_at    timestamptz not null default now()
);

-- Fast lookups of a wallet's documents ordered by newest first.
create index if not exists document_cache_owner_created_idx
  on public.document_cache (owner, created_at desc);

-- Writes happen server-side via the service-role key, so RLS can stay locked down.
alter table public.document_cache enable row level security;
