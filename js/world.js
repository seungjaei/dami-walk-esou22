"use strict";
// ===== 저장 데이터 · 하루 일정 · 지역(집/마을/산책길) 생성 =====
// 멀티플레이 대비: SV = 이 플레이어 저장본(JSON 하나). 나중에 Supabase에 그대로 올릴 수 있게 순수 데이터만 둔다.
const store={get(k,d){try{const v=localStorage.getItem('dami3_'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('dami3_'+k,JSON.stringify(v));}catch(e){}}};
const DEF={v:3,day:1,coins:50,kibble:6,treats:5,acc:{},eq:null,xp:0,lv:1,aff:0,alv:1,skill:{sit:.5,paw:.3,down:.25,bang:.2},friends:{},treasure:{},stickers:0,tips:{},muted:false,today:null,festival:false};
let SV=JSON.parse(JSON.stringify(DEF));
function loadSave(cloud){const s=cloud||store.get(saveKey(),null);SV=Object.assign(JSON.parse(JSON.stringify(DEF)),s||{});muted=SV.muted;}
function save(force){store.set(saveKey(),SV);cloudSave(force);}
const walkLv=()=>SV.lv,affLv=()=>SV.alv;
const season=()=>['봄','여름','가을'][Math.floor((SV.day-1)/5)%3];
function newToday(){
  seed=(Date.now()^(SV.day*7919))>>>0;
  const ev=eventsForDay(SV.day);
  SV.today={clock:7*60,quests:makeQuests(),todo:{feed1:0,water:0,walk:0,quest:0,feed2:0,treat:0,bath:0},log:[],earned:0,met:[],ate:0,yelp:0,dug:[],
    bowl:{food:0,water:0},st:{hunger:45,thirst:40,mood:70,clean:55},townWalker:RI(0,WALKERS.length-1),
    events:ev,visited:[],newsShown:false,ev:{}};
  if(ev.includes('kitten'))SV.today.ev.kitten={place:pick(placesOpen(OUTER)),state:'lost'};
}
function makeQuests(){const pool=QDEF.slice().sort(()=>rnd()-.5);const n=SV.day===1?2:3;const qs=[],used=new Set();
  for(const d of pool){if(qs.length>=n)break;if(used.has(d.giver))continue;used.add(d.giver);const q=Object.assign({giver:d.giver,type:d.type,reward:d.reward,xp:d.xp,state:'new',got:0},d.mk());q.id=d.giver+'_'+d.type;qs.push(q);}return qs;}
function logDay(s){SV.today.log.push(s);}

// ---------- 공통: 지역 객체 ----------
function blankArea(kind,W,H){return{kind,W,H,PW:W*T,PH:H*T,solid:new Uint8Array(W*H),objs:[],npcs:[],walls:[],exits:[],doors:[],tall:[],foods:[],sniffs:[],digs:[],dogs:[],birds:[],ducks:[],lamps:[],qitems:[],outdoor:false};}
function setSolid(A,tx,ty){if(tx>=0&&ty>=0&&tx<A.W&&ty<A.H)A.solid[ty*A.W+tx]=1;}
function addFurn(A,k,tx,ty,v,use,solid=true){const img=buildFurn(k,v);const o={kind:k,x:tx*T,y:ty*T,img,v,use,flat:!solid};A.objs.push(o);
  if(solid){const w=img.width,row=Math.floor((o.y-3)/T);for(let x=Math.floor((o.x-w/2+3)/T);x<=Math.floor((o.x+w/2-3)/T);x++)setSolid(A,x,row);}return o;}

// ---------- 집 안 ----------
const ROOMS={
  home:{W:20,H:12,wall:'#f3e3c3',wall2:'#ead6b0',floor:['#c99a68','#b4855a'],door:6,
    furn:[['bed',2.6,4.8,0,'bed'],['wardrobe',5.4,3.7,0,'wardrobe'],['shelf',8.4,3.5,0],['toybox',10.6,4.3,0,'toy'],['table',6.4,7.2],['plant',11.2,9.8],
      ['cushion',2.6,9.6,0,null,false],['bowl',7.2,10,0,'feed',false],['bowl',8.4,10,0,'water',false],['tub',16.4,5.4,0,'bath'],['plant',18.6,9.8]],
    walls:[['window',7.4,0.9],['calendar',11.6,1.2],['clock',4,1.2],['towel',18.4,2.4,'f']]},
  grandma:{W:14,H:10,wall:'#ecd9e4',wall2:'#dec8d6',floor:['#b98a5a','#a8784a'],door:6,npc:['grandma',7,4.6],furn:[['table',7,7],['shelf',3,3.5,0],['plant',12,4.4],['plant',1.6,8.6]],walls:[['painting',7,1],['clock',10.6,1.2],['window',3.4,0.9]]},
  bakery:{W:14,H:10,wall:'#f6e2c4',wall2:'#ecd2ac',floor:['#c8a070','#b48c5c'],door:6,npc:['baker',7,4.2],furn:[['counter',7,5.6,1],['oven',2.6,3.8],['shelf',11.4,3.6,1],['table',11,8.4]],walls:[['window',6.6,0.9]]},
  florist:{W:14,H:10,wall:'#e2f2dc',wall2:'#d2e6ca',floor:['#b98a5a','#a8784a'],door:6,npc:['florist',7,4.2],furn:[['counter',7,5.6,2],['bucket',1.6,4.2,0],['bucket',2.8,4.2,1],['bucket',10.8,4.2,2],['bucket',12,4.2,3],['plant',1.6,8.6],['plant',12.4,8.6]],walls:[['window',6.6,0.9]]},
  petshop:{W:14,H:10,wall:'#dcecf8',wall2:'#cadff0',floor:['#c8a070','#b48c5c'],door:6,npc:['shop',7,4.2],furn:[['counter',7,5.6],['shelf',2.6,3.6,2],['shelf',11.4,3.6,2],['toybox',11.6,8.4]],walls:[['window',6.6,0.9]]},
  kid:{W:14,H:10,wall:'#fff1c8',wall2:'#f6e2a8',floor:['#c99a68','#b4855a'],door:6,npc:['kid',6,6.4],furn:[['bed',2.6,4.8],['toybox',10.4,4.3],['table',8.6,7.6],['plant',12.4,8.6]],walls:[['window',6.6,0.9],['painting',11,1]]},
  coach:{W:14,H:10,wall:'#e6f0d8',wall2:'#d6e4c4',floor:['#a8c890','#98b880'],door:6,npc:['coach',10.6,5],furn:[['cone',3,6,0,null,false],['cone',5,6,0,null,false],['cone',7,6,0,null,false],['shelf',2.6,3.6,2],['board',11,3.6]],walls:[['window',6.6,0.9]]},
  mayor:{W:14,H:10,wall:'#ece0d0',wall2:'#dccfbb',floor:['#a8784a','#946a40'],door:6,npc:['mayor',7,4.2],furn:[['desk',7,5.6],['shelf',2.6,3.6,0],['shelf',11.4,3.6,0],['plant',12.4,8.6]],walls:[['painting',7,1],['clock',10.6,1.2]]}
};
function genRoom(id){
  const R0=ROOMS[id],A=blankArea(id==='home'?'home':'house',R0.W,R0.H);A.id=id;
  const night=SV.today.clock>=19*60;
  A.ground=mk(A.PW,A.PH,g=>{
    const [f1,f2]=R0.floor;
    for(let y=3*T;y<A.PH;y+=6){rc(g,0,y,A.PW,6,f1);rc(g,0,y,A.PW,1,f2);const off=(y/6*13)%32;for(let x=off;x<A.PW;x+=32)rc(g,x,y,1,6,f2);}
    if(id==='home'){for(let ty=3;ty<A.H-1;ty++)for(let tx=13;tx<A.W-1;tx++){rc(g,tx*T,ty*T,T,T,(tx+ty)%2?'#e8f2f8':'#cfe2ee');rc(g,tx*T,ty*T,T,1,'#b8ccd8');rc(g,tx*T,ty*T,1,T,'#b8ccd8');}
      ell(g,7*T,7.6*T,46,20,'#e08a8a');ell(g,7*T,7.6*T,42,17,'#f4b0a0');ell(g,7*T,7.6*T,30,11,'#fbd0c0');}
    rc(g,0,0,A.PW,3*T,R0.wall);for(let x=0;x<A.PW;x+=8)rc(g,x,6,2,3*T-14,R0.wall2);rc(g,0,0,A.PW,6,'#8a5a3a');rc(g,0,3*T-8,A.PW,8,'#a8784a');rc(g,0,3*T-8,A.PW,2,'#c8986a');
    if(id==='home'){rc(g,13*T-4,0,4,3*T,'#8a5a3a');for(let x=13*T;x<A.PW;x+=6)rc(g,x,6,1,3*T-14,'#d6eef8');}
    rc(g,0,0,6,A.PH,'#5a3a26');rc(g,A.PW-6,0,6,A.PH,'#5a3a26');rc(g,0,A.PH-8,A.PW,8,'#5a3a26');
    const d=R0.door;rc(g,d*T,A.PH-8,2*T,8,R0.floor[0]);rc(g,d*T+4,A.PH-14,2*T-8,9,'#c0503a');rc(g,d*T+6,A.PH-12,2*T-12,5,'#e07a5a');
    for(const [k,tx,ty,f] of R0.walls){if(f)continue;const im=buildWall(k==='window'&&night?'nightwin':k);g.drawImage(im,Math.round(tx*T-im.width/2),Math.round(ty*T));}
  });
  for(let x=0;x<A.W;x++){setSolid(A,x,0);setSolid(A,x,1);setSolid(A,x,2);if(x!==R0.door&&x!==R0.door+1)setSolid(A,x,A.H-1);}
  for(let y=0;y<A.H;y++){setSolid(A,0,y);setSolid(A,A.W-1,y);}
  if(id==='home')for(let y=3;y<=6;y++)setSolid(A,12,y);
  for(const f of R0.furn){const [k,tx,ty,v,use,sol]=f;const o=addFurn(A,k,tx,ty,v||0,use,sol!==false);if(use==='feed')A.bowlF=o;if(use==='water')A.bowlW=o;if(k==='cushion')A.cushion=o;}
  for(const [k,tx,ty,f] of R0.walls)if(f){const o={kind:k,x:tx*T,y:ty*T+20,img:buildFurn('towel'),flat:true};A.objs.push(o);}
  if(R0.npc){const [nid,tx,ty]=R0.npc;A.npcs.push({id:nid,role:'villager',P:NPCS[nid].P,name:NPCS[nid].name,x:tx*T,y:ty*T,dir:'down',face:1,anim:0});}
  A.exits.push({x:R0.door*T,y:A.PH-6,w:2*T,h:8,act:()=>{const h=TOWN_HOUSES.find(h=>h.id===id);enterArea('town',{x:h.tx*T+16,y:h.ty*T+28});}});
  A.spawn={x:(R0.door+1)*T,y:A.PH-22};
  return A;
}

// ---------- 구역 공통: 가장자리 출입구 ----------
const TOWN_EDGE={E:[45,17],W:[0,17],N:[22,0],S:[22,35]};
const ZW=48,ZH=30,ZEDGE={E:[ZW-1,15],W:[0,15],N:[24,0],S:[24,ZH-1]};
const edgeOf=(id,dir)=>(id==='town'?TOWN_EDGE:ZEDGE)[dir];
function addEdgeExits(A,id){
  for(const dir of ['N','S','E','W']){const nb=zoneAt(id,dir);if(!nb)continue;const [ex,ey]=edgeOf(id,dir);
    const r=dir==='E'?{x:(A.W-1)*T+6,y:(ey-1.6)*T,w:T,h:3.2*T}:dir==='W'?{x:-T+10,y:(ey-1.6)*T,w:T,h:3.2*T}:dir==='N'?{x:(ex-1.6)*T,y:-T+10,w:3.2*T,h:T}:{x:(ex-1.6)*T,y:(A.H-1)*T+6,w:3.2*T,h:T};
    A.exits.push(Object.assign(r,{dir,to:nb,act:()=>goZone(nb,OPP[dir],dir)}));
    for(let k=-1;k<=1;k++){const tx=dir==='E'?A.W-1:dir==='W'?0:ex+k,ty=dir==='N'?0:dir==='S'?A.H-1:ey+k;A.solid[ty*A.W+tx]=0;
      const tx2=dir==='E'?A.W-2:dir==='W'?1:ex+k,ty2=dir==='N'?1:dir==='S'?A.H-2:ey+k;A.solid[ty2*A.W+tx2]=0;}
    A.objs.push({kind:'edgeSign',dir,to:nb,x:dir==='E'?(A.W-2.5)*T:dir==='W'?2.5*T:(ex+2.6)*T,y:dir==='N'?2.6*T:dir==='S'?(A.H-1.4)*T:(ey-1.8)*T,img:spr('sign'+(dir==='W'?1:0),()=>buildObj('sign',dir==='W'?1:0))});}
}
function spawnAt(id,from){const [ex,ey]=edgeOf(id,from),W0=id==='town'?46:ZW,H0=id==='town'?36:ZH;const d=DIRS[from];
  return{x:(clamp(ex-d[0]*2.2,1.5,W0-1.5))*T+8,y:(clamp(ey-d[1]*2.2,1.5,H0-1.5))*T+(from==='N'?10:4)};}
function objAnchor(ob){const im=ob.img;if(ob.kind==='tree')return[ob.x-18,ob.y-46];if(ob.kind==='house')return[ob.x-30,ob.y-60];return[ob.x-im.width/2,ob.y-im.height+2];}
function makeThumb(A){const k=.25;return mk(A.PW*k,A.PH*k,g=>{g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(A.ground,0,0,A.PW*k,A.PH*k);
  for(const ob of A.objs.slice().sort((a,b)=>a.y-b.y)){if(!ob.img||ob.kind==='edgeSign')continue;const [ax,ay]=objAnchor(ob);g.drawImage(ob.img,ax*k,ay*k,ob.img.width*k,ob.img.height*k);}});}

// ---------- 마을 ----------
const TOWN_HOUSES=[
  {id:'home',tx:7,ty:14,roof:0},{id:'grandma',tx:15,ty:14,roof:3},{id:'bakery',tx:30,ty:14,roof:1},{id:'florist',tx:38,ty:14,roof:2},
  {id:'petshop',tx:7,ty:26,roof:1},{id:'kid',tx:15,ty:26,roof:0},{id:'coach',tx:30,ty:26,roof:2},{id:'mayor',tx:38,ty:26,roof:3}];
const HOUSE_NAME={home:'우리 집',grandma:'복순 할머니 댁',bakery:'몽글 빵집',florist:'하린 꽃집',petshop:'멍멍 펫샵',kid:'도윤이네',coach:'은비 훈련소',mayor:'이장님 댁'};
const TOWN_TH={path:{type:'stone',b:'#dcd2bf',m:'#bfb39d',l:'#ece4d6',e:'#9b8f7b'}};
let TOWN_CACHE={};
function genTown(){
  const sk=season();
  if(!TOWN_CACHE[sk]){
    const save0=seed;seed=4242;
    const A=blankArea('town',46,36);A.outdoor=true;A.place='town';
    const mc=document.createElement('canvas');mc.width=A.PW;mc.height=A.PH;const mg=mc.getContext('2d');mg.fillStyle='#fff';
    const RR=(x,y,w,h)=>mg.fillRect(x*T,y*T,w*T,h*T);
    RR(0,16,A.W,3);RR(2,28,A.W-4,3);RR(21,0,3,A.H);mg.beginPath();mg.arc(22.5*T,23.5*T,4.6*T,0,7);mg.fill();
    for(const h of TOWN_HOUSES){mg.fillRect(h.tx*T+16-8,h.ty*T+14,16,(h.ty<20?16:28)*T-(h.ty*T+14)+2);}
    const md=mg.getImageData(0,0,A.PW,A.PH).data;const M=new Uint8Array(A.PW*A.PH),SD=new Uint8Array(A.PW*A.PH),WT=new Uint8Array(A.PW*A.PH);
    for(let i=0;i<A.PW*A.PH;i++)M[i]=md[i*4+3]>128?1:0;
    const tile=new Uint8Array(A.W*A.H);for(let ty=0;ty<A.H;ty++)for(let tx=0;tx<A.W;tx++)tile[ty*A.W+tx]=M[(ty*T+8)*A.PW+tx*T+8];
    const occ=new Uint8Array(A.W*A.H);
    const near=(tx,ty,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const x=tx+i,y=ty+j;if(x>=0&&y>=0&&x<A.W&&y<A.H&&tile[y*A.W+x])return true;}return false;};
    for(const h of TOWN_HOUSES){const o={kind:'house',id:h.id,x:h.tx*T+16,y:h.ty*T+16,img:buildObj('house',h.roof)};A.objs.push(o);
      for(let j=-3;j<=0;j++)for(let i=-2;i<=3;i++){const x=h.tx+i,y=h.ty+j;if(x>=0&&y>=0)occ[y*A.W+x]=1;}
      for(let j=-2;j<=0;j++)for(let i=-1;i<=2;i++)setSolid(A,h.tx+i,h.ty+j);
      A.doors.push({id:h.id,name:HOUSE_NAME[h.id],x:o.x,y:o.y+6});
      A.objs.push({kind:'mailbox',x:h.tx*T+60,y:h.ty*T+30,img:spr('mailbox',()=>buildObj('mailbox'))});occ[(h.ty+1)*A.W+h.tx+3]=1;setSolid(A,h.tx+3,h.ty+1);}
    A.objs.push({kind:'fountain',x:22.5*T,y:23.5*T+8,img:buildObj('fountain'),anim:'fountain'});for(let j=22;j<=24;j++)for(let i=21;i<=23;i++){setSolid(A,i,j);occ[j*A.W+i]=1;}
    A.objs.push({kind:'board',x:26.6*T,y:20.6*T,img:buildFurn('board'),use:'board'});setSolid(A,26,20);setSolid(A,27,20);occ[20*A.W+26]=occ[20*A.W+27]=1;
    const sea=SEASONS[sk];
    for(let ty=0;ty<A.H;ty++)for(let tx=0;tx<A.W;tx++){
      const edge=tx<2||ty<2||tx>=A.W-2||ty>=A.H-2;
      if(edge){if(tile[ty*A.W+tx])continue;setSolid(A,tx,ty);if((tx+ty)%2===0&&!near(tx,ty,1)){const k=sea.cherry&&rnd()<.4?'cherry':sea.maple&&rnd()<.4?'maple':'tree';A.objs.push({kind:'tree',x:tx*T+8+R(-3,3),y:ty*T+14,img:buildTree(k,sea,RI(1,1e6))});}continue;}
      if(occ[ty*A.W+tx]||tile[ty*A.W+tx]||near(tx,ty,1))continue;
      const r=rnd();
      if(r<.06&&!occ[ty*A.W+tx-1]&&!occ[(ty-1)*A.W+tx]){const k=sea.cherry&&rnd()<.5?'cherry':sea.maple&&rnd()<.5?'maple':'tree';A.objs.push({kind:'tree',x:tx*T+8,y:ty*T+14,img:buildTree(k,sea,RI(1,1e6))});setSolid(A,tx,ty);occ[ty*A.W+tx]=occ[ty*A.W+tx+1]=occ[(ty-1)*A.W+tx]=1;}
      else if(r<.1){A.objs.push({kind:'bush',x:tx*T+8,y:ty*T+12,img:spr('bush'+(tx%3),()=>buildObj('bush',tx%3))});setSolid(A,tx,ty);occ[ty*A.W+tx]=1;}
      else if(r<.12){A.objs.push({kind:'flowerbed',x:tx*T+8,y:ty*T+12,img:spr('flowerbed',()=>buildObj('flowerbed'))});setSolid(A,tx,ty);occ[ty*A.W+tx]=1;}
    }
    for(let x=4;x<A.W-4;x+=7){for(const y of [15,19]){if(!occ[y*A.W+x]&&!tile[y*A.W+x]){A.objs.push({kind:'lamp',x:x*T+8,y:y*T+12,img:spr('lamp',()=>buildObj('lamp'))});setSolid(A,x,y);occ[y*A.W+x]=1;}}}
    for(const [x,y] of [[19,21],[25,25],[19,25]]){if(!occ[y*A.W+x]&&!tile[y*A.W+x]){A.objs.push({kind:'bench',x:x*T+8,y:y*T+12,img:spr('bench',()=>buildObj('bench'))});setSolid(A,x,y);occ[y*A.W+x]=1;}}
    A.ground=renderGround(A.W,A.H,A.PW,A.PH,M,SD,WT,TOWN_TH,sea);
    for(let ty=2;ty<A.H-2;ty++)for(let tx=2;tx<A.W-2;tx++)if(!tile[ty*A.W+tx]&&!occ[ty*A.W+tx]&&rnd()<.08)A.tall.push({x:tx*T+R(2,14),y:ty*T+R(4,15),ph:R(0,6)});
    A.lamps=A.objs.filter(o=>o.kind==='lamp');A.sea=sea;
    addEdgeExits(A,'town');A.staticObjs=A.objs.slice();A.thumb=makeThumb(A);A.baseSolid=A.solid.slice();
    seed=save0;TOWN_CACHE[sk]=A;
  }
  const A=TOWN_CACHE[sk];
  A.npcs=[];A.birds=[];A.qitems=[];A.objs=A.staticObjs.slice();A.solid=A.baseSolid.slice();
  const w=WALKERS[SV.today.townWalker];addWalker(A,w,{x:24*T,y:20.5*T},null);
  for(let i=0;i<5;i++)A.birds.push({x:R(18,27)*T,y:R(20,27)*T,hop:R(0,2),fly:0,vx:0,vy:0,face:1,alive:true});
  return A;
}
function addWalker(A,w,pos,route){
  const n={id:w.id,role:'walker',w,P:w.P,name:w.owner,x:pos.x,y:pos.y,dir:'down',face:1,anim:0,route,ri:route?route.a:0,rdir:1,played:false};
  n.pup={P:Object.assign({s:.82,K:'#1e1512',blush:'#f6b0bc'},w.D),x:pos.x+14,y:pos.y+4,dir:'side',face:1,anim:0,moving:false};
  A.npcs.push(n);return n;
}

