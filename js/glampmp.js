"use strict";
// ===== 멀티(같이 하기) 공동 글램핑장 =====
// - 방마다 글램핑장이 하나(서버 room_glamp). 단계·외형·가구 배치·공동 창고를 방 친구들이 함께 쓴다.
// - 재료는 각자 모아서 [재료 넣기]로 공동 창고에 넣고, 창고가 차면 누구든 [짓기]를 누른다.
// - 필요 재료는 서버가 인원 수로 계산한다: 기본 × (1 + 0.35 × (인원 - 1)).
// - 누가 바꾸면 실시간 채널로 'glamp' 신호를 보내 다른 친구 화면도 다시 불러온다.
const GMP={pool:{},need:{},n:1,ver:0,loaded:false,busy:false};
const mgRpc=(fn,args)=>rpc(fn,Object.assign({p_room:MP.code},args||{}));
function mgNotify(){if(typeof netSend==='function'&&NET.me)netSend('glamp',{i:NET.me.id});}
async function mgFetch(){if(!isMP()||GMP.busy)return;try{mgApply(await mgRpc('glamp_get'));GMP.fail=false;}catch(e){GMP.fail=true;console.warn('글램핑장 불러오기 실패(서버 설정 glamp.sql 확인)',e);}}
function mgApply(d){if(!d||d.short||d.conflict||!isMP())return;
  SV.glamp=SV.glamp||{};const before=SV.glamp.st;Object.assign(SV.glamp,{st:d.st|0,style:d.style||null,furn:Array.isArray(d.furn)?d.furn:[],inv:d.inv&&typeof d.inv==='object'?d.inv:{}});
  GMP.pool=d.pool||{};GMP.need=d.need||{};GMP.n=d.n||1;GMP.ver=d.ver|0;GMP.loaded=true;
  const A=G&&G.area;
  if(A&&A.gsite){A.gsite.img=glampImg();if(SV.glamp.st>=3)for(let tx=A.hub[0]-3;tx<=A.hub[0]+3;tx++)for(let ty=A.hub[1];ty<=A.hub[1]+1;ty++)A.solid[ty*A.W+tx]=1;if(before!==SV.glamp.st&&!freeAt(G.pl.x,G.pl.y))unstuck(false);}
  if(A&&A.glampin&&!(G.ov&&G.ov.type==='deco'&&G.ov.hold))refreshRoom();
  if(SV.glamp.st>=GSTAGES.length&&SV.mq===1&&scene==='game'&&!G.ov)ch1Clear();}

// --- 기존 기능을 멀티일 때만 바꿔 끼운다 ---
const _openGlamp=openGlamp,_craft=craft,_decoAct=decoAct,_decoRemove=decoRemove,_ch1ZoneHook=ch1ZoneHook,_glampRoomAfter=glampRoomAfter;
openGlamp=function(){if(!isMP()||GMP.fail)return _openGlamp();SFX.sel();
  if(!GMP.loaded){toast('글램핑장 불러오는 중…');mgFetch().then(()=>{if(GMP.loaded)openGlamp();});return;}
  const st=SV.glamp.st;if(st>=GSTAGES.length)return _openGlamp();
  const S=GSTAGES[st],need=GMP.need||{},pool=GMP.pool||{},ok=Object.entries(need).every(([r,v])=>(pool[r]|0)>=v);
  const rows=Object.entries(need).map(([r,v])=>{const have=pool[r]|0,mine=haveRes(r),gap=Math.max(0,v-have),give=Math.min(mine,gap);
    return{label:`${have>=v?'✅':'⬜'} ${RES_NAME[r]} 창고 ${Math.min(have,v)}/${v}  ·  내 가방 ${mine}${give>0?`  → ${give}개 넣기`:''}`,dis:give<=0,fn:()=>mgGive(r,give)};});
  openMenu({title:`🔨 ${st+1}/${GSTAGES.length} ${S.name} · 같이 짓기 ${GMP.n}명`,items:[...(st>=3?[{label:'🏠 숙소 들어가기 (같이 꾸미기)',fn:()=>{closeOv();enterGlampRoom();}}]:[]),
    {label:`${S.desc} · 친구들과 재료를 모아요 (인원이 많을수록 재료가 더 들어요)`,dis:true,fn:()=>{}},...rows,
    {label:ok?(S.style?'🏠 외형 고르고 짓기':'🔨 짓기!'):'공동 창고에 재료가 모자라요',dis:!ok,fn:()=>{if(S.style)pickStyle();else mgBuild(null);}},{label:'닫기',fn:closeOv}]});};
