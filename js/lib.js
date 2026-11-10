"use strict";
// ===== 공용 라이브러리 (v2에서 가져옴) =====
// ---------- 난수 ----------
let seed=1;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const R=(a,b)=>a+rnd()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),lerp=(a,b,k)=>a+(b-a)*k;
function hash(x,y,s){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,982451653);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
// ---------- 소리: 부드러운 칩튠 ----------
let AC=null,MG=null,muted=false;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=.55;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;MG.connect(lp).connect(AC.destination);}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,d=.15,type='triangle',v=.08,at=0,f2=null,att=.01){const a=ac();if(!a||muted)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(MG);o.start(t);o.stop(t+d+.05);}
const mid=n=>440*Math.pow(2,(n-69)/12);
const SFX={
  call(){tone(mid(76),.18,'sine',.09);tone(mid(81),.3,'sine',.09,.14);},
  pet(){[84,88,91].forEach((n,i)=>tone(mid(n),.35,'sine',.05,i*.09));},
  heart(){[72,76,79,84].forEach((n,i)=>tone(mid(n),.3,'triangle',.06,i*.07));},
  sniff(){[79,81,83].forEach((n,i)=>tone(mid(n),.08,'triangle',.05,i*.1));},
  pick(){[88,91,96].forEach((n,i)=>tone(mid(n),.18,'sine',.05,i*.06));},
  clover(){[72,76,79,83,86].forEach((n,i)=>tone(mid(n),.4,'sine',.05,i*.08));},
  eat(){tone(520,.06,'triangle',.07);tone(470,.06,'triangle',.07,.1);},
  yelp(){tone(1250,.12,'triangle',.07,0,800);tone(1150,.16,'triangle',.06,.13,650);},
  woof(){tone(260,.12,'triangle',.07,0,180);},
  alert(){tone(mid(88),.08,'sine',.04);},
  step(){tone(140+Math.random()*30,.04,'sine',.02);},
  bird(){tone(2400,.05,'sine',.03,0,3000);tone(2600,.05,'sine',.03,.07,3200);},
  sel(){tone(mid(84),.08,'sine',.05);},
  clear(){[72,76,79,84,79,84,88].forEach((n,i)=>tone(mid(n),.45,'triangle',.06,i*.13));},
  soft(){[76,74,72].forEach((n,i)=>tone(mid(n),.5,'sine',.05,i*.25));}
};
// 배경음: Cmaj7-Am7-Fmaj7-G6 느린 아르페지오
const CH=[[48,64,67,71,76],[45,60,64,67,72],[41,57,60,64,69],[43,59,62,64,71]];
const MEL=[76,0,79,0,81,79,76,0, 72,0,74,76,74,0,0,0, 72,0,74,0,76,74,72,69, 71,0,72,74,0,0,0,0];
let musicOn=false,mStep=0,mNext=0;
function musicTick(){const a=AC;if(!a||muted||!musicOn)return;const spb=60/80/2;if(mNext<a.currentTime)mNext=a.currentTime+.05;
  while(mNext<a.currentTime+.25){const bar=Math.floor(mStep/8)%4,c=CH[bar],st=mStep%8,at=mNext-a.currentTime;
    if(st===0)tone(mid(c[0]),spb*7,'sine',.05,at,null,.05);
    tone(mid(c[1+(st%4)]),spb*1.8,'triangle',.022,at,null,.02);
    const m=MEL[mStep%32];if(m)tone(mid(m),spb*2.2,'sine',.035,at,null,.03);
    mStep++;mNext+=spb;}}
