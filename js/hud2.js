"use strict";
// ===== 화면 정리 (v5): 상태창·할 일 접기, 말풍선 안내, 잘 보이는 표시, 상태창(탭), 진짜 지도 =====
const UIP=(()=>{try{const v=JSON.parse(localStorage.getItem('dami_ui')||'null');if(v)return{hud:!!v.hud,todo:!!v.todo};}catch(e){}return{hud:false,todo:false};})();
const saveUIP=()=>{try{localStorage.setItem('dami_ui',JSON.stringify(UIP));}catch(e){}};
let HUDR=null,TODOR=null;

// ---------- 강아지 말투 상태 ----------
const STAT_TALK=[
  ['hunger','🍖','배',v=>v<30?'배고파!':v<65?'조금 출출해':'배불러♪'],
  ['thirst','💧','물',v=>v<30?'목말라!':v<65?'괜찮아':'촉촉해♪'],
  ['mood','💗','기분',v=>v<30?'심심해… 놀아줘':v<65?'그럭저럭':'신나!'],
  ['clean','🛁','뽀송',v=>v<30?'찝찝해…':v<65?'괜찮아':'뽀송뽀송♪'],
  ['potty','💩','화장실',v=>v>80?'마려워!':v>50?'조금…':'괜찮아',true],
  ['me','🍙','나(주인)',v=>v<25?'나도 배고파…':v<60?'괜찮아':'든든해',false,true]];
const statVal=k=>{const S=st();if(k==='potty')return Math.max(S.pee||0,S.poop||0);return S[k]==null?70:S[k];};
function urgentList(){const L=[],S=st(),c=SV.today.clock;
  if(SV.sick)L.push(['🤒','배 아파… 병원 가요']);
  if(statVal('hunger')<30)L.push(['🍖','배고파!']);if(statVal('thirst')<30)L.push(['💧','목말라!']);
  if(statVal('potty')>80)L.push(['💩','화장실 마려워!']);if(statVal('mood')<30)L.push(['💗','심심해… 놀아줘']);if(statVal('clean')<25)L.push(['🛁','찝찝해…']);
  if((S.me==null?70:S.me)<25)L.push(['🍙','(나) 배고파… 편의점']);
  if(c>=24*60)L.push(['😵','너무 졸려! 곧 쓰러져요']);else if(c>=22*60)L.push(['😪','졸려… 자러 가요']);
  return L;}
function chip(x,y,ic,s,col){ctx.font='9px G9';const w=ctx.measureText(s).width+22;px(x,y,w,13,'rgba(255,250,240,.94)');px(x,y,w,1,'#4a2e1e');px(x,y+12,w,1,'#4a2e1e');px(x,y,1,13,'#4a2e1e');px(x+w-1,y,1,13,'#4a2e1e');
  px(x+6,y+13,3,2,'#4a2e1e');txt(ic,x+4,y+2,'#4a3426',9,'left','G9');txt(s,x+17,y+2,col||'#c0302a',9,'left','G9');return w;}

// ---------- 상태창 (왼쪽 위) ----------
function drawStatus(t){const c=SV.today.clock;
  const head=`DAY ${SV.day} · ${season()} ${clockStr(c)} · 🦴${SV.coins}`;ctx.font='9px G9';const hw=Math.max(150,ctx.measureText(head).width+30);
  if(!UIP.hud){panel(4,4,hw,20);txt(head,11,9,'#4a3426',9,'left','G9');txt('▼',4+hw-12,8,'#c0602a',9,'center','G11B');HUDR={x:4,y:4,w:hw,h:20};
    urgentList().slice(0,3).forEach(([ic,s],i)=>chip(6,28+i*16,ic,s));return;}
  const rows=STAT_TALK,h=36+rows.length*13+24;panel(4,4,196,h);HUDR={x:4,y:4,w:196,h:20};
  txt(head,11,9,'#4a3426',9,'left','G9');txt('▲',4+196-12,8,'#c0602a',9,'center','G11B');
  txt(`산책 Lv${SV.lv}`,11,23,'#4a3426',9,'left','G9');bar(56,25,38,SV.xp/XP_NEED(SV.lv),'#7cc36a');txt(`우정 Lv${SV.alv}`,102,23,'#d94f6a',9,'left','G9');bar(144,25,48,SV.aff/AFF_NEED(SV.alv),'#ef8fb6');
  rows.forEach(([k,ic,n,fn,inv],i)=>{const v=statVal(k),y=37+i*13,bad=inv?v>80:v<30;txt(`${ic} ${n}`,11,y,'#7a5a3a',9,'left','G9');txt(`"${fn(v)}"`,62,y,bad?'#c0302a':'#4a3426',9,'left','G9');
    bar(150,y+2,42,inv?v/100:v/100,inv?(v>80?'#c08040':'#b0a080'):(k==='me'?'#e0b060':['#f2a33a','#5aa9e6','#ef8fb6','#9fd6f2'][i]||'#9fd6f2'));});
  txt(`사료 ${SV.kibble} · 간식 ${SV.treats}${SV.mq>=1?` · 🪵${SV.wood||0} 🪨${SV.stone||0} 🌿${SV.fiber||0} 🌸${SV.flower||0}`:''}`,11,h-11,'#9a7a5a',9,'left','G9');}

