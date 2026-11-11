"use strict";
// ===== 친구와 산책 (멀티플레이 1단계) — Supabase Realtime 채널 =====
// - 친구 코드 방: 숫자 6자리 코드가 같은 사람끼리만 'dami-room-<코드>' 채널에서 만난다.
// - 주고받는 것: 별명(직접 정함, 8자), 지역, 위치·방향, 담이 자세·옷. 이메일·이름·생년월일·계정 id는 보내지 않는다.
// - 말풍선은 정해진 문장 번호만 보낸다(자유 채팅 없음 → 욕설·개인정보 걱정 없음).
// - 뼈다귀·레벨·일기 저장은 지금처럼 각자 기기/클라우드에 둔다(서로 못 바꿈).
const NET={room:null,ch:null,peers:{},me:null,status:'off',sendT:0,beatT:0,sig:'',joinT:0};
const NET_HZ=6,NET_BEAT=2,NET_STALE=12;
const PHRASES=['안녕하세요!','같이 걸어요~','담이 귀엽죠?','저쪽 가 볼까요?','고마워요!','또 만나요!'];
const PEER_TOPS=[['#9fd6a8','#86c491'],['#f2b8a0','#e09f86'],['#a8c8f0','#8fb2de'],['#f2d48a','#ddbd6f'],['#e8a8c8','#d290b2']];
const ROOM_RE=/^[0-9]{6}$/;
const netOn=()=>NET.status==='on';
const netAreaKey=()=>G&&G.area?(G.area.kind==='home'?'home':G.area.kind==='house'?'h:'+G.area.id:G.area.place?'z:'+G.area.place:'town'):'';
const cleanNick=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,8);
const numOk=v=>typeof v==='number'&&isFinite(v)&&Math.abs(v)<20000;
const DIR_OK=['down','up','side'],POSE_OK=['walk','happy','sit','eat','sniff','sleep','scared'];

// ---------- 방 들어가기 · 나가기 ----------
async function netJoin(code,nick){
  if(!AUTH.client){toast('로그인해야 친구와 산책할 수 있어요');return false;}
  if(!ROOM_RE.test(code)){toast('방 코드는 숫자 6자리예요');return false;}
  await netLeave(true);
  NET.me={id:Math.random().toString(36).slice(2,12),nick:cleanNick(nick)||'산책친구'};
  NET.room=code;NET.status='connecting';NET.peers={};NET.sig='';NET.joinT=Date.now();
  const ch=AUTH.client.channel('dami-room-'+code,{config:{broadcast:{self:false},presence:{key:NET.me.id}}});
  ch.on('broadcast',{event:'st'},({payload})=>netOnState(payload))
    .on('broadcast',{event:'say'},({payload})=>netOnSay(payload))
    .on('broadcast',{event:'nose'},({payload})=>netOnNose(payload))
    .on('presence',{event:'sync'},netOnSync);
  NET.ch=ch;
  ch.subscribe(async s=>{
    if(NET.ch!==ch)return;
    if(s==='SUBSCRIBED'){const first=NET.status!=='on';NET.status='on';NET.sig='';try{await ch.track({n:NET.me.nick});}catch(e){}if(first)toast(`친구방 ${code} 에 들어왔어요`);}
    else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'){NET.status='err';}
    else if(s==='CLOSED'&&NET.status!=='off'){NET.status='err';}
  });
  try{store.set('room',{code,nick:NET.me.nick});}catch(e){}
  return true;
}
async function netLeave(silent){
  const ch=NET.ch;NET.ch=null;NET.status='off';NET.peers={};NET.room=null;
  if(ch&&AUTH.client){try{await ch.untrack();}catch(e){}try{await AUTH.client.removeChannel(ch);}catch(e){}}
  if(!silent)toast('친구방에서 나왔어요');
}

// ---------- 받기 ----------
function netPeer(id){if(typeof id!=='string'||!/^[a-z0-9]{6,12}$/.test(id)||id===(NET.me&&NET.me.id))return null;
  let p=NET.peers[id];if(!p){const v=PEER_TOPS[strSeed(id)%PEER_TOPS.length];p=NET.peers[id]={id,nick:'친구',v,P:Object.assign({},GIRL,{top:v[0],topD:v[1]}),seen:0,anim:0,danim:0,fresh:true};}
  return p;}
