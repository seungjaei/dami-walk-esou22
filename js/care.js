"use strict";
// ===== 돌봄·행동 (v5): 쉬·응아, 굶기면 삐짐, 기분·졸림·기절, 비·눈, 강아지 반응, 주워먹기 막기, 떨림 고침,
//       등급 있는 채집, 목욕(연타·탈출), 공 던지기 게이지, 기다려 연출 =====

// ---------- 시간 흐름 빠르기 (설정) ----------
const TSPD=[.6,1,1.5];

// ---------- 매 프레임 ----------
const _update0=update;update=function(dt){MIN_PER_SEC=MIN_PER_SEC_BASE*TSPD[SV.tspeed==null?1:SV.tspeed];_update0(dt);
  // 캐는 동안에는 리드줄에 끌려가지 않고 그 자리에서 (방향키를 누르면 그만두기)
  if(GATH&&GATH.t>0&&G){const mv=K.ArrowLeft||K.ArrowRight||K.ArrowUp||K.ArrowDown||K.KeyA||K.KeyD||K.KeyW||K.KeyS||Math.abs(JOY.x)+Math.abs(JOY.y)>.3;if(mv)GATH=null;else{G.pl.x=GATH.lx;G.pl.y=GATH.ly;}}if(scene==='game'&&G&&G.area&&!G.ov)careTick(dt);};
function careTick(dt){const A=G.area,d=G.dami,S=st(),gm=dt*MIN_PER_SEC;
  if(S.pee==null)S.pee=30;if(S.poop==null)S.poop=20;if(S.me==null)S.me=75;
  if(!A.drive){S.pee=Math.min(100,S.pee+gm/1.7);S.poop=Math.min(100,S.poop+gm/3.4);}S.me=Math.max(0,S.me-gm/9);
  // 쉬·응아: 밖에서는 알아서, 집에서는 너무 참으면 실수
  if(d.state==='idle'&&!G.play&&!G.busy){
    if(A.outdoor&&!A.drive&&A.place!=='arena'){if(S.pee>=85)startPotty('pee');else if(S.poop>=90)startPotty('poop');}
    else if(!A.outdoor&&(S.pee>=100||S.poop>=100))startPotty(S.pee>=100?'pee':'poop',true);}
  // 굶기면 삐짐: 배고프고 목마른 채로 두면 혼자 집에 가서 하루 종일 쉰다
  if(!SV.today.hungryPen&&S.hunger<6&&S.thirst<6){SV.today.hungryPen=1;addSt('mood',-15);const lost=loseFinds();logDay('밥도 물도 못 먹어서 담이가 삐졌다… '+lostText(lost));
    openDialog({name:SV.dogName||'담이',id:'dami',lines:['낑… 배고프고 목말라요…','(담이가 삐져서 가방을 뒤적이다가 물건을 떨어뜨렸어요)',lostText(lost),'밥이랑 물은 꼭 챙겨 주세요!']});return;}
  // 졸림 → 새벽 1시가 넘으면 기절, 장비를 잃는다
  if(SV.today.clock>=25*60&&!SV.today.fainted){SV.today.fainted=1;faint();return;}
  // 비·눈 오는 날 밖: 나가자마자 젖고 흙탕물
  if(A.outdoor&&!A.drive&&wetDay()&&!G.wetIn){G.wetIn=1;addSt('clean',-100);addSt('mood',-6);d.wet=1;bubble('dami',SV.today.events.includes('snow')?'으앙 눈이 묻어서 다 젖었어…':'으앙 흙탕물이야… 다 젖었어',2,'#3a5a9a');SFX.yelp();}
  // 다른 강아지와 마주침: 반가움(왈왈) · 경계(으르렁) · 무서움(깨갱)
  for(const n of A.npcs){if(n.role!=='walker'||!n.pup||n.reacted)continue;if(Math.hypot(n.pup.x-d.x,n.pup.y-d.y)>48)continue;n.reacted=1;const m=dogMood(n.w.id);
    if(m==='happy'){bubble('dami','왈왈!',1.4,'#c0602a');bubble(n.pup,'왈!',1.2,'#c0602a');SFX.woof();setTimeout(()=>SFX.woof(),180);}
    else if(m==='wary'){bubble(n.pup,'으르렁…',1.8,'#8a3a2a');bubble('dami','으르릉… (경계 중)',1.6,'#8a3a2a');growl();}
    else{bubble(n.pup,'깨갱!',1.4,'#3a5a9a');bubble('dami','멍?',1);SFX.yelp();}}
  // 큰 떠돌이 개를 보면 깨갱
  if(A.dogs)for(const g of A.dogs){if(g.sleep||g.yelped)continue;if(Math.hypot(g.x-d.x,g.y-d.y)<40){g.yelped=1;bubble('dami','깨갱! 무서워요…',1.4,'#3a5a9a');addSt('mood',-3);}}
}
const wetDay=()=>SV.today.events.includes('rain')||SV.today.events.includes('snow');
function growl(){tone(110,.35,'sawtooth',.03,0,90);tone(98,.3,'sawtooth',.025,.3,80);}
function dogMood(id){const M=(SV.today.dogMood=SV.today.dogMood||{});if(!M[id]){const r=rnd(),f=SV.friends[id]||0;M[id]=r<.18-f*.02?'scared':r<.42-f*.04?'wary':'happy';}return M[id];}
function faint(){const lost=loseFinds();logDay('너무 졸려서 쓰러져 버렸다… '+lostText(lost));
  openDialog({name:'😵',id:'dami',lines:['너무 졸려서 그 자리에서 쓰러져 버렸어요…','정신을 차려 보니 '+lostText(lost),'다음부터는 새벽 1시 전에 꼭 자요!'],cb:()=>{endDay();}});}