// ---------- 할 일 (오른쪽 위) ----------
function drawTodoPanel(){if(isTouch&&!UIP.todo){}const c=SV.today.clock;const Ls=todoList().filter(l=>!l.ok&&(c>=15*60?true:!l.eve));
  if(!UIP.todo){const s=`📋 할 일 ${Ls.length} ▼`;ctx.font='9px G9';const w=ctx.measureText(s).width+12;panel(VW-w-4,4,w,18);txt(s,VW-w+2,8,'#c0602a',9,'left','G9');TODOR={x:VW-w-4,y:4,w,h:18};return;}
  const S0=Ls.slice(0,7),w=150,h=S0.length*11+20;panel(VW-w-4,4,w,h);txt('📋 오늘 할 일 ▲',VW-w+4,8,'#c0602a',9,'left','G11B');TODOR={x:VW-w-4,y:4,w,h:16};
  S0.forEach((l,i)=>{const y=21+i*11;drawItemIcon(l.ic,VW-w+3,y-1);const sub=l.sub?l.sub.slice(0,8):'';ctx.font='9px G9';const sw=sub?ctx.measureText(sub).width+5:0;let tt=l.t;while(tt.length>1&&ctx.measureText(tt).width>w-22-sw)tt=tt.slice(0,-2)+'…';
    txt(tt,VW-w+16,y,l.ready?'#3d8a3a':'#4a3426',9,'left','G9');if(sub)txt(sub,VW-10,y,'#9a7a5a',9,'right','G9');});}

