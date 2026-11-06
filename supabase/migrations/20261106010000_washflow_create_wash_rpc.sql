-- Atomic order creation for WASHFLOW. RLS and site membership remain enforced in Postgres.
create or replace function public.washflow_create_wash(
  p_site_id uuid,
  p_vehicle_id uuid,
  p_service_ids uuid[],
  p_notes text default '',
  p_priority boolean default false,
  p_status text default 'fila',
  p_washer_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_vehicle record;
  v_total numeric(10,2);
  v_ids uuid[];
  v_order public.wash_queue%rowtype;
begin
  if not private.has_site_role(p_site_id, array['owner','manager','operator','washer']) then
    raise exception 'Acesso negado ao lava-jato.' using errcode = '42501';
  end if;
  if p_status not in ('fila','lavagem') then
    raise exception 'Status inicial inválido.' using errcode = '22023';
  end if;
  if coalesce(array_length(p_service_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos um serviço.' using errcode = '22023';
  end if;
  -- Lock the vehicle row so concurrent requests cannot enqueue it twice.
  select * into v_vehicle from public.vehicles
    where id = p_vehicle_id and site_id = p_site_id for update;
  if not found then raise exception 'Veículo não encontrado.' using errcode = 'P0002'; end if;
  if exists (select 1 from public.wash_queue q where q.site_id = p_site_id
      and q.vehicle_id = p_vehicle_id and q.status in ('fila','lavagem','qa','pronto')) then
    raise exception 'Este veículo já tem uma lavagem ativa.' using errcode = '23505';
  end if;
  select coalesce(sum(s.price),0), coalesce(array_agg(s.id), '{}'::uuid[])
    into v_total, v_ids
    from public.service_catalog s
    where s.site_id = p_site_id and s.is_active and s.id = any(p_service_ids);
  if cardinality(v_ids) <> cardinality(p_service_ids) then
    raise exception 'Um ou mais serviços não existem ou estão inativos.' using errcode = '22023';
  end if;
  insert into public.wash_queue(site_id, vehicle_id, service_ids, service_amount, customer_name,
      customer_phone, washer_label, notes, priority, status, washer_id, started_at)
    values (p_site_id, p_vehicle_id, v_ids, v_total, v_vehicle.customer_name,
      v_vehicle.customer_phone, null, left(coalesce(p_notes,''), 2000), coalesce(p_priority,false),
      p_status, p_washer_id, case when p_status='lavagem' then now() else null end)
    returning * into v_order;
  return to_jsonb(v_order);
end;
$$;
revoke all on function public.washflow_create_wash(uuid,uuid,uuid[],text,boolean,text,uuid) from public, anon;
grant execute on function public.washflow_create_wash(uuid,uuid,uuid[],text,boolean,text,uuid) to authenticated;
