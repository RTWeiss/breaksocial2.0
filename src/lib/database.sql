-- Enable RLS
alter table public.tweets enable row level security;
alter table public.profiles enable row level security;

-- Create likes table if it doesn't exist
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tweet_id uuid references public.tweets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tweet_id)
);

alter table public.likes enable row level security;

-- Create retweets table if it doesn't exist
create table if not exists public.retweets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tweet_id uuid references public.tweets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tweet_id)
);

alter table public.retweets enable row level security;

-- Create replies table if it doesn't exist
create table if not exists public.replies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tweet_id uuid references public.tweets(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.replies enable row level security;

-- RLS Policies
create policy "Users can view all tweets"
  on public.tweets for select
  to authenticated
  using (true);

create policy "Users can insert their own tweets"
  on public.tweets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view all likes"
  on public.likes for select
  to authenticated
  using (true);

create policy "Users can insert their own likes"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view all retweets"
  on public.retweets for select
  to authenticated
  using (true);

create policy "Users can insert their own retweets"
  on public.retweets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own retweets"
  on public.retweets for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view all replies"
  on public.replies for select
  to authenticated
  using (true);

create policy "Users can insert their own replies"
  on public.replies for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create functions for counting
create or replace function public.get_likes_count(tweet_row public.tweets)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.likes
  where tweet_id = tweet_row.id;
$$;

create or replace function public.get_retweets_count(tweet_row public.tweets)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.retweets
  where tweet_id = tweet_row.id;
$$;

create or replace function public.get_replies_count(tweet_row public.tweets)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.replies
  where tweet_id = tweet_row.id;
$$;