"use strict";
// ===== 게임 진행: 이동 · 담이 행동 · 상호작용 · 퀘스트 · 하루 루틴 =====
let G=null,scene='title',sceneT=0;
const LEASH=50,MIN_PER_SEC=1/0.8;

function newGameState(){G={area:null,pl:{x:0,y:0,dir:'down',face:1,anim:0,moving:false,step:0},dami:{x:0,y:0,dir:'down',face:1,anim:0,state:'idle',t:0,moving:false,pull:0,curT:8,wT:2,idle:0},
  cam:{x:0,y:0},bubbles:[],parts:[],ov:null,tip:null,fade:1,ball:null,play:null,callT:0,callCD:0,boost:0,hint:null,exitLock:true,lowT:20,toast:null};}

// ---------- 지역 이동 ----------
function enterArea(kind,arg){
  let A;
  if(kind==='home')A=genRoom('home');else if(kind==='house')A=genRoom(arg.id);else if(kind==='town')A=genTown();else A=genZone(arg.id);
  G.area=A;let sp=A.spawn;if(arg&&arg.x!==undefined)sp=arg;else if(arg&&arg.from)sp=spawnAt(kind==='town'?'town':arg.id,arg.from);
  {const f=freeNear(sp.x,sp.y)||sp;G.pl.x=f.x;G.pl.y=f.y;}G.stuckT=0;G.pl.dir=arg&&arg.from?({N:'down',S:'up',E:'side',W:'side'})[arg.from]:kind==='town'?'down':'up';if(arg&&arg.from)G.pl.face=arg.from==='E'?-1:1;
  const d=G.dami;d.x=G.pl.x+(A.outdoor?14:10)*(G.pl.face||1);d.y=G.pl.y+4;if(!freeAt(d.x,d.y)){d.x=G.pl.x;d.y=G.pl.y;}d.state='idle';G.ball=null;G.play=null;G.busy=0;
  if(arg&&arg.wake&&A.cushion){d.x=A.cushion.x;d.y=A.cushion.y-2;d.state='sleep';d.t=2;}
  G.bubbles=[];G.parts=[];G.fade=1;G.exitLock=true;
  G.cam.x=clamp(G.pl.x-VW/2,Math.min(0,(A.PW-VW)/2),Math.max(0,A.PW-VW));G.cam.y=clamp(G.pl.y-VH/2,Math.min(0,(A.PH-VH)/2),Math.max(0,A.PH-VH));
  SV.today.where=kind==='zone'||kind==='house'?'town':kind;save();
  if(kind==='zone'){visitZone(arg.id);tip('walk','산책 중엔 담이가 리드줄로 연결돼요. 떨어진 음식을 먹으려 하면 [부르기]로 불러 주세요!');}
  if(kind==='town')tip('town','마을이에요! 집 문 앞에서 [행동]으로 들어가요. 마을 네 방향 길 끝으로 걸어가면 옆 구역으로 산책을 나가요. 지도는 [지도] 버튼!');
}
function goZone(to,from,exitDir){const P0=PLACES[to];
  if(P0.lv>SV.lv){toast(`${P0.name}은(는) 산책 레벨 ${P0.lv}에 열려요`);SFX.soft();const d=DIRS[exitDir];G.pl.x-=d[0]*18;G.pl.y-=d[1]*18;G.dami.x-=d[0]*18;G.dami.y-=d[1]*18;return;}
  SV.today.clock+=5;enterArea(to==='town'?'town':'zone',{id:to,from});}
function visitZone(id){const V=SV.today.visited;if(V.includes(id))return;V.push(id);addCoins(5);gainXP(8);toast(`새 구역 산책: ${PLACES[id].name} (+5뼈다귀)`);logDay(`${PLACES[id].name}을(를) 걸었다.`);
  if(V.length>=2&&!SV.today.todo.walk){SV.today.todo.walk=1;addCoins(15);gainXP(15);setTimeout(()=>toast('오늘의 산책 완료! +15뼈다귀'),2600);}}
function showNews(){const E=SV.today.events;if(SV.today.newsShown)return;SV.today.newsShown=true;
  const L=E.length?E.map(k=>`${EVENTS[k].title} — ${EVENTS[k].desc}`):['오늘은 특별한 소식이 없어요. 담이랑 느긋하게 산책해요!'];
  const dd=FESTIVAL_DAY-SV.day;if(dd>0)L.push(`마을 강아지 축제까지 D-${dd}!`);
  openDialog({name:'📰 오늘의 마을 소식',lines:L});
  if(SV.sick)openDialog({name:'담이',id:'dami',lines:['끄응… (담이가 기운 없이 엎드려 있어요)','어제 길에서 너무 많이 주워 먹어서 배탈이 났나 봐요. 밥을 못 먹어요.','마을 위쪽 「콩닥 동물병원」에서 진료받으면 금방 나아요. (진료비 🦴 '+VET_FEE+')']});}
// ---------- 충돌 ----------
function solidPx(x,y){const A=G.area,tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||ty<0||tx>=A.W||ty>=A.H)return true;return A.solid[ty*A.W+tx]===1;}
function freeAt(x,y,hw=4,hh=2){return !solidPx(x-hw,y-hh)&&!solidPx(x+hw,y-hh)&&!solidPx(x-hw,y+hh)&&!solidPx(x+hw,y+hh);}
// 끼임 탈출: 가까운 곳부터 빙글빙글 돌며 걸을 수 있는 자리를 찾는다
function freeNear(x,y){if(freeAt(x,y))return{x,y};for(let r=4;r<=T*14;r+=4)for(let a=0;a<24;a++){const q=a/24*Math.PI*2,nx=x+Math.cos(q)*r,ny=y+Math.sin(q)*r;if(freeAt(nx,ny)&&freeAt(nx,ny,6,3))return{x:nx,y:ny};}return null;}
function unstuck(manual){const p=freeNear(G.pl.x,G.pl.y);G.stuckT=0;
  if(!p||(manual&&p.x===G.pl.x&&p.y===G.pl.y&&manual==='home')){enterArea('home',{});toast('집으로 돌아왔어요');return;}
  G.pl.x=p.x;G.pl.y=p.y;const d=G.dami,q=freeNear(p.x+8,p.y+4)||p;d.x=q.x;d.y=q.y;d.state='idle';G.busy=0;
  if(manual)toast('가까운 길로 옮겼어요');}
function move(e,dx,dy){if(freeAt(e.x+dx,e.y))e.x+=dx;if(freeAt(e.x,e.y+dy))e.y+=dy;}
function setDir(e,dx,dy){if(Math.abs(dx)>Math.abs(dy)*1.1){e.dir='side';e.face=dx>0?1:-1;}else if(Math.abs(dy)>.01)e.dir=dy>0?'down':'up';}
function stepTo(e,tx,ty,spd,dt){const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<1)return 0;const s=Math.min(spd*dt,d);move(e,dx/d*s,dy/d*s);setDir(e,dx,dy);e.moving=true;return d;}
function bubble(who,text,t=1.5,col='#4a3426'){G.bubbles=G.bubbles.filter(b=>b.who!==who);G.bubbles.push({who,text,t,col,max:t});}
function tip(id,text){if(SV.tips[id])return;SV.tips[id]=1;G.tip={text,t:6,n:0};}
function toast(s){G.toast={s,t:2.6};}

