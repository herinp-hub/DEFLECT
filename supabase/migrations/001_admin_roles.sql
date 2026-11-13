-- DEFLECT secure role and moderation backend.
-- Run this migration in the Supabase SQL Editor after enabling Supabase Auth.

create table public.deflect_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','head_admin','admin','moderator')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.deflect_bans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.deflect_admin_actions (
  id bigint generated always as identity primary key,
  target_user uuid references auth.users(id) on delete cascade,
  action text not null check (action in ('kick','ban','unban','announce','event','role_change')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.deflect_roles enable row level security;
alter table public.deflect_bans enable row level security;
alter table public.deflect_admin_actions enable row level security;

grant select on public.deflect_roles to authenticated;
grant select on public.deflect_bans to authenticated;
grant select on public.deflect_admin_actions to authenticated, anon;

create policy "authenticated users can read role labels"
  on public.deflect_roles for select to authenticated using (true);

create policy "users can read their own ban status"
  on public.deflect_bans for select to authenticated using (user_id = auth.uid());

create policy "staff can read ban records"
  on public.deflect_bans for select to authenticated
  using (exists (
    select 1 from public.deflect_roles r
    where r.user_id = auth.uid()
      and r.role in ('owner','head_admin','admin')
  ));

create policy "users can read actions addressed to them and public notices"
  on public.deflect_admin_actions for select to authenticated
  using (target_user = auth.uid() or action in ('announce','event'));

create policy "guests can read public admin notices"
  on public.deflect_admin_actions for select to anon
  using (action in ('announce','event'));

create policy "staff can read moderation audit log"
  on public.deflect_admin_actions for select to authenticated
  using (exists (
    select 1 from public.deflect_roles r
    where r.user_id = auth.uid()
      and r.role in ('owner','head_admin','admin','moderator')
  ));

create or replace function public.deflect_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.deflect_roles where user_id = auth.uid()), 'player');
$$;

create or replace function public.deflect_assign_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare caller_role text;
begin
  select role into caller_role from public.deflect_roles where user_id = auth.uid();
  if caller_role is distinct from 'owner' then
    raise exception 'Only the owner can assign or revoke roles';
  end if;
  if new_role not in ('head_admin','admin','moderator','player') then
    raise exception 'Invalid role';
  end if;
  if exists(select 1 from public.deflect_roles where user_id = target_user and role = 'owner') then
    raise exception 'The owner role cannot be changed here';
  end if;
  if new_role = 'player' then
    delete from public.deflect_roles where user_id = target_user;
  else
    insert into public.deflect_roles(user_id, role, created_by)
    values(target_user, new_role, auth.uid())
    on conflict(user_id) do update set role = excluded.role, created_by = auth.uid(), created_at = now();
  end if;
  insert into public.deflect_admin_actions(target_user, action, payload, created_by)
  values(target_user, 'role_change', jsonb_build_object('role', new_role), auth.uid());
end;
$;

create or replace function public.deflect_admin_action(target_user uuid, action_name text, action_payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare caller_role text; target_role text; action_id bigint;
begin
  select role into caller_role from public.deflect_roles where user_id = auth.uid();
  if caller_role is null then raise exception 'Admin sign-in required'; end if;
  if action_name not in ('kick','ban','unban','announce','event') then raise exception 'Invalid action'; end if;
  if action_name in ('kick','ban','unban') and target_user is null then raise exception 'A target player is required'; end if;
  if action_name in ('announce','event') and caller_role not in ('owner','head_admin') then raise exception 'Only owner or head admin can run events'; end if;
  if action_name in ('ban','unban') and caller_role not in ('owner','head_admin','admin') then raise exception 'Insufficient permission'; end if;
  if action_name = 'kick' and caller_role not in ('owner','head_admin','admin','moderator') then raise exception 'Insufficient permission'; end if;
  select role into target_role from public.deflect_roles where user_id = target_user;
  if target_role = 'owner' then raise exception 'The owner cannot be moderated'; end if;
  if caller_role = 'moderator' and coalesce(target_role,'player') <> 'player' then raise exception 'Moderators can only moderate players'; end if;
  if caller_role = 'admin' and target_role in ('owner','head_admin','admin') then raise exception 'Insufficient role hierarchy'; end if;
  if caller_role = 'head_admin' and target_role in ('owner','head_admin') then raise exception 'Insufficient role hierarchy'; end if;
  if action_name = 'ban' then
    insert into public.deflect_bans(user_id, reason, created_by)
    values(target_user, coalesce(action_payload->>'reason',''), auth.uid())
    on conflict(user_id) do update set reason=excluded.reason, created_by=auth.uid(), created_at=now();
  elsif action_name = 'unban' then
    delete from public.deflect_bans where user_id=target_user;
  end if;
  insert into public.deflect_admin_actions(target_user, action, payload, created_by)
  values(target_user, action_name, coalesce(action_payload,'{}'::jsonb), auth.uid())
  returning id into action_id;
  return action_id;
end;
$$;

revoke all on function public.deflect_my_role() from public, anon;
revoke all on function public.deflect_assign_role(uuid,text) from public, anon;
revoke all on function public.deflect_admin_action(uuid,text,jsonb) from public, anon;
grant execute on function public.deflect_my_role() to authenticated;
grant execute on function public.deflect_assign_role(uuid,text) to authenticated;
grant execute on function public.deflect_admin_action(uuid,text,jsonb) to authenticated;

-- Owner bootstrap is intentionally manual and one-time. After the owner signs in
-- to DEFLECT, copy their auth user UUID from the Supabase Auth users page and run:
-- insert into public.deflect_roles(user_id, role) values ('YOUR_AUTH_USER_UUID', 'owner');
-- Never expose a service_role key in the browser or repository.
