-- ===== 담이 산책 일기: 멀티 공동 글램핑장 (multi.sql 다음에 실행) =====
-- Supabase 대시보드 → SQL Editor → New query → 전체 붙여 넣고 Run. 여러 번 실행해도 괜찮아요.
-- 같은 방 친구들이 재료를 함께 모아(공동 창고) 한 글램핑장을 짓고, 숙소 가구도 함께 놓는다.
-- 인원이 많을수록 단계마다 필요한 재료가 늘어난다: 기본 × (1 + 0.35 × (인원 - 1)).

create table if not exists public.room_glamp (
  room       text primary key references public.rooms(code) on delete cascade,
  st         int  not null default 0 check (st between 0 and 4),
  style      text check (style in ('bell', 'dome', 'cabin')),
  pool       jsonb not null default '{}'::jsonb,   -- 공동 창고: {wood, stone, fiber, flower, coins}
  inv        jsonb not null default '{}'::jsonb,   -- 만들었지만 아직 안 놓은 가구 {id: 개수}
  furn       jsonb not null default '[]'::jsonb,   -- 놓은 가구 [{id, tx, ty}]
  ver        int  not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.room_glamp enable row level security;
revoke all on public.room_glamp from anon, authenticated;

create or replace function public.is_room_member(p_room text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.room_members where room = p_room and user_id = auth.uid());
$$;

-- 단계별 기본 재료 (게임 js/ch1.js의 GSTAGES와 같다)
create or replace function public.glamp_need(p_st int, p_n int) returns jsonb
language sql immutable as $$
  select coalesce((select jsonb_object_agg(k, ceil(v::numeric * (1 + 0.35 * greatest(0, p_n - 1)))::int)
    from jsonb_each_text(case p_st
      when 0 then '{"stone":6,"coins":20}'::jsonb
      when 1 then '{"wood":12}'::jsonb
      when 2 then '{"wood":16,"stone":8,"coins":60}'::jsonb
      when 3 then '{"wood":10,"stone":6}'::jsonb
      else '{}'::jsonb end) as e(k, v)), '{}'::jsonb);
$$;

create or replace function public.glamp_row(p_room text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object('st', g.st, 'style', g.style, 'pool', g.pool, 'inv', g.inv, 'furn', g.furn, 'ver', g.ver,
    'n', (select count(*) from public.room_members m where m.room = g.room),
    'need', public.glamp_need(g.st, (select count(*)::int from public.room_members m where m.room = g.room)))
  from public.room_glamp g where g.room = p_room;
$$;

create or replace function public.glamp_get(p_room text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(p_room) then return null; end if;
  insert into public.room_glamp (room) values (p_room) on conflict do nothing;
  return public.glamp_row(p_room);
end; $$;

-- 재료 넣기 (내 가방 → 공동 창고)
create or replace function public.glamp_give(p_room text, p_res text, p_n int) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(p_room) then return null; end if;
  if p_res not in ('wood', 'stone', 'fiber', 'flower', 'coins') or p_n < 1 or p_n > 500 then raise exception '잘못된 재료'; end if;
  insert into public.room_glamp (room) values (p_room) on conflict do nothing;
  update public.room_glamp set pool = jsonb_set(pool, array[p_res], to_jsonb(least(9999, coalesce((pool->>p_res)::int, 0) + p_n))),
    ver = ver + 1, updated_at = now() where room = p_room;
  return public.glamp_row(p_room);
end; $$;

-- 짓기: 창고 재료가 (인원에 맞는) 필요량 이상이면 한 단계 올린다
create or replace function public.glamp_build(p_room text, p_style text) returns json
language plpgsql security definer set search_path = public as $$
declare g public.room_glamp; need jsonb; n int; k text; v int;
begin
  if not public.is_room_member(p_room) then return null; end if;
  select * into g from public.room_glamp where room = p_room for update;
  if not found or g.st >= 4 then return public.glamp_row(p_room); end if;
  select count(*) into n from public.room_members where room = p_room;
  need := public.glamp_need(g.st, n);
  for k, v in select key, value::int from jsonb_each_text(need) loop
    if coalesce((g.pool->>k)::int, 0) < v then return json_build_object('short', true); end if;
    g.pool := jsonb_set(g.pool, array[k], to_jsonb((g.pool->>k)::int - v));
  end loop;
  if g.st = 2 then
    if p_style is null or p_style not in ('bell', 'dome', 'cabin') then raise exception '외형을 골라 주세요'; end if;
    g.style := p_style;
  end if;
  update public.room_glamp set st = g.st + 1, style = g.style, pool = g.pool, ver = ver + 1, updated_at = now() where room = p_room;
  return public.glamp_row(p_room);
end; $$;

-- 가구를 만들면 공동 가방에 1개 (재료는 만든 사람 가방에서 이미 씀)
create or replace function public.glamp_inv_add(p_room text, p_id text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(p_room) then return null; end if;
  if p_id !~ '^[a-z0-9]{2,12}$' then raise exception '잘못된 가구'; end if;
  update public.room_glamp set inv = jsonb_set(inv, array[p_id], to_jsonb(least(50, coalesce((inv->>p_id)::int, 0) + 1))),
    ver = ver + 1, updated_at = now() where room = p_room and st >= 3;
  return public.glamp_row(p_room);
end; $$;

-- 가구 배치 저장 (내가 본 버전과 같을 때만 → 친구와 동시에 바꾸면 다시 불러오게)
create or replace function public.glamp_place(p_room text, p_furn jsonb, p_inv jsonb, p_ver int) returns json
language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  if not public.is_room_member(p_room) then return null; end if;
  if jsonb_typeof(p_furn) <> 'array' or jsonb_array_length(p_furn) > 80 or jsonb_typeof(p_inv) <> 'object'
     or pg_column_size(p_furn) > 12000 or pg_column_size(p_inv) > 3000 then raise exception '배치 데이터가 이상해요'; end if;
  select ver into cur from public.room_glamp where room = p_room for update;
  if cur is distinct from p_ver then return json_build_object('conflict', true); end if;
  update public.room_glamp set furn = p_furn, inv = p_inv, ver = ver + 1, updated_at = now() where room = p_room;
  return public.glamp_row(p_room);
end; $$;

do $$ declare f text; begin
  foreach f in array array['glamp_get(text)', 'glamp_give(text,text,int)', 'glamp_build(text,text)', 'glamp_inv_add(text,text)', 'glamp_place(text,jsonb,jsonb,int)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke all on function public.glamp_row(text) from public, anon, authenticated;
  revoke all on function public.is_room_member(text) from public, anon, authenticated;
end $$;