async function mgGive(r,n){if(n<=0)return;if(r==='coins')SV.coins-=n;else SV[r]-=n;GMP.busy=true;
  try{const d=await mgRpc('glamp_give',{p_res:r,p_n:n});GMP.busy=false;mgApply(d);SFX.pick();toast(`${RES_NAME[r]} ${n}개를 공동 창고에 넣었어요`);logDay(`친구들과 짓는 글램핑장 창고에 ${RES_NAME[r]} ${n}개를 넣었다.`);save(true);mgNotify();openGlamp();}
  catch(e){GMP.busy=false;if(r==='coins')SV.coins+=n;else SV[r]+=n;toast('넣지 못했어요. 인터넷을 확인해 주세요');}}
async function mgBuild(style){GMP.busy=true;let d;try{d=await mgRpc('glamp_build',{p_style:style});}catch(e){GMP.busy=false;toast('짓지 못했어요: '+errMsg(e));return;}GMP.busy=false;
  if(d&&d.short){toast('창고 재료가 모자라요 (친구가 먼저 썼을 수 있어요)');mgFetch();return;}
  const st0=SV.glamp.st;closeOv();mgApply(d);if(SV.glamp.st===st0)return;
  SFX.clear();G.fade=.6;SV.today.clock+=30;gainXP(20);const A=G.area;if(A&&A.gsite)hearts(A.gsite.x,A.gsite.y-30,6);
  logDay(`친구들과 글램핑장 「${GSTAGES[st0].name}」을(를) 마쳤다!`);mgNotify();
  if(SV.glamp.st<GSTAGES.length)toast(`🔨 「${GSTAGES[st0].name}」 완료! 다음: ${GSTAGES[SV.glamp.st].name}`);save(true);}
// 외형 고르기 메뉴는 그대로 쓰되, 멀티면 서버로 짓는다
const _build=build;build=function(){if(!isMP()||GMP.fail)return _build();mgBuild(SV.glamp.style);};
craft=function(id){if(!isMP()||GMP.fail)return _craft(id);const c=decoCost(id);for(const [r,v] of Object.entries(c))if(haveRes(r)<v){toast('재료가 모자라요');return;}
  for(const [r,v] of Object.entries(c)){if(r==='coins')SV.coins-=v;else SV[r]-=v;}save();
  mgRpc('glamp_inv_add',{p_id:id}).then(d=>{mgApply(d);mgNotify();SFX.clear();
    openMenu({title:`✨ ${DECO[id].name}을(를) 만들었어요! (방 친구들과 같이 써요)`,items:[{label:'🎨 바로 놓으러 가기',fn:()=>{closeOv();startDeco(id);}},{label:'더 만들기',fn:openCraft},{label:'닫기',fn:closeOv}]});})
  .catch(()=>{for(const [r,v] of Object.entries(c)){if(r==='coins')SV.coins+=v;else SV[r]+=v;}toast('만들지 못했어요. 인터넷을 확인해 주세요');});};
async function mgPushFurn(){if(!isMP()||GMP.fail)return;try{const d=await mgRpc('glamp_place',{p_furn:SV.glamp.furn,p_inv:SV.glamp.inv,p_ver:GMP.ver});
    if(d&&d.conflict){toast('친구가 방금 숙소를 바꿨어요. 다시 불러왔어요');await mgFetch();return;}mgApply(d);mgNotify();}catch(e){toast('저장하지 못했어요. 인터넷을 확인해 주세요');}}
decoAct=function(){const had=G.ov&&G.ov.hold;_decoAct();if(isMP()&&G.area&&G.area.glampin&&had&&G.ov&&!G.ov.hold)mgPushFurn();};
decoRemove=function(){_decoRemove();if(isMP()&&G.area&&G.area.glampin)mgPushFurn();};
ch1ZoneHook=function(A){_ch1ZoneHook(A);if(isMP()&&A.place==='glamp')mgFetch();};
glampRoomAfter=function(A){_glampRoomAfter(A);if(isMP())setTimeout(mgFetch,50);};
// 멀티는 숙소 3단계가 서버 기준
const _enterGlampRoom=enterGlampRoom;enterGlampRoom=function(){if(isMP()&&!GMP.loaded&&!GMP.fail){mgFetch().then(()=>_enterGlampRoom());return;}_enterGlampRoom();};
const _mpPlay=mpPlay;mpPlay=function(code){GMP.loaded=false;GMP.pool={};GMP.need={};GMP.ver=0;return _mpPlay(code);};
// 다 지어졌을 때 메뉴를 보고 있던 친구도, 메뉴를 닫는 순간 챕터 1 완료를 받는다
setInterval(()=>{if(isMP()&&GMP.loaded&&SV.glamp&&SV.glamp.st>=GSTAGES.length&&SV.mq===1&&scene==='game'&&G&&!G.ov)ch1Clear();},1500);
