"use strict";
// ===== 캐릭터·가구 그림 (전부 코드로 그린 픽셀아트) =====

// ---------- 강아지 (담이·친구·큰 개 공용) ----------
// pose: walk happy sit paw lie roll eat sniff scared sleep wet
function buildPup(P,dir,fr,pose,acc){
  const s=P.s||1;
  return mk(28*s,25*s,g=>{
    const B=[],O=[],D=[],POST=[];
    const E=(a,x,y,rx,ry,c)=>a.push({e:1,x:x*s,y:y*s,rx:rx*s,ry:ry*s,c});
    const Q=(a,x,y,w,h,c)=>a.push({e:0,x:x*s,y:y*s,w:w*s,h:h*s,c});
    const b=(fr===1||fr===3)?-1:0,L1=fr===1?1:fr===3?-1:0,sc=pose==='scared',low=(pose==='eat'||pose==='sniff')?4:0;
    const leg=P.short?2.6:3.6,earF=P.ear!=='point',happy=['happy','sniff','paw','roll'].includes(pose),wet=pose==='wet';
    const C=wet?P.D:P.C;
    let ax=19,ay=4,adir=dir;
    if(pose==='sleep'){
      E(B,14,18,8.5,4.6,C);E(B,8.5,17.5,4.8,4,C);E(B,21.5,16.5,3,3,C);
      if(earF)E(O,10.5,18.5,2.4,3.4,P.EAR);else E(O,9.5,13.8,1.6,2.4,P.EAR);
      E(D,14,21,7,1.2,P.D);Q(D,6.4,17,2,1,P.K);Q(D,4,18.6,1.4,1.2,P.K);E(D,13,15,3,1,P.L);
      if(P.vest)E(D,15.5,18,3.5,2.4,P.V);ax=9;ay=13;adir='side';
    }else if(dir==='side'){
      const tw=sc?0:(fr%2);
      if(sc||wet)E(B,5.5,17,2.2,2.4,C);else{E(B,5,11+tw,2.8,2.8,C);if(P.curly)E(B,4,8.6+tw,1.7,1.7,C);}
      if(pose==='sit'){E(B,10,18,4.4,3,C);Q(B,16,15,2.6,6,C);E(B,12.5,14,5.6,5,C);}
      else{for(const [lx,o] of [[8,-L1],[11,L1],[15.5,L1],[18.5,-L1]])Q(B,lx+o*.7,17,2.4,leg-(o>0?.8:0),C);E(B,12.5,15+b+(sc?1:0)+(P.short?1:0),6.6,wet?3.4:4.3,C);}
      const hx=19.5+(low?.8:0),hy=9+b+low+(sc?1.5:0)+(pose==='sit'?-1:0);
      E(B,hx,hy,wet?5.6:6.4,wet?5.2:6,C);E(B,hx+5.4,hy+2.6,2.3,1.9,C);
      if(P.curly&&!wet)E(B,hx-.6,hy-4.8,3.6,1.8,C);
      if(!earF)E(O,hx-1.6,hy-5.6,1.8,3.2,P.EAR);
      E(D,12.5,18+b,6,1.2,P.D);
      if(P.mask)E(D,hx+3.6,hy+3.2,3.2,2,P.L);
      if(P.vest&&!wet){E(D,12,14.2+b,4.6,3.4,P.V);Q(D,7.6,16.4+b,9,1,P.VS);Q(D,14.6,11.4+b,1.4,6,P.H);}
      if(earF)POST.push({e:1,x:(hx-2.4)*s,y:(hy+2.8+(sc?1:0))*s,rx:2.7*s,ry:4.4*s,c:P.EAR});
      if(P.band)Q(D,15.5,12+b+low*.5,3,3.4,P.band);
      E(D,hx-1.4,hy-3,2.2,1.2,P.L);
      if(sc||wet){Q(D,hx+1.2,hy,2.4,1,P.K);if(sc)Q(D,hx+5,hy-6,1,2,'#8fd3ff');}
      else{Q(D,hx+1.4,hy-1.8,2,2.6,P.K);Q(D,hx+1.4,hy-1.8,1,1,'#ffffff');}
      Q(D,hx+6.8,hy+1.4,1.6,1.4,P.K);
      if(happy)Q(D,hx+4,hy+4.6,1.8,1,'#f28aa0');
      if(P.blush)E(D,hx+2.2,hy+3,1.3,.8,P.blush);
      ax=hx+.5;ay=hy-6;
    }else{
      const up=dir==='up';
      const hy0=9.5+b+(low?3:0)+(sc?1:0);
      if(pose==='lie'){E(B,14,19.5,8,3,C);Q(B,9.4,19.5,2.6,2.6,C);Q(B,16,19.5,2.6,2.6,C);}
      else if(pose==='roll'){E(B,15,17,7.5,4,C);for(const lx of [10,13,16.5,19.5])Q(B,lx,10.5+(lx%2),2.4,4,C);}
      else if(pose==='sit'||pose==='paw'){E(B,9.5,20,2.6,1.8,C);E(B,18.5,20,2.6,1.8,C);E(B,14,16.5,5.4,4.6,C);Q(B,11.2,18,2.6,4,C);if(pose==='paw')POST.push({e:0,x:18*s,y:13.4*s,w:2.8*s,h:4*s,c:C});else Q(B,14.4,18,2.6,4,C);}
      else{Q(B,9,18,2.6,leg,C);Q(B,16.4,18,2.6,leg,C);Q(B,11.2,18+(L1>0?-1:0),2.6,leg+.4,C);Q(B,14.6,18+(L1<0?-1:0),2.6,leg+.4,C);E(B,14,16+b,6,wet?3.4:4.2,C);}
      if(pose==='roll'){
        E(B,6,17,5,4.6,C);if(earF)E(O,6.5,13.4,2.2,3,P.EAR);else E(O,4,12.6,1.6,2.4,P.EAR);
        E(D,15,17.5,5,2.2,'#ffe6ea');Q(D,3.6,16.4,2,1,P.K);Q(D,7,16.4,2,1,P.K);Q(D,5.4,20,1.6,1.6,'#f28aa0');Q(D,1.6,18,1.4,1.2,P.K);ax=6;ay=12;
      }else{
        const hy=pose==='lie'?hy0+3:hy0;
        E(B,14,hy,wet?6.4:7.2,wet?6:6.6,C);
        if(P.curly&&!wet)E(B,14,hy-6,3.4,2.2,C);
        if(earF){E(O,6.6,hy+3,2.8,4.6,P.EAR);E(O,21.4,hy+3,2.8,4.6,P.EAR);}else{E(O,8.6,hy-5.6,2,3.2,P.EAR);E(O,19.4,hy-5.6,2,3.2,P.EAR);}
        if(up){const tw=(fr%2)?1:-1;if(!sc&&pose!=='lie')E(O,14+tw,20,2.6,2.6,C);
          if(P.vest&&!wet){E(D,14,15+b,4.4,3,P.V);Q(D,10,13.4+b,8,1,P.H);Q(D,13,12.6+b,2,2,P.H);}E(D,14,hy-3.6,3.4,1.4,P.L);}
        else{
          if(P.vest&&pose!=='lie'&&!wet){E(D,14,17.2+b,4,2.2,P.V);Q(D,10,15.2+b,8,1,P.H);}
          if(P.band){Q(D,10.5,hy+5.4,7,2,P.band);Q(D,12.6,hy+7.4,3,1.6,P.band);}
          if(P.mask)E(D,14,hy+3,4,2.4,P.L);
          E(D,12.2,hy-3.6,3.4,1.4,P.L);
          if(sc||wet){Q(D,10,hy,2.4,1,P.K);Q(D,15.6,hy,2.4,1,P.K);if(sc)Q(D,21,hy-6,1,2,'#8fd3ff');}
          else{Q(D,10.2,hy-.6,2,2.6,P.K);Q(D,15.8,hy-.6,2,2.6,P.K);Q(D,10.2,hy-.6,1,1,'#ffffff');Q(D,15.8,hy-.6,1,1,'#ffffff');}
          E(D,14,hy+3.2,2.6,1.7,P.L);Q(D,13.1,hy+2,1.8,1.3,P.K);
          if(happy)Q(D,13.3,hy+4.4,1.4,1.2,'#f28aa0');
          if(P.blush){E(D,9,hy+3,1.3,.8,P.blush);E(D,19,hy+3,1.3,.8,P.blush);}
        }
        ax=up?14:18.5;ay=hy-6;if(acc==='hat')ax=14;
      }
    }
    shapes(g,B,O,D,P.OL);
    if(POST.length)shapes(g,[],POST,[],P.OL);
    if(P.curly&&!wet){const W=g.canvas.width,H=g.canvas.height,id=g.getImageData(0,0,W,H),d=id.data,c=hex(P.C),dd=hex(P.D);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i]===c[0]&&d[i+1]===c[1]&&d[i+2]===c[2]&&(x*3+y*5)%7===0&&hash(x,y,5)<.75){d[i]=dd[0];d[i+1]=dd[1];d[i+2]=dd[2];}}g.putImageData(id,0,0);}
    if(wet)for(let i=0;i<5;i++)rc(g,(6+i*4)*s,(4+(i%2)*3)*s,1,2,'#8fd3ff');
    if(acc&&!wet)drawAcc(g,acc,ax*s,ay*s,adir);
  });
}
function drawAcc(g,a,x,y,dir){
  const O='#4a2020';
  if(a==='ribbon'){rc(g,x-4,y-1,3,4,O);rc(g,x+1,y-1,3,4,O);rc(g,x-3,y,2,2,'#e8415a');rc(g,x+2,y,2,2,'#e8415a');rc(g,x-1,y,2,2,'#b02a40');}
  else if(a==='flower'){for(const [dx,dy] of [[0,-2],[-2,0],[2,0],[0,2]])rc(g,x+dx-1,y+dy,2,2,'#f49ac0');rc(g,x-1,y,2,2,'#f7d64a');}
  else if(a==='star'){rc(g,x,y-2,1,5,'#f7c63a');rc(g,x-2,y,5,1,'#f7c63a');rc(g,x-1,y-1,3,3,'#ffe27a');}
  else if(a==='hat'){ell(g,x,y+2,7,1.8,'#8a6a2a');ell(g,x,y+1.6,6.2,1.3,'#e8c46a');ell(g,x,y-.6,3.6,2.4,'#8a6a2a');ell(g,x,y-.8,3,1.9,'#f2d48a');rc(g,x-3,y+.6,6,1,'#d9534f');}
  else if(a==='bandana'){if(dir==='side')rc(g,x-5,y+10,4,4,'#5aa9e6');else{rc(g,x-8,y+11,8,2,'#5aa9e6');rc(g,x-6,y+13,4,2,'#5aa9e6');}}
}
function pupImg(P,name,dir,fr,pose,acc){return spr(`p_${name}_${dir}_${fr}_${pose}_${acc||''}`,()=>buildPup(P,dir,fr,pose,acc));}

