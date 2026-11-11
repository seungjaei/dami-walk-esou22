"use strict";
// ===== 멀티모드(같이 하기): 친구창 · 방 만들기 · 대기방(꾸미기·준비·시작) · 모드 바꾸기 =====
// - 혼자 하기(담이)와 저장이 완전히 따로다. 멀티 저장은 방마다 Supabase room_members.save + 이 기기 사본.
// - 서버 규칙(supabase/multi.sql): 친구만 초대, 시작 전 대기방에서만 입장, 최대 4명, 시작하면 인원 고정.
// - 화면 글자는 전부 textContent로 넣는다(다른 사람이 정한 이름이 HTML로 실행되지 않게).

// ---------- 강아지 7종 · 아바타 선택지 ----------
const BREEDS={
  maltese:{name:'말티즈',P:{C:'#fbfbf7',D:'#e6e6e0',L:'#ffffff',OL:'#7a7a80',EAR:'#efeee6',ear:'flop',blush:'#f6b0bc',band:'#f28aa0'}},
  poodle:{name:'토이푸들',P:{C:'#c8864a',D:'#a86a34',L:'#e2aa72',OL:'#4a2a14',EAR:'#a86a34',ear:'flop',curly:true}},
  pom:{name:'포메라니안',P:{C:'#f2a65a',D:'#d8843a',L:'#ffd6a0',OL:'#6b3a1a',EAR:'#d8843a',ear:'point',curly:true}},
  bichon:{name:'비숑',P:{C:'#ffffff',D:'#e6e6ee',L:'#ffffff',OL:'#7a7a88',EAR:'#ececf2',ear:'flop',curly:true,blush:'#f6b0bc'}},
  shihtzu:{name:'시츄',P:{C:'#f4ecdc',D:'#ddcdb0',L:'#ffffff',OL:'#6a5038',EAR:'#a8743e',ear:'flop',mask:true}},
  chihuahua:{name:'치와와',P:{C:'#e6bc84',D:'#c89a60',L:'#fff0d8',OL:'#5a3a1a',EAR:'#d4a46a',ear:'point',short:true,mask:true}},
  yorkie:{name:'요크셔테리어',P:{C:'#d4a464',D:'#b08448',L:'#ecd0a0',OL:'#3a2a1a',EAR:'#c4924e',ear:'point',vest:true,V:'#5f6a80',VS:'#d4a464',H:'#d4a464'}},
};
const BREED_IDS=Object.keys(BREEDS);
const LOOK={hairF:['long','bun','pony','short'],hairM:['short','cap'],hairN:{long:'긴 머리',bun:'똥머리',pony:'포니테일',short:'짧은 머리',cap:'모자'},
  hc:[['#1c1820','#4a4250'],['#5a3a2a','#7a5a48'],['#a0703a','#c09060'],['#d8b060','#f0d088'],['#9a9aa4','#c0c0c8']],
  sk:['#f8dcc2','#f0c8a0','#d8a878','#b88058'],
  tc:['#c9b6e4','#f2b8c6','#9fd6a8','#a8c8f0','#f2d48a','#e07a5f'],
  bc:['#3e4a6b','#4a4a4a','#8a6a4a','#c84a5a']};
