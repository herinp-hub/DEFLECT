CREATE OR REPLACE FUNCTION public.deflect_join_public_server(p_player_id uuid, p_player_name text)
 RETURNS TABLE(server_id uuid, server_code text, real_players integer, bot_count integer, max_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_server public.deflect_public_servers%rowtype;
  v_name text;
  v_count integer;
  v_code text;
begin
  if auth.uid() is distinct from p_player_id then
    raise exception 'Authenticated player identity required';
  end if;
  if p_player_id is null then
    raise exception 'player_id is required';
  end if;

  v_name := left(regexp_replace(coalesce(p_player_name, 'Pilot'), '[^a-zA-Z0-9 _-]', '', 'g'), 16);
  if btrim(v_name) = '' then
    v_name := 'Pilot';
  end if;

  perform pg_advisory_xact_lock(734821905);

  delete from public.deflect_public_server_players
   where last_seen < now() - interval '45 seconds';

  update public.deflect_public_servers s
     set real_players = (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = s.id
         ),
         bot_count = greatest(0, s.max_players - (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = s.id
         ))
   where true;

  delete from public.deflect_public_server_players
   where player_id = p_player_id;

  select s.*
    into v_server
    from public.deflect_public_servers s
   where s.real_players < s.max_players
     and s.last_active > now() - interval '45 seconds'
   order by s.real_players desc, s.created_at asc
   limit 1
   for update;

  if not found then
    loop
      v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (
        select 1 from public.deflect_public_servers s where s.server_code = v_code
      );
    end loop;

    insert into public.deflect_public_servers(server_code)
    values (v_code)
    returning * into v_server;
  end if;

  insert into public.deflect_public_server_players(player_id, server_id, player_name)
  values (p_player_id, v_server.id, v_name);

  select count(*)::integer
    into v_count
    from public.deflect_public_server_players p
   where p.server_id = v_server.id;

  update public.deflect_public_servers s
     set real_players = v_count,
         bot_count = greatest(0, s.max_players - v_count),
         last_active = now()
   where s.id = v_server.id
   returning s.* into v_server;

  return query
  select v_server.id, v_server.server_code, v_server.real_players, v_server.bot_count, v_server.max_players;
end;
$function$


CREATE OR REPLACE FUNCTION public.deflect_leave_public_server(p_player_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_server_id uuid; v_count integer;
begin
  if auth.uid() is distinct from p_player_id then
    raise exception 'Authenticated player identity required';
  end if;
  perform pg_advisory_xact_lock(734821905);
  delete from public.deflect_public_server_players
  where player_id = p_player_id
  returning server_id into v_server_id;
  if v_server_id is null then return false; end if;
  select count(*)::integer into v_count
  from public.deflect_public_server_players where server_id = v_server_id;
  update public.deflect_public_servers
  set real_players = v_count, bot_count = greatest(0, max_players - v_count), last_active = now()
  where id = v_server_id;
  return true;
end;
$function$


CREATE OR REPLACE FUNCTION public.deflect_public_server_heartbeat(p_player_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_server_id uuid;
begin
  if auth.uid() is distinct from p_player_id then
    raise exception 'Authenticated player identity required';
  end if;
  perform pg_advisory_xact_lock(734821905);

  update public.deflect_public_server_players
     set last_seen = now()
   where player_id = p_player_id
   returning server_id into v_server_id;

  if v_server_id is null then
    return false;
  end if;

  delete from public.deflect_public_server_players p
   where p.server_id = v_server_id
     and p.last_seen < now() - interval '45 seconds';

  update public.deflect_public_servers s
     set real_players = (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = v_server_id
         ),
         bot_count = greatest(0, s.max_players - (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = v_server_id
         )),
         last_active = now()
   where s.id = v_server_id;

  return true;
end;
$function$


CREATE OR REPLACE FUNCTION public.deflect_public_server_state(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_server_id uuid;
  v_server public.deflect_public_servers%rowtype;
begin
  if auth.uid() is distinct from p_player_id then
    raise exception 'Authenticated player identity required';
  end if;
  perform pg_advisory_xact_lock(734821905);

  select p.server_id
    into v_server_id
    from public.deflect_public_server_players p
   where p.player_id = p_player_id
     and p.last_seen >= now() - interval '45 seconds';

  if v_server_id is null then
    return jsonb_build_object('active', false, 'bot_count', 16, 'real_players', 0, 'max_players', 16);
  end if;

  delete from public.deflect_public_server_players p
   where p.server_id = v_server_id
     and p.last_seen < now() - interval '45 seconds';

  update public.deflect_public_servers s
     set real_players = (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = v_server_id
         ),
         bot_count = greatest(0, s.max_players - (
           select count(*)::integer
             from public.deflect_public_server_players p
            where p.server_id = v_server_id
         )),
         last_active = now()
   where s.id = v_server_id
   returning s.* into v_server;

  return jsonb_build_object(
    'active', true,
    'server_id', v_server.id,
    'server_code', v_server.server_code,
    'real_players', v_server.real_players,
    'bot_count', v_server.bot_count,
    'max_players', v_server.max_players
  );
end;
$function$


REVOKE ALL ON FUNCTION public.deflect_join_public_server(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deflect_join_public_server(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.deflect_leave_public_server(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deflect_leave_public_server(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.deflect_public_server_heartbeat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deflect_public_server_heartbeat(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.deflect_public_server_state(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deflect_public_server_state(uuid) TO authenticated, service_role;