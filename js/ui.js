"use strict";
// ===== 화면 · 입력(키보드/터치) · 메뉴 · 메인 루프 =====
let VW=480;const VH=270,S=3,T=16;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
function fit(){const ar=innerWidth/innerHeight;const nv=clamp(Math.round(VH*ar/2)*2,420,640);if(nv!==VW||cv.width!==nv*S){VW=nv;cv.width=VW*S;cv.height=VH*S;VIG=null;}
  const s=Math.min(innerWidth/VW,innerHeight/VH);cv.style.width=Math.floor(VW*s)+'px';cv.style.height=Math.floor(VH*s)+'px';}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,300));

// ---------- 입력 ----------
const K={},JOY={x:0,y:0};
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
addEventListener('keydown',e=>{K[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();ac();if(!e.repeat)onKey(e.code);});
addEventListener('keyup',e=>{K[e.code]=false;});
function lpos(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VW,y:(e.clientY-r.top)/r.height*VH};}
let joyId=null,joyO=null;
cv.addEventListener('pointerdown',e=>{ac();const p=lpos(e);
  if(scene==='game'&&(!G.ov||G.ov.type==='agil')&&isTouch&&p.x<VW*.5){joyId=e.pointerId;joyO=p;cv.setPointerCapture(e.pointerId);return;}
  onTap(p,e);});
cv.addEventListener('pointermove',e=>{const p=lpos(e);
  if(e.pointerId===joyId){const dx=p.x-joyO.x,dy=p.y-joyO.y,l=Math.hypot(dx,dy),m=26;JOY.x=l>4?dx/Math.max(l,m):0;JOY.y=l>4?dy/Math.max(l,m):0;JOY.vx=p.x;JOY.vy=p.y;return;}
  if(G&&G.ov&&G.ov.type==='bath'&&(e.buttons||e.pointerType==='touch'))bathMove(p);});
const joyEnd=e=>{if(e.pointerId===joyId){joyId=null;JOY.x=JOY.y=0;}if(G&&G.ov&&G.ov.type==='bath')G.ov.hold=false;};
cv.addEventListener('pointerup',joyEnd);cv.addEventListener('pointercancel',joyEnd);
document.querySelectorAll('.tb').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ac();const k=b.dataset.k;
  if(navigator.vibrate)try{navigator.vibrate(8);}catch(_){}
  if(k==='A'){if(G&&G.ov&&G.ov.type==='bath')G.ov.hold=true;onKey('KeyE');}else if(k==='B')onKey(menuMode()?'Escape':'Space');else if(k==='up')onKey('ArrowUp');else if(k==='down')onKey('ArrowDown');else if(k==='todo')onKey('KeyT');else if(k==='map')onKey('KeyM');else if(k==='menu')onKey('Escape');else if(k==='full')goFull();});
  b.addEventListener('pointerup',()=>{if(G&&G.ov&&G.ov.type==='bath')G.ov.hold=false;});});
let TOUCH_ON=false;
function showTouch(on){TOUCH_ON=on&&isTouch;syncTouch(true);}
const isStandalone=()=>navigator.standalone||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||!!document.fullscreenElement;
function goFull(){const el=document.documentElement;const p=el.requestFullscreen?el.requestFullscreen({navigationUI:'hide'}):el.webkitRequestFullscreen?el.webkitRequestFullscreen():null;
  Promise.resolve(p).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{});}catch(e){}setTimeout(fit,300);}).catch(()=>{});}
function menuMode(){if(scene!=='game'||!G||!G.ov)return false;const o=G.ov;return o.type==='menu'||(o.type==='dlg'&&o.choices&&o.i===o.lines.length-1&&o.n>=o.lines[o.i].length);}
let TOUCH_SIG='';
function syncTouch(force){const mm=menuMode(),dlgCh=mm&&G.ov.type==='dlg',mini=G&&G.ov&&['fris','agil','bath'].includes(G.ov.type);
  const mapOn=!!(G&&G.ov&&['map','todo','dex','dlg'].includes(G.ov.type));const lock=!!(G&&(G.play||G.busy));const sig=[TOUCH_ON,mm,dlgCh,mini,scene,mapOn,lock].join();if(sig===TOUCH_SIG&&!force)return;TOUCH_SIG=sig;
  const show=(k,on)=>document.querySelectorAll(`.tb[data-k="${k}"]`).forEach(b=>b.style.display=on?'flex':'none');
  const play=TOUCH_ON&&scene==='game';
  show('A',play&&(!mapOn||G.ov.type==='dlg')&&!lock);show('B',play&&!dlgCh&&!mini&&!mapOn&&!lock);show('up',play&&mm);show('down',play&&mm);
  show('todo',play&&!mm&&!mapOn&&!mini&&!lock);show('map',play&&!mm&&!mapOn&&!mini&&!lock);show('menu',play&&!mm&&!mapOn&&!mini&&!lock);
  show('full',TOUCH_ON&&!!(document.fullscreenEnabled||document.webkitFullscreenEnabled)&&!isStandalone());
  const A=document.querySelector('.tb[data-k="A"]'),B=document.querySelector('.tb[data-k="B"]');
  A.textContent=mm?'선택':(G&&G.ov&&G.ov.type==='dlg')?'다음':(G&&G.ov&&G.ov.type==='fris')?'던지기·점프':(G&&G.ov&&G.ov.type==='bath')?'헹구기':'행동';B.textContent=mm?'닫기':'부르기';}

function onKey(k){
  if(k==='KeyV'){muted=!muted;SV.muted=muted;save();return;}
  const OK=k==='Enter'||k==='KeyE'||k==='KeyJ',CALL=k==='Space'||k==='KeyK',BACK=k==='Escape'||k==='KeyX'||k==='Backspace';
  if(scene==='title'){if(TCONF){if(k==='KeyY'){TCONF=false;startGame(true);}else if(k==='KeyN'||BACK)TCONF=false;return;}if(OK||CALL)startGame(false);if(k==='KeyN'&&SV.today){TCONF=true;}if(k==='KeyL'&&AUTH.user)logout();return;}
  if(scene==='login')return;
  if(scene==='diary'){if((OK||CALL)&&sceneT>1.2){scene='game';sceneT=0;musicOn=true;enterArea('home',{wake:true});showNews();}return;}
  if(scene!=='game')return;
  const ov=G.ov;
  if(ov){ovKey(ov,k,OK||CALL,BACK);return;}
  if(G.play||G.busy)return;
  if(OK)interact();else if(CALL){if(G.area.outdoor)call();else interact();}
  else if(k==='KeyT'||k==='Tab')G.ov={type:'todo'};else if(k==='KeyM')openMap(false);else if(k==='KeyF')G.ov={type:'dex',tab:0};
  else if(BACK||k==='KeyP')openPause();
}
function ovKey(ov,k,OK,BACK){
  const up=k==='ArrowUp'||k==='KeyW',dn=k==='ArrowDown'||k==='KeyS',lf=k==='ArrowLeft'||k==='KeyA',rt=k==='ArrowRight'||k==='KeyD';
  if(ov.type==='dlg'){const L=ov.lines[ov.i];if(ov.n<L.length){ov.n=L.length;return;}
    if(ov.choices&&ov.i===ov.lines.length-1){if(up)ov.sel=(ov.sel+ov.choices.length-1)%ov.choices.length;if(dn)ov.sel=(ov.sel+1)%ov.choices.length;}
    if(OK){if(ov.i<ov.lines.length-1){ov.i++;ov.n=0;SFX.sel();}else{const cb=ov.cb,s=ov.sel;G.ov=null;if(cb)cb(s);if(!G.ov&&G.queue&&G.queue.length)G.ov=G.queue.shift();}}return;}
  if(ov.type==='menu'){if(up)ov.sel=(ov.sel+ov.items.length-1)%ov.items.length;if(dn)ov.sel=(ov.sel+1)%ov.items.length;if(OK){const it=ov.items[ov.sel];if(!it.dis){SFX.sel();it.fn();}}if(BACK)closeOv();return;}
  if(ov.type==='roomform'){if(BACK)hideRoomForm();return;}
  if(ov.type==='map'){G.ov=null;return;}
  if(ov.type==='fris'){if(OK)frisAction();if(BACK)frisEnd(true);return;}
  if(ov.type==='agil'){if(BACK)agilEnd(true);return;}
  if(ov.type==='bath'){if(OK)ov.hold=true;if(BACK){G.ov=null;G.dami.state='idle';}return;}
  if(ov.type==='dex'){if(lf||rt)ov.tab=1-ov.tab;if(BACK||OK||k==='KeyF')G.ov=null;return;}
  if(BACK||OK||k==='KeyT'||k==='Tab')G.ov=null;
}
addEventListener('keyup',e=>{if(G&&G.ov&&G.ov.type==='bath'&&['Enter','KeyE','KeyJ','Space'].includes(e.code))G.ov.hold=false;});
function onTap(p){
  if(scene==='login')return;
  if(scene==='title'){if(AUTH.user&&p.x>VW-72&&p.y<26){logout();return;}if(TCONF){if(p.y>136&&p.y<162){if(p.x>VW/2-110&&p.x<VW/2-10){TCONF=false;startGame(true);}else if(p.x>VW/2+10&&p.x<VW/2+110)TCONF=false;}return;}
    if(SV.today&&p.x>VW-90&&p.y>VH-24){TCONF=true;return;}if(SV.today&&!(p.y>90&&p.y<130&&Math.abs(p.x-VW/2)<80))return;startGame(false);return;}
  if(scene==='diary'){onKey('Enter');return;}
  const ov=G&&G.ov;if(!ov){if(!isTouch)interact();return;}
  if(ov.type==='dlg'){const L=ov.lines[ov.i];if(ov.n<L.length){ov.n=L.length;return;}if(ov.choices&&ov.i===ov.lines.length-1&&ov.n>=L.length&&ov._cy){const i=Math.floor((p.y-ov._cy)/14);if(i>=0&&i<ov.choices.length){ov.sel=i;if(isTouch)SFX.sel();else onKey('Enter');}return;}onKey('Enter');return;}
  if(ov.type==='menu'&&ov._y){const i=Math.floor((p.y-ov._y)/14);if(i>=0&&i<ov.items.length){if(isTouch){ov.sel=i;SFX.sel();}else if(ov.sel===i)onKey('Enter');else ov.sel=i;}else if(p.y<ov._y-20||p.y>ov._y+ov.items.length*14+10)closeOv();return;}
  if(ov.type==='map'){G.ov=null;return;}
  if(ov.type==='fris'){frisAction();return;}
  if(ov.type==='agil'||ov.type==='roomform')return;
  if(ov.type==='bath'){bathMove(p);ov.hold=true;return;}
  G.ov=null;
}

