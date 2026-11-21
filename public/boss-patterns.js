'use strict';

const FIELD_BOSS_ROTATIONS = [
  ['charge', 'volley', 'impact'], ['volley', 'impact', 'charge'],
  ['impact', 'ring', 'charge'], ['charge', 'impact', 'volley'],
];
const WORLD_BOSS_ROTATION = ['charge', 'ring', 'volley', 'impact', 'charge', 'volley'];
const RAIJIN_ROTATION = ['volley', 'charge', 'radial', 'impact', 'ring', 'cataclysm'];

function bossCircle(m) {
  return m.d.world ? WBA : {x:m.hx,y:m.hy,r:m.ar};
}
function insideBossCircle(m, x, y) {
  const a = bossCircle(m);
  return Math.hypot(x-a.x,y-a.y) <= a.r;
}
function returnBossHome(m, x, y, max, dt, heal=true) {
  const dx=x-m.x,dy=y-m.y,d=Math.hypot(dx,dy);
  const step=d ? Math.min(1,460*dt/d) : 0;
  m.x+=dx*step;
  m.y+=dy*step;
  if(heal)m.hp=Math.min(max,m.hp+max*.45*dt);
}
function fieldBossFight(m, dt, enabled, remote) {
  const world = !!m.d.world;
  if (combatArena || !m.d.boss || (!world && !(CHAP >= 2 || m.z >= 2))) return false;
  const arena = bossCircle(m);
  const inside = (x,y,pad=0) => Math.hypot(x-arena.x,y-arena.y) <= arena.r-pad;
  if (!enabled || m.dead || !inside(P.x,P.y)) {
    m.pattern = null;
    m.patternDelay = 2;
    m.patternIndex = 0;
    return false;
  }

  const main = !world && m.type === ZS[m.z]?.boss;
  const enraged = (world || main) && m.hp <= m.d.hp*.5;
  const index = m.patternIndex || 0;
  const rotation = m.type === 'wboss3' ? RAIJIN_ROTATION : world ? WORLD_BOSS_ROTATION : FIELD_BOSS_ROTATIONS[(m.z+(CHAP>=2?1:0)+(m.type===ZS[m.z].boss2?1:0))%4];
  if (!m.pattern) {
    m.patternDelay = (m.patternDelay ?? 2)-dt;
    if (m.patternDelay > 0) return false;
    if (main && CHIEF_LOADOUTS[m.type] && index%2===0) {
      m.pattern=startChiefPattern(m,arena,index/2,enraged);
      m.patternIndex=index+1;
      window.SFX?.play('warn',{v:.6,x:m.x,y:m.y});
      return true;
    }
    const baseKind = rotation[index%rotation.length];
    const phase=Math.floor(index/2)%(rotation.length+2);
    const regionalKind=rotation[phase];
    const kind=!main?baseKind:phase===rotation.length?'radial':phase===rotation.length+1?'cataclysm':regionalKind==='impact'?'barrage':regionalKind;
    const warn = kind==='cataclysm'?(enraged?1.12:1.38):world ? (enraged?.69:.88) : main ? (enraged?.72:.92) : (CHAP>=2?.93:1.12);
    const a = Math.atan2(P.y-m.y,P.x-m.x);
    const ux=Math.cos(a), uy=Math.sin(a);
    const origin={x:m.x,y:m.y}, target={x:P.x,y:P.y};
    let distance=0;
    const chargeMax=Math.min(world?370:main?335:240,Math.hypot(P.x-m.x,P.y-m.y)+65);
    while (distance+8<=chargeMax && inside(origin.x+ux*(distance+8),origin.y+uy*(distance+8),24)) distance+=8;
    const end={x:origin.x+ux*distance,y:origin.y+uy*distance};
    const count=world?(enraged?9:7):main?(enraged?9:7):(CHAP>=2?5:3);
    const radialCount=enraged?18:14;
    const rays=kind==='radial'?Array.from({length:radialCount},(_,i)=>a+i*TAU/radialCount):Array.from({length:count},(_,i)=>a+(i-(count-1)/2)*.29);
    const offset=Math.min(125,arena.r-70);
    const safeAngle=Math.atan2(P.y-arena.y,P.x-arena.x)+.9;
    const safe={x:arena.x+Math.cos(safeAngle)*offset,y:arena.y+Math.sin(safeAngle)*offset,r:62};
    m.pattern={kind,warn,elapsed:0,origin,target,end,distance,rays,hit:false,world,enraged,
      main, arena, safe, waves:enraged?3:2, strikes:main?(enraged?3:2):1, radius:kind==='ring'?(world?130:main?125:94):(world?108:main?111:75), width:world?38:main?49:29};
    m.patternIndex=index+1;
    window.SFX?.play('warn',{v:.6,x:m.x,y:m.y});
  }
  const p=m.pattern;
  if (p.chief) { tickChiefPattern(m,dt); return true; }
  const before=Math.max(0,p.elapsed-p.warn);
  p.elapsed+=dt;
  const active=p.elapsed-p.warn;
  if (active<0) return true;
  if (before===0) window.SFX?.play('slam',{v:.7,x:p.origin.x,y:p.origin.y});

  let hit=false;
  const duration=p.kind==='charge'?.44:isPatternProjectile(p)?(world?1.35:p.main?1.2:.97):.32;
  if (p.kind==='charge') {
    const from=patternDashPoint(p,before), to=patternDashPoint(p,active);
    if (!remote) {m.x=to.x;m.y=to.y;}
    hit=patternSegmentHit(from,to,p.width);
  } else if (isPatternProjectile(p)) {
    for (const angle of p.rays) {
      const from=patternShotPoint(p,angle,before), to=patternShotPoint(p,angle,active);
      if (inside(to.x,to.y) && patternSegmentHit(from,to,world||p.main?21:16)) {hit=true;break;}
    }
  } else if (p.kind==='cataclysm' && before===0) {
    hit=Math.hypot(P.x-p.safe.x,P.y-p.safe.y)>p.safe.r;

  } else if (before===0) {
    const center=p.kind==='ring'?p.origin:p.target;
    const range=Math.hypot(P.x-center.x,P.y-center.y);
    hit=p.kind==='ring'?Math.abs(range-p.radius)<32:range<p.radius;

  }
  if (hit && !p.hit) {
    p.hit=true;
    const multiplier=p.kind==='cataclysm'?(p.enraged?4.5:3.8):p.kind==='radial'?1.65:world?(enraged?2.8:2.35):1.75;
    hitPlayer(Math.round(m.d.atk*multiplier));
  }
  if (active>=duration) {
    if (p.kind==='radial' && p.waves>1) {
      p.waves--;
      p.elapsed=0;
      p.warn=.52;
      p.hit=false;
      const turn=Math.PI/p.rays.length;
      p.rays=p.rays.map(a=>a+turn);
      window.SFX?.play('warn',{v:.6,x:m.x,y:m.y});
      return true;
    }
    if (p.kind==='barrage' && p.strikes>1) {
      p.strikes--;
      p.elapsed=0;
      p.warn=p.enraged?.66:.82;
      p.target={x:P.x,y:P.y};
      p.hit=false;
      window.SFX?.play('warn',{v:.6,x:m.x,y:m.y});
      return true;
    }
    m.pattern=null;
    m.patternDelay=world?(enraged?.45:.8):p.main?(p.enraged?.6:1.03):(CHAP>=2?1.55:2.1);
  }
  return true;
}