function netOnSync(){if(!NET.ch)return;const S=NET.ch.presenceState(),alive=new Set();
  for(const [id,arr] of Object.entries(S)){const m=arr&&arr[0];const p=netPeer(id);if(!p)continue;alive.add(id);
    const nk=cleanNick(m&&m.n)||'친구';if(p.fresh&&!p.joined){p.joined=true;if(Date.now()-NET.joinT>1500)toast(`${nk}님이 들어왔어요`);}p.nick=nk;p.seen=Math.max(p.seen,performance.now()/1000);}
  for(const id of Object.keys(NET.peers))if(!alive.has(id)){const p=NET.peers[id];if(p.joined)toast(`${p.nick}님이 나갔어요`);delete NET.peers[id];}
  NET.sig='';}
function netOnState(m){if(!m)return;const p=netPeer(m.i);if(!p)return;
  if(![m.x,m.y,m.X,m.Y].every(numOk))return;
  p.a=typeof m.a==='string'?m.a.slice(0,20):'';p.tx=m.x;p.ty=m.y;p.dir=DIR_OK.includes(m.d)?m.d:'down';p.face=m.f<0?-1:1;p.mv=!!m.m;
  p.tX=m.X;p.tY=m.Y;p.D=DIR_OK.includes(m.D)?m.D:'down';p.F=m.F<0?-1:1;p.pose=POSE_OK.includes(m.P)?m.P:'happy';p.M=!!m.M;
  p.eq=(typeof m.e==='string'&&ACCS[m.e])?m.e:null;
  if(p.fresh||p.x===undefined||Math.hypot(p.tx-p.x,p.ty-p.y)>90){p.x=p.tx;p.y=p.ty;p.X=p.tX;p.Y=p.tY;}
  p.fresh=false;p.seen=performance.now()/1000;}
const peerHere=p=>p&&!p.fresh&&p.x!==undefined&&p.a===netAreaKey()&&performance.now()/1000-p.seen<NET_STALE;
function netOnSay(m){if(!m)return;const p=netPeer(m.i);const t=PHRASES[m.t|0];if(!p||!t)return;
  if(peerHere(p)&&scene==='game'){bubble(p,t,2.6,'#3d6a3a');SFX.sel();}else toast(`${p.nick}: ${t}`);}
function netOnNose(m){if(!m||!NET.me||m.to!==NET.me.id)return;const p=netPeer(m.i);if(!p||!peerHere(p)||scene!=='game')return;noseHappy(p,false);}

// ---------- 보내기 (초당 6번까지, 바뀐 게 없으면 2초에 한 번만) ----------
function netSend(ev,payload){if(!netOn()||!NET.ch)return;NET.ch.send({type:'broadcast',event:ev,payload}).catch(()=>{});}
function netTick(dt){
  if(!NET.ch)return;const now=performance.now()/1000;
  for(const p of Object.values(NET.peers)){if(p.x===undefined)continue;const k=Math.min(1,dt*10);
    p.x=lerp(p.x,p.tx,k);p.y=lerp(p.y,p.ty,k);p.X=lerp(p.X,p.tX,k);p.Y=lerp(p.Y,p.tY,k);
    if(p.mv)p.anim+=dt*7;if(p.M)p.danim+=dt*9;}
  if(!netOn()||scene!=='game'||!G||!G.area)return;
  NET.sendT-=dt;NET.beatT-=dt;if(NET.sendT>0)return;NET.sendT=1/NET_HZ;
  const o=G.pl,d=G.dami,[dd,pose]=damiPose();
  const m={i:NET.me.id,a:netAreaKey(),x:Math.round(o.x),y:Math.round(o.y),d:o.dir,f:o.face||1,m:o.moving?1:0,X:Math.round(d.x),Y:Math.round(d.y),D:dd,F:d.face||1,P:d.state==='bath'?'sit':pose,M:d.moving?1:0,e:SV.eq||''};
  const sig=JSON.stringify(m);if(sig===NET.sig&&NET.beatT>0)return;NET.sig=sig;NET.beatT=NET_BEAT;netSend('st',m);
}

