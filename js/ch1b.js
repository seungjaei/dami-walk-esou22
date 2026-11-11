"use strict";
// ===== 챕터 1-2단계: 글램핑 숙소 안 · 작업대(가구 만들기) · 인테리어(직접 배치) =====
// - 숙소(3단계)를 지으면 들어갈 수 있다. 외형(벨 텐트·돔·오두막)마다 벽·바닥이 다르다.
// - 작업대에서 나무·돌·뼈다귀로 가구를 만든다. 침대·소파·식탁은 1~4인용, 인원이 많을수록 재료가 더 든다.
// - [꾸미기]에서 가구를 골라 원하는 칸에 놓고, 놓은 가구는 다시 들어 옮기거나 치울 수 있다.
// 저장: SV.glamp.inv={가구id:개수}, SV.glamp.furn=[{id,tx,ty}]

const CAPN=['','1인용','2인용','3인용','4인용'];
const DECO={};
for(const c of [1,2,3,4]){
  DECO['bed'+c]={name:`${CAPN[c]} 침대`,cap:c,kind:'bed',cost:{wood:2+4*c,coins:10*c*c},use:'bed'};
  DECO['sofa'+c]={name:c===1?'1인용 의자':`${CAPN[c]} 소파`,cap:c,kind:'sofa',cost:{wood:1+3*c,coins:8*c*c}};
  DECO['table'+c]={name:`${CAPN[c]} 식탁 세트`,cap:c,kind:'table',cost:{wood:2+3*c,stone:c>2?c-2:0,coins:6*c*c}};}
Object.assign(DECO,{
  rug:{name:'동그란 러그',kind:'rug',cost:{coins:20},flat:true},
  lamp:{name:'캠핑 랜턴 스탠드',kind:'lamp',cost:{wood:2,stone:2}},
  plant:{name:'화분',kind:'plant',cost:{stone:1,coins:10}},
  shelf:{name:'책장',kind:'shelf',cost:{wood:8}},
  dogbed:{name:'강아지 방석',kind:'dogbed',cost:{coins:25},flat:true},
  stove:{name:'장작 난로',kind:'stove',cost:{wood:4,stone:6}},
});
const ROOM_STYLE={
  bell:{wall:'#f2e6cc',wall2:'#e6d6b0',floor:['#c9a476','#b08a5a']},
  dome:{wall:'#f4f2ec',wall2:'#e2e0d8',floor:['#d8c8a8','#c4b28e']},
  cabin:{wall:'#b07a48',wall2:'#9a6838',floor:['#a8784a','#8a5a32']},
};
const decoCost=id=>{const c=DECO[id].cost,o={};for(const r in c)if(c[r])o[r]=c[r];return o;};

// ---------- 그림 (가구는 직접 그린 픽셀) ----------
function buildDeco(id){const D=DECO[id];
  if(D.kind==='plant')return buildFurn('plant');if(D.kind==='shelf')return buildFurn('shelf');if(D.kind==='dogbed')return buildFurn('cushion');
  const c=D.cap||1;
  if(D.kind==='bed'){const w=14+c*10;return mk(w,24,g=>{rc(g,0,4,w,20,'#4a2e1e');rc(g,1,5,w-2,18,'#8a5a32');rc(g,2,6,w-4,4,'#a8784a');
    rc(g,2,10,w-4,12,'#fffaf0');rc(g,2,14,w-4,8,['#9fd6a8','#f2b8c6','#a8c8f0','#f2d48a'][c-1]);rc(g,2,14,w-4,1,'#ffffff');
    for(let i=0;i<c;i++){const px0=3+i*((w-6)/c);rc(g,px0+1,10,(w-6)/c-2,4,'#ffffff');rc(g,px0+1,13,(w-6)/c-2,1,'#d8d4cc');}});}
  if(D.kind==='sofa'){const w=10+c*10;return mk(w,18,g=>{rc(g,0,0,w,18,'#2e4a4a');rc(g,1,1,w-2,8,'#5aa0a0');rc(g,1,9,2,8,'#5aa0a0');rc(g,w-3,9,2,8,'#5aa0a0');
    for(let i=0;i<c;i++){rc(g,4+i*10,9,9,6,'#7cc3c0');rc(g,4+i*10,9,9,1,'#a8e0dc');}rc(g,1,16,w-2,1,'#2e4a4a');});}
  if(D.kind==='table'){const w=12+c*8;return mk(w+8,26,g=>{const tx=4;
    for(let i=0;i<c;i++){const cx=tx+4+i*((w-8)/Math.max(1,c-1||1))-(c===1?-(w-8)/2+4:0);const up=i%2===0;rc(g,cx-3,up?0:20,7,6,'#4a2e1e');rc(g,cx-2,up?1:21,5,4,'#c08a5a');}
    rc(g,tx,6,w,13,'#4a2e1e');rc(g,tx+1,7,w-2,10,'#d8a878');rc(g,tx+1,7,w-2,2,'#e8c098');rc(g,tx+2,19,2,4,'#4a2e1e');rc(g,tx+w-4,19,2,4,'#4a2e1e');
    for(let i=0;i<c;i++)ell(g,tx+6+i*((w-10)/Math.max(1,c)),11,2,1.4,'#ffffff');});}
  if(D.kind==='rug')return mk(44,20,g=>{ell(g,22,10,22,10,'#8a3a4a');ell(g,22,10,20,8.6,'#e07a8a');ell(g,22,10,14,6,'#f4b0b8');ell(g,22,10,7,3,'#fbd0d6');});
  if(D.kind==='lamp')return mk(12,28,g=>{rc(g,5,8,2,18,'#4a2e1e');rc(g,2,25,8,3,'#4a2e1e');rc(g,1,0,10,9,'#4a2e1e');rc(g,2,1,8,7,'#ffd23f');rc(g,3,2,6,2,'#fff2a8');});
  if(D.kind==='stove')return mk(20,26,g=>{rc(g,8,0,4,8,'#4a4a52');rc(g,1,8,18,18,'#2e2e36');rc(g,2,9,16,16,'#4a4a52');rc(g,5,14,10,8,'#2e2e36');rc(g,6,16,8,5,'#ef8a3a');rc(g,8,17,4,3,'#ffd23f');});
  return mk(16,16,g=>rc(g,0,0,16,16,'#f0f'));}
