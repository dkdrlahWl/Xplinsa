/* Solo tower: isolated combat state, durable pending rewards, KST tickets. */
window.TOWER=(()=>{
 const WORLD_W=800,WORLD_H=1280;
 // 기준층 사이의 체력·공격력은 비율로 보간해 장비 성장 구간의 난이도를 잇는다.
 const growth=[
  [1,55,7],[10,240,48],[20,1000,180],[30,4400,620],[40,15000,1700],
  [50,63000,5500],[60,165000,12000],[70,420000,25000],
  [80,950000,47000],[90,2100000,85000],[100,4500000,140000]
 ];
 function floorStats(f){
  const i=growth.findIndex(row=>row[0]>=f),hi=growth[i],lo=growth[Math.max(0,i-1)];
  const t=hi===lo?1:(f-lo[0])/(hi[0]-lo[0]);
  const scale=k=>Math.round(lo[k]*(hi[k]/lo[k])**t);
  return {hp:scale(1),attack:scale(2),total:13+Math.floor(f*1.35),active:8+Math.floor(f/34)};
 }
 let visible=false,mode='lobby',floor=1,run=null,paused=false,stick=null,particles=[],selected=null;
 const root=document.createElement('section');root.id='tower-screen';root.hidden=true;root.setAttribute('aria-label','도전의 탑');$('game').appendChild(root);
 const art=k=>'assets/tower_'+k+'.webp';
 const image=(k,cls='')=>'<img class="'+cls+'" src="'+art(k)+'" alt="">';
 const icon=k=>'<img src="assets/icon_'+k+'.webp" alt="">';
 function state(){
  const day=calendarKey(),vip=vipActive();
  const a=S.tower||(S.tower={clear:0,clears:0,chests:0,pending:null});
  if(a.day!==day){a.day=day;a.tickets=2;a.vipTicketGranted=false}
  // Older same-day saves lack a grant flag. Keep their ticket balance and usage.
  if(a.vipTicketGranted==null)a.vipTicketGranted=vip||a.tickets>2;
  if(vip&&!a.vipTicketGranted){a.tickets++;a.vipTicketGranted=true}
  if(a.bonusDay!==day){a.bonusDay=day;a.bonus=0}
  return a;
 }
 function reward(f){const base=f===1?60:Math.round(900*Math.pow(1.026,f-2)),cg=typeof MT!=='undefined'&&typeof topZone==='function'?MT[ZS[topZone()].m[0]].gold*(25+f*.75):0;return {gold:Math.round(Math.max(base,cg)),gem:10+Math.floor((f-1)/5),scr:10*(1+Math.floor((f-1)/5))}}
 function rewards(r){return ['gold','gem','scr'].map(k=>'<div>'+icon(k)+'<b>'+fmt(r[k])+'</b></div>').join('')}
 function monster(f){return (f-1)%6}
 function top(){const a=state();return '<div class="tw-currencies"><span>'+image('ticket')+' '+a.tickets+'/'+(a.vipTicketGranted?3:2)+'</span><span data-reward-kind="gold">'+icon('gold')+' '+fmt(S.gold)+'</span><span data-reward-kind="gem">'+icon('gem')+' '+fmt(S.gem)+'</span><span data-reward-kind="scr">'+icon('scr')+' '+fmt(S.scr)+'</span></div>'}
 function lobby(){mode='lobby';run=null;stick=null;paused=false;const a=state();floor=clamp(floor,1,Math.min(100,a.clear+1));root.innerHTML=top()+'<button class="tw-back" data-t="exit" aria-label="나가기">←</button><button class="tw-floor-up" data-t="next" '+(floor>=Math.min(100,a.clear+1)?'disabled':'')+' aria-label="위층">▲</button><header class="tw-floor">'+(floor<=a.clear?'<small>✓ 클리어!</small>':'')+'<b>'+floor+'층</b><div class="tw-rewards">'+rewards(reward(floor))+'</div></header><button class="tw-pass '+(a.clears>=(a.chests+1)*10?'reward-alert':'')+'" data-t="milestone">'+image('chest')+'<i><em style="height:'+Math.min(100,(a.clears-a.chests*10)*10)+'%"></em></i><b>'+Math.max(0,a.clears-a.chests*10)+'/10</b></button><div class="tw-enemies">'+image('mon_'+monster(floor),'tw-boss')+'<div>'+[0,1,2].map(()=>image('mon_'+((monster(floor)+1)%6))).join('')+'</div></div><div class="tw-actions"><button class="tw-green" data-t="sweep" '+(!a.tickets||a.clear<1?'disabled':'')+'>'+(floor<=a.clear?'소탕':'이전 층 소탕')+'<small>'+image('ticket')+' ×1</small></button><button class="tw-yellow" data-t="challenge" '+(!a.tickets?'disabled':'')+'>도전<small>'+image('ticket')+' ×1</small></button></div><div class="tw-reset">입장권 매일 00시 '+(typeof vipActive==='function'&&vipActive()?'3장 (VIP)':'2장')+' 충전</div><button class="tw-floor-down" data-t="prev" '+(floor<=1?'disabled':'')+' aria-label="아래층">▼</button>';root.dataset.mode='lobby'}
 function openTower(){if(P.dead){toast('부활한 후 도전해 주세요');return}close();visible=true;root.hidden=false;joy.on=false;joy.x=joy.y=0;P.moving=false;P.swingT=0;P.pend=null;P.extraT=0;P.recall=null;for(const m of mons)m.agg=false;floor=Math.min(100,state().clear+1);if(state().pending)result();else lobby()}
 function exit(){if(run){paused=true;renderPause(true);return}visible=false;root.hidden=true;root.innerHTML='';stick=null;save()}
 function pending(f,sweep){const a=state();a.tickets--;a.clears++;if(typeof trackTask==='function')trackTask('tower');a.clear=Math.max(a.clear,f);a.pending={id:Date.now()+'-'+Math.random().toString(36).slice(2),floor:f,reward:reward(f),sweep:!!sweep};save();result()}
 function result(){mode='result';run=null;stick=null;const a=state(),p=a.pending;if(!p){lobby();return}root.dataset.mode='result';root.innerHTML=top()+'<div class="tw-result"><div class="tw-victory">'+image('victory')+'<strong>'+(p.sweep?'소탕 완료':'승리')+'</strong></div><h3>'+p.floor+'층 보상</h3><div class="tw-rewards tw-result-rewards">'+rewards(p.reward)+'</div><div class="tw-actions"><button class="tw-green" data-t="claim">받기</button><button class="tw-yellow" data-t="double" '+(!vipActive()||a.bonus>=3?'disabled':'')+'>2배 받기<small>'+(vipActive()?'일일 무료 '+(3-a.bonus)+'/3':'VIP 구매 시 해금')+'</small></button></div></div>'}
 function claim(double=false){const a=state(),p=a.pending;if(!p||double&&(!vipActive()||a.bonus>=3))return false;const mult=double?2:1;a.pending=null;if(double)a.bonus++;for(const k of ['gold','gem','scr'])S[k]+=p.reward[k]*mult;save();toast('탑 보상 획득!');floor=Math.min(100,a.clear+1);lobby();rewardFly(Object.fromEntries(Object.entries(p.reward).map(([k,v])=>[k,v*mult])));return true}
 function milestone(){const a=state();if(a.clears<(a.chests+1)*10){selected='milestone';root.insertAdjacentHTML('beforeend','<div class="tw-dialog"><div>'+image('chest')+'<h3>탑 10회 클리어 보상</h3><p>보석 60 · 오브 7 · 전사의 무기상자 열쇠 1개</p><button data-t="dismiss" class="tw-green">확인</button></div></div>');return}a.chests++;S.gem+=60;S.orb+=7;S.keys=S.keys||{};S.keys.b3=(S.keys.b3||0)+1;save();toast('보석 60 · 오브 7 · 전사의 무기상자 열쇠 1개 획득! (상점에서 사용)');lobby();rewardFly({gem:60,orb:7})}
 function start(){const a=state();if(!a.tickets||a.pending)return;calc();const f=floor;run=makeCombatArena(WORLD_W,WORLD_H,enemy=>{
   if(enemy.hp>0)return;
   run.kills++;
   window.SFX?.play(enemy.d.boss?'kill_boss':'kill',{v:enemy.d.boss?.8:.45,x:enemy.x,y:enemy.y});
 });Object.assign(run,floorStats(f),{floor:f,time:30,spawned:0,kills:0,spawn:2,age:0});
 Object.assign(run.player,{x:WORLD_W/2,y:WORLD_H*.69,hp:ST.maxhp,walk:0,dir:-Math.PI/2});mode='battle';paused=false;root.dataset.mode='battle';root.innerHTML='<canvas id="tw-canvas"></canvas><div id="tw-ready" class="tw-ready">2</div><div class="tw-battle-head"><b>'+f+'층</b><div><strong id="tw-count"></strong><i><em id="tw-progress"></em></i><span id="tw-time">30</span></div><button data-t="pause" aria-label="일시정지">Ⅱ</button></div><div class="tw-health"><span id="tw-hp"></span><i><em id="tw-hpbar"></em></i></div><div class="tw-bag">가방 ∞<small>골드·보석·주문서 보상</small></div>';bindCanvas();save()}
 function spawn(){
  const r=run,f=r.floor,boss=r.spawned===r.total-1;
  const hp=Math.round(r.hp*(boss?8+f*.035:1)),angle=Math.random()*TAU,h=r.player;
  const distance=boss?145:225;
  const x=clamp(h.x+Math.cos(angle)*distance,28,WORLD_W-28),y=clamp(h.y+Math.sin(angle)*distance,95,WORLD_H-70);
  r.enemies.push({x,y,z:0,hp,dead:false,sprite:'tower_mon_'+(boss?monster(f):(monster(f)+1)%6),
   d:{r:boss?38:21,hp,boss,n:f+'층 수호자'},cd:.7,hitT:0,spawnT:.3,ph:Math.random()*TAU,speed:boss?52+f*.20:47+f*.25});
  r.spawned++;
 }
 function tick(dt){
  if(visible&&mode==='result'){const b=root.querySelector('[data-t="double"]');if(b){b.disabled=!vipActive()||state().bonus>=3;b.querySelector('small').textContent=vipActive()?'일일 무료 '+(3-state().bonus)+'/3':'VIP 구매 시 해금'}}
  if(!visible||mode!=='battle'||paused||!run)return;
  const r=run,h=r.player,oldAge=r.age;
  r.age+=dt;T+=dt;
  r.time=Math.max(0,r.time-(Math.max(0,r.age-2)-Math.max(0,oldAge-2)));
  const ready=document.getElementById('tw-ready');
  ready.hidden=r.age>=2;ready.textContent=Math.max(1,Math.ceil(2-r.age));
  r.spawn=Math.max(-dt,r.spawn-dt);h.hp=Math.min(ST.maxhp,h.hp+ST.regen*dt);
  let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(stick){dx=stick.dx;dy=stick.dy}
  const len=Math.hypot(dx,dy);h.moving=len>.08;
  if(h.moving){
   const v=ST.spd*dt/Math.max(1,len);
   h.x=clamp(h.x+dx*v,22,WORLD_W-22);h.y=clamp(h.y+dy*v,80,WORLD_H-60);
   h.walk+=dt*11*Math.min(1.5,ST.spd/190);if(h.swingT<=0)h.dir=Math.atan2(dy,dx);
  }
  if(r.age+1e-8>=2&&r.spawn<=1e-8&&r.spawned<r.total&&r.enemies.length<r.active){
   spawn();r.spawn+=Math.min(.45,20/(r.total-1));
  }
  withArenaCombat(r,()=>{
   for(const m of r.enemies){
    m.ph+=dt*6;m.hitT-=dt;m.spawnT-=dt;m.cd-=dt;
    if(m.stunT>0){m.stunT-=dt;continue}
    const d=Math.hypot(m.x-h.x,m.y-h.y);
    if(d>26){m.x+=(h.x-m.x)/d*m.speed*dt;m.y+=(h.y-m.y)/d*m.speed*dt}
    else if(m.cd<=0){
     m.cd=.85;
     const damage=Math.round(r.attack*(m.d.boss?2:1));
     h.hp-=damage;h.hitT=.2;window.SFX?.play(h.hp<=0?'die':'hurt',{v:.6,gap:.25});num(h.x,h.y-56,'-'+fmt(damage),'#ff6b6b');
    }
   }
   if(h.hp>0&&r.age>=2){stepPlayerCombat(dt);stepCombatShots(dt)}
   stepCombatEffects(dt);
  });
  for(let i=r.enemies.length-1;i>=0;i--)if(r.enemies[i].dead)r.enemies.splice(i,1);
  if(h.hp<=0){failure('체력이 모두 소진됐어요');return}
  if(r.kills>=r.total){pending(r.floor,false);return}
  if(r.time<=0){failure('도전 시간이 끝났어요');return}
  document.getElementById('tw-count').textContent='☠ '+(r.total-r.kills);
  document.getElementById('tw-time').textContent='◷ '+Math.ceil(r.time);
  document.getElementById('tw-progress').style.width=(1-r.kills/r.total)*100+'%';
  document.getElementById('tw-hp').textContent='체력 '+fmt(h.hp)+' / '+fmt(ST.maxhp);
  document.getElementById('tw-hpbar').style.width=(h.hp/ST.maxhp*100)+'%';
 }
 function failure(reason){run=null;stick=null;mode='failed';root.innerHTML='<div class="tw-result"><h2>도전 종료</h2><p>'+reason+'</p><p>입장권은 소모되지 않았어요.</p><button class="tw-yellow" data-t="lobby">다시 준비하기</button></div>';save()}
 function renderPause(quit=false){root.querySelector('.tw-dialog')?.remove();root.insertAdjacentHTML('beforeend','<div class="tw-dialog"><div><h3>'+(quit?'도전을 그만할까요?':'일시정지')+'</h3><p>남은 시간 '+Math.ceil(run.time)+'초</p><button class="tw-green" data-t="resume">계속하기</button><button class="tw-yellow" data-t="quit">로비로</button></div></div>')}
 function bindCanvas(){
  const c=document.getElementById('tw-canvas');
  c.onpointerdown=e=>{
   if(paused||stick)return;
   const b=c.getBoundingClientRect();
   stick={id:e.pointerId,x:e.clientX-b.left,y:e.clientY-b.top,dx:0,dy:0};
   c.setPointerCapture(e.pointerId);
  };
  c.onpointermove=e=>{
   if(!stick||e.pointerId!==stick.id)return;
   const b=c.getBoundingClientRect(),dx=e.clientX-b.left-stick.x,dy=e.clientY-b.top-stick.y,l=Math.max(36,Math.hypot(dx,dy));
   stick.dx=dx/l;stick.dy=dy/l;
  };
  c.onpointerup=c.onpointercancel=c.onlostpointercapture=e=>{if(stick?.id===e.pointerId)stick=null};
 }
 function draw(){
  if(!run||mode!=='battle')return;
  const c=document.getElementById('tw-canvas'),w=c.clientWidth,h=c.clientHeight;
  if(!w||!h)return;
  const dp=Math.max(.75,Math.min(2,window.devicePixelRatio||1,Math.sqrt(3.6e6/(w*h))));
  const pxW=Math.round(w*dp),pxH=Math.round(h*dp);
  if(c.width!==pxW||c.height!==pxH){c.width=pxW;c.height=pxH}
  const g=c.getContext('2d'),r=run,hero=r.player;
  const zoom=Math.max(window.viewZoom?viewZoom(w,h,430):w/430,h/WORLD_H),scale=zoom*dp;
  const vw=w/zoom,vh=h/zoom;
  const fol=(v,s,view)=>view>=s?s/2:clamp(v,view/2,s-view/2),cx=fol(hero.x,WORLD_W,vw),cy=fol(hero.y-20,WORLD_H,vh); // 넓은 화면: 탑이 화면보다 좁으면 가운데 정렬
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#1c1830';g.fillRect(0,0,pxW,pxH);
  g.setTransform(scale,0,0,scale,pxW/2-cx*scale,pxH/2-cy*scale);
  drawArenaGround(g,WORLD_W,WORLD_H,'tile_4','#525365',false);
  withArenaCombat(r,()=>{
   ctx=g;PV=0;g.lineWidth=2.2;g.strokeStyle=OLC;g.lineJoin='round';
   const scene=[...r.enemies,hero].sort((a,b)=>a.y-b.y);
   for(const item of scene){if(item===hero)drawPlayer();else drawMon(item)}
   drawCombatEffects();
  });
  if(stick){
   g.setTransform(dp,0,0,dp,0,0);
   g.strokeStyle='#ffffff70';g.lineWidth=3;g.beginPath();g.arc(stick.x,stick.y,36,0,TAU);g.stroke();
   g.fillStyle='#ffffffa0';g.beginPath();g.arc(stick.x+stick.dx*30,stick.y+stick.dy*30,13,0,TAU);g.fill();
  }
 }
 root.addEventListener('click',e=>{const action=e.target.closest('[data-t]');if(!action||action.disabled)return;switch(action.dataset.t){case'exit':exit();break;case'prev':floor--;lobby();break;case'next':floor++;lobby();break;case'challenge':start();break;case'sweep':{const a=state();if(a.tickets>0&&a.clear>0&&!a.pending)pending(Math.min(floor,a.clear),true);break}case'claim':claim();break;case'double':claim(true);break;case'milestone':milestone();break;case'dismiss':root.querySelector('.tw-dialog')?.remove();break;case'pause':paused=true;stick=null;renderPause();break;case'resume':paused=false;root.querySelector('.tw-dialog')?.remove();break;case'quit':run=null;lobby();break;case'lobby':lobby();break}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&run){paused=true;stick=null;renderPause()}});window.addEventListener('blur',()=>{if(run){paused=true;stick=null;renderPause()}});
 return {get visible(){return visible},open:openTower,tick,draw,state,reward,claim,get mode(){return mode}};
})();
