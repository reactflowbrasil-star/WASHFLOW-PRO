insert into public.sites (name, slug, status)
values ('WASHFLOW — Agencia Africa', 'washflow', 'active')
on conflict (slug) do update
set name = excluded.name, status = excluded.status;

insert into public.site_members (site_id, user_id, role)
select s.id, u.id, 'owner'
from public.sites s
join auth.users u on lower(u.email) = lower('agenciaafricaweb@gmail.com')
where s.slug = 'washflow'
on conflict (site_id, user_id) do update
set role = 'owner';