// ---------- 사람 ----------
function buildHuman(P,dir,fr){
  return mk(20,32,g=>{
    const B=[],O=[],D=[];const Q=(a,x,y,w,h,c)=>a.push({e:0,x,y,w,h,c}),E=(a,x,y,rx,ry,c)=>a.push({e:1,x,y,rx,ry,c});
    const st=fr===1?1:fr===3?-1:0,oy=P.kid?4:0,sk=P.skin||'#f6d2ad',hr=P.hair,K='#2b1d16',shoe=P.shoe||'#4a3426',hl=P.hairL||'#5a4a40';
    if(dir==='side'){
      if(P.style==='long')Q(B,4.4,5+oy,5,15-oy*.5,hr);
      if(P.skirt){Q(B,7.4+st,21,2.2,6,P.sock||sk);Q(B,9.4-st,21,2.2,6,P.sock||sk);}else{Q(B,7+st,20,2.6,7,P.bottom);Q(B,9-st,20,2.6,7,P.bottom);}
      Q(B,6.6+st,27,3.4,2,shoe);Q(B,8.6-st,27,3.4,2,shoe);
      Q(B,6,12+oy,8,9-oy,P.top);if(P.skirt)Q(B,5.4,19,9.2,4,P.bottom);
      E(B,10.5,8+oy,4.8,5.2,sk);
      if(P.style==='long'){E(O,9.6,6+oy,5,3.8,hr);Q(O,4.6,6+oy,4.6,13-oy*.5,hr);Q(O,10.6,3.6+oy,4.6,2.4,hr);Q(D,7,4.4+oy,4,1,hl);Q(D,5.6,9+oy,1,8,hl);}
      else if(P.style==='bun'){E(O,9.6,6+oy,5,3.6,hr);E(O,6.6,3+oy,2.4,2.2,hr);Q(D,8,4+oy,3,1,hl);}
      else if(P.style==='pony'){E(O,9.6,6+oy,5,3.6,hr);Q(O,3.8,7+oy,2.6,7,hr);Q(D,8,4+oy,3,1,hl);}
      else if(P.style==='cap'){E(O,10,5.4+oy,5.2,3.6,P.hat);Q(O,12,7+oy,4.6,1.6,P.hat);}
      else{E(O,9.6,6+oy,5,3.6,hr);Q(O,6,6+oy,3,4,hr);}
      Q(O,9-st*1.2,13+oy,2.6,7-oy*.5,P.topD||P.top);
      Q(D,13,8.6+oy,1,2,K);Q(D,14.8,10+oy,1,1,'#e9b48f');Q(D,11.8,10.8+oy,1.4,1,'#f4b0a0');
      if(P.glasses){Q(D,11.6,7.6+oy,3.6,3.2,P.glasses);Q(D,12.4,8.4+oy,2,1.6,'#fdeee0');Q(D,13,8.4+oy,1,1.6,K);Q(D,9.4,8.4+oy,2.4,1,P.glasses);}
      if(P.apron)Q(D,11.4,14+oy,2.6,6-oy,P.apron);
      Q(D,9-st*1.2,19.6,2.6,2,sk);
    }else{const up=dir==='up';
      if(P.style==='long'&&!up)Q(B,4,6+oy,12,14-oy*.5,hr);
      if(P.skirt){Q(B,7,21,2.2,6+(st>0?0:-1),P.sock||sk);Q(B,10.8,21,2.2,6+(st<0?0:-1),P.sock||sk);}else{Q(B,7,20,2.6,7+(st>0?0:-1),P.bottom);Q(B,10.4,20,2.6,7+(st<0?0:-1),P.bottom);}
      Q(B,6.6,27+(st>0?0:-1),3.2,2,shoe);Q(B,10.2,27+(st<0?0:-1),3.2,2,shoe);
      Q(B,5,12+oy,10,9-oy,P.top);Q(B,3.4,13+oy-st,2,7-oy*.5,P.top);Q(B,14.6,13+oy+st,2,7-oy*.5,P.top);
      if(P.skirt)Q(B,4.4,19,11.2,4,P.bottom);
      E(B,10,8+oy,4.8,5.2,sk);
      if(up){
        if(P.style==='long'){E(O,10,7+oy,5.2,5.2,hr);Q(O,4.6,7+oy,10.8,13-oy*.5,hr);Q(D,7,4+oy,6,1,hl);Q(D,8,9+oy,1,9,hl);}
        else if(P.style==='bun'){E(O,10,7+oy,5,5,hr);E(O,10,2.4+oy,2.4,2.2,hr);}
        else if(P.style==='cap'){E(O,10,6.6+oy,5.2,4.8,P.hat);}
        else if(P.style==='pony'){E(O,10,7+oy,5,5,hr);Q(O,8.8,9+oy,2.4,8,hr);}
        else E(O,10,7+oy,5,5,hr);
      }else{
        if(P.style==='long'){E(O,10,5.4+oy,5.3,3.4,hr);Q(O,4.6,5+oy,2.2,14-oy*.5,hr);Q(O,13.2,5+oy,2.2,14-oy*.5,hr);Q(O,5.4,4+oy,9.2,2.8,hr);Q(D,7,3.6+oy,4,1,hl);}
        else if(P.style==='bun'){E(O,10,5.4+oy,5.2,3.2,hr);E(O,10,1.6+oy,2.4,2,hr);}
        else if(P.style==='cap'){E(O,10,5+oy,5.4,3.2,P.hat);Q(O,5,6.4+oy,10,1.4,P.hat);}
        else{E(O,10,5.4+oy,5.2,3.4,hr);Q(O,5,5+oy,2,4,hr);Q(O,13,5+oy,2,4,hr);Q(D,7.4,3.6+oy,3,1,hl);}
        if(P.collar)Q(D,8,12+oy,4,1.2,P.collar);
        if(P.apron)Q(D,7,14+oy,6,7-oy,P.apron);
        if(P.glasses){Q(D,6.6,7.6+oy,3.4,3.2,P.glasses);Q(D,10.6,7.6+oy,3.4,3.2,P.glasses);Q(D,7.4,8.4+oy,1.8,1.6,'#fdeee0');Q(D,11.4,8.4+oy,1.8,1.6,'#fdeee0');Q(D,7.8,8.4+oy,1,1.6,K);Q(D,11.8,8.4+oy,1,1.6,K);Q(D,9.8,8.6+oy,1,1,P.glasses);}
        else{Q(D,8,8.4+oy,1,2,K);Q(D,11.8,8.4+oy,1,2,K);}
        Q(D,6.4,10.8+oy,1.4,1,'#f4b0a0');Q(D,12.4,10.8+oy,1.4,1,'#f4b0a0');
      }
      Q(D,3.4,19.4-st,2,2,sk);Q(D,14.6,19.4+st,2,2,sk);
    }
    shapes(g,B,O,D,P.OL||'#3b2b2b');
  });
}
function humanImg(id,P,dir,fr){return spr(`h_${id}_${dir}_${fr}`,()=>buildHuman(P,dir,fr));}

