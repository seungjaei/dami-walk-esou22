"use strict";
// ===== 자연 재료(풀·꽃) · 담이가 찾은 것 팔기(집 앞 판매대) · 소리 조절 =====

// ---------- 소리 조절: 음악 / 효과음 따로 (이 기기에 저장) ----------
const VOL=(()=>{try{const v=JSON.parse(localStorage.getItem('dami_vol')||'null');if(v&&typeof v.m==='number'&&typeof v.s==='number')return{m:clamp(v.m,0,1),s:clamp(v.s,0,1)};}catch(e){}return{m:.8,s:.8};})();
const saveVol=()=>{try{localStorage.setItem('dami_vol',JSON.stringify(VOL));}catch(e){}};
function openVol(){G.ov={type:'vol',row:0};SFX.sel();}
function volKey(k,OK,BACK){const o=G.ov;
  if(k==='ArrowUp'||k==='KeyW')o.row=(o.row+2)%3;else if(k==='ArrowDown'||k==='KeyS')o.row=(o.row+1)%3;
  else if(k==='ArrowLeft'||k==='KeyA'||k==='ArrowRight'||k==='KeyD'){const d=(k==='ArrowLeft'||k==='KeyA')?-.1:.1;if(o.row<2){const key=o.row?'s':'m';VOL[key]=Math.round(clamp(VOL[key]+d,0,1)*10)/10;saveVol();if(o.row)SFX.pick();}}
  else if(OK&&o.row===2)closeOv();else if(OK&&o.row<2){muted=false;SV.muted=false;}
  else if(BACK)closeOv();}
function volTap(p){const o=G.ov,{x,y,w}=o._box||{};if(!w){closeOv();return;}
  for(let r=0;r<2;r++){const ry=y+34+r*26;if(p.y>=ry-4&&p.y<=ry+14){o.row=r;const bx=x+90,bw=w-130;if(p.x>=bx-6&&p.x<=bx+bw+6){const key=r?'s':'m';VOL[key]=Math.round(clamp((p.x-bx)/bw,0,1)*10)/10;saveVol();if(r)SFX.pick();}return;}}
  if(p.y>=y+86&&p.y<=y+104){closeOv();return;}if(p.x<x||p.x>x+w||p.y<y||p.y>y+112)closeOv();}
function drawVol(){const o=G.ov,w=240,h=112,x=VW/2-w/2,y=VH/2-h/2;o._box={x,y,w};ctx.fillStyle='rgba(40,25,20,.5)';ctx.fillRect(0,0,VW,VH);panel(x,y,w,h);
  txt('🔊 소리 조절',x+12,y+8,'#c0602a',11,'left','G11B');if(muted)txt('(지금 소리 꺼짐 · V)',x+w-12,y+10,'#d94f6a',9,'right','G9');
  [['🎵 음악 소리','m'],['🐾 활동 소리','s']].forEach(([n,k],r)=>{const ry=y+34+r*26,bx=x+90,bw=w-130,on=o.row===r;
    txt((on?'▶ ':'  ')+n,x+12,ry,on?'#c0602a':'#4a3426',9,'left','G9');px(bx,ry+2,bw,6,'#4a2e1e');px(bx+1,ry+3,(bw-2)*VOL[k],4,k==='m'?'#7cc3c0':'#f2a33a');px(bx+(bw-2)*VOL[k]-2,ry,5,10,'#4a2e1e');
    txt(`${Math.round(VOL[k]*100)}%`,x+w-12,ry,'#4a3426',9,'right','G9');});
  const on=o.row===2;panel(VW/2-30,y+86,60,18,on?'#ffe2b8':undefined);txt('닫기',VW/2,y+90,'#4a3426',9,'center','G11B');
  if(!isTouch)txt('↑↓ 고르기 · ←→ 크기 · Esc 닫기',VW/2,y+h+6,'#fff7e0',7,'center','G7','#4a2e1e');}

// ---------- 자연 재료: 풀(덤불·고사리·갈대) · 꽃(꽃밭) ----------
RES_NAME.fiber='풀';RES_NAME.flower='꽃';
const FIBER_KINDS=['bush','fern','reed'],FLOWER_KINDS=['flowerbed','flowers'];
const CUT_IMG={wood:()=>spr('stump0',()=>buildObj('stump',0)),stone:()=>spr('pebble',buildPebble),
  fiber:()=>spr('cutgrass',()=>mk(14,8,g=>{for(let i=0;i<5;i++)rc(g,2+i*2.4,3+(i%2),1,5-(i%2),'#5a8a3a');ell(g,7,7,6,1.4,'#4a7a32');})),
  flower:()=>spr('pickedfl',()=>mk(14,8,g=>{for(let i=0;i<4;i++){rc(g,3+i*2.6,2+(i%2),1,6,'#4a8a3a');}ell(g,7,7,6,1.4,'#3d7a30');}))};
