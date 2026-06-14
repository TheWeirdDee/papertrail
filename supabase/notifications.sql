-- PaperTrail notifications table.
-- The API route (src/app/api/notifications/route.ts) degrades gracefully if this
-- table is absent, so the app works without it — run this to enable the feature.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  address     text not null,
  type        text not null check (type in ('register', 'revoke', 'info')),
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Fast lookups of a wallet's most recent notifications.
create index if not exists notifications_address_created_idx
  on public.notifications (address, created_at desc);

-- Writes happen server-side via the service-role key, so RLS can stay locked down.
alter table public.notifications enable row level security;