// 벌칙: 가지고 있는 팔 물건(담이가 찾은 것)을 무작위로 2~4개 잃어버린다. 없으면 잃는 것 없음
function loseFinds(){const F=SV.finds||{},lost={};let n=RI(2,4);
  for(let k=0;k<20&&n>0;k++){const own=Object.keys(F).filter(id=>F[id]>0&&FINDS[id]);if(!own.length)break;const id=pick(own);F[id]--;lost[id]=(lost[id]||0)+1;n--;}save();return lost;}
function lostText(lost){const L=Object.entries(lost);return L.length?L.map(([id,v])=>`${FINDS[id].ic}${FINDS[id].name} ${v}개`).join(', ')+'를 잃어버렸어요.':'다행히 잃어버린 물건은 없어요.';}

// ---------- 쉬·응아 ----------
function startPotty(kind,indoor){const d=G.dami;d.state='potty';d.pk=kind;d.t=1.8;d.indoor=!!indoor;bubble('dami',kind==='pee'?(indoor?'앗… 못 참겠어요!':'쉬~'):(indoor?'끄응… 실수할 것 같아요!':'끄응… 응아~'),1.6,'#7a5a3a');}
function pottyDone(){const d=G.dami,A=G.area,S=st(),k=d.pk;if(k==='pee')S.pee=0;else S.poop=0;d.state='idle';
  if(d.indoor){addSt('mood',-4);toast(k==='pee'?'앗! 담이가 집에서 쉬를 했어요… 닦아 주세요':'앗! 담이가 집에서 응아를 했어요… 치워 주세요');
    A.objs.push({kind:'mess',x:d.x,y:d.y+2,img:spr(k==='pee'?'puddle':'poop',k==='pee'?buildPuddle:buildPoop),flat:true,onUse:o=>{A.objs=A.objs.filter(x=>x!==o);SFX.pick();toast('깨끗하게 치웠어요! 다음엔 산책 가서 해요');},lab:k==='pee'?'🧽 쉬 닦기':'🧻 응아 치우기',r:22});return;}
  addSt('mood',4);if(k==='pee'){A.objs.push({kind:'pee',x:d.x,y:d.y+2,img:spr('puddle',buildPuddle),flat:true,t:0});logDay('산책길에서 시원하게 쉬를 했다.');return;}
  const o={kind:'poop',x:d.x+d.face*-6,y:d.y+2,img:spr('poop',buildPoop),flat:true,lab:'🧻 응아 치우기',r:22,onUse:ob=>{A.objs=A.objs.filter(x=>x!==ob);addCoins(2);SFX.pick();SV.manner=(SV.manner||0)+1;toast('🧻 매너 산책! 응아를 치웠어요 (+2 뼈다귀)');logDay('담이 응아를 깨끗이 치웠다. 매너 산책!');}};A.objs.push(o);
  tip('poop','담이가 응아를 했어요! 다가가서 [행동]으로 치워 주세요. 안 치우고 가면 이웃들이 속상해해요.');}
