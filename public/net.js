// 멀티플레이: 서버 저장 + 다른 플레이어 보이기
(function(){
window.IS_ADMIN=localStorage.getItem('xp_admin')==='1';const TOKEN=localStorage.getItem('xp_token'),NICK=localStorage.getItem('xp_nick')||'';
if(!TOKEN || !window.saveReady){location.replace('index.html');return}
const others=new Map();let ME=null,ws=null,sc=0,lastSw=0,sendT=0,kicked=false,retry=0,saveT=0,saveDirty=false;
const DELAY=110;
const CHO=()=>((typeof CHAP!=='undefined'?CHAP:1)-1)*5000,L=i=>{const o=CHO();return i>=o&&i<o+5000?i-o:-1},Gi=i=>i+CHO(),MYCH=()=>typeof CHAP!=='undefined'?CHAP:1; // ms 보간 지연

function resetGo(){if(kicked)return;kicked=true;try{ws&&ws.close()}catch(e){}localStorage.removeItem('camp_save_v2');window.save=function(){};
 const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(15,12,29,.88);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif';
 d.innerHTML='<div style="background:#2b2546;border:4px solid #1c1830;border-radius:22px;padding:26px 24px;text-align:center;color:#fff;width:min(84vw,320px)"><div style="font-size:24px;margin-bottom:10px">🎉 정식 오픈!</div><div style="color:#cfc8ee;font-size:15px;margin-bottom:18px">테스트 기록이 초기화됐어요.<br>처음부터 새로 시작해요!</div><button style="font:inherit;font-size:19px;padding:10px 28px;border-radius:14px;border:3px solid #1c1830;background:#7be36a;color:#1c1830">시작하기</button></div>';
 d.querySelector('button').onclick=()=>location.replace('index.html');document.body.appendChild(d)}
function kick(msg){if(kicked)return;kicked=true;try{ws&&ws.close()}catch(e){}localStorage.removeItem('xp_token');
 const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(15,12,29,.85);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif';
 d.innerHTML='<div style="background:#2b2546;border:4px solid #1c1830;border-radius:22px;padding:26px 24px;text-align:center;color:#fff;width:min(84vw,320px)"><div style="font-size:22px;margin-bottom:10px">접속이 끊겼어요</div><div style="color:#cfc8ee;font-size:15px;margin-bottom:18px">'+(msg||'다른 기기에서 로그인했어요.')+'</div><button style="font:inherit;font-size:19px;padding:10px 28px;border:3px solid #1c1830;border-radius:14px;background:#ffd23c;color:#1c1830">다시 로그인</button></div>';
 d.querySelector('button').onclick=()=>location.replace('index.html');document.body.appendChild(d)}

function connect(){if(kicked)return;
 ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?token='+encodeURIComponent(TOKEN)+'&handoff=1');
 ws.onopen=()=>{if(retry>0){P.x=BASE.x;P.y=BASE.y+120}retry=0}; // 재접속 → 캠프파이어
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}
  if(m.t==='handoff'){
   if(typeof S!=='undefined'){save();fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:saveBody(m.key)}).catch(()=>{});}
   return;
  }
  if(m.t==='kick')return kick(m.msg);if(m.t==='reset')return resetGo();
  if(['defenseState','defenseError','defenseInfo','defenseRooms'].includes(m.t)){window.DEFENSE?.receive(m);return}
  if(['raidState','raidError','raidInfo','raidRooms'].includes(m.t)){window.RAID?.receive(m);return}
  if(m.t==='hi'){ME=m.id;others.clear();for(const o of m.all)upd(o);
   for(const g of sharedBosses){g.own=null;if(g.dead){g.dead=false;g.hp=g.d.hp;g.x=g.hx;g.y=g.hy}}
   for(const[i,hp,dead,own,left]of m.ms){const g=mons[L(i)];if(!g?.d.boss)continue;g.hp=Math.max(1,hp);g.own=own;if(dead){g.dead=true;g.slam=null;g.respT=left||0}}}
  else if(m.t==='mh'){const g=mons[L(m.i)];if(g?.d.boss&&!g.dead)g.hp=Math.max(1,m.hp)}
  else if(m.t==='mo'){const g=mons[L(m.i)];if(g?.d.boss){g.own=m.o;g.claimT=0;if(m.o&&m.o!==ME){g.rx=g.x;g.ry=g.y;g.slam=null}}}
  else if(m.t==='mk'){const g=mons[L(m.i)];if(g?.d.boss&&!g.dead){g.own=null;if(m.w.includes(ME))kill(g);else{g.dead=true;g.slam=null;g.respT=m.rs||g.d.resp;fxs.push({x:g.x,y:g.y-g.d.r,t:.3,r:g.d.r*2.2,c:'#fff'})}refreshBossMapMarker(g)}}
  else if(m.t==='mr'){const g=mons[L(m.i)];if(g?.d.boss){g.dead=false;g.hp=g.d.hp;g.x=g.hx;g.y=g.hy;g.agg=false;g.own=null;g.spawnT=.3;announceFieldBoss(g)}}
  else if(m.t==='u'){for(const o of m.l){upd(o);if(o.mp)for(let k=0;k+2<o.mp.length;k+=3){const g=mons[L(o.mp[k])];if(g?.d.boss&&g.own===o.id){g.rx=o.mp[k+1];g.ry=o.mp[k+2]}}}}
  else if(m.t==='leave')others.delete(m.id)};
 ws.onclose=()=>{window.DEFENSE?.disconnect();window.RAID?.disconnect();others.clear();ME=null;for(const g of sharedBosses)g.own=null;if(kicked)return;retry++;setTimeout(connect,Math.min(5000,500*retry))};
}
function upd(o){const now=performance.now();let r=others.get(o.id);
 if(!r){r={id:o.id,buf:[],x:o.x,y:o.y,d:o.d,walk:0,swingT:0,sw:.3,sc:o.sc,trail:[],scarf:[],hitT:0,flS:1};others.set(o.id,r)}
 r.ch=o.ch||1;r.rank=Math.max(0,Math.min(5,o.rank|0));r.n=o.n;r.w=o.w;r.h=o.h;r.pt=o.pt;r.mt=o.mt||'';r.sl=Array.isArray(o.sl)?o.sl:null;r.hp=o.hp;r.lv=o.lv;r.dead=o.dead;r.mv=o.mv;
 if(o.sc!==r.sc){r.sc=o.sc;r.sw=o.sw||.3;r.swingT=r.sw}
 r.buf.push({t:now,x:o.x,y:o.y,d:o.d});if(r.buf.length>20)r.buf.shift();r.seen=now}

