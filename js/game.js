"use strict";
// ===== 게임 진행: 이동 · 담이 행동 · 상호작용 · 퀘스트 · 하루 루틴 =====
let G=null,scene='title',sceneT=0;
const LEASH=50,MIN_PER_SEC=1/0.8;

function newGameState(){G={area:null,pl:{x:0,y:0,dir:'down',face:1,anim:0,moving:false,step:0},dami:{x:0,y:0,dir:'down',face:1,anim:0,state:'idle',t:0,moving:false,pull:0,curT:8,wT:2,idle:0},
  cam:{x:0,y:0},bubbles:[],parts:[],ov:null,tip:null,fade:1,ball:null,play:null,callT:0,callCD:0,boost:0,hint:null,exitLock:true,lowT:20,toast:null};}

// ---------- 지역 이동 ----------
function enterArea(kind,arg){
  let A;
  if(kind==='home')A=genRoom('home');else if(kind==='house')A=genRoom(arg.id);else if(kind==='town')A=genTown();else A=genWalk(arg.place);
  G.area=A;const sp=(arg&&arg.x!==undefined)?arg:A.spawn;G.pl.x=sp.x;G.pl.y=sp.y;G.pl.dir=kind==='town'?'down':'up';
  const d=G.dami;d.x=G.pl.x+(kind==='walk'?16:10);d.y=G.pl.y+4;d.state='idle';G.ball=null;G.play=null;
  if(arg&&arg.wake&&A.cushion){d.x=A.cushion.x;d.y=A.cushion.y-2;d.state='sleep';d.t=2;}
  G.bubbles=[];G.parts=[];G.fade=1;G.exitLock=true;
  G.cam.x=clamp(G.pl.x-VW/2,Math.min(0,(A.PW-VW)/2),Math.max(0,A.PW-VW));G.cam.y=clamp(G.pl.y-VH/2,Math.min(0,(A.PH-VH)/2),Math.max(0,A.PH-VH));
  SV.today.where=kind==='walk'?'town':kind==='house'?'town':kind;save();
  if(kind==='walk')tip('walk','산책 중엔 담이가 리드줄로 연결돼요. 떨어진 음식을 먹으려 하면 [부르기]로 불러 주세요!');
  if(kind==='town')tip('town','마을이에요! 집 문 앞에서 [행동]으로 들어가고, 오른쪽 끝 길로 나가면 산책 지도가 열려요.');
}
function finishWalk(){const T0=SV.today.todo;if(!T0.walk){T0.walk=1;addCoins(15);gainXP(20);logDay(`${PLACES[G.area.place].name} 산책 코스를 끝까지 걸었다.`);toast('산책 코스 완주! +15코인');}openMap(true);}
function travel(place){SV.today.clock+=15;if(place==='town')enterArea('town',{x:(43)*T,y:17.4*T});else enterArea('walk',{place});}

// ---------- 충돌 ----------
function solidPx(x,y){const A=G.area,tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||ty<0||tx>=A.W||ty>=A.H)return true;return A.solid[ty*A.W+tx]===1;}
function freeAt(x,y,hw=4,hh=2){return !solidPx(x-hw,y-hh)&&!solidPx(x+hw,y-hh)&&!solidPx(x-hw,y+hh)&&!solidPx(x+hw,y+hh);}
function move(e,dx,dy){if(freeAt(e.x+dx,e.y))e.x+=dx;if(freeAt(e.x,e.y+dy))e.y+=dy;}
function setDir(e,dx,dy){if(Math.abs(dx)>Math.abs(dy)*1.1){e.dir='side';e.face=dx>0?1:-1;}else if(Math.abs(dy)>.01)e.dir=dy>0?'down':'up';}
function stepTo(e,tx,ty,spd,dt){const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<1)return 0;const s=Math.min(spd*dt,d);move(e,dx/d*s,dy/d*s);setDir(e,dx,dy);e.moving=true;return d;}
function bubble(who,text,t=1.5,col='#4a3426'){G.bubbles=G.bubbles.filter(b=>b.who!==who);G.bubbles.push({who,text,t,col,max:t});}
function tip(id,text){if(SV.tips[id])return;SV.tips[id]=1;G.tip={text,t:6,n:0};}
function toast(s){G.toast={s,t:2.6};}