const shade=(h,k)=>{const n=parseInt(h.slice(1),16),f=c=>Math.max(0,Math.min(255,Math.round(c*k)));return '#'+[f(n>>16),f(n>>8&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('');};
const ix=(v,n)=>Number.isInteger(v)&&v>=0&&v<n?v:0;
function lookClean(l){l=l&&typeof l==='object'?l:{};const g=l.g==='m'?'m':'f',hs=g==='m'?LOOK.hairM:LOOK.hairF;
  return{g,hs:hs.includes(l.hs)?l.hs:hs[0],hc:ix(l.hc,LOOK.hc.length),sk:ix(l.sk,LOOK.sk.length),tc:ix(l.tc,LOOK.tc.length),bc:ix(l.bc,LOOK.bc.length),
    sr:g==='f'&&!!l.sr,gl:!!l.gl,breed:BREED_IDS.includes(l.breed)?l.breed:'',dog:cleanNick(l.dog)};}
function lookToHuman(l){const [h,hl]=LOOK.hc[l.hc],top=LOOK.tc[l.tc];
  return{skin:LOOK.sk[l.sk],hair:h,hairL:hl,style:l.hs,top,topD:shade(top,.88),bottom:LOOK.bc[l.bc],skirt:l.sr,sock:'#ffffff',shoe:'#7a4a2a',hat:shade(top,.8),glasses:l.gl?'#141014':null,collar:l.g==='f'?'#ffffff':null};}
function breedP(id){return Object.assign({s:1,K:'#1e1512'},(BREEDS[id]||BREEDS.maltese).P);}
// 받침 있는 이름은 '이'를 붙여 부른다(콩 → 콩이가, 보리 → 보리가)
function dogCall(n){n=n||'';const c=n.charCodeAt(n.length-1);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?n+'이':n;}

// ---------- 모드 상태 ----------
const MP={on:false,code:null,nick:'',look:null,size:0,cloudT:0,saving:false};
let MPN=null;        // 멀티에서 화면 글자의 '담이'를 내 강아지 이름으로 바꿔 보여 준다
let TITLE_MSG='';
let SOLO_SV=null;
const isMP=()=>MP.on;
const mpKey=()=>'mp_'+(AUTH.user?AUTH.user.id:'x')+'_'+MP.code;
const rpc=async(fn,args)=>{const {data,error}=await AUTH.client.rpc(fn,args||{});if(error)throw error;return data;};
const DAMI0=JSON.parse(JSON.stringify(DAMI_P)),GIRL0=JSON.parse(JSON.stringify(GIRL));
function setPersona(look){
  for(const k of Object.keys(DAMI_P))delete DAMI_P[k];for(const k of Object.keys(GIRL))delete GIRL[k];
  if(look){Object.assign(DAMI_P,breedP(look.breed));Object.assign(GIRL,lookToHuman(look));MPN=dogCall(look.dog)||'강아지';}
  else{Object.assign(DAMI_P,DAMI0);Object.assign(GIRL,GIRL0);MPN=null;}
  for(const k of Object.keys(SPR))if(/^(h_girl|p_dami|p_icon)/.test(k))delete SPR[k];}
// 멀티 저장: 이 기기 + 서버(20초에 한 번, 중요할 때는 바로)
async function mpCloudSave(force){
  if(!isMP()||MP.saving)return null;const now=Date.now();if(!force&&now-MP.cloudT<20000)return null;
  MP.saving=true;MP.cloudT=now;const code=MP.code;
  try{await rpc('room_save_put',{p_room:code,p_data:SV});return true;}catch(e){console.warn('멀티 저장 실패',e);return false;}finally{MP.saving=false;}}

async function mpPlay(code){
  mpMsg('방에 들어가는 중…');
  let st,remote=null;
  try{st=await rpc('room_state',{p_room:code});if(!st)throw new Error('방을 찾을 수 없어요');
    if(st.status!=='started'){mpLobby(code);return;}
    remote=await rpc('room_save_get',{p_room:code});}
  catch(e){mpMsg(errMsg(e));return;}
  const me=(st.members||[]).find(m=>m.me);if(!me){mpMsg('이 방의 사람이 아니에요');return;}
  if(!isMP()){try{store.set(saveKey(),SV);await cloudSave(true);}catch(e){}SOLO_SV=SV;}
  if(typeof st.chan!=='string'||!/^[0-9a-f]{64}$/.test(st.chan)){mpMsg('서버 설정(multi.sql)을 다시 실행해 주세요');return;}
  MP.on=true;MP.code=code;MP.chan=st.chan;MP.nick=me.nick;MP.look=lookClean(me.look);MP.size=(st.members||[]).length;
  MP.nicks=(st.members||[]).filter(m=>!m.me).map(m=>m.nick);   // 방 명단(서버) — 이 별명이 아닌 접속은 무시
  const local=store.get(mpKey(),null);
  let data=remote&&typeof remote==='object'?remote:null;if(local&&(!data||(local._t||0)>(data._t||0)))data=local;
  setPersona(MP.look);mpHide();
  if(data){SV=Object.assign(JSON.parse(JSON.stringify(DEF)),data);SV.muted=SOLO_SV?SOLO_SV.muted:false;startGame(false);}
  else{SV=JSON.parse(JSON.stringify(DEF));SV.muted=SOLO_SV?SOLO_SV.muted:false;startGame(true);}
  muted=SV.muted;save(true);netJoin(MP.chan,MP.nick);}
async function mpExit(silent){
  if(!isMP())return;try{SV._t=Date.now();store.set(mpKey(),SV);await mpCloudSave(true);}catch(e){}
  await netLeave();setPersona(null);MP.on=false;MP.code=null;
  if(SOLO_SV){SV=SOLO_SV;SOLO_SV=null;muted=SV.muted;}
  if(typeof G!=='undefined'&&G)G.ov=null;scene='title';sceneT=0;musicOn=false;showTouch(false);
  if(!silent)mpShow();}

// ---------- 화면 (HTML) ----------
const $m=id=>document.getElementById(id);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs||{})){if(k==='on')for(const [ev,fn] of Object.entries(v))e.addEventListener(ev,fn);else if(k==='cls')e.className=v;else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v);}
  for(const c of kids.flat())if(c!=null&&c!==false)e.appendChild(typeof c==='string'||typeof c==='number'?document.createTextNode(String(c)):c);return e;}
