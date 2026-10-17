-- Customer photo albums.
-- public.orders is left unchanged.
-- public.albums already exists (id, order_id, album_name, created_at) and is not recreated.

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  storage_path text not null,
  caption text,
  content_type text,
  byte_size integer,
  created_at timestamptz not null default now()
);

create table if not exists public.album_access (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists album_photos_album_id_idx on public.album_photos (album_id);
create index if not exists albums_order_id_idx on public.albums (order_id);
create index if not exists album_access_expires_idx on public.album_access (expires_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'albums_order_id_fkey'
  ) then
    alter table public.albums
      add constraint albums_order_id_fkey
      foreign key (order_id) references public.orders (id) on delete cascade;
  end if;
end $$;

alter table public.albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.album_access enable row level security;

-- No anon or authenticated policies. The browser never reads these tables.
-- The server uses the service role, checks a staff account token or an
-- expiring album link, then returns short-lived storage URLs.

insert into storage.buckets (id, name, public)
values ('album-photos', 'album-photos', false)
on conflict (id) do update set public = false;

-- Private bucket: no public read policy. Signed URLs are created by the server.
