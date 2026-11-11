"use strict";
// ===== 챕터 1: 뒷산 꼭대기 글램핑장 짓기 + 강아지 대결(내기) =====
// 흐름: (DAY 2부터) 이장님 → 도끼·곡괭이 받기 → 뒷산 숲길 북쪽 오솔길이 열림 → 나무 베기·돌 캐기
//       → 꼭대기 빈터에서 4단계로 짓기(터 닦기 → 데크 → 집(외형 고르기) → 모닥불·강아지 놀이터) → 챕터 1 완료
// 저장: SV.mq(0 시작 전, 1 진행 중, 2 완료), SV.wood, SV.stone, SV.glamp={st,style}, SV.ch(챕터)

// ---------- 구역: 뒷산 꼭대기 빈터 (지도 3×3 밖, 뒷산 숲길 북쪽과만 연결) ----------
PLACES.glamp={name:'뒷산 꼭대기 빈터',theme:'glamp',lv:1,land:'pavilion',desc:'마을이 내려다보이는 빈터. 글램핑장을 지을 수 있어요'};
THEMES.glamp=Object.assign({},THEMES.meadow,{name:'뒷산 꼭대기 빈터',obj:[['pine',.07],['tree',.03],['rock',.04],['bush',.02]],sniff:['stump','flowers','rock'],tall:.45});
const CHOP_ZONES=['mountain','glamp','camp'],MINE_ZONES=['mountain','glamp','summit'];
const GSTAGES=[
  {name:'터 닦기',desc:'풀을 베고 땅을 평평하게',need:{stone:6,coins:20}},
  {name:'나무 데크 깔기',desc:'비가 와도 젖지 않는 바닥',need:{wood:12}},
  {name:'숙소 짓기',desc:'외형을 골라 지어요',need:{wood:16,stone:8,coins:60},style:true},
  {name:'모닥불 · 강아지 놀이터',desc:'친구 강아지들을 초대할 준비',need:{wood:10,stone:6}},
];
const GSTYLES={bell:'⛺ 벨 텐트',dome:'⚪ 돔 텐트',cabin:'🪵 통나무 오두막'};
const RES_NAME={wood:'나무',stone:'돌',coins:'뼈다귀'};
// 멀티(같이 하기)는 인원이 많을수록 재료가 더 든다(3단계에서 방 공동 건설로 바뀜)
const gScale=()=>isMP()?1+.35*Math.max(0,(MP.size||1)-1):1;
const gNeed=i=>{const n=GSTAGES[i].need,k=gScale(),o={};for(const r in n)o[r]=Math.ceil(n[r]*k);return o;};
const haveRes=r=>r==='coins'?SV.coins:(SV[r]||0);

// 빈터 준비: 가운데(허브) 주변을 비워 공사 터로 쓴다
function glampPrep(A){const [hx,hy]=A.hub;
  A.objs=A.objs.filter(o=>o!==A.landmark&&Math.hypot(o.x/T-hx,o.y/T-hy)>7);A.landmark=null;
  for(let ty=hy-6;ty<=hy+6;ty++)for(let tx=hx-8;tx<=hx+8;tx++)if(tx>1&&ty>1&&tx<A.W-2&&ty<A.H-2&&A.tile[ty*A.W+tx]!==5)A.solid[ty*A.W+tx]=0;
  A.occ.fill(0);}
// 날마다(구역에 들어올 때): 벤 나무·캔 돌 표시, 공사 터, 초대한 친구
function ch1ZoneHook(A){const cut=(SV.today.cut=SV.today.cut||{})[A.place]||[];
  A.objs=A.objs.map((o,i)=>{const si=A.staticObjs.indexOf(o);if(si<0||!cut.includes(si))return o;
    const r=resOfKind(o.kind)||'wood';return Object.assign({},o,{kind:'cut_'+r,img:CUT_IMG[r](),cutDone:true,si});});
  if(A.place==='glamp'){A.dogs=[];const x=A.hub[0]*T+8,y=A.hub[1]*T+34;
    A.objs.push(A.gsite={kind:'gsite',x,y,img:glampImg()});
    if(SV.glamp.st>=3)for(let tx=A.hub[0]-3;tx<=A.hub[0]+3;tx++)for(let ty=A.hub[1];ty<=A.hub[1]+1;ty++)A.solid[ty*A.W+tx]=1;
    const inv=SV.today.glampGuest;if(inv){const w=WALKERS.find(w=>w.id===inv);if(w){const L=[[A.hub[0]+6,A.hub[1]+4],[A.hub[0]+7,A.hub[1]+4],[A.hub[0]+8,A.hub[1]+4],[A.hub[0]+8,A.hub[1]+5],[A.hub[0]+7,A.hub[1]+5],[A.hub[0]+6,A.hub[1]+5]];addWalker(A,w,{x:L[0][0]*T+8,y:L[0][1]*T+4},{line:L,a:0,b:5});}}}}
