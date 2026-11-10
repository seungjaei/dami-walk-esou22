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

## 4. 게임에 연결하기
1. **Project Settings → API** 에서 두 값 복사
   - Project URL (예: `https://abcd1234.supabase.co`)
   - Project API keys 의 **anon public** 키
2. GitHub 저장소 페이지에서 `js/config.js` 열기 → 연필(✏️) 아이콘 → 따옴표 안에 붙여 넣기 → **Commit changes**
3. 1~2분 뒤 게임 링크를 새로고침하면 로그인 화면이 나와요

## 확인
- 회원가입/로그인 → 게임 → 하루 끝(잠자기)까지 하면 Supabase **Table Editor → saves**에 내 줄이 생겨요
- 다른 기기에서 같은 계정으로 로그인하면 이어서 할 수 있어요
