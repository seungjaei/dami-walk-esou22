// .env(또는 환경변수) → js/config.js 생성. 사용법: node scripts/make-config.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const env = {};
for (const f of ['.env', 'supabase.env']) if (existsSync(f)) {
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const url = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
if (/service_role|sb_secret_/.test(key)) { console.error('⚠️ service_role/secret 키는 쓸 수 없어요. anon(publishable) 키를 넣어 주세요.'); process.exit(1); }
writeFileSync('js/config.js',
  '// 자동 생성 파일 (scripts/make-config.mjs). 직접 고치지 말고 .env 를 고치세요.\n' +
  `window.DAMI_CONFIG = { supabaseUrl: ${JSON.stringify(url)}, supabaseAnonKey: ${JSON.stringify(key)} };\n`);
console.log(url && key ? '✅ js/config.js 생성 완료 (로그인 모드)' : 'ℹ️ 값이 비어 있어 "혼자 하기" 모드로 생성했어요');