function errMsg(e){const m=(e&&e.message)||String(e||'');if(/fetch|network/i.test(m))return '인터넷 연결을 확인해 주세요.';if(/function .* does not exist|Could not find the function/i.test(m))return '서버 설정(multi.sql)이 아직 안 됐어요.';return m.slice(0,80);}
function mpMsg(s,ok){const e=$m('mpmsg');if(e){e.textContent=s||'';e.className=ok?'ok':'';}}
let MPV={screen:'home',poll:null,code:null,state:null,look:null,ready:false,setT:null,friends:null};
function mpShow(screen,arg){if(!AUTH.client||!AUTH.user){TITLE_MSG='같이 하기는 로그인해야 할 수 있어요';return;}
  $m('mp').style.display='flex';showTouch(false);if(screen==='lobby')mpLobby(arg);else if(screen==='friends')mpFriends();else mpHome();}
function mpHide(){$m('mp').style.display='none';mpStopPoll();}
function mpStopPoll(){if(MPV.poll){clearInterval(MPV.poll);MPV.poll=null;}}
function mpScreen(title,body,back){mpStopPoll();$m('mpt').textContent=title;const b=$m('mpbody');b.replaceChildren(...[body].flat());b.scrollTop=0;
  $m('mpback').style.visibility=back?'visible':'hidden';$m('mpback').onclick=back||null;mpMsg('');}
const btn=(label,fn,cls,dis)=>h('button',{type:'button',cls:cls||'',disabled:!!dis,on:{click:fn}},label);