// ---------- 집 안 가구 ----------
function buildFurn(k,v=0){
  const OL='#4a2e1e',W1='#c98a4f',W2='#a8692f',W3='#e0a868';
  switch(k){
  case 'bed':return mk(34,34,g=>{rc(g,1,2,32,30,OL);rc(g,2,3,30,28,W2);rc(g,3,4,28,7,'#fffaf0');rc(g,4,5,11,5,'#ffffff');rc(g,19,5,11,5,'#ffffff');rc(g,3,11,28,19,'#b9a3e0');rc(g,3,11,28,2,'#d6c6f2');for(let y=15;y<29;y+=5)for(let x=5;x<30;x+=6)rc(g,x,y,2,2,'#e8dcff');rc(g,2,30,30,2,W1);});
  case 'wardrobe':return mk(26,38,g=>{rc(g,1,0,24,37,OL);rc(g,2,1,22,35,W1);rc(g,2,1,22,2,W3);rc(g,12,4,1,30,OL);rc(g,4,4,7,30,W2);rc(g,14,4,8,30,W2);rc(g,9,18,2,2,'#f7d64a');rc(g,15,18,2,2,'#f7d64a');});
  case 'toybox':return mk(22,18,g=>{rc(g,1,4,20,13,OL);rc(g,2,5,18,11,'#e05a4a');rc(g,2,5,18,2,'#f07a68');rc(g,8,8,6,3,'#fff1c8');ell(g,6,4,3,3,OL);ell(g,6,4,2.2,2.2,'#7cc36a');ell(g,15,3,3,3,OL);ell(g,15,3,2.2,2.2,'#f7d64a');});
  case 'bowl':return mk(14,8,g=>{ell(g,7,4,6.6,3.4,OL);ell(g,7,4,5.6,2.6,v===2?'#5aa9e6':'#ef6f7c');ell(g,7,3.4,4.2,1.6,v===0?'#7a5a4a':v===1?'#b07a48':'#9fdcf6');if(v===1)for(let i=0;i<5;i++)rc(g,4+i*1.5,2.6+(i%2),1,1,'#7a4a28');if(v===3)ell(g,7,3.4,4,1.4,'#7cc8f0');});
  case 'cushion':return mk(30,16,g=>{ell(g,15,9,14,6.4,OL);ell(g,15,9,13,5.6,'#f49ab0');ell(g,15,9.6,9.6,3.6,'#ffd6e0');ell(g,15,8.6,8,2.4,'#fff0f4');});
  case 'table':return mk(30,22,g=>{rc(g,3,10,3,11,OL);rc(g,24,10,3,11,OL);rc(g,0,4,30,8,OL);rc(g,1,5,28,6,W1);rc(g,1,5,28,2,W3);rc(g,10,0,10,5,OL);rc(g,11,1,8,4,'#fffaf0');rc(g,13,0,4,2,'#f49ab0');});
  case 'shelf':return mk(30,36,g=>{rc(g,0,0,30,36,OL);rc(g,1,1,28,34,W2);for(let r=0;r<3;r++){rc(g,1,11+r*11,28,2,W1);for(let i=0;i<6;i++){const cs=v===1?['#e2a45a','#c97a34','#f6cf94']:v===2?['#f7d64a','#5aa9e6','#ef6f7c','#7cc36a']:['#ef6f7c','#5aa9e6','#7cc36a','#f7d64a','#b48cf2'];const h=RI(6,9);rc(g,3+i*4,11+r*11-h,3,h,cs[(i+r)%cs.length]);}}});
  case 'plant':return mk(16,24,g=>{rc(g,3,15,10,8,OL);rc(g,4,16,8,6,'#c96a3a');rc(g,4,16,8,1,'#e08a5a');for(const [x,y,r] of [[8,8,5],[4,11,3.5],[12,11,3.5],[8,4,3.5]]){ell(g,x,y,r+1,r+1,'#1e4a26');}for(const [x,y,r] of [[8,8,5],[4,11,3.5],[12,11,3.5],[8,4,3.5]]){ell(g,x,y,r,r,'#3f8a3c');ell(g,x-1,y-1,r*.5,r*.4,'#62b05a');}});
  case 'counter':return mk(56,24,g=>{rc(g,0,4,56,20,OL);rc(g,1,5,54,18,W2);rc(g,1,5,54,4,W1);rc(g,1,5,54,1,W3);for(let x=6;x<54;x+=12)rc(g,x,11,1,10,OL);if(v===1){ell(g,12,3,5,3,OL);ell(g,12,3,4,2,'#e2a45a');ell(g,28,3,5,3,OL);ell(g,28,3,4,2,'#c97a34');}if(v===2){for(let i=0;i<4;i++){rc(g,8+i*12,0,6,5,OL);rc(g,9+i*12,1,4,3,['#f49ac0','#f7d64a','#ffffff','#b48cf2'][i]);}}});
  case 'oven':return mk(28,30,g=>{rc(g,0,2,28,28,OL);rc(g,1,3,26,26,'#b9886a');for(let y=5;y<28;y+=4)for(let x=(y%8?1:3);x<27;x+=6)rc(g,x,y,5,1,'#8a5a40');ell(g,14,18,8,7,OL);ell(g,14,19,7,5,'#3a1a10');ell(g,14,21,5,2.4,'#f2a33a');ell(g,14,21.5,3,1.2,'#ffe27a');});
  case 'bucket':return mk(14,18,g=>{rc(g,2,9,10,9,OL);rc(g,3,10,8,7,'#8aa0b0');rc(g,3,10,8,1,'#b8ccd8');const cs=[['#f49ac0','#e8415a'],['#f7d64a','#f2a33a'],['#ffffff','#e6e6ee'],['#b48cf2','#8a6ad8']][v%4];for(let i=0;i<5;i++){const x=2+i*2.4,y=1+(i%2)*3;rc(g,x+1,y+3,1,6,'#3d7a30');ell(g,x+1,y+1.4,2,2,cs[1]);ell(g,x+1,y+1,1.4,1.4,cs[0]);}});
  case 'tub':return mk(40,24,g=>{ell(g,20,13,19,10,OL);ell(g,20,13,18,9,'#ffffff');ell(g,20,11.6,15,6.4,'#d6eef8');ell(g,20,11,13.6,5.2,'#9fd8f2');for(let i=0;i<6;i++)ell(g,9+i*4.4,8+(i%2)*2,2.4,2,'#ffffff');rc(g,5,20,3,4,OL);rc(g,32,20,3,4,OL);rc(g,34,0,2,8,'#9aa0aa');rc(g,30,0,6,2,'#9aa0aa');});
  case 'towel':return mk(16,20,g=>{rc(g,2,0,12,2,'#8a6a4a');rc(g,3,2,10,17,OL);rc(g,4,2,8,16,'#7cc8f0');for(let y=4;y<17;y+=3)rc(g,4,y,8,1,'#a8dcf6');});
  case 'cone':return mk(10,12,g=>{rc(g,0,10,10,2,OL);for(let r=0;r<10;r++){const w=2+r*.6;rc(g,5-w/2,r,w,1,r%4<2?'#f2873a':'#ffffff');}});
  case 'desk':return mk(34,24,g=>{rc(g,2,10,3,13,OL);rc(g,29,10,3,13,OL);rc(g,0,6,34,8,OL);rc(g,1,7,32,6,W2);rc(g,1,7,32,2,W1);rc(g,6,1,10,6,'#fffaf0');rc(g,7,2,8,1,'#c8c0b0');rc(g,7,4,6,1,'#c8c0b0');rc(g,22,0,4,7,'#5aa9e6');});
  case 'board':return mk(40,34,g=>{rc(g,4,18,3,16,OL);rc(g,33,18,3,16,OL);rc(g,0,0,40,24,OL);rc(g,1,1,38,22,'#a8692f');rc(g,3,3,34,18,'#d8b07a');for(let i=0;i<4;i++){rc(g,5+i*8,5+(i%2)*3,7,9,'#fffaf0');rc(g,7+i*8,4+(i%2)*3,2,2,'#e8415a');}});
  }
}
function buildWall(k){
  switch(k){
  case 'window':return mk(30,22,g=>{rc(g,0,0,30,22,'#6a4a32');rc(g,2,2,26,18,'#9fd6f2');rc(g,2,2,26,7,'#c4e8f8');rc(g,14,2,2,18,'#ffffff');rc(g,2,10,26,2,'#ffffff');rc(g,0,0,6,22,'#f49ab0');rc(g,24,0,6,22,'#f49ab0');rc(g,0,20,30,2,'#8a5a3a');});
  case 'nightwin':return mk(30,22,g=>{rc(g,0,0,30,22,'#6a4a32');rc(g,2,2,26,18,'#2a2f5a');for(let i=0;i<7;i++)rc(g,4+((i*7)%22),4+((i*5)%12),1,1,'#fff6c0');ell(g,20,7,2.4,2.4,'#fff6c0');rc(g,14,2,2,18,'#ffffff');rc(g,2,10,26,2,'#ffffff');rc(g,0,0,6,22,'#f49ab0');rc(g,24,0,6,22,'#f49ab0');});
  case 'calendar':return mk(14,16,g=>{rc(g,0,0,14,16,'#4a2e1e');rc(g,1,1,12,14,'#fffaf0');rc(g,1,1,12,4,'#e8415a');for(let i=0;i<9;i++)rc(g,2+(i%3)*4,7+Math.floor(i/3)*3,2,1,'#8a7a6a');});
  case 'painting':return mk(22,16,g=>{rc(g,0,0,22,16,'#a8692f');rc(g,2,2,18,12,'#9fd6f2');rc(g,2,9,18,5,'#7cc36a');ell(g,8,9,4,3,'#4f9a45');ell(g,16,5,2,2,'#fff6c0');});
  case 'clock':return mk(12,12,g=>{ell(g,6,6,6,6,'#4a2e1e');ell(g,6,6,5,5,'#fffaf0');rc(g,6,3,1,3,'#4a2e1e');rc(g,6,6,3,1,'#4a2e1e');});
  case 'sign':return mk(28,10,g=>{rc(g,0,0,28,10,'#4a2e1e');rc(g,1,1,26,8,'#e8c88a');});
  }
}
// ---------- 아이템 아이콘 ----------
function drawItemIcon(id,x,y){
  const p=(a,b,w,h,c)=>px(x+a,y+b,w,h,c);
  switch(id){
  case 'kibble':p(1,3,8,6,'#4a2e1e');p(2,4,6,4,'#c98a4f');p(3,1,4,3,'#f7d64a');p(3,5,1,1,'#7a4a28');p(5,6,1,1,'#7a4a28');break;
  case 'treat':p(0,3,10,4,'#4a2e1e');p(1,4,8,2,'#fff1d8');p(0,2,3,3,'#4a2e1e');p(7,2,3,3,'#4a2e1e');p(0,5,3,3,'#4a2e1e');p(7,5,3,3,'#4a2e1e');p(1,3,1,1,'#fff1d8');p(8,3,1,1,'#fff1d8');p(1,6,1,1,'#fff1d8');p(8,6,1,1,'#fff1d8');break;
  case 'ball':ell(ctx,x+5,y+5,4.5,4.5,'#4a2e1e');ell(ctx,x+5,y+5,3.6,3.6,'#c8e04a');p(2,4,6,1,'#ffffff');break;
  case 'coin':p(0,3,10,4,'#4a2e1e');p(1,4,8,2,'#f7d64a');p(0,2,3,3,'#4a2e1e');p(7,2,3,3,'#4a2e1e');p(0,5,3,3,'#4a2e1e');p(7,5,3,3,'#4a2e1e');p(1,3,1,1,'#f7d64a');p(8,3,1,1,'#f7d64a');p(1,6,1,1,'#f7d64a');p(8,6,1,1,'#f7d64a');p(2,4,3,1,'#fff3b0');break;
  case 'photo':p(0,2,10,7,'#4a2e1e');p(1,3,8,5,'#5a5a66');ell(ctx,x+5,y+5.4,2.2,2.2,'#9fd6f2');p(6,1,3,2,'#4a2e1e');break;
  case 'basket':p(1,4,8,5,'#4a2e1e');p(2,5,6,3,'#c98a4f');p(2,2,6,3,'#e2a45a');p(3,0,4,1,'#4a2e1e');p(2,1,1,3,'#4a2e1e');p(7,1,1,3,'#4a2e1e');break;
  case 'flower':p(4,4,1,5,'#2d6b2a');p(2,1,5,3,'#f49ac0');p(3,0,3,5,'#f49ac0');p(4,2,1,1,'#fff3b0');break;
  case 'find':p(1,2,8,6,'#4a2e1e');p(2,3,6,4,'#f2c6d8');p(3,4,4,1,'#e8415a');break;
  case 'heart':drawHeart(x,y,true);break;
  case 'star':p(4,0,2,10,'#f7c63a');p(0,4,10,2,'#f7c63a');p(2,2,6,6,'#ffe27a');break;
  case 'paw':ell(ctx,x+5,y+6,3,2.4,'#4a2e1e');ell(ctx,x+5,y+6,2.2,1.6,'#f49ab0');for(const [a,b] of [[1.5,2.5],[4,1],[6.5,1],[9,2.5]]){ell(ctx,x+a,y+b,1.3,1.3,'#4a2e1e');}break;
  case 'friend':ctx.drawImage(pupImg(DAMI_P,'icon','down',0,'happy'),4,5,20,16,x-1,y-1,12,10);break;
  case 'bath':p(0,4,10,5,'#4a2e1e');p(1,5,8,3,'#9fd8f2');ell(ctx,x+3,y+3,1.6,1.6,'#ffffff');ell(ctx,x+6,y+2,1.2,1.2,'#ffffff');break;
  case 'bed':p(0,3,10,6,'#4a2e1e');p(1,4,8,4,'#b9a3e0');p(1,4,3,2,'#ffffff');break;
  case 'walk':p(4,0,2,2,'#4a2e1e');p(3,2,4,4,'#c9b6e4');p(3,6,1,3,'#3e4a6b');p(6,6,1,3,'#3e4a6b');break;
  case 'water':ell(ctx,x+5,y+6,4,3,'#4a2e1e');ell(ctx,x+5,y+6,3,2.2,'#7cc8f0');p(4,0,2,4,'#7cc8f0');break;
  default:if(TREASURES[id]){p(1,1,8,8,'#4a2e1e');p(2,2,6,6,'#f7d64a');p(3,3,2,2,'#fff3b0');}
  }
}