function buildPuddle(){return mk(16,8,g=>{ell(g,8,4,7,3,'rgba(240,210,80,.55)');ell(g,6,3,3,1.2,'rgba(255,240,170,.6)');});}
function buildPoop(){return mk(10,9,g=>{ell(g,5,7,4.5,2,'#6a4426');ell(g,5,5,3.4,1.8,'#7a5030');ell(g,5,3,2.2,1.4,'#8a5c38');rc(g,5,0,1,2,'#8a5c38');});}
const _updDami0=updDami;updDami=function(dt){const d=G.dami;
  if(d.state==='potty'){d.t-=dt;d.moving=false;if(d.t<=0)pottyDone();return;}
  if(d.state==='escape'){d.t-=dt;d.moving=true;d.anim+=dt*14;if(!d.target||Math.hypot(d.x-d.target.x,d.y-d.target.y)<6||rnd()<dt*.8){const A=G.area;const p=freeNear(R(2,A.W-2)*T,R(4,A.H-2)*T);if(p)d.target=p;}
    if(d.target)stepTo(d,d.target.x,d.target.y,120,dt);if(rnd()<dt*8)G.parts.push({x:d.x,y:d.y-4,vx:R(-20,20),vy:R(-30,-10),t:.5,g:120,drop:true});if(d.t<=0){d.state='idle';d.escaped=1;bubble('dami','헥헥… 잡아 봐요!',1.5);}return;}
  _updDami0(dt);};
// 떠나기 전에 안 치운 응아 → 이웃이 속상
const _enterArea0=enterArea;enterArea=function(kind,arg){const A0=G&&G.area;
  // 삐진 날·기분이 너무 나쁜 날은 집 밖으로 안 나간다
  if(A0&&(A0.kind==='home')&&kind!=='home'&&kind!=='house'){
    if(st().mood<12&&!SV.today.moodPen){SV.today.moodPen=1;const lost=loseFinds();setTimeout(()=>toast('담이가 기분이 안 좋아서 투덜투덜… '+lostText(lost)),500);logDay('담이 기분이 안 좋아서 투덜대며 나갔다. '+lostText(lost));}}
  const left=A0&&A0.outdoor&&A0.objs.some(o=>o.kind==='poop');
  _enterArea0(kind,arg);G.wetIn=0;if(G.dami)G.dami.wet=G.dami.wet&&wetDay();
  if(left){SV.manner=(SV.manner||0)-1;addSt('mood',-2);setTimeout(()=>toast('앗, 응아를 안 치우고 왔어요… 이웃들이 속상해해요'),400);}
  firstVisitTip();};

// ---------- 주워 먹기: 스페이스(부르기) 연타로 막기 ----------
const _call0=call;call=function(){const d=G.dami;if(G&&!G.ov&&(d.state==='food'||d.state==='eat')){const now=performance.now();if(now-(G.noT||0)>1300)G.noN=0;G.noT=now;G.noN=(G.noN||0)+1;SFX.call();
    bubble('pl',`안돼! (${G.noN}/3)`,.7,'#c0302a');if(G.noN<3)return;G.noN=0;G.callCD=0;addSt('mood',-2);}
  else if(G&&(d.state==='sniff'||d.state==='dig'||d.state==='toSniff'||d.state==='toDig')){addSt('mood',-3);setTimeout(()=>bubble('dami','힝… 냄새 맡고 있었는데',1.2),250);}
  _call0();};