// ---------- 오버레이 열기 ----------
function openDialog(o){const d=Object.assign({type:'dlg',i:0,n:0,sel:0},o);if(G.ov&&G.ov.type==='dlg'){(G.queue=G.queue||[]).push(d);return;}G.ov=d;}
function openMenu(o){G.ov=Object.assign({type:'menu',sel:0},o);}
function closeOv(){G.ov=null;}
async function saveNow(){closeOv();store.set(saveKey(),SV);if(!AUTH.user){toast('이 기기에 저장했어요 💾');SFX.pick();return;}toast('저장하는 중…');AUTH.saving=false;const ok=await cloudSave(true);toast(ok?'저장했어요! ☁️':'인터넷 문제로 이 기기에만 저장했어요');if(ok)SFX.pick();}
function openPause(){openMenu({title:'메뉴',items:[{label:'계속하기',fn:closeOv},{label:'저장하기',fn:saveNow},{label:'오늘 할 일',fn:()=>{G.ov={type:'todo'};}},{label:NET.ch?`친구와 산책 (방 ${NET.room})`:'친구와 산책 (멀티)',fn:openRoomMenu},{label:'친구 도감 · 보물 상자',fn:()=>{G.ov={type:'dex',tab:0};}},{label:muted?'소리 켜기':'소리 끄기',fn:()=>{muted=!muted;SV.muted=muted;save();closeOv();}},{label:'저장하고 타이틀로',fn:()=>{save(true);G.ov=null;scene='title';musicOn=false;showTouch(false);}}].concat(AUTH.user?[{label:'로그아웃',fn:()=>{save(true);logout();}}]:[])});}
const priceOf=(it,rare)=>rare?it.price:Math.round(it.price*(SV.today.events.includes('sale')?.7:1));
function openShop(rare){const list=rare?RARE_SHOP:SHOP;const items=list.map(it=>{const owned=(it.acc&&SV.acc[it.id])||(it.once&&SV[it.id]);const locked=(it.lv||1)>SV.lv;const pr=priceOf(it,rare);
  return{label:it.name+(owned?' (보유)':''),right:locked?`Lv${it.lv}`:`${pr}`,dis:owned||locked,coin:!locked,desc:it.desc,fn:()=>buy(it,rare)};});
  items.push({label:'나가기',fn:closeOv});openMenu({title:(rare?'떠돌이 상인':'멍멍 펫샵')+(!rare&&SV.today.events.includes('sale')?' 30% 할인!':'')+`  (🦴 ${SV.coins})`,items,shop:true,rare});}
function buy(it,rare){const pr=priceOf(it,rare);if(SV.coins<pr){toast('뼈다귀가 모자라요');SFX.soft();return;}SV.coins-=pr;SFX.pick();
  if(it.id==='kibble')SV.kibble+=5;else if(it.id==='treat')SV.treats+=5;else if(it.once){SV[it.id]=1;toast(`${it.name} 구입! 산책길에서 담이 메뉴로 놀아요`);}else{SV.acc[it.id]=1;toast(`${it.name} 구입! 집 옷장에서 담이에게 입혀 줘요`);}
  save();const sel=G.ov.sel;openShop(rare);G.ov.sel=sel;}
function openWardrobe(){const items=[{label:'아무것도 안 하기',right:SV.eq?'':'✓',fn:()=>{SV.eq=null;closeOv();}}];
  for(const k of Object.keys(SV.acc))items.push({label:ACCS[k].name,right:SV.eq===k?'✓':'',fn:()=>{SV.eq=k;closeOv();SFX.heart();bubble('dami','어때요? 예뻐요?',1.6,'#d94f6a');}});
  if(items.length===1)items.push({label:'(펫샵에서 꾸미기 아이템을 사 보세요)',dis:true,fn:()=>{}});
  items.push({label:'닫기',fn:closeOv});openMenu({title:'담이 옷장',items});}
function openMap(){G.ov={type:'map'};SFX.sel();setTimeout(pregenZones,50);}
let PREGEN_BUSY=false;
function pregenZones(){if(PREGEN_BUSY)return;const todo=OUTER.filter(k=>!ZONE_CACHE[k+'_'+(k==='beach'?'sand':season())]);if(!todo.length)return;PREGEN_BUSY=true;
  const k=todo[0];setTimeout(()=>{try{const save0=seed;zoneStatic(k);seed=save0;}catch(e){console.error(e);}PREGEN_BUSY=false;if(scene==='game')setTimeout(pregenZones,300);},30);}
const BATH_NEED=[0,2,4,7,11];
const bathLv=()=>{const n=SV.bathN||0;let l=1;for(let i=1;i<BATH_NEED.length;i++)if(n>=BATH_NEED[i])l=i+1;return l;};
const BATH_TALK=[null,['싫어요!! 물 싫어!','낑낑… 놔줘요~','으앙 탈출할래!','차가워요오!'],['으으… 싫은데…','조금만 할게요…','낑…'],['참아 볼게요…','음… 괜찮은 것 같기도?'],['따뜻하다~','살살 해 주세요~'],['흐음~ 좋아요♪','보글보글 재밌다!']];
function openBath(){if(SV.today.todo.bath&&st().clean>90){toast('담이는 이미 뽀송뽀송해요');return;}const lv=bathLv();G.dami.state='bath';G.ov={type:'bath',stage:0,prog:0,sx:VW/2+60,sy:VH/2,hold:false,bub:[],t:0,lv,dx:0,tdx:0,shake:0,nx:lv>=5?99:R(.8,1.6),say:lv<=2?'싫어요!! 물 싫어!':lv>=5?'흐음~ 좋아요♪':'',sayT:2};
  toast(lv===1?'샤워 Lv1 — 담이가 샤워를 싫어해요! 도망가는 담이를 따라가며 씻겨 줘요':lv>=5?'샤워 Lv5 — 담이가 얌전히 기다려요':`샤워 Lv${lv} — 담이가 조금씩 익숙해지고 있어요`);tip('bath','샤워 타임! 스펀지를 담이 위에서 문질러 거품을 내고 → [행동]을 꾹 눌러 헹구고 → 수건으로 닦아 줘요.');}
function bathMove(p){const ov=G.ov;const dx=p.x-ov.sx,dy=p.y-ov.sy;ov.sx=p.x;ov.sy=p.y;bathRub(Math.hypot(dx,dy));}
function bathRub(m){const ov=G.ov;if(ov.stage===1)return;if(Math.hypot(ov.sx-(VW/2+ov.dx),ov.sy-(VH/2+6))<(ov.shake>0?30:46)){ov.prog+=m*.35*(.7+ov.lv*.12)*(ov.shake>0?.3:1);if(ov.stage===0&&Math.random()<.5&&ov.bub.length<160)ov.bub.push({x:ov.sx+R(-6,6),y:ov.sy+R(-6,6),r:R(2,4.5)});}}
function updBath(dt){const ov=G.ov;ov.t+=dt;
  // 레벨이 낮을수록 담이가 자주 버둥거리며 욕조 안을 피해 다님
  ov.sayT-=dt;ov.nx-=dt;if(ov.nx<=0&&ov.lv<5){ov.nx=R(1,2)*(0.7+ov.lv*.45);ov.tdx=R(-1,1)*(44-ov.lv*8);ov.shake=.5+(5-ov.lv)*.15;ov.prog=Math.max(0,ov.prog-(5-ov.lv)*2.5);ov.say=pick(BATH_TALK[ov.lv]);ov.sayT=1.6;SFX.soft();
    if(ov.stage===0)ov.bub=ov.bub.filter(()=>Math.random()>.25);for(let k=0;k<8;k++)ov.drops=(ov.drops||[]).concat([{x:VW/2+ov.dx,y:VH/2-10,vx:R(-90,90),vy:R(-90,-30),t:.6}]);}
  if(ov.lv>=5&&ov.sayT<=0&&Math.random()<dt*.3){ov.say=pick(BATH_TALK[5]);ov.sayT=1.6;}
  ov.shake=Math.max(0,ov.shake-dt);ov.dx+=(ov.tdx-ov.dx)*Math.min(1,dt*6);
  if(ov.drops){for(const p of ov.drops){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;}ov.drops=ov.drops.filter(p=>p.t>0);}const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+JOY.x,my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+JOY.y;
  if(mx||my){ov.sx=clamp(ov.sx+mx*140*dt,40,VW-40);ov.sy=clamp(ov.sy+my*140*dt,40,VH-30);bathRub(Math.hypot(mx,my)*140*dt);}
  if(ov.stage===1&&ov.hold&&ov.shake<=0){ov.prog+=dt*(30+ov.lv*6);ov.bub=ov.bub.filter(()=>Math.random()>dt*2);}
  if(ov.prog>=100){ov.prog=0;ov.stage++;SFX.heart();if(ov.stage===1)toast('이제 [행동]을 꾹 눌러 헹궈요');if(ov.stage===2){ov.bub=[];toast('수건으로 문질러 말려요');}if(ov.stage===3){G.ov=null;const l0=bathLv();SV.bathN=(SV.bathN||0)+1;bathDone();SFX.clear();const l1=bathLv();if(l1>l0){toast(`샤워 레벨 업! Lv${l1} — 담이가 조금 더 얌전해졌어요`);logDay(`샤워 레벨이 ${l1}이 되었다. 담이가 샤워에 익숙해지고 있다.`);}else toast('보송보송 샤워 완료!');}}}

