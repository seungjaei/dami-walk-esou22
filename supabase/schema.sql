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
