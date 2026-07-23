-- Run this once in the Supabase SQL editor (Database → SQL Editor) after the first
-- `prisma migrate dev` has created the public.profiles table.
--
-- Creates a public.profiles row automatically whenever someone signs up through
-- Supabase Auth. Self-registration (the Mahasiswa "register" page) always defaults
-- to role = MAHASISWA; other roles are provisioned directly (see prisma/seed.ts) or
-- later via Kepala Lab admin tooling.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, nim, prodi, "updatedAt")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'MAHASISWA',
    new.raw_user_meta_data->>'nim',
    new.raw_user_meta_data->>'prodi',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