// 멀티 첫 화면: 내 코드 · 친구창 · 방 만들기 · 받은 초대 · 내 방
async function mpHome(){MPV.screen='home';
  const prof=h('div',{cls:'card'},'불러오는 중…'),inv=h('div',{}),rooms=h('div',{});
  mpScreen('👫 같이 하기',[prof,h('div',{cls:'row'},btn('👥 친구창',()=>mpFriends()),btn('＋ 방 만들기',()=>mpNickForm('create'),'go')),inv,rooms],null);
  try{const [p,r]=await Promise.all([rpc('my_profile'),rpc('room_mine')]);if(MPV.screen!=='home')return;
    prof.replaceChildren(h('div',{},'내 친구 코드 ',h('b',{cls:'code'},p.code||'------')),h('div',{cls:'sub'},`${p.name}님 · 친구에게 이 코드를 알려 주세요`));
    if(r.invites.length)inv.replaceChildren(h('h3',{},'📮 받은 초대'),...r.invites.map(i=>h('div',{cls:'item'},h('span',{},`${i.from}님이 방 ${i.code}에 초대했어요`),
      h('span',{cls:'act'},btn('들어가기',()=>mpNickForm('join',i.code),'go'),btn('거절',async()=>{try{await rpc('room_decline',{p_room:i.code});}catch(e){}mpHome();},'sub')))));
    rooms.replaceChildren(h('h3',{},'🏠 내 방'),...(r.rooms.length?r.rooms.map(x=>h('div',{cls:'item'},
      h('span',{},`방 ${x.code} · ${x.status==='started'?`DAY ${x.day} · ${x.n}명`:`대기실 ${x.n}/4`} · 별명 ${x.nick}${x.host?' 👑':''}`),
      h('span',{cls:'act'},btn(x.status==='started'?'이어하기':'대기실',()=>x.status==='started'?mpPlay(x.code):mpLobby(x.code),'go'),
        btn('나가기',()=>mpConfirm(`방 ${x.code}에서 나갈까요? 이 방의 기록이 사라지고 다시 들어올 수 없어요.`,async()=>{try{await rpc('room_leave',{p_room:x.code});}catch(e){}mpHome();}),'sub')))):[h('div',{cls:'sub'},'아직 방이 없어요. [방 만들기]로 시작해 보세요!')]));}
  catch(e){prof.textContent=errMsg(e);}}
function mpConfirm(q,yes){const box=h('div',{cls:'card warn'},h('div',{},q),h('div',{cls:'row'},btn('네',()=>{box.remove();yes();},'danger'),btn('아니요',()=>box.remove(),'sub')));$m('mpbody').prepend(box);}

// 별명 정하기 (방마다 한 번, 이후 바꿀 수 없음)
function mpNickForm(kind,code){
  const inp=h('input',{type:'text',maxlength:'8',placeholder:'예: 담이언니',autocomplete:'off'});
  const go=async()=>{const n=cleanNick(inp.value);if(!n){mpMsg('별명을 넣어 주세요 (8자까지)');return;}
    try{if(kind==='create'){const c=await rpc('room_create',{p_nick:n});mpLobby(c);}
      else{const r=await rpc('room_join',{p_room:code,p_nick:n});
        const M={ok:'',noinvite:'초대가 없거나 취소됐어요',started:'이미 게임을 시작한 방이에요',full:'방이 꽉 찼어요 (4명)',dupnick:'방에 같은 별명이 있어요. 다른 별명으로 해 주세요',nonick:'별명을 넣어 주세요',noroom:'없는 방이에요',toomany:'방은 10개까지만 가질 수 있어요'};
        if(r!=='ok'){mpMsg(M[r]||r);return;}mpLobby(code);}}catch(e){mpMsg(errMsg(e));}};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  mpScreen(kind==='create'?'＋ 방 만들기':`방 ${code} 들어가기`,[h('div',{cls:'card'},h('label',{cls:'lbl'},'이 방에서 쓸 별명 (8자) — 한 번 정하면 이 방에서는 바꿀 수 없어요',inp),btn(kind==='create'?'방 만들기':'들어가기',go,'go'))],()=>mpHome());
  setTimeout(()=>inp.focus(),50);}

