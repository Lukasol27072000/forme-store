create table public.store_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check(char_length(full_name)<=100),
 contact_kind text not null default '' check(contact_kind in ('','telegram','phone')),
 contact text not null default '' check(char_length(contact)<=150),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint store_profiles_contact_shape check((contact_kind='' and contact='') or (contact_kind='telegram' and contact ~ '^@[A-Za-z][A-Za-z0-9_]{4,31}$') or (contact_kind='phone' and contact ~ '^\+[1-9][0-9]{6,14}$'))
);
alter table public.store_profiles enable row level security;
revoke all on public.store_profiles from anon,authenticated;
grant select on public.store_profiles to authenticated;
grant insert(user_id,full_name,contact_kind,contact),update(user_id,full_name,contact_kind,contact) on public.store_profiles to authenticated;
create policy profiles_read on public.store_profiles for select to authenticated using(user_id=(select auth.uid()) or (select public.store_is_admin()));
create policy profiles_insert_self on public.store_profiles for insert to authenticated with check(user_id=(select auth.uid()) and contact<>'');
create policy profiles_update_self on public.store_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and contact<>'');

create function private.store_normalize_contact(kind text,value text) returns text language plpgsql immutable set search_path='' as $$
declare result text;
begin
 result=btrim(coalesce(value,''));
 if kind='telegram' then
  result=regexp_replace(result,'^(https?://)?(www\.)?(t\.me|telegram\.me)/','','i');
  result=regexp_replace(result,'^@','');result=regexp_replace(result,'/+$','');
  if result !~ '^[A-Za-z][A-Za-z0-9_]{4,31}$' then raise exception 'Invalid Telegram contact';end if;
  return '@'||result;
 elsif kind='phone' then
  result=regexp_replace(result,'[\s().-]','','g');
  if result ~ '^8[0-9]{10}$' then result='+7'||substr(result,2);elsif result ~ '^[0-9]+$' then result='+'||result;end if;
  if result !~ '^\+[1-9][0-9]{6,14}$' then raise exception 'Invalid phone contact';end if;
  return result;
 end if;
 raise exception 'Contact required';
end; $$;
revoke all on function private.store_normalize_contact(text,text) from public;

create function private.store_prepare_profile() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and new.user_id<>old.user_id then raise exception 'Profile owner is immutable';end if;
 new.full_name=btrim(new.full_name);new.contact=private.store_normalize_contact(new.contact_kind,new.contact);new.updated_at=now();return new;
end; $$;
revoke all on function private.store_prepare_profile() from public;
-- Backfill registered accounts without inventing contact details.
insert into public.store_profiles(user_id,full_name,created_at)
 select id,left(coalesce(raw_user_meta_data->>'full_name',''),100),created_at from auth.users on conflict(user_id) do nothing;
create trigger prepare_profile before insert or update on public.store_profiles for each row execute function private.store_prepare_profile();

create function private.store_customers(search_text text,page_size integer,page_offset integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.store_admins where user_id=auth.uid()) then raise exception 'Administrator required' using errcode='42501';end if;
 with customers as (
  select u.id,u.email,coalesce(p.full_name,'') as full_name,coalesce(p.contact_kind,'') as contact_kind,coalesce(p.contact,'') as contact,u.created_at,u.last_sign_in_at,
   exists(select 1 from public.store_admins a where a.user_id=u.id) as is_admin,
   (select count(*) from public.store_orders o where o.user_id=u.id) as orders_count
  from auth.users u left join public.store_profiles p on p.user_id=u.id
  where coalesce(search_text,'')='' or concat_ws(' ',u.email,p.full_name,p.contact) ilike '%'||left(search_text,150)||'%'
 ), page as (select * from customers order by created_at desc,id limit greatest(1,least(coalesce(page_size,50),100)) offset greatest(coalesce(page_offset,0),0))
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id) from page),'[]'::jsonb),'total',(select count(*) from customers)) into result;
 return result;
end; $$;
revoke all on function private.store_customers(text,integer,integer) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.store_normalize_contact(text,text),private.store_customers(text,integer,integer) to authenticated;
create function public.store_list_customers(search_text text default '',page_size integer default 50,page_offset integer default 0) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.store_customers(search_text,page_size,page_offset); $$;
revoke all on function public.store_list_customers(text,integer,integer) from public,anon;
grant execute on function public.store_list_customers(text,integer,integer) to authenticated;
