"use strict";
// ===== 멀티모드 게임 안: 같은 방 친구 보이기·코 인사·말풍선·날짜/시계 맞추기 =====
// - 채널 'dami-room-<방코드>'는 private: Supabase가 '그 방 사람(room_members)'만 듣고 말하게 막는다(supabase/multi.sql 4번).
// - 주고받는 것: 방 별명, 꾸민 모습(정해진 선택지 번호), 강아지 종류·이름, 위치·자세. 계정 id·이름·생년월일은 보내지 않는다.
// - 말풍선은 정해진 문장 번호만(자유 채팅 없음).
const NET={ch:null,ok:new Set(),peers:{},me:null,status:'off',sendT:0,beatT:0,sig:'',joinT:0,members:[],host:false,hostId:null,sleeping:false,clkT:0};
const NET_HZ=6,NET_BEAT=2,NET_STALE=12;
const PHRASES=['안녕하세요!','같이 걸어요~','강아지 귀엽죠?','저쪽 가 볼까요?','고마워요!','또 만나요!'];
const netOn=()=>NET.status==='on';
const netAreaKey=()=>G&&G.area?(G.area.kind==='home'?'home':G.area.kind==='house'?'h:'+G.area.id:G.area.place?'z:'+G.area.place:'town'):'';
const cleanNick=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,8);
const numOk=v=>typeof v==='number'&&isFinite(v)&&Math.abs(v)<20000;
const DIR_OK=['down','up','side'],POSE_OK=['walk','happy','sit','eat','sniff','sleep','scared'];

// ---------- 채널 들어가기 · 나가기 ----------
async function netJoin(code,nick){
  if(!AUTH.client)return false;
  await netLeave();
  NET.me={id:Math.random().toString(36).slice(2,12),nick:cleanNick(nick)||'친구'};
  NET.status='connecting';NET.ok=new Set();NET.peers={};NET.sig='';NET.joinT=Date.now();NET.members=[];NET.sleeping=false;
  try{const {data}=await AUTH.client.auth.getSession();if(data&&data.session)await AUTH.client.realtime.setAuth(data.session.access_token);}catch(e){}
  const ch=AUTH.client.channel('dami-room-'+code,{config:{private:true,broadcast:{self:false},presence:{key:NET.me.id}}});
  ch.on('broadcast',{event:'st'},({payload})=>netOnState(payload))
    .on('broadcast',{event:'say'},({payload})=>netOnSay(payload))
    .on('broadcast',{event:'nose'},({payload})=>netOnNose(payload))
    .on('broadcast',{event:'clk'},({payload})=>mpOnClock(payload))
    .on('broadcast',{event:'glamp'},()=>{if(typeof mgFetch==='function')mgFetch();})
    .on('presence',{event:'sync'},netOnSync);
  NET.ch=ch;
  ch.subscribe(async s=>{
    if(NET.ch!==ch)return;
    if(s==='SUBSCRIBED'){NET.status='on';NET.sig='';await mpTrack();}
    else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'){NET.status='err';}
    else if(s==='CLOSED'&&NET.status!=='off'){NET.status='err';}
  });
  return true;
}
async function netLeave(){
  const ch=NET.ch;NET.ch=null;NET.status='off';NET.peers={};NET.members=[];NET.host=false;NET.hostId=null;NET.sleeping=false;
  if(ch&&AUTH.client){try{await ch.untrack();}catch(e){}try{await AUTH.client.removeChannel(ch);}catch(e){}}
}

// ---------- 받기 ----------
function netPeer(id,sync){if(!sync&&!NET.ok.has(id))return null;if(typeof id!=='string'||!/^[a-z0-9]{6,12}$/.test(id)||id===(NET.me&&NET.me.id))return null;
  let p=NET.peers[id];if(!p){p=NET.peers[id]={id,nick:'친구',lk:lookClean(null),P:null,DP:null,seen:0,anim:0,danim:0,fresh:true};}
  return p;}