// 친구창: 코드로 요청 · 받은 요청 수락/거절 · 친구 목록
async function mpFriends(){MPV.screen='friends';
  const inp=h('input',{type:'text',inputmode:'numeric',maxlength:'6',placeholder:'친구 코드 6자리',autocomplete:'off'}),list=h('div',{},'불러오는 중…');
  const send=async()=>{const c=inp.value.trim();if(!/^[0-9]{6}$/.test(c)){mpMsg('친구 코드는 숫자 6자리예요');return;}
    try{const r=await rpc('friend_request',{p_code:c});const M={sent:['요청을 보냈어요! 친구가 수락하면 친구가 돼요',1],accepted:['친구가 됐어요! 🎉',1],already:['이미 친구예요'],pending:['이미 요청을 보냈어요. 수락을 기다려요'],self:['내 코드예요'],none:['그 코드의 친구를 찾지 못했어요'],limit:['요청을 너무 많이 보냈어요. 1시간 뒤에 다시 해 주세요'],full:['친구는 50명까지예요'],bad:['친구 코드는 숫자 6자리예요']};
      const [s,ok]=M[r]||[r];inp.value='';await draw();mpMsg(s,ok);}catch(e){mpMsg(errMsg(e));}};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
  const draw=async()=>{try{const L=await rpc('friend_list');MPV.friends=L.filter(f=>f.kind==='friend');
    const I=L.filter(f=>f.kind==='in'),F=MPV.friends,O=L.filter(f=>f.kind==='out');
    list.replaceChildren(
      ...(I.length?[h('h3',{},`📮 받은 요청 (${I.length})`),...I.map(f=>h('div',{cls:'item'},h('span',{},`${f.name} (${f.code})`),h('span',{cls:'act'},btn('수락',async()=>{await rpc('friend_respond',{p_id:f.id,p_accept:true}).catch(()=>{});draw();},'go'),btn('거절',async()=>{await rpc('friend_respond',{p_id:f.id,p_accept:false}).catch(()=>{});draw();},'sub'))))]:[]),
      h('h3',{},`🐾 내 친구 (${F.length})`),...(F.length?F.map(f=>h('div',{cls:'item'},h('span',{},`${f.name} (${f.code})`),h('span',{cls:'act'},btn('끊기',()=>mpConfirm(`${f.name}님과 친구를 끊을까요?`,async()=>{await rpc('friend_remove',{p_id:f.id}).catch(()=>{});draw();}),'sub')))):[h('div',{cls:'sub'},'친구 코드로 친구를 추가해 보세요')]),
      ...(O.length?[h('h3',{},'⏳ 보낸 요청'),...O.map(f=>h('div',{cls:'item'},h('span',{},`코드 ${f.code} · 수락 기다리는 중`),h('span',{cls:'act'},btn('취소',async()=>{await rpc('friend_remove',{p_id:f.id}).catch(()=>{});draw();},'sub'))))]:[]));}
    catch(e){list.textContent=errMsg(e);}};
  mpScreen('👥 친구창',[h('div',{cls:'card'},h('label',{cls:'lbl'},'친구 추가 (친구의 6자리 코드)',inp),btn('친구 요청 보내기',send,'go')),list],()=>mpHome());
  await draw();}

// ---------- 대기방 ----------
function prevCanvas(look,scale){const c=h('canvas',{width:String(52*scale),height:String(34*scale),cls:'pv'});const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const l=lookClean(look),hu=buildHuman(lookToHuman(l),'down',0);g.drawImage(hu,2*scale,1*scale,20*scale,32*scale);
  if(l.breed){const d=buildPup(breedP(l.breed),'down',0,'happy',null);g.drawImage(d,22*scale,8*scale,28*scale,25*scale);}return c;}
