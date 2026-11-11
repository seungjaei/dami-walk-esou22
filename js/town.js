"use strict";
// ===== 마을·집 (v5): 집마다 다른 모양, 마을 가게(인테리어·편의점·철물점·미용실), 우리 집 꾸미기,
//       공원 돗자리, 새 침대, 시작 이야기·처음 가는 곳 안내, 정기검진, 눈 오는 날 =====

// ---------- 집마다 다른 모양 (60×62, 원래 집과 같은 크기) ----------
function buildHouse2(id){return mk(60,62,g=>{const W='#4a2e1e';
  const base=(wall,roof,roofL,trim)=>{rc(g,6,26,48,34,W);rc(g,7,27,46,32,wall);for(let y=0;y<26;y++){const w=Math.round(28*y/25)+2;rc(g,30-w,y+2,w*2,1,y%5===0?roofL:roof);}rc(g,2,26,56,3,trim||W);};
  const door=(x,c)=>{rc(g,x,42,12,18,W);rc(g,x+1,43,10,17,c);rc(g,x+8,51,1,2,'#ffd23f');};
  const win=(x,y,c)=>{rc(g,x,y,11,10,W);rc(g,x+1,y+1,9,8,c||'#bfe6ff');rc(g,x+5,y+1,1,8,W);};
  switch(id){
    case 'home':base('#fff3dc','#e0604a','#f08a6a');door(24,'#b07a48');win(9,33);win(40,33);ell(g,12,58,5,3,'#7cc36a');ell(g,48,58,5,3,'#7cc36a');rc(g,26,36,8,4,'#ffd23f');txt2(g,'🐾',30,37);break;
    case 'grandma':base('#f6efe0','#3e4a5a','#5a6a7a');for(let x=2;x<58;x+=4)rc(g,x,24,3,3,'#2e3a4a');door(24,'#8a5a32');win(9,33,'#f6e6c0');win(40,33,'#f6e6c0');for(const x of [8,14,44,50]){rc(g,x,54,4,6,'#a8784a');ell(g,x+2,53,3,2.4,'#ef8fb6');}break;
    case 'bakery':base('#fbe6c4','#8a5a32','#a8784a');for(let i=0;i<8;i++)rc(g,4+i*7,26,7,6,i%2?'#fff':'#e0604a');door(36,'#c0884a');rc(g,8,36,22,14,W);rc(g,9,37,20,12,'#ffe8b0');ell(g,15,44,4,3,'#d89040');ell(g,23,44,4,3,'#c07830');txt2(g,'🥐',30,8);break;
    case 'florist':base('#e8f6e0','#5a9a5a','#7cc36a');door(24,'#7aa86a');win(9,33);win(40,33);for(const x of [8,40]){rc(g,x,43,13,4,'#8a5a32');for(let i=0;i<4;i++)ell(g,x+2+i*3,42,1.8,1.8,['#ef6f7c','#ffd23f','#b07aa1','#f2a33a'][i]);}for(const x of [4,52])for(let i=0;i<3;i++)ell(g,x+2,50+i*3,2.4,2.4,['#ef6f7c','#ffd23f','#ef8fb6'][i]);break;
    case 'petshop':base('#e0f0fb','#4a7ab0','#6a9ad0');door(24,'#5a8ac0');win(9,33);win(40,33);rc(g,18,14,24,10,W);rc(g,19,15,22,8,'#fff');ell(g,25,19,2,2,'#4a7ab0');ell(g,29,17,1.4,1.4,'#4a7ab0');ell(g,33,17,1.4,1.4,'#4a7ab0');ell(g,36,19,1.4,1.4,'#4a7ab0');ell(g,30,21,3,2,'#4a7ab0');break;
    case 'kid':base('#fff1b0','#7cc3c0','#a8e0dc');door(24,'#ef8fb6');win(9,33,'#ffe2f0');win(40,33,'#e2f0ff');rc(g,50,30,2,30,'#8a5a32');rc(g,44,30,8,2,'#8a5a32');rc(g,45,32,1,12,'#555');rc(g,45,44,6,2,'#ef6f7c');ell(g,10,57,4,3,'#ffd23f');break;
    case 'coach':base('#e6f0d8','#6a8a4a','#8aaa6a');door(24,'#6a8a4a');rc(g,8,32,44,8,'#c0602a');txt2(g,'🏆',30,33);ell(g,12,56,4,4,'#fff');ell(g,12,56,3,3,'#ffd23f');rc(g,46,48,8,10,'#f2a33a');rc(g,47,48,6,2,'#fff');break;
    case 'mayor':base('#efe4d0','#7a3a3a','#9a5a5a');door(24,'#7a4a2a');win(9,33);win(40,33);rc(g,29,0,2,12,W);rc(g,31,1,9,6,'#ef5a5a');ell(g,30,18,5,5,W);ell(g,30,18,4,4,'#fff');rc(g,30,15,1,3,W);rc(g,30,18,3,1,W);break;
    case 'vet':rc(g,6,14,48,46,W);rc(g,7,15,46,44,'#fbfbfb');rc(g,4,12,52,4,'#5aa9e6');rc(g,22,18,16,16,W);rc(g,23,19,14,14,'#fff');rc(g,28,21,4,10,'#3db06a');rc(g,25,24,10,4,'#3db06a');door(24,'#5aa9e6');win(9,38);win(40,38);break;
    default:base('#fff3dc','#e0604a','#f08a6a');door(24,'#b07a48');}});}
