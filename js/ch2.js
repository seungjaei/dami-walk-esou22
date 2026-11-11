"use strict";
// ===== 챕터 2: 자동차 · 도로 · 대회장 · 연습 숙련도 · 강아지 대회 =====
// 흐름: 챕터 1(글램핑장) 완료 → 글램핑장 옆 자동차 → 도로를 따라 운전 → 대회장
//       → 어질리티·원반·기다려 연습(할수록 숙련도↑) → 강아지 대회(3종목 합계로 순위) → 우승하면 챕터 2 완료
// 저장: SV.pro={agil,fris,wait} 0~100, SV.c2={wins,best,tries}

const PRO_NAME={agil:'어질리티',fris:'원반',wait:'기다려'};
const proAvg=()=>{const p=SV.pro||{};return Math.round(((p.agil||0)+(p.fris||0)+(p.wait||0))/3);};
function addPro(k,n){SV.pro=SV.pro||{agil:0,fris:0,wait:0};const before=SV.pro[k]|0;SV.pro[k]=Math.min(100,before+Math.max(1,Math.round(n*(1-before/140))));
  const up=SV.pro[k]-before;if(up>0)toast(`📈 ${PRO_NAME[k]} 숙련도 +${up} (지금 ${SV.pro[k]})`);save();return up;}
const ch2Open=()=>(SV.ch||1)>=2&&(SV.glamp&&SV.glamp.st>=4);

// ---------- 그림 ----------
function buildCar(){return mk(40,26,g=>{ell(g,20,23,18,3,'rgba(0,0,0,.25)');
  rc(g,2,10,36,10,'#4a2e1e');rc(g,3,11,34,8,'#ef5a5a');rc(g,3,11,34,2,'#ff8a8a');
  rc(g,10,3,20,9,'#4a2e1e');rc(g,11,4,18,8,'#ef5a5a');rc(g,13,5,7,6,'#bfe6ff');rc(g,21,5,6,6,'#bfe6ff');
  ell(g,24,8,3,3,'#f9edda');ell(g,23,6,1.4,2,'#e8c99c');rc(g,25,8,1,1,'#1e1512');   // 창문 밖을 보는 담이
  rc(g,35,13,3,3,'#ffd23f');rc(g,2,13,2,3,'#c0302a');
  for(const x of [10,30]){ell(g,x,20,4.5,4.5,'#2a2a2a');ell(g,x,20,2,2,'#9a9a9a');}});}
function buildArenaSign(){return mk(44,30,g=>{rc(g,6,12,3,18,'#5a3a22');rc(g,35,12,3,18,'#5a3a22');rc(g,0,0,44,14,'#4a2e1e');rc(g,1,1,42,12,'#ffd23f');
  for(let i=0;i<5;i++)rc(g,4+i*8,4,5,5,['#ef6f7c','#5aa9e6','#7cc36a','#f2a33a','#b07aa1'][i]);});}
function buildFlag(c){return mk(10,22,g=>{rc(g,1,0,1,22,'#4a2e1e');rc(g,2,1,8,6,c);});}

// ---------- 자동차 (글램핑장 옆) ----------
function ch2ZoneHook(A){if(A.place!=='glamp'||!ch2Open())return;const x=(A.hub[0]+9)*T,y=(A.hub[1]+3)*T;
  A.objs.push({kind:'car',x,y,img:spr('car',buildCar),onUse:()=>{SFX.sel();openMenu({title:'🚗 자동차',items:[{label:'대회장으로 운전해 가기',fn:()=>{closeOv();driveTo('E');}},{label:'닫기',fn:closeOv}]});},lab:'🚗 자동차 타기'});
  for(let tx=A.hub[0]+8;tx<=A.hub[0]+10;tx++)A.solid[(A.hub[1]+2)*A.W+tx]=1;}
