-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create messages table
create table if not exists public.messages (
    id uuid primary key default uuid_generate_v4(),
    sender_id uuid references auth.users(id) on delete cascade not null,
    receiver_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    read_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up RLS
alter table public.messages enable row level security;

-- Policies
create policy "Users can view their own messages"
    on messages for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
    on messages for insert
    with check (auth.uid() = sender_id);

create policy "Users can update their own messages"
    on messages for update
    using (auth.uid() = sender_id);

-- Functions
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Triggers
create trigger handle_updated_at
    before update on messages
    for each row
    execute function handle_updated_at();

-- Indexes
create index if not exists idx_messages_sender_id on messages(sender_id);
create index if not exists idx_messages_receiver_id on messages(receiver_id);
create index if not exists idx_messages_created_at on messages(created_at desc);

-- Permissions
grant usage on schema public to authenticated;
grant all on public.messages to authenticated;