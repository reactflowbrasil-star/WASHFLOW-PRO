create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  price numeric(10,2) not null default 0 check (price >= 0),
  duration_minutes integer not null default 30 check (duration_minutes between 1 and 1440),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, name),
  unique (site_id, id)
);

alter table public.wash_queue
  add column if not exists service_ids uuid[] not null default '{}',
  add column if not exists service_amount numeric(10,2) not null default 0 check (service_amount >= 0),
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists washer_label text;

create index if not exists service_catalog_site_active_idx
  on public.service_catalog(site_id, is_active, name);

alter table public.service_catalog enable row level security;
grant select, insert, update, delete on public.service_catalog to authenticated;

drop policy if exists service_catalog_read on public.service_catalog;
create policy service_catalog_read on public.service_catalog
for select to authenticated
using (private.is_platform_admin() or private.has_site_role(site_id, array['owner','manager','operator','inspector']));

drop policy if exists service_catalog_manage on public.service_catalog;
create policy service_catalog_manage on public.service_catalog
for all to authenticated
using (private.is_platform_admin() or private.has_site_role(site_id, array['owner','manager']))
with check (private.is_platform_admin() or private.has_site_role(site_id, array['owner','manager']));

comment on table public.service_catalog is 'Serviços e preços configurados por lava-jato do WASHFLOW.';
comment on column public.wash_queue.service_ids is 'IDs dos serviços incluídos no lançamento da lavagem.';
comment on column public.wash_queue.service_amount is 'Valor total dos serviços vinculados à lavagem.';