// ---------- 성장 ----------
const EAT_T=1.3,SICK_AT=7,VET_FEE=30;
function addCoins(n){SV.coins+=n;SV.today.earned+=n;}
function gainXP(n){SV.xp+=n;while(SV.xp>=XP_NEED(SV.lv)){SV.xp-=XP_NEED(SV.lv);SV.lv++;SFX.clear();
  const opened=Object.values(PLACES).filter(p=>p.lv===SV.lv).map(p=>p.name);
  openDialog({name:'산책 레벨 업!',lines:[`산책 레벨 ${SV.lv}이 되었어요!`,opened.length?`새 장소가 열렸어요: ${opened.join(', ')}`:'담이와 더 멀리 걸을 수 있을 것 같아요.']});logDay(`산책 레벨 ${SV.lv} 달성!`);}}
function gainAff(n){SV.aff+=n;while(SV.aff>=AFF_NEED(SV.alv)){SV.aff-=AFF_NEED(SV.alv);SV.alv++;SFX.heart();
  const nt=Object.values(TRICKS).filter(t=>t.lv===SV.alv).map(t=>t.name);
  openDialog({name:'우정 레벨 업!',lines:[`담이와의 우정이 Lv ${SV.alv}이 되었어요!`,nt.length?`새 재주를 배울 수 있어요: '${nt.join(', ')}'`:'담이가 더 잘 따라와요.']});logDay(`담이와 우정 Lv ${SV.alv}!`);}}
const st=()=>SV.today.st;
function addSt(k,v){st()[k]=clamp(st()[k]+v,0,100);}

// ---------- 업데이트 ----------
function update(dt){
  const A=G.area,o=G.pl,d=G.dami;
  SV.today.clock+=dt*MIN_PER_SEC;
  G.fade=Math.max(0,G.fade-dt*2);G.callT=Math.max(0,G.callT-dt);G.callCD=Math.max(0,G.callCD-dt);G.boost=Math.max(0,G.boost-dt);
  if(G.tip){G.tip.t-=dt;G.tip.n+=dt*30;if(G.tip.t<=0)G.tip=null;}
  if(G.toast){G.toast.t-=dt;if(G.toast.t<=0)G.toast=null;}
  // 상태 감소
  addSt('hunger',-dt*.07);addSt('thirst',-dt*(A.outdoor?.11:.06));addSt('mood',-dt*((st().hunger<25||st().thirst<25)?.06:.012));addSt('clean',-dt*(A.outdoor?(SV.today.events.includes('rain')?.12:.05):.01));
  G.lowT-=dt;if(G.lowT<=0){G.lowT=35;if(SV.sick)bubble('dami','끙… 배 아파요…',2,'#3a5a9a');else if(st().thirst<25)bubble('dami','목말라요…',2);else if(st().hunger<25)bubble('dami','배고파요…',2);}
  const cl=SV.today.clock;
  if(cl>18*60)tip('evening','해가 지고 있어요. 집에 가서 저녁밥 → 간식 → 샤워 → 잠자기로 하루를 마무리해요.');
  // 플레이어
  const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+JOY.x,my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+JOY.y;
  const ml=Math.hypot(mx,my);o.moving=ml>.2&&!G.play&&!G.busy;
  if(o.moving){const sp=(A.outdoor?70:58)*Math.min(1,ml);move(o,mx/ml*sp*dt,my/ml*sp*dt);setDir(o,mx,my);o.anim+=dt*7;o.step-=dt;if(o.step<=0){o.step=.3;SFX.step();}}
  updDami(dt);
  if(A.outdoor)leash();
  updNPCs(dt);
  if(G.ball)updBall(dt);
  if(G.play)updPlay(dt);
  if(A.kind==='walk'){updWalk(dt);}
  if(A.outdoor){updBirds(dt);}
  // 출구
  let inExit=null;for(const e of A.exits)if(o.x>e.x&&o.x<e.x+e.w&&o.y>e.y&&o.y<e.y+e.h)inExit=e;
  if(inExit&&!G.exitLock){G.exitLock=true;inExit.act();}else if(!inExit)G.exitLock=false;
  // 상호작용 안내
  G.hint=findInteract();
  // 효과
  for(const p of G.parts){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.g)p.vy+=p.g*dt;}G.parts=G.parts.filter(p=>p.t>0);
  for(const b of G.bubbles)b.t-=dt;G.bubbles=G.bubbles.filter(b=>b.t>0);
  // 카메라
  const tx=A.PW<VW?(A.PW-VW)/2:clamp(o.x-VW/2,0,A.PW-VW),ty=A.PH<VH?(A.PH-VH)/2:clamp(o.y-VH/2,0,A.PH-VH);
  G.cam.x=lerp(G.cam.x,tx,Math.min(1,dt*5));G.cam.y=lerp(G.cam.y,ty,Math.min(1,dt*5));
}
function hearts(x,y,n=3){for(let i=0;i<n;i++)G.parts.push({x:x+R(-5,5),y:y,vx:R(-8,8),vy:R(-24,-14),t:1,heart:true});}