function lerpA(a,b,k){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*k}
function tick(dt){if(kicked)return;
 // 내 휘두르기 감지
 if(P.swingT>lastSw+.001)sc++;lastSw=P.swingT;
 sendT-=dt;if(sendT<=0&&ws&&ws.readyState===1){sendT=1/20;
  const mp=[];for(const g of sharedBosses){if(g.dead)continue;
   if(g.agg&&!g.own&&(g.claimT||0)<=0){g.claimT=.5;ws.send(JSON.stringify({t:'c',i:Gi(g.i),mx:g.d.hp,rs:g.d.resp}))}
   if(g.own===ME){if(!g.agg){g.own=null;ws.send(JSON.stringify({t:'r',i:Gi(g.i)}))}else mp.push(Gi(g.i),Math.round(g.x),Math.round(g.y))}}
  ws.send(JSON.stringify({t:'s',ch:MYCH(),mp,x:P.x,y:P.y,d:P.dir,mv:P.moving,sc,sw:P.sw,w:mainW(),h:S.hero,pt:S.pet||'',mt:window.MOUNT?MOUNT.key:'',sl:S.slots.slice(1).map(k=>k||''),hp:P.hp/ST.maxhp,lv:S.lv,rank:promotionRank(),dead:P.dead}))}
 const rt=performance.now()-DELAY;
 for(const r of others.values()){const b=r.buf;let x=r.x,y=r.y,d=r.d;
  if(b.length){let i=b.length-1;while(i>0&&b[i-1].t>rt)i--;
   if(i>0&&b[i].t>=rt){const a=b[i-1],c=b[i],k=(rt-a.t)/Math.max(1,c.t-a.t);x=a.x+(c.x-a.x)*k;y=a.y+(c.y-a.y)*k;d=lerpA(a.d,c.d,k)}
   else{const c=b[b.length-1];x=c.x;y=c.y;d=c.d}}
  const dist=Math.hypot(x-r.x,y-r.y);r.walk+=dist*.09;r.moving=r.mv&&dist>.05||dist>.6;
  if(dist>400){r.walk=0}r.x=x;r.y=y;r.d=d;if(r.swingT>0)r.swingT=Math.max(0,r.swingT-dt)}
 for(const g of sharedBosses){if(g.claimT>0)g.claimT-=dt;if(g.dead&&g.respT>0&&on())g.respT-=dt}
 saveT-=dt;if(saveDirty&&saveT<=0)pushSave()}

