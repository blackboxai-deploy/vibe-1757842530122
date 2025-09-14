-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversations table for chat history
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table for individual chat messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text check (role in ('user', 'assistant', 'system')) not null,
  content text not null,
  sql_query text,
  sql_results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create invoices table for uploaded invoice metadata
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  filename text not null,
  original_filename text not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  extracted_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sql_queries table for query history
create table public.sql_queries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  query text not null,
  results jsonb,
  error text,
  execution_time integer, -- in milliseconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_updated_at on public.conversations(updated_at desc);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);
create index idx_invoices_user_id on public.invoices(user_id);
create index idx_invoices_created_at on public.invoices(created_at desc);
create index idx_sql_queries_user_id on public.sql_queries(user_id);
create index idx_sql_queries_created_at on public.sql_queries(created_at desc);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.invoices enable row level security;
alter table public.sql_queries enable row level security;

-- Create RLS policies for users table
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Create RLS policies for conversations table
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Create RLS policies for messages table
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = (select user_id from public.conversations where id = conversation_id));

create policy "Users can create own messages"
  on public.messages for insert
  with check (auth.uid() = (select user_id from public.conversations where id = conversation_id));

-- Create RLS policies for invoices table
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can create own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Create RLS policies for sql_queries table
create policy "Users can view own sql_queries"
  on public.sql_queries for select
  using (auth.uid() = user_id);

create policy "Users can create own sql_queries"
  on public.sql_queries for insert
  with check (auth.uid() = user_id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create triggers for updated_at columns
create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.handle_updated_at();

create trigger handle_invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.handle_updated_at();