function txt2(g,s,x,y){g.font='9px sans-serif';g.textAlign='center';g.textBaseline='top';g.fillText(s,x,y);}
function townHouseHook(A){for(const o of A.objs)if(o.kind==='house'&&o.id)o.img=spr('house2_'+o.id,()=>buildHouse2(o.id));}

// ---------- 마을 가게 ----------
const KIOSK=[
  {id:'interior',name:'🛋️ 인테리어 상점',col:'#b07aa1',fn:()=>openInterior()},
  {id:'cvs',name:'🏪 편의점',col:'#5aa9e6',fn:()=>openCVS()},
  {id:'tools',name:'🔨 철물점',col:'#8a8a92',fn:()=>openTools()},
  {id:'groom',name:'✂️ 강아지 미용실',col:'#ef8fb6',fn:()=>openGroom()},
];
function buildKiosk(col){return mk(30,32,g=>{rc(g,3,12,2,20,'#5a3a22');rc(g,25,12,2,20,'#5a3a22');for(let i=0;i<6;i++)rc(g,i*5,4,5,8,i%2?'#ffffff':col);rc(g,0,11,30,2,'#4a2e1e');
  rc(g,1,20,28,12,'#4a2e1e');rc(g,2,21,26,10,'#d8b07a');rc(g,2,21,26,2,'#f0c890');});}
function townShopHook(A){const spots=[[20,20],[26,20],[20,29],[26,29]];for(let ty=17;ty<=31;ty++)for(let tx=16;tx<=31;tx++)spots.push([tx,ty]);let k=0;const used=[];
  for(const [tx,ty] of spots){if(k>=KIOSK.length)break;let ok=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const i=(ty+dy)*A.W+tx+dx;if(A.solid[i])ok=false;}if(!ok||used.some(([x,y])=>Math.abs(x-tx)+Math.abs(y-ty)<5))continue;used.push([tx,ty]);
    const K0=KIOSK[k++];A.objs.push({kind:'kiosk',x:tx*T+8,y:ty*T+14,img:spr('kiosk_'+K0.id,()=>buildKiosk(K0.col)),onUse:K0.fn,lab:K0.name,r:26,sign:K0.name});A.solid[ty*A.W+tx]=1;}}
// 인테리어 상점: 우리 집에 놓을 가구를 뼈다귀로 산다
const decoPrice=id=>{const c=DECO[id].cost||{};return 10+Math.round(((c.wood||0)*3+(c.stone||0)*3+(c.fiber||0)*2+(c.flower||0)*3)*1.4);};
function openInterior(){SFX.sel();SV.home=SV.home||{inv:{},furn:[]};const ids=['bed1','bed2','sofa1','sofa2','sofa3','table2','table4','rug','lamp','plant','shelf','dogbed','stove'];
  openMenu({title:`🛋️ 인테리어 상점 (🦴 ${SV.coins})`,shop:true,items:ids.map(id=>({desc:'산 가구는 우리 집에서 메뉴 → 🎨 우리 집 꾸미기로 놓아요',label:`${DECO[id].name}${SV.home.inv[id]?` (가방 ${SV.home.inv[id]})`:''}`,right:`${decoPrice(id)}`,coin:true,deco:id,fn:()=>{const p=decoPrice(id);if(SV.coins<p){toast('뼈다귀가 모자라요');SFX.soft();return;}
    SV.coins-=p;SV.home.inv[id]=(SV.home.inv[id]||0)+1;SFX.pick();toast(`${DECO[id].name} 구입! 우리 집에서 메뉴 → 🎨 우리 집 꾸미기`);save();const s=G.ov.sel;openInterior();G.ov.sel=s;}})).concat([{label:'나가기',fn:closeOv}])});}
