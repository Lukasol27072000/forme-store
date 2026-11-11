create schema if not exists private;
revoke all on schema private from public;
create table public.store_admins (
 user_id uuid primary key references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.store_admins enable row level security;
grant select on public.store_admins to authenticated;
create policy admins_read_self on public.store_admins for select to authenticated using (user_id = (select auth.uid()));
create function public.store_is_admin() returns boolean language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.store_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.store_is_admin() from public;
grant execute on function public.store_is_admin() to authenticated;
create table public.store_products (
 id uuid primary key default gen_random_uuid(),
 legacy_id text unique,
 name text not null check(char_length(name) between 1 and 120),
 category text not null check(category in ('azul','evil-eye','ocean','racetrack','leopard')),
 description text not null default '' check(char_length(description) <= 5000),
 price integer not null default 129000 check(price between 100 and 100000000),
 images text[] not null default '{}',
 compatible_models text[] not null default '{}',
 reference_image boolean not null default false,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.store_products enable row level security;
grant select on public.store_products to anon,authenticated;
grant insert,update on public.store_products to authenticated;
create policy products_read on public.store_products for select to anon using (active);
create policy products_read_member on public.store_products for select to authenticated using (active or (select public.store_is_admin()));
create policy products_insert_admin on public.store_products for insert to authenticated with check ((select public.store_is_admin()));
create policy products_update_admin on public.store_products for update to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));
create table public.store_orders (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id),
 product_id uuid not null references public.store_products(id),
 product_name text not null default '',
 product_image text,
 unit_price integer not null default 0,
 phone_model text not null check(char_length(phone_model) between 1 and 60),
 customer_name text not null check(char_length(customer_name) between 1 and 100),
 contact text not null check(char_length(contact) between 1 and 150),
 city text not null check(char_length(city) between 1 and 100),
 address text not null check(char_length(address) between 1 and 300),
 comment text not null default '' check(char_length(comment)<=1000),
 consent boolean not null check(consent),
 status text not null default 'pending' check(status in ('pending','confirmed','shipped','delivered','cancelled')),
 tracking_number text not null default '' check(char_length(tracking_number)<=150),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index orders_user_created on public.store_orders(user_id,created_at desc);
create index orders_product on public.store_orders(product_id);
alter table public.store_orders enable row level security;
grant select,insert,update on public.store_orders to authenticated;
create policy orders_read on public.store_orders for select to authenticated using (user_id=(select auth.uid()) or (select public.store_is_admin()));
create policy orders_create on public.store_orders for insert to authenticated with check (user_id=(select auth.uid()));
create policy orders_admin_update on public.store_orders for update to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));
create table public.store_order_events (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.store_orders(id),
 status text not null,
 created_at timestamptz not null default now()
);
create index order_events_order on public.store_order_events(order_id,created_at);
alter table public.store_order_events enable row level security;
grant select on public.store_order_events to authenticated;
create policy events_read on public.store_order_events for select to authenticated using (exists(select 1 from public.store_orders o where o.id=order_id and (o.user_id=(select auth.uid()) or (select public.store_is_admin()))));
create function private.prepare_order() returns trigger language plpgsql security invoker set search_path='' as $$
declare product public.store_products;
begin
 if tg_op='INSERT' then
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'Authentication required'; end if;
  select * into product from public.store_products where id=new.product_id and active;
  if not found then raise exception 'Product unavailable'; end if;
  if new.unit_price <> product.price then raise exception 'Price changed'; end if;
  if cardinality(product.compatible_models)>0 and not(new.phone_model=any(product.compatible_models)) then raise exception 'Unsupported phone model'; end if;
  new.product_name=product.name;
  new.product_image=product.images[1];
  new.unit_price=product.price;
  new.status='pending';
  new.tracking_number='';
  new.created_at=now();
 else
  if not public.store_is_admin() then raise exception 'Administrator required'; end if;
  if row(new.user_id,new.product_id,new.product_name,new.product_image,new.unit_price,new.phone_model,new.customer_name,new.contact,new.city,new.address,new.comment,new.consent,new.created_at,new.id)
   is distinct from row(old.user_id,old.product_id,old.product_name,old.product_image,old.unit_price,old.phone_model,old.customer_name,old.contact,old.city,old.address,old.comment,old.consent,old.created_at,old.id)
   then raise exception 'Order details are immutable'; end if;
 end if;
 new.updated_at=now(); return new;
end; $$;
create trigger prepare_order before insert or update on public.store_orders for each row execute function private.prepare_order();
create function private.record_order_status() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if tg_op='INSERT' or new.status is distinct from old.status then
  insert into public.store_order_events(order_id,status) values(new.id,new.status);
 end if;
 return new;
end; $$;
revoke all on function private.record_order_status() from public;
create trigger record_order_status after insert or update on public.store_orders for each row execute function private.record_order_status();
create table public.store_tickets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id),
 order_id uuid references public.store_orders(id),
 subject text not null check(char_length(subject) between 1 and 150),
 status text not null default 'open' check(status in ('open','closed')),
 created_at timestamptz not null default now()
);
create index tickets_user_created on public.store_tickets(user_id,created_at desc);
create index tickets_order on public.store_tickets(order_id);
alter table public.store_tickets enable row level security;
grant select,insert on public.store_tickets to authenticated;
grant update(status) on public.store_tickets to authenticated;
create policy tickets_read on public.store_tickets for select to authenticated using (user_id=(select auth.uid()) or (select public.store_is_admin()));
create policy tickets_create on public.store_tickets for insert to authenticated with check (user_id=(select auth.uid()) and status='open' and (order_id is null or exists(select 1 from public.store_orders o where o.id=order_id and o.user_id=(select auth.uid()))));
create policy tickets_update on public.store_tickets for update to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));
create table public.store_messages (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.store_tickets(id),
 sender_id uuid not null default auth.uid() references auth.users(id),
 body text not null check(char_length(btrim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index messages_ticket_created on public.store_messages(ticket_id,created_at);
create index messages_sender on public.store_messages(sender_id);
alter table public.store_messages enable row level security;
grant select,insert on public.store_messages to authenticated;
create policy messages_read on public.store_messages for select to authenticated using (exists(select 1 from public.store_tickets t where t.id=ticket_id and (t.user_id=(select auth.uid()) or (select public.store_is_admin()))));
create policy messages_insert on public.store_messages for insert to authenticated with check (sender_id=(select auth.uid()) and exists(select 1 from public.store_tickets t where t.id=ticket_id and t.status='open' and (t.user_id=(select auth.uid()) or (select public.store_is_admin()))));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('store-products','store-products',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy catalog_upload on storage.objects for insert to authenticated with check (bucket_id='store-products' and (select public.store_is_admin()));
create policy catalog_read_admin on storage.objects for select to authenticated using (bucket_id='store-products' and (select public.store_is_admin()));
create policy catalog_update on storage.objects for update to authenticated using (bucket_id='store-products' and (select public.store_is_admin())) with check (bucket_id='store-products' and (select public.store_is_admin()));
create policy catalog_delete on storage.objects for delete to authenticated using (bucket_id='store-products' and (select public.store_is_admin()));
create table private.store_owner_emails(email text primary key);
revoke all on private.store_owner_emails from public,anon,authenticated;
alter table private.store_owner_emails enable row level security;
create policy owner_emails_private on private.store_owner_emails for all to authenticated using(false) with check(false);
create function private.stamp_message() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.created_at=now(); return new; end; $$;
create trigger stamp_message before insert on public.store_messages for each row execute function private.stamp_message();