// ---------- 담이 ----------
function updDami(dt){
  const A=G.area,o=G.pl,d=G.dami;d.moving=false;d.pull=0;
  if(G.callT>0&&!['trick','pet','treat','bath'].includes(d.state)){stepTo(d,o.x-(o.dir==='side'?o.face*12:0),o.y+(o.dir==='up'?8:4),150,dt);return;}
  switch(d.state){
    case 'trick':{d.t-=dt;d.dir='down';if(d.t<=0)d.state='idle';return;}
    case 'pet':{d.t-=dt;d.dir='down';if(Math.random()<dt*7)hearts(d.x,d.y-16,1);if(d.t<=0){d.state='idle';}return;}
    case 'treat':{d.t-=dt;if(d.t<=0)d.state='idle';return;}
    case 'bath':return;
    case 'play':return;
    case 'sleep':{d.t-=dt;if(d.t<=0&&SV.today.clock<21*60){d.state='idle';bubble('dami','하암~ 잘 잤다!',1.6);}return;}
    case 'panic':{d.t-=dt;stepTo(d,o.x-o.face*8,o.y+4,110,dt);d.pull=.1;if(d.t<=0)d.state='idle';return;}
    case 'fetch':{const b=G.ball;if(!b){d.state='idle';return;}
      if(b.state==='ground'){if(stepTo(d,b.x,b.y,100,dt)<6){b.state='carried';bubble('dami','멍!',.8);}}
      else if(b.state==='carried'){b.x=d.x+(d.dir==='side'?d.face*8:0);b.y=d.y-4;if(stepTo(d,o.x+(o.face*6),o.y+4,90,dt)<16){G.ball=null;d.state='idle';addSt('mood',8);gainAff(2);hearts(d.x,d.y-16);SFX.heart();bubble('dami','또 던져 줘요!',1.4,'#d94f6a');}}
      d.anim+=dt*10;return;}
    case 'toBowl':{const bw=d.target;const r=stepTo(d,bw.x,bw.y+3,60,dt);if(r<6){d.state='bowl';d.t=2.6;}d.anim+=dt*9;return;}
    case 'bowl':{d.t-=dt;d.dir='side';if(d.t<=0){const bw=d.target;if(bw.use==='feed'){SV.today.bowl.food=0;addSt('hunger',70);addSt('mood',6);gainAff(1);bubble('dami','잘 먹었습니다!',1.6);}else{SV.today.bowl.water=0;addSt('thirst',80);bubble('dami','시원해~',1.4);}refreshBowls();d.state='idle';}return;}
  }
  if(!A.outdoor)indoorAI(dt);else outdoorAI(dt);
  if(d.moving)d.anim+=dt*9;
}
function indoorAI(dt){
  const A=G.area,o=G.pl,d=G.dami;
  if(A.bowlF&&SV.today.bowl.food&&st().hunger<96){d.state='toBowl';d.target=A.bowlF;return;}
  if(A.bowlW&&SV.today.bowl.water&&st().thirst<96){d.state='toBowl';d.target=A.bowlW;return;}
  if(A.cushion&&SV.today.clock>=22*60&&!o.moving){if(stepTo(d,A.cushion.x,A.cushion.y-2,50,dt)<4){d.state='sleep';d.t=999;}return;}
  const dd=dist(d,o);
  if(dd>48){stepTo(d,o.x+10,o.y+6,72,dt);d.wT=1;return;}
  d.wT-=dt;if(d.wT<=0){d.wT=R(2,5);for(let k=0;k<10;k++){const x=o.x+R(-40,40),y=o.y+R(-24,24);if(freeAt(x,y)){d.target={x,y};break;}}}
  if(d.target&&!d.target.use){if(stepTo(d,d.target.x,d.target.y,40,dt)<2)d.target=null;}
  if(!d.moving&&!o.moving){d.idle+=dt;}else d.idle=0;
}
function outdoorAI(dt){
  const A=G.area,o=G.pl,d=G.dami;d.curT-=dt;
  switch(d.state){
    case 'eat':{d.t-=dt;d.pull=.3;const f=d.target;if(!f.alive||Math.hypot(d.x-f.x,d.y-f.y)>12){d.state='idle';if(f.alive)f.ig=2;return;}
      if(d.t<=0){f.alive=false;const n=++SV.today.ate;addSt('hunger',5);SFX.eat();bubble('dami','냠… (몰래 먹었다)',1.5);d.state='idle';
        if(n===4)toast(`주워 먹은 게 ${n}개… 담이 배가 꾸륵꾸륵해요`);else if(n===6)toast('하나만 더 먹으면 내일 배탈 나요! [부르기]로 막아 주세요');else if(n===SICK_AT){toast('주워 먹은 게 7개! 내일 아침 담이 배가 아플 것 같아요…');logDay('길에서 이것저것 너무 많이 주워 먹었다…');}}return;}
    case 'sniff':{d.t-=dt;const s=d.target;if(Math.hypot(d.x-s.x,d.y-s.y)>48){d.state='idle';return;}if(Math.random()<dt*3)G.parts.push({x:d.x+d.face*8,y:d.y-6,vx:R(-4,4),vy:-10,t:.7,note:true});
      if(d.t<=0){s.sniff.done=true;addSt('mood',8);gainAff(1);SFX.sniff();bubble('dami','킁킁… 좋은 냄새♪',1.6,'#3d7a30');d.state='idle';}return;}
    case 'dig':{d.t-=dt;d.dir='side';if(Math.random()<dt*10)G.parts.push({x:d.x+d.face*6,y:d.y,vx:R(-30,30)-d.face*20,vy:R(-40,-20),t:.5,g:120,dirt:true});
      const g0=d.target;if(Math.hypot(d.x-g0.x,d.y-g0.y)>26){d.state='idle';return;}
      if(d.t<=0){g0.found=true;const tid=pick(DIG_TABLE[A.place]||DIG_TABLE.park);const tr=TREASURES[tid];SV.treasure[tid]=(SV.treasure[tid]||0)+1;if(tr.coin)addCoins(tr.coin);gainXP(10);gainAff(1);SFX.clover();
        for(let k=0;k<10;k++)G.parts.push({x:g0.x,y:g0.y-4,vx:R(-30,30),vy:R(-50,-20),t:.8,g:60,spark:true});bubble('dami',`${tr.name} 찾았다!`,2,'#c0602a');logDay(`담이가 땅을 파서 '${tr.name}'을(를) 찾았다!`);SV.today.dug.push(tid);d.state='idle';}return;}
    case 'food':{const f=d.target;if(!f.alive||f.ig>0){d.state='idle';return;}d.pull=.24;d.anim+=dt*6;if(stepTo(d,f.x,f.y+2,66,dt)<6){d.state='eat';d.t=EAT_T;d.tot=EAT_T;}return;}
    case 'toSniff':{const s=d.target;d.pull=.12;d.sT=(d.sT||0)+dt;const r=stepTo(d,s.x,s.y+4,48,dt),near=Math.hypot(d.x-s.x,d.y-s.y);if(r<9||near<28||(d.sT>1.2&&near<46)){d.state='sniff';d.t=2;d.tot=2;d.sT=0;}return;}
    case 'toDig':{const g0=d.target;d.pull=.2;d.sT=(d.sT||0)+dt;const r=stepTo(d,g0.x,g0.y+2,50,dt);if(r<6||(d.sT>1.2&&r<20)){d.state='dig';d.t=2.2;d.tot=2.2;d.sT=0;}return;}
    case 'curious':{d.t-=dt;d.pull=.14;const r=stepTo(d,d.target.x,d.target.y,42,dt);if(d.t<=0||r<4){d.state='idle';d.curT=R(9,14);}return;}
  }
  if(A.kind==='walk'){
    for(const f of A.foods)f.ig=Math.max(0,f.ig-dt);
    let best=null,bd=58;for(const f of A.foods)if(f.alive&&f.ig<=0){const q=Math.hypot(d.x-f.x,d.y-f.y);if(q<bd){bd=q;best=f;}}
    if(best){d.state='food';d.target=best;bubble('dami','킁? 뭐지…!',1.2,'#c0602a');SFX.alert();tip('food','담이가 떨어진 음식을 발견했어요! 담이는 아주 빨라요. 얼른 [부르기]로 "담이야~" 불러 주세요. 하루에 7개 이상 주워 먹으면 다음 날 배탈이 나요!');return;}
    for(const g0 of A.digs)if(!g0.found&&!(g0.ig>0)&&Math.hypot(d.x-g0.x,d.y-g0.y)<52){d.state='toDig';d.target=g0;d.sT=0;bubble('dami','킁킁! 여기 뭔가 있어요!',1.6,'#c0602a');tip('dig','담이가 뭔가 냄새를 맡았어요! 기다려 주면 땅을 파서 보물을 찾아요.');return;}
    for(const s of A.sniffs)if(!s.sniff.done&&!(s.sniff.ig>0)&&Math.hypot(d.x-s.x,d.y-s.y)<42){d.state='toSniff';d.target=s;d.sT=0;return;}
    if(d.curT<=0){const near=A.branches.flatMap(b=>b.pts).filter(([x,y])=>Math.hypot(x-d.x,y-d.y)<90);
      if(near.length&&rnd()<.6){const p=pick(near);d.target={x:p[0],y:p[1]};d.state='curious';d.t=R(2,3);bubble('dami',pick(['저쪽은 뭐지?','가보고 싶다~']),1.2);return;}d.curT=R(6,10);}
    const tx=Math.floor(d.x/T),ty=Math.floor(d.y/T),i=ty*A.W+tx;const off=A.tile[i]===2||A.pd[i]>2;
    if(off){d.offT=(d.offT||0)+dt;if(d.offT>2.5&&!d.offF){d.offF=1;SV.today.off=(SV.today.off||0)+1;}}else{d.offT=0;d.offF=0;}
  }
  const dd=dist(d,o);
  if(dd>20){stepTo(d,o.x+(o.dir==='side'?o.face*-2:7),o.y+(o.dir==='side'?6:2),dd>36?86:72,dt);d.idle=0;}else if(!o.moving)d.idle+=dt;else d.idle=0;
}
function leash(){const o=G.pl,d=G.dami;if(G.play)return;let dx=d.x-o.x,dy=d.y-o.y,dd=Math.hypot(dx,dy);
  if(dd>LEASH){const ex=dd-LEASH;move(o,dx/dd*ex*d.pull,dy/dd*ex*d.pull);dx=d.x-o.x;dy=d.y-o.y;dd=Math.hypot(dx,dy);
    if(dd>LEASH){const e2=dd-LEASH;move(d,-dx/dd*e2,-dy/dd*e2);dx=d.x-o.x;dy=d.y-o.y;dd=Math.hypot(dx,dy);if(dd>LEASH+8){d.x=o.x+dx/dd*(LEASH+4);d.y=o.y+dy/dd*(LEASH+4);}}}
  G.taut=dd>LEASH-3;}