async function mpLobby(code){MPV.screen='lobby';MPV.code=code;MPV.state=null;MPV.look=null;
  const slots=h('div',{cls:'slots'}),setup=h('div',{cls:'card'}),foot=h('div',{cls:'row'}),inviteBox=h('div',{});
  mpScreen(`🏠 방 ${code} · 대기실`,[slots,inviteBox,setup,foot],()=>mpHome());
  const refresh=async()=>{let st;try{st=await rpc('room_state',{p_room:code});}catch(e){mpMsg(errMsg(e));return;}
    if(MPV.screen!=='lobby'||MPV.code!==code)return;
    if(!st){mpStopPoll();mpHome();mpMsg('방에서 나왔거나 방이 없어졌어요');return;}
    if(st.status==='started'){mpStopPoll();mpPlay(code);return;}
    const sig=JSON.stringify(st);if(sig===MPV.sig)return;MPV.sig=sig;MPV.state=st;
    const ms=st.members||[],me=ms.find(m=>m.me);
    slots.replaceChildren(...[0,1,2,3].map(i=>{const m=ms[i];if(!m)return h('div',{cls:'slot empty'},h('div',{cls:'sub'},'빈 자리'),h('div',{cls:'sub'},'친구 초대 ▼'));
      return h('div',{cls:'slot'+(m.ready?' rd':'')},prevCanvas(m.look,2),h('div',{cls:'nm'},(m.host?'👑 ':'')+m.nick+(m.me?' (나)':'')),
        h('div',{cls:'sub'},m.look&&m.look.dog?`${m.look.dog} · ${(BREEDS[m.look.breed]||{}).name||''}`:'꾸미는 중…'),h('div',{cls:'st'},m.ready?'✅ 준비 완료':'⏳ 준비 중'));}));
    if(!MPV.look&&me){MPV.look=lookClean(me.look);MPV.ready=me.ready;drawSetup();}
    if(me&&me.ready!==MPV.ready&&!MPV.setT){MPV.ready=me.ready;drawSetup();}
    const all=ms.length>0&&ms.every(m=>m.ready),host=me&&me.host;
    foot.replaceChildren(host?btn(all?'🎮 게임 시작!':`모두 준비하면 시작할 수 있어요 (${ms.filter(m=>m.ready).length}/${ms.length})`,async()=>{try{const r=await rpc('room_start',{p_room:code});if(r==='ok'){mpPlay(code);}else mpMsg(r==='notready'?'아직 준비 안 한 친구가 있어요':'방장만 시작할 수 있어요');}catch(e){mpMsg(errMsg(e));}},'go big',!all)
      :h('div',{cls:'sub'},'방장이 [게임 시작]을 누르면 들어가요. 시작하면 이 인원으로 고정돼요.'),
      ms.length<4?btn('👥 친구 초대',()=>mpInvite(code,inviteBox),'sub'):null);};
  const drawSetup=()=>{const L=MPV.look,dis=MPV.ready;
    const chips=(label,arr,cur,fn,lab)=>h('div',{cls:'opt'},h('span',{cls:'ol'},label),...arr.map((v,i)=>{const b=btn(lab?lab(v,i):'',()=>{fn(v,i);},'chip'+(cur(v,i)?' on':''),dis);if(!lab)b.style.background=v;return b;}));
    const set=(k,v)=>{L[k]=v;if(k==='g'){L.hs=(v==='m'?LOOK.hairM:LOOK.hairF)[0];if(v==='m')L.sr=false;}MPV.look=lookClean(L);drawSetup();pushLook(false);};
    const dogIn=h('input',{type:'text',maxlength:'8',placeholder:'강아지 이름 (8자)',value:L.dog||'',disabled:dis,autocomplete:'off'});
    let pv=prevCanvas(L,3);
    const can=!!(L.breed&&L.dog);
    const rb=btn(dis?'준비 취소':can?'✅ 준비 완료':'강아지 종류와 이름을 정하면 준비할 수 있어요',()=>{MPV.ready=!MPV.ready;drawSetup();pushLook(true);},dis?'sub':'go big',!dis&&!can);
    dogIn.addEventListener('input',()=>{L.dog=cleanNick(dogIn.value);MPV.look=lookClean(L);pushLook(false);pv.replaceWith(pv=prevCanvas(MPV.look,3));
      const ok=!!(L.breed&&L.dog);rb.disabled=!ok;rb.textContent=ok?'✅ 준비 완료':'강아지 종류와 이름을 정하면 준비할 수 있어요';});
    setup.replaceChildren(h('h3',{},'🎨 나와 강아지 꾸미기'),h('div',{cls:'setup'},h('div',{cls:'pvbox'},pv),h('div',{cls:'opts'},
      chips('성별',['f','m'],v=>L.g===v,v=>set('g',v),v=>v==='f'?'여자':'남자'),
      chips('머리',L.g==='m'?LOOK.hairM:LOOK.hairF,v=>L.hs===v,v=>set('hs',v),v=>LOOK.hairN[v]),
      chips('머리색',LOOK.hc.map(c=>c[0]),(v,i)=>L.hc===i,(v,i)=>set('hc',i)),
      chips('피부',LOOK.sk,(v,i)=>L.sk===i,(v,i)=>set('sk',i)),
      chips('윗옷',LOOK.tc,(v,i)=>L.tc===i,(v,i)=>set('tc',i)),
      chips('아래',LOOK.bc,(v,i)=>L.bc===i,(v,i)=>set('bc',i)),
      L.g==='f'?chips('치마',[false,true],v=>L.sr===v,v=>set('sr',v),v=>v?'치마':'바지'):null,
      chips('안경',[false,true],v=>L.gl===v,v=>set('gl',v),v=>v?'쓰기':'안 쓰기'))),
      h('h3',{},'🐶 함께할 강아지 (7종)'),h('div',{cls:'breeds'},...BREED_IDS.map(id=>{const c=h('canvas',{width:'56',height:'50'});const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(buildPup(breedP(id),'down',0,'happy',null),0,0,56,50);
        return h('button',{type:'button',cls:'breed'+(L.breed===id?' on':''),disabled:dis,on:{click:()=>set('breed',id)}},c,h('span',{},BREEDS[id].name));})),
      h('label',{cls:'lbl'},'강아지 이름',dogIn),rb);};
  const pushLook=(now)=>{clearTimeout(MPV.setT);MPV.setT=setTimeout(async()=>{MPV.setT=null;try{const r=await rpc('room_set',{p_room:code,p_look:MPV.look,p_ready:MPV.ready});
      if(r==='notset'){MPV.ready=false;drawSetup();mpMsg('강아지 종류와 이름을 정해 주세요');}else if(r==='started'){mpPlay(code);}else if(r!=='ok')mpMsg(r);MPV.sig='';refresh();}catch(e){mpMsg(errMsg(e));}},now?0:500);};
  MPV.sig='';await refresh();MPV.poll=setInterval(refresh,2500);}