const decoImg=id=>spr('deco_'+id,()=>buildDeco(id));
const decoTiles=id=>Math.max(1,Math.ceil((decoImg(id).width-2)/T));

// ---------- 숙소 들어가기 ----------
function glampRoomCfg(){const s=ROOM_STYLE[SV.glamp.style]||ROOM_STYLE.bell;
  return Object.assign({W:16,H:11,door:7,furn:[],walls:[['window',4,0.9],['window',12,0.9]],exitTo:()=>{enterArea('zone',{id:'glamp',x:24*T+8,y:15*T+52});},after:glampRoomAfter},s);}
function enterGlampRoom(){if((SV.glamp.st||0)<3){toast('숙소를 먼저 지어야 해요');return;}ROOMS.glampin=glampRoomCfg();SFX.sel();enterArea('house',{id:'glampin'});}
function glampRoomAfter(A){A.glampin=true;SV.glamp.furn=SV.glamp.furn||[];SV.glamp.inv=SV.glamp.inv||{};
  A.objs.push(A.bench={kind:'bench',x:2*T,y:4*T,img:spr('wbench',buildBench),onUse:openCraft,lab:'🔨 작업대 (가구 만들기)'});setSolid(A,1,3);setSolid(A,2,3);
  A.baseSolidRoom=A.solid.slice();
  for(const f of SV.glamp.furn)placeObj(A,f);
  const cu=A.objs.find(o=>o.decoId==='dogbed');if(cu)A.cushion=cu;
  setTimeout(()=>{if(G&&G.area===A)tip('glampin','우리 숙소예요! 왼쪽 위 작업대에서 나무·돌로 가구를 만들고, [꾸미기]로 원하는 자리에 놓아 보세요.');},300);}
function buildBench(){return mk(30,22,g=>{rc(g,0,6,30,6,'#4a2e1e');rc(g,1,7,28,4,'#b07a48');rc(g,2,12,3,10,'#4a2e1e');rc(g,25,12,3,10,'#4a2e1e');rc(g,6,2,8,5,'#6b6458');rc(g,17,0,2,7,'#7a5232');rc(g,15,0,6,2,'#9a9488');});}
function placeObj(A,f){const D=DECO[f.id];if(!D)return null;const im=decoImg(f.id),wT=decoTiles(f.id);
  const o={kind:'deco',decoId:f.id,f,x:(f.tx+wT/2)*T,y:(f.ty+1)*T-1,img:im,flat:!!D.flat,use:D.use||null};
  if(D.kind==='lamp')o.light=true;A.objs.push(o);if(!D.flat)for(let x=f.tx;x<f.tx+wT;x++)setSolid(A,x,f.ty);return o;}
// 그 칸에 놓을 수 있나 (벽·문 앞·다른 가구·사람 자리 피하기)
function canPlace(A,id,tx,ty,ignore){const wT=decoTiles(id);if(ty<3||ty>A.H-2||tx<1||tx+wT>A.W-1)return false;const dr=(ROOMS.glampin||{}).door||7;if(ty>=A.H-3&&tx<=dr+2&&tx+wT>=dr)return false;   // 문 앞 두 줄은 비워 둔다
  for(let x=tx;x<tx+wT;x++){if(x<=2&&ty===3)return false;for(const f of SV.glamp.furn){if(f===ignore)continue;if(f.ty===ty&&x>=f.tx&&x<f.tx+decoTiles(f.id))return false;}}
  const pt=Math.floor(G.pl.x/T),py=Math.floor(G.pl.y/T);if(py===ty&&pt>=tx&&pt<tx+wT&&!DECO[id].flat)return false;return true;}