// ---------- 행동 안내: 그 자리에 말풍선 + 반짝 테두리 ----------
function drawHintBubble(t){const h=G.hint;if(!h||G.ov)return;const o=G.pl;const wx=h.x!=null?h.x:o.x,wy=h.y!=null?h.y:o.y-38;
  const sx=Math.round(wx-G.cam.x),sy=Math.round(wy-G.cam.y);
  if(h.x!=null&&h.ring!==false){const r=9+Math.sin(t*6)*1.5;ctx.save();ctx.strokeStyle='rgba(255,210,63,.95)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(sx,Math.round((h.ry!=null?h.ry:h.y+18)-G.cam.y),r+6,r*.45+2,0,0,7);ctx.stroke();ctx.restore();}
  const key=isTouch?'Ⓐ':'E';const s=h.label;ctx.font='9px G9';const w=ctx.measureText(s).width+26,bx=clamp(sx-w/2,4,VW-w-4),by=clamp(sy-24+Math.sin(t*4)*1.2,26,VH-20);
  px(bx,by,w,15,'#fffaf0');px(bx,by,w,1,'#4a2e1e');px(bx,by+14,w,1,'#4a2e1e');px(bx,by,1,15,'#4a2e1e');px(bx+w-1,by,1,15,'#4a2e1e');
  const tx=clamp(sx,bx+6,bx+w-8);px(tx-2,by+15,5,2,'#4a2e1e');px(tx-1,by+15,3,1,'#fffaf0');
  px(bx+3,by+3,11,9,'#c0602a');txt(key,bx+8.5,by+3,'#fff',9,'center','G11B');txt(s,bx+17,by+3,'#4a3426',9,'left','G9');}

// ---------- 잘 보이는 표시(!, ?) ----------
function drawMark(x,y,m,t){const b=Math.sin(t*5)*2.5,sx=Math.round(x),sy=Math.round(y+b);const col=m==='?'?'#3d8a3a':'#d94f6a';
  ell(ctx,sx,sy+4,9,9,'#4a2e1e');ell(ctx,sx,sy+4,8,8,'#ffd23f');ell(ctx,sx-2,sy+1,3,2,'#fff6c0');txt(m,sx,sy-2,col,13,'center','G11B');px(sx-2,sy+13,5,2,'#4a2e1e');}

// ---------- drawHUD 바꿔 끼우기 ----------
const _drawHUD0=drawHUD;
drawHUD=function(t){const A=G.area;drawSnow(t);
  drawStatus(t);drawTodoPanel();netHUD();drawResBarV5();
  drawWorldMarks(t);
  // 퀘스트 화살표·말풍선 안내
  const tg=questTarget();if(tg){const gx=tg.x-G.cam.x,gy=tg.y-G.cam.y;if(gx<0||gx>VW||gy<0||gy>VH){const a=Math.atan2(gy-VH/2,gx-VW/2),ax=clamp(VW/2+Math.cos(a)*220,16,VW-16),ay=clamp(VH/2+Math.sin(a)*120,70,VH-30),b=Math.sin(t*5)*2;
    ctx.save();ctx.translate(ax+Math.cos(a)*b,ay+Math.sin(a)*b);ctx.rotate(a);ctx.fillStyle='#4a2e1e';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-8);ctx.lineTo(-2,0);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.fillStyle=tg.col;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-6);ctx.lineTo(-1,0);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.restore();
    ctx.font='9px G9';const lw=ctx.measureText(tg.label).width/2+3;txt(tg.label,clamp(ax,lw,VW-lw),ay+10,'#fff',9,'center','G9','#4a2e1e');}}
  drawHintBubble(t);
  if(!isTouch&&!G.ov&&!G.tip&&sceneT<25)txt('방향키 이동 · E 행동 · 스페이스 부르기 · H 상태 · T 할 일 · I 상태창 · M 지도 · Esc 메뉴',VW/2,VH-12,'#fff',9,'center','G9','#4a2e1e');
  if(G.toast){const a=Math.min(1,G.toast.t*2);ctx.globalAlpha=a;ctx.font='11px G11';const w=ctx.measureText(G.toast.s).width+20;panel(VW/2-w/2,68,w,22);txt(G.toast.s,VW/2,73,'#4a3426',11,'center','G11');ctx.globalAlpha=1;}
  if(G.tip&&!G.ov){const a=Math.min(1,G.tip.t*2);ctx.globalAlpha=a;const y=VH-46;panel(60,y,VW-120,42);portrait('dami',68,y+8);txt('담이',96,y+7,'#c0602a',9,'left','G11B');wrap(G.tip.text.slice(0,Math.floor(G.tip.n)),96,y+18,VW-170,'#4a3426');ctx.globalAlpha=1;}
  if(typeof drawV5Overlays==='function')drawV5Overlays(t);
  if(G.ov)drawOverlay(t);};
function drawResBarV5(){}
// 땅에 떨어진 음식·킁킁 자리·떠돌이 개를 화면 좌표로 크게 표시
function drawWorldMarks(t){const A=G.area,d=G.dami;if(!A||G.ov)return;const cx=G.cam.x,cy=G.cam.y;
  if(A.foods)for(const f of A.foods){if(!f.alive)continue;const sx=f.x-cx,sy=f.y-cy;if(sx<-10||sx>VW+10||sy<-10||sy>VH+10)continue;
    const tgt=(d.state==='food'||d.state==='eat')&&d.target===f;if(tgt||Math.hypot(d.x-f.x,d.y-f.y)<90){drawMark(sx,sy-30,'!',t);}
    if(tgt){const s=isTouch?'안돼! [부르기] 연타':'안돼! 스페이스 연타';chip(clamp(d.x-cx-40,4,VW-120),d.y-cy-46,'🚫',s,'#c0302a');}}
  if(A.dogs)for(const g of A.dogs){const sx=g.x-cx,sy=g.y-cy;if(sx<0||sx>VW||sy<0||sy>VH)continue;if(Math.hypot(G.pl.x-g.x,G.pl.y-g.y)<110){ctx.font='7px G7';txt('떠돌이 개',sx,sy-34,'#fff',7,'center','G7','#4a2e1e');}}}