// ---------- 새 구역 소품 (v4) ----------
const _buildObjBase=buildObj;
buildObj=function(kind,v=0){
  switch(kind){
  case 'tent':return mk(34,26,g=>{const O='#3a2418',c=['#e8734a','#5a9fd4','#7cc36a'][v%3],d=['#c4583a','#3f7fb4','#5aa34a'][v%3];
    for(let r=0;r<22;r++){const w=4+r*1.4;rc(g,17-w/2-1,2+r,w+2,1,O);}for(let r=1;r<21;r++){const w=2+r*1.4;rc(g,17-w/2,2+r,w/2,1,c);rc(g,17,2+r,w/2,1,d);}
    for(let r=8;r<21;r++){const w=(r-8)*.7;rc(g,17-w/2,2+r,w,1,'#3a2a20');}rc(g,1,23,32,2,O);rc(g,16,0,2,4,O);rc(g,18,0,4,2,'#f7d64a');});
  case 'campfire':return mk(26,22,g=>{for(let i=0;i<7;i++){const a=i/7*6.28;ell(g,13+Math.cos(a)*9,17+Math.sin(a)*3.5,2.6,2,'#6a6a70');ell(g,13+Math.cos(a)*9,16.6+Math.sin(a)*3.5,2,1.4,'#9a9aa2');}
    rc(g,6,15,14,3,'#4a2e1e');rc(g,7,15,12,2,'#8a5a36');ell(g,13,11,5,7,'#e8541e');ell(g,13,12,3.4,5,'#f7a83a');ell(g,13,13.4,2,3,'#ffe27a');});
  case 'umbrella':return mk(34,38,g=>{rc(g,16,8,2,28,'#4a2e1e');rc(g,17,8,1,28,'#e6dccc');for(let r=0;r<12;r++){const w=10+r*2.2;rc(g,17-w/2-1,r,w+2,1,'#4a2e1e');}
    for(let r=1;r<11;r++){const w=8+r*2.2;for(let x=0;x<w;x++)rc(g,17-w/2+x,r,1,1,Math.floor(x/(w/6))%2?'#ffffff':'#ef5a6f');}ell(g,17,36,10,2,'rgba(0,0,0,.12)');});
  case 'windmill':return mk(44,60,g=>{const O='#4a2e1e';for(let r=0;r<34;r++){const w=10+r*.45;rc(g,22-w/2-1,24+r,w+2,1,O);rc(g,22-w/2,24+r,w,1,r%6<3?'#f2e6cf':'#e6d6b6');}
    rc(g,19,48,6,10,O);rc(g,20,49,4,9,'#8a5a36');ell(g,22,22,5,5,O);ell(g,22,22,4,4,'#c0602a');
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){for(let k=3;k<20;k++){const x=22+dx*k,y=22+dy*k;rc(g,x-(dy?2:0)-1,y-(dx?2:0)-1,dy?6:2,dx?6:2,O);}for(let k=4;k<19;k++){const x=22+dx*k,y=22+dy*k;rc(g,x-(dy?2:0),y-(dx?2:0),dy?4:1,dx?4:1,'#fff8e8');}}});
  }
  return _buildObjBase(kind,v);
};
const KITTEN=mk(14,12,g=>{const O='#3a2a2a';ell(g,8,8,5.6,3.6,O);ell(g,8,8,4.6,2.8,'#f2a65a');ell(g,4,5,3.6,3.4,O);ell(g,4,5,2.8,2.6,'#f2a65a');rc(g,1,1,2,3,O);rc(g,5,1,2,3,O);rc(g,2,2,1,1,'#f49ab0');rc(g,5,2,1,1,'#f49ab0');
  rc(g,2,5,1,1,'#1e1512');rc(g,5,5,1,1,'#1e1512');rc(g,3,6,1,1,'#f49ab0');rc(g,12,4,2,5,O);rc(g,12,5,1,3,'#f2a65a');for(let i=0;i<3;i++)rc(g,6+i*2,7,1,2,'#d8843a');});
