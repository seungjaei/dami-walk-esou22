"use strict";
// ===== 로그인 · 클라우드 저장 (Supabase) =====
// 회원가입은 게임에서 받지 않는다. 계정은 Supabase 대시보드에서 사용자가 직접 만든 사람만 로그인할 수 있다.
const CFG=window.DAMI_CONFIG||{};
const AUTH={enabled:!!(CFG.supabaseUrl&&CFG.supabaseAnonKey),client:null,user:null,err:null,saving:false,lastCloud:0};
const SUPABASE_JS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('스크립트를 불러오지 못했어요'));document.head.appendChild(s);});}
async function authInit(){
  if(!AUTH.enabled)return;
  try{await loadScript(SUPABASE_JS);AUTH.client=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data}=await AUTH.client.auth.getSession();AUTH.user=data.session?data.session.user:null;}
  catch(e){AUTH.err='서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';AUTH.enabled=false;}
}
async function signIn(email,pw){const {data,error}=await AUTH.client.auth.signInWithPassword({email,password:pw});if(error)throw error;AUTH.user=data.user;}
async function signOut(){try{await cloudSave(true);}catch(e){}if(AUTH.client)await AUTH.client.auth.signOut();AUTH.user=null;}
async function cloudLoad(){if(!AUTH.user)return null;const {data,error}=await AUTH.client.from('saves').select('data,updated_at').eq('user_id',AUTH.user.id).maybeSingle();if(error)throw error;return data?data.data:null;}
async function cloudSave(force){
  if(!AUTH.user||!AUTH.client||AUTH.saving)return;const now=Date.now();if(!force&&now-AUTH.lastCloud<20000)return;
  AUTH.saving=true;AUTH.lastCloud=now;
  try{const {error}=await AUTH.client.from('saves').upsert({user_id:AUTH.user.id,data:SV,updated_at:new Date().toISOString()});if(error)throw error;AUTH.cloudOk=true;}
  catch(e){AUTH.cloudOk=false;console.warn('클라우드 저장 실패',e);}finally{AUTH.saving=false;}
}
const saveKey=()=>AUTH.user?'save_'+AUTH.user.id:'save';
const playerName=()=>AUTH.user?(AUTH.user.user_metadata&&AUTH.user.user_metadata.nickname)||AUTH.user.email.split('@')[0]:'혼자 하기';
function authErrMsg(e){const m=(e&&e.message)||'';if(/Invalid login/i.test(m))return '이메일이나 비밀번호가 맞지 않아요.';if(/Email not confirmed/i.test(m))return '이메일 인증이 아직 안 됐어요. (대시보드에서 Auto Confirm으로 만들어 주세요)';if(/fetch|network/i.test(m))return '인터넷 연결을 확인해 주세요.';return '로그인하지 못했어요: '+m;}

// ---------- 로그인 화면 (휴대폰 키보드 대응을 위해 HTML 입력칸 사용) ----------
function showLogin(on,msg){const el=document.getElementById('login');el.style.display=on?'flex':'none';if(msg!==undefined)document.getElementById('lmsg').textContent=msg;}
function bindLogin(onDone){
  const f=document.getElementById('lform'),btn=document.getElementById('lbtn');
  f.addEventListener('submit',async e=>{e.preventDefault();const em=document.getElementById('lemail').value.trim(),pw=document.getElementById('lpw').value;
    if(!em||!pw){showLogin(true,'이메일과 비밀번호를 넣어 주세요.');return;}
    btn.disabled=true;showLogin(true,'로그인 중…');
    try{await signIn(em,pw);document.getElementById('lpw').value='';showLogin(false,'');await onDone();}
    catch(err){showLogin(true,authErrMsg(err));}finally{btn.disabled=false;}});
}
