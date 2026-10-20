-- Admin panel notes for the existing Lay C Factory schema.
-- No new tables are required: admin uses public.orders with status values
-- (account, received, notified, processing, done, cancelled, photo, room,
-- meeting, review, admin_log) and existing albums / album_photos / album_access.
--
-- Privileged access is enforced in API handlers with the service role key
-- plus an allowlisted staff email (STAFF_EMAILS). The browser never receives
-- the service-role key.
--
-- Meeting rooms: status = 'meeting', items.code (6 digits), items.active,
-- items.closed, items.name, items.starts_at, items.duration_min.
-- Reviews: items.hidden = true hides a review from the public GET /api/reviews.
-- Admin actions: status = 'admin_log' rows written by the admin API.

-- Helpful indexes for admin list filters (safe if already present).
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_email_status_idx on public.orders (customer_email, status);

-- Keep RLS enabled; no anon policies that expose admin data.
-- Existing album tables remain service-role only (see prior migration).