// ---------- 담이가 좌우로 빠르게 떨던 문제: 방향 바꾸기에 짧은 쉬는 시간 ----------
const _stepTo0=stepTo;stepTo=function(e,tx,ty,spd,dt){if(e!==G.dami)return _stepTo0(e,tx,ty,spd,dt);const pf=e.face,pd=e.dir;e.fcd=Math.max(0,(e.fcd||0)-dt);
  const r=_stepTo0(e,tx,ty,spd,dt);if(r<3){e.dir=pd;e.face=pf;return r;}
  if((e.face!==pf||e.dir!==pd)&&e.fcd>0){e.face=pf;e.dir=pd;}else if(e.face!==pf||e.dir!==pd)e.fcd=.35;return r;};

// ---------- 채집: 도구 등급(하급 5번·중급 3번·고급 1번) × 자원 등급(하급·중급·고급) ----------
const TOOLN={axe:'도끼',pick:'곡괭이',sickle:'낫'},HITS=[9,5,3,1],GRADE=['','하급','중급','고급'];
const RES_TOOL={wood:'axe',stone:'pick',fiber:'sickle',flower:null};
function toolTier(k){SV.tool=SV.tool||{};if(SV.tools&&!SV.tool[k])SV.tool[k]=1;return SV.tool[k]|0;}
function nodeGrade(ob,res){if(res==='flower')return 1;const A=G.area,si=A.staticObjs.indexOf(ob);const h=(si*2654435761+(A.place||'').length*97)>>>0;const r=h%10;return r>=9?3:r>=6?2:1;}
function gLabel(ob,res){const tk=RES_TOOL[res],g=nodeGrade(ob,res),tt=tk?toolTier(tk):3;const base={wood:'🪓 나무 베기',stone:'⛏️ 돌 캐기',fiber:'🌿 풀 베기',flower:'🌸 꽃 따기'}[res];
  if(res==='flower')return base;if(tt<g)return `${base} · ${GRADE[g]} (${GRADE[g]} ${TOOLN[tk]} 필요)`;return `${base} · ${GRADE[g]} · ${HITS[tt]}번`;}
let GATH=null;
gather=function(ob,res){const A=G.area,si=A.staticObjs.indexOf(ob);if(si<0||G.busy)return;const tk=RES_TOOL[res],tt=tk?toolTier(tk):3,g=nodeGrade(ob,res);
  if(tt<g){toast(`이건 ${GRADE[g]} ${res==='wood'?'나무':res==='stone'?'바위':'풀'}이라 ${GRADE[g]} ${TOOLN[tk]}가 필요해요 (마을 철물점)`);SFX.soft();return;}
  if(!GATH||GATH.ob!==ob)GATH={ob,n:0,need:res==='flower'?1:HITS[tt],lx:G.pl.x,ly:G.pl.y};GATH.n++;GATH.t=1.5;G.busy=.22;setTimeout(()=>{if(G)G.busy=0;},220);
  SFX.step();bubble('pl',{wood:'쿵!',stone:'깡!',fiber:'싹둑!',flower:'톡!'}[res],.5);for(let k=0;k<5;k++)G.parts.push({x:ob.x+R(-6,6),y:ob.y-8,vx:R(-30,30),vy:R(-40,-10),t:.5,g:140,dirt:true});
  if(GATH.n<GATH.need)return;GATH=null;
  const n=[0,RI(1,2),RI(2,3),RI(4,5)][g];SV.today.clock+=res==='wood'||res==='stone'?6:3;SV[res]=(SV[res]||0)+n;const cut=(SV.today.cut=SV.today.cut||{});(cut[A.place]=cut[A.place]||[]).push(si);
  const i=A.objs.indexOf(ob);if(i>=0)A.objs[i]=Object.assign({},ob,{kind:'cut_'+res,img:CUT_IMG[res](),cutDone:true});
  SFX.pick();toast(`${RES_NAME[res]} +${n} (${GRADE[g]}) · 지금 ${SV[res]}개`);if(rnd()<.4)bubble('dami',pick(['멍! 나도 도울래!','우와 힘세다!','킁킁, 좋은 냄새~']),1.2);save();};
