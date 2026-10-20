-- Production data foundation. Apply through the Supabase SQL editor or CLI.
create extension if not exists postgis with schema extensions;

create table public.moderators (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('moderator','administrator')),
 created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
create policy "Moderators can read their own membership" on public.moderators for select to authenticated using (user_id = auth.uid());
create function public.is_moderator() returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

create table public.relief_locations (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null check (category in ('shade','water','cooling','emergency')),
 address text not null,
 position extensions.geography(point,4326) not null,
 amenities jsonb not null default '[]',
 hours jsonb,
 source_url text,
 status text not null default 'draft' check (status in ('draft','verified','disabled')),
 verified_at timestamptz,
 verification_expires_at timestamptz,
 verified_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 check (status <> 'verified' or (verified_at is not null and verification_expires_at > verified_at and verified_by is not null))
);
create index relief_locations_position_idx on public.relief_locations using gist(position);
alter table public.relief_locations enable row level security;
create policy "Public reads current verified locations" on public.relief_locations for select to anon,authenticated using (status='verified' and verification_expires_at>now());
create policy "Moderators manage locations" on public.relief_locations for all to authenticated using (public.is_moderator()) with check (public.is_moderator());

create table public.facility_reports (
 id uuid primary key default gen_random_uuid(),
 location_id uuid not null references public.relief_locations(id),
 issue text not null check (char_length(issue) between 8 and 1000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz
);
alter table public.facility_reports enable row level security;
-- Anonymous writes deliberately require a rate-limited server route; no public insert policy.
create policy "Moderators manage reports" on public.facility_reports for all to authenticated using (public.is_moderator()) with check (public.is_moderator());

create table public.advisories (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 body text not null,
 source_name text not null,
 source_url text not null,
 source_published_at timestamptz not null,
 expires_at timestamptz not null,
 status text not null default 'draft' check (status in ('draft','published','disabled')),
 region text not null,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.advisories enable row level security;
create policy "Public reads current published advisories" on public.advisories for select to anon,authenticated using (status='published' and expires_at>now());
create policy "Moderators manage advisories" on public.advisories for all to authenticated using (public.is_moderator()) with check (public.is_moderator());

create table public.audit_log (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 action text not null,
 entity_table text not null,
 entity_id uuid not null,
 details jsonb not null default '{}',
 created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "Moderators read audit history" on public.audit_log for select to authenticated using (public.is_moderator());
-- No client insert/update/delete; write audit entries only through server transactions.

create function public.nearby_relief(latitude float, longitude float, radius_meters int default 5000)
returns setof public.relief_locations language sql stable set search_path = '' as $$
 select * from public.relief_locations
 where status='verified' and verification_expires_at>now()
 and extensions.st_dwithin(position,extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography,least(greatest(radius_meters,100),50000))
 order by extensions.st_distance(position,extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography);
$$;
