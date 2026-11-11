"use strict";
// ===== 마을 건물 다시 그리기 (색만이 아니라 모양·크기·지붕이 다 다르게) =====
// 그림 아래 가운데가 문(입구)이 되도록 그린다. 크기는 건물마다 다르다.
const BO='#3a2618';
function bx(g,x,y,w,h,c){rc(g,x,y,w,h,BO);rc(g,x+1,y+1,w-2,h-2,c);}
function gable(g,cx,top,bot,hw,c,c2){for(let y=top;y<=bot;y++){const w=Math.round(hw*(y-top)/(bot-top||1))+1;rc(g,cx-w-1,y,w*2+2,1,BO);rc(g,cx-w,y,w*2,1,(y-top)%4===0?c2:c);}}
function winB(g,x,y,w,h,glass){bx(g,x,y,w,h,'#f6efe0');rc(g,x+2,y+2,w-4,h-4,glass||'#9fd2f0');rc(g,x+2,y+2,w-4,2,'#d8f0ff');}
function doorB(g,cx,bot,w,h,c){bx(g,cx-w/2,bot-h,w,h,c);rc(g,cx+w/2-4,bot-h/2,2,2,'#ffd23f');}
function emo(g,s,x,y,sz){g.font=(sz||9)+'px sans-serif';g.textAlign='center';g.textBaseline='top';g.fillText(s,x,y);}
const BUILD={
  // 우리 집: 뾰족 지붕 오두막 + 굴뚝 + 동그란 창 + 강아지 집
  home:{w:66,h:64,draw(g){gable(g,30,4,24,28,'#d8584a','#ef7a6a');rc(g,42,2,6,12,BO);rc(g,43,3,4,10,'#a8784a');
    bx(g,6,24,48,38,'#fff1d6');for(let y=28;y<60;y+=5)rc(g,7,y,46,1,'#f0dcb8');ell(g,30,32,5,5,BO);ell(g,30,32,4,4,'#9fd2f0');
    winB(g,10,36,10,10);winB(g,40,36,10,10);doorB(g,30,62,12,18,'#b07a48');
    gable(g,59,44,52,7,'#4a7ab0','#6a9ad0');bx(g,53,52,13,11,'#e8c99c');rc(g,57,56,5,7,BO);}},
  // 복순 할머니 댁: 한옥 (넓고 낮은 기와지붕, 끝이 위로 들림, 나무 기둥, 창호지 문)
  grandma:{w:76,h:58,draw(g){for(let y=6;y<22;y++){const k=(y-6)/16,w=Math.round(22+k*16);rc(g,38-w-1,y,w*2+2,1,BO);rc(g,38-w,y,w*2,1,y%3===0?'#55606e':'#3e4a5a');}
    rc(g,0,20,76,3,BO);rc(g,1,20,74,2,'#55606e');rc(g,0,17,4,4,'#3e4a5a');rc(g,72,17,4,4,'#3e4a5a');   // 들린 처마 끝
    bx(g,8,23,60,30,'#f4ead6');for(const x of [8,22,36,52,66])rc(g,x,23,3,30,'#7a5232');
    for(const x of [11,25,40,55]){rc(g,x,28,10,18,BO);rc(g,x+1,29,8,16,'#fbf6e8');for(let i=0;i<3;i++){rc(g,x+1,32+i*5,8,1,'#c8b896');}rc(g,x+5,29,1,16,'#c8b896');}
    bx(g,4,52,68,6,'#a8a296');rc(g,30,54,16,4,'#8a8478');}},
  // 몽글 빵집: 가게 간판 + 큰 진열창(빵) + 줄무늬 차양 + 굴뚝 김
  bakery:{w:68,h:68,draw(g){bx(g,6,10,56,56,'#f6dcb4');bx(g,4,4,60,10,'#8a5a32');emo(g,'🥐 BAKERY',34,5,7);rc(g,48,0,6,6,BO);rc(g,49,0,4,5,'#a8a296');
    for(let i=0;i<8;i++){rc(g,6+i*7,22,7,7,i%2?'#fffaf0':'#e0604a');rc(g,6+i*7,29,7,2,i%2?'#e8e0d0':'#b84a3a');}
    bx(g,9,33,30,20,'#fffaf0');rc(g,10,34,28,18,'#ffe8b8');for(const [x,c] of [[15,'#d89040'],[23,'#c07830'],[31,'#e0a858']]){ell(g,x,46,4,3,c);ell(g,x,43,3,2,'#f0c080');}rc(g,10,49,28,3,'#a8784a');
    doorB(g,50,66,14,24,'#c0884a');winB(g,46,44,8,8,'#ffe8b8');}},
  // 하린 꽃집: 유리 온실 (초록 창살, 안에 화분) + 꽃 진열대
  florist:{w:70,h:62,draw(g){for(let y=6;y<26;y++){const w=Math.round(4+(y-6)*1.5);rc(g,35-w-1,y,w*2+2,1,BO);rc(g,35-w,y,w*2,1,'#cfeedd');}
    bx(g,5,24,60,32,'#cfeedd');for(let x=5;x<66;x+=10)rc(g,x,24,2,32,'#4a8a5a');rc(g,5,38,60,2,'#4a8a5a');for(let y=8;y<26;y+=6)rc(g,35-1,y,2,6,'#4a8a5a');
    for(const x of [12,22,46,56]){rc(g,x,44,6,6,'#a8784a');ell(g,x+3,42,4,3,'#4a9a4a');ell(g,x+3,40,2,2,['#ef6f7c','#ffd23f','#b07aa1','#f2a33a'][x%4]);}
    doorB(g,35,56,12,16,'#7aa86a');bx(g,0,52,16,8,'#8a5a32');bx(g,54,52,16,8,'#8a5a32');for(let i=0;i<4;i++){ell(g,4+i*3,51,1.8,1.8,['#ef6f7c','#ffd23f','#ef8fb6','#fff'][i]);ell(g,58+i*3,51,1.8,1.8,['#b07aa1','#ef6f7c','#ffd23f','#fff'][i]);}
    rc(g,0,58,70,4,'#c8a878');}},
  // 멍멍 펫샵: 평평한 지붕 위 큰 뼈다귀 간판 + 유리 진열창(강아지 장난감)
  petshop:{w:66,h:68,draw(g){ell(g,16,6,5,5,BO);ell(g,16,6,4,4,'#fffaf0');ell(g,16,12,5,5,BO);ell(g,16,12,4,4,'#fffaf0');ell(g,50,6,5,5,BO);ell(g,50,6,4,4,'#fffaf0');ell(g,50,12,5,5,BO);ell(g,50,12,4,4,'#fffaf0');
    bx(g,16,4,34,11,'#fffaf0');emo(g,'🐾 PET',33,5,7);rc(g,30,15,2,6,BO);
    bx(g,4,20,58,46,'#dcecf8');rc(g,4,20,58,5,'#4a7ab0');bx(g,8,30,30,22,'#fffaf0');rc(g,9,31,28,20,'#cfe6f8');ell(g,17,45,4,3,'#ef6f7c');ell(g,28,44,5,3,'#ffd23f');rc(g,26,40,6,2,'#fff');
    doorB(g,50,66,14,24,'#4a7ab0');for(const [x,y] of [[12,58],[20,60],[28,58]])ell(g,x,y,2,1.5,'#4a7ab0');}},
  // 도윤이네: 작은 집 + 옆에 미끄럼틀 + 모래놀이
  kid:{w:74,h:62,draw(g){gable(g,24,10,28,20,'#7cc3c0','#a8e0dc');bx(g,6,28,36,30,'#fff1b0');winB(g,10,34,10,9,'#ffe2f0');doorB(g,32,58,10,16,'#ef8fb6');
    rc(g,52,18,3,40,BO);rc(g,53,18,1,40,'#ef6f7c');rc(g,64,18,3,40,BO);bx(g,50,16,18,5,'#ffd23f');for(let i=0;i<8;i++)rc(g,55+i*1,21+i*4,10-i,1,'#5aa9e6');
    for(let i=0;i<14;i++)rc(g,44+i*2-14,30+i*2,6,2,'#5aa9e6');ell(g,60,58,12,4,BO);ell(g,60,58,11,3,'#e8d090');rc(g,58,54,2,3,'#ef6f7c');}},
  // 은비 훈련소: 둥근(반원) 지붕 체육관 + 큰 셔터 문 + 트로피 간판
  coach:{w:76,h:60,draw(g){for(let y=4;y<28;y++){const k=1-Math.pow((28-y)/24,2),w=Math.round(36*Math.sqrt(Math.max(0,k)));rc(g,38-w-1,y,w*2+2,1,BO);rc(g,38-w,y,w*2,1,y%4===0?'#8aaa6a':'#6a8a4a');}
    bx(g,2,28,72,30,'#e6f0d8');bx(g,24,34,28,24,'#a8a296');for(let y=37;y<57;y+=3)rc(g,25,y,26,1,'#8a8478');bx(g,22,6,32,10,'#fff8e0');emo(g,'🏆 훈련소',38,7,7);
    for(const x of [8,58]){winB(g,x,34,10,10);}for(const x of [6,12,64,70]){rc(g,x-1,52,3,6,'#f2a33a');rc(g,x-1,54,3,1,'#fff');}}},
  // 이장님 댁: 2층 저택 + 기둥 + 발코니 + 시계 + 깃발
  mayor:{w:72,h:80,draw(g){rc(g,35,0,2,14,BO);rc(g,37,1,10,7,'#ef5a5a');rc(g,37,4,10,1,'#fff');
    gable(g,36,12,26,34,'#7a3a3a','#9a5a5a');bx(g,6,26,60,52,'#efe4d0');rc(g,6,50,60,3,BO);rc(g,7,50,58,2,'#c8b896');
    for(const x of [10,26,40,56])winB(g,x,30,8,12);for(let x=8;x<64;x+=4)rc(g,x,46,1,4,BO);rc(g,8,45,56,1,BO);
    ell(g,36,20,5,5,BO);ell(g,36,20,4,4,'#fff');rc(g,36,17,1,3,BO);rc(g,36,20,3,1,BO);
    for(const x of [16,52])bx(g,x,53,6,25,'#f6efe0');doorB(g,36,78,14,20,'#7a4a2a');winB(g,24,58,8,10);winB(g,42,58,8,10);}},
  // 콩닥 동물병원: 2층 흰 건물 + 큰 초록 십자 간판 + 입구 차양
  vet:{w:68,h:74,draw(g){bx(g,6,8,56,64,'#fbfbfb');rc(g,6,8,56,4,'#5aa9e6');bx(g,22,0,24,24,'#fff');rc(g,31,3,6,18,'#3db06a');rc(g,25,9,18,6,'#3db06a');
    for(const x of [10,48])winB(g,x,16,10,10);for(const x of [10,24,38,48])winB(g,x,34,9,10,'#cfe6f8');
    rc(g,18,48,32,3,BO);rc(g,19,48,30,2,'#5aa9e6');doorB(g,34,72,16,20,'#cfe6f8');rc(g,33,52,2,20,'#9aa0aa');emo(g,'🐶🏥',34,58,7);}},
};
// 원래 건물 그림을 새 그림으로 바꾼다 (집 문 위치는 그대로, 그림 아래 가운데)
buildHouse2=function(id){const B=BUILD[id]||BUILD.home;return mk(B.w,B.h,g=>B.draw(g));};

