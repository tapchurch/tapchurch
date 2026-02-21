-- TAP CHURCH - fix schema for links module
-- Execute in Supabase SQL Editor (production).

alter table public.links
  add column if not exists icon_url text,
  add column if not exists category text not null default 'generic',
  add column if not exists method text null,
  add column if not exists featured_type text null,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true;

-- Optional: guard values
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'links_category_check'
      and conrelid = 'public.links'::regclass
  ) then
    alter table public.links
      add constraint links_category_check
      check (category in ('generic', 'payment'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'links_method_check'
      and conrelid = 'public.links'::regclass
  ) then
    alter table public.links
      add constraint links_method_check
      check (method is null or method in ('pix', 'digital_wallet', 'custom'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'links_featured_type_check'
      and conrelid = 'public.links'::regclass
  ) then
    alter table public.links
      add constraint links_featured_type_check
      check (featured_type is null or featured_type in ('instagram', 'youtube', 'site'));
  end if;
end $$;

notify pgrst, 'reload schema';
