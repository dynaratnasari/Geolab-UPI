-- The peminjaman/site/avatars buckets had zero storage.objects RLS policies (only
-- "documents" did), so every browser-side upload to them via the authenticated/anon
-- client was silently rejected with "new row violates row-level security policy" —
-- discovered when the return-inspection photo upload became a required field. These
-- buckets are already public-read (bucket.public = true bypasses RLS for GET), so only
-- INSERT/UPDATE need policies; authorization for *who* may upload is already enforced
-- at the Next.js server-action/page level (requireRole), so no extra per-user scoping
-- is needed here — unlike "documents", which does restrict by folder-owner.
create policy peminjaman_insert_authenticated on storage.objects for insert to authenticated with check (bucket_id = 'peminjaman');
create policy peminjaman_update_authenticated on storage.objects for update to authenticated using (bucket_id = 'peminjaman');
create policy site_insert_authenticated on storage.objects for insert to authenticated with check (bucket_id = 'site');
create policy site_update_authenticated on storage.objects for update to authenticated using (bucket_id = 'site');
create policy avatars_insert_authenticated on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy avatars_update_authenticated on storage.objects for update to authenticated using (bucket_id = 'avatars');

-- storage.buckets itself also has RLS enabled with zero policies — the Storage service
-- needs to read a bucket's row (to resolve its settings) before it'll allow any object
-- operation on it, so without this every upload above still fails with the exact same
-- generic RLS error regardless of the storage.objects policies. This alone was the actual
-- blocker; the objects policies above are necessary but not sufficient without it.
create policy buckets_select_authenticated on storage.buckets for select to authenticated, anon using (true);