function netOnSync(){if(!NET.ch)return;const S=NET.ch.presenceState(),alive=new Set();
  // 서버 방 명단(MP.nicks)에 있는 별명만 받아들이고, 같은 별명이 둘이면 먼저 온 하나만
  const seenNick=new Set();
  for(const [id,arr] of Object.entries(S)){const m=arr&&arr[0];const nk=cleanNick(m&&m.n);
    if(!NET.me||id===NET.me.id||!(MP.nicks||[]).includes(nk)||seenNick.has(nk))continue;seenNick.add(nk);
    const p=netPeer(id,true);if(!p)continue;alive.add(id);if(p.fresh&&!p.joined){p.joined=true;if(Date.now()-NET.joinT>1500)toast(`${nk}님이 들어왔어요`);}p.nick=nk;
    const lk=lookClean(m&&m.lk),sig=JSON.stringify(lk);if(sig!==p.lkSig){p.lkSig=sig;p.lk=lk;p.P=lookToHuman(lk);p.DP=breedP(lk.breed);p.key='pe'+strSeed(id+sig);}
    p.seen=Math.max(p.seen,performance.now()/1000);}
  for(const id of Object.keys(NET.peers))if(!alive.has(id)){const p=NET.peers[id];if(p.joined)toast(`${p.nick}님이 나갔어요`);delete NET.peers[id];}
  NET.ok=alive;NET.sig='';
  // 가장 먼저 들어온 사람이 시계 담당(호스트)
  NET.members=Object.entries(S).filter(([id])=>id===NET.me.id||alive.has(id)).map(([id,a])=>{const m=(a&&a[0])||{};return{id,n:cleanNick(m.n)||'친구',t:typeof m.t==='number'&&m.t>Date.now()-864e5&&m.t<Date.now()+6e4?m.t:9e15,d:Math.max(1,Math.min(9999,m.d|0)),z:m.z?1:0};}).sort((a,b)=>a.t-b.t||(a.id<b.id?-1:1)).slice(0,4);
  if(!NET.me||!NET.members.some(m=>m.id===NET.me.id))return;
  NET.hostId=NET.members[0].id;NET.host=NET.hostId===NET.me.id;
  mpCheck();}
function netOnState(m){if(!m)return;const p=netPeer(m.i);if(!p)return;
  if(![m.x,m.y,m.X,m.Y].every(numOk))return;
  p.a=typeof m.a==='string'?m.a.slice(0,20):'';p.tx=m.x;p.ty=m.y;p.dir=DIR_OK.includes(m.d)?m.d:'down';p.face=m.f<0?-1:1;p.mv=!!m.m;
  p.tX=m.X;p.tY=m.Y;p.D=DIR_OK.includes(m.D)?m.D:'down';p.F=m.F<0?-1:1;p.pose=POSE_OK.includes(m.P)?m.P:'happy';p.M=!!m.M;
  p.eq=(typeof m.e==='string'&&ACCS[m.e])?m.e:null;
  if(p.fresh||p.x===undefined||Math.hypot(p.tx-p.x,p.ty-p.y)>90){p.x=p.tx;p.y=p.ty;p.X=p.tX;p.Y=p.tY;}
  p.fresh=false;p.seen=performance.now()/1000;}
const peerHere=p=>p&&!p.fresh&&p.x!==undefined&&p.P&&p.a===netAreaKey()&&performance.now()/1000-p.seen<NET_STALE;
function netOnSay(m){if(!m)return;const p=netPeer(m.i);const t=PHRASES[m.t|0];if(!p||!t)return;
  if(peerHere(p)&&scene==='game'){bubble(p,t,2.6,'#3d6a3a');SFX.sel();}else toast(`${p.nick}: ${t}`);}
function netOnNose(m){if(!m||!NET.me||m.to!==NET.me.id)return;const p=netPeer(m.i);if(!p||!peerHere(p)||scene!=='game')return;noseHappy(p,false);}

