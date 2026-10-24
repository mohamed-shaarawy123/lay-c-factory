-- Camera and family-album photos stay in public.orders (status = 'photo').
-- Account rows (status = 'account') hold album_published for the binder.
-- Equivalent fields already live in orders.items, so no extra columns are added:
--   privacy / privacy_status, published_at, moderation_status, moderation_decided_at,
--   publish_locked, content_hash, album_published.
-- The album API is the only writer. Anon and authenticated clients have no policies.

alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('album-photos', 'album-photos', false)
on conflict (id) do update set public = false;

-- Customer-album objects stay private. Signed URLs are minted by the server
-- only after moderation_status is approved (or the row predates this rule).
-- Pending and rejected objects must not be readable by anon.