const glampImg=()=>spr(`gsite_${SV.glamp.st}_${SV.glamp.style||''}`,()=>buildGlamp(SV.glamp.st,SV.glamp.style));

// ---------- 그림 ----------
function buildPebble(){return mk(16,10,g=>{ell(g,5,6,4,3,'#6b6458');ell(g,5,5,3,2,'#9a9488');ell(g,11,7,3,2.4,'#6b6458');ell(g,11,6,2,1.6,'#a8a296');});}
function tri(g,cx,top,bot,hw,col){for(let y=top;y<=bot;y++){const w=hw*(y-top)/(bot-top||1);rc(g,cx-w,y,w*2,1,col);}}
function buildGlamp(st,style){return mk(128,96,g=>{const cx=64,by=88;
  ell(g,cx,by-6,58,12,st>=1?'#c8a878':'#7cb35a');
  if(st===0){for(const [x,y] of [[30,80],[48,74],[70,78],[92,72],[100,82],[60,84]]){ell(g,x,y,9,6,'#3d7f3f');ell(g,x-2,y-2,6,4,'#5aa04a');}
    rc(g,cx-2,58,3,24,'#7a5232');rc(g,cx-16,52,32,14,'#4a2e1e');rc(g,cx-15,53,30,12,'#e8c890');rc(g,cx-11,57,22,2,'#7a5232');rc(g,cx-8,61,16,2,'#7a5232');return;}
  if(st>=1){for(const [x,y] of [[16,80],[112,80],[24,90],[104,90]]){rc(g,x,y-8,2,9,'#7a5232');}rc(g,16,73,96,1,'#f2e6c8');}
  if(st>=2){rc(g,18,70,92,16,'#5a3a22');rc(g,19,70,90,14,'#b07a48');for(let x=22;x<108;x+=9)rc(g,x,70,1,14,'#8a5a32');rc(g,19,70,90,2,'#d09a62');
    for(const x of [22,60,104])rc(g,x,84,3,6,'#5a3a22');}
  if(st>=3){
    if(style==='dome'){ell(g,cx,70,30,28,'#5a6470');ell(g,cx,70,29,27,'#f4f2ec');rc(g,cx-30,70,61,2,'#b07a48');
      for(const k of [-18,-6,6,18])rc(g,cx+k,46,1,24,'#d8d4cc');rc(g,cx-28,58,56,1,'#d8d4cc');rc(g,cx-22,50,44,1,'#d8d4cc');
      ell(g,cx,63,8,9,'#4a3a2a');rc(g,cx-8,63,17,7,'#4a3a2a');ell(g,cx-14,56,4,3,'#bfe6ff');ell(g,cx+14,56,4,3,'#bfe6ff');}
    else if(style==='cabin'){rc(g,cx-30,46,60,24,'#5a3a22');for(let y=47;y<70;y+=4){rc(g,cx-29,y,58,3,'#a0683a');rc(g,cx-29,y+2,58,1,'#7a4a2a');}
      tri(g,cx,26,48,38,'#4a2e1e');tri(g,cx,28,47,35,'#8a3a2a');for(let y=32;y<47;y+=4)rc(g,cx-(35*(y-28)/19),y,70*(y-28)/19,1,'#6a2a1e');
      rc(g,cx-6,54,12,16,'#4a2e1e');rc(g,cx-5,55,10,15,'#7a4a2a');rc(g,cx+3,62,1,1,'#f2d48a');rc(g,cx-24,52,10,8,'#4a2e1e');rc(g,cx-23,53,8,6,'#bfe6ff');rc(g,cx+14,52,10,8,'#4a2e1e');rc(g,cx+15,53,8,6,'#bfe6ff');
      rc(g,cx+18,30,6,12,'#6b6458');}
    else{tri(g,cx,22,70,32,'#7a6a52');tri(g,cx,24,69,30,'#f2e6cc');for(const k of [-.5,.5])for(let y=26;y<69;y++)rc(g,cx+k*30*(y-24)/45,y,1,1,'#ddd0b0');
      tri(g,cx,46,70,10,'#5a4a3a');tri(g,cx,48,70,8,'#3a2e24');rc(g,cx-1,18,2,6,'#7a5232');rc(g,cx+1,18,5,3,'#ef6f7c');}}
  if(st>=4){const fx=20,fy=86;for(const [dx,dy] of [[-4,0],[4,0],[0,2],[-2,-2],[2,-2]])ell(g,fx+dx,fy+dy,3,1.6,'#6b6458');tri(g,fx,74,84,4,'#ef8a3a');tri(g,fx,77,84,2.5,'#ffd23f');
    for(let x=96;x<=124;x+=7){rc(g,x,72,2,14,'#8a5a32');}rc(g,96,75,30,1,'#b07a48');rc(g,96,81,30,1,'#b07a48');ell(g,112,90,4,2,'#ef5a6f');
    for(let x=14;x<114;x+=10){rc(g,x,40+Math.round(Math.sin(x/16)*3),1,1,'#4a3426');rc(g,x,41+Math.round(Math.sin(x/16)*3),2,2,['#ffd23f','#ef6f7c','#7cc3c0'][(x/10|0)%3]);}}
});}