// ---------- 바깥 구역 (지형은 고정, 사람·물건은 날마다 새로) ----------
const ZONE_CACHE={};
const strSeed=s=>{let h=7;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%2000000+1000;};
function zoneStatic(id){
  const sk=id==='beach'?'sand':season(),key=id+'_'+sk;if(ZONE_CACHE[key])return ZONE_CACHE[key];
  const save0=seed;seed=strSeed(id);
  const Z=PLACES[id],th=THEMES[Z.theme],sea=th.sand?Object.assign({},SEASONS[season()],SAND_SEA):SEASONS[season()];
  const A=blankArea('walk',ZW,ZH);A.outdoor=true;A.place=id;A.th=th;A.sea=sea;
  const {W,H,PW,PH}=A,hub=[24,15];
  const lines=[];
  const carve=(a,b)=>{const pts=[];const mid=[clamp(Math.round((a[0]+b[0])/2+R(-5,5)),4,W-5),clamp(Math.round((a[1]+b[1])/2+R(-4,4)),th.river?9:4,H-5)];
    for(const [p,q] of [[a,mid],[mid,b]]){let [x,y]=p;const hf=rnd()<.5;if(hf){while(x!==q[0]){pts.push([x,y]);x+=Math.sign(q[0]-x);}while(y!==q[1]){pts.push([x,y]);y+=Math.sign(q[1]-y);}}else{while(y!==q[1]){pts.push([x,y]);y+=Math.sign(q[1]-y);}while(x!==q[0]){pts.push([x,y]);x+=Math.sign(q[0]-x);}}}
    pts.push(b.slice());return pts;};
  const dirs=['N','S','E','W'].filter(d=>zoneAt(id,d));
  for(const d of dirs)lines.push(carve(edgeOf(id,d).slice(),hub));
  // 한 방향만 열린 구역은 끝에 둘레길 하나 더
  if(dirs.length<2)lines.push(carve(hub,[RI(8,W-9),RI(th.river?10:5,H-6)]));
  const C=()=>{const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');g.fillStyle='#fff';return [c,g];};
  const [mc,mg]=C();for(const L of lines)for(const [cx,cy] of L){mg.beginPath();mg.arc(cx*T+8,cy*T+8,12,0,7);mg.fill();}
  mg.beginPath();mg.arc(hub[0]*T+8,hub[1]*T+8,40,0,7);mg.fill();
  const allPts=lines.flat();
  const [sc,sg]=C();const branches=[];
  for(let b=0;b<14&&branches.length<3;b++){const p=pick(allPts);if(Math.hypot(p[0]-hub[0],p[1]-hub[1])<5)continue;if(branches.some(q=>Math.hypot(q.p[0]-p[0],q.p[1]-p[1])<10))continue;
    const dy=p[1]<H/2?1:-1;const pts=[];let px0=p[0]*T+8,py0=p[1]*T+8,ang=Math.PI/2*dy+R(-.6,.6);
    for(let k=0;k<RI(10,16);k++){px0+=Math.cos(ang)*8;py0+=Math.sin(ang)*8;ang+=R(-.35,.35);if(py0<(th.river?9:3)*T||py0>(H-3)*T||px0<4*T||px0>(W-4)*T)break;pts.push([px0,py0]);}
    if(pts.length<5)continue;branches.push({p,pts,dy});for(const [qx,qy] of pts){sg.beginPath();sg.arc(qx,qy,7,0,7);sg.fill();}}
  A.branches=branches;A.lines=lines;A.allPts=allPts;A.hub=hub;
  const [wc,wg]=C();
  if(th.river){wg.beginPath();wg.moveTo(0,0);for(let p=0;p<=PW;p+=16)wg.lineTo(p,6*T+Math.sin(p/60)*10+Math.sin(p/23)*4);wg.lineTo(PW,0);wg.fill();}
  if(th.seaLeft){wg.beginPath();wg.moveTo(0,0);for(let p=0;p<=PH;p+=16)wg.lineTo(6*T+Math.sin(p/50)*12+Math.sin(p/19)*4,p);wg.lineTo(0,PH);wg.fill();}
  const mm=mg.getImageData(0,0,PW,PH).data,sm=sg.getImageData(0,0,PW,PH).data;
  const M=new Uint8Array(PW*PH),SD=new Uint8Array(PW*PH),WT=new Uint8Array(PW*PH);
  for(let i=0;i<PW*PH;i++){M[i]=mm[i*4+3]>128?1:0;SD[i]=!M[i]&&sm[i*4+3]>128?1:0;}
  const tile=new Uint8Array(W*H);for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const i=(ty*T+8)*PW+tx*T+8;tile[ty*W+tx]=M[i]?1:SD[i]?2:0;}
  const pd=new Int16Array(W*H).fill(99),q=[];for(let i=0;i<W*H;i++)if(tile[i]===1){pd[i]=0;q.push(i);}
  for(let h=0;h<q.length;h++){const i=q[h],tx=i%W,ty=(i/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=tx+dx,ny=ty+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(pd[j]>pd[i]+1){pd[j]=pd[i]+1;q.push(j);}}}
  if(th.pond)for(let k=0;k<2;k++)for(let tries=0;tries<40;tries++){const cx=RI(6,W-7),cy=RI(4,H-4);if(pd[cy*W+cx]<5)continue;wg.beginPath();wg.ellipse(cx*T+8,cy*T+8,R(2.5,4)*T,R(1.8,2.6)*T,0,0,7);wg.fill();break;}
  const wm=wg.getImageData(0,0,PW,PH).data;for(let i=0;i<PW*PH;i++)WT[i]=wm[i*4+3]>128&&!M[i]&&!SD[i]?1:0;
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++)if(WT[(ty*T+8)*PW+tx*T+8]){tile[ty*W+tx]=5;A.solid[ty*W+tx]=1;}
  A.tile=tile;A.pd=pd;A.WT=WT;A.M=M;
  const occ=new Uint8Array(W*H);
  const free=(tx,ty,m=2)=>tx>1&&ty>1&&tx<W-2&&ty<H-2&&!occ[ty*W+tx]&&tile[ty*W+tx]===0&&pd[ty*W+tx]>=m;
  const add=(kind,tx,ty,o={})=>{const ob=Object.assign({kind,x:tx*T+8,y:ty*T+12},o);A.objs.push(ob);occ[ty*W+tx]=1;if(o.solid!==false)setSolid(A,tx,ty);return ob;};
  const tk=()=>sea.cherry&&rnd()<.5?'cherry':sea.maple&&rnd()<.5?'maple':'tree';
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const edge=tx<2||ty<2||tx>=W-2||ty>=H-2;if(!edge)continue;if(tile[ty*W+tx]===1)continue;setSolid(A,tx,ty);
    if(tile[ty*W+tx]===5||(th.river&&ty<8)||(th.seaLeft&&tx<8))continue;if((tx+ty)%2===0&&rnd()<.85&&pd[ty*W+tx]>1){const k=th.path.type==='dirt'&&rnd()<.6?'pine':tk();A.objs.push({kind:'tree',x:tx*T+8+R(-3,3),y:ty*T+14,img:buildTree(k,sea,RI(1,1e6))});}}
  // 명소 (구역 한가운데)
  const land=Z.land;const lim=buildObj(land);const lo={kind:'goal',x:hub[0]*T+8,y:(hub[1]-2)*T+14,img:lim,anim:land};A.objs.push(lo);A.landmark=lo;
  for(let j=-1;j<=0;j++)for(let i=-1;i<=1;i++){const t=(hub[1]-2+j)*W+hub[0]+i;if(tile[t]!==1)A.solid[t]=1;occ[t]=1;}
  if(th.houses)for(let n=0;n<40;n++){const tx=RI(3,W-6),ty=RI(3,9);let ok=true;for(let j=-2;j<=0&&ok;j++)for(let i=-1;i<=2&&ok;i++){const t=(ty+j)*W+tx+i;if(occ[t]||tile[t]!==0||pd[t]<2)ok=false;}if(!ok)continue;
    for(let j=-3;j<=0;j++)for(let i=-2;i<=3;i++){const t=(ty+j)*W+tx+i;if(t>=0)occ[t]=1;}for(let j=-1;j<=0;j++)for(let i=-1;i<=2;i++)setSolid(A,tx+i,ty+j);A.objs.push({kind:'house',x:tx*T+16,y:ty*T+16,img:buildObj('house',RI(0,3))});}
  for(let ty=2;ty<H-2;ty++)for(let tx=2;tx<W-2;tx++){if(!free(tx,ty))continue;for(const [k,p] of th.obj){if(rnd()<p){
    if(k==='tree'||k==='pine'){if(occ[ty*W+tx-1]||occ[(ty-1)*W+tx])break;const kk=k==='pine'?'pine':tk();add('tree',tx,ty,{img:buildTree(kk,sea,RI(1,1e6)),y:ty*T+14});occ[(ty-1)*W+tx]=1;occ[ty*W+tx+1]=1;}
    else{const v=k==='bush'||k==='tent'?RI(0,2):0;add(k,tx,ty,{img:spr(k+v,()=>buildObj(k,v)),solid:!['fern','mushroom'].includes(k)});}break;}}}
  for(let i=0;i<allPts.length;i+=RI(12,17)){const [cx,cy]=allPts[i];for(const [dx,dy] of [[0,-2],[0,2]]){const tx=cx+dx,ty=cy+dy;if(free(tx,ty,1)&&pd[ty*W+tx]===1){const k=rnd()<.5&&th.path.type==='stone'?'lamp':'bench';add(k,tx,ty,{img:spr(k,()=>buildObj(k))});break;}}}
  for(const b of branches){const [cx,cy]=b.p;for(const dx of [-2,2]){const tx=cx+dx,ty=cy+b.dy*2;if(free(tx,ty,1)){add('sign',tx,ty,{img:spr('sign'+(dx>0?0:1),()=>buildObj('sign',dx>0?0:1))});break;}}}
  // 킁킁 스팟 (고정 위치, 맡았는지는 날마다 초기화)
  A.sniffs=[];for(let n=0;n<80&&A.sniffs.length<3;n++){const p=pick(allPts);const tx=p[0]+pick([-2,2,0]),ty=p[1]+pick([-2,2]);if(!free(tx,ty,1))continue;const sx=tx*T+8,sy=ty*T+12;if(A.sniffs.some(s=>Math.hypot(s.x-sx,s.y-sy)<100))continue;
    const k=pick(th.sniff);const ob=add(k,tx,ty,{img:spr(k+'s',()=>buildObj(k,RI(0,4))),solid:['lamp','pole','umbrella','tent','rock'].includes(k)});ob.sniff={done:false,ig:0};A.sniffs.push(ob);}
  A.ground=renderGround(W,H,PW,PH,M,SD,WT,th,sea);
  for(let ty=2;ty<H-2;ty++)for(let tx=2;tx<W-2;tx++)if(tile[ty*W+tx]===0&&!occ[ty*W+tx]&&pd[ty*W+tx]>=1&&rnd()<th.tall*.5)A.tall.push({x:tx*T+R(2,14),y:ty*T+R(4,15),ph:R(0,6)});
  A.lamps=A.objs.filter(o=>o.kind==='lamp');A.occ=occ;
  addEdgeExits(A,id);
  A.staticObjs=A.objs.slice();A.baseSolid=A.solid.slice();A.thumb=makeThumb(A);
  seed=save0;ZONE_CACHE[key]=A;return A;
}
function genZone(id){
  const A=zoneStatic(id);seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0;
  const {W,H,PW,PH,tile,pd,occ,allPts,lines,th}=A;
  A.objs=A.staticObjs.slice();A.solid=A.baseSolid.slice();A.npcs=[];A.foods=[];A.digs=[];A.dogs=[];A.birds=[];A.ducks=[];A.qitems=[];
  for(const s of A.sniffs){s.sniff.done=false;s.sniff.ig=0;}
  const free=(tx,ty,m=2)=>tx>1&&ty>1&&tx<W-2&&ty<H-2&&!occ[ty*W+tx]&&tile[ty*W+tx]===0&&pd[ty*W+tx]>=m&&!A.solid[ty*W+tx];
  const near0=(x,y)=>Math.hypot(x-A.hub[0]*T,y-A.hub[1]*T)<40;
  for(let n=0;n<40&&A.foods.length<(SV.today.events.includes('rain')?2:4);n++){const p=pick(allPts);const fx=p[0]*T+8+R(-10,10),fy=p[1]*T+8+R(-10,10);if(!A.M[Math.floor(fy)*PW+Math.floor(fx)])continue;if(A.foods.some(f=>Math.hypot(f.x-fx,f.y-fy)<70))continue;const k=RI(0,4);A.foods.push({x:fx,y:fy,img:spr('food'+k,()=>buildFood(k)),alive:true,ig:0});}
  for(let n=0;n<80&&A.digs.length<2;n++){const p=pick(allPts);const tx=p[0]+RI(-3,3),ty=p[1]+RI(-3,3);if(!free(tx,ty,1))continue;const x0=tx*T+8,y0=ty*T+10;if(A.digs.some(d=>Math.hypot(d.x-x0,d.y-y0)<160))continue;A.digs.push({x:x0,y:y0,found:false,ig:0});}
  const ws=WALKERS.filter((w,i)=>i!==SV.today.townWalker).sort(()=>rnd()-.5).slice(0,2);
  ws.forEach(w=>{const L=pick(lines);if(L.length<8)return;const a=RI(2,L.length-8),b=Math.min(L.length-2,a+RI(5,10));const p=L[a];addWalker(A,w,{x:p[0]*T+8,y:p[1]*T+4},{line:L,a,b});});
  const nd=Math.min(Math.floor(SV.lv/2)+(rnd()<.4?1:0),2);
  for(let n=0;n<60&&A.dogs.length<nd;n++){const p=pick(allPts);const tx=p[0]+pick([-3,3]),ty=p[1]+pick([-3,3]);if(!free(tx,ty,2))continue;const x0=tx*T+8,y0=ty*T+10;
    A.dogs.push({P:Object.assign({s:1.45,K:'#1a1210'},pick(BIGDOGS)),x:x0,y:y0,hx:x0,hy:y0,tx:x0,ty:y0,sleep:rnd()<.5,fear:22,wait:R(1,3),dir:'down',face:1,anim:0,barkT:0,zz:R(0,3)});}
  if(th.birds)for(let n=0;n<5;n++){const p=pick(allPts);A.birds.push({x:p[0]*T+8+R(-20,20),y:p[1]*T+8+R(-20,20),hop:R(0,2),fly:0,vx:0,vy:0,face:1,alive:true,gull:!!th.sand});}
  if(th.ducks)for(let n=0;n<200&&A.ducks.length<3;n++){const x0=R(20,PW-20),y0=R(20,PH-20);if(A.WT[Math.floor(y0)*PW+Math.floor(x0)]&&A.WT[Math.floor(y0+6)*PW+Math.floor(x0)])A.ducks.push({x:x0,y:y0,tx:x0,ty:y0,face:1,t:0});}
  const hubX=A.hub[0]*T+8,hubY=A.hub[1]*T+8;
  for(const qq of SV.today.quests){if(qq.state!=='active'||qq.place!==A.place)continue;
    if(qq.type==='find'){let p;if(A.branches.length){const b=pick(A.branches);p=b.pts[b.pts.length-1];}else{const l=pick(allPts);p=[l[0]*T+8,(l[1]+3)*T];}A.qitems.push({q:qq,x:p[0],y:p[1],icon:'find',name:qq.item,got:false});}
    if(qq.type==='collect')for(let n=0;n<80&&A.qitems.filter(i=>i.q===qq).length<qq.n-qq.got+1;n++){const p=pick(allPts);const tx=p[0]+RI(-3,3),ty=p[1]+RI(-3,3);if(!free(tx,ty,1))continue;A.qitems.push({q:qq,x:tx*T+8,y:ty*T+10,icon:'flower',name:qq.item,got:false});}
    if(qq.type==='deliver'){const rp={hair:pick(['#3a2a2a','#9a9a9a','#7a4a2a']),style:pick(['short','bun','pony']),top:pick(['#e07a5f','#7cc3c0','#f7d64a']),bottom:'#4a4a5a'};A.npcs.push({id:'recv',role:'recv',q:qq,P:rp,name:qq.to,x:hubX+40,y:hubY+10,dir:'down',face:1,anim:0});}
    if(qq.type==='photo')A.objs.push({kind:'view',x:hubX-30,y:hubY+14,img:null,use:'photo',q:qq});}
  // 이벤트: 원반 대회 진행자 / 떠돌이 상인 / 아기 고양이
  const E=SV.today.events;
  if(E.includes('frisbee')&&A.place==='park')A.npcs.push({id:'host',role:'host',P:NPCS.coach.P,name:'원반 대회 진행자',x:hubX-36,y:hubY+16,dir:'down',face:1,anim:0});
  if(E.includes('flea')&&A.place==='market')A.npcs.push({id:'merchant',role:'merchant',P:{hair:'#6a4a8a',style:'cap',hat:'#6a4a8a',top:'#d8a83a',topD:'#c0902a',bottom:'#4a3a5a'},name:'떠돌이 상인',x:hubX+36,y:hubY+16,dir:'down',face:1,anim:0});
  const kt=SV.today.ev.kitten;
  if(kt&&kt.state==='lost'&&kt.place===A.place){const b=A.branches.length?pick(A.branches).pts.slice(-1)[0]:[hubX+60,hubY+40];A.qitems.push({kitten:true,x:b[0],y:b[1],icon:'kitten',name:'아기 고양이 나비',got:false});}
  return A;
}