// ---------- 보내기 (초당 6번까지, 바뀐 게 없으면 2초에 한 번만) ----------
function netSend(ev,payload){if(!netOn()||!NET.ch)return;NET.ch.send({type:'broadcast',event:ev,payload}).catch(()=>{});}
function netTick(dt){
  if(!NET.ch)return;
  for(const p of Object.values(NET.peers)){if(p.x===undefined)continue;const k=Math.min(1,dt*10);
    p.x=lerp(p.x,p.tx,k);p.y=lerp(p.y,p.ty,k);p.X=lerp(p.X,p.tX,k);p.Y=lerp(p.Y,p.tY,k);
    if(p.mv)p.anim+=dt*7;if(p.M)p.danim+=dt*9;}
  if(isMP()&&scene==='game'&&G&&G.ov&&!['bath','fris','agil'].includes(G.ov.type))SV.today.clock+=dt*MIN_PER_SEC;   // 같이 하기: 메뉴를 열어도 시간은 흐름
  if(!netOn()||scene!=='game'||!G||!G.area)return;
  NET.chkT=(NET.chkT||0)-dt;if(NET.chkT<=0){NET.chkT=2;mpCheck();}
  if(NET.host){NET.clkT-=dt;if(NET.clkT<=0){NET.clkT=3;netSend('clk',{i:NET.me.id,d:SV.day,c:Math.round(SV.today.clock*10)/10});}}
  NET.sendT-=dt;NET.beatT-=dt;if(NET.sendT>0)return;NET.sendT=1/NET_HZ;
  const o=G.pl,d=G.dami,[dd,pose]=damiPose();
  const m={i:NET.me.id,a:netAreaKey(),x:Math.round(o.x),y:Math.round(o.y),d:o.dir,f:o.face||1,m:o.moving?1:0,X:Math.round(d.x),Y:Math.round(d.y),D:dd,F:d.face||1,P:d.state==='bath'?'sit':pose,M:d.moving?1:0,e:SV.eq||''};
  const sig=JSON.stringify(m);if(sig===NET.sig&&NET.beatT>0)return;NET.sig=sig;NET.beatT=NET_BEAT;netSend('st',m);
}

// ---------- 함께 하기 ----------
function noseHappy(p,mine){const d=G.dami;hearts(d.x,d.y-14,4);hearts(p.X,p.Y-14,4);SFX.heart();
  bubble('dami',pick(['킁킁! 반가워~','냄새 좋다!','친구다 친구!']),1.8,'#d94f6a');
  const T0=SV.today,met=(T0.netMet=T0.netMet||[]),dn=dogCall(p.lk.dog||'강아지');
  if(!met.includes(p.nick)){met.push(p.nick);addCoins(3);gainAff(1);addSt('mood',10);toast(`${p.nick}네 ${dn}와 코 인사! +3 뼈다귀`);logDay(`친구 ${p.nick}네 ${dn}와 코 인사를 했다. 꼬리가 멈추질 않았다.`);save();}
  else addSt('mood',4);}
function openFriendMenu(p){SFX.sel();
  const items=[{label:'코 인사 (강아지끼리)',fn:()=>{closeOv();if(Math.hypot(G.dami.x-p.X,G.dami.y-p.Y)>60){bubble('dami','친구 강아지한테 더 가까이!',1.6);return;}noseHappy(p,true);netSend('nose',{i:NET.me.id,to:p.id});}}]
    .concat(PHRASES.map((s,i)=>({label:'💬 '+s,fn:()=>{closeOv();netSay(i);}})),[{label:'닫기',fn:closeOv}]);
  openMenu({title:`${p.nick}님 · ${p.lk.dog||'강아지'} (${(BREEDS[p.lk.breed]||{}).name||''})`,items});}
function netSay(i){if(!netOn())return;bubble('pl',PHRASES[i],2.6,'#3d6a3a');netSend('say',{i:NET.me.id,t:i});}
function netNear(){if(!netOn())return null;const o=G.pl;let best=null,bd=32;
  for(const p of Object.values(NET.peers))if(peerHere(p)){const q=Math.hypot(p.x-o.x,p.y-o.y);if(q<bd){bd=q;best=p;}}return best?{p:best,d:bd}:null;}