// ---------- 함께 하기 ----------
function noseHappy(p,mine){const d=G.dami;hearts(d.x,d.y-14,4);hearts(p.X,p.Y-14,4);SFX.heart();
  bubble('dami',pick(['킁킁! 반가워~','냄새 좋다!','친구다 친구!']),1.8,'#d94f6a');
  const T0=SV.today,met=(T0.netMet=T0.netMet||[]);
  if(!met.includes(p.nick)){met.push(p.nick);addCoins(3);gainAff(1);addSt('mood',10);toast(`${p.nick}네 담이와 코 인사! +3 뼈다귀`);logDay(`친구 ${p.nick}네 담이와 코 인사를 했다. 꼬리가 멈추질 않았다.`);save();}
  else addSt('mood',4);}
function openFriendMenu(p){SFX.sel();
  const items=[{label:'코 인사 (담이끼리)',fn:()=>{closeOv();if(Math.hypot(G.dami.x-p.X,G.dami.y-p.Y)>60){bubble('dami','친구 강아지한테 더 가까이!',1.6);return;}noseHappy(p,true);netSend('nose',{i:NET.me.id,to:p.id});}}]
    .concat(PHRASES.map((s,i)=>({label:'💬 '+s,fn:()=>{closeOv();netSay(i);}})),[{label:'닫기',fn:closeOv}]);
  openMenu({title:`${p.nick}님`,items});}
function netSay(i){if(!netOn())return;bubble('pl',PHRASES[i],2.6,'#3d6a3a');netSend('say',{i:NET.me.id,t:i});}
function netNear(){if(!netOn())return null;const o=G.pl;let best=null,bd=32;
  for(const p of Object.values(NET.peers))if(peerHere(p)){const q=Math.hypot(p.x-o.x,p.y-o.y);if(q<bd){bd=q;best=p;}}return best?{p:best,d:bd}:null;}
const AREA_NAME=k=>k==='home'?'자기 집':k==='town'?'마을':k.startsWith('h:')?(HOUSE_NAME[k.slice(2)]||'집 안'):k.startsWith('z:')?((PLACES[k.slice(2)]||{}).name||'산책길'):'?';
function openRoomMenu(){SFX.sel();
  if(!AUTH.client){openDialog({name:'담이',id:'dami',lines:['친구와 산책은 로그인해야 할 수 있어요.']});return;}
  if(!NET.ch){openMenu({title:'친구와 산책',items:[
    {label:'새 방 만들기 (코드 받기)',fn:()=>{closeOv();showRoomForm(String(Math.floor(100000+Math.random()*900000)),true);}},
    {label:'친구 코드로 들어가기',fn:()=>{closeOv();showRoomForm('',false);}},
    {label:'닫기',fn:closeOv}]});return;}
  const ps=Object.values(NET.peers).filter(p=>!p.fresh);
  const st0=NET.status==='on'?`${ps.length+1}명`:'연결 중…';
  openMenu({title:`친구방 ${NET.room} · ${st0}`,items:ps.map(p=>({label:`${p.nick} — ${peerHere(p)?'여기 있어요!':AREA_NAME(p.a||'')}`,dis:true,fn:()=>{}}))
    .concat([{label:'말풍선 보내기',fn:()=>openMenu({title:'말풍선',items:PHRASES.map((s,i)=>({label:s,fn:()=>{closeOv();netSay(i);}})).concat([{label:'닫기',fn:closeOv}])})},
      {label:'방 나가기',fn:()=>{closeOv();netLeave(false);try{store.set('room',null);}catch(e){}}},{label:'닫기',fn:closeOv}])});}

// ---------- 방 코드 입력 화면 (휴대폰 키보드용 HTML 입력칸) ----------
function showRoomForm(code,create){const el=document.getElementById('room'),$=id=>document.getElementById(id);
  const prev=store.get('room',null)||{};
  $('rnick').value=prev.nick||'';$('rcode').value=code||prev.code||'';$('rcode').readOnly=!!create;
  $('rtitle').textContent=create?'새 친구방 만들기':'친구방 들어가기';$('rbtn').textContent=create?'방 만들고 들어가기':'들어가기';
  $('rmsg').textContent=create?'이 코드를 친구에게 알려 주세요':'친구에게 받은 숫자 6자리를 넣어요';
  el.style.display='flex';G.ov={type:'roomform'};showTouch(false);setTimeout(()=>$(prev.nick?'rcode':'rnick').focus(),50);}