function driveTo(dir){SV.today.clock+=10;enterArea('road',{x:dir==='E'?3*T:66*T,y:7*T+8});G.pl.face=dir==='E'?1:-1;G.pl.dir='side';
  tip('drive','운전 중! 방향키(조이스틱)로 도로를 따라가요. 오른쪽 끝은 대회장, 왼쪽 끝은 글램핑장이에요.');}

// ---------- 도로 ----------
function genRoad(){const W=70,H=14,A=blankArea('road',W,H);A.outdoor=true;A.drive=true;A.place='road';
  A.ground=mk(A.PW,A.PH,g=>{for(let y=0;y<A.PH;y+=4)for(let x=0;x<A.PW;x+=4)rc(g,x,y,4,4,(x*7+y*13)%23<3?'#7cbf56':'#8fcf66');
    rc(g,0,5*T-4,A.PW,4,'#c8b088');rc(g,0,10*T,A.PW,4,'#c8b088');rc(g,0,5*T,A.PW,5*T,'#5a5e66');rc(g,0,5*T,A.PW,2,'#e8e8e8');rc(g,0,10*T-2,A.PW,2,'#e8e8e8');
    for(let x=0;x<A.PW;x+=24)rc(g,x,7.5*T-1,12,2,'#ffd23f');});
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++)if(ty<5||ty>9)A.solid[ty*W+tx]=1;
  for(let tx=2;tx<W;tx+=RI(3,5)){A.objs.push({kind:'tree',x:tx*T+8,y:3*T+14,img:spr('rt'+tx%3,()=>buildTree(['tree','pine','cherry'][tx%3],SEASONS[season()],tx))});
    if(tx%2)A.objs.push({kind:'tree',x:tx*T+8,y:12*T+14,img:spr('rt'+(tx+1)%3,()=>buildTree(['tree','pine','cherry'][(tx+1)%3],SEASONS[season()],tx+7))});}
  A.objs.push({kind:'sign',x:8*T,y:4*T+12,img:spr('arsign',buildArenaSign)});A.objs.push({kind:'sign',x:62*T,y:4*T+12,img:spr('arsign',buildArenaSign)});
  A.exits.push({x:-T+6,y:5*T,w:T,h:5*T,act:()=>{enterArea('zone',{id:'glamp',x:(24+8)*T,y:(15+5)*T});toast('글램핑장에 도착했어요');}});
  A.exits.push({x:A.PW-6,y:5*T,w:T,h:5*T,act:()=>{enterArea('arena',{x:3*T,y:10*T+8});toast('🏆 강아지 대회장에 도착했어요!');}});
  A.spawn={x:3*T,y:7*T+8};A.thumb=makeThumb(A);return A;}

