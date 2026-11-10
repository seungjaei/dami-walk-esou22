-- ===== 담이 산책 일기: Supabase 설정 SQL =====
-- Supabase 대시보드 → SQL Editor → New query → 전체 붙여 넣고 Run.

-- 1) 게임 저장 테이블: 한 사람당 한 줄, 저장 데이터는 JSON 통째로
create table if not exists public.saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) 보안 정책(RLS): 각자 자기 저장만 읽고 쓸 수 있음
alter table public.saves enable row level security;

drop policy if exists "saves: 본인만 조회" on public.saves;
drop policy if exists "saves: 본인만 추가" on public.saves;
drop policy if exists "saves: 본인만 수정" on public.saves;

create policy "saves: 본인만 조회" on public.saves
  for select to authenticated using (auth.uid() = user_id);
create policy "saves: 본인만 추가" on public.saves
  for insert to authenticated with check (auth.uid() = user_id);
create policy "saves: 본인만 수정" on public.saves
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) 프로필 테이블: 친구 기능(2인 플레이)용 공개 정보 = 아이디·이름만.
--    생년월일은 여기 넣지 않고 로그인 계정 정보(auth.users의 user_metadata)에만 남는다 → 본인만 볼 수 있음.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{4,16}$'),
  name       text not null check (char_length(name) between 1 and 20),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: 로그인한 사람은 조회" on public.profiles;
drop policy if exists "profiles: 본인만 수정" on public.profiles;
create policy "profiles: 로그인한 사람은 조회" on public.profiles
  for select to authenticated using (true);
create policy "profiles: 본인만 수정" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
-- 아이디(username)는 바꿀 수 없게: 이름만 수정 허용
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;

-- 4) 회원가입하면 프로필 자동 생성
--    아이디는 클라이언트가 보낸 값이 아니라 로그인 이메일(아이디@dami-walk.game)에서만 꺼낸다 → 남의 아이디 사칭·선점 불가.
--    이메일은 Supabase가 이미 중복을 막으므로 아이디도 자동으로 하나뿐이다.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text := lower(split_part(new.email, '@', 1));
  dom   text := lower(split_part(new.email, '@', 2));
  nm    text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), '친구'), 20);
begin
  if dom <> 'dami-walk.game' or uname !~ '^[a-z0-9_]{4,16}$' then
    raise exception '허용되지 않는 아이디 형식입니다';
  end if;
  insert into public.profiles (id, username, name) values (new.id, uname, nm)
  on conflict (id) do nothing;  -- 아이디가 겹치면 오류로 가입 자체를 막음
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) 가입 후 로그인 이메일(=아이디) 변경 금지 → 프로필 아이디와 계정이 항상 일치
create or replace function public.block_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    raise exception '아이디는 바꿀 수 없습니다';
  end if;
  return new;
end; $$;
drop trigger if exists on_auth_user_email_change on auth.users;
create trigger on_auth_user_email_change before update of email on auth.users
  for each row execute function public.block_email_change();