// ---------- 접기·펴기 (클릭/터치, H·T 키) ----------
const _onTap0=onTap;onTap=function(p){if(scene==='game'&&G&&!G.ov){const inR=r=>r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
    if(inR(HUDR)){UIP.hud=!UIP.hud;saveUIP();SFX.sel();return;}if(inR(TODOR)){UIP.todo=!UIP.todo;saveUIP();SFX.sel();return;}}
  if(G&&G.ov&&G.ov.type==='status'){statusTap(p);return;}if(G&&G.ov&&G.ov.type==='map2'){map2Tap(p);return;}if(G&&G.ov&&G.ov.type==='aim'){aimThrow();return;}
  _onTap0(p);};
const _onKey0=onKey;onKey=function(k){
  if(scene==='game'&&G&&!G.ov&&!G.play){if(k==='KeyH'){UIP.hud=!UIP.hud;saveUIP();SFX.sel();return;}if(k==='KeyT'){UIP.todo=!UIP.todo;saveUIP();SFX.sel();return;}
    if(k==='KeyI'||k==='Tab'){openStatus(0);return;}if(k==='KeyM'){openMap2();return;}}
  if(scene==='game'&&G&&G.ov){const o=G.ov;const OK=k==='Enter'||k==='KeyE'||k==='KeyJ'||k==='Space',BACK=k==='Escape'||k==='KeyX'||k==='Backspace';
    if(o.type==='status'){statusKey(k,OK,BACK);return;}if(o.type==='map2'){map2Key(k,OK,BACK);return;}if(o.type==='aim'){aimKey(k,OK,BACK);return;}}
  _onKey0(k);};

// ---------- 상태창 (탭: 상태 · 가방 · 미션 · 할 일 · 설정) ----------
const STAB=['🐶 상태','🎒 가방','📜 미션','📋 할 일','⚙️ 설정'];
function openStatus(tab){G.ov={type:'status',tab:tab||0,sel:0};SFX.sel();}
function statusKey(k,OK,BACK){const o=G.ov;if(k==='ArrowLeft'||k==='KeyA'){o.tab=(o.tab+STAB.length-1)%STAB.length;o.sel=0;}else if(k==='ArrowRight'||k==='KeyD'||k==='Tab'){o.tab=(o.tab+1)%STAB.length;o.sel=0;}
  else if(k==='ArrowUp'||k==='KeyW')o.sel=Math.max(0,o.sel-1);else if(k==='ArrowDown'||k==='KeyS')o.sel=Math.min((o._n||1)-1,o.sel+1);
  else if(OK&&o._acts&&o._acts[o.sel])o._acts[o.sel]();else if(BACK||k==='KeyI')closeOv();}
function statusTap(p){const o=G.ov,b=o._box;if(!b){closeOv();return;}if(p.y>=b.y+20&&p.y<=b.y+34){const i=Math.floor((p.x-b.x-6)/((b.w-12)/STAB.length));if(i>=0&&i<STAB.length){o.tab=i;o.sel=0;}return;}
  const i=Math.floor((p.y-(b.y+42))/13);if(i>=0&&o._acts&&o._acts[i]){o.sel=i;o._acts[i]();return;}if(p.x<b.x||p.x>b.x+b.w||p.y<b.y||p.y>b.y+b.h)closeOv();}
