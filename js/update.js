"use strict";
// ===== 업데이트 알림 =====
// 배포하면 사이트에 version.json {v: 버전, status: 'ok'|'updating'} 이 함께 올라간다(.github/workflows/pages.yml).
// - status가 'updating'이면: 하던 행동(대화·미니게임·메뉴)이 끝나는 순간 저장하고 「업데이트 중입니다」 화면을 띄운다.
// - 새 버전(v가 달라짐)이 'ok'로 올라오면: 첫 화면으로 다시 연다(새 파일로).
// 올리는 순서는 scripts/deploy.sh 가 지킨다: ① 'updating' 신호만 먼저 배포 → ② 실제 변경 + 'ok' 배포.
const UPD={boot:null,state:null,shown:false,lastV:null};
async function updFetch(){try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return null;const d=await r.json();return d&&typeof d.v==='string'?d:null;}catch(e){return null;}}
function updSafe(){if(document.getElementById('mp')&&document.getElementById('mp').style.display==='flex')return false;
  if(typeof scene==='undefined'||scene!=='game')return true;return !!G&&!G.ov&&!G.play&&!G.busy;}
async function updCheck(){const d=await updFetch();if(!d)return;
  if(!UPD.boot){UPD.boot=d.v;if(d.status!=='updating')return;}
  UPD.lastV=d.v;if(d.status==='updating')UPD.state='updating';else if(d.v!==UPD.boot)UPD.state='new';}
async function updShow(){if(UPD.shown)return;UPD.shown=true;
  try{if(typeof scene!=='undefined'&&scene==='game'){if(typeof isMP==='function'&&isMP()){SV._t=Date.now();store.set(mpKey(),SV);await mpCloudSave(true);}else{store.set(saveKey(),SV);await cloudSave(true);}}}catch(e){}
  try{musicOn=false;}catch(e){}const el=document.getElementById('upd');if(el)el.style.display='flex';}
function updReload(){const v=UPD.lastV||Date.now();location.replace(location.pathname+'?u='+encodeURIComponent(v));}
setInterval(()=>{if(!UPD.state)return;if(!updSafe()&&!UPD.shown)return;
  if(UPD.state==='updating')updShow();else if(UPD.state==='new'){if(UPD.shown)updReload();else updShow().then(()=>setTimeout(updReload,1500));}},500);
updCheck();let updT=setInterval(updCheck,30000);
// 업데이트 화면이 떠 있으면 더 자주(10초) 확인
setInterval(()=>{if(UPD.shown)updCheck();},10000);
addEventListener('keydown',e=>{if(UPD.shown){e.stopPropagation();e.preventDefault();}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updCheck();});