// ---------- 상호작용 ----------
function ch1Interact(c,reach){const A=G.area,o=G.pl;if(!A)return;
  for(const ob of A.objs)if(ob.onUse&&reach(ob.x,ob.y+6,ob.r||28))c.push({d:Math.hypot(o.x-ob.x,o.y-ob.y)+3,label:ob.lab,act:()=>ob.onUse(ob)});
  if(!A.outdoor)return;
  if(SV.mq>=1){
    if(CHOP_ZONES.includes(A.place))for(const ob of A.objs)if((ob.kind==='tree'||ob.kind==='pine')&&reach(ob.x,ob.y,18))c.push({d:Math.hypot(o.x-ob.x,o.y-ob.y)+4,label:'🪓 나무 베기',act:()=>gather(ob,'wood')});
    if(MINE_ZONES.includes(A.place))for(const ob of A.objs)if(ob.kind==='rock'&&reach(ob.x,ob.y,18))c.push({d:Math.hypot(o.x-ob.x,o.y-ob.y)+4,label:'⛏️ 돌 캐기',act:()=>gather(ob,'stone')});}
  natInteract(c,reach);
  if(A.gsite&&reach(A.gsite.x,A.gsite.y-14,40))c.push({d:Math.hypot(o.x-A.gsite.x,o.y-A.gsite.y)*.5,label:SV.glamp.st>=4?'⛺ 글램핑장':'🔨 글램핑장 짓기',act:openGlamp});}
function gather(ob,res){if(G.busy)return;const A=G.area,si=A.staticObjs.indexOf(ob);if(si<0)return;
  const n=RI(1,2);G.busy=.7;SV.today.clock+=res==='wood'||res==='stone'?8:4;SFX.step();
  bubble('pl',{wood:['쿵! 쿵!','영차!','나무야 고마워'],stone:['깡! 깡!','단단하다!','영차!'],fiber:['싹둑싹둑','부드러운 풀이다'],flower:['예쁘다~','향기 좋아']}[res][RI(0,1)],.9);
  setTimeout(()=>{G.busy=0;if(G.area!==A)return;SV[res]=(SV[res]||0)+n;const cut=(SV.today.cut=SV.today.cut||{});(cut[A.place]=cut[A.place]||[]).push(si);
    const i=A.objs.indexOf(ob);if(i>=0)A.objs[i]=Object.assign({},ob,{kind:'cut_'+res,img:CUT_IMG[res](),cutDone:true});
    SFX.pick();toast(`${RES_NAME[res]} +${n} (지금 ${SV[res]}개) · 내일이면 다시 자라요`);if(G.dami)bubble('dami',pick(['멍! 나도 도울래!','킁킁, 나무 냄새~','우와 힘세다!']),1.2);save();},600);}