// ---------- 침대: 머리판·베개·이불·발판이 보이게 다시 그림 (1~4인용) ----------
function buildBedV2(cap){const W=16+cap*12,H=38;return mk(W,H,g=>{
  ell(g,W/2,H-2,W/2-1,2.5,'rgba(0,0,0,.18)');
  // 머리판 (둥근 위쪽 나무판)
  rc(g,1,3,W-2,11,BO);rc(g,2,4,W-4,9,'#8a5a32');rc(g,3,2,W-6,2,BO);rc(g,4,3,W-8,2,'#a8784a');rc(g,4,6,W-8,1,'#a8784a');
  // 매트리스 + 옆판
  rc(g,1,12,W-2,22,BO);rc(g,2,13,W-4,20,'#fffaf0');rc(g,2,13,2,20,'#a8784a');rc(g,W-4,13,2,20,'#a8784a');
  // 베개 (인원 수만큼)
  const pw=(W-10)/cap;for(let i=0;i<cap;i++){const x=5+i*pw;rc(g,x,14,pw-2,7,BO);rc(g,x+1,15,pw-4,5,'#ffffff');rc(g,x+1,19,pw-4,1,'#d8d4cc');}
  // 이불 (윗단 접힘 + 무늬)
  const bc=['#8fb8e8','#f2a8b8','#a8d8a0','#f2d48a'][cap-1];rc(g,2,22,W-4,11,bc);rc(g,2,22,W-4,3,'#ffffff');rc(g,2,25,W-4,1,BO);
  for(let x=6;x<W-6;x+=6)for(let y=27;y<32;y+=4)rc(g,x,y,2,2,'rgba(255,255,255,.6)');
  // 발판 + 다리
  rc(g,1,32,W-2,4,BO);rc(g,2,33,W-4,2,'#a8784a');rc(g,2,35,3,3,BO);rc(g,W-5,35,3,3,BO);});}
