-- ===== 담이 산책 일기: 멀티모드(같이 하기) 설정 SQL =====
-- schema.sql을 먼저 실행한 프로젝트에서, Supabase 대시보드 → SQL Editor → New query → 전체 붙여 넣고 Run.
-- 여러 번 실행해도 괜찮아요(이미 있는 건 건너뜀).
-- 원칙: 게임(브라우저)은 표를 직접 읽거나 쓰지 못하고, 아래 '함수(RPC)'로만 일한다. 함수가 규칙을 검사한다.

-- ---------- 0) 프로필: 친구 코드(6자리 숫자) ----------
alter table public.profiles add column if not exists friend_code text;
create unique index if not exists profiles_friend_code_key on public.profiles(friend_code);

create or replace function public.gen_friend_code() returns text
language plpgsql volatile set search_path = public as $$
declare c text;
begin
  loop
    c := (100000 + floor(random() * 900000))::int::text;
    exit when not exists (select 1 from public.profiles where friend_code = c);
  end loop;
  return c;
end; $$;

-- 예전에 가입한 사람도 프로필·코드가 생기게
insert into public.profiles (id, username, name)
select u.id, lower(split_part(u.email, '@', 1)),
       left(coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), '친구'), 20)
from auth.users u
where lower(split_part(u.email, '@', 2)) = 'dami-walk.game'
  and lower(split_part(u.email, '@', 1)) ~ '^[a-z0-9_]{4,16}$'
on conflict do nothing;
update public.profiles set friend_code = public.gen_friend_code() where friend_code is null;
alter table public.profiles alter column friend_code set default public.gen_friend_code();

-- 프로필은 이제 본인 것만 직접 볼 수 있다(남의 이름·코드는 친구 함수로만, 필요한 만큼만)
drop policy if exists "profiles: 로그인한 사람은 조회" on public.profiles;
drop policy if exists "profiles: 본인만 조회" on public.profiles;
create policy "profiles: 본인만 조회" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- ---------- 1) 표 ----------
create table if not exists public.friendships (
  id         bigserial primary key,
  requester  uuid not null references auth.users(id) on delete cascade,
  addressee  uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);
create table if not exists public.rooms (
  code       text primary key check (code ~ '^[0-9]{6}$'),
  host       uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'lobby' check (status in ('lobby', 'started')),
  created_at timestamptz not null default now(),
  started_at timestamptz
);
create table if not exists public.room_members (
  room      text not null references public.rooms(code) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  nick      text not null check (char_length(nick) between 1 and 8),
  look      jsonb not null default '{}'::jsonb,
  ready     boolean not null default false,
  joined_at timestamptz not null default now(),
  save      jsonb,
  save_at   timestamptz,
  primary key (room, user_id),
  unique (room, nick)
);
create table if not exists public.room_invites (
  room       text not null references public.rooms(code) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  from_user  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room, to_user)
);
-- 직접 접근은 전부 막고(정책 없음 = 아무도 못 읽고 못 씀) 함수로만
-- 친구 요청 기록(코드 마구 넣어 보기 막기: 1시간에 30번까지)
create table if not exists public.friend_req_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists friend_req_log_idx on public.friend_req_log(user_id, at);
alter table public.friend_req_log enable row level security;
revoke all on public.friend_req_log from anon, authenticated;
alter table public.friendships  enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.room_invites enable row level security;
revoke all on public.friendships, public.rooms, public.room_members, public.room_invites from anon, authenticated;

-- ---------- 2) 친구 ----------
-- 내 이름·친구 코드
create or replace function public.my_profile() returns json
language sql security definer stable set search_path = public as $$
  select json_build_object('name', p.name, 'code', p.friend_code) from public.profiles p where p.id = auth.uid();
$$;