function drawGatherBar(){if(!GATH||!GATH.ob||G.ov)return;GATH.t-=1/60;if(GATH.t<=0){GATH=null;return;}const o=GATH.ob,sx=o.x-G.cam.x,sy=o.y-G.cam.y-34;
  px(sx-16,sy,32,6,'#4a2e1e');px(sx-15,sy+1,30*GATH.n/GATH.need,4,'#ffd23f');txt(`${GATH.n}/${GATH.need}`,sx,sy-10,'#fff',9,'center','G9','#4a2e1e');}

// ---------- 목욕: 문지르기 → [행동] 연타로 헹구기(시간 안에) → 말리기. 놓치면 탈출! ----------
const _bathMove0=bathMove;bathMove=function(p){_bathMove0({x:clamp(p.x,VW/2-90,VW/2+90),y:clamp(p.y,VH/2-55,VH/2+55)});const o=G.ov;o.sx=clamp(o.sx,VW/2-90,VW/2+90);o.sy=clamp(o.sy,VH/2-55,VH/2+55);};
const _updBath0=updBath;updBath=function(dt){const o=G.ov;if(!o||o.type!=='bath')return;
  if(o.stage===1){o.hold=false;if(o.rinT==null){o.rinT=Math.max(5,9-((5-o.lv)*.6));}o.rinT-=dt;o.prog=Math.max(0,o.prog-dt*(10+(5-o.lv)*2));
    if(o.rinT<=0&&o.prog<100){bathEscape();return;}}
  _updBath0(dt);o.sx=clamp(o.sx,VW/2-90,VW/2+90);o.sy=clamp(o.sy,VH/2-55,VH/2+55);};
function bathMash(){const o=G.ov;if(!o||o.type!=='bath'||o.stage!==1)return false;o.prog+=7+o.lv*1.2;SFX.pick();for(let i=0;i<4;i++)(o.drops=o.drops||[]).push({x:VW/2+R(-20,20),y:VH/2-30,vx:R(-40,40),vy:R(20,60),t:.5});o.bub=o.bub.filter(()=>Math.random()>.12);return true;}
function bathEscape(){G.ov=null;const d=G.dami;d.state='escape';d.t=6;d.target=null;addSt('clean',-20);addSt('mood',-5);SFX.yelp();bubble('dami','으앙 탈출이다~!',1.6,'#3a5a9a');
  toast('헹구기를 놓쳐서 담이가 탈출했어요! 따라가서 잡아 주세요');logDay('샤워하다가 담이가 탈출했다! 온 집을 뛰어다녔다.');}
function catchDami(){const d=G.dami;d.escaped=0;d.state='idle';SFX.heart();bubble('dami','잡혔다… 헤헤',1.2);openBath();}
function drawBathExtra(){const o=G.ov;if(!o||o.type!=='bath')return;
  const msg=o.stage===0?(isTouch?'담이를 문질러 거품을 내요 (화면을 문질러요)':'방향키로 담이를 문질러 거품을 내요'):o.stage===1?(isTouch?'💦 화면을 마구 눌러 헹궈요!':'💦 [E] 또는 스페이스를 마구 눌러 헹궈요!'):'수건으로 문질러 말려요';
  chip(VW/2-90,VH-40,'🛁',msg,'#3a5a9a');if(o.stage===1&&o.rinT!=null){const k=clamp(o.rinT/9,0,1);px(VW/2-60,VH-22,120,6,'#4a2e1e');px(VW/2-59,VH-21,118*k,4,k<.3?'#ef5a6f':'#5aa9e6');txt('놓치면 담이가 탈출해요!',VW/2,VH-14,'#fff',7,'center','G7','#4a2e1e');}}

// ---------- 공 던지기: 게이지를 맞춰야 멀리 ----------
const _throwBall0=throwBall;throwBall=function(){const o=G.pl,a=o.dir==='side'?(o.face>0?0:Math.PI):o.dir==='down'?Math.PI/2:-Math.PI/2;G.ov={type:'aim',p:0,dir:1,a,t:0};SFX.sel();tip('aim','공 던지기! ←→로 방향, 게이지가 초록 칸에 올 때 [행동]! 딱 맞으면 멀리 날아가요.');};
function updAim(dt){const o=G.ov;o.t+=dt;o.p+=o.dir*dt*1.4;if(o.p>1){o.p=1;o.dir=-1;}if(o.p<0){o.p=0;o.dir=1;}}
function aimKey(k,OK,BACK){const o=G.ov;if(k==='ArrowLeft'||k==='KeyA')o.a-=.25;else if(k==='ArrowRight'||k==='KeyD')o.a+=.25;else if(k==='ArrowUp'||k==='KeyW')o.a=-Math.PI/2;else if(k==='ArrowDown'||k==='KeyS')o.a=Math.PI/2;
  else if(OK)aimThrow();else if(BACK)closeOv();}
