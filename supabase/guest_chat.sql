create table public.store_guest_chats (
 id uuid primary key, secret_hash bytea not null,
 name text not null default '' check(length(name)<=100),
 contact_kind text not null check(contact_kind in ('telegram','phone')),
 contact text not null check(length(contact)<=150),
 product_id uuid references public.store_products(id) on delete set null,
 product_name text not null default '',
 status text not null default 'open' check(status in ('open','closed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.store_guest_messages (
 id uuid primary key, chat_id uuid not null references public.store_guest_chats(id) on delete cascade,
 sender text not null check(sender in ('visitor','admin')),
 body text not null check(length(btrim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index store_guest_messages_chat_time on public.store_guest_messages(chat_id,created_at);
create index store_guest_chats_contact_time on public.store_guest_chats(contact,created_at);
alter table public.store_guest_chats enable row level security;
alter table public.store_guest_messages enable row level security;
revoke all on public.store_guest_chats,public.store_guest_messages from anon,authenticated;
grant select on public.store_guest_chats,public.store_guest_messages to authenticated;
grant update(status) on public.store_guest_chats to authenticated;
grant insert(id,chat_id,sender,body) on public.store_guest_messages to authenticated;
create policy guest_chats_admin_read on public.store_guest_chats for select to authenticated using ((select public.store_is_admin()));
create policy guest_chats_admin_update on public.store_guest_chats for update to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));
create policy guest_messages_admin_read on public.store_guest_messages for select to authenticated using ((select public.store_is_admin()));
create policy guest_messages_admin_insert on public.store_guest_messages for insert to authenticated with check ((select public.store_is_admin()) and sender='admin' and exists(select 1 from public.store_guest_chats c where c.id=chat_id and c.status='open'));
create function private.store_guest_chat(p_action text,p_id uuid,p_token text,p_message_id uuid default null,p_body text default '',p_name text default '',p_contact_kind text default '',p_contact text default '',p_product_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.store_guest_chats; normalized text; product_title text='';
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_id is null then raise exception 'Chat unavailable' using errcode='42501'; end if;
 if p_action not in ('create','read','send') or p_action is null then raise exception 'Invalid action'; end if;
 -- Serialize creations and sends to make rate limits and retries reliable.
 if p_action='create' then
  perform pg_catalog.pg_advisory_xact_lock(719482111);
  select * into c from public.store_guest_chats where id=p_id;
  if not found then
   normalized:=private.store_normalize_contact(p_contact_kind,p_contact);
   if length(btrim(p_name))>100 or length(btrim(p_body)) not between 1 and 4000 or p_message_id is null then raise exception 'Invalid message'; end if;
   if (select count(*) from public.store_guest_chats where contact=normalized and created_at>now()-interval '1 hour')>=5 or (select count(*) from public.store_guest_chats where created_at>now()-interval '1 hour')>=300 then raise exception 'Too many messages'; end if;
   if p_product_id is not null then
    select name into product_title from public.store_products where id=p_product_id and active;
    if not found then raise exception 'Product unavailable'; end if;
   end if;
   insert into public.store_guest_chats(id,secret_hash,name,contact_kind,contact,product_id,product_name) values(p_id,pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')),btrim(p_name),p_contact_kind,normalized,p_product_id,product_title) returning * into c;
  end if;
 end if;
 select * into c from public.store_guest_chats where id=p_id for update;
 if not found or c.secret_hash<>pg_catalog.sha256(pg_catalog.convert_to(p_token,'UTF8')) then raise exception 'Chat unavailable' using errcode='42501'; end if;
 if p_action in ('create','send') then
  if c.status<>'open' then raise exception 'Chat closed'; end if;
  if p_message_id is null or length(btrim(p_body)) not between 1 and 4000 then raise exception 'Invalid message'; end if;
  if not exists(select 1 from public.store_guest_messages where id=p_message_id and chat_id=p_id and sender='visitor') then
   if (select count(*) from public.store_guest_messages where chat_id=p_id and sender='visitor')>=100 or exists(select 1 from public.store_guest_messages where chat_id=p_id and sender='visitor' and created_at>clock_timestamp()-interval '3 seconds') then raise exception 'Too many messages'; end if;
   insert into public.store_guest_messages(id,chat_id,sender,body) values(p_message_id,p_id,'visitor',btrim(p_body));
   update public.store_guest_chats set updated_at=now() where id=p_id;
  end if;
 end if;
 return jsonb_build_object('id',c.id,'status',c.status,'product_name',c.product_name,'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'sender',m.sender,'body',m.body,'created_at',m.created_at) order by m.created_at,m.id) from public.store_guest_messages m where chat_id=p_id),'[]'::jsonb));
end $$;
revoke all on function private.store_guest_chat(text,uuid,text,uuid,text,text,text,text,uuid) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.store_guest_chat(text,uuid,text,uuid,text,text,text,text,uuid) to anon,authenticated;
create function public.store_guest_chat(p_action text,p_id uuid,p_token text,p_message_id uuid default null,p_body text default '',p_name text default '',p_contact_kind text default '',p_contact text default '',p_product_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.store_guest_chat(p_action,p_id,p_token,p_message_id,p_body,p_name,p_contact_kind,p_contact,p_product_id); $$;
revoke all on function public.store_guest_chat(text,uuid,text,uuid,text,text,text,text,uuid) from public;
grant execute on function public.store_guest_chat(text,uuid,text,uuid,text,text,text,text,uuid) to anon,authenticated;