-- 코드로 친구 요청 (상대가 이미 나에게 요청했으면 바로 친구)
create or replace function public.friend_request(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); other uuid; f public.friendships;
begin
  if me is null then raise exception '로그인이 필요해요'; end if;
  if p_code !~ '^[0-9]{6}$' then return 'bad'; end if;
  if (select count(*) from public.friend_req_log where user_id = me and at > now() - interval '1 hour') >= 30 then return 'limit'; end if;
  insert into public.friend_req_log (user_id) values (me);
  delete from public.friend_req_log where at < now() - interval '1 day';
  select id into other from public.profiles where friend_code = p_code;
  if other is null then return 'none'; end if;
  if other = me then return 'self'; end if;
  select * into f from public.friendships
   where (requester = me and addressee = other) or (requester = other and addressee = me);
  if found then
    if f.status = 'accepted' then return 'already'; end if;
    if f.requester = other then update public.friendships set status = 'accepted' where id = f.id; return 'accepted'; end if;
    return 'pending';
  end if;
  if (select count(*) from public.friendships where requester = me and status = 'pending') >= 20 then return 'limit'; end if;
  if (select count(*) from public.friendships where (requester = me or addressee = me) and status = 'accepted') >= 50 then return 'full'; end if;
  insert into public.friendships (requester, addressee) values (me, other);
  return 'sent';
end; $$;