// =====================================================================
//  그리기
// =====================================================================
const timeName=c=>c<9.5*60?'아침':c<17*60?'낮':c<19*60?'노을':'저녁';
const clockStr=c=>{const h=Math.floor(c/60)%24,m=Math.floor(c%60);return `${h<12?'오전':'오후'} ${((h+11)%12)+1}:${String(m).padStart(2,'0')}`;};
let VIG=null;
function drawGame(t){
  const A=G.area,cx=Math.round(G.cam.x),cy=Math.round(G.cam.y),o=G.pl,d=G.dami;
  ctx.fillStyle=A.outdoor?'#2b2233':'#2a1e18';ctx.fillRect(0,0,VW,VH);
  ctx.save();ctx.translate(-cx,-cy);
  ctx.drawImage(A.ground,0,0);
  const on=(x,y,m=40)=>x>cx-m&&x<cx+VW+m&&y>cy-m&&y<cy+VH+m+30;
  if(A.WT)for(let i=0;i<80;i++){const x=cx+hash(i,Math.floor(t*1.5),11)*VW|0,y=cy+hash(i,Math.floor(t*1.5),12)*VH|0;if(x>=0&&y>=0&&A.WT[y*A.PW+x]&&A.WT[(y+2)*A.PW+x]){const a=Math.sin(t*3+i);if(a>.3)px(x,y,a>.8?3:2,1,'#e8f8ff');}}
  if(A.sea)for(const q of A.tall){if(!on(q.x,q.y))continue;const sw=Math.sin(t*2+q.ph+q.x*.05)*1.2;const near=Math.hypot(q.x-o.x,q.y-o.y)<10||Math.hypot(q.x-d.x,q.y-d.y)<10;const s2=near?sw*2.5:sw;
    for(let k=0;k<3;k++){const bx=q.x+k*2-2,h=5+(k%2)*2;for(let r=0;r<h;r++)px(bx+s2*(r/h),q.y-r,1,1,r>h-3?A.sea.bladeL:A.sea.blade);}}
  for(const f of A.foods)if(f.alive&&on(f.x,f.y)){px(f.x-5,f.y+3,10,2,'rgba(0,0,0,.15)');ctx.drawImage(f.img,Math.round(f.x-6),Math.round(f.y-5));}
  for(const it of A.qitems)if(!it.got&&on(it.x,it.y)){const b=Math.sin(t*4)*1.5;ell(ctx,it.x,it.y+3,5,1.6,'rgba(0,0,0,.18)');drawItemIcon(it.icon,Math.round(it.x-5),Math.round(it.y-8+b));if(Math.sin(t*3+it.x)>.6){px(it.x+5,it.y-12,1,3,'#fff');px(it.x+4,it.y-11,3,1,'#fff');}}
  for(const g0 of A.digs)if(!g0.found&&(g0.revealed||Math.hypot(g0.x-d.x,g0.y-d.y)<70)&&Math.sin(t*5+g0.x)>.5){px(g0.x-1,g0.y-1,2,2,'rgba(255,250,220,.9)');if(g0.revealed){px(g0.x-4,g0.y-1,8,1,'#fff6a0');px(g0.x,g0.y-5,1,9,'#fff6a0');}}
  for(const ob of A.objs)if(ob.flat&&ob.img)ctx.drawImage(ob.img,Math.round(ob.x-ob.img.width/2),Math.round(ob.y-ob.img.height));
  // 정렬해서 그리기
  const L=[];
  for(const ob of A.objs)if(!ob.flat&&on(ob.x,ob.y,70))L.push({y:ob.y,ob});
  for(const n of A.npcs)if(on(n.x,n.y)){L.push({y:n.y,npc:n});if(n.pup)L.push({y:n.pup.y,pup:n.pup});}
  for(const dg of A.dogs)if(on(dg.x,dg.y))L.push({y:dg.y,dog:dg});
  for(const b of A.birds)if(b.alive&&on(b.x,b.y))L.push({y:b.y,bird:b});
  for(const k of A.ducks)if(on(k.x,k.y))L.push({y:k.y-6,duck:k});
  netDrawList(L);L.push({y:o.y,pl:1});if(d.state!=='bath')L.push({y:d.y,dami:1});
  if(G.ball)L.push({y:G.ball.y,ball:1});
  L.sort((a,b)=>a.y-b.y);
  for(const e of L){
    if(e.ob)drawObj(e.ob,t);
    else if(e.npc){const n=e.npc;ell(ctx,n.x,n.y,6,2,'rgba(0,0,0,.2)');const fr=n.moving?[0,1,0,3][Math.floor(n.anim)%4]:0;const im=humanImg(n.id+n.role,n.P,n.dir,fr);ctx.save();ctx.translate(Math.round(n.x),Math.round(n.y));if(n.dir==='side'&&n.face<0)ctx.scale(-1,1);ctx.drawImage(im,-10,-30);ctx.restore();
      if(n.pup&&!(G.play&&G.play.w===n)){const p=n.pup,hx=n.x+(n.dir==='side'?n.face*2:4),hy=n.y-12;for(let i=0;i<=20;i++){const k=i/20;px(lerp(hx,p.x,k),lerp(hy,p.y-8,k)+Math.sin(k*Math.PI)*4,1,1,'#6a5acd');}}
      const mark=questMark(n);if(mark){const b=Math.sin(t*4)*2;txt(mark,n.x,n.y-44+b,'#fff7c0',11,'center','G11B','#c0602a');}}
    else if(e.pup){const p=e.pup;ell(ctx,p.x,p.y,5,1.6,'rgba(0,0,0,.18)');const fr=p.moving?[0,1,0,3][Math.floor(p.anim)%4]:0;const im=pupImg(p.P,'w'+p.P.C,p.dir,fr,p.moving?'walk':'happy');ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.dir==='side'&&p.face<0)ctx.scale(-1,1);ctx.drawImage(im,-Math.round(14*p.P.s),-Math.round(21*p.P.s));ctx.restore();}
    else if(e.dog){const dg=e.dog;ell(ctx,dg.x,dg.y,13,3.5,'rgba(0,0,0,.18)');const fr=dg.sleep?0:Math.floor(dg.anim)%4;const im=pupImg(dg.P,'big'+dg.P.C,dg.sleep?'side':dg.dir,fr,dg.sleep?'sleep':'walk');
      ctx.save();ctx.translate(Math.round(dg.x),Math.round(dg.y));if((dg.sleep||dg.dir==='side')&&dg.face<0)ctx.scale(-1,1);ctx.drawImage(im,-Math.round(14*1.45),-Math.round(21*1.45));ctx.restore();
      if(dg.sleep){const z=dg.zz%2.4;txt('z',dg.x+10+z*3,dg.y-28-z*6,'rgba(255,255,255,'+(1-z/2.4)+')',9,'left','G9');}
      const q=Math.hypot(d.x-dg.x,d.y-dg.y);if(q<70){ctx.globalAlpha=Math.min(.5,(70-q)/60);ctx.strokeStyle='#ef8fb6';ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.beginPath();ctx.ellipse(dg.x,dg.y-2,dg.fear,dg.fear*.7,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}}
    else if(e.bird){const b=e.bird,f=b.fly?(Math.floor(t*12)%2):0,x=Math.round(b.x),y=Math.round(b.y),bc=b.gull?'#f4f4f4':'#5a4a46',bl=b.gull?'#c8ccd4':'#8a7a70';if(!b.fly)px(x-2,y+1,5,1,'rgba(0,0,0,.15)');px(x-2,y-3,5,3,bc);px(x-1,y-3,3,2,bl);px(x+(b.face>0?2:-3),y-4,2,2,'#5a4a46');px(x+(b.face>0?4:-4),y-3,1,1,'#e0a040');if(b.fly)px(x-3,y-5+f*3,7,1,'#5a4a46');}
    else if(e.duck){const k=e.duck,x=Math.round(k.x),y=Math.round(k.y)-6,bob=Math.sin(t*2+k.x)>0?0:1;px(x-4,y+3+bob,9,2,'#d8f3fa');px(x-4,y+bob,8,4,'#4a4a4a');px(x-3,y+bob,6,3,'#ffffff');px(x+(k.face>0?2:-4),y-3+bob,3,3,'#ffffff');px(x+(k.face>0?5:-5),y-2+bob,2,1,'#f2a33a');px(x+(k.face>0?3:-3),y-2+bob,1,1,'#222');}
    else if(e.ball){const b=G.ball;ell(ctx,b.x,b.y,3,1,'rgba(0,0,0,.2)');ell(ctx,b.x,b.y-3-b.z,3,3,'#4a2e1e');ell(ctx,b.x,b.y-3-b.z,2.2,2.2,'#c8e04a');}
    else if(e.pl){if(A.outdoor&&!G.play)drawLeash();ell(ctx,o.x,o.y,6,2,'rgba(0,0,0,.2)');const fr=o.moving?[0,1,0,3][Math.floor(o.anim)%4]:0;const im=humanImg('girl',GIRL,o.dir,fr);ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if(o.dir==='side'&&o.face<0)ctx.scale(-1,1);ctx.drawImage(im,-10,-30);ctx.restore();}
    else if(e.dami)drawDami(t);
    else if(e.peer)drawPeer(e.peer,t);else if(e.peerDog)drawPeerDog(e.peerDog);
  }
  // 진행 바
  if(['eat','sniff','dig','bowl'].includes(d.state)){const tot=d.tot&&d.state!=='bowl'?d.tot:{eat:EAT_T,sniff:2,dig:2.2,bowl:2.6}[d.state];const k=1-d.t/tot,col=d.state==='eat'?'#ef5a6f':'#7cc36a';px(d.x-10,d.y-28,20,5,'#4a2e1e');px(d.x-9,d.y-27,18,3,'#fbf0d6');px(d.x-9,d.y-27,Math.round(18*clamp(k,0,1)),3,col);}
  for(const p of G.parts){const a=clamp(p.t/.9,0,1);ctx.globalAlpha=a;
    if(p.heart){px(p.x,p.y,2,1,'#ef5a6f');px(p.x+3,p.y,2,1,'#ef5a6f');px(p.x,p.y+1,5,1,'#ef5a6f');px(p.x+1,p.y+2,3,1,'#ef5a6f');px(p.x+2,p.y+3,1,1,'#ef5a6f');}
    else if(p.note)txt('♪',p.x,p.y,'#5a8f3a',9,'center','G9');else if(p.dirt)px(p.x,p.y,2,2,'#8a6a3e');else if(p.spark)px(p.x,p.y,1,1,'#fff6a0');ctx.globalAlpha=1;}
  for(const b of G.bubbles){const e=b.who==='dami'?d:b.who==='pl'?o:b.who;if(e.nick&&!peerHere(e))continue;const top=b.who==='dami'?26:b.who==='pl'?36:(b.who.P&&b.who.P.s>1?36:38);
    ctx.font='9px G9';const w=Math.ceil(ctx.measureText(b.text).width)+10,pop=Math.min(1,(b.max-b.t)*8),x=Math.round(e.x-w/2),y=Math.round(e.y-top-13+(1-pop)*3);
    ctx.globalAlpha=Math.min(1,b.t*3);px(x+1,y,w-2,13,'#4a2e1e');px(x,y+1,w,11,'#4a2e1e');px(x+1,y+1,w-2,11,'#fffaf0');px(Math.round(e.x)-1,y+13,3,1,'#4a2e1e');px(Math.round(e.x),y+14,1,1,'#4a2e1e');txt(b.text,x+5,y+2,b.col,9,'left','G9');ctx.globalAlpha=1;}
  ctx.restore();
  drawLight(t);
  if(G.fade>0){ctx.fillStyle=`rgba(255,248,230,${G.fade})`;ctx.fillRect(0,0,VW,VH);}
  drawHUD(t);
  if(isTouch&&joyId!==null){ell(ctx,joyO.x,joyO.y,22,22,'rgba(255,255,255,.18)');ell(ctx,joyO.x+JOY.x*20,joyO.y+JOY.y*20,9,9,'rgba(255,255,255,.5)');}
}
function questMark(n){if(n.role==='villager'){const qs=SV.today.quests.filter(q=>q.giver===n.id);if(qs.some(q=>q.state==='ready'))return '?';if(qs.some(q=>q.state==='new'))return '!';}if(n.role==='recv'&&n.q.state==='active')return '!';return null;}
function drawObj(ob,t){const im=ob.img,o=G.pl,d=G.dami;
  if(ob.kind==='edgeSign'){ctx.drawImage(im,Math.round(ob.x-8),Math.round(ob.y-20));const P0=PLACES[ob.to],lock=P0.lv>SV.lv,s0=(lock?'🔒 ':'')+P0.name+(lock?` Lv${P0.lv}`:'');ctx.font='9px G9';const w=ctx.measureText(s0).width+8;px(ob.x-w/2,ob.y-34,w,12,'rgba(74,46,30,.85)');txt(s0,ob.x,ob.y-32,lock?'#d8c8b0':'#fff7e0',9,'center','G9');return;}
  if(ob.kind==='view'){const b=Math.sin(t*3)*2;if(ob.q.state==='active'){drawItemIcon('photo',ob.x-5,ob.y-16+b);txt('사진',ob.x,ob.y-28+b,'#fff',9,'center','G9','#c0602a');}return;}
  if(!im)return;
  if(ob.kind==='tree'){ell(ctx,ob.x,ob.y-1,11,3.5,'rgba(0,0,0,.18)');let a=1;for(const c of [o,d])if(c.y<ob.y-2&&Math.abs(c.x-ob.x)<16&&c.y>ob.y-46)a=.5;ctx.globalAlpha=a;ctx.drawImage(im,Math.round(ob.x-18),Math.round(ob.y-46));ctx.globalAlpha=1;return;}
  if(ob.kind==='house'){ctx.drawImage(im,Math.round(ob.x-30),Math.round(ob.y-60));if(SV.today.clock>=19*60){px(ob.x-19,ob.y-21,9,8,'rgba(255,220,130,.9)');px(ob.x+11,ob.y-21,9,8,'rgba(255,220,130,.9)');}
    if(ob.id){const qs=SV.today.quests.filter(q=>NPCS[q.giver].home===ob.id);const m=qs.some(q=>q.state==='ready')?'?':qs.some(q=>q.state==='new')?'!':null;if(m){const b=Math.sin(t*4)*2;txt(m,ob.x,ob.y-72+b,'#fff7c0',11,'center','G11B','#c0602a');}
      if(Math.hypot(o.x-ob.x,o.y-ob.y)<60){ctx.font='9px G9';const nm=HOUSE_NAME[ob.id],w=ctx.measureText(nm).width+10;px(ob.x-w/2,ob.y-6,w,12,'rgba(74,46,30,.85)');txt(nm,ob.x,ob.y-4,'#fff7e0',9,'center','G9');}}return;}
  const w=im.width,h=im.height;
  if(ob.kind==='goal'||ob.kind==='fountain'){ell(ctx,ob.x,ob.y,w/2.4,4,'rgba(0,0,0,.15)');ctx.drawImage(im,Math.round(ob.x-w/2),Math.round(ob.y-h+2));
    if(ob.anim==='fountain')for(let k=0;k<8;k++){const ph=(t*1.2+k/8)%1,ang=k/8*6.28;px(ob.x+Math.cos(ang)*ph*14,ob.y-h+8+ph*ph*14-ph*10,1,2,'#d8f3fa');}
    if(ob.kind==='goal'){const b=Math.sin(t*3)*2;px(ob.x+w/2-6,ob.y-h-12+b,1,14,'#5b3b26');px(ob.x+w/2-5,ob.y-h-12+b,8,5,'#ef5a6f');}return;}
  if(!['bowl','cushion'].includes(ob.kind))ell(ctx,ob.x,ob.y-1,w/2.6,2.5,'rgba(0,0,0,.15)');
  ctx.drawImage(im,Math.round(ob.x-w/2),Math.round(ob.y-h+2));
  if(ob.sniff&&!ob.sniff.done){const by=Math.sin(t*3+ob.x)*1.5;txt('킁',ob.x,ob.y-h-10+by,'#fffaf0',9,'center','G9','#c0602a');}
  if(ob.use==='bath'&&!SV.today.todo.bath&&SV.today.clock>=16*60){const b=Math.sin(t*4)*2;txt('!',ob.x,ob.y-h-12+b,'#fff7c0',11,'center','G11B','#5aa9e6');}
}
function drawLeash(){const o=G.pl,d=G.dami;const hand=o.dir==='side'?{x:o.x+o.face*1,y:o.y-11}:o.dir==='down'?{x:o.x+5,y:o.y-10}:{x:o.x-5,y:o.y-11};const har=d.dir==='side'?{x:d.x+d.face*2,y:d.y-12}:{x:d.x,y:d.y-11};
  const sag=G.taut?0:7;for(let i=0;i<=40;i++){const k=i/40,x=lerp(hand.x,har.x,k),y=lerp(hand.y,har.y,k)+Math.sin(k*Math.PI)*sag;px(x,y+1,1,1,'rgba(74,46,30,.5)');px(x,y,1,1,'#e45d4a');}}