function drawStatusOv(t){const o=G.ov,w=Math.min(VW-20,400),h=VH-30,x=VW/2-w/2,y=14;o._box={x,y,w,h};ctx.fillStyle='rgba(30,20,15,.5)';ctx.fillRect(0,0,VW,VH);panel(x,y,w,h);
  txt('📋 상태창',x+10,y+6,'#c0602a',11,'left','G11B');txt(isTouch?'바깥을 누르면 닫혀요':'←→ 탭 · ↑↓ 고르기 · Enter 실행 · I/Esc 닫기',x+w-10,y+8,'#9a7a5a',7,'right','G7');
  const tw=(w-12)/STAB.length;STAB.forEach((s,i)=>{px(x+6+i*tw,y+20,tw-2,14,i===o.tab?'#c0602a':'#e6d6b6');txt(s,x+6+i*tw+tw/2-1,y+23,i===o.tab?'#fff':'#7a5a3a',9,'center','G9');});
  const L=[],acts=[];const add=(s,col,fn)=>{L.push([s,col]);acts.push(fn||null);};const S=st();
  if(o.tab===0){add(`🐶 ${SV.dogName||'담이'} · 우정 Lv${SV.alv} · 산책 Lv${SV.lv}`,'#c0602a');
    STAT_TALK.forEach(([k,ic,n,fn,inv])=>{const v=Math.round(statVal(k));add(`${ic} ${n}  ${v}%  —  "${fn(v)}"`,(inv?v>80:v<30)?'#c0302a':'#4a3426');});
    add(`🤒 아픔: ${SV.sick?'배탈 (동물병원에 가요)':'건강해요'} · 주워 먹음 ${SV.today.ate||0}/7`,SV.sick?'#c0302a':'#4a3426');
    add(`🏥 정기검진: ${SV.lastCheck?`DAY ${SV.lastCheck}에 받음`:'아직 안 받음'} · 다음 DAY ${(SV.lastCheck||1)+7}부터`,'#4a3426');
    add(`😪 졸림: ${SV.today.clock>=22*60?'졸려요 (새벽 1시가 넘으면 쓰러져요!)':'괜찮아요'}`,'#4a3426');}
  if(o.tab===1){add(`🦴 뼈다귀 ${SV.coins} · 오늘 번 것 ${SV.today.earned||0}`,'#c0602a');add(`🥣 사료 ${SV.kibble} · 🍪 간식 ${SV.treats}`,'#4a3426');
    add(`🪵 나무 ${SV.wood||0} · 🪨 돌 ${SV.stone||0} · 🌿 풀 ${SV.fiber||0} · 🌸 꽃 ${SV.flower||0}`,'#4a3426');
    const tl=SV.tool||{};add(`🛠️ 도구: 도끼 ${TIER[tl.axe|0]} · 곡괭이 ${TIER[tl.pick|0]} · 낫 ${TIER[tl.sickle|0]}`,'#4a3426');
    const fs=Object.entries(SV.finds||{}).filter(([k,v])=>v>0&&FINDS[k]);add('🧺 팔 물건: '+(fs.length?fs.map(([k,v])=>`${FINDS[k].ic}${FINDS[k].name}×${v}`).join(' '):'없음 (집 앞 판매대에서 팔아요)'),'#4a3426');
    const ac=Object.keys(SV.acc||{});add('🎀 옷·장식: '+(ac.length?ac.map(k=>(ACCS[k]?ACCS[k].name:k)+(SV.eq===k?'(착용)':'')).join(', '):'없음'),'#4a3426');
    const hi=Object.entries((SV.home&&SV.home.inv)||{}).filter(([k,v])=>v>0);add('🛋️ 우리 집 가구 가방: '+(hi.length?hi.map(([k,v])=>`${DECO[k]?DECO[k].name:k}×${v}`).join(', '):'없음'),'#4a3426');}
  if(o.tab===2){add(`📜 챕터 ${SV.ch||1}`,'#c0602a');
    add(SV.mq>=2?'✅ 챕터 1 꼭대기 글램핑장 완성':SV.mq===1?`⬜ 챕터 1 글램핑장 짓기 (${(SV.glamp&&SV.glamp.st)||0}/4단계)`:'⬜ 챕터 1: DAY 2부터 이장님께 가 보기','#4a3426');
    if((SV.ch||1)>=2)add(SV.c2&&SV.c2.wins?`✅ 챕터 2 강아지 대회 우승 (${SV.c2.wins}번)`:`⬜ 챕터 2 강아지 대회 우승하기 · 숙련도 ${typeof proAvg==='function'?proAvg():0}%`,'#4a3426');
    for(const q of SV.today.quests)add(`${q.state==='done'?'✅':q.state==='ready'?'🔔':q.state==='new'?'❗':'⬜'} ${q.title} (${NPCS[q.giver].name})`,'#4a3426');}
  if(o.tab===3){for(const l of todoList())add(`${l.ok?'✅':'⬜'} ${l.t}${l.sub?'  '+l.sub:''}${l.eve?' (저녁)':''}`,l.ok?'#a89878':'#4a3426');}
  if(o.tab===4){add('🔊 소리 조절 (음악·활동 소리)','#4a3426',()=>{closeOv();openVol();});
    add(`⏱️ 시간 흐름: ${['느리게','보통','빠르게'][SV.tspeed==null?1:SV.tspeed]}  (Enter로 바꾸기)`,'#4a3426',()=>{SV.tspeed=((SV.tspeed==null?1:SV.tspeed)+1)%3;save();});
    add(`🖥️ 상태창 ${UIP.hud?'펼침':'접음'} (H) · 할 일 ${UIP.todo?'펼침':'접음'} (T)`,'#4a3426',()=>{UIP.hud=!UIP.hud;saveUIP();});
    add('🧍 내 캐릭터 꾸미기','#4a3426',()=>{closeOv();openLookMenu();});
    add('🆘 끼임 탈출','#4a3426',()=>{closeOv();unstuck(true);});}
  o._acts=acts;o._n=L.length;let yy=y+42;L.forEach(([s,col],i)=>{if(acts[i]&&i===o.sel)px(x+8,yy-2,w-16,13,'#ffe2b8');ctx.font='9px G9';let ss=s;while(ss.length>4&&ctx.measureText(ss).width>w-26)ss=ss.slice(0,-2)+'…';txt((acts[i]?(i===o.sel?'▶ ':'  '):'')+ss,x+12,yy,col,9,'left','G9');yy+=13;});}