const AREA_NAME=k=>k==='home'?'자기 집':k==='town'?'마을':k.startsWith('h:')?(HOUSE_NAME[k.slice(2)]||'집 안'):k.startsWith('z:')?((PLACES[k.slice(2)]||{}).name||'산책길'):'?';
function openRoomMenu(){SFX.sel();
  if(!isMP()){openDialog({name:'담이',id:'dami',lines:['친구랑 같이 하려면 첫 화면의 [같이 하기]로 들어가요.']});return;}
  const ms=NET.members.length?NET.members:[{id:NET.me&&NET.me.id,n:MP.nick,z:NET.sleeping?1:0}];
  const st0=NET.status==='on'?`${ms.length}/${MP.size||ms.length}명 접속`:'연결 중…';
  openMenu({title:`방 ${MP.code} · ${st0}`,items:ms.map(m=>{const me=NET.me&&m.id===NET.me.id,p=NET.peers[m.id];
      return{label:`${me?'나 ('+m.n+')':m.n}${NET.hostId===m.id?' ⏰':''} — ${me?'':m.z?'잠들었어요 💤':p&&peerHere(p)?'여기 있어요!':p&&p.a?AREA_NAME(p.a):'…'}`,dis:true,fn:()=>{}};})
    .concat([{label:'말풍선 보내기',fn:()=>openMenu({title:'말풍선',items:PHRASES.map((s,i)=>({label:s,fn:()=>{closeOv();netSay(i);}})).concat([{label:'닫기',fn:closeOv}])})},
      {label:'저장하고 첫 화면으로',fn:()=>{closeOv();mpExit();}},{label:'닫기',fn:closeOv}])});}

// ---------- 날짜 공유 · 다 같이 자야 다음 날 ----------
async function mpTrack(){if(!NET.ch||!NET.me)return;try{await NET.ch.track({n:NET.me.nick,t:NET.joinT,d:SV.day,z:NET.sleeping?1:0,lk:MP.look});}catch(e){}}
function mpOnClock(m){if(!isMP()||!m||m.i!==NET.hostId||NET.host||!numOk(m.c)||m.c<0||m.c>30*60||(Math.abs(m.c-SV.today.clock)>120&&Date.now()-NET.joinT>15000))return;
  if((m.d|0)===SV.day&&!NET.sleeping&&scene==='game'&&Math.abs(m.c-SV.today.clock)>1.5)SV.today.clock=m.c;}
function mpCheck(){if(!isMP()||!NET.members.length)return;const ms=NET.members,maxD=Math.min(SV.day+30,Math.max(...ms.map(m=>m.d)));
  if(maxD>SV.day){if(NET.sleeping&&maxD===SV.day+1&&scene==='game'){mpEndDay();return;}if(scene!=='diary')mpJump(maxD);return;}
  if(NET.sleeping&&scene==='game'&&ms.every(m=>m.d===SV.day&&m.z))mpEndDay();}
function mpEndDay(){NET.sleeping=false;if(G)G.ov=null;endDay();mpTrack();}
function mpJump(d){SV.day=d;newToday();save(true);NET.sleeping=false;
  if(scene==='game'){G.ov=null;enterArea('home',{wake:true});toast(`친구들과 날짜를 맞췄어요 · DAY ${d}`);}mpTrack();}