function damiPose(){const d=G.dami;
  if(d.state==='trick'){if(d.t>1.8)return['down','sit'];return d.ok?['down',TRICKS[d.trick].pose]:['down','happy'];}
  if(d.state==='pet')return['down','happy'];if(d.state==='sleep')return['side','sleep'];if(d.state==='panic')return[d.dir,'scared'];
  if(['eat','bowl','treat'].includes(d.state))return['side','eat'];if(d.state==='sniff'||d.state==='dig')return['side','sniff'];
  if(!d.moving&&d.idle>1.4)return[d.dir==='up'?'down':d.dir,'sit'];return[d.dir,d.moving?'walk':'happy'];}
function drawDami(t){const d=G.dami;if(d.inv>0&&Math.floor(t*10)%3===0)return;ell(ctx,d.x,d.y,7,2.2,'rgba(0,0,0,.2)');
  const [dir,pose]=damiPose();const fr=d.moving?[0,1,0,3][Math.floor(d.anim)%4]:(d.state==='pet'?Math.floor(t*6)%2:0);
  const im=pupImg(DAMI_P,'dami',dir,fr,pose,SV.eq);ctx.save();ctx.translate(Math.round(d.x),Math.round(d.y)+(d.state==='panic'?(Math.floor(t*30)%2):0));if((dir==='side')&&d.face<0)ctx.scale(-1,1);ctx.drawImage(im,-14,-21);ctx.restore();
  if(d.state==='sleep'){const z=(t%2.4);txt('z',d.x+8+z*3,d.y-18-z*6,'rgba(255,255,255,'+(1-z/2.4)+')',9,'left','G9','rgba(80,80,120,.5)');}
  if(d.sparkle>0){d.sparkle-=1/60;if(Math.sin(t*8)>.5){px(d.x-8+Math.sin(t*3)*6,d.y-20,1,3,'#fff');px(d.x-9+Math.sin(t*3)*6,d.y-19,3,1,'#fff');}}}
function drawLight(t){const A=G.area,c=SV.today.clock,cx=Math.round(G.cam.x),cy=Math.round(G.cam.y);
  if(A.outdoor&&SV.today.events.includes('rain')){ctx.fillStyle='rgba(60,80,110,.18)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='rgba(200,220,255,.55)';for(let i=0;i<70;i++){const x=(hash(i,5,1)*VW+t*40)%VW,y=(hash(i,6,1)*VH+t*260)%VH;ctx.fillRect(x|0,y|0,1,5);}}
  let mul=null,a=0;if(A.outdoor){if(c<9*60){mul='#fff1d8';a=.25;}else if(c>=17*60&&c<19*60){mul='#ffbf8a';a=.2+.25*(c-17*60)/120;}else if(c>=19*60){mul='#8f93d6';a=.55;}}else if(c>=19*60){mul='#ffd8a8';a=.3;}
  if(mul){ctx.globalCompositeOperation='multiply';ctx.globalAlpha=a;ctx.fillStyle=mul;ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  if(A.outdoor&&c>=19*60){ctx.globalCompositeOperation='lighter';for(const l of A.lamps){const x=l.x-cx,y=l.y-cy-28;if(x<-60||x>VW+60||y<-60||y>VH+60)continue;const gr=ctx.createRadialGradient(x,y,2,x,y,44);gr.addColorStop(0,'rgba(255,210,120,.45)');gr.addColorStop(1,'rgba(255,210,120,0)');ctx.fillStyle=gr;ctx.fillRect(x-44,y-44,88,88);}ctx.globalCompositeOperation='source-over';
    for(let i=0;i<16;i++){const x=(hash(i,1,4)*VW+Math.sin(t*.7+i)*20)|0,y=(hash(i,2,4)*VH+Math.cos(t*.5+i*2)*12)|0;px(x,y,1,1,`rgba(220,255,140,${(Math.sin(t*2+i*3)+1)/2})`);}}
  if(A.outdoor&&A.sea&&A.sea.fall)for(let i=0;i<14;i++){const sp=12+hash(i,3,3)*10,x=((hash(i,1,3)*VW+t*sp)%(VW+20))-10,y=((hash(i,2,3)*VH+t*sp*.8)%(VH+20))-10,s=Math.sin(t*3+i)>0;px(x,y,s?2:1,1,A.sea.fall);px(x+(s?0:1),y+1,1,1,A.sea.fall);}
  if(!VIG){VIG=ctx.createRadialGradient(VW/2,VH/2,VH*.5,VW/2,VH/2,VW*.62);VIG.addColorStop(0,'rgba(40,20,30,0)');VIG.addColorStop(1,'rgba(40,20,30,.28)');}ctx.fillStyle=VIG;ctx.fillRect(0,0,VW,VH);}
function bar(x,y,w,v,col){px(x,y,w,4,'#4a2e1e');px(x+1,y+1,w-2,2,'#e8d8b8');px(x+1,y+1,Math.round((w-2)*clamp(v,0,1)),2,col);}
function todoList(){const T0=SV.today.todo,c=SV.today.clock;const L=[
  {ic:'kibble',t:'아침밥 주기',ok:T0.feed1},{ic:'water',t:'물 갈아 주기',ok:T0.water},{ic:'walk',t:'마을 밖 2구역 산책',ok:T0.walk,sub:T0.walk?'':`${(SV.today.visited||[]).length}/2`}];
  for(const q of SV.today.quests)if(q.state!=='new')L.push({ic:'star',t:q.title,ok:q.state==='done',ready:q.state==='ready',sub:q.state==='ready'?`→ ${NPCS[q.giver].name}`:(q.n?`${q.got}/${q.n}`:'')});
  L.push({ic:'kibble',t:'저녁밥 주기',ok:T0.feed2,eve:true},{ic:'treat',t:'간식 타임',ok:T0.treat,eve:true},{ic:'bath',t:'샤워 타임',ok:T0.bath,eve:true},{ic:'bed',t:'잠자기',ok:false,eve:true});return L;}
function drawHUD(t){
  const c=SV.today.clock;
  panel(4,4,176,58);
  txt(`DAY ${SV.day}`,12,9,'#c0602a',11,'left','G11B');txt(`${season()} · ${clockStr(c)}`,56,10,'#4a3426',9,'left','G9');
  drawItemIcon('coin',138,10);txt(`${SV.coins}`,151,10,'#4a3426',9,'left','G9');
  txt(`산책 Lv${SV.lv}`,12,24,'#4a3426',9,'left','G9');bar(58,26,40,SV.xp/XP_NEED(SV.lv),'#7cc36a');
  txt(`우정 Lv${SV.alv}`,104,24,'#d94f6a',9,'left','G9');bar(146,26,28,SV.aff/AFF_NEED(SV.alv),'#ef8fb6');
  const S0=st();[['배','hunger','#f2a33a'],['물','thirst','#5aa9e6'],['기분','mood','#ef8fb6'],['뽀송','clean','#9fd6f2']].forEach(([n,k,col],i)=>{const x=12+i*41;txt(n,x,38,'#7a5a3a',9,'left','G9');bar(x+(n.length>1?20:11),40,n.length>1?18:27,S0[k]/100,col);});
  txt(`사료 ${SV.kibble} · 간식 ${SV.treats}`,12,49,'#9a7a5a',9,'left','G9');
  netHUD();
  if(SV.sick)txt('배탈! 동물병원으로',96,49,'#d94f6a',9,'left','G9');else if(SV.today.ate)txt(`주워먹음 ${SV.today.ate}/7`,104,49,SV.today.ate>=5?'#d94f6a':'#9a7a5a',9,'left','G9');
  // 오늘 할 일
  const Ls=isTouch?[]:todoList().filter(l=>!l.ok&&(c>=15*60?true:!l.eve)).slice(0,6);
  if(Ls.length){const w=150,h=Ls.length*11+18;panel(VW-w-4,4,w,h);txt('오늘 할 일',VW-w+4,8,'#c0602a',9,'left','G11B');
    Ls.forEach((l,i)=>{const y=20+i*11;drawItemIcon(l.ic,VW-w+3,y-1);txt(l.t.length>10?l.t.slice(0,10)+'…':l.t,VW-w+16,y,l.ready?'#3d8a3a':'#4a3426',9,'left','G9');if(l.sub)txt(l.sub.slice(0,8),VW-10,y,'#9a7a5a',9,'right','G9');});}
  // 퀘스트 화살표
  const tg=questTarget();if(tg){const gx=tg.x-G.cam.x,gy=tg.y-G.cam.y;if(gx<0||gx>VW||gy<0||gy>VH){const a=Math.atan2(gy-VH/2,gx-VW/2),ax=clamp(VW/2+Math.cos(a)*220,16,VW-16),ay=clamp(VH/2+Math.sin(a)*120,70,VH-30),b=Math.sin(t*5)*2;
    ctx.save();ctx.translate(ax+Math.cos(a)*b,ay+Math.sin(a)*b);ctx.rotate(a);ctx.fillStyle='#4a2e1e';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-7);ctx.lineTo(-2,0);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.fillStyle=tg.col;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-1,0);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
    ctx.font='9px G9';const lw=ctx.measureText(tg.label).width/2+3;txt(tg.label,clamp(ax,lw,VW-lw),ay+9,'#fff',9,'center','G9','#4a2e1e');}}
  // 안내
  if(G.hint&&!G.ov){const s=(isTouch?'Ⓐ ':'[E] ')+G.hint.label;ctx.font='9px G9';const w=ctx.measureText(s).width+14;px(VW/2-w/2,VH-24,w,14,'rgba(74,46,30,.85)');txt(s,VW/2,VH-21,'#fff7e0',9,'center','G9');}
  else if(!isTouch&&!G.ov&&!G.tip)txt('이동 방향키 · E 행동 · 스페이스 부르기 · T 할 일 · M 지도 · F 도감 · Esc 메뉴',VW/2,VH-12,'#fff',9,'center','G9','#4a2e1e');
  if(G.area.thumb&&!G.ov)drawMinimap();
  if(G.toast){const a=Math.min(1,G.toast.t*2);ctx.globalAlpha=a;ctx.font='11px G11';const w=ctx.measureText(G.toast.s).width+20;panel(VW/2-w/2,68,w,22);txt(G.toast.s,VW/2,73,'#4a3426',11,'center','G11');ctx.globalAlpha=1;}
  if(G.tip&&!G.ov){const a=Math.min(1,G.tip.t*2);ctx.globalAlpha=a;const y=VH-46;panel(60,y,VW-120,42);portrait('dami',68,y+8);txt('담이',96,y+7,'#c0602a',9,'left','G11B');wrap(G.tip.text.slice(0,Math.floor(G.tip.n)),96,y+18,VW-170,'#4a3426');ctx.globalAlpha=1;}
  if(G.ov)drawOverlay(t);
}
function questTarget(){const A=G.area;
  if(A.kind==='walk'){for(const it of A.qitems)if(!it.got)return{x:it.x,y:it.y,label:it.name,col:'#ef8fb6'};for(const n of A.npcs)if(n.role==='recv'&&n.q.state==='active')return{x:n.x,y:n.y,label:n.name,col:'#ef8fb6'};
    for(const ob of A.objs)if(ob.use==='photo'&&ob.q.state==='active')return{x:ob.x,y:ob.y,label:'사진 찍기',col:'#ef8fb6'};for(const n of A.npcs)if(n.role==='host'||n.role==='merchant')return{x:n.x,y:n.y,label:n.name,col:'#ffd23f'};}
  if(A.kind==='town'){const q=SV.today.quests.find(q=>q.state==='ready');if(q){const h=TOWN_HOUSES.find(h=>h.id===NPCS[q.giver].home);return{x:h.tx*T+16,y:h.ty*T+20,label:NPCS[q.giver].name,col:'#7cc36a'};}
    const kt=SV.today.ev&&SV.today.ev.kitten;if(kt&&kt.state==='found')return{x:15*T+16,y:14*T+20,label:'복순 할머니 댁',col:'#7cc36a'};
    if(SV.today.clock>=18*60)return{x:7*T+16,y:14*T+20,label:'우리 집',col:'#ffd23f'};}
  return null;}
