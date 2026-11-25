-- New catalogue price, in kopecks. Existing orders retain their frozen unit_price.
update public.store_products set price=149000,updated_at=now() where kind='case' and price<>149000;
alter table public.store_products alter column price set default 149000;