function call(){if(G.callCD>0||G.ov||G.play||G.busy)return;G.callT=.4;G.callCD=.6;SFX.call();const d=G.dami;
  if(d.state==='food'||d.state==='eat'){d.target.ig=7;bubble('dami',pick(['네~ 알겠어요','힝… 안 먹을게!']),1.3);}
  else if(d.state==='curious'){d.curT=R(9,13);bubble('dami','네에~',1);}
  else if(d.state==='sniff'||d.state==='toSniff')d.target.sniff.ig=6;
  else if(d.state==='dig'||d.state==='toDig')d.target.ig=5;
  if(['food','eat','curious','sniff','toSniff','dig','toDig'].includes(d.state))d.state='idle';
  bubble('pl','담이야~ 이리 와!',1);}

// ---------- 공놀이 ----------
function throwBall(){const o=G.pl;const dx=o.dir==='side'?o.face:0,dy=o.dir==='down'?1:o.dir==='up'?-1:0;const sp=G.area.outdoor?70:110;
  G.ball={x:o.x+dx*8,y:o.y-2+dy*6,z:10,vx:dx*sp,vy:dy*sp,vz:50,state:'fly'};G.dami.state='fetch';SFX.call();bubble('pl','가져와~!',1);}
function updBall(dt){const b=G.ball;if(b.state!=='fly')return;b.vz-=180*dt;b.z+=b.vz*dt;const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;
  if(freeAt(nx,b.y,2,1))b.x=nx;else b.vx*=-.5;if(freeAt(b.x,ny,2,1))b.y=ny;else b.vy*=-.5;
  if(b.z<=0){b.z=0;if(Math.abs(b.vz)>20){b.vz=-b.vz*.45;b.vx*=.7;b.vy*=.7;}else{b.vz=0;b.vx*=.9;b.vy*=.9;if(Math.hypot(b.vx,b.vy)<5)b.state='ground';}}}

// ---------- NPC ----------
function updNPCs(dt){const A=G.area,o=G.pl;
  for(const n of A.npcs){const near=Math.hypot(n.x-o.x,n.y-o.y)<44;
    if(n.role==='walker'&&n.route&&!near&&!(G.play&&G.play.w===n)){const p=n.route.line[n.ri];const tx=p[0]*T+8,ty=p[1]*T+4;const r=Math.hypot(tx-n.x,ty-n.y);
      if(r<2){n.ri+=n.rdir;if(n.ri>=n.route.b||n.ri<=n.route.a)n.rdir*=-1;}else{n.x+=(tx-n.x)/r*16*dt;n.y+=(ty-n.y)/r*16*dt;setDir(n,tx-n.x,ty-n.y);n.anim+=dt*6;n.moving=true;}}
    else{n.moving=false;if(near){setDir(n,o.x-n.x,o.y-n.y);}}
    if(n.pup&&!(G.play&&G.play.w===n)){const p=n.pup;p.moving=false;const r=Math.hypot(p.x-n.x,p.y-n.y);if(r>16){stepTo(p,n.x+12,n.y+4,40,dt);p.anim+=dt*9;}}
  }}
function updPlay(dt){const P0=G.play,d=G.dami,p=P0.w.pup;P0.t-=dt;const a=P0.t*3.4;
  d.x=P0.cx+Math.cos(a)*16;d.y=P0.cy+Math.sin(a)*9;setDir(d,-Math.sin(a),Math.cos(a));d.moving=true;d.anim+=dt*10;
  p.x=P0.cx+Math.cos(a+Math.PI)*16;p.y=P0.cy+Math.sin(a+Math.PI)*9;setDir(p,-Math.sin(a+Math.PI),Math.cos(a+Math.PI));p.moving=true;p.anim+=dt*10;
  if(Math.random()<dt*4)hearts(P0.cx,P0.cy-14,1);
  if(P0.t<=0){const n=P0.w,w=n.w;G.play=null;d.state='idle';const isNew=befriend(n,`${w.breed} ${w.dog}랑 신나게 뛰어놀았다.`);
    openDialog({name:w.owner,P:w.P,id:w.id,lines:[`${w.dog}가 담이를 엄청 좋아하네요!`].concat(isNew?[`📖 친구 도감에 '${w.dog}(${w.breed})' 등록!`]:[])});}}