function portrait(id,x,y,P){px(x-1,y-1,24,24,'#4a2e1e');px(x,y,22,22,'#f2e2c4');ctx.save();ctx.beginPath();ctx.rect(x,y,22,22);ctx.clip();
  if(id==='dami')ctx.drawImage(pupImg(DAMI_P,'dami','down',0,'happy',SV.eq),x-3,y+1);else if(P){const im=humanImg('pt'+id,P,'down',0);ctx.drawImage(im,0,0,20,18,x-1,y+1,24,22);}ctx.restore();}

// ---------- 오버레이 그리기 ----------
function drawOverlay(t){const ov=G.ov;
  if(ov.type==='roomform'){ctx.fillStyle='rgba(40,25,20,.55)';ctx.fillRect(0,0,VW,VH);return;}
  if(ov.type==='dlg'){const y=VH-70;panel(30,y,VW-60,64);if(ov.P||ov.id==='dami')portrait(ov.id,40,y+10,ov.P);const tx=ov.P||ov.id==='dami'?70:42;
    txt(ov.name,tx,y+8,'#c0602a',11,'left','G11B');const L=ov.lines[ov.i];ov.n=Math.min(L.length,ov.n+1.2);wrap(L.slice(0,Math.floor(ov.n)),tx,y+24,VW-tx-50,'#4a3426',11,13);
    if(ov.choices&&ov.i===ov.lines.length-1&&ov.n>=L.length){const w=130,h=ov.choices.length*14+10,cx0=VW-w-36,cy0=y-h-2;panel(cx0,cy0,w,h);ov._cy=cy0+5;ov.choices.forEach((c,i)=>{if(i===ov.sel)px(cx0+5,cy0+5+i*14,w-10,13,'#f2d8a8');txt((i===ov.sel?'▶ ':'  ')+c,cx0+9,cy0+7+i*14,'#4a3426',9,'left','G9');});}
    else if(ov.n>=L.length&&Math.floor(t*3)%2)txt('▼',VW-48,y+48,'#c0602a',9,'left','G9');return;}
  if(ov.type==='menu'){const w=ov.shop?250:200,h=ov.items.length*14+30,x=VW/2-w/2,y=Math.max(8,VH/2-h/2);panel(x,y,w,h);txt(ov.title,x+12,y+8,'#c0602a',11,'left','G11B');ov._y=y+24;
    ov.items.forEach((it,i)=>{const yy=y+24+i*14;if(i===ov.sel)px(x+6,yy-1,w-12,13,'#f2d8a8');txt((i===ov.sel?'▶ ':'  ')+it.label,x+10,yy+1,it.dis?'#b0a08a':'#4a3426',9,'left','G9');if(it.right){if(it.coin)drawItemIcon('coin',x+w-46,yy+1);txt(it.right,x+w-12,yy+1,it.dis?'#b0a08a':'#7a5a3a',9,'right','G9');}});
    if(ov.shop){const it=ov.items[ov.sel];if(it&&it.desc)txt(it.desc,VW/2,y+h+4,'#fff',9,'center','G9','#4a2e1e');}return;}
  if(ov.type==='todo'){const L=todoList(),w=260,h=L.length*13+40,x=VW/2-w/2,y=Math.max(6,VH/2-h/2);panel(x,y,w,h);txt(`DAY ${SV.day} 오늘 할 일`,x+12,y+8,'#c0602a',11,'left','G11B');
    L.forEach((l,i)=>{const yy=y+26+i*13;px(x+12,yy,10,10,'#4a2e1e');px(x+13,yy+1,8,8,'#fffaf0');if(l.ok)txt('✓',x+17,yy-1,'#3d8a3a',11,'center','G11B');drawItemIcon(l.ic,x+26,yy);txt(l.t+(l.sub?`  ${l.sub}`:''),x+40,yy+1,l.ok?'#a89878':l.ready?'#3d8a3a':'#4a3426',9,'left','G9');if(l.eve)txt('저녁',x+w-14,yy+1,'#8a7aa8',9,'right','G9');});
    const nq=SV.today.quests.filter(q=>q.state==='new').length;txt(nq?`마을에 아직 받지 않은 부탁이 ${nq}개 있어요 (! 표시)`:'',VW/2,y+h-12,'#9a7a5a',9,'center','G9');return;}
  if(ov.type==='dex'){const w=300,h=200,x=VW/2-w/2,y=VH/2-h/2;panel(x,y,w,h);txt(ov.tab?'담이의 보물 상자':'친구 강아지 도감',x+12,y+8,'#c0602a',11,'left','G11B');txt('◀ ▶ 바꾸기',x+w-12,y+10,'#9a7a5a',9,'right','G9');
    if(!ov.tab)WALKERS.forEach((w0,i)=>{const cx0=x+20+(i%3)*94,cy0=y+30+Math.floor(i/3)*82;const met=SV.friends[w0.id];px(cx0,cy0,80,72,met?'#fff6e0':'#e6d6b6');
      if(met){ctx.drawImage(pupImg(Object.assign({s:1,K:'#1e1512',blush:'#f6b0bc'},w0.D),'dex'+w0.id,'down',0,'happy'),cx0+26,cy0+6);txt(w0.dog,cx0+40,cy0+34,'#4a3426',11,'center','G11B');txt(w0.breed,cx0+40,cy0+48,'#7a5a3a',9,'center','G9');txt(`함께 논 횟수 ${met}`,cx0+40,cy0+59,'#d94f6a',9,'center','G9');}
      else txt('???',cx0+40,cy0+30,'#b0a08a',11,'center','G11B');});
    else Object.entries(TREASURES).forEach(([k,tr],i)=>{const cx0=x+16+(i%4)*70,cy0=y+34+Math.floor(i/4)*78;const n=SV.treasure[k];px(cx0,cy0,60,66,n?'#fff6e0':'#e6d6b6');if(n){ctx.save();ctx.translate(cx0+20,cy0+10);ctx.scale(2,2);drawItemIcon(k,0,0);ctx.restore();txt(tr.name,cx0+30,cy0+38,'#4a3426',9,'center','G9');txt(`×${n}`,cx0+30,cy0+50,'#7a5a3a',9,'center','G9');}else txt('?',cx0+30,cy0+24,'#b0a08a',11,'center','G11B');});
    return;}
  if(ov.type==='map')drawMap(t,ov);
  if(ov.type==='bath')drawBath(t,ov);
  if(ov.type==='fris')drawFris(t,ov);
  if(ov.type==='agil')drawAgil(t,ov);
}
function drawBath(t,ov){updBath(1/60);ctx.fillStyle='rgba(40,25,20,.55)';ctx.fillRect(0,0,VW,VH);const x=VW/2-150,y=16,w=300,h=VH-32,w0=w;panel(x,y,w,h,'#e8f4fa');
  for(let ty=y+6;ty<y+h-6;ty+=14)for(let tx=x+6;tx<x+w-6;tx+=14)px(tx,ty,13,13,((tx+ty)/14)%2?'#ffffff':'#e0eef6');
  const cx0=VW/2,cy0=VH/2+6;
  ctx.save();ctx.translate(cx0,cy0+18);ctx.scale(3,3);ctx.drawImage(buildFurn('tub'),-20,-12);ctx.restore();
  const pose=ov.shake>0?'scared':ov.stage===0?(ov.lv>=4?'happy':'sit'):'wet';const jig=ov.shake>0?Math.sin(t*50)*2:0,hop=ov.shake>0?-Math.abs(Math.sin(t*14))*6:0;ctx.save();ctx.translate(cx0+ov.dx+jig,cy0+10+hop);ctx.scale(3,3);ctx.drawImage(pupImg(DAMI_P,'dami','down',0,pose,null),-14,-21);ctx.restore();
  ctx.save();ctx.translate(cx0,cy0+18);ctx.scale(3,3);ctx.beginPath();ctx.rect(-20,-6,40,20);ctx.clip();ell(ctx,0,1,18,9,'#ffffff');ell(ctx,0,-.4,15,6.4,'#d6eef8');ctx.restore();
  if(ov.drops)for(const p of ov.drops)px(p.x,p.y,2,3,'#7cc8f0');
  if(ov.sayT>0&&ov.say){ctx.font='9px G9';const w=Math.ceil(ctx.measureText(ov.say).width)+12,bx=clamp(cx0+ov.dx-w/2,x+6,x+w0-w-6),by=cy0-96;px(bx,by,w,16,'#4a2e1e');px(bx+1,by+1,w-2,14,'#fffaf0');txt(ov.say,bx+w/2,by+4,ov.lv<=2?'#d94f6a':'#4a3426',9,'center','G9');}
  for(const b of ov.bub){ell(ctx,b.x,b.y,b.r+1,b.r+1,'#b8dcec');ell(ctx,b.x,b.y,b.r,b.r,'#ffffff');px(b.x-b.r/2,b.y-b.r/2,1,1,'#d6eef8');}
  if(ov.stage===1&&ov.hold)for(let i=0;i<14;i++)px(cx0-30+hash(i,Math.floor(t*20),2)*60,cy0-50+((t*120+i*13)%60),1,4,'#7cc8f0');
  if(ov.stage===1){px(cx0-6,cy0-66,12,6,'#9aa0aa');px(cx0-2,cy0-80,4,14,'#9aa0aa');}
  const sx=ov.sx,sy=ov.sy;if(ov.stage===0){px(sx-8,sy-5,16,10,'#4a2e1e');px(sx-7,sy-4,14,8,'#f7d64a');px(sx-7,sy-4,14,2,'#ffe98a');}if(ov.stage===2){px(sx-10,sy-7,20,14,'#4a2e1e');px(sx-9,sy-6,18,12,'#7cc8f0');for(let k=0;k<3;k++)px(sx-9,sy-4+k*4,18,1,'#a8dcf6');}
  const names=['① 거품 내기 — 스펀지로 문질문질','② 헹구기 — [행동] 꾹 누르기','③ 말리기 — 수건으로 문질문질'];txt(names[Math.min(2,ov.stage)],VW/2,y+8,'#3a6a8a',11,'center','G11B');
  bar(VW/2-60,y+24,120,ov.prog/100,'#5aa9e6');txt(`샤워 Lv${ov.lv}`+(ov.lv<5?` (${SV.bathN||0}/${BATH_NEED[ov.lv]}번)`:' 얌전'),x+10,y+22,'#3a6a8a',9,'left','G9');txt(isTouch?'손가락으로 문질러요':'방향키로 움직여 문질러요',VW/2,y+h-16,'#5a7a8a',9,'center','G9');}