// ---------- 성장 ----------
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
  addSt('hunger',-dt*.07);addSt('thirst',-dt*(A.outdoor?.11:.06));addSt('mood',-dt*((st().hunger<25||st().thirst<25)?.06:.012));addSt('clean',-dt*(A.outdoor?.05:.01));
  G.lowT-=dt;if(G.lowT<=0){G.lowT=35;if(st().thirst<25)bubble('dami','목말라요…',2);else if(st().hunger<25)bubble('dami','배고파요…',2);}
  const cl=SV.today.clock;
  if(cl>18*60)tip('evening','해가 지고 있어요. 집에 가서 저녁밥 → 간식 → 샤워 → 잠자기로 하루를 마무리해요.');
  // 플레이어
  const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+JOY.x,my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+JOY.y;
  const ml=Math.hypot(mx,my);o.moving=ml>.2&&!G.play;
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
      if(d.t<=0){f.alive=false;SV.today.ate++;addSt('hunger',5);SFX.eat();bubble('dami','냠… (몰래 먹었다)',1.5);d.state='idle';}return;}
    case 'sniff':{d.t-=dt;const s=d.target;if(Math.hypot(d.x-s.x,d.y-s.y)>16){d.state='idle';return;}if(Math.random()<dt*3)G.parts.push({x:d.x+d.face*8,y:d.y-6,vx:R(-4,4),vy:-10,t:.7,note:true});
      if(d.t<=0){s.sniff.done=true;addSt('mood',8);gainAff(1);SFX.sniff();bubble('dami','킁킁… 좋은 냄새♪',1.6,'#3d7a30');d.state='idle';}return;}
    case 'dig':{d.t-=dt;d.dir='side';if(Math.random()<dt*10)G.parts.push({x:d.x+d.face*6,y:d.y,vx:R(-30,30)-d.face*20,vy:R(-40,-20),t:.5,g:120,dirt:true});
      const g0=d.target;if(Math.hypot(d.x-g0.x,d.y-g0.y)>14){d.state='idle';return;}
      if(d.t<=0){g0.found=true;const tid=pick(DIG_TABLE[A.place]||DIG_TABLE.park);const tr=TREASURES[tid];SV.treasure[tid]=(SV.treasure[tid]||0)+1;if(tr.coin)addCoins(tr.coin);gainXP(10);gainAff(1);SFX.clover();
        for(let k=0;k<10;k++)G.parts.push({x:g0.x,y:g0.y-4,vx:R(-30,30),vy:R(-50,-20),t:.8,g:60,spark:true});bubble('dami',`${tr.name} 찾았다!`,2,'#c0602a');logDay(`담이가 땅을 파서 '${tr.name}'을(를) 찾았다!`);SV.today.dug.push(tid);d.state='idle';}return;}
    case 'food':{const f=d.target;if(!f.alive||f.ig>0){d.state='idle';return;}d.pull=.16;if(stepTo(d,f.x,f.y+2,38,dt)<6){d.state='eat';d.t=2.6;}return;}
    case 'toSniff':{const s=d.target;d.pull=.12;if(stepTo(d,s.x,s.y+4,48,dt)<9){d.state='sniff';d.t=2;}return;}
    case 'toDig':{const g0=d.target;d.pull=.2;if(stepTo(d,g0.x,g0.y+2,50,dt)<6){d.state='dig';d.t=2.2;}return;}
    case 'curious':{d.t-=dt;d.pull=.14;const r=stepTo(d,d.target.x,d.target.y,42,dt);if(d.t<=0||r<4){d.state='idle';d.curT=R(9,14);}return;}
  }
  if(A.kind==='walk'){
    for(const f of A.foods)f.ig=Math.max(0,f.ig-dt);
    let best=null,bd=44;for(const f of A.foods)if(f.alive&&f.ig<=0){const q=Math.hypot(d.x-f.x,d.y-f.y);if(q<bd){bd=q;best=f;}}
    if(best){d.state='food';d.target=best;bubble('dami','킁? 뭐지…!',1.2,'#c0602a');SFX.alert();tip('food','담이가 떨어진 음식을 발견했어요! [부르기]로 "담이야~" 불러 주세요.');return;}
    for(const g0 of A.digs)if(!g0.found&&!(g0.ig>0)&&Math.hypot(d.x-g0.x,d.y-g0.y)<52){d.state='toDig';d.target=g0;bubble('dami','킁킁! 여기 뭔가 있어요!',1.6,'#c0602a');tip('dig','담이가 뭔가 냄새를 맡았어요! 기다려 주면 땅을 파서 보물을 찾아요.');return;}
    for(const s of A.sniffs)if(!s.sniff.done&&!(s.sniff.ig>0)&&Math.hypot(d.x-s.x,d.y-s.y)<42){d.state='toSniff';d.target=s;return;}
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
function call(){if(G.callCD>0||G.ov)return;G.callT=.4;G.callCD=.6;SFX.call();const d=G.dami;
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
    if(n.role==='walker'&&n.route&&!near&&!(G.play&&G.play.w===n)){const p=A.line[n.ri];const tx=p[0]*T+8,ty=p[1]*T+4;const r=Math.hypot(tx-n.x,ty-n.y);
      if(r<2){n.ri+=n.rdir;if(n.ri>=n.route.b||n.ri<=n.route.a)n.rdir*=-1;}else{n.x+=(tx-n.x)/r*16*dt;n.y+=(ty-n.y)/r*16*dt;setDir(n,tx-n.x,ty-n.y);n.anim+=dt*6;n.moving=true;}}
    else{n.moving=false;if(near){setDir(n,o.x-n.x,o.y-n.y);}}
    if(n.pup&&!(G.play&&G.play.w===n)){const p=n.pup;p.moving=false;const r=Math.hypot(p.x-n.x,p.y-n.y);if(r>16){stepTo(p,n.x+12,n.y+4,40,dt);p.anim+=dt*9;}}
  }}