// 편의점: 주인 배고픔 채우기
const CVS=[{id:'kimbap',name:'🍙 삼각김밥',p:12,v:30},{id:'ramen',name:'🍜 컵라면',p:18,v:45},{id:'sand',name:'🥪 샌드위치',p:22,v:55},{id:'milk',name:'🥛 바나나우유',p:8,v:15},{id:'lunch',name:'🍱 도시락',p:35,v:80}];
function openCVS(){SFX.sel();const me=Math.round(st().me==null?75:st().me);openMenu({title:`🏪 편의점 (🦴 ${SV.coins}) · 내 배: ${me}%`,shop:true,items:CVS.map(f=>({label:`${f.name}  (배 +${f.v})`,right:`${f.p}`,coin:true,fn:()=>{if(SV.coins<f.p){toast('뼈다귀가 모자라요');return;}SV.coins-=f.p;addSt('me',f.v);SFX.eat();bubble('pl','냠냠, 든든하다!',1.2);toast(`${f.name} 먹었어요 · 내 배 ${Math.round(st().me)}%`);save();openCVS();}})).concat([{label:'나가기',fn:closeOv}])});}
// 철물점: 도구 등급 올리기 (하급 5번 → 중급 3번 → 고급 1번)
const TOOL_UP=[null,null,{coins:150,wood:8,stone:8},{coins:400,wood:20,stone:20}];
function openTools(){SFX.sel();if(!(SV.mq>=1)&&!SV.tools){openMenu({title:'🔨 철물점',items:[{label:'이장님께 도구를 먼저 받아 오세요 (챕터 1)',dis:true,fn:()=>{}},{label:'나가기',fn:closeOv}]});return;}
  const it=Object.keys(TOOLN).map(k=>{const t=toolTier(k)||1,next=t+1,c=TOOL_UP[next];if(!c)return{label:`${TOOLN[k]} — 고급 (최고!) · 한 번에 캐요`,dis:true,fn:()=>{}};
    const ok=Object.entries(c).every(([r,v])=>haveRes(r)>=v);return{label:`${TOOLN[k]} ${GRADE[t]} → ${GRADE[next]} (${HITS[next]}번)  ·  🦴${c.coins} 🪵${c.wood} 🪨${c.stone}`,dis:!ok,fn:()=>{for(const [r,v] of Object.entries(c)){if(r==='coins')SV.coins-=v;else SV[r]-=v;}SV.tool[k]=next;SFX.clear();toast(`${TOOLN[k]}가 ${GRADE[next]}이 됐어요!`);logDay(`철물점에서 ${TOOLN[k]}를 ${GRADE[next]}으로 바꿨다.`);save();openTools();}};});
  openMenu({title:`🔨 철물점 (🦴 ${SV.coins}) · 좋은 도구일수록 빨리 캐요`,items:it.concat([{label:'나가기',fn:closeOv}])});}
// 강아지 미용실
function openGroom(){SFX.sel();const done=SV.today.groomed;openMenu({title:'✂️ 강아지 미용실',items:[{label:done?'오늘은 이미 미용했어요':'🛁 목욕 + ✂️ 털 다듬기 (40 뼈다귀) · 뽀송 100, 기분 +20',dis:!!done||SV.coins<40,fn:()=>{SV.coins-=40;SV.today.groomed=1;addSt('clean',100);addSt('mood',20);gainAff(2);SFX.clear();closeOv();bubble('dami','짠! 예뻐졌어요?',2,'#d94f6a');hearts(G.dami.x,G.dami.y-14,6);logDay('미용실에서 털을 다듬었다. 담이가 한층 귀여워졌다!');save();}},{label:'나가기',fn:closeOv}]});}