const _buildDeco0=buildDeco;buildDeco=function(id){const D=DECO[id];if(D&&D.kind==='bed')return buildBedV2(D.cap||1);return _buildDeco0(id);};
for(const k of Object.keys(SPR))if(/^deco_bed|^homebed/.test(k))delete SPR[k];
buildHomeBed=function(){return buildBedV2(1);};

// ---------- 우리 집 안: 침대·책장·탁자·화분도 옮길 수 있게 (꾸미기 가구로 바꿈) ----------
ROOMS.home.furn=ROOMS.home.furn.filter(f=>!['bed','shelf','table','plant'].includes(f[0]));
const _homeAfter0=ROOMS.home.after;ROOMS.home.after=function(A){SV.home=SV.home||{inv:{},furn:[]};
  if(!SV.home.seeded){SV.home.seeded=1;SV.home.furn.push({id:'bed1',tx:2,ty:4},{id:'shelf',tx:8,ty:3},{id:'table2',tx:5,ty:7},{id:'plant',tx:11,ty:9},{id:'plant',tx:18,ty:9});}
  _homeAfter0(A);
  A.objs.push({kind:'note',x:18*T+8,y:11*T-2,img:spr('decobook',buildDecoBook),onUse:()=>{startDeco();},lab:'🎨 인테리어 노트 (가구 옮기기·꾸미기)',r:26,flat:true});};
function buildDecoBook(){return mk(18,14,g=>{rc(g,1,2,16,11,BO);rc(g,2,3,7,9,'#fff6e0');rc(g,9,3,7,9,'#fffaf0');rc(g,9,2,1,11,BO);for(let y=5;y<11;y+=2){rc(g,3,y,5,1,'#c8b896');rc(g,11,y,4,1,'#c8b896');}rc(g,12,0,2,4,'#ef6f7c');});}

// ---------- 일부 기기에서 네모(X)로 보이는 최신 이모지를 어디서나 보이는 것으로 ----------
const EMOJI_SAFE=[['🪓','🔨'],['🪵','🌲'],['🪨','⛰'],['⛏️','⚒'],['⛏','⚒'],['🪶','🐦'],['🪴','🌱'],['🧺','🛍'],['🩺','💉'],['🛋️','🛏'],['🛋','🛏']];
(function(){const _t=txt;txt=function(s,...a){if(typeof s==='string'&&/[\u{1FA70}-\u{1FAFF}⛏\u{1F6CB}\u{1F9FA}]/u.test(s))for(const [x,y] of EMOJI_SAFE)s=s.split(x).join(y);return _t(s,...a);};})();