function hideRoomForm(){document.getElementById('room').style.display='none';if(G&&G.ov&&G.ov.type==='roomform')G.ov=null;showTouch(true);}
(function bindRoomForm(){const f=document.getElementById('rform');if(!f)return;const $=id=>document.getElementById(id);
  f.addEventListener('submit',async e=>{e.preventDefault();const nick=cleanNick($('rnick').value),code=$('rcode').value.trim();
    if(!nick){$('rmsg').textContent='별명을 넣어 주세요 (8자까지)';return;}
    if(!ROOM_RE.test(code)){$('rmsg').textContent='방 코드는 숫자 6자리예요';return;}
    hideRoomForm();await netJoin(code,nick);});
  $('rcancel').addEventListener('click',hideRoomForm);
  f.addEventListener('keydown',e=>e.stopPropagation());f.addEventListener('keyup',e=>e.stopPropagation());})();

// ---------- 그리기 ----------
function drawPeer(p,t){const fr=p.mv?[0,1,0,3][Math.floor(p.anim)%4]:0;
  if(G.area.outdoor){const hand=p.dir==='side'?{x:p.x+p.face,y:p.y-11}:p.dir==='down'?{x:p.x+5,y:p.y-10}:{x:p.x-5,y:p.y-11},har=p.D==='side'?{x:p.X+p.F*2,y:p.Y-12}:{x:p.X,y:p.Y-11};
    for(let i=0;i<=30;i++){const k=i/30;px(lerp(hand.x,har.x,k),lerp(hand.y,har.y,k)+Math.sin(k*Math.PI)*6,1,1,'#3d8a5a');}}
  ell(ctx,p.x,p.y,6,2,'rgba(0,0,0,.2)');const im=humanImg('peer'+p.v[0],p.P,p.dir,fr);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.dir==='side'&&p.face<0)ctx.scale(-1,1);ctx.drawImage(im,-10,-30);ctx.restore();
  if(G.bubbles.some(b=>b.who===p))return;
  ctx.font='9px G9';const w=Math.ceil(ctx.measureText(p.nick).width)+8;px(Math.round(p.x-w/2),Math.round(p.y-46),w,11,'rgba(61,106,58,.88)');txt(p.nick,Math.round(p.x),Math.round(p.y-45),'#fff',9,'center','G9');}
function drawPeerDog(p){const fr=p.M?[0,1,0,3][Math.floor(p.danim)%4]:0;ell(ctx,p.X,p.Y,7,2.2,'rgba(0,0,0,.2)');
  const im=pupImg(DAMI_P,'dami',p.D,fr,p.pose,p.eq);ctx.save();ctx.translate(Math.round(p.X),Math.round(p.Y));if(p.D==='side'&&p.F<0)ctx.scale(-1,1);ctx.drawImage(im,-14,-21);ctx.restore();}
function netDrawList(L){if(!NET.ch)return;for(const p of Object.values(NET.peers))if(peerHere(p)){L.push({y:p.y,peer:p});L.push({y:p.Y,peerDog:p});}}
function netHUD(){if(!NET.ch)return;const n=Object.values(NET.peers).filter(p=>!p.fresh).length+1;
  const s=NET.status==='on'?`친구방 ${NET.room} · ${n}명`:`친구방 ${NET.room} · 연결 중…`;ctx.font='9px G9';const w=ctx.measureText(s).width+10;
  px(184,6,w,13,NET.status==='on'?'rgba(61,106,58,.88)':'rgba(120,90,60,.85)');txt(s,189,8,'#fff',9,'left','G9');}
function netMinimap(x,y,k){if(!NET.ch)return;for(const p of Object.values(NET.peers))if(peerHere(p)){px(x+p.x*k-2,y+p.y*k-2,4,4,'#1e4a28');px(x+p.x*k-1,y+p.y*k-1,2,2,'#9fe0a0');}}
