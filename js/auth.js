"use strict";
// ===== 로그인 · 클라우드 저장 (Supabase) =====
// 회원가입: 이름·생년월일·아이디·비밀번호. 아이디는 내부용 이메일(아이디@dami-walk.game)로 바꿔 Supabase Auth에 저장한다.
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
// 아이디 → 내부용 이메일 (Supabase는 이메일 형식이 필요해서 사용. 실제 메일은 보내지 않음: 대시보드에서 이메일 인증 끔)
const ID_DOMAIN='dami-walk.game';
const idToEmail=id=>`${id.toLowerCase()}@${ID_DOMAIN}`;
const ID_RE=/^[a-zA-Z0-9_]{4,16}$/;
async function signIn(id,pw){const {data,error}=await AUTH.client.auth.signInWithPassword({email:idToEmail(id),password:pw});if(error)throw error;AUTH.user=data.user;}
async function signUp(name,birth,id,pw){
  const {data,error}=await AUTH.client.auth.signUp({email:idToEmail(id),password:pw,options:{data:{name,birth,username:id.toLowerCase()}}});
  if(error)throw error;
  if(!data.session)throw new Error('NEED_CONFIRM');
  AUTH.user=data.user;}
async function signOut(){try{await cloudSave(true);}catch(e){}if(AUTH.client)await AUTH.client.auth.signOut();AUTH.user=null;}
async function cloudLoad(){if(!AUTH.user)return null;const {data,error}=await AUTH.client.from('saves').select('data,updated_at').eq('user_id',AUTH.user.id).maybeSingle();if(error)throw error;return data?data.data:null;}
async function cloudSave(force){
  if(!AUTH.user||!AUTH.client)return null;if(AUTH.saving)return null;const now=Date.now();if(!force&&now-AUTH.lastCloud<20000)return;
  AUTH.saving=true;AUTH.lastCloud=now;
  try{const {error}=await AUTH.client.from('saves').upsert({user_id:AUTH.user.id,data:SV,updated_at:new Date().toISOString()});if(error)throw error;AUTH.cloudOk=true;return true;}
  catch(e){AUTH.cloudOk=false;console.warn('클라우드 저장 실패',e);return false;}finally{AUTH.saving=false;}
}
const saveKey=()=>AUTH.user?'save_'+AUTH.user.id:'save';
const playerName=()=>AUTH.user?(AUTH.user.user_metadata&&AUTH.user.user_metadata.name)||AUTH.user.email.split('@')[0]:'혼자 하기';
function authErrMsg(e){const m=(e&&e.message)||'';
  if(/Invalid login/i.test(m))return '아이디나 비밀번호가 맞지 않아요.';
  if(/already registered|already exists/i.test(m))return '이미 있는 아이디예요. 다른 아이디를 써 주세요.';
  if(/NEED_CONFIRM|Email not confirmed/i.test(m))return '가입은 됐지만 인증 설정 때문에 못 들어가요. (Supabase에서 Confirm email 끄기)';
  if(/Password should be/i.test(m))return '비밀번호는 6자 이상으로 해 주세요.';
  if(/Signups not allowed/i.test(m))return '지금은 회원가입이 꺼져 있어요.';
  if(/fetch|network/i.test(m))return '인터넷 연결을 확인해 주세요.';return '문제가 생겼어요: '+m;}

// ---------- 로그인 화면 (휴대폰 키보드 대응을 위해 HTML 입력칸 사용) ----------
function showLogin(on,msg){const el=document.getElementById('login');el.style.display=on?'flex':'none';if(msg!==undefined)document.getElementById('lmsg').textContent=msg;}
function bindLogin(onDone){
  const f=document.getElementById('lform'),btn=document.getElementById('lbtn'),$=id=>document.getElementById(id);
  let mode='in';
  const setMode=m=>{mode=m;f.classList.toggle('signup',m==='up');$('tabIn').classList.toggle('on',m==='in');$('tabUp').classList.toggle('on',m==='up');btn.textContent=m==='up'?'가입하고 시작하기':'로그인';$('lpw').autocomplete=m==='up'?'new-password':'current-password';showLogin(true,'');};
  $('tabIn').onclick=()=>setMode('in');$('tabUp').onclick=()=>setMode('up');
  f.addEventListener('submit',async e=>{e.preventDefault();
    const id=$('lid').value.trim(),pw=$('lpw').value,name=$('lname').value.trim(),birth=$('lbirth').value;
    if(!ID_RE.test(id)){showLogin(true,'아이디는 영문·숫자 4~16자로 해 주세요.');return;}
    if(pw.length<6){showLogin(true,'비밀번호는 6자 이상으로 해 주세요.');return;}
    if(mode==='up'){if(!name){showLogin(true,'이름을 넣어 주세요.');return;}if(!birth){showLogin(true,'생년월일을 골라 주세요.');return;}if(pw!==$('lpw2').value){showLogin(true,'비밀번호가 서로 달라요. 다시 확인해 주세요.');return;}}
    btn.disabled=true;showLogin(true,mode==='up'?'가입하는 중…':'로그인 중…');
    try{if(mode==='up')await signUp(name,birth,id,pw);else await signIn(id,pw);
      $('lpw').value='';$('lpw2').value='';showLogin(false,'');await onDone();}
    catch(err){showLogin(true,authErrMsg(err));}finally{btn.disabled=false;}});
}
