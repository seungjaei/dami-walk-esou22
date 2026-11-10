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
  username   text unique not null,
  name       text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: 로그인한 사람은 조회" on public.profiles;
drop policy if exists "profiles: 본인만 수정" on public.profiles;
create policy "profiles: 로그인한 사람은 조회" on public.profiles
  for select to authenticated using (true);
create policy "profiles: 본인만 수정" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 4) 회원가입하면 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, name)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
          coalesce(new.raw_user_meta_data->>'name', '친구'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
