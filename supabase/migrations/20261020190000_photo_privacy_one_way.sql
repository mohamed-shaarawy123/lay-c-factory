-- One-way photo privacy for binder / family album photos stored in public.orders (status=photo).
-- Photos are accessed only through the server (service role). Lock down direct client access.

-- Prefer RLS on orders so anon/authenticated JWT clients cannot read or rewrite photo rows.
alter table public.orders enable row level security;

-- No policies for anon/authenticated: deny by default. Service role bypasses RLS.

-- Helpful filter for shared album queries.
create index if not exists orders_photo_shared_idx
  on public.orders ((items->>'shared'))
  where status = 'photo';

-- Lock already-public photos so owner unpublish/delete cannot reverse them.
-- Does not change private photos (shared = false).
update public.orders
set items =
  coalesce(items, '{}'::jsonb)
  || jsonb_build_object(
    'publish_locked', true,
    'privacy', 'public',
    'published_at', coalesce(items->>'published_at', created_at::text)
  )
where status = 'photo'
  and coalesce(items->>'shared', 'true') = 'true'
  and coalesce(items->>'rejected', 'false') <> 'true'
  and coalesce(items->>'publish_locked', 'false') <> 'true';

-- Normalize explicitly private photos.
update public.orders
set items =
  coalesce(items, '{}'::jsonb)
  || jsonb_build_object(
    'shared', false,
    'privacy', 'private',
    'publish_locked', false
  )
where status = 'photo'
  and items->>'shared' = 'false';
