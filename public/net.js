// 멀티플레이: 서버 저장 + 다른 플레이어 보이기
(function(){
const TOKEN=localStorage.getItem('xp_token'),NICK=localStorage.getItem('xp_nick')||'';
if(!TOKEN){location.replace('index.html');return}
const others=new Map();let ws=null,sc=0,lastSw=0,sendT=0,kicked=false,retry=0,saveT=0,saveDirty=false;
const DELAY=110; // ms 보간 지연

function kick(msg){if(kicked)return;kicked=true;try{ws&&ws.close()}catch(e){}localStorage.removeItem('xp_token');
 const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(15,12,29,.85);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif';
 d.innerHTML='<div style="background:#2b2546;border:4px solid #1c1830;border-radius:22px;padding:26px 24px;text-align:center;color:#fff;width:min(84vw,320px)"><div style="font-size:22px;margin-bottom:10px">접속이 끊겼어요</div><div style="color:#cfc8ee;font-size:15px;margin-bottom:18px">'+(msg||'다른 기기에서 로그인했어요.')+'</div><button style="font:inherit;font-size:19px;padding:10px 28px;border:3px solid #1c1830;border-radius:14px;background:#ffd23c;color:#1c1830">다시 로그인</button></div>';
 d.querySelector('button').onclick=()=>location.replace('index.html');document.body.appendChild(d)}

function connect(){if(kicked)return;
 ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?token='+encodeURIComponent(TOKEN));
 ws.onopen=()=>{if(retry>0){P.x=BASE.x;P.y=BASE.y+120}retry=0}; // 재접속 → 캠프파이어
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}
  if(m.t==='kick')return kick();
  if(m.t==='hi'){others.clear();for(const o of m.all)upd(o)}
  else if(m.t==='u'){for(const o of m.l)upd(o)}
  else if(m.t==='leave')others.delete(m.id)};
 ws.onclose=()=>{others.clear();if(kicked)return;retry++;setTimeout(connect,Math.min(5000,500*retry))};
}
function upd(o){const now=performance.now();let r=others.get(o.id);
 if(!r){r={id:o.id,buf:[],x:o.x,y:o.y,d:o.d,walk:0,swingT:0,sw:.3,sc:o.sc,trail:[],scarf:[],hitT:0,flS:1};others.set(o.id,r)}
 r.n=o.n;r.w=o.w;r.h=o.h;r.hp=o.hp;r.lv=o.lv;r.dead=o.dead;r.mv=o.mv;
 if(o.sc!==r.sc){r.sc=o.sc;r.sw=o.sw||.3;r.swingT=r.sw}
 r.buf.push({t:now,x:o.x,y:o.y,d:o.d});if(r.buf.length>20)r.buf.shift();r.seen=now}

function lerpA(a,b,k){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*k}
function tick(dt){if(kicked)return;
 // 내 휘두르기 감지
 if(P.swingT>lastSw+.001)sc++;lastSw=P.swingT;
 sendT-=dt;if(sendT<=0&&ws&&ws.readyState===1){sendT=1/20;
  ws.send(JSON.stringify({t:'s',x:P.x,y:P.y,d:P.dir,mv:P.moving,sc,sw:P.sw,w:S.slots[0],h:S.hero,hp:P.hp/ST.maxhp,lv:S.lv,dead:P.dead}))}
 const rt=performance.now()-DELAY;
 for(const r of others.values()){const b=r.buf;let x=r.x,y=r.y,d=r.d;
  if(b.length){let i=b.length-1;while(i>0&&b[i-1].t>rt)i--;
   if(i>0&&b[i].t>=rt){const a=b[i-1],c=b[i],k=(rt-a.t)/Math.max(1,c.t-a.t);x=a.x+(c.x-a.x)*k;y=a.y+(c.y-a.y)*k;d=lerpA(a.d,c.d,k)}
   else{const c=b[b.length-1];x=c.x;y=c.y;d=c.d}}
  const dist=Math.hypot(x-r.x,y-r.y);r.walk+=dist*.09;r.moving=r.mv&&dist>.05||dist>.6;
  if(dist>400){r.walk=0}r.x=x;r.y=y;r.d=d;if(r.swingT>0)r.swingT=Math.max(0,r.swingT-dt)}
 saveT-=dt;if(saveDirty&&saveT<=0)pushSave()}

// 다른 플레이어 그리기: 내 캐릭터 그리는 함수를 그대로 빌려 씀 (스킬·이펙트·보조무기 없음)
const KEYS=['x','y','dir','moving','walk','swingT','sw','dead','hitT','trail','scarf','flS'];
function draw(r){if(r.dead)return;const sv={};for(const k of KEYS)sv[k]=P[k];const s0=S.slots[0],hero=S.hero,lv=S.lv;
 P.x=r.x;P.y=r.y;P.dir=r.d;P.moving=r.moving;P.walk=r.walk;P.swingT=r.swingT;P.sw=r.sw;P.dead=false;P.hitT=0;P.trail=r.trail;P.scarf=r.scarf;P.flS=r.flS;
 if(r.w&&WT[r.w.split('_')[0]]&&GR[+r.w.split('_')[1]])S.slots[0]=r.w;if(r.h&&HERO.some(h=>h.k===r.h))S.hero=r.h;S.lv=r.lv||1;
 window.REM=r;try{drawPlayer()}catch(e){}window.REM=null;
 for(const k of KEYS)P[k]=sv[k];S.slots[0]=s0;S.hero=hero;S.lv=lv}
function list(){return others.values()}

// 서버 저장
function pushSave(){saveDirty=false;saveT=4;
 fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:TOKEN,save:S}),keepalive:true})
  .then(r=>{if(r.status===401)kick()}).catch(()=>{saveDirty=true})}
function markSave(){saveDirty=true}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveDirty&&!kicked)pushSave()});
window.addEventListener('pagehide',()=>{if(saveDirty&&!kicked)pushSave()});

window.NET={tick,draw,list,markSave,nick:NICK};
connect();
})();