// ---------- 대회장 ----------
function genArena(){const W=30,H=20,A=blankArea('arena',W,H);A.outdoor=true;A.place='arena';
  A.ground=mk(A.PW,A.PH,g=>{for(let y=0;y<A.PH;y+=4)for(let x=0;x<A.PW;x+=4)rc(g,x,y,4,4,(x*5+y*11)%19<3?'#7cbf56':'#94d26c');
    rc(g,0,9*T,4*T,3*T,'#5a5e66');rc(g,0,9*T,4*T,2,'#e8e8e8');rc(g,0,12*T-2,4*T,2,'#e8e8e8');
    for(const [x,y,w,h] of [[5,3,10,6],[17,3,10,6],[9,12,12,6]]){rc(g,x*T,y*T,w*T,h*T,'#a8dc84');rc(g,x*T,y*T,w*T,1,'#ffffff');rc(g,x*T,(y+h)*T-1,w*T,1,'#ffffff');rc(g,x*T,y*T,1,h*T,'#ffffff');rc(g,(x+w)*T-1,y*T,1,h*T,'#ffffff');}});
  for(let tx=0;tx<W;tx++){A.solid[tx]=1;A.solid[(H-1)*W+tx]=1;}for(let ty=0;ty<H;ty++){if(ty<9||ty>11)A.solid[ty*W]=1;A.solid[ty*W+W-1]=1;}
  for(let tx=1;tx<W-1;tx+=2){A.objs.push({kind:'flag',x:tx*T+8,y:1*T+14,img:spr('flag'+tx%5,()=>buildFlag(['#ef6f7c','#5aa9e6','#7cc36a','#f2a33a','#b07aa1'][tx%5]))});}
  const station=(x,y,img,lab,fn)=>A.objs.push({kind:'station',x,y,img,onUse:fn,lab,r:30});
  station(10*T,9*T,spr('cone0',()=>buildFurn('cone',0)),'🚩 어질리티 연습',()=>practice('agil'));
  station(22*T,9*T,spr('arsign',buildArenaSign),'🥏 원반 연습',()=>practice('fris'));
  station(15*T,15*T,spr('mat',()=>buildDeco('rug')),'🦴 기다려 연습',()=>practice('wait'));
  // 꾸밈: 어질리티 콘 지그재그 · 원반 깃발 · 구경 온 강아지 친구들(말 걸면 대결도 가능)
  for(const [x,y] of [[6.5,4.5],[8.5,7.5],[11.5,4.5],[13.5,7.5]])A.objs.push({kind:'cone',x:x*T,y:y*T,img:spr('cone0',()=>buildFurn('cone',0)),flat:true});
  for(const x of [19,25])A.objs.push({kind:'flag',x:x*T,y:7*T,img:spr('flag'+x%5,()=>buildFlag(['#ef6f7c','#5aa9e6','#7cc36a','#f2a33a','#b07aa1'][x%5]))});
  WALKERS.slice().sort(()=>rnd()-.5).slice(0,3).forEach((w,i)=>{const L=[[3+i*9,11],[4+i*9,11],[5+i*9,11],[6+i*9,11]];addWalker(A,w,{x:L[0][0]*T+8,y:L[0][1]*T+4},{line:L,a:0,b:3});});
  A.npcs.push({id:'coach',role:'arena',P:NPCS.coach.P,name:'대회 심판 은비 코치',x:26*T,y:14*T,dir:'down',face:1,anim:0});
  A.objs.push({kind:'desk',x:26*T,y:15*T+6,img:spr('board0',()=>buildFurn('board',0)),onUse:openCompetition,lab:'🏆 강아지 대회 접수',r:30});A.solid[15*W+26]=1;
  A.exits.push({x:-T+6,y:9*T,w:T,h:3*T,act:()=>{driveTo('W');}});
  A.spawn={x:3*T,y:10*T+8};A.thumb=makeThumb(A);return A;}

// ---------- 연습 ----------
let PRACTICE=null,COMP=null;
function practice(k){if(SV.today.clock>=22*60){toast('너무 늦었어요. 내일 연습해요');return;}SV.today.clock+=20;PRACTICE=k;
  if(k==='agil')startAgility();else if(k==='fris')startFrisbee(false);else startWaitTrial();}
const COACH_DOG={id:'coachdog',dog:'코치네 보더콜리',breed:'보더콜리',owner:'은비 코치',P:NPCS.coach.P,D:{C:'#2e2a2a',D:'#1e1a1a',L:'#ffffff',OL:'#0e0c0c',EAR:'#1e1a1a',ear:'point',mask:true}};
function startWaitTrial(){startDuel({w:COACH_DOG,role:'walker'},'wait',0);const o=G.ov;o.trial=true;o.brk=8+Math.min(10,(SV.pro&&SV.pro.wait||0)/10)+R(0,3);o.rateK=1-.5*((SV.pro&&SV.pro.wait||0)/100);}
// 숙련도가 높을수록: 어질리티 시간 +, 기다려 흥분 게이지가 덜 오른다
const _startAgility=startAgility;startAgility=function(){_startAgility();const o=G.ov;o.t+=Math.round(((SV.pro&&SV.pro.agil)||0)/10);};
const _updDuel=updDuel;updDuel=function(dt){const o=G.ov;if(o&&o.kind==='wait'&&o.ph==='go'&&(SV.pro&&SV.pro.wait)){const g0=o.g;_updDuel(dt);if(G.ov===o&&o.ph==='go'&&o.g>g0)o.g=g0+(o.g-g0)*(1-.45*SV.pro.wait/100);return;}_updDuel(dt);};
// 결과를 받아 숙련도 올리기 / 대회 점수 매기기
const _agilEnd=agilEnd;agilEnd=function(quit){const o=G.ov,ok=o.i>=o.gates.length,tl=Math.max(0,Math.ceil(o.t));const sc=ok?60+tl*2:o.i*8;
  if(COMP&&!quit){G.ov=null;compScore('agil',sc);return;}_agilEnd(quit);if(PRACTICE==='agil'&&!quit){addPro('agil',ok?10+tl/3:4);PRACTICE=null;}};
