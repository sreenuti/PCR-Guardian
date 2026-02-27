-- PCR Transparency Portal: profiles, violations, hard_costs
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles: one per auth user; consent flags
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  consent_sms boolean not null default false,
  consent_email boolean not null default false,
  consent_voice_ai boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Violations: fine accrual and stop-clock
create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  violation_date date not null,
  description text,
  is_accruing boolean not null default true,
  fine_balance numeric(12, 2) not null default 0,
  cure_photo_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hard costs per violation (e.g. certified mail)
create table if not exists public.hard_costs (
  id uuid primary key default gen_random_uuid(),
  violation_id uuid not null references public.violations(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.violations enable row level security;
alter table public.hard_costs enable row level security;

-- Profiles: user can read/update own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Violations: user can CRUD own
create policy "Users can read own violations"
  on public.violations for select
  using (auth.uid() = user_id);

create policy "Users can insert own violations"
  on public.violations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own violations"
  on public.violations for update
  using (auth.uid() = user_id);

-- Hard costs: via violation ownership
create policy "Users can read hard_costs for own violations"
  on public.hard_costs for select
  using (
    exists (
      select 1 from public.violations v
      where v.id = hard_costs.violation_id and v.user_id = auth.uid()
    )
  );

create policy "Users can insert hard_costs for own violations"
  on public.hard_costs for insert
  with check (
    exists (
      select 1 from public.violations v
      where v.id = hard_costs.violation_id and v.user_id = auth.uid()
    )
  );

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();