setInterval(musicTick,60);
function mk(w,h,fn){const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);const g=c.getContext('2d',{willReadFrequently:true});fn(g);return c;}
function ell(g,cx,cy,rx,ry,col){if(rx<=0||ry<=0)return;g.fillStyle=col;const y0=Math.ceil(-ry),y1=Math.floor(ry);for(let y=y0;y<=y1;y++){const k=1-(y*y)/(ry*ry);if(k<0)continue;const hw=rx*Math.sqrt(k);g.fillRect(Math.round(cx-hw),Math.round(cy+y),Math.max(1,Math.round(hw*2)),1);}}
function rc(g,x,y,w,h,col){g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
// 모양 목록 → 외곽선 패스 후 채우기 (픽셀아트 실루엣)
function shapes(g,base,over,det,OL){
  const outl=q=>{if(q.e)ell(g,q.x,q.y,q.rx+1,q.ry+1,OL);else rc(g,q.x-1,q.y-1,q.w+2,q.h+2,OL);};
  const fill=q=>{if(q.e)ell(g,q.x,q.y,q.rx,q.ry,q.c);else rc(g,q.x,q.y,q.w,q.h,q.c);};
  base.forEach(outl);base.forEach(fill);over.forEach(q=>{outl(q);fill(q);});det.forEach(fill);}
const SPR={};
function spr(key,fn){return SPR[key]||(SPR[key]=fn());}
// ---------- 계절·테마 ----------
const SEASONS={
  봄:{grass:['#6aaf4c','#7cbf56','#90cd64'],blade:'#579a3d',bladeL:'#a6dc7a',tree:{OL:'#2f5a2c',d:'#4f9a45',m:'#67b552',l:'#8fd06a'},fall:'#f7c6d9',cherry:true},
  여름:{grass:['#58a645','#69b64f','#7dc55b'],blade:'#478f37',bladeL:'#97d26f',tree:{OL:'#23462a',d:'#3d7f3f',m:'#529b48',l:'#74b95a'},fall:null},
  가을:{grass:['#98a957','#a9b862','#bbc56f'],blade:'#83924a',bladeL:'#cfd58a',tree:{OL:'#5a2e1c',d:'#c0522e',m:'#e07b39',l:'#f2a94e'},fall:'#e98a3c',maple:true}
};
const THEMES={
  street:{name:'동네 골목길',dest:'동네 놀이터',goal:'slide',path:{type:'stone',b:'#d8d0c0',m:'#b9ae99',l:'#e9e2d4',e:'#9b8f7b'},birds:true,houses:true,obj:[['tree',.035],['bush',.05],['flowerbed',.015]],tall:.2,sniff:['lamp','pole','flowers']},
  mountain:{name:'뒷산 숲길',dest:'정상 쉼터',goal:'pavilion',path:{type:'dirt',b:'#c49a63',m:'#ae854f',l:'#d8b27c',e:'#8f6b3d'},obj:[['pine',.09],['tree',.05],['rock',.04],['stump',.02],['mushroom',.025],['fern',.04]],tall:.6,sniff:['stump','mushroom','flowers']},
  park:{name:'호수 공원',dest:'분수대',goal:'fountain',path:{type:'stone',b:'#e3cda1',m:'#c8ae80',l:'#f0dfba',e:'#a98d5f'},pond:true,birds:true,ducks:true,obj:[['tree',.05],['bush',.04],['flowerbed',.02]],tall:.3,sniff:['flowers','flowers','lamp']},
  river:{name:'강변 산책길',dest:'강변 벤치',goal:'bench',path:{type:'stone',b:'#bfc2c8',m:'#a2a6ae',l:'#d3d6db',e:'#80848c'},river:true,ducks:true,obj:[['tree',.035],['reed',.02],['bush',.03]],tall:.35,sniff:['flowers','reed','lamp']}
};
const TIMES=[{n:'아침',w:2,mul:'#fff1d8',a:.25},{n:'낮',w:3,mul:null},{n:'노을',w:2,mul:'#ffbf8a',a:.45},{n:'저녁',w:2,mul:'#8f93d6',a:.55,night:true}];
const SIDEP={b:'#b58d5a',m:'#9f7948',l:'#c9a26c',e:'#7f5f37'};
// ---------- 소품 스프라이트 ----------
function buildTree(kind,sea,sd){
  const save=seed;seed=sd;
  const c=mk(36,48,g=>{
    rc(g,15,27,7,17,'#3e2a1c');rc(g,16,27,5,17,'#7a5236');rc(g,19,27,2,17,'#5e3e28');rc(g,13,42,11,3,'#3e2a1c');rc(g,14,42,9,2,'#7a5236');
    if(kind==='pine'){const p={OL:'#1e3d2a',d:'#2f6b45',m:'#3f8556',l:'#5aa36a'};
      for(let pass=0;pass<2;pass++)for(let i=0;i<4;i++){const ty=3+i*7,hw=6+i*3.2,hh=12;for(let r=0;r<hh;r++){const w=hw*(r/hh)+1;if(pass===0)rc(g,18-w-1,ty+r,w*2+2,1,p.OL);else{rc(g,18-w,ty+r,w*2,1,p.d);rc(g,18-w,ty+r,w*.9,1,p.m);if(r<4)rc(g,18-w+1,ty+r,Math.max(1,w*.4),1,p.l);}}if(pass===0)rc(g,18-hw-1,ty+hh,hw*2+2,1,p.OL);}
    }else{const p=kind==='cherry'?{OL:'#7a3a52',d:'#e58fb0',m:'#f4b0c8',l:'#ffd9e6'}:kind==='maple'?{OL:'#5a2414',d:'#b8402a',m:'#d9603a',l:'#f19a4a'}:sea.tree;
      const cs=[[18,16,12],[9,21,7.5],[27,21,7.5],[18,25,8.5],[12,10,7.5],[24,10,7.5],[18,7,7]].map(([x,y,r])=>[x+R(-1,1),y+R(-1,1),r+R(-.5,.5)]);
      cs.forEach(([x,y,r])=>ell(g,x,y,r+1,r+1,p.OL));cs.forEach(([x,y,r])=>ell(g,x,y,r,r,p.d));
      cs.forEach(([x,y,r])=>ell(g,x-1,y-2,r-2.2,r-2.4,p.m));
      cs.slice(4).concat([cs[0]]).forEach(([x,y,r])=>ell(g,x-3,y-4,r*.42,r*.36,p.l));
      for(let i=0;i<40;i++){const x=RI(6,30),y=RI(2,30);const d=g.getImageData(x,y,1,1).data;if(d[3]>0&&hex(p.OL).join()!==[d[0],d[1],d[2]].join())rc(g,x,y,1,1,rnd()<.5?p.l:p.d);}
      if(kind==='cherry')for(let i=0;i<10;i++)rc(g,RI(8,28),RI(4,28),1,1,'#ffffff');
    }});
  seed=save;return c;}
function buildObj(kind,v=0){
  switch(kind){
  case 'bush':return mk(22,16,g=>{const cs=[[11,9,7],[6,10,4.5],[16,10,4.5],[11,6,5]];cs.forEach(([x,y,r])=>ell(g,x,y,r+1,r*.8+1,'#244a26'));cs.forEach(([x,y,r])=>ell(g,x,y,r,r*.8,'#3e8a3e'));cs.forEach(([x,y,r])=>ell(g,x-1,y-1.5,r*.6,r*.45,'#5fae55'));if(v){[[6,8],[14,7],[11,11],[17,11]].forEach(([x,y])=>{rc(g,x,y,2,2,v===1?'#ef6f7c':'#f7d64a');rc(g,x,y,1,1,'#fff');});}});
  case 'rock':return mk(20,14,g=>{ell(g,10,8,9,5.5,'#4c4f56');ell(g,10,7.5,8,4.6,'#8d929a');ell(g,8,6,4.5,2.4,'#b6bbc2');rc(g,6,5,2,1,'#d6dade');ell(g,13,10,4,1.4,'#767b84');});
  case 'stump':return mk(18,14,g=>{ell(g,9,10,8,3.5,'#3e2a1c');rc(g,2,5,14,6,'#3e2a1c');rc(g,3,5,12,6,'#7a5236');ell(g,9,5,7,2.6,'#3e2a1c');ell(g,9,5,6,2,'#d8b07a');ell(g,9,5,3,1,'#b98a54');rc(g,5,7,1,4,'#5e3e28');rc(g,11,7,1,4,'#5e3e28');});
  case 'mushroom':return mk(14,12,g=>{[[4,6],[10,8]].forEach(([x,y],i)=>{rc(g,x-1,y,3,4,'#3e2a1c');rc(g,x,y,1,3,'#f6ead3');ell(g,x,y-1,4-i,2.6-i*.5,'#5a1a14');ell(g,x,y-1.4,3-i,1.8-i*.4,'#d8423a');rc(g,x-1,y-2,1,1,'#fff');rc(g,x+1,y-3,1,1,'#fff');});});
  case 'fern':return mk(16,12,g=>{for(let i=0;i<5;i++){const a=-1.2+i*.6;for(let r=0;r<8;r++)rc(g,8+Math.sin(a)*r,11-Math.cos(a)*r*.9,1,1,r>5?'#7cc36a':'#3f8a3c');}});
  case 'reed':return mk(14,22,g=>{for(let i=0;i<5;i++){const x=2+i*2.5,h=12+(i%3)*3;rc(g,x,21-h,1,h,'#5f7f32');rc(g,x,20-h,1,4,'#8a5a2e');rc(g,x+1,16-h/2,1,1,'#7fa046');}});
  case 'flowerbed':return mk(30,14,g=>{rc(g,0,4,30,10,'#5b3b26');rc(g,1,5,28,8,'#a8673e');rc(g,1,5,28,2,'#c48555');rc(g,3,3,24,4,'#3d6f30');for(let i=0;i<9;i++){const x=3+i*3,y=1+(i%2)*2;rc(g,x,y+2,1,2,'#2d6b2a');rc(g,x-1,y,3,2,['#ef6f7c','#f7d64a','#ffffff','#b48cf2'][i%4]);rc(g,x,y,1,1,'#fff6c8');}});
  case 'flowers':return mk(18,12,g=>{const cs=['#f7d64a','#ef8fb6','#ffffff','#b48cf2','#ff9f5a'];for(let i=0;i<7;i++){const x=2+i*2.3,y=2+(i%3)*2.5;rc(g,x+1,y+2,1,4,'#2d6b2a');rc(g,x,y,3,3,cs[(i+v)%5]);rc(g,x+1,y+1,1,1,'#fff3b0');}rc(g,0,10,18,2,'rgba(0,0,0,.12)');});
  case 'lamp':return mk(10,34,g=>{rc(g,3,8,4,24,'#22352f');rc(g,4,8,2,24,'#3d5a50');rc(g,2,30,6,3,'#22352f');rc(g,1,1,8,8,'#22352f');rc(g,2,2,6,5,'#ffe9a8');rc(g,2,2,6,1,'#fff8d8');rc(g,3,0,4,1,'#22352f');});
  case 'pole':return mk(10,34,g=>{rc(g,3,2,4,31,'#5b4a3a');rc(g,4,2,2,31,'#806a54');rc(g,0,4,10,2,'#5b4a3a');rc(g,2,10,6,5,'#f2efe6');rc(g,3,11,4,1,'#e05a4a');rc(g,3,13,4,1,'#8a8a8a');});
  case 'bench':return mk(32,20,g=>{rc(g,2,2,28,9,'#3b2617');rc(g,3,3,26,2,'#b9773f');rc(g,3,6,26,2,'#a8692f');rc(g,1,11,30,4,'#3b2617');rc(g,2,11,28,3,'#c98a4f');rc(g,3,15,2,4,'#2b2b33');rc(g,27,15,2,4,'#2b2b33');rc(g,3,1,2,10,'#2b2b33');rc(g,27,1,2,10,'#2b2b33');});
  case 'sign':return mk(16,22,g=>{rc(g,7,8,3,13,'#3e2a1c');rc(g,8,8,1,13,'#8a5f3a');rc(g,1,2,14,8,'#3e2a1c');rc(g,2,3,12,6,'#c99355');rc(g,2,3,12,1,'#e0b170');const d=v?1:-1;for(let i=0;i<5;i++)rc(g,8+d*(i-2),6,1,1,'#5b3b26');rc(g,8+d*2,5,1,3,'#5b3b26');});
  case 'mailbox':return mk(10,20,g=>{rc(g,4,9,2,10,'#3e2a1c');rc(g,0,2,10,8,'#3b2b2b');rc(g,1,3,8,6,'#d8423a');rc(g,1,3,8,1,'#f07060');rc(g,8,1,1,4,'#f7d64a');});
  case 'house':return mk(60,62,g=>{const roofs=[['#b8483c','#d9604e','#7a2a22'],['#3f6f9e','#5a8cbf','#25466a'],['#5f8f4a','#79ab5e','#3a5f2c'],['#8a5a3a','#a8724c','#55361f']][v%4];
      rc(g,6,30,48,30,'#3b2b2b');rc(g,7,31,46,28,'#f2e6cf');for(let y=34;y<59;y+=4)rc(g,7,y,46,1,'#ded0b4');
      rc(g,24,40,12,20,'#3b2b2b');rc(g,25,41,10,19,'#8a5a36');rc(g,25,41,10,2,'#a8724c');rc(g,32,50,2,2,'#f7d64a');
      for(const wx of [10,40]){rc(g,wx,38,11,10,'#3b2b2b');rc(g,wx+1,39,9,8,'#ffffff');rc(g,wx+2,40,3,3,'#9fd3f0');rc(g,wx+6,40,3,3,'#9fd3f0');rc(g,wx+2,44,3,2,'#9fd3f0');rc(g,wx+6,44,3,2,'#9fd3f0');rc(g,wx,48,11,3,'#7a4a2a');rc(g,wx+1,46,2,2,'#ef6f7c');rc(g,wx+5,46,2,2,'#f7d64a');rc(g,wx+8,46,2,2,'#ef6f7c');}
      rc(g,42,4,6,14,'#3b2b2b');rc(g,43,5,4,13,'#a36b4a');
      for(let r=0;r<26;r++){const inset=Math.max(0,8-r*.6);rc(g,1+inset-1,6+r,58-inset*2+2,1,'#2b1e1e');}
      for(let r=0;r<24;r++){const inset=Math.max(0,8-r*.6);rc(g,1+inset,7+r,58-inset*2,1,r%4===3?roofs[0][2]:roofs[0][0]);if(r%4===0)for(let x=1+inset+(r%8?3:0);x<59-inset;x+=6)rc(g,x,7+r,1,3,roofs[0][2]);}
      rc(g,9,7,42,2,roofs[0][1]);});
  case 'slide':return mk(48,44,g=>{rc(g,6,10,3,32,'#3b2b2b');rc(g,18,10,3,32,'#3b2b2b');rc(g,7,10,1,32,'#e05a4a');rc(g,19,10,1,32,'#e05a4a');for(let y=14;y<40;y+=5)rc(g,8,y,10,2,'#f7d64a');rc(g,4,8,20,4,'#3b2b2b');rc(g,5,9,18,2,'#4f9ad8');
      for(let i=0;i<26;i++){rc(g,21+i,10+i*1.1,4,3,'#3b2b2b');}for(let i=0;i<26;i++){rc(g,22+i,11+i*1.1,2,1,'#f2a33a');}rc(g,0,2,28,7,'#3b2b2b');rc(g,1,3,26,5,'#e05a4a');rc(g,1,3,26,1,'#f08070');});
  case 'pavilion':return mk(64,52,g=>{rc(g,4,16,56,4,'#3b2b2b');for(const x of [8,30,52]){rc(g,x,16,5,32,'#3b2b2b');rc(g,x+1,16,3,32,'#a33a2a');}rc(g,2,44,60,6,'#3b2b2b');rc(g,3,45,58,4,'#b98a54');rc(g,3,45,58,1,'#d8b07a');
      for(let r=0;r<16;r++){const w=30+r*2;rc(g,32-w/2-1,r+1,w+2,1,'#1e2a26');}for(let r=0;r<15;r++){const w=30+r*2;rc(g,32-w/2,r+2,w,1,r%3===0?'#2f5a4a':'#3f7a62');}rc(g,0,16,64,3,'#1e2a26');rc(g,1,16,62,2,'#c84a38');});
  case 'fountain':return mk(56,40,g=>{ell(g,28,26,27,12,'#5b5560');ell(g,28,25,25,10,'#bfb8c4');ell(g,28,25,21,7.5,'#3d8fcb');ell(g,28,24,19,6,'#5ab0e0');rc(g,25,8,6,18,'#5b5560');rc(g,26,8,4,17,'#d6d0da');ell(g,28,8,8,3,'#5b5560');ell(g,28,7.5,7,2.2,'#5ab0e0');});
  }
}
function buildFood(kind){return mk(12,10,g=>{const O='#4a2e1e';
  switch(kind){case 0:ell(g,5,5,4.5,3.5,O);ell(g,5,5,3.5,2.6,'#c97a34');ell(g,4,4,1.5,1,'#e6a35a');rc(g,8,4,3,2,O);rc(g,9,3,2,1,O);rc(g,9,6,2,1,O);rc(g,8,4,2,2,'#fff');rc(g,10,3,1,1,'#fff');rc(g,10,6,1,1,'#fff');break;
    case 1:ell(g,6,5,5.5,4,O);ell(g,6,5,4.5,3,'#e2a45a');ell(g,5,4,2.5,1.2,'#f6cf94');break;
    case 2:rc(g,1,3,10,5,O);rc(g,2,4,8,3,'#c4472f');rc(g,3,4,3,1,'#f07a5e');break;
    case 3:rc(g,5,0,1,10,'#c9a46a');[1,5].forEach(y=>{rc(g,2,y,7,3,O);rc(g,3,y+.5,5,2,'#d8423a');rc(g,3,y+.5,2,1,'#ff8d70');});break;
    default:ell(g,6,6,5,3.4,O);ell(g,6,6,4,2.4,'#f3f3f3');ell(g,6,6,2,1.4,'#e8b23a');rc(g,6,5,1,1,'#d23b2b');}});}
const CLOVER_SPR=mk(9,9,g=>{const c='#2f8a3c',l='#5fc061';[[2,2],[5,2],[2,5],[5,5]].forEach(([x,y])=>{ell(g,x+1,y+1,2,2,'#1e5a28');ell(g,x+1,y+1,1.4,1.4,c);rc(g,x,y,1,1,l);});rc(g,4,4,1,5,'#1e5a28');});
function renderGround(W,H,PW,PH,M,SD,WT,th,sea){
  const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d');const img=g.createImageData(PW,PH),d=img.data;
  const GR=sea.grass.map(hex),P=th.path,PB=hex(P.b),PM=hex(P.m),PL=hex(P.l),PE=hex(P.e),SB=hex(SIDEP.b),SM=hex(SIDEP.m),SL=hex(SIDEP.l),SE=hex(SIDEP.e);
  const W1=hex('#4aa3d8'),W2=hex('#3d8fcb'),WS=hex('#7fcfe8'),WF=hex('#d8f3fa'),SAND=hex('#e6d6a8'),SH=hex(sea.blade);
  const at=(A,x,y)=>x<0||y<0||x>=PW||y>=PH?0:A[y*PW+x];
  for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const i=y*PW+x;let col;const bay=(BAYER[y&3][x&3]/16-.5);
    if(WT[i]){if(!at(WT,x,y-1)||!at(WT,x-1,y)||!at(WT,x+1,y)||!at(WT,x,y+1))col=WF;else if(!at(WT,x,y-3)||!at(WT,x-3,y)||!at(WT,x+3,y)||!at(WT,x,y+3))col=WS;else col=vnoise(x/14,y/9,7)+bay*.2>.5?W1:W2;}
    else if(M[i]){const edge=!at(M,x-1,y)||!at(M,x+1,y)||!at(M,x,y-1)||!at(M,x,y+1);
      if(edge)col=PE;else if(P.type==='stone'){const by=Math.floor(y/6),ox=(by%2)*4,lx=(x+ox)%8,ly=y%6,bx=Math.floor((x+ox)/8);
        if(lx===0||ly===0)col=PM;else{const hv=hash(bx,by,3);col=ly===1&&lx<4?PL:hv<.25?PL:hv>.9?PM:PB;}}
      else{const n=vnoise(x/6,y/6,5)+bay*.35;col=n<.35?PM:n>.72?PL:PB;if(hash(x,y,9)<.012)col=PL;}}
    else if(SD[i]){const edge=!at(SD,x-1,y)&&!at(M,x-1,y)||!at(SD,x+1,y)&&!at(M,x+1,y)||!at(SD,x,y-1)&&!at(M,x,y-1)||!at(SD,x,y+1)&&!at(M,x,y+1);const n=vnoise(x/5,y/5,6)+bay*.35;col=edge?SE:n<.35?SM:n>.7?SL:SB;}
    else{let near=false;for(let k=1;k<=3&&!near;k++)if(at(WT,x,y-k)||at(WT,x,y+k)||at(WT,x-k,y)||at(WT,x+k,y))near=true;
      if(near)col=SAND;else{const n=vnoise(x/22,y/22,1)*.65+vnoise(x/7,y/7,2)*.35+bay*.14;col=n<.43?GR[0]:n<.6?GR[1]:GR[2];
        if(at(M,x,y-1)||at(M,x,y-2)||at(SD,x,y-1))col=SH;}}
    d[i*4]=col[0];d[i*4+1]=col[1];d[i*4+2]=col[2];d[i*4+3]=255;}
  g.putImageData(img,0,0);
  // 풀잎·꽃
  const isG=(x,y)=>{const i=Math.floor(y)*PW+Math.floor(x);return x>0&&y>0&&x<PW&&y<PH&&!M[i]&&!SD[i]&&!WT[i];};
  for(let n=0;n<PW*PH/90;n++){const x=Math.floor(rnd()*PW),y=Math.floor(rnd()*PH);if(!isG(x,y))continue;g.fillStyle=sea.blade;g.fillRect(x,y,1,2);g.fillRect(x+2,y-1,1,3);g.fillStyle=sea.bladeL;g.fillRect(x+1,y,1,1);}
  const FC=['#ffffff','#f7d64a','#ef8fb6','#b48cf2'];
  for(let n=0;n<PW*PH/700;n++){const x=Math.floor(rnd()*PW),y=Math.floor(rnd()*PH);if(!isG(x,y)||!isG(x+4,y+4))continue;const c=pick(FC);for(let k=0;k<RI(2,4);k++){const fx=x+RI(0,5),fy=y+RI(0,5);g.fillStyle='#3d7a30';g.fillRect(fx,fy+1,1,2);g.fillStyle=c;g.fillRect(fx-1,fy,3,1);g.fillRect(fx,fy-1,1,3);g.fillStyle='#fff3b0';g.fillRect(fx,fy,1,1);}}
  if(th.pond)for(let n=0;n<PW*PH/1800;n++){const x=Math.floor(rnd()*PW),y=Math.floor(rnd()*PH);if(!WT[y*PW+x]||!WT[(y+4)*PW+x+4]||!WT[(y-4)*PW+x-4])continue;ell(g,x,y,3,2,'#3f8a3c');ell(g,x,y,2,1.2,'#5fae55');if(rnd()<.3){g.fillStyle='#f7b6d0';g.fillRect(x,y-1,2,2);}}
  // 강변 자전거길 중앙 점선
  return c;}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function txt(s,x,y,col='#4a3426',size=11,align='left',font='G11',ol=null){ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='top';
  if(ol){ctx.fillStyle=ol;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[1,1]])ctx.fillText(s,x+dx,y+dy);}ctx.fillStyle=col;ctx.fillText(s,x,y);}