const _frisEnd=frisEnd;frisEnd=function(quit){const o=G.ov;if(COMP&&!(quit&&!o.end)){G.ov=null;compScore('fris',o.score*2);return;}_frisEnd(quit);if(PRACTICE==='fris'&&!(quit&&!o.end)){addPro('fris',4+o.score/4);PRACTICE=null;}};
const _duelEnd=duelEnd;duelEnd=function(r){const o=G.ov;if(o&&o.trial){o.ph='done';o.res=r;const sc=r==='win'?60+Math.round(Math.max(0,o.goal-o.t)):r==='draw'?70:Math.round(o.t*3);
    if(COMP){setTimeout(()=>{if(G.ov===o)G.ov=null;compScore('wait',sc);},900);return;}SFX[r==='lose'?'soft':'clear']();addPro('wait',r==='lose'?4:12);PRACTICE=null;return;}_duelEnd(r);};

// ---------- 대회 ----------
// 상대 점수는 대회 등급마다 정해진 범위. 내 점수 = 3종목 점수 × (0.7 + 숙련도 평균 × 0.006)
const COMP_TIERS=[{name:'동네 강아지 대회',rivals:[[150,200],[170,230],[190,250]],prize:[200,120,60]},{name:'도시 강아지 대회',rivals:[[220,270],[240,290],[260,320]],prize:[400,200,100]}];
const RIVALS=[['보리','말티즈'],['콩이','포메라니안'],['초코','토이푸들'],['단풍','시바견'],['식빵','웰시코기'],['솜이','비숑']];
function openCompetition(){SFX.sel();SV.c2=SV.c2||{wins:0,best:0,tries:0};const tier=Math.min(SV.c2.wins,COMP_TIERS.length-1),T0=COMP_TIERS[tier],done=SV.today.compDone;
  openMenu({title:`🏆 ${T0.name} 접수처`,items:[{label:`숙련도 · 어질리티 ${SV.pro?SV.pro.agil|0:0} · 원반 ${SV.pro?SV.pro.fris|0:0} · 기다려 ${SV.pro?SV.pro.wait|0:0}`,dis:true,fn:()=>{}},
    {label:`우승 상금 🦴${T0.prize[0]} · 지금까지 우승 ${SV.c2.wins}번 · 최고 ${SV.c2.best}점`,dis:true,fn:()=>{}},
    {label:done?'오늘은 이미 출전했어요 (내일 다시!)':SV.today.clock>=20*60?'대회는 저녁 8시 전에만 접수해요':'🏁 출전하기 (3종목: 어질리티 → 원반 → 기다려)',dis:!!done||SV.today.clock>=20*60,fn:()=>startCompetition(tier)},
    {label:'💡 연습장(🚩🥏🦴)에서 연습할수록 숙련도가 올라 점수가 더 잘 나와요',dis:true,fn:()=>{}},{label:'닫기',fn:closeOv}]});}