function updPlay(dt){const P0=G.play,d=G.dami,p=P0.w.pup;P0.t-=dt;const a=P0.t*3.4;
  d.x=P0.cx+Math.cos(a)*16;d.y=P0.cy+Math.sin(a)*9;setDir(d,-Math.sin(a),Math.cos(a));d.moving=true;d.anim+=dt*10;
  p.x=P0.cx+Math.cos(a+Math.PI)*16;p.y=P0.cy+Math.sin(a+Math.PI)*9;setDir(p,-Math.sin(a+Math.PI),Math.cos(a+Math.PI));p.moving=true;p.anim+=dt*10;
  if(Math.random()<dt*4)hearts(P0.cx,P0.cy-14,1);
  if(P0.t<=0){const w=P0.w.w;G.play=null;d.state='idle';P0.w.played=true;addSt('mood',15);gainAff(2);gainXP(8);
    const isNew=!SV.friends[w.id];SV.friends[w.id]=(SV.friends[w.id]||0)+1;if(!SV.today.met.includes(w.dog))SV.today.met.push(w.dog);
    for(const q of SV.today.quests)if(q.type==='play'&&q.state==='active'){q.got++;if(q.got>=q.n){q.state='ready';toast('퀘스트 완료! 도윤이에게 알려 주세요');}}
    logDay(`${w.breed} ${w.dog}랑 신나게 놀았다.`);
    openDialog({name:w.owner,P:w.P,id:w.id,lines:[`${w.dog}가 담이를 엄청 좋아하네요!`,isNew?`📖 친구 도감에 '${w.dog}(${w.breed})'가 등록됐어요!`:'또 같이 놀아요~']});}}