function refreshRoom(){const A=G.area;A.objs=A.objs.filter(o=>o.kind!=='deco');A.solid=new Uint8Array(A.baseSolidRoom||A.solid);
  for(const f of SV.glamp.furn)placeObj(A,f);const cu=A.objs.find(o=>o.decoId==='dogbed');A.cushion=cu||null;}

// ---------- 작업대: 가구 만들기 ----------
function openCraft(){SFX.sel();const items=[];
  const row=id=>{const D=DECO[id],c=decoCost(id),ok=Object.entries(c).every(([r,v])=>haveRes(r)>=v),own=SV.glamp.inv[id]||0;
    return{label:`${ok?'🔨':'·'} ${D.name}  —  ${Object.entries(c).map(([r,v])=>`${RES_NAME[r]} ${v}`).join(' · ')}${own?`  (가진 것 ${own})`:''}`,dis:!ok,fn:()=>craft(id)};};
  openMenu({title:'🔨 작업대 · 무엇을 만들까요?',items:[{label:'🛏️ 침대',fn:()=>openMenu({title:'🛏️ 침대 (인원이 많을수록 재료가 더 들어요)',items:[1,2,3,4].map(c=>row('bed'+c)).concat([{label:'뒤로',fn:openCraft}])})},
    {label:'🛋️ 소파·의자',fn:()=>openMenu({title:'🛋️ 소파·의자',items:[1,2,3,4].map(c=>row('sofa'+c)).concat([{label:'뒤로',fn:openCraft}])})},
    {label:'🍽️ 식탁 세트',fn:()=>openMenu({title:'🍽️ 식탁 세트',items:[1,2,3,4].map(c=>row('table'+c)).concat([{label:'뒤로',fn:openCraft}])})},
    {label:'🪴 소품',fn:()=>openMenu({title:'🪴 소품',items:['rug','lamp','plant','shelf','dogbed','stove'].map(row).concat([{label:'뒤로',fn:openCraft}])})},
    {label:'🎨 꾸미기 (가구 놓기·옮기기)',fn:()=>{closeOv();startDeco();}},{label:'닫기',fn:closeOv}]});}
function craft(id){const c=decoCost(id);for(const [r,v] of Object.entries(c))if(haveRes(r)<v){toast('재료가 모자라요');return;}
  for(const [r,v] of Object.entries(c)){if(r==='coins')SV.coins-=v;else SV[r]-=v;}
  SV.glamp.inv[id]=(SV.glamp.inv[id]||0)+1;SFX.clear();save();
  openMenu({title:`✨ ${DECO[id].name}을(를) 만들었어요!`,items:[{label:'🎨 바로 놓으러 가기',fn:()=>{closeOv();startDeco(id);}},{label:'더 만들기',fn:openCraft},{label:'닫기',fn:closeOv}]});}

// ---------- 꾸미기 모드 ----------
function startDeco(hold){const A=G.area;if(!A||!A.glampin)return;
  const tx=clamp(Math.floor(G.pl.x/T),1,A.W-2),ty=clamp(Math.floor(G.pl.y/T)-1,3,A.H-2);
  G.ov={type:'deco',cx:tx,cy:ty,hold:hold&&SV.glamp.inv[hold]>0?hold:null,from:null};tip('deco','꾸미기: 방향키로 칸을 고르고 [행동]으로 놓아요. 놓인 가구에서 [행동]을 누르면 들어 올려요. [메뉴]/Esc로 끝!');}