// ---------- 이장님: 챕터 1 시작 ----------
function ch1Ready(){return SV.mq===0&&(SV.day>=2||SV.lv>=2);}
function ch1Talk(n){if(n.id!=='mayor')return false;
  if(ch1Ready()){openDialog({name:'이장님',P:NPCS.mayor.P,id:'mayor',lines:['오, 마침 잘 왔네! 부탁이 하나 있어.','뒷산 숲길 위쪽 꼭대기에 넓은 빈터가 있거든. 거기에 마을 사람들이 쉬어 갈 글램핑장을 지으면 좋겠어.','나무랑 돌은 뒷산에서 구하면 돼. 자, 이 도끼랑 곡괭이를 쓰게나.','🪓 도끼 · ⛏️ 곡괭이를 받았어요! 뒷산 숲길 북쪽 오솔길이 열렸어요.','📜 챕터 1 — 「꼭대기 글램핑장」 시작!'],
    cb:()=>{SV.mq=1;SV.tools=1;SFX.clear();logDay('이장님께 글램핑장 짓기를 부탁받았다. 도끼와 곡괭이도 받았다!');save(true);}});return true;}
  if(SV.mq===1&&rnd()<.5){const st=SV.glamp.st,nx=GSTAGES[st];openDialog({name:'이장님',P:NPCS.mayor.P,id:'mayor',lines:[`글램핑장은 잘 돼 가나? 다음은 「${nx.name}」이로군.`,'나무는 뒷산 숲길·꼭대기·캠핑장에서, 돌은 뒷산·꼭대기·정상에서 구할 수 있다네.']});return true;}
  return false;}
function ch1GateExit(to){if(to==='glamp'&&SV.mq<1){toast('수풀이 우거져서 못 지나가요. 이장님께 여쭤 볼까요?');SFX.soft();return true;}return false;}

// ---------- 짓기 메뉴 ----------
function openGlamp(){SFX.sel();const st=SV.glamp.st;
  if(st>=GSTAGES.length){const items=[{label:`🏕️ ${GSTYLES[SV.glamp.style]||'글램핑장'} — 챕터 1 완성!`,dis:true,fn:()=>{}},
      {label:'🏠 숙소 들어가기 (꾸미기)',fn:()=>{closeOv();enterGlampRoom();}},
      {label:'🌙 여기서 자기 (오늘 마무리)',fn:()=>{closeOv();goSleep();}},
      {label:SV.today.glampGuest?'🐶 오늘 초대한 친구가 놀러 왔어요':'🐶 친구 강아지 초대하기',dis:!!SV.today.glampGuest,fn:inviteGuest},
      {label:'닫기',fn:closeOv}];openMenu({title:'⛺ 꼭대기 글램핑장',items});return;}
  const S=GSTAGES[st],need=gNeed(st),ok=Object.entries(need).every(([r,v])=>haveRes(r)>=v);
  const rows=Object.entries(need).map(([r,v])=>({label:`${haveRes(r)>=v?'✅':'⬜'} ${RES_NAME[r]} ${Math.min(haveRes(r),v)}/${v}`,dis:true,fn:()=>{}}));
  openMenu({title:`🔨 ${st+1}/${GSTAGES.length}단계 · ${S.name}`,items:[...(st>=3?[{label:'🏠 숙소 들어가기 (꾸미기)',fn:()=>{closeOv();enterGlampRoom();}}]:[]),{label:S.desc+(isMP()&&gScale()>1?` (같이 하기 ${MP.size}명: 재료 ×${gScale().toFixed(2)})`:''),dis:true,fn:()=>{}},...rows,
    {label:ok?(S.style?'🏠 외형 고르고 짓기':'🔨 짓기!'):'재료가 모자라요',dis:!ok,fn:()=>{if(S.style)pickStyle();else build();}},{label:'닫기',fn:closeOv}]});}
function pickStyle(){openMenu({title:'숙소 외형 고르기',items:Object.entries(GSTYLES).map(([k,v])=>({label:v,fn:()=>{SV.glamp.style=k;build();}})).concat([{label:'뒤로',fn:openGlamp}])});}
function build(){const st=SV.glamp.st,need=gNeed(st);for(const [r,v] of Object.entries(need)){if(haveRes(r)<v){toast('재료가 모자라요');return;}}
  for(const [r,v] of Object.entries(need)){if(r==='coins')SV.coins-=v;else SV[r]-=v;}
  SV.glamp.st++;closeOv();SV.today.clock+=30;SFX.clear();G.fade=.6;const A=G.area;
  if(A.gsite){A.gsite.img=glampImg();hearts(A.gsite.x,A.gsite.y-30,6);if(SV.glamp.st>=3)for(let tx=A.hub[0]-3;tx<=A.hub[0]+3;tx++)for(let ty=A.hub[1];ty<=A.hub[1]+1;ty++)A.solid[ty*A.W+tx]=1;unstuck(false);}
  logDay(`글램핑장 「${GSTAGES[st].name}」을(를) 마쳤다!`);gainXP(20);
  if(SV.glamp.st>=GSTAGES.length){ch1Clear();return;}
  toast(`🔨 「${GSTAGES[st].name}」 완료! 다음: ${GSTAGES[SV.glamp.st].name}`);save(true);}
