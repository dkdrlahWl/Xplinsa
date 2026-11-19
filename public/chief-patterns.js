'use strict';

// Each row combines a shared meteor, one group attack, and four individual layouts.
const CHIEF_LOADOUTS = {
  elder:[0,0,1,2,3], lord:[0,4,5,6,7], queen:[0,8,9,10,11], volc:[0,12,13,14,15],
  c2kraken:[1,0,4,8,12], c2hydra:[1,1,5,9,13], c2crysk:[1,2,6,10,14], c2storm:[1,3,7,11,15],
  c2lich:[2,0,5,10,15], c2dragon:[2,1,6,11,12],
};
const CHIEF_NAMES = [
  '십자 파열','내부 붕괴','엇갈린 세로 구획','쐐기 협공',
  '사선 균열','외곽 붕괴','엇갈린 가로 구획','회전 삼각 파편',
  '바둑판 폭발','이중 고리','부채꼴 포격','마주 보는 장벽',
  '이동 파동','나선 운석','반원 절단','사방 함몰',
  '추적 대운석','모서리 포위','회전 십자','지그재그 폭발',
];

function startChiefPattern(m,arena,index,enraged) {
  const [group,...layouts]=CHIEF_LOADOUTS[m.type];
  const rotation=[layouts[0],16,layouts[1],17+group,layouts[2],layouts[3]];
  const kind=rotation[index%rotation.length];
  const tier=m.z+(CHAP===2?4:-2);
  return {chief:true,kind,arena,tier,enraged,elapsed:0,wave:0,
    waves:2+Math.floor(tier/3)+(enraged?1:0),
    warn:1.28-tier*.037-(enraged?.12:0)+([10,12,14].includes(kind)?.25:0)};
}

function chiefDanger(pattern) {
  const {arena,kind,wave,tier}=pattern;
  const path=new Path2D();
  const r=arena.r, width=.18+tier*.011, shift=(wave%3-1)*.53;
  const rect=(x,y,w,h)=>path.rect(arena.x+x*r,arena.y+y*r,w*r,h*r);
  const circle=(x,y,size)=>{
    const cx=arena.x+x*r,cy=arena.y+y*r;
    path.moveTo(cx+size*r,cy);path.arc(cx,cy,size*r,0,TAU);
  };
  const line=(a,offset,w)=>{
    const cos=Math.cos(a),sin=Math.sin(a);
    const corners=[[-1.5,offset-w],[1.5,offset-w],[1.5,offset+w],[-1.5,offset+w]];
    corners.forEach(([x,y],i)=>path[i?'lineTo':'moveTo'](arena.x+r*(x*cos-y*sin),arena.y+r*(x*sin+y*cos)));
    path.closePath();
  };
  const fan=(a,span)=>{
    path.moveTo(arena.x,arena.y);
    path.arc(arena.x,arena.y,r,a-span/2,a+span/2);
    path.closePath();
  };
  const band=(inner,outer)=>{
    path.moveTo(arena.x+outer*r,arena.y);path.arc(arena.x,arena.y,outer*r,0,TAU);
    path.moveTo(arena.x+inner*r,arena.y);path.arc(arena.x,arena.y,inner*r,0,-TAU,true);
  };
  switch(kind) {
    case 0: line(0,shift,width);line(Math.PI/2,-shift,width);break;
    case 1: circle(shift*.45,0,.58+tier*.018);break;
    case 2: for(let i=-1;i<=1;i++)line(Math.PI/2,i*.66+shift*.4,width);break;
    case 3: fan(wave*Math.PI/2,1.14+tier*.055);fan(wave*Math.PI/2+Math.PI,1.14+tier*.055);break;
    case 4: line(Math.PI/4+wave*Math.PI/2,shift*.6,width*1.65);break;
    case 5: band(.45-tier*.018,1);break;
    case 6: for(let i=-1;i<=1;i++)line(0,i*.66+shift*.4,width);break;
    case 7: for(let i=0;i<3;i++)fan(wave*.65+i*TAU/3,.66+tier*.043);break;
    case 8:
      for(let y=0;y<4;y++)for(let x=0;x<4;x++)if((x+y+wave)%2===0)rect(x*.5-1,y*.5-1,.5,.5);
      break;
    case 9: band(.12,.33+width*.4);band(.64-width*.25,.86+width*.4);break;
    case 10: fan(Math.atan2(P.y-arena.y,P.x-arena.x),1.7+tier*.09);break;
    case 11: rect(-1,-1,.67+width*.52,2);rect(.33-width*.52,-1,.67+width*.52,2);break;
    case 12: line(wave%2===0?0:Math.PI/2,shift,width*1.6);break;
    case 13:
      for(let i=0;i<7;i++)circle(Math.cos(i*1.08+wave)*i*.122,Math.sin(i*1.08+wave)*i*.122,.14+width*.4);
      break;
    case 14: fan(wave*Math.PI*.67,Math.PI+tier*.035);break;
    case 15: for(let i=0;i<4;i++)circle(Math.cos(i*TAU/4+wave*.4)*.66,Math.sin(i*TAU/4+wave*.4)*.66,.26+width*.54);break;
    case 16: circle((P.x-arena.x)/r,(P.y-arena.y)/r,.35+width*.63);break;
    case 17:
      for(const x of [-.55,.55])for(const y of [-.55,.55])circle(x,y,.4+width*.3);
      break;
    case 18: line(wave*.7+.2,0,width);line(wave*.7+.2+Math.PI/2,0,width);break;
    case 19: for(let i=0;i<5;i++)circle(i*.42-.84,((i+wave)%2?1:-1)*.36,.30+width*.65);break;
  }
  return path;
}