const TIER=['없음','하급','중급','고급'];
// 내 캐릭터 꾸미기 (혼자 하기)
function openLookMenu(){const l=lookClean(SV.myLook||{g:'f',hs:'long',hc:0,sk:0,tc:0,bc:0,sr:true,gl:true});const set=(k,v)=>{l[k]=v;if(k==='g'){l.hs=v==='m'?'short':'long';if(v==='m')l.sr=false;}SV.myLook=lookClean(l);applyMyLook();save();openLookMenu();};
  const cyc=(k,n)=>()=>set(k,((l[k]|0)+1)%n);
  openMenu({title:'🧍 내 캐릭터 꾸미기 (Enter로 바꾸기)',back:closeOv,items:[{label:`성별: ${l.g==='f'?'여자':'남자'}`,fn:()=>set('g',l.g==='f'?'m':'f')},
    {label:`머리: ${LOOK.hairN[l.hs]}`,fn:()=>{const a=l.g==='m'?LOOK.hairM:LOOK.hairF;set('hs',a[(a.indexOf(l.hs)+1)%a.length]);}},
    {label:`머리색 ${l.hc+1}/${LOOK.hc.length}`,fn:cyc('hc',LOOK.hc.length)},{label:`피부 ${l.sk+1}/${LOOK.sk.length}`,fn:cyc('sk',LOOK.sk.length)},
    {label:`윗옷 ${l.tc+1}/${LOOK.tc.length}`,fn:cyc('tc',LOOK.tc.length)},{label:`아래 ${l.bc+1}/${LOOK.bc.length}`,fn:cyc('bc',LOOK.bc.length)},
    ...(l.g==='f'?[{label:`치마: ${l.sr?'치마':'바지'}`,fn:()=>set('sr',!l.sr)}]:[]),{label:`안경: ${l.gl?'씀':'안 씀'}`,fn:()=>set('gl',!l.gl)},{label:'닫기',fn:closeOv}]});}
function applyMyLook(){if(isMP()||!SV.myLook)return;const P=lookToHuman(lookClean(SV.myLook));for(const k of Object.keys(GIRL))delete GIRL[k];Object.assign(GIRL,P);for(const k of Object.keys(SPR))if(/^h_girl/.test(k))delete SPR[k];}