// ---------- 우리 집 꾸미기 (글램핑 숙소와 같은 방식, 저장은 SV.home) ----------
const DS=()=>G&&G.area&&G.area.glampin?SV.glamp:(SV.home=SV.home||{inv:{},furn:[]});
ROOMS.home.after=function(A){A.homeDeco=true;SV.home=SV.home||{inv:{},furn:[]};
  const bed=A.objs.find(o=>o.kind==='bed');if(bed)bed.img=spr('homebed',buildHomeBed);
  A.baseSolidRoom=A.solid.slice();for(const f of SV.home.furn)placeObj(A,f);};
function buildHomeBed(){return mk(34,34,g=>{const W='#4a2e1e';rc(g,1,2,32,8,W);rc(g,2,3,30,6,'#8a5a32');rc(g,4,4,26,2,'#a8784a');   // 머리판
  rc(g,1,9,32,24,W);rc(g,2,10,30,22,'#fffaf0');rc(g,4,11,12,6,'#ffffff');rc(g,18,11,12,6,'#ffffff');rc(g,4,16,12,1,'#d8d4cc');rc(g,18,16,12,1,'#d8d4cc');   // 베개 2개
  rc(g,2,19,30,13,'#c9b6e4');rc(g,2,19,30,2,'#e2d6f2');for(let x=5;x<30;x+=6)rc(g,x,23,2,2,'#fff');rc(g,2,32,3,2,W);rc(g,29,32,3,2,W);});}

// ---------- 공원: 벤치·쓰레기통·돗자리 (돗자리에 누워 쉬기) ----------
function buildMat(){return mk(30,18,g=>{rc(g,0,2,30,14,'#4a2e1e');for(let x=1;x<29;x+=4)for(let y=3;y<15;y+=4)rc(g,x,y,4,4,((x+y)/4)%2?'#ef6f7c':'#fff');});}
function buildBin(){return mk(12,16,g=>{rc(g,1,3,10,13,'#3a5a3a');rc(g,2,4,8,11,'#5a8a5a');rc(g,0,1,12,3,'#3a5a3a');rc(g,4,7,4,1,'#3a5a3a');});}
function parkHook(A){if(A.place!=='park')return;const pts=A.allPts||[];let mats=0,bins=0;
  for(let n=0;n<200&&(mats<2||bins<3);n++){const p=pick(pts);if(!p)break;const tx=p[0]+pick([-3,3]),ty=p[1]+pick([-2,2]);if(tx<2||ty<2||tx>=A.W-2||ty>=A.H-2)continue;
    let ok=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(A.solid[(ty+dy)*A.W+tx+dx])ok=false;if(!ok||A.objs.some(o=>Math.hypot(o.x-tx*T,o.y-ty*T)<40&&o.kind!=='tree'))continue;
    if(mats<2){mats++;A.objs.push({kind:'mat',x:tx*T+8,y:ty*T+14,img:spr('mat2',buildMat),flat:true,onUse:()=>{if(SV.today.picnic){toast('오늘은 이미 실컷 쉬었어요');return;}SV.today.picnic=1;SV.today.clock+=20;addSt('mood',15);addSt('me',8);G.dami.state='sleep';G.dami.t=3;SFX.heart();bubble('pl','돗자리에 누우니 좋다~',1.6);bubble('dami','쿨…',1.4);logDay('공원 돗자리에 담이랑 나란히 누워 하늘을 봤다.');},lab:'🧺 돗자리에 누워 쉬기',r:24});}
    else{bins++;A.objs.push({kind:'bin',x:tx*T+8,y:ty*T+14,img:spr('bin',buildBin)});A.solid[ty*A.W+tx]=1;}}}

// ---------- 시작 이야기 · 처음 가는 곳 안내 ----------
const VISIT_TIP={home:'우리 집이에요! 밥그릇·물그릇 채우기, 장난감 상자(공놀이), 샤워, 침대가 있어요.',town:'우리 마을! 가운데 광장에 인테리어 상점·편의점·철물점·미용실이 있고, 우리 집 앞에는 판매대가 있어요.',
  mountain:'뒷산 숲길: 나무와 돌이 많아요. 도끼·곡괭이로 재료를 모을 수 있어요.',park:'호수 공원: 돗자리에 누워 쉬거나 오리를 구경해요.',beach:'바닷가: 조개껍데기를 찾아보세요!',
  glamp:'꼭대기 빈터: 여기에 글램핑장을 지어요.',road:'운전 중! 도로를 따라가면 대회장이에요.',arena:'대회장: 연습하고 대회에 나가요.'};