// ---------- 산책길 전용 ----------
function updWalk(dt){const A=G.area,o=G.pl,d=G.dami;
  for(const s of A.sniffs)s.sniff.ig=Math.max(0,s.sniff.ig-dt);for(const g0 of A.digs)g0.ig=Math.max(0,(g0.ig||0)-dt);
  for(const f of A.foods)if(f.alive&&Math.hypot(o.x-f.x,o.y-f.y-2)<12){f.alive=false;SFX.pick();bubble('pl','주워서 쓰레기통에 쏙!',1.3);if(d.target===f)d.state='idle';gainXP(2);}
  for(const it of A.qitems)if(!it.got&&Math.hypot(o.x-it.x,o.y-it.y)<14){it.got=true;SFX.pick();const q=it.q;
    if(q.type==='find'){q.state='ready';toast(`${q.item}을(를) 찾았어요! ${NPCS[q.giver].name}께 가져다 드려요`);logDay(`${q.item}을(를) 찾았다.`);}
    else{q.got++;toast(`${q.item} ${q.got}/${q.n}`);if(q.got>=q.n){q.state='ready';toast(`${q.item} 다 모았어요! 하린 꽃집으로~`);}}}
  for(const dg of A.dogs){
    if(!dg.sleep){dg.wait-=dt;if(dg.wait<=0){const r=Math.hypot(dg.tx-dg.x,dg.ty-dg.y);if(r<2){dg.wait=R(1.5,4);for(let k=0;k<8;k++){const tx=dg.hx+R(-24,24),ty=dg.hy+R(-16,16);const ti=Math.floor(ty/T)*A.W+Math.floor(tx/T);if(freeAt(tx,ty,6,3)&&A.pd[ti]>=2){dg.tx=tx;dg.ty=ty;break;}}}else{const s=Math.min(16*dt,r),ox=dg.x,oy=dg.y;dg.x+=(dg.tx-dg.x)/r*s;dg.y+=(dg.ty-dg.y)/r*s;setDir(dg,dg.x-ox,dg.y-oy);dg.anim+=dt*5;}}}else dg.zz+=dt;
    dg.barkT-=dt;const q=Math.hypot(d.x-dg.x,d.y-dg.y);
    if(q<52&&dg.barkT<=0){dg.barkT=R(3,5);if(!dg.sleep){SFX.woof();bubble(dg,'멍?',1.2,'#6b4a2a');}bubble('dami','…!! (무서워)',1.2,'#3a5a9a');tip('dog','큰 강아지예요. 담이는 겁이 많아서 조금 돌아가 주세요.');}
    if(q<dg.fear&&d.state!=='panic'&&!(d.inv>0)){d.inv=4;SV.today.yelp++;addSt('mood',-12);SFX.yelp();d.state='panic';d.t=1.3;bubble('dami','깨갱!!',1.4,'#d94f6a');tip('hurt','담이가 놀랐어요. 다가가서 [행동] → 쓰담쓰담으로 달래 주세요.');}
  }
  d.inv=Math.max(0,(d.inv||0)-dt);
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
  if(G.dami.state!=='sleep'||true)if(reach(G.dami.x,G.dami.y,24))c.push({d:Math.hypot(o.x-G.dami.x,o.y-G.dami.y)+6,label:'담이',act:openDamiMenu});
  c.sort((a,b)=>a.d-b.d);return c[0]||null;}