function befriend(n,logText){const w=n.w;n.played=true;const isNew=!SV.friends[w.id];SV.friends[w.id]=(SV.friends[w.id]||0)+1;if(!SV.today.met.includes(w.dog))SV.today.met.push(w.dog);
  addSt('mood',10);gainAff(2);gainXP(8);hearts(G.dami.x,G.dami.y-16);
  for(const q of SV.today.quests)if(q.type==='play'&&q.state==='active'){q.got++;if(q.got>=q.n){q.state='ready';toast('퀘스트 완료! 도윤이에게 알려 주세요');}}
  logDay(logText);return isNew;}
// ---------- 산책길 전용 ----------
function updWalk(dt){const A=G.area,o=G.pl,d=G.dami;
  for(const s of A.sniffs)s.sniff.ig=Math.max(0,s.sniff.ig-dt);for(const g0 of A.digs)g0.ig=Math.max(0,(g0.ig||0)-dt);
  for(const f of A.foods)if(f.alive&&Math.hypot(o.x-f.x,o.y-f.y-2)<12){f.alive=false;SFX.pick();bubble('pl','주워서 쓰레기통에 쏙!',1.3);if(d.target===f)d.state='idle';gainXP(2);}
  for(const it of A.qitems)if(!it.got&&Math.hypot(o.x-it.x,o.y-it.y)<14){it.got=true;SFX.pick();if(it.kitten){SV.today.ev.kitten.state='found';SFX.clover();toast('아기 고양이 나비를 찾았어요! 복순 할머니께 데려다 줘요');logDay('길 잃은 아기 고양이 나비를 찾았다!');bubble('dami','냐옹이 찾았다!',1.6,'#c0602a');continue;}const q=it.q;
    if(q.type==='find'){q.state='ready';toast(`${q.item}을(를) 찾았어요! ${NPCS[q.giver].name}께 가져다 드려요`);logDay(`${q.item}을(를) 찾았다.`);}
    else{q.got++;toast(`${q.item} ${q.got}/${q.n}`);if(q.got>=q.n){q.state='ready';toast(`${q.item} 다 모았어요! 하린 꽃집으로~`);}}}
  for(const dg of A.dogs){
    if(!dg.sleep){dg.wait-=dt;if(dg.wait<=0){const r=Math.hypot(dg.tx-dg.x,dg.ty-dg.y);if(r<2){dg.wait=R(1.5,4);for(let k=0;k<8;k++){const tx=dg.hx+R(-24,24),ty=dg.hy+R(-16,16);const ti=Math.floor(ty/T)*A.W+Math.floor(tx/T);if(freeAt(tx,ty,6,3)&&A.pd[ti]>=2){dg.tx=tx;dg.ty=ty;break;}}}else{const s=Math.min(16*dt,r),ox=dg.x,oy=dg.y;dg.x+=(dg.tx-dg.x)/r*s;dg.y+=(dg.ty-dg.y)/r*s;setDir(dg,dg.x-ox,dg.y-oy);dg.anim+=dt*5;}}}else dg.zz+=dt;
    dg.barkT-=dt;const q=Math.hypot(d.x-dg.x,d.y-dg.y);
    if(q<52&&dg.barkT<=0){dg.barkT=R(3,5);if(!dg.sleep){SFX.woof();bubble(dg,'멍?',1.2,'#6b4a2a');}bubble('dami','…!! (무서워)',1.2,'#3a5a9a');tip('dog','큰 강아지예요. 담이는 겁이 많아서 조금 돌아가 주세요.');}
    if(q<dg.fear&&d.state!=='panic'&&!(d.inv>0)){d.inv=4;SV.today.yelp++;addSt('mood',-12);SFX.yelp();d.state='panic';d.t=1.3;bubble('dami','깨갱!!',1.4,'#d94f6a');tip('hurt','담이가 놀랐어요. 다가가서 [행동] → 쓰담쓰담으로 달래 주세요.');}
  }
  d.inv=Math.max(0,(d.inv||0)-dt);
  for(const it of A.qitems)if(it.kitten&&!it.got&&!it.hinted&&Math.hypot(d.x-it.x,d.y-it.y)<120){it.hinted=1;bubble('dami','킁킁… 고양이 냄새!',1.8,'#c0602a');}
  for(const k of A.ducks){k.t-=dt;if(k.t<=0){k.t=R(2,5);const tx=k.x+R(-30,30),ty=k.y+R(-14,14);if(A.WT[Math.floor(ty)*A.PW+Math.floor(tx)]&&A.WT[Math.floor(ty+5)*A.PW+Math.floor(tx)]){k.tx=tx;k.ty=ty;}}const r=Math.hypot(k.tx-k.x,k.ty-k.y);if(r>1){k.x+=(k.tx-k.x)/r*8*dt;k.y+=(k.ty-k.y)/r*8*dt;k.face=k.tx>k.x?1:-1;}}
}
function updBirds(dt){const A=G.area,o=G.pl,d=G.dami;for(const b of A.birds){if(!b.alive)continue;if(b.fly){b.x+=b.vx*dt;b.y+=b.vy*dt;b.fly+=dt;if(b.fly>3)b.alive=false;continue;}
  b.hop-=dt;if(b.hop<=0){b.hop=R(.6,2);b.x+=R(-4,4);b.face=pick([-1,1]);}
  if(Math.hypot(b.x-d.x,b.y-d.y)<34||Math.hypot(b.x-o.x,b.y-o.y)<26){b.fly=.01;b.vx=R(40,70)*(b.x>d.x?1:-1);b.vy=-R(40,60);SFX.bird();}}}

// ---------- 상호작용 ----------
function findInteract(){const A=G.area,o=G.pl,c=[];
  const reach=(x,y,r)=>Math.hypot(o.x-x,o.y-y)<r;
  for(const n of A.npcs)if(reach(n.x,n.y,24))c.push({d:Math.hypot(o.x-n.x,o.y-n.y),label:n.role==='walker'?`${n.w.owner} & ${n.w.dog}`:n.name+'와 대화',act:()=>talk(n)});
  for(const dr of A.doors)if(reach(dr.x,dr.y,14))c.push({d:0,label:dr.name+' 들어가기',act:()=>{SFX.sel();dr.id==='home'?enterArea('home',null):enterArea('house',{id:dr.id});}});
  for(const ob of A.objs)if(ob.use){const r=ob.kind==='bed'||ob.kind==='tub'?26:20;if(reach(ob.x,ob.y+4,r))c.push({d:Math.hypot(o.x-ob.x,o.y-ob.y)+2,label:USE_LABEL[ob.use],act:()=>useObj(ob)});}
  const fp=typeof netNear==='function'&&netNear();if(fp)c.push({d:fp.d*.4,label:`${fp.p.nick}님에게 인사`,act:()=>openFriendMenu(fp.p)});
  if(G.dami.state!=='sleep'||true)if(reach(G.dami.x,G.dami.y,24))c.push({d:Math.hypot(o.x-G.dami.x,o.y-G.dami.y)+6,label:'담이',act:openDamiMenu});
  c.sort((a,b)=>a.d-b.d);return c[0]||null;}
