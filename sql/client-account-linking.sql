-- TAP CHURCH - Client/account association for global admin
-- Run this in Supabase SQL Editor.

alter table public.organizations
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

create table if not exists public.pending_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'owner',
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by uuid null references auth.users(id) on delete set null,
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

alter table public.pending_memberships enable row level security;

drop policy if exists "pending_memberships_super_admin_select" on public.pending_memberships;
create policy "pending_memberships_super_admin_select"
on public.pending_memberships
for select
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "pending_memberships_super_admin_insert" on public.pending_memberships;
create policy "pending_memberships_super_admin_insert"
on public.pending_memberships
for insert
to authenticated
with check (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

drop policy if exists "pending_memberships_super_admin_update" on public.pending_memberships;
create policy "pending_memberships_super_admin_update"
on public.pending_memberships
for update
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "pending_memberships_super_admin_delete" on public.pending_memberships;
create policy "pending_memberships_super_admin_delete"
on public.pending_memberships
for delete
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'memberships_user_org_unique_idx'
  ) then
    create unique index memberships_user_org_unique_idx
    on public.memberships(user_id, organization_id);
  end if;
end $$;

drop policy if exists "memberships_insert_from_pending_invite" on public.memberships;
create policy "memberships_insert_from_pending_invite"
on public.memberships
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.pending_memberships pm
    where pm.organization_id = memberships.organization_id
      and pm.role = memberships.role
      and pm.status = 'pending'
      and lower(pm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