function firstVisitTip(){const A=G&&G.area;if(!A)return;const id=A.kind==='home'?'home':A.kind==='town'?'town':A.place;if(!id||!VISIT_TIP[id])return;SV.seen=SV.seen||{};if(SV.seen[id])return;SV.seen[id]=1;setTimeout(()=>{if(G)tip('v_'+id,VISIT_TIP[id]);},900);}
const _startGame0=startGame;startGame=function(fresh){const isNew=fresh||!SV.today;_startGame0(fresh);applyMyLook();setTimeout(()=>{if(typeof pregenZones==='function')pregenZones();},2500);
  if(isNew&&!isMP()){G.ov=null;openDialog({name:'이야기',id:'dami',lines:['따뜻한 봄날, 작은 마을로 이사 온 첫날이에요.','상자 사이에서 꼬리를 흔드는 아기 강아지 담이. 오늘부터 우리 둘의 산책 일기가 시작돼요!','담이를 잘 먹이고, 씻기고, 함께 걸으며 마을 친구들을 만나 봐요.','언젠가는 뒷산 꼭대기에 우리만의 글램핑장도… 🏕️'],
    cb:()=>openDialog({name:'담이',id:'dami',lines:['멍! (좋은 아침이에요!)','오늘도 같이 산책 가요? 먼저 밥그릇이랑 물그릇부터 채워 주세요~','[H] 상태, [T] 할 일, [I] 상태창, [M] 지도예요!']})});}};

// ---------- 정기검진 (동물병원, 7일마다) ----------
const _talk0=talk;talk=function(n){if(n.id==='vet'&&!SV.sick&&SV.day>=(SV.lastCheck||0)+7){openMenu({title:'🏥 콩닥 동물병원',items:[{label:'🩺 정기검진 받기 (30 뼈다귀) · 건강 체크',dis:SV.coins<30,fn:()=>{SV.coins-=30;SV.lastCheck=SV.day;addSt('mood',10);gainAff(2);closeOv();
    openDialog({name:'수의사 서연',P:NPCS.vet.P,id:'vet',lines:['정기검진 결과, 담이는 아주 건강해요!','주워 먹기만 조심하면 돼요. 다음 검진은 일주일 뒤에 와요~']});logDay('동물병원에서 정기검진을 받았다. 건강 최고!');save();}},{label:'그냥 이야기하기',fn:()=>{closeOv();_talk0(n);}},{label:'닫기',fn:closeOv}]});return;}_talk0(n);};

// ---------- 눈 오는 날 (겨울) ----------
const _events0=eventsForDay;eventsForDay=function(d){const ev=_events0(d);if(season()==='겨울'&&!ev.includes('rain')&&strSeed('snow'+d)%10<4)ev.push('snow');return ev;};
function drawSnow(t){const A=G&&G.area;if(!A||!A.outdoor||!SV.today.events.includes('snow'))return;ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<70;i++){const x=(hash(i,1,7)*VW+Math.sin(t+i)*12+t*8)%VW,y=(hash(i,2,7)*VH+t*(18+hash(i,3,7)*20))%VH;ctx.fillRect(x,y,2,2);}}

// ---------- 가게 물건 그림 미리보기 (펫샵·인테리어 상점) ----------
function shopPreview(it,x,y){if(!it||!(it.acc||it.ic||it.deco))return;if(x+64>VW)x=VW-66;panel(x,y,62,62,'#fffaf0');
  if(it.deco){const im=decoImg(it.deco),k=Math.min(2,48/Math.max(im.width,im.height));ctx.drawImage(im,Math.round(x+31-im.width*k/2),Math.round(y+34-im.height*k/2),im.width*k,im.height*k);}
  else if(it.acc){const im=pupImg(DAMI_P,'dami','down',0,'happy',it.acc);ctx.drawImage(im,x+3,y+6,56,50);}
  else{ctx.save();ctx.translate(x+19,y+19);ctx.scale(2.4,2.4);drawItemIcon(it.ic,0,0);ctx.restore();}}