// ---------- 타이틀 ----------
let TCONF=false;
function drawTitle(t,bgOnly){
  const sky=ctx.createLinearGradient(0,0,0,VH);sky.addColorStop(0,'#f6b48a');sky.addColorStop(.55,'#ffd9a8');sky.addColorStop(1,'#fff0cf');ctx.fillStyle=sky;ctx.fillRect(0,0,VW,VH);
  ell(ctx,380,100,24,24,'#fff4d0');ell(ctx,380,100,19,19,'#fffbe8');
  for(let i=0;i<5;i++){const x=((i*120+t*5)%(VW+80))-40,y=30+i*10;ell(ctx,x,y,26,6,'#fff6e6');ell(ctx,x+9,y-4,14,6,'#fff6e6');}
  const hill=(base,amp,f,col,sp)=>{ctx.fillStyle=col;for(let x=0;x<VW;x++){const h=base+Math.sin((x+t*sp)/f)*amp+Math.sin((x+t*sp)/(f*.37))*amp*.3;ctx.fillRect(x,h,1,VH-h);}};
  hill(168,10,70,'#b9c98a',3);hill(184,8,46,'#8fb86a',7);
  for(let i=0;i<11;i++){const x=((i*53-t*14)%(VW+60)+VW+60)%(VW+60)-30;ctx.drawImage(spr('tt'+i%3,()=>buildTree(['tree','cherry','pine'][i%3],SEASONS['봄'],100+i)),x,146);}
  px(0,190,VW,80,'#7cbf56');px(0,198,VW,18,'#e3cda1');px(0,198,VW,1,'#a98d5f');px(0,215,VW,1,'#a98d5f');
  for(let x=0;x<VW;x+=10){const xx=((x-t*28)%VW+VW)%VW;px(xx,206,5,1,'#c8ae80');}
  const fr=[0,1,0,3][Math.floor(t*7)%4];
  ctx.save();ctx.translate(200,214);ctx.scale(1.5,1.5);ctx.drawImage(humanImg('girl',GIRL,'side',fr),-10,-30);ctx.restore();
  ctx.save();ctx.translate(268,214);ctx.scale(1.5,1.5);ctx.drawImage(pupImg(DAMI_P,'dami','side',fr,'happy',SV.eq),-14,-21);ctx.restore();
  for(let i=0;i<=40;i++){const k=i/40;px(lerp(203,268,k),lerp(198,196,k)+Math.sin(k*Math.PI)*6,1,1,'#e45d4a');}
  txt('담이 산책 일기',VW/2+1,30,'#8a4a2a',22,'center','G11B');txt('담이 산책 일기',VW/2,28,'#fffaf0',22,'center','G11B','#8a4a2a');
  txt('아기 말티푸 담이와 함께하는 마을 산책 생활',VW/2,58,'#8a4a2a',9,'center','G9');
  if(bgOnly)return;
  if(AUTH.enabled&&AUTH.user){txt(`🐾 ${playerName()} 님`,10,8,'#8a4a2a',9,'left','G9');panel(VW-70,4,64,20);txt('로그아웃',VW-38,9,'#4a3426',9,'center','G9');}
  if(AUTH.err)txt(AUTH.err,VW/2,250,'#d94f6a',9,'center','G9');
  if(isTouch&&!isStandalone()){const s0=(document.fullscreenEnabled||document.webkitFullscreenEnabled)?'📱 오른쪽 위 [전체화면] 또는 홈 화면에 추가하면 주소창 없이 할 수 있어요':'📱 주소창 없이 하려면: 공유 버튼 → \'홈 화면에 추가\' → 담이워크 아이콘으로 열기';ctx.font='9px G9';const w=ctx.measureText(s0).width+14;px(VW/2-w/2,236,w,14,'rgba(74,46,30,.85)');txt(s0,VW/2,239,'#fff7e0',9,'center','G9');}
  if(SV.today){panel(VW/2-70,94,140,30);txt(`이어하기 DAY ${SV.day}`,VW/2,102,'#c0602a',11,'center','G11B');
    if(!isTouch)txt('Enter 이어하기',VW/2,128,'#8a4a2a',9,'center','G9');
    txt('처음부터 다시',VW-8,VH-12,'rgba(138,74,42,.75)',9,'right','G9');
    if(TCONF){ctx.fillStyle='rgba(40,25,20,.55)';ctx.fillRect(0,0,VW,VH);panel(VW/2-120,80,240,104);txt('정말 처음부터 다시 할까요?',VW/2,92,'#c0602a',11,'center','G11B');txt(`지금까지의 기록(DAY ${SV.day})이 모두 지워져요.`,VW/2,110,'#4a3426',9,'center','G9');
      panel(VW/2-110,136,100,26,'#ffd6d6');txt('네, 지울래요',VW/2-60,143,'#d94f6a',9,'center','G11B');panel(VW/2+10,136,100,26);txt('아니요',VW/2+60,143,'#4a3426',9,'center','G11B');
      if(!isTouch)txt('Y 지우기 · N/Esc 취소',VW/2,166,'#9a7a5a',9,'center','G9');}}
  else if(Math.floor(t*1.6)%2===0)txt(isTouch?'화면을 눌러 시작':'Enter 키로 시작',VW/2,104,'#fffaf0',11,'center','G11B','#8a4a2a');
}
function startGame(fresh){SFX.sel();
  if(fresh||!SV.today){const keepMute=SV.muted;SV=JSON.parse(JSON.stringify(DEF));SV.muted=keepMute;newToday();}
  if(!SV.today.events){SV.today.events=[];SV.today.visited=[];SV.today.ev={};}
  newGameState();scene='game';sceneT=0;musicOn=true;mStep=0;showTouch(true);
  enterArea('home',{wake:!SV.today.log.length});
  if(fresh||SV.day===1&&!SV.today.log.length)openDialog({name:'담이',id:'dami',lines:['멍! (좋은 아침이에요!)','오늘도 같이 산책 가요? 먼저 밥그릇이랑 물그릇부터 채워 주세요~','할 일은 [T]나 오른쪽 위에서 볼 수 있어요.']});
  showNews();}

// ---------- 일기 ----------
function drawDiary(t){const D=G.diary;
  ctx.fillStyle='#6a4a3a';ctx.fillRect(0,0,VW,VH);
  px(18,10,VW-36,VH-20,'#3a2418');px(20,12,VW/2-21,VH-24,'#fbf3df');px(VW/2+1,12,VW/2-21,VH-24,'#fbf3df');px(VW/2-1,12,2,VH-24,'#d8c8a8');
  for(let y=40;y<VH-14;y+=13)px(VW/2+10,y,VW/2-38,1,'#e6d6b6');
  const lx=34,ly=26,lw=VW/2-50,lh=130;ctx.save();ctx.beginPath();ctx.rect(lx,ly,lw,lh);ctx.clip();
  ctx.fillStyle='#3a2f4a';ctx.fillRect(lx,ly,lw,lh);ctx.fillStyle='#c99a68';ctx.fillRect(lx,ly+70,lw,60);ctx.drawImage(buildWall('nightwin'),lx+lw/2-15,ly+16);
  ctx.drawImage(buildFurn('bed'),lx+30,ly+64);ctx.save();ctx.translate(lx+47,ly+76);ctx.drawImage(humanImg('girl',GIRL,'down',0),0,0,20,14,-10,-6,20,14);ctx.restore();
  ctx.drawImage(buildFurn('cushion'),lx+lw-70,ly+96);ctx.drawImage(pupImg(DAMI_P,'dami','side',0,'sleep',SV.eq),lx+lw-69,ly+86);
  const z=(t%2.4);txt('z',lx+lw-44+z*3,ly+86-z*6,'rgba(255,255,255,'+(1-z/2.4)+')',9,'left','G9');
  ctx.restore();px(lx-1,ly-1,lw+2,1,'#4a2e1e');px(lx-1,ly+lh,lw+2,1,'#4a2e1e');px(lx-1,ly,1,lh,'#4a2e1e');px(lx+lw,ly,1,lh,'#4a2e1e');
  ctx.globalAlpha=.7;px(lx+lw/2-14,ly-4,28,8,'#f2c6a0');ctx.globalAlpha=1;
  txt(`DAY ${D.day} · ${D.season} · 오늘 모은 뼈다귀 ${D.earned}`,lx+lw/2,ly+lh+8,'#7a5a3a',9,'center','G9');
  if(D.met.length)txt(`만난 친구: ${D.met.join(', ')}`,lx+lw/2,ly+lh+21,'#7a5a3a',9,'center','G9');
  if(D.fest){const f=D.fest;txt(`🎉 강아지 축제 장기자랑 ${f.total}점!`,lx+lw/2,ly+lh+36,'#d94f6a',9,'center','G11B');txt(`재주 ${f.tricks} · 친구 ${f.fr} · 꾸미기 ${f.acc} · 우정 Lv${f.alv}`,lx+lw/2,ly+lh+48,'#7a5a3a',9,'center','G9');}
  const rx=VW/2+12;txt(`담이의 산책 일기  DAY ${D.day}`,rx,20,'#c0602a',11,'left','G11B');
  const lines=D.log.length?D.log.slice(-6):['오늘은 집에서 푹 쉬었다.'];
  if(D.ate)lines.push(D.sick?`몰래 ${D.ate}번이나 주워 먹었다… 내일 배탈 날 것 같다.`:`몰래 ${D.ate}번 주워 먹었다… 다음엔 조심!`);if(D.yelp)lines.push(`큰 강아지 때문에 ${D.yelp}번 깜짝 놀랐다.`);
  if(D.fest)lines.unshift('오늘은 마을 강아지 축제! 담이가 무대에서 재주를 뽐냈다.');
  let yy=38;for(const l of lines.slice(0,8))yy=wrap(l,rx,yy,VW/2-44,'#4a3426',9,13);
  const items=[['kibble','아침밥',D.todo.feed1],['water','물',D.todo.water],['walk','산책',D.todo.walk],['star',`부탁 ${D.todo.quest}`,D.todo.quest>0],['kibble','저녁밥',D.todo.feed2],['treat','간식',D.todo.treat],['bath','샤워',D.todo.bath]];
  items.forEach(([ic,n,ok],i)=>{const sx=rx+4+(i%4)*52,sy=VH-74+Math.floor(i/4)*32;const pop=clamp((sceneT-.4-i*.18)*4,0,1);if(pop<=0)return;ctx.save();ctx.translate(sx+10,sy+10);ctx.rotate(i%2?-.12:.1);
    ell(ctx,0,0,11,11,ok?'#4a2e1e':'#cdbba0');ell(ctx,0,0,10,10,ok?['#ffd6e0','#d8f0c8','#d6ecff','#fff0b8'][i%4]:'#efe4cc');if(ok){drawItemIcon(ic,-5,-5);}else txt('-',0,-6,'#cdbba0',11,'center','G11B');ctx.restore();txt(n,sx+10,sy+22,ok?'#4a3426':'#b0a08a',9,'center','G9');});
  if(sceneT>1.2&&Math.floor(t*1.6)%2===0)txt(isTouch?'눌러서 다음 날':'Enter: 다음 날 아침',VW-40,VH-24,'#c0602a',9,'right','G11B');}