const USE_LABEL={bed:'잠자기',wardrobe:'옷장 (꾸미기)',toy:'장난감 상자',feed:'밥그릇',water:'물그릇',bath:'샤워하기',board:'축제 게시판',photo:'사진 찍기'};
function interact(){if(G.ov||G.play||G.busy)return;const h=findInteract();if(h){h.act();}}
function refreshBowls(){const A=G.area;if(A.bowlF)A.bowlF.img=buildFurn('bowl',SV.today.bowl.food?1:0);if(A.bowlW)A.bowlW.img=buildFurn('bowl',SV.today.bowl.water?3:2);}
function useObj(ob){const T0=SV.today.todo,cl=SV.today.clock;
  switch(ob.use){
  case 'feed':if(SV.sick){bubble('dami','끙… 배가 아파요…',1.8,'#3a5a9a');openDialog({name:'밥그릇',lines:['담이가 밥 냄새만 맡고 고개를 돌려요… 배가 아픈가 봐요.','어제 길에서 이것저것 주워 먹어서 그런 것 같아요.','마을 위쪽 「콩닥 동물병원」에 가서 진료를 받아요. (진료비 🦴 '+VET_FEE+')']});return;}
    if(SV.today.bowl.food){toast('밥그릇에 이미 밥이 있어요');return;}if(SV.kibble<=0){openDialog({name:'밥그릇',lines:['사료가 다 떨어졌어요!','마을 펫샵에서 사료를 사 와요.']});return;}
    SV.kibble--;SV.today.bowl.food=1;refreshBowls();SFX.pick();bubble('pl','담이야 밥 먹자~',1.2);
    if(cl<15*60){if(!T0.feed1){T0.feed1=1;logDay('아침밥을 챙겨 줬다.');}}else if(!T0.feed2){T0.feed2=1;logDay('저녁밥을 맛있게 먹었다.');}gainAff(1);break;
  case 'water':SV.today.bowl.water=1;refreshBowls();SFX.pick();if(!T0.water){T0.water=1;}bubble('pl','시원한 물 갈아 줄게~',1.2);break;
  case 'toy':openMenu({title:'장난감 상자',items:[{label:'공 던지기',fn:()=>{closeOv();throwBall();}},{label:'닫기',fn:closeOv}]});break;
  case 'wardrobe':openWardrobe();break;
  case 'bed':goSleep();break;
  case 'bath':openBath();break;
  case 'board':{const dd=FESTIVAL_DAY-SV.day;openDialog({name:'축제 게시판',lines:[dd>0?`🎉 마을 강아지 축제까지 D-${dd}!`:dd===0?'🎉 오늘은 마을 강아지 축제 날! 저녁에 자기 전에 열려요.':'축제는 끝났어요. 내년에 또 만나요!','장기자랑 점수: 배운 재주 · 친구 강아지 · 꾸미기 · 우정 레벨','담이랑 매일 조금씩 연습해 봐요!']});break;}
  case 'photo':{const q=ob.q;if(q.state==='active'){q.state='ready';SFX.clover();G.fade=.8;toast('찰칵! 사진을 찍었어요. 이장님께 가져가요');logDay(`${PLACES[G.area.place].name}에서 담이와 사진을 찍었다.`);}else toast('이미 사진을 찍었어요');break;}
  }}

// ---------- 담이 메뉴 (돌봄·훈련) ----------
function openDamiMenu(){const d=G.dami;if(d.state==='sleep'&&SV.today.clock>=21*60){bubble('dami','쿨쿨…',1);return;}
  const items=[{label:'쓰담쓰담',fn:()=>{closeOv();doPet();}},{label:`간식 주기`,right:`${SV.treats}개`,dis:SV.treats<=0,fn:()=>{closeOv();doTreat();}}];
  for(const [k,t] of Object.entries(TRICKS)){if(t.lv<=SV.alv)items.push({label:`'${t.name}'`,right:`${Math.round(Math.min(.97,SV.skill[k]+(G.boost>0?.2:0))*100)}%`,fn:()=>{closeOv();doTrick(k);}});else items.push({label:`??? (우정 Lv${t.lv})`,dis:true,fn:()=>{}});}
  items.push({label:'공 던지기',fn:()=>{closeOv();throwBall();}});
  if(G.area.kind==='walk')items.push({label:'원반 놀이 (미니게임)',right:SV.frisbee?'':'원반 필요',dis:!SV.frisbee,fn:()=>{closeOv();startFrisbee(false);}});
  items.push({label:'닫기',fn:closeOv});
  openMenu({title:'담이랑 뭐 할까?',items,dami:true});}
function doPet(){const d=G.dami;d.state='pet';d.t=1.5;SFX.pet();addSt('mood',12);gainAff(1);bubble('dami',pick(['헤헤 좋아♪','더 해줘요~','행복해!']),1.4,'#d94f6a');}
function doTreat(){if(SV.treats<=0)return;if(SV.sick){bubble('dami','끙… 지금은 못 먹겠어요',1.6,'#3a5a9a');return;}SV.treats--;const d=G.dami;d.state='treat';d.t=1.3;d.dir='side';SFX.eat();addSt('mood',12);addSt('hunger',5);gainAff(2);G.boost=60;bubble('dami','간식이다!! 최고!',1.4,'#d94f6a');hearts(d.x,d.y-16);
  if(SV.today.clock>=16*60&&!SV.today.todo.treat){SV.today.todo.treat=1;logDay('간식 타임! 담이가 꼬리를 엄청 흔들었다.');}
  tip('treat','간식을 먹으면 잠깐 동안 재주 성공률이 올라가요!');}
function doTrick(k){const d=G.dami,t=TRICKS[k];const p=Math.min(.97,SV.skill[k]+(G.boost>0?.2:0));const ok=rnd()<p;
  d.state='trick';d.trick=k;d.ok=ok;d.t=2.4;d.dir='down';bubble('pl',`담이야, ${t.name}!`,1);
  setTimeout(()=>{if(!G)return;if(ok){SV.skill[k]=Math.min(.97,SV.skill[k]+.05);gainAff(1);gainXP(3);addSt('mood',4);SFX.heart();bubble('dami','멍!',1,'#c0602a');hearts(d.x,d.y-18,4);if(!SV.today.todo.trick){SV.today.todo.trick=1;logDay(`'${t.name}' 성공! 칭찬을 듬뿍 해 줬다.`);}
      const coach=G.area.npcs.find(n=>n.id==='coach');if(coach)for(const q of SV.today.quests)if(q.type==='trick'&&q.trick===k&&q.state==='active'){q.state='ready';setTimeout(()=>talk(coach),900);}}
    else{SV.skill[k]=Math.min(.97,SV.skill[k]+.02);bubble('dami','…? (갸웃)',1.4);}},650);}