// ---------- 진짜 지도: 이어진 한 장 · 내 얼굴 · 휠 확대/드래그 ----------
const MAPC={cw:150,ch:110};let MAPIMG=null,MAPSIG='';
function mapCell(id){if(id==='town')return[1,1];if(id==='glamp')return[1,-1];if(id==='road')return[2,-1];if(id==='arena')return[3,-1];const Z=PLACES[id];return Z&&Z.gx!=null?[Z.gx,Z.gy]:[1,1];}
function buildMapImg(){const {cw,ch}=MAPC,ids=['meadow','mountain','summit','beach','town','park','camp','market','river','glamp'];const sig=ids.map(i=>zoneArea(i)?1:0).join('')+season()+((SV.ch||1)>=2?'c2':'');
  if(MAPIMG&&sig===MAPSIG)return MAPIMG;MAPSIG=sig;
  MAPIMG=mk(cw*4+40,ch*4+40,g=>{const ox=20,oy=20+ch;g.fillStyle='#e8d6ae';g.fillRect(0,0,cw*4+40,ch*4+40);
    for(let i=0;i<500;i++){g.fillStyle=`rgba(150,110,60,${Math.random()*.08})`;g.fillRect(Math.random()*(cw*4+40),Math.random()*(ch*4+40),2,2);}
    for(const id of ids){const [gx,gy]=mapCell(id),A=zoneArea(id),x=ox+gx*cw,y=oy+gy*ch;
      if(A&&A.thumb){g.save();g.globalAlpha=1;g.drawImage(A.thumb,x,y,cw,ch);g.restore();}else{g.fillStyle='#cbb88e';g.fillRect(x,y,cw,ch);g.fillStyle='#8a7a5a';g.font='20px sans-serif';g.textAlign='center';g.fillText('?',x+cw/2,y+ch/2+6);}}
    if((SV.ch||1)>=2){const y=oy-ch+ch*.4;g.fillStyle='#5a5e66';g.fillRect(ox+2*cw,y,cw*1.2,ch*.2);g.fillStyle='#ffd23f';for(let x=ox+2*cw;x<ox+3.2*cw;x+=14)g.fillRect(x,y+ch*.1-1,7,2);
      g.fillStyle='#94d26c';g.fillRect(ox+3.2*cw,y-ch*.25,cw*.7,ch*.7);g.strokeStyle='#fff';g.strokeRect(ox+3.2*cw+6,y-ch*.25+6,cw*.7-12,ch*.7-12);}
    // 가장자리 부드럽게(종이 지도 느낌)
    const gr=g.createRadialGradient((cw*4+40)/2,(ch*4+40)/2,cw*1.2,(cw*4+40)/2,(ch*4+40)/2,cw*2.6);gr.addColorStop(0,'rgba(232,214,174,0)');gr.addColorStop(1,'rgba(232,214,174,.45)');g.fillStyle=gr;g.fillRect(0,0,cw*4+40,ch*4+40);});
  return MAPIMG;}
function myMapPos(){const A=G.area;let id=A.kind==='town'?'town':A.place||'town',lx=G.pl.x/A.PW,ly=G.pl.y/A.PH;
  if(A.kind==='home'||A.kind==='house'){const h=TOWN_HOUSES.find(h=>h.id===(A.kind==='home'?'home':A.id));const TA=zoneArea('town');id='town';if(h&&TA){lx=(h.tx*T+16)/TA.PW;ly=(h.ty*T+28)/TA.PH;}}
  if(A.glampin){id='glamp';lx=.5;ly=.55;}const [gx,gy]=mapCell(id);return{x:20+(gx+lx)*MAPC.cw,y:20+MAPC.ch+(gy+ly)*MAPC.ch};}
function openMap2(){const p=myMapPos();G.ov={type:'map2',z:1.4,cx:p.x,cy:p.y};SFX.sel();setTimeout(pregenZones,50);}
function map2Key(k,OK,BACK){const o=G.ov;if(k==='Equal'||k==='NumpadAdd'||k==='KeyE')o.z=Math.min(4,o.z*1.25);else if(k==='Minus'||k==='NumpadSubtract'||k==='KeyQ')o.z=Math.max(.6,o.z/1.25);
  else if(k==='ArrowLeft'||k==='KeyA')o.cx-=30/o.z;else if(k==='ArrowRight'||k==='KeyD')o.cx+=30/o.z;else if(k==='ArrowUp'||k==='KeyW')o.cy-=30/o.z;else if(k==='ArrowDown'||k==='KeyS')o.cy+=30/o.z;
  else if(k==='Space'){const p=myMapPos();o.cx=p.x;o.cy=p.y;}else if(BACK||k==='KeyM'||k==='Enter')closeOv();}