// ---------- 메인 루프 ----------
let last=performance.now();
function frame(now){if(isTouch)syncTouch();const dt=Math.min(.05,(now-last)/1000);last=now;sceneT+=dt;const t=now/1000;
  ctx.setTransform(S,0,0,S,0,0);ctx.imageSmoothingEnabled=false;
  try{netTick(dt);if(scene==='login')drawTitle(t,true);else if(scene==='title')drawTitle(t);else if(scene==='game'){if(!G.ov||['bath','fris','agil'].includes(G.ov.type)){if(!G.ov)update(dt);else if(G.ov.type==='fris')updFris(dt);else if(G.ov.type==='agil')updAgil(dt);}else{G.fade=Math.max(0,G.fade-dt*2);}drawGame(t);}else if(scene==='diary')drawDiary(t);}
  catch(e){console.error(e);}
  requestAnimationFrame(frame);}
// ---------- 시작: 로그인 → 저장 불러오기 → 타이틀 ----------
async function afterLogin(){let cloud=null;try{cloud=await cloudLoad();}catch(e){AUTH.err='저장을 불러오지 못했어요. 이 기기의 기록으로 시작해요.';}
  loadSave(cloud);scene='title';sceneT=0;}
async function boot(){
  fit();
  await Promise.all(['11px G11','11px G11B','9px G9','7px G7'].map(f=>document.fonts.load(f))).catch(()=>{});
  requestAnimationFrame(frame);
  bindLogin(afterLogin);
  await authInit();
  if(AUTH.enabled&&!AUTH.user){scene='login';showLogin(true,AUTH.err||'');}
  else await afterLogin();
}
async function logout(){G&&(G.ov=null);try{await netLeave(true);}catch(e){}showTouch(false);await signOut();scene='login';showLogin(true,'로그아웃했어요.');}
boot();
setInterval(()=>{if(scene==='game')save();},15000);
addEventListener('pagehide',()=>{if(scene==='game')save(true);});

// =====================================================================
//  미니맵 · 전체 지도 (실제 지형 축소판)
// =====================================================================
function drawMinimap(){const A=G.area,w=96,h=Math.round(w*A.PH/A.PW),x=6,y=isTouch?68:VH-h-22;
  px(x-2,y-2,w+4,h+4,'#4a2e1e');px(x-1,y-1,w+2,h+2,'#c98a4f');ctx.drawImage(A.thumb,x,y,w,h);
  const k=w/A.PW,o=G.pl;for(const it of A.qitems||[])if(!it.got){px(x+it.x*k-1,y+it.y*k-1,3,3,'#ef5a6f');}
  for(const g0 of A.digs||[])if(g0.revealed&&!g0.found)px(x+g0.x*k-1,y+g0.y*k-1,3,3,'#ffd23f');
  for(const n of A.npcs)px(x+n.x*k-1,y+n.y*k-1,2,2,'#5aa9e6');
  if(A.kind==='town')for(const h of TOWN_HOUSES){const m=houseMark(h.id),hx=x+(h.tx*T+16)*k,hy=y+(h.ty*T)*k;px(hx-2,hy-2,4,3,h.id==='home'?'#c0602a':'#fff7e0');if(m)txt(m,hx,hy-11,'#fff7c0',9,'center','G11B',m==='?'?'#3d8a3a':'#d94f6a');}
  netMinimap(x,y,k);px(x+o.x*k-2,y+o.y*k-2,4,4,'#4a2e1e');px(x+o.x*k-1,y+o.y*k-1,2,2,'#fff');
  txt(A.place?PLACES[A.place].name:'',x+w/2,y+h+2,'#fff',9,'center','G9','#4a2e1e');}
const HOUSE_SHORT={vet:'동물병원',home:'우리집',grandma:'할머니',bakery:'빵집',florist:'꽃집',petshop:'펫샵',kid:'도윤',coach:'훈련소',mayor:'이장님'};
function houseMark(hid){if(hid==='vet'&&SV.sick)return '!';const qs=SV.today.quests.filter(q=>NPCS[q.giver].home===hid);if(qs.some(q=>q.state==='ready'))return '?';if(qs.some(q=>q.state==='new'))return '!';
  const kt=SV.today.ev&&SV.today.ev.kitten;if(hid==='grandma'&&kt&&kt.state==='found')return '?';return null;}
function zoneArea(id){return id==='town'?TOWN_CACHE[season()]:ZONE_CACHE[id+'_'+(id==='beach'?'sand':season())];}
let WORLD_IMG=null,WORLD_SIG='';
// 9개 구역을 틈 없이 한 장으로 이어 붙인 세계 지도 (구역이 새로 그려질 때만 다시 만듦)
function worldImage(cw,ch){const sig=Object.keys(PLACES).map(id=>zoneArea(id)?1:0).join('')+cw+'x'+ch+season();if(WORLD_IMG&&sig===WORLD_SIG)return WORLD_IMG;WORLD_SIG=sig;
  WORLD_IMG=mk(cw*3,ch*3,g=>{g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.fillStyle=SEASONS[season()].grass[1];g.fillRect(0,0,cw*3,ch*3);
    for(const [id,Z] of Object.entries(PLACES)){const A=zoneArea(id);if(A&&A.thumb)g.drawImage(A.thumb,Z.gx*cw,Z.gy*ch,cw,ch);}
    // 이음새를 부드럽게: 경계마다 얇은 숲 그림자 대신 옅은 띠
    g.fillStyle='rgba(255,255,255,.06)';for(let i=1;i<3;i++){g.fillRect(i*cw-1,0,2,ch*3);g.fillRect(0,i*ch-1,cw*3,2);}});
  return WORLD_IMG;}
function drawMap(t,ov){ctx.fillStyle='rgba(40,25,20,.6)';ctx.fillRect(0,0,VW,VH);
  const W0=Math.min(VW-24,470),H0=VH-22,x0=Math.round(VW/2-W0/2),y0=11;panel(x0,y0,W0,H0,'#f4e4bf');
  txt('담이네 동네 지도',x0+12,y0+7,'#c0602a',11,'left','G11B');txt(isTouch?'아무 데나 누르면 닫혀요':'M / Esc 닫기',x0+W0-12,y0+9,'#9a7a5a',9,'right','G9');
  const mw=W0-20,mh=H0-50,cw=Math.floor(mw/3),ch=Math.floor(mh/3),gx=Math.round(x0+W0/2-cw*1.5),gy=y0+25;
  px(gx-2,gy-2,cw*3+4,ch*3+4,'#4a2e1e');ctx.drawImage(worldImage(cw,ch),gx,gy);
  const curId=G.area.kind==='town'?'town':G.area.place||'town';
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(255,250,235,.55)';ctx.lineWidth=1;
  for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(gx+i*cw+.5,gy);ctx.lineTo(gx+i*cw+.5,gy+ch*3);ctx.stroke();ctx.beginPath();ctx.moveTo(gx,gy+i*ch+.5);ctx.lineTo(gx+cw*3,gy+i*ch+.5);ctx.stroke();}ctx.restore();
  for(const [id,Z] of Object.entries(PLACES)){const cx=gx+Z.gx*cw,cy=gy+Z.gy*ch,lock=Z.lv>SV.lv,A=zoneArea(id);
    if(lock){ctx.fillStyle='rgba(235,228,215,.62)';ctx.fillRect(cx,cy,cw,ch);}
    else if(!A){ctx.fillStyle='rgba(235,228,215,.4)';ctx.fillRect(cx,cy,cw,ch);}
    const vis=(SV.today.visited||[]).includes(id),label=(lock?'🔒 ':'')+Z.name+(vis?' ✓':'');ctx.font='9px G9';const lw=ctx.measureText(label).width+8;
    const ly=id==='town'?cy+3:cy+ch/2-7;px(cx+cw/2-lw/2,ly,lw,13,id===curId?'rgba(192,96,42,.9)':'rgba(74,46,30,.78)');txt(label,cx+cw/2,ly+2,'#fff7e0',9,'center','G9');
    if(lock)txt(`산책 Lv${Z.lv}`,cx+cw/2,cy+ch/2+8,'#7a5a3a',9,'center','G9');
    if(id==='town'&&A)for(const h of TOWN_HOUSES){const hx=cx+(h.tx*T+16)/A.PW*cw,hy=cy+(h.ty*T+20)/A.PH*ch,nm=HOUSE_SHORT[h.id],m=houseMark(h.id);ctx.font='7px G7';const w=Math.ceil(ctx.measureText(nm).width)+4;
      px(hx-w/2,hy,w,9,h.id==='home'?'rgba(192,96,42,.95)':'rgba(255,250,235,.92)');txt(nm,hx,hy+1,h.id==='home'?'#fff':'#4a3426',7,'center','G7');
      if(m){const b=Math.sin(t*4)*1.5;txt(m,hx,hy-16+b,'#fff7c0',11,'center','G11B',m==='?'?'#3d8a3a':'#d94f6a');}}
    if(id===curId&&A){const k1=cw/A.PW,k2=ch/A.PH;
      for(const n of A.npcs){const col=n.role==='walker'?'#5aa9e6':n.role==='recv'?'#ef5a6f':'#ffd23f';px(cx+n.x*k1-2,cy+n.y*k2-2,4,4,'#4a2e1e');px(cx+n.x*k1-1,cy+n.y*k2-1,2,2,col);}
      for(const it of A.qitems||[])if(!it.got){const b=Math.sin(t*5)*1;txt('!',cx+it.x*k1,cy+it.y*k2-10+b,'#fff7c0',9,'center','G11B','#d94f6a');}
      for(const g0 of A.digs||[])if(g0.revealed&&!g0.found)txt('✦',cx+g0.x*k1,cy+g0.y*k2-5,'#ffd23f',9,'center','G9','#4a2e1e');
      const o=G.pl,mx=cx+o.x*k1,my=cy+o.y*k2,b=Math.sin(t*6)*1.5;ell(ctx,mx,my,5+b,5+b,'rgba(255,210,63,.7)');px(mx-2,my-2,5,5,'#4a2e1e');px(mx-1,my-1,3,3,'#fff');}
    const qs=SV.today.quests.some(q=>q.state==='active'&&q.place===id),ev=(SV.today.ev.kitten&&SV.today.ev.kitten.state==='lost'&&SV.today.ev.kitten.place===id)||(id==='park'&&SV.today.events.includes('frisbee'))||(id==='market'&&SV.today.events.includes('flea'));
    if(qs||ev){const b=Math.sin(t*4)*2;txt(qs?'!':'★',cx+cw/2+lw/2+7,(id==='town'?cy+1:cy+ch/2-9)+b,'#fff7c0',11,'center','G11B',qs?'#d94f6a':'#c0602a');}}
  txt('□ 나   ! 새 부탁·퀘스트 장소   ? 완료 보고   ★ 오늘의 이벤트   ● 파랑 친구 강아지',VW/2,y0+H0-17,'#7a5a3a',9,'center','G9');}