function mpSleep(){if(!netOn()){toast('친구들과 연결이 안 돼서 아직 못 자요. 잠시 뒤 다시 해 봐요');return;}NET.sleeping=true;G.ov={type:'sleepwait'};G.dami.state='sleep';G.dami.t=999;mpTrack();mpCheck();}
function mpWakeUp(){NET.sleeping=false;G.ov=null;G.dami.state='idle';mpTrack();}
function sleepNow(){if(isMP())mpSleep();else endDay();}
function drawSleepWait(t){ctx.fillStyle='rgba(20,18,50,.72)';ctx.fillRect(0,0,VW,VH);const ms=NET.members,w=230,h=60+ms.length*14,x=VW/2-w/2,y=VH/2-h/2-10;
  panel(x,y,w,h);txt('친구들이 잠들기를 기다려요',VW/2,y+8,'#3a4a8a',11,'center','G11B');
  const n=ms.filter(m=>m.z&&m.d===SV.day).length;txt(`${n} / ${ms.length}명 잠들었어요 · 다 같이 자면 다음 날로!`,VW/2,y+24,'#7a5a3a',9,'center','G9');
  ms.forEach((m,i)=>{const me=NET.me&&m.id===NET.me.id;txt(`${m.z?'💤':'🐾'} ${me?'나 ('+m.n+')':m.n}`,x+18,y+40+i*14,'#4a3426',9,'left','G9');txt(m.z?'쿨쿨':'아직 놀아요',x+w-18,y+40+i*14,m.z?'#5a6ab0':'#c0602a',9,'right','G9');});
  const by=y+h+6;panel(VW/2-50,by,100,20);txt(isTouch?'일어나기':'Esc 일어나기',VW/2,by+5,'#4a3426',9,'center','G11B');G.ov._by=by;
  if(Math.floor(t*2)%2)txt('z',VW/2+60+Math.sin(t)*4,y-10,'#fff',11,'center','G11B');}

// ---------- 그리기 ----------
function drawPeer(p,t){const fr=p.mv?[0,1,0,3][Math.floor(p.anim)%4]:0;
  if(G.area.outdoor){const hand=p.dir==='side'?{x:p.x+p.face,y:p.y-11}:p.dir==='down'?{x:p.x+5,y:p.y-10}:{x:p.x-5,y:p.y-11},har=p.D==='side'?{x:p.X+p.F*2,y:p.Y-12}:{x:p.X,y:p.Y-11};
    for(let i=0;i<=30;i++){const k=i/30;px(lerp(hand.x,har.x,k),lerp(hand.y,har.y,k)+Math.sin(k*Math.PI)*6,1,1,'#3d8a5a');}}
  ell(ctx,p.x,p.y,6,2,'rgba(0,0,0,.2)');const im=humanImg(p.key,p.P,p.dir,fr);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.dir==='side'&&p.face<0)ctx.scale(-1,1);ctx.drawImage(im,-10,-30);ctx.restore();
  if(G.bubbles.some(b=>b.who===p))return;
  ctx.font='9px G9';const w=Math.ceil(ctx.measureText(p.nick).width)+8;px(Math.round(p.x-w/2),Math.round(p.y-46),w,11,'rgba(61,106,58,.88)');txt(p.nick,Math.round(p.x),Math.round(p.y-45),'#fff',9,'center','G9');}
function drawPeerDog(p){const fr=p.M?[0,1,0,3][Math.floor(p.danim)%4]:0;ell(ctx,p.X,p.Y,7,2.2,'rgba(0,0,0,.2)');
  const im=pupImg(p.DP,'b_'+p.lk.breed,p.D,fr,p.pose,p.eq);ctx.save();ctx.translate(Math.round(p.X),Math.round(p.Y));if(p.D==='side'&&p.F<0)ctx.scale(-1,1);ctx.drawImage(im,-14,-21);ctx.restore();}
function netDrawList(L){if(!NET.ch)return;for(const p of Object.values(NET.peers))if(peerHere(p)){L.push({y:p.y,peer:p});L.push({y:p.Y,peerDog:p});}}
function netHUD(){if(!isMP())return;const n=Math.max(1,NET.members.length);
  const s=NET.status==='on'?`방 ${MP.code} · ${n}/${MP.size||n}명 접속`:NET.status==='err'?`방 ${MP.code} · 연결이 끊겼어요`:`방 ${MP.code} · 연결 중…`;ctx.font='9px G9';const w=ctx.measureText(s).width+10;
  px(184,6,w,13,NET.status==='on'?'rgba(61,106,58,.88)':'rgba(120,90,60,.85)');txt(s,189,8,'#fff',9,'left','G9');}
function netMinimap(x,y,k){if(!NET.ch)return;for(const p of Object.values(NET.peers))if(peerHere(p)){px(x+p.x*k-2,y+p.y*k-2,4,4,'#1e4a28');px(x+p.x*k-1,y+p.y*k-1,2,2,'#9fe0a0');}}
