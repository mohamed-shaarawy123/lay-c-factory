-- Order Excel files (private) + meeting invite codes (private).
-- Service role only; no anon/authenticated policies that expose data.

insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', false)
on conflict (id) do update set public = false;

create table if not exists public.meeting_invites (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.orders (id) on delete cascade,
  email text not null,
  code_hash text not null unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists meeting_invites_meeting_id_idx on public.meeting_invites (meeting_id);
create index if not exists meeting_invites_email_idx on public.meeting_invites (email);
create index if not exists meeting_invites_expires_idx on public.meeting_invites (expires_at);

alter table public.meeting_invites enable row level security;

-- Helpful order filters for admin.
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_items_code_idx on public.orders ((items->>'code'));