const resOfKind=k=>k==='rock'?'stone':(k==='tree'||k==='pine')?'wood':FIBER_KINDS.includes(k)?'fiber':FLOWER_KINDS.includes(k)?'flower':null;
function natInteract(c,reach){const A=G.area,o=G.pl;if(!A||!A.outdoor||!A.place||!(SV.mq>=1))return;
  for(const ob of A.objs){if(ob.cutDone||ob.sniff)continue;const r=resOfKind(ob.kind);if(r!=='fiber'&&r!=='flower')continue;
    if(reach(ob.x,ob.y,18))c.push({d:Math.hypot(o.x-ob.x,o.y-ob.y)+4,label:r==='fiber'?'🌿 풀 베기':'🌸 꽃 따기',act:()=>gather(ob,r)});}}

// ---------- 담이가 냄새 맡고 땅 파서 찾은 것 (판매대에서 뼈다귀로 바꾼다) ----------
const FINDS={acorn:{name:'도토리',ic:'🌰',p:4},mush:{name:'숲 버섯',ic:'🍄',p:6},herb:{name:'향긋한 풀잎',ic:'🌿',p:3},feath:{name:'새 깃털',ic:'🪶',p:5},
  pebl:{name:'예쁜 돌멩이',ic:'🪨',p:4},shellf:{name:'조개껍데기',ic:'🐚',p:6},oldbone:{name:'오래된 뼈',ic:'🦴',p:8},berry:{name:'산딸기',ic:'🍓',p:7},truffle:{name:'송로버섯',ic:'✨',p:45}};
const FIND_TABLE={mountain:['acorn','mush','mush','berry'],glamp:['acorn','berry','herb','mush'],summit:['pebl','feath','pebl'],camp:['mush','acorn','berry'],meadow:['herb','herb','feath','berry'],
  beach:['shellf','shellf','pebl'],river:['pebl','feath','shellf'],park:['acorn','feath','herb'],market:['oldbone','pebl']};
function addFind(n=1){const A=G.area,id=rnd()<.04?'truffle':pick(FIND_TABLE[A&&A.place]||['herb','pebl']);SV.finds=SV.finds||{};SV.finds[id]=(SV.finds[id]||0)+n;const F=FINDS[id];
  setTimeout(()=>{if(G)toast(`${F.ic} ${F.name} ${n>1?n+'개 ':''}을(를) 가방에 넣었어요 · 집 앞 판매대에서 팔 수 있어요`);},700);return id;}
function onSniffDone(){if(rnd()<.6)addFind(1);}
function onDigDone(){addFind(RI(1,2));}

// ---------- 집 앞 판매대 ----------
function buildStand(){return mk(30,30,g=>{rc(g,3,10,2,18,'#5a3a22');rc(g,25,10,2,18,'#5a3a22');
  for(let i=0;i<6;i++)rc(g,i*5,4,5,7,i%2?'#ffffff':'#ef6f7c');rc(g,0,10,30,2,'#c0503a');
  rc(g,1,18,28,10,'#4a2e1e');rc(g,2,19,26,8,'#b07a48');rc(g,2,19,26,2,'#d09a62');ell(g,9,18,3,2,'#e09a3a');ell(g,16,18,3,2,'#c0603a');ell(g,22,18,3,2,'#7cc36a');});}
function townHook(A){const h=TOWN_HOUSES.find(h=>h.id==='home');if(!h)return;
  for(const [dx,dy] of [[3,2],[-2,2],[3,3],[-2,3],[4,2]]){const tx=h.tx+dx,ty=h.ty+dy;if(tx<1||ty<1||tx>=A.W-1||ty>=A.H-1||A.solid[ty*A.W+tx])continue;
    A.objs.push({kind:'stand',x:tx*T+8,y:ty*T+14,img:spr('stand',buildStand),onUse:openStand,lab:'🧺 판매대 (찾은 것 팔기)'});A.solid[ty*A.W+tx]=1;return;}}
function openStand(){SFX.sel();SV.finds=SV.finds||{};const own=Object.entries(SV.finds).filter(([k,v])=>v>0&&FINDS[k]);
  const total=own.reduce((s,[k,v])=>s+FINDS[k].p*v,0);
  if(!own.length){openMenu({title:'🧺 우리 집 판매대',items:[{label:'팔 물건이 없어요',dis:true,fn:()=>{}},{label:'산책하며 담이가 킁킁·땅파기로 찾은 걸 여기서 팔 수 있어요',dis:true,fn:()=>{}},{label:'닫기',fn:closeOv}]});return;}
  openMenu({title:`🧺 우리 집 판매대 · 모두 팔면 🦴${total}`,items:own.map(([k,v])=>({label:`${FINDS[k].ic} ${FINDS[k].name} ×${v}  →  🦴${FINDS[k].p*v}`,fn:()=>sellFind(k)}))
    .concat([{label:`💰 모두 팔기 (🦴${total})`,fn:()=>{for(const [k] of own)sellFind(k,true);openStand();}},{label:'닫기',fn:closeOv}])});}
function sellFind(k,quiet){const v=SV.finds[k]||0;if(!v)return;const g=FINDS[k].p*v;SV.finds[k]=0;addCoins(g);SFX.pick();
  if(!quiet){logDay(`판매대에서 ${FINDS[k].name} ${v}개를 팔아 뼈다귀 ${g}개를 벌었다.`);toast(`${FINDS[k].ic} ${FINDS[k].name} ${v}개 → 🦴${g}`);openStand();}else logDay(`판매대에서 ${FINDS[k].name} ${v}개를 팔았다.`);save();}
