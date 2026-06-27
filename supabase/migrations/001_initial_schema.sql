-- ============================================================
-- profiles: extends auth.users, created automatically on signup
-- ============================================================
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  preferred_day        int  not null default 27 check (preferred_day between 1 and 28),
  language             text not null default 'it' check (language in ('it', 'en')),
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles: own row" on public.profiles for all using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- accounts: user's financial accounts
-- ============================================================
create table public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  type              text not null check (type in ('cash', 'bond', 'etf', 'stock', 'asset')),
  asset_description text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.accounts enable row level security;
create policy "accounts: own rows" on public.accounts for all using (auth.uid() = user_id);

-- ============================================================
-- monthly_snapshots: one balance per account per month
-- ============================================================
create table public.monthly_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  account_id    uuid not null references public.accounts(id) on delete cascade,
  year          int  not null,
  month         int  not null check (month between 1 and 12),
  snapshot_date date not null,
  value         numeric(15,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, account_id, year, month)
);

alter table public.monthly_snapshots enable row level security;
create policy "snapshots: own rows" on public.monthly_snapshots for all using (auth.uid() = user_id);

-- ============================================================
-- income_transactions: positive cash flows per month
-- ============================================================
create table public.income_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  year        int  not null,
  month       int  not null check (month between 1 and 12),
  amount      numeric(15,2) not null check (amount > 0),
  description text not null,
  created_at  timestamptz not null default now()
);

alter table public.income_transactions enable row level security;
create policy "income: own rows" on public.income_transactions for all using (auth.uid() = user_id);