function decoAt(tx,ty){return SV.glamp.furn.find(f=>f.ty===ty&&tx>=f.tx&&tx<f.tx+decoTiles(f.id));}
function decoKey(k,OK,BACK){const o=G.ov,A=G.area;const mv={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[k];
  if(mv){o.cx=clamp(o.cx+mv[0],1,A.W-2);o.cy=clamp(o.cy+mv[1],3,A.H-2);SFX.step();return;}
  if(k==='KeyQ'||k==='Tab'){pickHold();return;}
  if(OK){decoAct();return;}
  if(BACK){if(o.hold&&o.from){SV.glamp.furn.push(o.from);refreshRoom();}else if(o.hold){}closeOv();save();}}
function decoAct(){const o=G.ov,A=G.area;
  if(o.hold){if(!canPlace(A,o.hold,o.cx,o.cy)){SFX.soft();toast('여기엔 놓을 수 없어요');return;}
    const f={id:o.hold,tx:o.cx,ty:o.cy};SV.glamp.furn.push(f);if(!o.from){SV.glamp.inv[o.hold]--;}o.hold=null;o.from=null;refreshRoom();SFX.pick();save();hearts(f.tx*T+8,f.ty*T,3);return;}
  const f=decoAt(o.cx,o.cy);if(f){SV.glamp.furn=SV.glamp.furn.filter(x=>x!==f);o.hold=f.id;o.from=f;o.cx=f.tx;refreshRoom();SFX.sel();return;}
  pickHold();}
function pickHold(){const o=G.ov,own=Object.entries(SV.glamp.inv).filter(([k,v])=>v>0);
  if(o.hold&&o.from){toast('들고 있는 가구를 먼저 놓거나 [치우기] 해요');return;}
  const items=own.map(([id,v])=>({label:`${DECO[id].name} (${v})`,fn:()=>{G.ov=Object.assign(o,{hold:id,from:null});}}));
  const save0=o;openMenu({title:own.length?'놓을 가구 고르기':'만든 가구가 없어요 (작업대에서 만들어요)',back:()=>{G.ov=save0;},items:items.concat([{label:'뒤로',fn:()=>{G.ov=save0;}}])});}
function decoRemove(){const o=G.ov;if(!o.hold)return;if(o.from){SV.glamp.inv[o.hold]=(SV.glamp.inv[o.hold]||0)+1;}o.hold=null;o.from=null;refreshRoom();save();toast('가방에 넣었어요');}
// 화면 아래 가운데 버튼 막대 (왼쪽 위 상태창·휴대폰 오른쪽 아래 버튼과 겹치지 않게)
const DECO_BAR=()=>{const x0=VW/2-84;return[[x0,'act'],[x0+58,'alt'],[x0+116,'end']];};
function decoTap(p){const o=G.ov,A=G.area;
  const by=VH-48;if(p.y>=by&&p.y<=by+20)for(const [x,k] of DECO_BAR())if(p.x>=x&&p.x<x+52){if(k==='act')decoAct();else if(k==='alt'){if(o.hold)decoRemove();else{closeOv();save();openCraft();}}else decoKey('Escape',false,true);return;}
  const tx=Math.floor((p.x+G.cam.x)/T),ty=Math.floor((p.y+G.cam.y)/T);if(tx>=1&&tx<=A.W-2&&ty>=3&&ty<=A.H-2){if(o.cx===tx&&o.cy===ty)decoAct();else{o.cx=tx;o.cy=ty;}}}
function drawDeco(t){const o=G.ov,A=G.area,sx=o.cx*T-G.cam.x,sy=o.cy*T-G.cam.y;
  if(o.hold){const im=decoImg(o.hold),wT=decoTiles(o.hold),ok=canPlace(A,o.hold,o.cx,o.cy);ctx.globalAlpha=.75;ctx.drawImage(im,Math.round(sx+wT*T/2-im.width/2),Math.round(sy+T-im.height));ctx.globalAlpha=1;
    ctx.strokeStyle=ok?'#7cc36a':'#ef5a6f';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,wT*T-1,T-1);}
  else{const f=decoAt(o.cx,o.cy);const w=f?decoTiles(f.id):1,x0=f?f.tx:o.cx;ctx.strokeStyle=Math.floor(t*3)%2?'#ffd23f':'#c0602a';ctx.lineWidth=1;ctx.strokeRect(x0*T-G.cam.x+.5,sy+.5,w*T-1,T-1);}
  const lab={act:o.hold?'놓기':(decoAt(o.cx,o.cy)?'들기':'가구 놓기'),alt:o.hold?'치우기':'만들기',end:'끝'};
  const by=VH-48;for(const [x,k] of DECO_BAR()){panel(x,by,52,20,k==='end'?'#ffd6d6':k==='act'?'#e4f2da':undefined);txt(lab[k],x+26,by+5,'#4a3426',9,'center','G11B');}
  const msg=o.hold?`✋ ${DECO[o.hold].name}`:'🎨 꾸미기 중';ctx.font='9px G9';const w=ctx.measureText(msg).width+12;px(VW/2-w/2,VH-64,w,13,'rgba(74,46,30,.85)');txt(msg,VW/2,VH-62,'#fff7e0',9,'center','G9');
  if(!isTouch)txt('방향키 칸 고르기 · [행동] 놓기/들기 · Q 가구 고르기 · X 치우기 · Esc 끝',VW/2,VH-14,'#fff7e0',7,'center','G7','#4a2e1e');}
function ch1bKey(k,OK,BACK){if(G.ov&&G.ov.type==='deco'){if(k==='KeyX'&&G.ov.hold){decoRemove();return true;}decoKey(k,OK,BACK);return true;}return false;}
