-- Create profiles table with role differentiation
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('recruiter', 'job_seeker')),
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recruiter_profiles table for recruiter-specific data
create table if not exists public.recruiter_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  full_name text,
  phone text,
  profile_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_seeker_profiles table for job seeker-specific data
create table if not exists public.job_seeker_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  location text,
  bio text,
  profile_image_url text,
  resume_url text,
  portfolio_url text,
  profile_completion_percentage integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.job_seeker_profiles enable row level security;

-- RLS Policies for profiles table
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- RLS Policies for recruiter_profiles table
create policy "recruiter_profiles_select_own"
  on public.recruiter_profiles for select
  using (auth.uid() = id);

create policy "recruiter_profiles_insert_own"
  on public.recruiter_profiles for insert
  with check (auth.uid() = id);

create policy "recruiter_profiles_update_own"
  on public.recruiter_profiles for update
  using (auth.uid() = id);

create policy "recruiter_profiles_delete_own"
  on public.recruiter_profiles for delete
  using (auth.uid() = id);

-- RLS Policies for job_seeker_profiles table
create policy "job_seeker_profiles_select_own"
  on public.job_seeker_profiles for select
  using (auth.uid() = id);

create policy "job_seeker_profiles_insert_own"
  on public.job_seeker_profiles for insert
  with check (auth.uid() = id);

create policy "job_seeker_profiles_update_own"
  on public.job_seeker_profiles for update
  using (auth.uid() = id);

create policy "job_seeker_profiles_delete_own"
  on public.job_seeker_profiles for delete
  using (auth.uid() = id);
