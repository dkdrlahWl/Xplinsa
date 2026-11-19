'use strict';

const FIELD_BOSS_ROTATIONS = [
  ['charge', 'volley', 'impact'], ['volley', 'impact', 'charge'],
  ['impact', 'ring', 'charge'], ['charge', 'impact', 'volley'],
];
const WORLD_BOSS_ROTATION = ['charge', 'ring', 'volley', 'impact', 'charge', 'volley'];

function fieldBossFight(m, dt, enabled, remote) {
  const world = m.type === 'wboss' || m.type === 'wboss2';
  if (combatArena || !m.d.boss || (!world && !(CHAP === 2 || m.z >= 2))) return false;
  const arena = world ? WBA : {x:m.hx, y:m.hy, r:m.ar};
  const inside = (x,y,pad=0) => Math.hypot(x-arena.x,y-arena.y) <= arena.r-pad;
  if (!enabled || m.dead || !inside(P.x,P.y)) {
    m.pattern = null;
    m.patternDelay = 2;
    m.patternIndex = 0;
    return false;
  }

  const enraged = world && m.hp <= m.d.hp*.5;
  const index = m.patternIndex || 0;
  const rotation = world ? WORLD_BOSS_ROTATION : FIELD_BOSS_ROTATIONS[(m.z+(CHAP===2?1:0)+(m.type===ZS[m.z].boss2?1:0))%4];
  if (!m.pattern) {
    m.patternDelay = (m.patternDelay ?? 2)-dt;
    if (m.patternDelay > 0) return false;
    const kind = rotation[index%rotation.length];
    const warn = world ? (enraged?.69:.88) : (CHAP===2?.93:1.12);
    const a = Math.atan2(P.y-m.y,P.x-m.x);
    const ux=Math.cos(a), uy=Math.sin(a);
    const origin={x:m.x,y:m.y}, target={x:P.x,y:P.y};
    let distance=0;
    const chargeMax=Math.min(world?370:240,Math.hypot(P.x-m.x,P.y-m.y)+65);
    while (distance+8<=chargeMax && inside(origin.x+ux*(distance+8),origin.y+uy*(distance+8),24)) distance+=8;
    const end={x:origin.x+ux*distance,y:origin.y+uy*distance};
    const count=world?(enraged?9:7):(CHAP===2?5:3);
    const rays=Array.from({length:count},(_,i)=>a+(i-(count-1)/2)*.29);
    m.pattern={kind,warn,elapsed:0,origin,target,end,distance,rays,hit:false,world,enraged,
      radius:kind==='ring'?(world?130:94):(world?108:75), width:world?38:29};
    m.patternIndex=index+1;
    window.SFX?.play('warn',{v:.6,x:m.x,y:m.y});
  }
  const p=m.pattern;
  const before=Math.max(0,p.elapsed-p.warn);
  p.elapsed+=dt;
  const active=p.elapsed-p.warn;
  if (active<0) return true;
  if (before===0) window.SFX?.play('slam',{v:.7,x:p.origin.x,y:p.origin.y});

  let hit=false;
  const duration=p.kind==='charge'?.44:p.kind==='volley'?(world?1.35:.97):.32;
  if (p.kind==='charge') {
    const from=patternDashPoint(p,before), to=patternDashPoint(p,active);
    if (!remote) {m.x=to.x;m.y=to.y;}
    hit=patternSegmentHit(from,to,p.width);
  } else if (p.kind==='volley') {
    for (const angle of p.rays) {
      const from=patternShotPoint(p,angle,before), to=patternShotPoint(p,angle,active);
      if (inside(to.x,to.y) && patternSegmentHit(from,to,world?21:16)) {hit=true;break;}
    }
  } else if (before===0) {
    const center=p.kind==='ring'?p.origin:p.target;
    const range=Math.hypot(P.x-center.x,P.y-center.y);
    hit=p.kind==='ring'?Math.abs(range-p.radius)<32:range<p.radius;
    fxs.push({x:center.x,y:center.y,t:.28,r:p.radius,c:'#ff805a'});
  }
  if (hit && !p.hit) {
    p.hit=true;
    hitPlayer(Math.round(m.d.atk*(world?(enraged?2.8:2.35):1.75)));
  }
  if (active>=duration) {
    m.pattern=null;
    m.patternDelay=world?(enraged?.45:.8):(CHAP===2?1.55:2.1);
  }
  return true;
}

function patternDashPoint(p,t) {
  const f=clamp(t/.44,0,1);
  return {x:p.origin.x+(p.end.x-p.origin.x)*f,y:p.origin.y+(p.end.y-p.origin.y)*f};
}

function patternShotPoint(p,a,t) {
  const r=t*(p.world?370:300);
  return {x:p.origin.x+Math.cos(a)*r,y:p.origin.y+Math.sin(a)*r};
}

function patternSegmentHit(a,b,r) {
  if (a.x===b.x && a.y===b.y) return Math.hypot(P.x-a.x,P.y-a.y)<r;
  return dSeg(P.x,P.y,a,b)<r;
}

function drawFieldBossPattern(m) {
  const p=m.pattern;
  if (!p || m.dead) return;
  const active=p.elapsed-p.warn;
  const names={charge:'돌진',volley:'연발 투사체',ring:'고리 충격파',impact:'낙하 강타'};
  ctx.save();
  if (active<0) {
    ctx.globalAlpha=.28+.28*p.elapsed/p.warn;
    if (p.kind==='charge' || p.kind==='volley') {
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
    const head=patternDashPoint(p,active), tail=patternDashPoint(p,active-.13);
    ctx.strokeStyle='#ffc573';ctx.lineWidth=p.width*1.4;ctx.lineCap='round';ctx.globalAlpha=.65;
    ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(head.x,head.y);ctx.stroke();
  } else if (p.kind==='volley') {
    const arena=p.world?WBA:{x:m.hx,y:m.hy,r:m.ar};
    for(const a of p.rays){
      const q=patternShotPoint(p,a,active);
      if(Math.hypot(q.x-arena.x,q.y-arena.y)>arena.r)continue;
      ell(q.x,q.y,p.world?17:13,p.world?17:13,'#ff9155',1);
      ell(q.x,q.y,7,7,'#fff7c6',1);
    }
  }
  ctx.restore();
}