const USE_LABEL={bed:'잠자기',wardrobe:'옷장 (꾸미기)',toy:'장난감 상자',feed:'밥그릇',water:'물그릇',bath:'샤워하기',board:'축제 게시판',photo:'사진 찍기'};
function interact(){if(G.ov)return;const h=findInteract();if(h){h.act();}}
function refreshBowls(){const A=G.area;if(A.bowlF)A.bowlF.img=buildFurn('bowl',SV.today.bowl.food?1:0);if(A.bowlW)A.bowlW.img=buildFurn('bowl',SV.today.bowl.water?3:2);}
function useObj(ob){const T0=SV.today.todo,cl=SV.today.clock;
  switch(ob.use){
  case 'feed':if(SV.today.bowl.food){toast('밥그릇에 이미 밥이 있어요');return;}if(SV.kibble<=0){openDialog({name:'밥그릇',lines:['사료가 다 떨어졌어요!','마을 펫샵에서 사료를 사 와요.']});return;}
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
  items.push({label:'닫기',fn:closeOv});
  openMenu({title:'담이랑 뭐 할까?',items,dami:true});}
function doPet(){const d=G.dami;d.state='pet';d.t=1.5;SFX.pet();addSt('mood',12);gainAff(1);bubble('dami',pick(['헤헤 좋아♪','더 해줘요~','행복해!']),1.4,'#d94f6a');}
function doTreat(){if(SV.treats<=0)return;SV.treats--;const d=G.dami;d.state='treat';d.t=1.3;d.dir='side';SFX.eat();addSt('mood',12);addSt('hunger',5);gainAff(2);G.boost=60;bubble('dami','간식이다!! 최고!',1.4,'#d94f6a');hearts(d.x,d.y-16);
  if(SV.today.clock>=16*60&&!SV.today.todo.treat){SV.today.todo.treat=1;logDay('간식 타임! 담이가 꼬리를 엄청 흔들었다.');}
  tip('treat','간식을 먹으면 잠깐 동안 재주 성공률이 올라가요!');}
function doTrick(k){const d=G.dami,t=TRICKS[k];const p=Math.min(.97,SV.skill[k]+(G.boost>0?.2:0));const ok=rnd()<p;
  d.state='trick';d.trick=k;d.ok=ok;d.t=2.4;d.dir='down';bubble('pl',`담이야, ${t.name}!`,1);
  setTimeout(()=>{if(!G)return;if(ok){SV.skill[k]=Math.min(.97,SV.skill[k]+.05);gainAff(1);gainXP(3);addSt('mood',4);SFX.heart();bubble('dami','멍!',1,'#c0602a');hearts(d.x,d.y-18,4);if(!SV.today.todo.trick){SV.today.todo.trick=1;logDay(`'${t.name}' 성공! 칭찬을 듬뿍 해 줬다.`);}
      const coach=G.area.npcs.find(n=>n.id==='coach');if(coach)for(const q of SV.today.quests)if(q.type==='trick'&&q.trick===k&&q.state==='active'){q.state='ready';setTimeout(()=>talk(coach),900);}}
    else{SV.skill[k]=Math.min(.97,SV.skill[k]+.02);bubble('dami','…? (갸웃)',1.4);}},650);}

// ---------- 대화·퀘스트 ----------
function talk(n){SFX.sel();
  if(n.role==='walker'){const w=n.w;if(n.played){openDialog({name:w.owner,P:w.P,id:w.id,lines:[`${w.dog}가 또 놀고 싶대요. 다음에 또 만나요!`]});return;}
    openDialog({name:w.owner,P:w.P,id:w.id,lines:[`안녕하세요! 저는 ${w.owner}, 얘는 ${w.breed} ${w.dog}예요.`,`${w.dog}랑 같이 놀래요?`],choices:['같이 놀자!','다음에요'],cb:i=>{if(i===0)startPlay(n);}});return;}
  if(n.role==='recv'){const q=n.q;if(q.state==='active'){q.state='ready';SFX.clover();logDay(`${q.to}께 빵 바구니를 배달했다.`);openDialog({name:q.to,P:n.P,id:'recv',lines:['어머, 몽글 빵집 빵이네요! 고마워요.','담이도 착하게 기다렸구나~']});}else openDialog({name:q.to,P:n.P,id:'recv',lines:['빵 정말 맛있어요!']});return;}
  const id=n.id,def=NPCS[id];const qs=SV.today.quests.filter(q=>q.giver===id);
  const ready=qs.find(q=>q.state==='ready'),fresh=qs.find(q=>q.state==='new'),act=qs.find(q=>q.state==='active');
  if(ready){finishQuest(ready,n);return;}
  if(fresh){openDialog({name:def.name,P:def.P,id,lines:fresh.ask,choices:['좋아요, 맡겨 주세요!','다음에요'],cb:i=>{if(i===0){fresh.state='active';SFX.sel();toast(`퀘스트 수락: ${fresh.title}`);tip('quest','받은 퀘스트는 [할 일]에서 볼 수 있어요. 장소가 있는 퀘스트는 산책 지도에 ! 표시가 떠요.');}}});return;}
  if(act){openDialog({name:def.name,P:def.P,id,lines:[act.type==='trick'?`담이에게 다가가 [행동]으로 '${TRICKS[act.trick].name}'를 시켜 보세요!`:`${act.title}, 부탁할게~`+(act.place&&act.place!=='town'?` (${PLACES[act.place].name})`:'')]});return;}
  if(def.shop){openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle)],cb:()=>openShop()});return;}
  openDialog({name:def.name,P:def.P,id,lines:[pick(def.idle)]});}