function startCompetition(tier){closeOv();SV.today.compDone=1;SV.c2.tries++;SV.today.clock+=60;
  const T0=COMP_TIERS[tier],rs=RIVALS.slice().sort(()=>rnd()-.5).slice(0,3);
  COMP={tier,scores:{},rivals:rs.map((r,i)=>({name:r[0],breed:r[1],score:RI(T0.rivals[i][0],T0.rivals[i][1])}))};
  openDialog({name:'대회 심판 은비 코치',P:NPCS.coach.P,id:'coach',lines:[`${T0.name}에 오신 걸 환영해요!`,'첫 번째 종목은 어질리티! 번호 순서대로 콘을 통과해요.'],cb:()=>startAgility()});}
function compScore(k,sc){COMP.scores[k]=sc;const next={agil:['원반! 다섯 번 던져서 점수를 모아요.',()=>startFrisbee(false)],fris:['마지막은 기다려! 간식 앞에서 끝까지 참아요.',()=>{startDuel({w:COACH_DOG,role:'walker'},'wait',0);G.ov.trial=true;G.ov.brk=99;G.ov.goal=14;}],wait:null}[k];
  if(next){openDialog({name:'대회 심판 은비 코치',P:NPCS.coach.P,id:'coach',lines:[`${PRO_NAME[k]} ${sc}점!`,next[0]],cb:next[1]});return;}
  compResult();}
function compResult(){const C=COMP;COMP=null;const raw=(C.scores.agil|0)+(C.scores.fris|0)+(C.scores.wait|0),mine=Math.round(raw*(.7+proAvg()*.006));
  const myName=isMP()&&MP.look&&MP.look.dog?MP.look.dog:'담이';
  const all=C.rivals.concat([{name:myName,me:true,score:mine}]).sort((a,b)=>b.score-a.score);const rank=all.findIndex(x=>x.me)+1,T0=COMP_TIERS[C.tier];
  SV.c2.best=Math.max(SV.c2.best,mine);const prize=T0.prize[rank-1]||0;if(prize)addCoins(prize);gainXP(30);
  const L=[`종목 점수 · 어질리티 ${C.scores.agil|0} · 원반 ${C.scores.fris|0} · 기다려 ${C.scores.wait|0}`,`숙련도 보너스 ×${(.7+proAvg()*.006).toFixed(2)} → 최종 ${mine}점`,
    ...all.map((x,i)=>`${['🥇','🥈','🥉','4위'][i]} ${x.me?'⭐ '+x.name:x.name+'('+x.breed+')'} ${x.score}점`)];
  if(rank===1){SV.c2.wins++;L.push(`🏆 우승! 상금 🦴${prize}`);logDay(`${T0.name}에서 우승했다! 담이 최고!`);
    if(SV.c2.wins===1){SV.ch=Math.max(SV.ch,3);L.push('🎉 챕터 2 「강아지 대회」 완료! 다음엔 더 큰 도시 강아지 대회가 기다려요.');}}
  else{L.push(prize?`${rank}위 입상! 상금 🦴${prize}`:'아쉽지만 입상은 못 했어요. 연습장에서 숙련도를 올려 다시 도전해요!');logDay(`${T0.name}에서 ${rank}위를 했다.`);}
  SFX[rank===1?'clear':'heart']();save(true);openDialog({name:'대회 결과',P:NPCS.coach.P,id:'coach',lines:L});}

// ---------- 할 일 목록 ----------
function ch2Todo(){if(!ch2Open())return[];SV.c2=SV.c2||{wins:0,best:0,tries:0};
  if(SV.c2.wins<1)return[{ic:'star',t:'[챕터2] 대회 우승하기',sub:`숙련도 ${proAvg()}%`}];return[];}

// ---------- 화면: 운전 중에는 사람 대신 자동차, 담이는 차 안 ----------
function drawCarPlayer(o){const im=spr('car',buildCar);ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if((o.face||1)<0)ctx.scale(-1,1);ctx.drawImage(im,-20,-22);ctx.restore();}
const SPECIAL_AREAS={road:genRoad,arena:genArena};