function tickChiefPattern(m,dt) {
  const p=m.pattern;
  if(!p.path)p.path=chiefDanger(p);
  const prev=p.elapsed;
  p.elapsed+=dt;
  if(prev<p.warn && p.elapsed>=p.warn) {
    ctx.save();
    ctx.resetTransform();
    const hit=ctx.isPointInPath(p.path,P.x,P.y);
    ctx.restore();
    if(hit)hitPlayer(Math.round(m.d.atk*((p.kind===16?3.15:2.15)+p.tier*.22+(p.enraged?.45:0))));
    window.SFX?.play('slam',{v:.66,x:m.x,y:m.y});
  }
  if(p.elapsed<p.warn+.21)return;
  if(++p.wave>=p.waves){
    m.pattern=null;
    m.patternDelay=.85-p.tier*.045;
    return;
  }
  p.elapsed=0;
  p.path=null;
  if(p.impact)p.impact.clear=true;
}

const BOSS_FX=new Image();
BOSS_FX.src='assets/boss-spell-effects.webp?v=1';
const CHIEF_FX=[0,12,2,3,2,14,1,3,6,5,7,1,5,4,13,0,4,6,2,15];

function drawBossSprite(index,x,y,w,h,angle=0) {
  if(!BOSS_FX.naturalWidth)return;
  const cw=BOSS_FX.naturalWidth/4,ch=BOSS_FX.naturalHeight/4;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.drawImage(BOSS_FX,index%4*cw,Math.floor(index/4)*ch,cw,ch,-w/2,-h/2,w,h);
  ctx.restore();
}

function drawChiefPattern(m) {
  const p=m.pattern;
  if(!p.path)return;
  ctx.save();
  ctx.beginPath();ctx.arc(p.arena.x,p.arena.y,p.arena.r,0,TAU);ctx.clip();
  if(p.elapsed<p.warn){
    ctx.fillStyle='#fa385a';
    ctx.globalAlpha=.25+.28*p.elapsed/p.warn;
    ctx.fill(p.path);
  }else{
    if(BOSS_FX.naturalWidth){
      const {x,y,r}=p.arena;
      if(!p.impact){
        const canvas=document.createElement('canvas');
        canvas.width=canvas.height=256;
        p.impact={canvas,g:canvas.getContext('2d'),clear:true};
      }
      const {canvas,g}=p.impact;
      if(p.impact.clear){
        const scale=canvas.width/(2*r);
        g.resetTransform();g.clearRect(0,0,canvas.width,canvas.height);
        g.save();g.setTransform(scale,0,0,scale,(r-x)*scale,(r-y)*scale);
        g.clip(p.path);
        const index=CHIEF_FX[p.kind],cw=BOSS_FX.naturalWidth/4,ch=BOSS_FX.naturalHeight/4;
        const step=r*.48,size=step*1.8;
        for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
          g.drawImage(BOSS_FX,index%4*cw,Math.floor(index/4)*ch,cw,ch,x+col*step-size/2,y+row*step-size/2,size,size);
        }
        g.restore();p.impact.clear=false;
      }
      ctx.globalAlpha=1-(p.elapsed-p.warn)/.21*.65;
      ctx.drawImage(canvas,x-r,y-r,2*r,2*r);
    }
  }
  ctx.restore();
  label(CHIEF_NAMES[p.kind]+' '+(p.wave+1)+'/'+p.waves,m.x,m.y-m.d.r*2.4,20,'#ffd57a');
}