const _drawAccBase=drawAcc;
drawAcc=function(g,a,x,y,dir){
  if(a==='crown'){rc(g,x-4,y-1,9,4,'#8a5a1a');rc(g,x-3,y,7,2,'#f7c63a');for(const dx of [-3,0,3]){rc(g,x+dx-1,y-3,3,3,'#8a5a1a');rc(g,x+dx,y-2,1,2,'#f7c63a');}rc(g,x,y,1,1,'#ef5a6f');return;}
  if(a==='shades'){const yy=y+5;if(dir==='side'){rc(g,x+1,yy,4,2,'#1a1a1a');}else{rc(g,x-10,yy+1,4,2,'#1a1a1a');rc(g,x-4,yy+1,4,2,'#1a1a1a');rc(g,x-6,yy+1,2,1,'#1a1a1a');}return;}
  if(a==='scarf'){if(dir==='side')rc(g,x-5,y+10,4,4,'#c84a3a');else{rc(g,x-9,y+11,10,2,'#c84a3a');rc(g,x-9,y+11,10,1,'#f0e6d6');rc(g,x-3,y+13,2,3,'#c84a3a');}return;}
  return _drawAccBase(g,a,x,y,dir);
};
const _drawItemIconBase=drawItemIcon;
drawItemIcon=function(id,x,y){const p=(a,b,w,h,c)=>px(x+a,y+b,w,h,c);
  if(id==='frisbee'){ell(ctx,x+5,y+5,5,3,'#4a2e1e');ell(ctx,x+5,y+5,4,2.2,'#ef5a6f');ell(ctx,x+5,y+4.6,2,1,'#ffb3bf');return;}
  if(id==='kitten'){ctx.drawImage(KITTEN,x-2,y-1);return;}
  if(id==='news'){p(0,1,10,8,'#4a2e1e');p(1,2,8,6,'#fffaf0');p(2,3,6,1,'#c0602a');p(2,5,6,1,'#9a8a7a');p(2,6,4,1,'#9a8a7a');return;}
  if(TREASURES[id]&&!['coin','marble','key','bone','shell','acorn','star','ball'].includes(id)){p(1,1,8,8,'#4a2e1e');p(2,2,6,6,{glass:'#7cd8c8',pinecone:'#d8a83a',feather:'#5aa9e6',harmonica:'#c0c4cc'}[id]||'#f7d64a');p(3,3,2,2,'#ffffff');return;}
  return _drawItemIconBase(id,x,y);
};