function ch1Clear(){SV.mq=2;SV.ch=Math.max(SV.ch||1,2);addCoins(200);gainAff(5);
  const fr=WALKERS.filter(w=>SV.friends[w.id]).slice(0,4).map(w=>w.dog);
  openDialog({name:'이장님',P:NPCS.mayor.P,id:'mayor',lines:['우와… 정말 멋진 글램핑장이 생겼구먼!',fr.length?`${fr.join(', ')}도 놀러 왔어! 모닥불 앞에서 다 같이 마시멜로를 구웠어요.`:'마을 강아지들도 곧 놀러 오겠지!','🎉 챕터 1 「꼭대기 글램핑장」 완료! 보상 뼈다귀 +200','이제 여기서 잘 수도 있고, 친구 강아지를 초대할 수도 있어요.','🚗 챕터 2 「강아지 대회」는 곧 열려요! 이 글램핑장이 출발점이 될 거예요.']});
  logDay('드디어 꼭대기 글램핑장 완성! 모닥불 앞에서 친구들과 놀았다.');save(true);}
function inviteGuest(){const fr=WALKERS.filter(w=>SV.friends[w.id]);
  if(!fr.length){openMenu({title:'초대할 친구가 없어요',items:[{label:'산책하다 만난 강아지와 친구가 되면 초대할 수 있어요',dis:true,fn:()=>{}},{label:'닫기',fn:closeOv}]});return;}
  openMenu({title:'누구를 초대할까요?',items:fr.map(w=>({label:`${w.dog} (${w.breed}) · ${w.owner}`,fn:()=>{SV.today.glampGuest=w.id;closeOv();const A=G.area;
    const L=[[A.hub[0]+6,A.hub[1]+4],[A.hub[0]+7,A.hub[1]+4],[A.hub[0]+8,A.hub[1]+4],[A.hub[0]+8,A.hub[1]+5],[A.hub[0]+7,A.hub[1]+5],[A.hub[0]+6,A.hub[1]+5]];addWalker(A,w,{x:L[0][0]*T+8,y:L[0][1]*T+4},{line:L,a:0,b:5});
    toast(`${w.dog}가 놀러 왔어요! 가서 같이 놀아요`);SFX.woof();save();}})).concat([{label:'닫기',fn:closeOv}])});}

// ---------- 할 일 목록 · 화면 ----------
function ch1Todo(){if(ch1Ready())return[{ic:'star',t:'📜 이장님께 가 보기',sub:'새 이야기!'}];
  if(SV.mq===1){const st=SV.glamp.st,need=gNeed(st),miss=Object.entries(need).filter(([r,v])=>haveRes(r)<v);
    return[{ic:'star',t:`[챕터1] ${GSTAGES[st].name}`,sub:miss.length?`${RES_NAME[miss[0][0]]} ${haveRes(miss[0][0])}/${miss[0][1]}`:'지을 수 있어요!',ready:!miss.length}];}
  return[];}
const resLine=()=>'';
// 나무·돌은 왼쪽 위 창 아래에 작은 띠로 따로 보여 준다(창 안에 넣으면 글자가 넘침)
function drawResBar(){if(!(SV.mq>=1)||(G.ov&&G.ov.type!=='deco'))return;const s=`🪵 ${SV.wood||0}  🪨 ${SV.stone||0}  🌿 ${SV.fiber||0}  🌸 ${SV.flower||0}`;ctx.font='9px G9';const w=ctx.measureText(s).width+12;panel(4,64,w,17);txt(s,10,68,'#4a3426',9,'left','G9');}

