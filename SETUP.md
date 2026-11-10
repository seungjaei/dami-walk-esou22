# 로그인(Supabase) 설정 방법 — 10분

키는 사용자가 직접 넣습니다. **service_role 키는 어디에도 넣지 마세요.** 게임에는 공개용 anon 키만 씁니다.

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에 GitHub 계정으로 로그인 → **New project**
2. 이름 `dami-walk`, 지역 **Northeast Asia (Seoul)**, DB 비밀번호는 아무거나(따로 보관) → Create (1~2분 기다리기)

## 2. 저장 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/schema.sql` 내용을 전부 붙여 넣고 **Run** → "Success" 확인

## 3. 회원가입 설정 (게임에서 바로 가입)
1. **Authentication → Sign In / Providers → Email**
   - **Enable Email provider** 켜기 (기본값)
   - **Confirm email** **끄기** ← 꼭! (아이디로 가입하기 때문에 실제 메일이 없어요)
2. **Allow new users to sign up** 켜져 있는지 확인
3. 가입 칸: 이름 · 생년월일 · 아이디(영문·숫자 4~16자) · 비밀번호(6자 이상)
   - 아이디는 내부적으로 `아이디@dami-walk.game` 형태로 저장돼요 (메일은 안 감)
   - 생년월일은 본인 계정에만 저장, 친구에게 보이는 건 아이디·이름뿐

## 4. 게임에 연결하기 (.env)
1. **Project Settings → API** 에서 두 값 복사
   - Project URL (예: `https://abcd1234.supabase.co`)
   - **anon public** 키 (또는 `sb_publishable_...` 키). ⚠️ service_role / secret 키는 금지
2. 내 컴퓨터: 게임 폴더의 `.env` 파일에 붙여 넣고 저장 (`.env.example` 참고)
   ```
   SUPABASE_URL=https://abcd1234.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```
   - `.env`는 GitHub에 올라가지 않아요 (.gitignore)
   - 내 컴퓨터에서 실행할 땐 `node scripts/make-config.mjs` → `js/config.js`가 만들어져요
3. GitHub 배포용: 같은 값을 저장소 Secrets에 등록 (터미널에서 한 줄)
   ```
   gh secret set -f .env
   ```
   - 또는 GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret 에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. main에 올리면 GitHub Actions가 Secrets로 `config.js`를 만들어 자동 배포해요

## 확인
- 회원가입/로그인 → 게임 → 하루 끝(잠자기)까지 하면 Supabase **Table Editor → saves**에 내 줄이 생겨요
- 다른 기기에서 같은 계정으로 로그인하면 이어서 할 수 있어요