function isPatternProjectile(p) { return p.kind==='volley' || p.kind==='radial'; }

function patternDashPoint(p,t) {
  const f=clamp(t/.44,0,1);
  return {x:p.origin.x+(p.end.x-p.origin.x)*f,y:p.origin.y+(p.end.y-p.origin.y)*f};
}

function patternShotPoint(p,a,t) {
  const r=t*(p.world?370:p.main?345:300);
  return {x:p.origin.x+Math.cos(a)*r,y:p.origin.y+Math.sin(a)*r};
}

function patternSegmentHit(a,b,r) {
  if (a.x===b.x && a.y===b.y) return Math.hypot(P.x-a.x,P.y-a.y)<r;
  return dSeg(P.x,P.y,a,b)<r;
}

function drawFieldBossPattern(m) {
  const p=m.pattern;
  if (!p || m.dead) return;
  if (p.chief) { drawChiefPattern(m); return; }
  const active=p.elapsed-p.warn;
  const names={charge:'돌진',volley:'연발 투사체',ring:'고리 충격파',impact:'낙하 강타',barrage:'연속 낙하',radial:'교차 탄막',cataclysm:'대붕괴 · 안전지대로!'};
  ctx.save();
  if (active<0) {
    ctx.globalAlpha=.28+.28*p.elapsed/p.warn;
    if (p.kind==='cataclysm') {
      const {arena,safe}=p;
      ctx.fillStyle='#ba33ee';
      ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r,0,Math.PI*2);
      ctx.moveTo(safe.x+safe.r,safe.y);ctx.arc(safe.x,safe.y,safe.r,0,Math.PI*2);
      ctx.fill('evenodd');
      ctx.globalAlpha=.9;ctx.lineWidth=4;ctx.strokeStyle='#6dffba';
      ctx.beginPath();ctx.arc(safe.x,safe.y,safe.r,0,Math.PI*2);ctx.stroke();
    } else if (p.kind==='charge' || isPatternProjectile(p)) {
      ctx.lineCap='round';ctx.strokeStyle='#ff4c45';
      ctx.lineWidth=p.kind==='charge'?p.width*2:24;
      const destinations=p.kind==='charge'?[p.end]:p.rays.map(a=>patternShotPoint(p,a,.38));
      for(const q of destinations){ctx.beginPath();ctx.moveTo(p.origin.x,p.origin.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
    } else {
      const c=p.kind==='ring'?p.origin:p.target;
      ctx.beginPath();ctx.arc(c.x,c.y,p.radius,0,Math.PI*2);
      if(p.kind==='ring'){ctx.strokeStyle='#ff4c45';ctx.lineWidth=64;ctx.stroke();}
      else{ctx.fillStyle='#ff4c45';ctx.fill();}
    }
    ctx.globalAlpha=1;
    label(names[p.kind],m.x,m.y-m.d.r*2.4,20,'#ffd57a');
  } else if (p.kind==='charge') {
    const head=patternDashPoint(p,active);
    const angle=Math.atan2(p.end.y-p.origin.y,p.end.x-p.origin.x);
    drawBossSprite(13,head.x,head.y,p.width*4.7,p.width*2.7,angle);
  } else if (isPatternProjectile(p)) {
    const arena=p.world?WBA:{x:m.hx,y:m.hy,r:m.ar};
    for(const a of p.rays){
      const q=patternShotPoint(p,a,active);
      if(Math.hypot(q.x-arena.x,q.y-arena.y)>arena.r)continue;
      const size=p.main||p.world?64:48;
      drawBossSprite(p.kind==='radial'?9:p.world?8:10,q.x,q.y,size,size,a);
    }
  } else {
    const center=p.kind==='ring'?p.origin:p.kind==='cataclysm'?p.arena:p.target;
    const radius=p.kind==='cataclysm'?p.arena.r:p.radius;
    const scale=1+active*.78;
    ctx.globalAlpha=Math.max(0,1-active*2.2);
    if(p.kind==='ring'){
      for(let i=0;i<12;i++){
        const a=i*TAU/12;
        drawBossSprite(5,center.x+Math.cos(a)*radius,center.y+Math.sin(a)*radius,84*scale,84*scale,a);
      }
    }else{
      if(p.kind==='cataclysm'){
        ctx.beginPath();ctx.arc(center.x,center.y,radius,0,TAU);
        ctx.moveTo(p.safe.x+p.safe.r,p.safe.y);ctx.arc(p.safe.x,p.safe.y,p.safe.r,0,TAU);
        ctx.clip('evenodd');
      }
      drawBossSprite(p.kind==='cataclysm'?14:4,center.x,center.y,radius*2.65*scale,radius*2.65*scale);
    }
  }
  ctx.restore();
}