// ===== 강아지 대결 (내기) =====
const DUELS={race:{name:'🏃 달리기 경주',how:'[행동]을 빠르게 연타!'},wait:{name:'🦴 기다려 참기',how:'게이지가 차오르면 [행동]으로 진정!'},fris:{name:'🥏 원반 한 번에 물기',how:'초록 칸에서 [행동]!'}};
const dogSkill=w=>.35+(strSeed(w.id)%40)/100+Math.min(.15,(SV.friends[w.id]||0)*.02);
function openDuel(n){const w=n.w;
  openMenu({title:`${w.dog}랑 대결! 무엇으로 할까요?`,items:Object.entries(DUELS).map(([k,d])=>({label:d.name,fn:()=>pickBet(n,k)})).concat([{label:'다음에요',fn:closeOv}])});}
function pickBet(n,kind){const c=SV.coins;if(c<1){openMenu({title:'뼈다귀가 없어요',items:[{label:'걸 뼈다귀가 하나도 없어요',dis:true,fn:()=>{}},{label:'닫기',fn:closeOv}]});return;}
  const opts=[10,30,50,100,300].filter(v=>v<c);opts.push(c);
  openMenu({title:`뼈다귀를 얼마나 걸까요? (가진 것 ${c})`,items:opts.map(v=>({label:v===c?`전부 걸기 (${c})`:`${v}개`,fn:()=>startDuel(n,kind,v)})).concat([{label:'뒤로',fn:()=>openDuel(n)}])});}
function startDuel(n,kind,bet){const w=n.w,sk=dogSkill(w);SFX.sel();
  const o={type:'duel',kind,w,n,bet,sk,ph:'ready',t:0,cd:3,res:null};
  if(kind==='race'){o.me=0;o.op=0;o.v=0;o.opv=7.2+sk*4.2;}
  if(kind==='wait'){o.g=10;o.cool=0;o.brk=5+sk*12+R(-2,2);o.goal=16;o.surge=0;}
  if(kind==='fris'){o.m=0;o.dir=1;o.spd=.9+sk*.5;o.z=R(.25,.75);o.zw=.16;o.opHit=rnd()<.3+sk*.45;}
  G.ov=o;}
function updDuel(dt){const o=G.ov;o.t+=dt;
  if(o.ph==='ready'){o.cd-=dt;if(o.cd<=0){o.ph='go';o.t=0;SFX.woof();}return;}
  if(o.ph!=='go')return;
  if(o.kind==='race'){o.v=Math.max(0,o.v-dt*14);o.me+=o.v*dt;o.op+=(o.opv+Math.sin(o.t*2.3)*1.5)*dt;
    if(o.me>=100||o.op>=100)duelEnd(o.me>=o.op?'win':'lose');}
  if(o.kind==='wait'){o.cool=Math.max(0,o.cool-dt);o.surge-=dt;if(o.surge<=0){o.surge=R(.6,1.6);o.rate=R(4,22);}o.g+=o.rate*dt;
    if(o.g>=100){duelEnd('lose');return;}if(o.t>=o.brk){duelEnd('win');return;}if(o.t>=o.goal)duelEnd('draw');}
  if(o.kind==='fris'){o.m+=o.dir*o.spd*dt*(1+o.t*.15);if(o.m>1){o.m=1;o.dir=-1;}if(o.m<0){o.m=0;o.dir=1;}if(o.t>8)duelAct();}}
function duelAct(){const o=G.ov;if(!o||o.type!=='duel')return;
  if(o.ph==='done'){closeOv();return;}if(o.ph!=='go')return;
  if(o.kind==='race'){o.v=Math.min(o.v+5.5,26);SFX.step();}
  if(o.kind==='wait'){if(o.cool>0){o.g+=6;bubble('pl','(너무 보채면 더 흥분해요)',.8);}else{o.g=Math.max(0,o.g-26);o.cool=.35;SFX.soft();}}
  if(o.kind==='fris'){const hit=Math.abs(o.m-o.z)<=o.zw/2;o.myHit=hit;duelEnd(hit&&!o.opHit?'win':!hit&&o.opHit?'lose':'draw');}}
function duelEnd(r){const o=G.ov;o.ph='done';o.res=r;const w=o.w;
  if(r==='win'){addCoins(o.bet);SFX.clear();gainAff(1);logDay(`${w.dog}랑 ${DUELS[o.kind].name.slice(2)} 대결에서 이겼다! 뼈다귀 ${o.bet}개를 받았다.`);}
  else if(r==='lose'){SV.coins=Math.max(0,SV.coins-o.bet);SFX.soft();logDay(`${w.dog}랑 ${DUELS[o.kind].name.slice(2)} 대결에서 졌다… 뼈다귀 ${o.bet}개를 줬다.`);}
  else SFX.sel();
  save();}