function finishQuest(q,n){const def=NPCS[q.giver];q.state='done';SV.today.todo.quest++;addCoins(q.reward);SFX.clear();
  let extra='';if(q.bonusTreat){SV.treats+=q.bonusTreat;extra=` · 간식 +${q.bonusTreat}`;}if(q.acc&&!SV.acc[q.acc]){SV.acc[q.acc]=1;extra+=` · ${ACCS[q.acc].name}`;}
  logDay(`${def.name}의 부탁 '${q.title}'을(를) 해결했다.`);
  openDialog({name:def.name,P:def.P,id:q.giver,lines:[...q.thanks,`🦴 ${q.reward}코인 · 경험치 +${q.xp}${extra}`]});gainXP(q.xp);gainAff(1);save();}
function startPlay(n){const o=G.pl;G.play={w:n,t:4,cx:(o.x+n.x)/2,cy:(o.y+n.y)/2+10};G.dami.state='play';SFX.heart();bubble('dami','같이 놀자~!',1.4,'#d94f6a');bubble(n,'와아~',1.2);tip('play','친구 강아지랑 놀면 기분과 우정이 쑥쑥 올라요!');}

// ---------- 샤워·잠 ----------
function bathDone(){const T0=SV.today.todo;addSt('clean',100);addSt('mood',10);gainAff(2);if(!T0.bath){T0.bath=1;logDay('보송보송 샤워 완료! 담이에게서 좋은 냄새가 났다.');}G.dami.state='idle';G.dami.sparkle=8;}
function goSleep(){const T0=SV.today.todo;const miss=[];if(!T0.feed2)miss.push('저녁밥');if(!T0.treat)miss.push('간식 타임');if(!T0.bath)miss.push('샤워');
  if(SV.today.clock<17*60){openDialog({name:'침대',lines:['아직 해가 쨍쨍해요. 담이랑 더 놀다 와요!'],choices:['그래도 잘래요','더 놀래요'],cb:i=>{if(i===0)endDay();}});return;}
  if(miss.length){openDialog({name:'침대',lines:[`아직 ${miss.join(', ')}을(를) 안 했어요.`,'담이가 기다리고 있는 것 같아요.'],choices:['그래도 잘래요','마저 할게요'],cb:i=>{if(i===0)endDay();}});return;}
  openDialog({name:'침대',lines:['오늘 하루도 고생했어요. 담이야 잘 자~'],choices:['잘 자요','조금 더 놀래요'],cb:i=>{if(i===0)endDay();}});}
function endDay(){const Td=SV.today;const done=Object.values(Td.todo).filter(v=>v).length;SV.stickers+=done;
  G.diary={day:SV.day,season:season(),log:Td.log.slice(),todo:Object.assign({},Td.todo),earned:Td.earned,met:Td.met.slice(),dug:Td.dug.slice(),ate:Td.ate,yelp:Td.yelp,festival:SV.day===FESTIVAL_DAY&&!SV.festival};
  if(G.diary.festival){SV.festival=true;const sc=festivalScore();G.diary.fest=sc;addCoins(100);}
  SFX.clear();musicOn=false;scene='diary';sceneT=0;SV.day++;newToday();save(true);}
function festivalScore(){const tricks=Object.values(TRICKS).filter(t=>t.lv<=SV.alv).length,fr=Object.keys(SV.friends).length,acc=Object.keys(SV.acc).length;return{tricks,fr,acc,alv:SV.alv,total:tricks*20+fr*10+acc*8+SV.alv*10};}