// 다른 플레이어 그리기: 내 캐릭터 그리는 함수를 그대로 빌려 씀 (스킬·이펙트·보조무기 없음)
const KEYS=['x','y','dir','moving','walk','swingT','sw','dead','hitT','trail','scarf','flS','tipX','tipY'];
function draw(r){if(r.dead)return;const sv={};for(const k of KEYS)sv[k]=P[k];const s0=S.slots[0],hero=S.hero,lv=S.lv;
 P.x=r.x;P.y=r.y;P.dir=r.d;P.moving=r.moving;P.walk=r.walk;P.swingT=r.swingT;P.sw=r.sw;P.dead=false;P.hitT=0;P.trail=r.trail;P.scarf=r.scarf;P.flS=r.flS;
 if(r.w&&WT[r.w.split('_')[0]]&&GR[+r.w.split('_')[1]])S.slots[0]=r.w;if(r.h&&HERO.some(h=>h.k===r.h))S.hero=r.h;S.lv=r.lv||1;
 window.REM=r;try{drawPlayer()}catch(e){}window.REM=null;
 for(const k of KEYS)P[k]=sv[k];S.slots[0]=s0;S.hero=hero;S.lv=lv}
function on(){return !!(ws&&ws.readyState===1&&ME)}
function hit(m,d){if(m.d.boss&&on())ws.send(JSON.stringify({t:'h',i:Gi(m.i),d,mx:m.d.hp,rs:m.d.resp,w:m.d.world?1:0}))}
// 다른 사람이 쫓고 있는 몬스터: 받은 위치로 부드럽게 이동만
function remote(m,dt){if(!m.d.boss||!on()||!m.own||m.own===ME)return false;m.ph+=dt*6;if(m.rx!==undefined){const k=Math.min(1,dt*10);m.x+=(m.rx-m.x)*k;m.y+=(m.ry-m.y)*k}m.agg=false;return true}
function list(){return [...others.values()].filter(r=>r.ch===MYCH())}

// 서버 저장
let saveSequence=Number(sessionStorage.xp_save_seq)||0;
function saveBody(handoff){sessionStorage.xp_save_seq=++saveSequence;return JSON.stringify({token:TOKEN,save:S,seq:saveSequence,handoff})}
function pushSave(){saveDirty=false;saveT=4;
 const body=saveBody();fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:document.hidden && new Blob([body]).size<60000})
  .then(r=>{if(r.status===401)kick();else if(r.status===409)resetGo();else if(!r.ok)saveDirty=true}).catch(()=>{saveDirty=true})}
function markSave(){saveDirty=true}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveDirty&&!kicked)pushSave()});
window.addEventListener('pagehide',()=>{if(saveDirty&&!kicked)pushSave()});

async function logout(){kicked=true;try{ws&&ws.close()}catch(e){}
 try{await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:saveBody()})}catch(e){}
 for(const k of['xp_token','xp_admin','xp_nick','camp_save_v2'])localStorage.removeItem(k);location.replace('index.html')}
// 새 버전 감시: 서버가 업데이트되면 저장 후 자동 새로고침
let VER=null;async function chkVer(){try{const v=await (await fetch('/version',{cache:'no-store'})).text();if(VER===null)VER=v;else if(v!==VER&&!kicked){VER=v;try{await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:saveBody()})}catch(e){}
  const d=document.createElement('div');d.style.cssText='position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:99999;background:#2b2546;border:3px solid #1c1830;border-radius:16px;padding:14px 20px;color:#ffe066;font-family:Jua,sans-serif;font-size:18px';d.textContent='새 버전 적용 중…';document.body.appendChild(d);setTimeout(()=>location.reload(),900)}}catch(e){}}
chkVer();setInterval(chkVer,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)chkVer()});
function defense(action,details={}){if(on())ws.send(JSON.stringify({t:"defense",action,...details}))}
function admBoss(){if(on())ws.send(JSON.stringify({t:'admboss'}))}
function raid(action,details={}){if(on())ws.send(JSON.stringify({t:"raid",action,...details}))}
const NETO={logout,on,hit,remote,defense,raid,admBoss,me:()=>ME,tick,draw,list,markSave,nick:NICK};window.NET=NETO;
connect();
// 관리자 여부는 아이디(ehgus) 기준으로 서버에 매번 물어봄
fetch('/api/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:TOKEN})}).then(r=>r.json()).then(j=>{if(j&&'admin' in j){window.IS_ADMIN=!!j.admin;localStorage.setItem('xp_admin',j.admin?'1':'0')}}).catch(()=>{});
})();