// ---------- 대화·퀘스트 ----------
function talk(n){SFX.sel();
  if(n.role==='walker'){walkerTalk(n);return;}
  if(n.role==='host'){if(SV.today.ev.frisbeeDone){openDialog({name:n.name,P:n.P,id:'host',lines:['참가해 줘서 고마워요! 담이 점프 최고였어요.']});return;}
    openDialog({name:n.name,P:n.P,id:'host',lines:['호수 공원 원반 대회에 오신 걸 환영해요!','다섯 번 던져서 30점 넘으면 상품이 있어요. 참가할래요?'],choices:['참가할래요!','다음에요'],cb:i=>{if(i===0)startFrisbee(true);}});return;}
  if(n.role==='merchant'){openDialog({name:n.name,P:n.P,id:'merchant',lines:['어이쿠, 귀여운 손님이네. 먼 데서 온 귀한 물건들이야. 구경해 봐!'],cb:()=>openShop(true)});return;}
  if(n.role==='recv'){const q=n.q;if(q.state==='active'){q.state='ready';SFX.clover();logDay(`${q.to}께 빵 바구니를 배달했다.`);openDialog({name:q.to,P:n.P,id:'recv',lines:['어머, 몽글 빵집 빵이네요! 고마워요.','담이도 착하게 기다렸구나~']});}else openDialog({name:q.to,P:n.P,id:'recv',lines:['빵 정말 맛있어요!']});return;}
  const id=n.id,def=NPCS[id];const qs=SV.today.quests.filter(q=>q.giver===id);
  const ev=SV.today.ev,E=SV.today.events;
  if(id==='grandma'&&ev.kitten&&ev.kitten.state==='found'){ev.kitten.state='done';addCoins(50);gainXP(30);gainAff(2);SFX.clear();logDay('나비를 할머니께 데려다 드렸다. 할머니가 눈물을 글썽이셨다.');
    openDialog({name:def.name,P:def.P,id,lines:['나비야! 아이고 우리 나비…! 어디 갔었니.','담이야, 정말 고맙다. 이건 할머니 마음이야.','🦴 50뼈다귀 · 경험치 +30']});return;}
  if(id==='grandma'&&ev.kitten&&ev.kitten.state==='lost'){openDialog({name:def.name,P:def.P,id,lines:['우리 나비가 아침부터 안 보이는구나…','고양이는 멀리 안 간다던데, 바깥 구역 어딘가 수풀에 숨어 있을 거야. 담이 코로 찾아 주렴.']});return;}
  if(id==='kid'&&E.includes('bday')&&!ev.bday){openDialog({name:def.name,P:def.P,id,lines:['오늘 내 생일이다! 담이도 축하해 주러 왔어?'],choices:[`간식 선물하기 (간식 ${SV.treats}개)`,'나중에 올게'],cb:i=>{if(i!==0)return;
      if(SV.treats<=0){openDialog({name:def.name,P:def.P,id,lines:['간식이 없구나… 괜찮아! 와 준 것만으로도 좋아!']});return;}
      SV.treats--;ev.bday=1;SV.acc.crown=1;addCoins(20);gainAff(2);gainXP(20);SFX.clear();hearts(G.dami.x,G.dami.y-16,6);logDay('도윤이 생일 파티에 갔다. 담이가 생일 왕관을 받았다!');
      openDialog({name:def.name,P:def.P,id,lines:['우와! 담이 선물이다! 고마워!','이거 담이 왕관! 생일 파티 기념이야. 같이 케이크 냄새 맡자~','👑 생일 왕관 · 🦴 20뼈다귀']});}});return;}

  const ready=qs.find(q=>q.state==='ready'),fresh=qs.find(q=>q.state==='new'),act=qs.find(q=>q.state==='active');
  if(ready){finishQuest(ready,n);return;}
  if(fresh){openDialog({name:def.name,P:def.P,id,lines:fresh.ask,choices:['좋아요, 맡겨 주세요!','다음에요'],cb:i=>{if(i===0){fresh.state='active';SFX.sel();toast(`퀘스트 수락: ${fresh.title}`);tip('quest','받은 퀘스트는 [할 일]에서 볼 수 있어요. 장소가 있는 퀘스트는 산책 지도에 ! 표시가 떠요.');}}});return;}
  if(act){openDialog({name:def.name,P:def.P,id,lines:[act.type==='trick'?`담이에게 다가가 [행동]으로 '${TRICKS[act.trick].name}'를 시켜 보세요!`:`${act.title}, 부탁할게~`+(act.place&&act.place!=='town'?` (${PLACES[act.place].name})`:'')]});return;}
  if(id==='vet'){vetTalk(def);return;}
  if(def.shop){openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle)],cb:()=>openShop()});return;}
  if(id==='coach'){openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle),'어질리티 코스 한번 달려 볼래요? 빠를수록 상금이 커요!'],choices:['달려 볼래요!','다음에요'],cb:i=>{if(i===0)startAgility();}});return;}
  openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle)]});}
function vetTalk(def){const id='vet';
  if(!SV.sick){openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle),'(담이 건강 상태: 아주 좋아요! 산책할 때 주워 먹는 것만 조심해요)']});return;}
  openDialog({name:def.name,P:def.P,id,lines:['어디 보자… 배가 빵빵하고 꾸륵꾸륵하네요.','산책길에서 이것저것 주워 먹어서 배탈이 났어요. 약 먹고 하루 쉬면 괜찮아요.',`진료비는 🦴 ${VET_FEE}뼈다귀예요. 치료할까요?`],choices:[`치료할게요 (🦴 ${VET_FEE})`,'조금 있다 올게요'],cb:i=>{if(i!==0)return;
    const short=SV.coins<VET_FEE;SV.coins=Math.max(0,SV.coins-VET_FEE);SV.sick=0;addSt('mood',15);gainAff(1);SFX.clear();hearts(G.dami.x,G.dami.y-16,5);G.dami.sparkle=4;logDay('콩닥 동물병원에서 배탈 치료를 받았다. 이제 밥을 먹을 수 있다!');save();
    openDialog({name:def.name,P:def.P,id,lines:[short?'뼈다귀가 조금 모자라네요… 괜찮아요, 담이 얼른 낫는 게 먼저죠!':'치료 끝! 담이 잘 참았어요.','이제 밥 먹어도 돼요. 집에 가서 밥그릇을 채워 주세요.','산책할 때 담이가 바닥 냄새를 맡으면 얼른 [부르기]로 불러 주세요!']});}});}