async function mpInvite(code,box){
  if(box.childNodes.length){box.replaceChildren();return;}
  box.replaceChildren(h('div',{cls:'card'},'친구 목록 불러오는 중…'));
  try{const L=(await rpc('friend_list')).filter(f=>f.kind==='friend');
    box.replaceChildren(h('div',{cls:'card'},h('h3',{},'👥 친구 초대 (친구만 초대할 수 있어요)'),...(L.length?L.map(f=>h('div',{cls:'item'},h('span',{},`${f.name} (${f.code})`),
      h('span',{cls:'act'},btn('초대',async(e)=>{const b=e.currentTarget;try{const r=await rpc('room_invite',{p_room:code,p_code:f.code});
        const M={sent:'초대했어요! 친구의 [같이 하기]에 초대가 떠요',already:'이미 방에 있어요',full:'방이 꽉 찼어요 (4명)',started:'이미 시작한 방이에요',notfriend:'친구만 초대할 수 있어요'};mpMsg(M[r]||r,r==='sent');if(r==='sent'){b.textContent='보냄';b.disabled=true;}}catch(e2){mpMsg(errMsg(e2));}},'go')))):[h('div',{cls:'sub'},'아직 친구가 없어요. 친구창에서 코드로 추가해 주세요.')])));}
  catch(e){box.replaceChildren(h('div',{cls:'card'},errMsg(e)));}}

(function bindMP(){const el=$m('mp');if(!el)return;
  $m('mpx').addEventListener('click',()=>{mpHide();if(scene==='game')showTouch(true);});
  el.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){mpHide();}});el.addEventListener('keyup',e=>e.stopPropagation());})();
