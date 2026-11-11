-- Curated eight-case sets use the same server-priced order workflow as cases.
alter table public.store_products add column if not exists kind text not null default 'case' check(kind in ('case','bundle'));
alter table public.store_products add column if not exists bundle_product_ids uuid[] not null default '{}';
alter table public.store_products add column if not exists bundle_finish text not null default '' check(bundle_finish in ('','silver','deep-blue','cosmic-orange'));
alter table public.store_products add constraint store_products_bundle_shape check((kind='case' and cardinality(bundle_product_ids)=0) or (kind='bundle' and cardinality(bundle_product_ids)=8 and bundle_finish<>''));
alter table public.store_products drop constraint store_products_category_check;
alter table public.store_products add constraint store_products_category_check check(category in ('azul','evil-eye','ocean','racetrack','leopard','apres-ski','after-hours','edits'));
alter table public.store_orders add column if not exists phone_finish text not null default '' check(phone_finish in ('','silver','deep-blue','cosmic-orange'));
alter table public.store_orders add column if not exists bundle_snapshot jsonb not null default '[]'::jsonb check(jsonb_typeof(bundle_snapshot)='array');

create or replace function private.prepare_order() returns trigger language plpgsql set search_path='' as $function$
declare product public.store_products; matched_image text; available_count integer;
begin
 if tg_op='INSERT' then
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'Authentication required'; end if;
  select * into product from public.store_products where id=new.product_id and active;
  if not found then raise exception 'Product unavailable'; end if;
  if new.unit_price <> product.price then raise exception 'Price changed'; end if;
  if cardinality(product.compatible_models)>0 and not(new.phone_model=any(product.compatible_models)) then raise exception 'Unsupported phone model'; end if;
  new.bundle_snapshot='[]'::jsonb;
  if product.kind='bundle' then
   select count(*) into available_count from public.store_products where id=any(product.bundle_product_ids) and active and kind='case';
   if available_count<>8 then raise exception 'Bundle unavailable'; end if;
   new.phone_finish=product.bundle_finish;
   select jsonb_agg(jsonb_build_object('product_id',p.id,'name',p.name,'image',coalesce((select image from unnest(p.images) image where image like '%finish='||product.bundle_finish limit 1),p.images[1])) order by member.ordinality)
   into new.bundle_snapshot from unnest(product.bundle_product_ids) with ordinality as member(id,ordinality) join public.store_products p on p.id=member.id;
  end if;
  select image into matched_image from unnest(product.images) image where new.phone_finish<>'' and image like '%finish='||new.phone_finish limit 1;
  new.product_name=product.name; new.product_image=coalesce(matched_image,product.images[1]); new.unit_price=product.price;
  new.status='pending'; new.tracking_number=''; new.created_at=now();
 else
  if not public.store_is_admin() then raise exception 'Administrator required'; end if;
  if row(new.user_id,new.product_id,new.product_name,new.product_image,new.unit_price,new.phone_model,new.phone_finish,new.bundle_snapshot,new.customer_name,new.contact,new.city,new.address,new.comment,new.consent,new.created_at,new.id)
   is distinct from row(old.user_id,old.product_id,old.product_name,old.product_image,old.unit_price,old.phone_model,old.phone_finish,old.bundle_snapshot,old.customer_name,old.contact,old.city,old.address,old.comment,old.consent,old.created_at,old.id)
   then raise exception 'Order details are immutable'; end if;
 end if;
 new.updated_at=now(); return new;
end; $function$;