// =====================================================================
//  미니게임 ① 원반 놀이 (옆에서 보는 화면, [행동] 한 버튼으로)
// =====================================================================
function startFrisbee(contest){G.ov={type:'fris',contest,round:0,score:0,phase:'aim',t:0,pw:0,disc:null,dm:{x:70,y:0,vy:0},msg:'',caught:[],end:false};SFX.sel();
  tip('fris','원반 놀이! [행동]으로 힘 조절해서 던지고, 원반이 담이 머리 위로 오면 한 번 더 눌러 점프!');}
function frisAction(){const o=G.ov;if(o.end){frisEnd(false);return;}
  if(o.phase==='aim'){o.disc={x:56,y:150,vx:110+o.pw*230,vy:-70-o.pw*50};o.phase='fly';SFX.call();}
  else if(o.phase==='fly'&&o.dm.y>=0){o.dm.vy=-175;SFX.alert();}
  else if(o.phase==='res'){o.round++;if(o.round>=5){o.end=true;SFX.clear();}else{o.phase='aim';o.disc=null;o.dm={x:70,y:0,vy:0};o.msg='';}}}
function updFris(dt){const o=G.ov;o.t+=dt;if(o.end)return;
  if(o.phase==='aim'){o.pw=(Math.sin(o.t*2.6)+1)/2;return;}
  const d=o.disc,m=o.dm;if(o.phase==='fly'){d.vy+=55*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=Math.pow(.97,dt*10);
    const tx=d.x-6;m.x+=clamp(tx-m.x,-200*dt,200*dt);m.vy+=520*dt;m.y=Math.min(0,m.y+m.vy*dt);if(m.y>=0)m.vy=0;
    const headY=196+m.y-26;if(Math.abs(d.x-m.x)<16&&Math.abs(d.y-headY)<14){const air=m.y<-6,pts=Math.max(1,Math.round((d.x-56)/22))+(air?4:0);o.score+=pts;o.msg=air?`점프 캐치! +${pts}`:`캐치! +${pts}`;o.phase='res';o.caught.push(pts);SFX.heart();}
    else if(d.y>=192){o.msg='아쉽다! 놓쳤어요';o.phase='res';o.caught.push(0);SFX.soft();}}}
function frisEnd(quit){const o=G.ov;G.ov=null;if(quit&&!o.end)return;const sc=o.score;addCoins(sc);gainXP(10+Math.floor(sc/2));gainAff(2);addSt('mood',15);
  logDay(`원반 놀이에서 ${sc}점을 냈다.`);let L=[`원반 놀이 끝! ${sc}점 · 🦴 ${sc}뼈다귀`];
  if(o.contest){SV.today.ev.frisbeeDone=1;if(sc>=30){addCoins(50);gainXP(30);L.push('🏆 원반 대회 입상! 상금 50뼈다귀!');logDay('호수 공원 원반 대회에서 입상했다!');}else L.push('아깝게 입상은 못 했지만, 담이 정말 잘 뛰었어요!');}
  openDialog({name:'원반 놀이',id:'dami',lines:L});}
function drawFris(t,o){ctx.fillStyle='rgba(40,25,20,.5)';ctx.fillRect(0,0,VW,VH);const X=20,Y=14,W=VW-40,H=VH-28;panel(X,Y,W,H,'#d6eefc');
  ctx.save();ctx.beginPath();ctx.rect(X+4,Y+4,W-8,H-8);ctx.clip();const cam=o.disc?clamp(o.dm.x-140,0,600):0;ctx.translate(X+4-cam,Y+4);
  const sky=ctx.createLinearGradient(0,0,0,200);sky.addColorStop(0,'#8fd0f4');sky.addColorStop(1,'#e8f6ff');ctx.fillStyle=sky;ctx.fillRect(cam,0,W,H);
  for(let i=0;i<5;i++){const cx=(i*190+40)%1000;ell(ctx,cx,30+i%3*14,26,6,'#ffffff');}
  ctx.fillStyle='#7cbf56';ctx.fillRect(cam,196,W,60);ctx.fillStyle='#69ac48';for(let x=0;x<1000;x+=50){ctx.fillRect(x,196,2,40);txt(`${Math.round((x-56)/22)}`,x+3,200,'#3d6f30',9,'left','G9');}
  ctx.drawImage(humanImg('girl',GIRL,'side',0),36,166);
  const m=o.dm,fr=o.phase==='fly'?[0,1,0,3][Math.floor(o.t*10)%4]:0;ctx.save();ctx.translate(Math.round(m.x),Math.round(196+m.y));ctx.scale(1.4,1.4);ctx.drawImage(pupImg(DAMI_P,'dami','side',m.y<0?1:fr,m.y<0?'happy':'walk',SV.eq),-14,-21);ctx.restore();
  if(o.disc){const d=o.disc;ell(ctx,d.x,d.y,7,2.6,'#4a2e1e');ell(ctx,d.x,d.y,6,2,'#ef5a6f');ell(ctx,d.x,196,6,1.4,'rgba(0,0,0,.15)');}
  ctx.restore();
  txt(`${o.contest?'원반 대회':'원반 놀이'}  ${Math.min(o.round+1,5)}/5번째`,X+12,Y+10,'#3a6a8a',11,'left','G11B');txt(`점수 ${o.score}`,X+W-12,Y+10,'#c0602a',11,'right','G11B');
  if(o.phase==='aim'&&!o.end){txt('힘 조절 → [행동]으로 던지기',VW/2,Y+30,'#3a6a8a',9,'center','G9');bar(VW/2-60,Y+44,120,o.pw,o.pw>.8?'#ef5a6f':'#f2a33a');}
  if(o.phase==='fly')txt('원반이 담이 머리 위에 오면 [행동]으로 점프!',VW/2,Y+30,'#3a6a8a',9,'center','G9');
  if(o.phase==='res'&&!o.end){txt(o.msg,VW/2,Y+40,'#c0602a',11,'center','G11B','#fffaf0');txt('[행동] 다음 던지기',VW/2,Y+58,'#3a6a8a',9,'center','G9');}
  if(o.end){panel(VW/2-90,VH/2-30,180,60);txt(`최종 ${o.score}점!`,VW/2,VH/2-20,'#c0602a',11,'center','G11B');txt('[행동] 끝내기',VW/2,VH/2,'#4a3426',9,'center','G9');}}

// =====================================================================
//  미니게임 ② 어질리티 (조이스틱/방향키로 번호 순서대로 통과)
// =====================================================================
function startAgility(){const gates=[];const pts=[[70,60],[200,50],[330,70],[350,170],[220,180],[90,165]];for(const [x,y] of pts.sort(()=>rnd()-.5))gates.push({x:x+R(-10,10),y:y+R(-6,6)});
  G.ov={type:'agil',gates,i:0,t:30,px:240,py:120,dx:252,dy:126,done:false,face:1,anim:0,start:1.2};SFX.sel();tip('agil','번호 순서대로 콘 사이를 통과해요! 담이가 졸졸 따라와요.');}
function updAgil(dt){const o=G.ov;if(o.done)return;if(o.start>0){o.start-=dt;return;}o.t-=dt;
  const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0)+JOY.x,my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0)+JOY.y,l=Math.hypot(mx,my);
  if(l>.2){o.px=clamp(o.px+mx/l*120*dt*Math.min(1,l),20,VW-60);o.py=clamp(o.py+my/l*120*dt*Math.min(1,l),30,200);o.face=mx>0?1:mx<0?-1:o.face;o.anim+=dt*8;}
  const dd=Math.hypot(o.px-o.dx,o.py-o.dy);if(dd>14){o.dx+=(o.px-o.dx)*Math.min(1,dt*6);o.dy+=(o.py-o.dy)*Math.min(1,dt*6);}
  const g=o.gates[o.i];if(g&&Math.hypot(o.dx-g.x,o.dy-g.y)<16){o.i++;SFX.pick();if(o.i>=o.gates.length){o.done=true;agilEnd(false);}}
  if(o.t<=0&&!o.done){o.done=true;agilEnd(false);}}
function agilEnd(quit){const o=G.ov;G.ov=null;if(quit)return;const ok=o.i>=o.gates.length,tl=Math.max(0,Math.ceil(o.t));const coin=ok?10+tl*2:o.i*2;
  addCoins(coin);gainXP(ok?20:5);gainAff(ok?2:1);if(ok)for(const k of Object.keys(SV.skill))SV.skill[k]=Math.min(.97,SV.skill[k]+.02);SFX.clear();
  logDay(ok?`어질리티 코스를 ${30-tl}초 만에 완주했다!`:'어질리티 코스를 연습했다.');
  openDialog({name:NPCS.coach.name,P:NPCS.coach.P,id:'coach',lines:ok?[`완주! 기록 ${30-tl}초!`,`담이 정말 날쌔요. 상금 🦴 ${coin}뼈다귀, 모든 재주 성공률도 조금 올랐어요!`]:[`${o.i}개 통과! 다음엔 완주해 봐요.`,`연습 수당 🦴 ${coin}뼈다귀`]});}
function drawAgil(t,o){ctx.fillStyle='rgba(40,25,20,.5)';ctx.fillRect(0,0,VW,VH);panel(14,14,VW-28,VH-28,'#a8d890');
  ctx.fillStyle='#98c880';for(let y=24;y<VH-20;y+=12)ctx.fillRect(18,y,VW-36,6);
  o.gates.forEach((g,i)=>{const done=i<o.i,cur=i===o.i;ctx.drawImage(buildFurn('cone'),g.x-15,g.y-10);ctx.drawImage(buildFurn('cone'),g.x+5,g.y-10);
    if(cur){const b=Math.sin(t*6)*1.5;ell(ctx,g.x,g.y,13+b,8+b,'rgba(255,210,63,.45)');}txt(`${i+1}`,g.x,g.y-24,done?'#7a9a6a':cur?'#fff7c0':'#4a3426',11,'center','G11B',cur?'#c0602a':null);});
  const fr=Math.floor(o.anim)%4;ctx.save();ctx.translate(Math.round(o.dx),Math.round(o.dy));if(o.face<0)ctx.scale(-1,1);ctx.drawImage(pupImg(DAMI_P,'dami','side',[0,1,0,3][fr],'walk',SV.eq),-14,-21);ctx.restore();
  ctx.save();ctx.translate(Math.round(o.px),Math.round(o.py));if(o.face<0)ctx.scale(-1,1);ctx.drawImage(humanImg('girl',GIRL,'side',[0,1,0,3][fr]),-10,-30);ctx.restore();
  txt('어질리티 코스',26,20,'#3d6f30',11,'left','G11B');txt(`남은 시간 ${Math.max(0,Math.ceil(o.t))}초 · ${o.i}/${o.gates.length}`,VW-26,20,'#c0602a',11,'right','G11B');
  if(o.start>0)txt('준비… 출발!',VW/2,VH/2-8,'#fff',22,'center','G11B','#c0602a');
  if(isTouch&&joyId!==null){ell(ctx,joyO.x,joyO.y,22,22,'rgba(255,255,255,.18)');ell(ctx,joyO.x+JOY.x*20,joyO.y+JOY.y*20,9,9,'rgba(255,255,255,.5)');}}
