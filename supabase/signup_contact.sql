create function private.store_create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.store_profiles(user_id,full_name,contact_kind,contact,created_at)
 values(new.id,left(btrim(coalesce(new.raw_user_meta_data->>'full_name','')),100),coalesce(new.raw_user_meta_data->>'contact_kind',''),coalesce(new.raw_user_meta_data->>'contact',''),new.created_at);
 return new;
end; $$;
revoke all on function private.store_create_profile() from public,anon,authenticated;
create trigger store_profile_created after insert on auth.users for each row execute function private.store_create_profile();