function drawDuel(t){const o=G.ov,w=o.w,X=VW/2-170,Y=VH/2-80,W0=340,H0=160;
  ctx.fillStyle='rgba(30,20,15,.55)';ctx.fillRect(0,0,VW,VH);panel(X,Y,W0,H0);
  txt(`${DUELS[o.kind].name} · 담이 vs ${w.dog} · 🦴${o.bet}`,VW/2,Y+8,'#c0602a',11,'center','G11B');
  const dp=(P,key,x,y,pose,fr,flip)=>{const im=pupImg(P,key,'side',fr,pose,key==='dami'?SV.eq:null);ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.drawImage(im,-14,-21);ctx.restore();};
  const WP=Object.assign({s:1,K:'#1e1512',blush:'#f6b0bc'},w.D),fr=Math.floor(t*10)%4;
  if(o.kind==='race'){for(const [i,y] of [[0,Y+62],[1,Y+102]]){px(X+20,y,W0-40,3,'#c8a878');px(X+W0-34,y-26,2,30,'#ef5a6f');}
    dp(DAMI_P,'dami',X+30+o.me/100*(W0-70),Y+60,'walk',o.ph==='go'&&o.v>1?[0,1,0,3][fr]:0);dp(WP,'w_'+w.id,X+30+o.op/100*(W0-70),Y+100,'walk',o.ph==='go'?[0,1,0,3][fr]:0);
    txt('담이',X+14,Y+44,'#4a3426',9,'left','G9');txt(w.dog,X+14,Y+84,'#4a3426',9,'left','G9');}
  if(o.kind==='wait'){drawItemIcon('treat',VW/2-5,Y+70);dp(DAMI_P,'dami',VW/2-60,Y+92,o.res==='lose'?'happy':'sit',0);dp(WP,'w_'+w.id,VW/2+60,Y+92,o.res==='win'?'happy':'sit',0,true);
    px(X+30,Y+112,120,8,'#4a2e1e');px(X+31,Y+113,118*clamp(o.g/100,0,1),6,o.g>75?'#ef5a6f':o.g>45?'#f2a33a':'#7cc36a');txt('담이 흥분 게이지',X+30,Y+100,'#7a5a3a',9,'left','G9');
    txt(`${Math.max(0,Math.ceil(o.goal-(o.ph==='go'?o.t:0)))}초`,X+W0-30,Y+100,'#4a3426',11,'right','G11B');}
  if(o.kind==='fris'){const bx=X+40,bw=W0-80,by=Y+96;px(bx,by,bw,10,'#4a2e1e');px(bx+1,by+1,bw-2,8,'#e8d8b8');px(bx+(o.z-o.zw/2)*bw,by+1,o.zw*bw,8,'#7cc36a');px(bx+o.m*bw-1,by-4,3,18,'#c0602a');
    dp(DAMI_P,'dami',VW/2-40,Y+76,o.res?(o.myHit?'happy':'sit'):'walk',0);dp(WP,'w_'+w.id,VW/2+40,Y+76,o.res?(o.opHit?'happy':'sit'):'walk',0,true);}
  if(o.ph==='ready')txt(o.cd>2?'준비…':o.cd>1?'2':'1',VW/2,Y+30,'#3a6a8a',11,'center','G11B');
  else if(o.ph==='go')txt(DUELS[o.kind].how,VW/2,Y+30,'#3a6a8a',9,'center','G9');
  else{const m=o.res==='win'?`🎉 이겼어요! 뼈다귀 +${o.bet}`:o.res==='lose'?`😢 졌어요… 뼈다귀 -${o.bet}`:'🤝 비겼어요! 뼈다귀는 그대로';
    if(o.kind==='fris')txt(`담이 ${o.myHit?'성공!':'놓침'} · ${w.dog} ${o.opHit?'성공!':'놓침'}`,VW/2,Y+124,'#4a3426',9,'center','G9');
    txt(m,VW/2,Y+30,o.res==='win'?'#3d8a3a':o.res==='lose'?'#d94f6a':'#4a3426',11,'center','G11B');txt(isTouch?'눌러서 닫기':'[행동] 닫기',VW/2,Y+H0-16,'#9a7a5a',9,'center','G9');}}