-- 받은 요청 수락/거절
create or replace function public.friend_respond(p_id bigint, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_accept then
    update public.friendships set status = 'accepted' where id = p_id and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships where id = p_id and addressee = auth.uid() and status = 'pending';
  end if;
end; $$;

-- 친구 끊기 / 보낸 요청 취소
create or replace function public.friend_remove(p_id bigint) returns void
language sql security definer set search_path = public as $$
  delete from public.friendships where id = p_id and (requester = auth.uid() or addressee = auth.uid());
$$;

-- 친구창 목록: kind = friend(친구) / in(받은 요청) / out(보낸 요청). 보이는 건 가입 이름과 친구 코드뿐.
-- 내가 보낸 요청(out)은 상대가 수락하기 전까지 이름을 보여 주지 않는다(코드만) → 코드로 남의 이름 알아내기 불가
create or replace function public.friend_list() returns table (kind text, id bigint, name text, code text)
language sql security definer stable set search_path = public as $$
  select case when f.status = 'accepted' then 'friend' when f.addressee = auth.uid() then 'in' else 'out' end,
         f.id, case when f.status = 'accepted' or f.addressee = auth.uid() then p.name end, p.friend_code
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where f.requester = auth.uid() or f.addressee = auth.uid()
  order by 1, p.name;
$$;

create or replace function public.is_friend(a uuid, b uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;

-- ---------- 3) 방 ----------
create or replace function public.clean_nick(p text) returns text
language sql immutable as $$ select left(trim(regexp_replace(coalesce(p, ''), '[\x00-\x1f<>]', '', 'g')), 8) $$;

-- 방 만들기: 나는 방장, 별명은 이 방에서 고정
create or replace function public.room_create(p_nick text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text; n text := public.clean_nick(p_nick);
begin
  if me is null then raise exception '로그인이 필요해요'; end if;
  if n = '' then raise exception '별명을 넣어 주세요'; end if;
  if (select count(*) from public.room_members where user_id = me) >= 10 then raise exception '방은 10개까지만 가질 수 있어요'; end if;
  loop
    c := (100000 + floor(random() * 900000))::int::text;
    exit when not exists (select 1 from public.rooms where code = c);
  end loop;
  insert into public.rooms (code, host) values (c, me);
  insert into public.room_members (room, user_id, nick) values (c, me, n);
  return c;
end; $$;

-- 친구 초대: 대기방(시작 전)에서, 방에 있는 사람이, 내 친구에게만
create or replace function public.room_invite(p_room text, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); other uuid; r public.rooms;
begin
  select * into r from public.rooms where code = p_room;
  if not found or not exists (select 1 from public.room_members where room = p_room and user_id = me) then return 'noroom'; end if;
  if r.status <> 'lobby' then return 'started'; end if;
  select id into other from public.profiles where friend_code = p_code;
  if other is null or not public.is_friend(me, other) then return 'notfriend'; end if;
  if exists (select 1 from public.room_members where room = p_room and user_id = other) then return 'already'; end if;
  if (select count(*) from public.room_members where room = p_room) >= 4 then return 'full'; end if;
  insert into public.room_invites (room, to_user, from_user) values (p_room, other, me)
  on conflict (room, to_user) do update set from_user = excluded.from_user, created_at = now();
  return 'sent';
end; $$;

-- 초대 받아 들어가기 (별명은 이때 정하고 이 방에서 고정)
create or replace function public.room_join(p_room text, p_nick text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.rooms; n text := public.clean_nick(p_nick);
begin
  select * into r from public.rooms where code = p_room for update;
  if not found then return 'noroom'; end if;
  if exists (select 1 from public.room_members where room = p_room and user_id = me) then return 'ok'; end if;
  if not exists (select 1 from public.room_invites where room = p_room and to_user = me) then return 'noinvite'; end if;
  if r.status <> 'lobby' then delete from public.room_invites where room = p_room and to_user = me; return 'started'; end if;
  if (select count(*) from public.room_members where room = p_room) >= 4 then return 'full'; end if;
  if n = '' then return 'nonick'; end if;
  if exists (select 1 from public.room_members where room = p_room and nick = n) then return 'dupnick'; end if;
  if (select count(*) from public.room_members where user_id = me) >= 10 then return 'toomany'; end if;
  insert into public.room_members (room, user_id, nick) values (p_room, me, n);
  delete from public.room_invites where room = p_room and to_user = me;
  return 'ok';
end; $$;

create or replace function public.room_decline(p_room text) returns void
language sql security definer set search_path = public as $$
  delete from public.room_invites where room = p_room and to_user = auth.uid();
$$;

-- 방 나가기 (영영 나감). 방장이 나가면 다음 사람이 방장, 아무도 없으면 방 삭제
create or replace function public.room_leave(p_room text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nxt uuid;
begin
  delete from public.room_members where room = p_room and user_id = me;
  select user_id into nxt from public.room_members where room = p_room order by joined_at limit 1;
  if nxt is null then delete from public.rooms where code = p_room;
  else update public.rooms set host = nxt where code = p_room and host = me; end if;
end; $$;

-- 내 방 목록 + 받은 초대
create or replace function public.room_mine() returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'rooms', coalesce((select json_agg(json_build_object(
        'code', r.code, 'status', r.status, 'host', r.host = auth.uid(), 'nick', m.nick,
        'n', (select count(*) from public.room_members x where x.room = r.code),
        'day', coalesce((m.save->>'day')::int, 1)) order by m.joined_at desc)
      from public.room_members m join public.rooms r on r.code = m.room where m.user_id = auth.uid()), '[]'::json),
    'invites', coalesce((select json_agg(json_build_object('code', i.room, 'from', p.name) order by i.created_at desc)
      from public.room_invites i join public.profiles p on p.id = i.from_user
      join public.rooms r on r.code = i.room and r.status = 'lobby'
      where i.to_user = auth.uid()), '[]'::json));
$$;

-- 대기방 상태 (방 사람만)
create or replace function public.room_state(p_room text) returns json
language sql security definer stable set search_path = public as $$
  select case when not exists (select 1 from public.room_members where room = p_room and user_id = auth.uid()) then null
  else (select json_build_object('code', r.code, 'status', r.status,
      'members', (select json_agg(json_build_object('nick', m.nick, 'look', m.look, 'ready', m.ready,
                     'host', m.user_id = r.host, 'me', m.user_id = auth.uid()) order by m.joined_at)
                  from public.room_members m where m.room = r.code))
    from public.rooms r where r.code = p_room) end;
$$;

-- 꾸미기 저장 + 준비. 준비하려면 강아지 종류와 이름이 있어야 함
create or replace function public.room_set(p_room text, p_look jsonb, p_ready boolean) returns text
language plpgsql security definer set search_path = public as $$
declare r public.rooms;
begin
  select * into r from public.rooms where code = p_room;
  if not found or not exists (select 1 from public.room_members where room = p_room and user_id = auth.uid()) then return 'noroom'; end if;
  if r.status <> 'lobby' then return 'started'; end if;
  if jsonb_typeof(p_look) <> 'object' or pg_column_size(p_look) > 1500 then return 'bad'; end if;
  if p_ready and not (coalesce(p_look->>'breed', '') in ('maltese', 'poodle', 'pom', 'bichon', 'shihtzu', 'chihuahua', 'yorkie')
                      and char_length(public.clean_nick(p_look->>'dog')) between 1 and 8
                      and coalesce(p_look->>'g', '') in ('m', 'f')) then return 'notset'; end if;
  update public.room_members set look = p_look, ready = p_ready where room = p_room and user_id = auth.uid();
  return 'ok';
end; $$;

-- 게임 시작: 방장만, 모두 준비했을 때. 시작하면 인원이 고정되고 초대는 사라짐
create or replace function public.room_start(p_room text) returns text
language plpgsql security definer set search_path = public as $$
declare r public.rooms;
begin
  select * into r from public.rooms where code = p_room for update;
  if not found or r.host <> auth.uid() then return 'nothost'; end if;
  if r.status <> 'lobby' then return 'ok'; end if;
  if exists (select 1 from public.room_members where room = p_room and not ready) then return 'notready'; end if;
  update public.rooms set status = 'started', started_at = now() where code = p_room;
  delete from public.room_invites where room = p_room;
  return 'ok';
end; $$;

-- 멀티 저장 (방마다, 내 것만)
create or replace function public.room_save_put(p_room text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if pg_column_size(p_data) > 300000 then raise exception '저장 데이터가 너무 커요'; end if;
  update public.room_members set save = p_data, save_at = now() where room = p_room and user_id = auth.uid();
end; $$;
create or replace function public.room_save_get(p_room text) returns jsonb
language sql security definer stable set search_path = public as $$
  select save from public.room_members where room = p_room and user_id = auth.uid();
$$;

-- 함수 실행 권한: 로그인한 사람만
do $$ declare f text; begin
  foreach f in array array['my_profile()', 'friend_request(text)', 'friend_respond(bigint,boolean)', 'friend_remove(bigint)', 'friend_list()',
    'room_create(text)', 'room_invite(text,text)', 'room_join(text,text)', 'room_decline(text)', 'room_leave(text)', 'room_mine()',
    'room_state(text)', 'room_set(text,jsonb,boolean)', 'room_start(text)', 'room_save_put(text,jsonb)', 'room_save_get(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke all on function public.is_friend(uuid, uuid) from public, anon, authenticated;
  revoke all on function public.gen_friend_code() from public, anon, authenticated;
end $$;

-- ---------- 4) 실시간 채널 잠금: 방 사람만 그 방 채널에서 듣고 말할 수 있다 ----------
-- (게임은 private 채널 'dami-room-<코드>'를 쓴다)
drop policy if exists "dami room: 방 사람만 듣기" on realtime.messages;
drop policy if exists "dami room: 방 사람만 말하기" on realtime.messages;
create policy "dami room: 방 사람만 듣기" on realtime.messages for select to authenticated
  using (realtime.topic() like 'dami-room-%' and exists (
    select 1 from public.room_members m join public.rooms r on r.code = m.room
    where m.room = substring(realtime.topic() from 11) and m.user_id = auth.uid()));
create policy "dami room: 방 사람만 말하기" on realtime.messages for insert to authenticated
  with check (realtime.topic() like 'dami-room-%' and exists (
    select 1 from public.room_members m join public.rooms r on r.code = m.room
    where m.room = substring(realtime.topic() from 11) and m.user_id = auth.uid()));
