# 로그인(Supabase) 설정 방법 — 10분

키는 사용자가 직접 넣습니다. **service_role 키는 어디에도 넣지 마세요.** 게임에는 공개용 anon 키만 씁니다.

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에 GitHub 계정으로 로그인 → **New project**
2. 이름 `dami-walk`, 지역 **Northeast Asia (Seoul)**, DB 비밀번호는 아무거나(따로 보관) → Create (1~2분 기다리기)

## 2. 저장 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/schema.sql` 내용을 전부 붙여 넣고 **Run** → "Success" 확인

## 3. 아무나 가입 못 하게 막기 (링크를 알아도 못 들어오게)
1. **Authentication → Sign In / Providers**(또는 Settings)에서 **Allow new users to sign up** 끄기
2. **Authentication → Users → Add user → Create new user**
   - 나와 같이 할 사람, 두 계정을 만들기 (이메일 + 비밀번호)
   - **Auto Confirm User** 체크 (이메일 인증 없이 바로 로그인)

## 4. 게임에 연결하기
1. **Project Settings → API** 에서 두 값 복사
   - Project URL (예: `https://abcd1234.supabase.co`)
   - Project API keys 의 **anon public** 키
2. GitHub 저장소 페이지에서 `js/config.js` 열기 → 연필(✏️) 아이콘 → 따옴표 안에 붙여 넣기 → **Commit changes**
3. 1~2분 뒤 게임 링크를 새로고침하면 로그인 화면이 나와요

## 확인
- 로그인 → 게임 → 하루 끝(잠자기)까지 하면 Supabase **Table Editor → saves**에 내 줄이 생겨요
- 다른 기기에서 같은 계정으로 로그인하면 이어서 할 수 있어요