function map2Tap(p){const o=G.ov;if(p.x>VW-40&&p.y>VH-74&&p.y<VH-52){o.z=Math.min(4,o.z*1.3);return;}if(p.x>VW-40&&p.y>VH-48&&p.y<VH-26){o.z=Math.max(.6,o.z/1.3);return;}if(o.dragged){o.dragged=false;return;}closeOv();}
function drawMap2(t){const o=G.ov,img=buildMapImg();ctx.fillStyle='#2b2233';ctx.fillRect(0,0,VW,VH);
  ctx.save();ctx.translate(VW/2,VH/2);ctx.scale(o.z,o.z);ctx.translate(-o.cx,-o.cy);ctx.imageSmoothingEnabled=o.z<1.5;ctx.drawImage(img,0,0);ctx.imageSmoothingEnabled=false;
  const {cw,ch}=MAPC,ox=20,oy=20+ch;const lab=(s,x,y,col)=>{ctx.font='9px G9';const w=ctx.measureText(s).width+8;px(x-w/2,y,w,12,col||'rgba(74,46,30,.82)');txt(s,x,y+1.5,'#fff7e0',9,'center','G9');};
  for(const [id,Z] of Object.entries(PLACES)){const [gx,gy]=mapCell(id),cx=ox+(gx+.5)*cw,cy=oy+gy*ch;if(id==='glamp'&&!(SV.mq>=1))continue;const lock=Z.lv>SV.lv;
    lab((lock?'🔒 ':'')+Z.name+((SV.today.visited||[]).includes(id)?' ✓':''),cx,id==='town'?cy+4:cy+ch/2-6);
    const qs=SV.today.quests.some(q=>q.state==='active'&&q.place===id);if(qs)drawMark(cx+50,cy+ch/2-26,'!',t);}
  if((SV.ch||1)>=2){lab('🚗 대회 가는 길',ox+2.6*cw,oy-ch+ch*.62);lab('🏆 강아지 대회장',ox+3.55*cw,oy-ch+ch*.75);}
  const TA=zoneArea('town');if(TA)for(const h of TOWN_HOUSES){const hx=ox+cw+(h.tx*T+16)/TA.PW*cw,hy=oy+ch+(h.ty*T+20)/TA.PH*ch;ctx.font='7px G7';const nm=HOUSE_SHORT[h.id],w=ctx.measureText(nm).width+4;
    px(hx-w/2,hy,w,9,h.id==='home'?'rgba(192,96,42,.95)':'rgba(255,250,235,.92)');txt(nm,hx,hy+1,h.id==='home'?'#fff':'#4a3426',7,'center','G7');const m=houseMark(h.id);if(m)drawMark(hx,hy-20,m,t);}
  // 나 (얼굴)
  const me=myMapPos(),b=Math.sin(t*5)*1.5;ell(ctx,me.x,me.y+b,9,9,'#4a2e1e');ell(ctx,me.x,me.y+b,8,8,'#fff6e0');
  const hi=humanImg('girl',GIRL,'down',0);ctx.drawImage(hi,3,0,14,14,me.x-6,me.y-7+b,12,12);ell(ctx,me.x+7,me.y+7+b,3,3,'#ffd23f');
  ctx.restore();
  panel(6,6,VW-12,20);txt('🗺️ 담이네 동네 지도',14,11,'#c0602a',11,'left','G11B');txt(isTouch?'끌어서 이동 · +/- 확대 · 빈 곳 눌러 닫기':'휠/E·Q 확대 · 방향키·끌기 이동 · 스페이스 내 위치 · M/Esc 닫기',VW-14,13,'#9a7a5a',7,'right','G7');
  for(const [y,s] of [[VH-74,'+'],[VH-48,'−']]){panel(VW-40,y,32,22);txt(s,VW-24,y+4,'#4a3426',11,'center','G11B');}}
// 마우스 휠 확대, 끌어서 이동
(function(){const cv=document.getElementById('c');if(!cv)return;let drag=null;
  cv.addEventListener('wheel',e=>{if(!(G&&G.ov&&G.ov.type==='map2'))return;e.preventDefault();const o=G.ov;o.z=clamp(o.z*(e.deltaY<0?1.15:1/1.15),.6,4);},{passive:false});
  cv.addEventListener('pointerdown',e=>{if(G&&G.ov&&G.ov.type==='map2')drag={x:e.clientX,y:e.clientY,cx:G.ov.cx,cy:G.ov.cy,m:0};});
  addEventListener('pointermove',e=>{if(!drag||!(G&&G.ov&&G.ov.type==='map2'))return;const r=cv.getBoundingClientRect(),s=VW/r.width,o=G.ov;const dx=(e.clientX-drag.x)*s,dy=(e.clientY-drag.y)*s;if(Math.abs(dx)+Math.abs(dy)>4){drag.m=1;o.dragged=true;}o.cx=drag.cx-dx/o.z;o.cy=drag.cy-dy/o.z;});
  addEventListener('pointerup',()=>{drag=null;});})();
