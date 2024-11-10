-- Enable storage
create extension if not exists "storage" schema "extensions";

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow public read access" on storage.objects;

-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies for storage.objects
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'public' AND
  auth.uid() = owner
);

create policy "Allow authenticated deletes"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'public' AND
  auth.uid() = owner
);

create policy "Allow public read"
on storage.objects for select
to public
using (bucket_id = 'public');

-- Grant usage
grant usage on schema storage to public;
grant all on storage.objects to authenticated;
grant select on storage.objects to public;