function aimThrow(){const o=G.ov;if(!o||o.type!=='aim')return;const pl=G.pl,perfect=o.p>.82&&o.p<.96,pw=perfect?1.25:o.p,sp=(G.area.outdoor?30:45)+pw*(G.area.outdoor?95:110);closeOv();
  G.ball={x:pl.x+Math.cos(o.a)*8,y:pl.y-2+Math.sin(o.a)*6,z:10,vx:Math.cos(o.a)*sp,vy:Math.sin(o.a)*sp,vz:35+pw*35,state:'fly'};G.dami.state='fetch';SFX.call();
  bubble('pl',perfect?'완벽해! 가져와~!':o.p<.3?'앗, 살살…':'가져와~!',1);if(perfect)addSt('mood',4);}
function drawAim(t){const o=G.ov,pl=G.pl,sx=pl.x-G.cam.x,sy=pl.y-G.cam.y-10;ctx.save();ctx.strokeStyle='#ffd23f';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(o.a)*40,sy+Math.sin(o.a)*40);ctx.stroke();ctx.restore();
  const bx=sx-30,by=sy-34;px(bx,by,60,8,'#4a2e1e');px(bx+1,by+1,58,6,'#e8d8b8');px(bx+1+58*.82,by+1,58*.14,6,'#7cc36a');px(bx+58*o.p,by-2,3,12,'#c0602a');txt(isTouch?'눌러서 던지기':'[E] 던지기 · ←→ 방향',sx,by-12,'#fff',7,'center','G7','#4a2e1e');}

// ---------- 기다려 대결: 게이지가 차면 간식으로 달려들고, [E]로 "기다려!" ----------
const _duelAct0=duelAct;duelAct=function(){const o=G.ov;if(o&&o.type==='duel'&&o.kind==='wait'&&o.ph==='go'&&o.cool<=0)o.calmT=.7;_duelAct0();};

// ---------- 화면 덧그리기 ----------
function drawV5Overlays(t){drawGatherBar();const o=G.ov;if(!o)return;
  if(o.type==='aim')drawAim(t);if(o.type==='status')drawStatusOv(t);if(o.type==='map2')drawMap2(t);}
const _drawOverlay0=drawOverlay;drawOverlay=function(t){_drawOverlay0(t);const o=G.ov;if(!o)return;if(o.type==='bath')drawBathExtra();if(o.type==='duel'&&o.kind==='wait')drawWaitExtra(t);if(o.type==='duel'&&o.calmT>0)o.calmT-=1/60;};
function drawWaitExtra(t){const o=G.ov,X=VW/2-170,Y=VH/2-80;const lunge=Math.pow(clamp(o.g/100,0,1),2)*42,calm=o.calmT>0;
  // 원래 담이 자리를 덮고 다시 그린다(간식 쪽으로 몸이 쏠림)
  px(VW/2-80,Y+64,44,34,'#fbf0d6');const fr=o.g>60&&!calm?[0,1,0,3][Math.floor(t*12)%4]:0;
  const im=pupImg(DAMI_P,'dami','side',fr,calm?'sit':o.g>60?'walk':'sit',SV.eq);ctx.drawImage(im,Math.round(VW/2-60+(calm?-6:lunge)-14),Math.round(Y+92-21));
  if(calm){txt('기다려!',VW/2-62,Y+52,'#c0602a',11,'center','G11B','#fffaf0');}else if(o.g>70&&o.ph==='go')txt('간식이다…!',VW/2-40+lunge,Y+56,'#d94f6a',9,'center','G9','#fffaf0');}