function panel(x,y,w,h,paper='#fbf0d6'){x=Math.round(x);y=Math.round(y);const OL='#4a2e1e',WD='#c98a4f',WL='#e0a868',WD2='#9a6232';
  px(x+2,y,w-4,h,OL);px(x,y+2,w,h-4,OL);px(x+1,y+1,w-2,h-2,OL);
  px(x+2,y+1,w-4,h-2,WD);px(x+1,y+2,w-2,h-4,WD);px(x+2,y+1,w-4,1,WL);px(x+2,y+h-2,w-4,1,WD2);
  px(x+3,y+3,w-6,h-6,'#7a4a2a');px(x+4,y+4,w-8,h-8,paper);px(x+4,y+4,w-8,1,'#fffaf0');}
function drawHeart(x,y,on){const c=on?'#ef5a6f':'#cdbba0',l=on?'#ffb3bf':'#e3d5bd',O='#4a2e1e';
  px(x+1,y,3,1,O);px(x+5,y,3,1,O);px(x,y+1,9,4,O);px(x+1,y+5,7,1,O);px(x+2,y+6,5,1,O);px(x+3,y+7,3,1,O);px(x+4,y+8,1,1,O);
  px(x+1,y+1,3,1,c);px(x+5,y+1,3,1,c);px(x+1,y+2,7,3,c);px(x+2,y+5,5,1,c);px(x+3,y+6,3,1,c);px(x+4,y+7,1,1,c);px(x+2,y+2,1,1,l);px(x+1,y+2,1,1,l);}
function wrap(s,x,y,w,col,size=9,lh=10){ctx.font=`${size}px G9`;let line='',yy=y;for(const ch of s){const t=line+ch;if(ctx.measureText(t).width>w){txt(line,x,yy,col,size,'left','G9');line=ch.trim();yy+=lh;}else line=t;}txt(line,x,yy,col,size,'left','G9');return yy+lh;}