function finishQuest(q,n){const def=NPCS[q.giver];q.state='done';SV.today.todo.quest++;addCoins(q.reward);SFX.clear();
  let extra='';if(q.bonusTreat){SV.treats+=q.bonusTreat;extra=` · 간식 +${q.bonusTreat}`;}if(q.acc&&!SV.acc[q.acc]){SV.acc[q.acc]=1;extra+=` · ${ACCS[q.acc].name}`;}
  logDay(`${def.name}의 부탁 '${q.title}'을(를) 해결했다.`);
  openDialog({name:def.name,P:def.P,id:q.giver,lines:[...q.thanks,`🦴 ${q.reward}뼈다귀 · 경험치 +${q.xp}${extra}`]});gainXP(q.xp);gainAff(1);save();}
function startPlay(n){const o=G.pl;G.busy=0;G.play={w:n,t:4,cx:(o.x+n.x)/2,cy:(o.y+n.y)/2+10};G.dami.state='play';SFX.heart();bubble('dami','같이 놀자~!',1.4,'#d94f6a');bubble(n,'와아~',1.2);tip('play','친구 강아지랑 놀면 기분과 우정이 쑥쑥 올라요!');}

// ---------- 샤워·잠 ----------
function bathDone(){const T0=SV.today.todo;addSt('clean',100);addSt('mood',10);gainAff(2);if(!T0.bath){T0.bath=1;logDay('보송보송 샤워 완료! 담이에게서 좋은 냄새가 났다.');}G.dami.state='idle';G.dami.sparkle=8;}
function goSleep(){const T0=SV.today.todo;const miss=[];if(!T0.feed2)miss.push('저녁밥');if(!T0.treat)miss.push('간식 타임');if(!T0.bath)miss.push('샤워');
  if(SV.today.clock<17*60){openDialog({name:'침대',lines:['아직 해가 쨍쨍해요. 담이랑 더 놀다 와요!'],choices:['그래도 잘래요','더 놀래요'],cb:i=>{if(i===0)sleepNow();}});return;}
  if(miss.length){openDialog({name:'침대',lines:[`아직 ${miss.join(', ')}을(를) 안 했어요.`,'담이가 기다리고 있는 것 같아요.'],choices:['그래도 잘래요','마저 할게요'],cb:i=>{if(i===0)sleepNow();}});return;}
  openDialog({name:'침대',lines:['오늘 하루도 고생했어요. 담이야 잘 자~'],choices:['잘 자요','조금 더 놀래요'],cb:i=>{if(i===0)sleepNow();}});}
function endDay(){const Td=SV.today;const done=Object.values(Td.todo).filter(v=>v).length;SV.stickers+=done;
  G.diary={day:SV.day,season:season(),log:Td.log.slice(),todo:Object.assign({},Td.todo),earned:Td.earned,met:Td.met.slice(),dug:Td.dug.slice(),ate:Td.ate,yelp:Td.yelp,festival:SV.day===FESTIVAL_DAY&&!SV.festival};
  if(G.diary.festival){SV.festival=true;const sc=festivalScore();G.diary.fest=sc;addCoins(100);}
  if(Td.ate>=SICK_AT){SV.sick=1;G.diary.sick=1;}
  SFX.clear();musicOn=false;scene='diary';sceneT=0;SV.day++;newToday();save(true);}
function festivalScore(){const tricks=Object.values(TRICKS).filter(t=>t.lv<=SV.alv).length,fr=Object.keys(SV.friends).length,acc=Object.keys(SV.acc).length;return{tricks,fr,acc,alv:SV.alv,total:tricks*20+fr*10+acc*8+SV.alv*10};}

// ---------- 산책객 만남: 대사도 매번 다르고, 할 일을 고를 수 있음 ----------
function walkerTalk(n){const w=n.w,met=SV.friends[w.id]||0,c=SV.today.clock;
  const lines=[met?pick(w.again):w.first[0]];
  const situ=SV.today.events.includes('rain')?SITU.rain:c<10*60?SITU.morning:c>=18*60?SITU.evening:null;if(situ&&rnd()<.6)lines.push(pick(situ));
  if(n.played){lines.push(pick(w.chat));openDialog({name:w.owner,P:w.P,id:w.id,lines});return;}
  const acts=MEET_ACTS.slice().sort(()=>rnd()-.5).slice(0,3);lines.push(`${w.dog}랑 뭐 할까요?`);
  openDialog({name:w.owner,P:w.P,id:w.id,lines,choices:[...acts.map(a=>a.label),'다음에요'],cb:i=>{const a=acts[i];if(a)doMeet(n,a.id);}});}
function doMeet(n,id){const w=n.w,dlg=(L)=>openDialog({name:w.owner,P:w.P,id:w.id,lines:L});
  const reg=isNew=>isNew?[`📖 친구 도감에 '${w.dog}(${w.breed})' 등록!`]:[];
  if(id==='play'){startPlay(n);return;}
  if(id==='treat'){let L;if(SV.treats>0){SV.treats--;L=[`${w.dog}랑 담이가 간식을 사이좋게 나눠 먹었어요.`,`${w.owner}: 담이 매너 최고네요!`];}else{SV.treats++;L=['간식이 없어요? 괜찮아요, 우리 거 하나 줄게요!','🦴 간식 +1'];}
    SFX.eat();G.dami.state='treat';G.dami.t=1.2;dlg(L.concat(reg(befriend(n,`${w.dog}랑 간식을 나눠 먹었다.`))));return;}
  if(id==='photo'){G.fade=.9;SFX.clover();SV.photos=(SV.photos||0)+1;dlg([`찰칵! 담이랑 ${w.dog} 투샷 완성!`,`${w.owner}: 사진 보내 줄게요~ 너무 잘 나왔다!`].concat(reg(befriend(n,`${w.dog}랑 사진을 찍었다.`))));return;}
  if(id==='chat'){const L=[pick(w.chat)];const dg=(G.area.digs||[]).find(g=>!g.found&&!g.revealed);if(dg){dg.revealed=true;L.push(w.hint,'(지도와 미니맵에 반짝이로 표시됐어요)');}
    dlg(L.concat(reg(befriend(n,`${w.owner}님이랑 수다를 떨었다.`))));return;}
  if(id==='trick'){const ks=Object.keys(TRICKS).filter(k=>TRICKS[k].lv<=SV.alv),k=pick(ks);G.busy=1;doTrick(k);
    setTimeout(()=>{if(!G)return;G.busy=0;const ok=G.dami.ok;if(ok)addCoins(5);dlg((ok?[`우와, ${TRICKS[k].name}! 담이 천재다!`,`${w.dog}도 배워야겠다~ (🦴 +5)`]:['괜찮아요, 연습하면 돼요!',`${w.dog}도 처음엔 못 했어요.`]).concat(reg(befriend(n,`${w.owner}님 앞에서 '${TRICKS[k].name}' 재주를 보여 줬다.`))));},2700);return;}
}
