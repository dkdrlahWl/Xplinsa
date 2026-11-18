window.DEFENSE = (() => {
  const WIDTH = 1920, HEIGHT = 2560, CENTER_X = WIDTH / 2, CENTER_Y = HEIGHT / 2;
  const root = document.createElement('section');
  root.id = 'defense-screen';
  root.hidden = true;
  $('game').appendChild(root);
  const background = new Image();
  background.src = 'assets/defense_camp.webp';
  const directions = { north: '북', east: '동', south: '남', west: '서' };
  const arrows = { north:'↓', east:'←', south:'↑', west:'→' };
  const positions = new Map(), targets = new Map();
  let arena = null, localPosition = null;
  let sentX = 0, sentY = 0;
  function resetCombat(){
    localPosition = null;
    sentX = sentY = 0;
    arena = {width:WIDTH,height:HEIGHT,player:{...P,atkCd:0,swingT:0,pend:null,s2:null,sk:[0,0,0,0,0,0],sub:{},extraT:0,trail:[],scarf:[]},
      enemies:[],shots:[],nums:[],fxs:[],timers:[],
      hit(enemy,damage){NET.defense('hit',{enemy:enemy.i,damage})}};
    targets.clear();
  }
  const swings = new Map();
  let state = null, visible = false, pointer = null, sendWait = 0, statsSent = false, best = 0, rooms = [];

  const button = (action, label, disabled = false) =>
    '<button type="button" data-defense="' + action + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';

  function loadout(ready) {
    NET.defense('loadout', {
      ready, hero: S.hero, weapon: S.slots[0], attack: ST.atk, hp: ST.maxhp, speed: ST.spd,
      leech: ST.ls
    });
  }

  function showRooms() {
    const list = $('defense-rooms');
    if (!list) return;
    list.replaceChildren();
    if (!rooms.length) {
      const empty = document.createElement('p');
      empty.textContent = '대기 중인 방이 없어요.';
      list.appendChild(empty);
      return;
    }
    for (const room of rooms) {
      const row = document.createElement('li');
      const label = document.createElement('b');
      label.textContent = room.stage + '단계 · ' + room.host + '의 방';
      const count = document.createElement('span');
      count.textContent = room.count + '/4';
      const join = document.createElement('button');
      join.type = 'button';
      join.dataset.defense = 'join';
      join.dataset.room = room.code;
      join.disabled = room.count >= 4;
      join.textContent = join.disabled ? '만석' : '입장';
      row.append(label, count, join);
      list.appendChild(row);
    }
  }

  function screen() {
    root.className = state && state.phase !== 'lobby' ? 'defense-arena' : 'defense-lobby';
    if (!state) {
      root.innerHTML = '<header>캠프 방어전' + button('exit', '닫기') + '</header>' +
        '<div class="defense-card"><h2>모닥불을 지켜라</h2><p>최대 4명 · 5단계</p>' +
        '<label for="defense-stage-select">방 만들 단계</label><select id="defense-stage-select">'+
        [1,2,3,4,5].map(stage=>'<option value="'+stage+'" '+(stage>best+1?'disabled':stage===Math.min(5,best+1)?'selected':'')+'>'+stage+'단계'+(stage>best+1?' · 잠김':stage<=best?' · 클리어':'')+'</option>').join('')+
        '</select>'+button('create', '방 만들기') +
        '<h3>대기 중인 방</h3><ul id="defense-rooms"></ul><p id="defense-error" role="status"></p></div>';
      showRooms();
      return;
    }
    if (state.phase === 'lobby') {
      const host = state.host === NET.me(), me = state.players.find(p => p.id === NET.me());
      const names = state.players.map((p, i) => '<li><b id="defense-member-' + i + '"></b><span>' +
        (p.id === state.host ? '방장' : p.ready ? '준비 완료' : '대기 중') + '</span></li>').join('');
      root.innerHTML = '<header>캠프 방어전 대기실' + button('exit', '나가기') + '</header>' +
        '<div class="defense-card"><h2>'+state.stage+'단계 · 대기실 ' + state.players.length + '/4</h2><ul>' + names +
        '</ul>' +
        (host ? button('start', '시작', !statsSent || state.players.some(p => p.id !== state.host && !p.ready)) :
          button('ready', me?.ready ? '준비 취소' : '준비 완료')) + '<p id="defense-error" role="status"></p></div>';
      state.players.forEach((p, i) => { $('defense-member-' + i).textContent = p.nick || '모험가'; });
      return;
    }
    root.innerHTML = '<canvas id="defense-canvas"></canvas><div class="defense-hud"><header><b id="defense-stage"></b>' +
      button('exit', '나가기') + '</header><div class="defense-camp-hp"><span id="defense-hp"></span>' +
      '<progress id="defense-meter" max="100" value="100"></progress></div></div><div id="defense-notice"></div>';
    const canvas = $('defense-canvas');
    canvas.onpointerdown = e => {
      if (pointer) return;
      const bounds=canvas.getBoundingClientRect();
      const lowerLeft=e.pointerType==='touch'&&e.clientX-bounds.left<bounds.width*.58&&e.clientY-bounds.top>bounds.height*.48;
      pointer={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0,radius:lowerLeft?36:52,deadzone:lowerLeft?.075:.12};
      canvas.setPointerCapture(e.pointerId);
    };
    canvas.onpointermove = e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const x = e.clientX - pointer.ox, y = e.clientY - pointer.oy, len = Math.max(pointer.radius, Math.hypot(x, y));
      pointer.x = x / len; pointer.y = y / len;
    };
    canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = e => {
      if (pointer?.id === e.pointerId) {
        pointer = null;
        sendWait = 0;
      }
    };
  }

  function updateHud() {
    const stage = $('defense-stage');
    if (!stage) return;
    stage.textContent = state.stage + '/5단계 · ' + state.lanes.map(d => directions[d]).join('·') + ' · ' + state.timer + '초';
    $('defense-hp').textContent = '모닥불 ' + state.camp + ' / ' + state.campMax;
    $('defense-meter').value = state.camp / state.campMax * 100;
    const notice = $('defense-notice'), me = state.players.find(p => p.id === NET.me());
    if (state.phase === 'cleared' || state.phase === 'failed') {
      const clear = state.phase === 'cleared', available = clear && S.defenseClaim !== calendarKey();
      const unlock = clear && state.stage === best && best < 5 ? '<p>'+(best+1)+'단계 방을 만들 수 있어요.</p>' : '';
      notice.className = 'defense-result';
      notice.innerHTML = '<h2>' + (clear ? state.stage+'단계 방어 성공!' : '방어 실패') + '</h2>' +
        (clear ? '<p>' + (available ? '오늘 첫 클리어 · 골드 '+fmt(6000*state.stage)+' · 주문서 '+4*state.stage : '오늘 첫 클리어 보상 수령 완료') + '</p>' : '') +
        unlock + (available ? button('claim', '보상 받기') : '') + button('exit', '캠프로 돌아가기');
    } else {
      notice.className = '';
      notice.textContent = state.phase === 'prepare' ? state.stage + '단계 준비 · ' + state.timer + '초' :
        me?.hp === 0 ? '잠시 후 모닥불 근처에서 부활합니다' :
        me && Math.hypot(me.x-CENTER_X,me.y-CENTER_Y)<=34 ? '회복 중 · 회복 범위 안에서는 공격할 수 없어요' : '';
    }
  }

  function receive(message) {
    if (!visible) return;
    if (message.t === 'defenseInfo') {
      best = message.best; rooms = message.rooms || [];
      if (!state) screen();
      return;
    }
    if (message.t === 'defenseRooms') {
      rooms = message.rooms;
      if (!state) showRooms();
      return;
    }
    if (message.t === 'defenseError') {
      const error = $('defense-error');
      if (error) error.textContent = message.text;
      return;
    }
    const previous = state;
    state = message; best = state.best;
    if (!previous || previous.phase === 'lobby' || !$('defense-canvas')) screen();
    if (state.phase === 'lobby' && !statsSent) { statsSent = true; loadout(false); }
    if (state.phase !== 'lobby') {
      if (!arena || previous?.phase === 'lobby') resetCombat();
      for (const target of targets.values()) target.dead = true;
      arena.enemies = state.enemies.map(enemy=>{
        const target=targets.get(enemy.id)||{i:enemy.id,z:0,type:enemy.type,ph:0,hitT:0,spawnT:0};
        Object.assign(target,{x:enemy.x,y:enemy.y,hp:enemy.hp,dead:false,d:{...MT[enemy.type],hp:enemy.maxHp,boss:enemy.boss}});
        targets.set(enemy.id,target);
        return target;
      });
      for(const [id,target] of targets)if(target.dead)targets.delete(id);
      updateHud();
    }
  }

  function open() {
    if (!window.NET?.on()) { toast('서버에 연결된 후 입장할 수 있어요'); return; }
    if (P.dead) { toast('부활한 뒤 입장할 수 있어요'); return; }
    close();
    visible = true; root.hidden = false; statsSent = false; state = null; rooms = [];
    joy.on = false; joy.x = joy.y = 0;
    P.moving = false; P.recall = null;
    for (const boss of sharedBosses) boss.agg = false;
    positions.clear(); swings.clear(); arena=null;
    screen();
    NET.defense('info');
    NET.defense('resume');
  }

  function exit() {
    NET.defense('leave');
    visible = false; root.hidden = true; state = null; pointer = null; arena=null;
  }

  root.addEventListener('click', e => {
    const clicked = e.target.closest('[data-defense]');
    if (!clicked || clicked.disabled) return;
    const action = clicked.dataset.defense;
    if (action === 'exit') return exit();
    if (action === 'create') return NET.defense('create', { stage: Number($('defense-stage-select').value) });
    if (action === 'join') return NET.defense('join', { code: clicked.dataset.room });
    if (action === 'start') return NET.defense('start');
    if (action === 'ready') return loadout(!state.players.find(p => p.id === NET.me())?.ready);
    if (action === 'claim' && state?.phase === 'cleared' && S.defenseClaim !== calendarKey()) {
      S.defenseClaim = calendarKey();
      markRewardOrigin(clicked);
      give({ gold: 6000 * state.stage, scr: 4 * state.stage });
      save();
      updateHud();
    }
  });

  function drawHero(player, pos, g, time) {
    if (player.hp <= 0) return;
    const prior = swings.get(player.id);
    if (!prior || prior.count !== player.swing) swings.set(player.id, { count: player.swing, at: time });
    const elapsed = time - swings.get(player.id).at;
    const heroState = { ...P }, oldHero = S.hero, oldWeapon = S.slots[0], oldContext = ctx, oldPV = PV;
    Object.assign(P, { x: pos.x, y: pos.y, dir: player.dir, dead: false, moving: player.moving, walk: time * .012,
      swingT: player.swing ? Math.max(0, .24 - elapsed / 1000) : 0, sw: .24, trail: [], scarf: [], hitT: 0 });
    if (HERO.some(hero => hero.k === player.hero)) S.hero = player.hero;
    if (WT[player.weapon?.split('_')[0]] && GR[Number(player.weapon.split('_')[1])]) S.slots[0] = player.weapon;
    ctx = g; PV = 1;
    try { drawPlayer(); } finally {
      Object.assign(P, heroState); S.hero = oldHero; S.slots[0] = oldWeapon; ctx = oldContext; PV = oldPV;
    }
  }

  function draw(dt) {
    const canvas = $('defense-canvas');
    if (!canvas || !state) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dp = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dp) || canvas.height !== Math.round(h * dp)) {
      canvas.width = Math.round(w * dp); canvas.height = Math.round(h * dp);
    }
    const g = canvas.getContext('2d'), zoom=w/430, scale=zoom*dp;
    const time=performance.now(), alive=new Set();
    function smooth(key, entity){
      alive.add(key);
      const p=positions.get(key)||{x:entity.x,y:entity.y};
      const amount=Math.min(1,dt*17);
      p.x+=(entity.x-p.x)*amount;p.y+=(entity.y-p.y)*amount;
      positions.set(key,p);
      return p;
    }
    const you=state.players.find(p=>p.id===NET.me());
    if(!you||!arena)return;
    const focus=localPosition||you,viewW=w/zoom,viewH=h/zoom;
    const follow=(value,size,view)=>view>=size?size/2:clamp(value,view/2,size-view/2);
    const camX=follow(focus.x,WIDTH,viewW),camY=follow(focus.y-20,HEIGHT,viewH);
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);
    g.setTransform(scale,0,0,scale,canvas.width/2-camX*scale,canvas.height/2-camY*scale);
    if(background.complete&&background.naturalWidth)g.drawImage(background,0,0,WIDTH,HEIGHT);
    else{g.fillStyle='#507643';g.fillRect(0,0,WIDTH,HEIGHT)}
    g.beginPath();g.arc(CENTER_X,CENTER_Y,34,0,Math.PI*2);
    g.fillStyle='#94f8a849';g.fill();g.strokeStyle='#b7ffba';g.lineWidth=2;g.stroke();
    const camp=AI('bld_fire');
    if(camp){const size=90;g.drawImage(camp,CENTER_X-size/2,CENTER_Y+20-size*camp.height/camp.width,size,size*camp.height/camp.width)}
    withArenaCombat(arena,()=>{
      ctx=g;PV=0;
      const scene=arena.enemies.map(enemy=>({y:enemy.y,draw(){
        const pos=smooth('e'+enemy.i,enemy);
        drawMon({...enemy,x:pos.x,y:pos.y});
      }}));
      for(const player of state.players){
        if(player.hp<=0)continue;
        const pos=player.id===you.id?focus:smooth('p'+player.id,player);
        scene.push({y:pos.y,draw(){
          if(player.id===you.id){
            const x=P.x,y=P.y;P.x=pos.x;P.y=pos.y;
            try{drawPlayer()}finally{P.x=x;P.y=y}
          }else{
            drawHero(player,pos,g,time);
            g.font='bold 15px sans-serif';g.textAlign='center';
            g.strokeStyle='#211a35';g.lineWidth=3;g.strokeText(player.nick||'모험가',pos.x,pos.y-65);
            g.fillStyle='#fff';g.fillText(player.nick||'모험가',pos.x,pos.y-65);
          }
        }});
      }
      scene.sort((a,b)=>a.y-b.y);
      for(const item of scene)item.draw();
      drawCombatEffects();
    });
    for(const key of positions.keys())if(!alive.has(key))positions.delete(key);
    if(pointer){
      const bounds=canvas.getBoundingClientRect();
      const x=pointer.ox-bounds.left,y=pointer.oy-bounds.top;
      g.setTransform(dp,0,0,dp,0,0);
      g.fillStyle='#1c183059';g.beginPath();g.arc(x,y,pointer.radius+4,0,Math.PI*2);g.fill();
      g.fillStyle='#ffffffcc';g.beginPath();g.arc(x+pointer.x*pointer.radius,y+pointer.y*pointer.radius,19,0,Math.PI*2);g.fill();
    }
    if (state.phase === 'prepare') {
      g.setTransform(dp,0,0,dp,0,0);
      g.font = 'bold 32px sans-serif'; g.textAlign = 'center';
      g.fillStyle = '#fff0a1'; g.strokeStyle = '#403055'; g.lineWidth = 6;
      for (const lane of state.lanes) {
        const symbol=arrows[lane];
        const x=lane==='east'?w-25:lane==='west'?25:w/2;
        const y=lane==='north'?119:lane==='south'?h-42:h/2;
        g.strokeText(symbol,x,y);g.fillText(symbol,x,y);
      }
    }
  }

  function fight(dt,input){
    const me=state.players.find(p=>p.id===NET.me());
    if(!arena||!me)return;
    withArenaCombat(arena,()=>{
      T+=dt;
      if(me.hp<P.hp&&me.hp>0){P.hitT=.2;num(me.x,me.y-56,'-'+fmt(P.hp-me.hp),'#ff6b6b')}
      Object.assign(P,{x:localPosition.x,y:localPosition.y,hp:me.hp,dead:me.hp<=0,moving:me.hp>0&&input.active});
      if(P.swingT<=0&&P.moving)P.dir=Math.atan2(input.y,input.x);
      if(P.moving)P.walk+=dt*11*Math.min(1.5,ST.spd/190);
      if(state.phase==='battle'&&!P.dead&&Math.hypot(P.x-CENTER_X,P.y-CENTER_Y)>34){
        const prior=P.pend;
        stepPlayerCombat(dt);
        if(P.pend&&P.pend!==prior)NET.defense('swing',{dir:P.dir});
        stepCombatShots(dt);
      }else{
        P.pend=null;P.s2=null;P.extraT=0;P.swingT=0;
        arena.timers.length=0;arena.shots.length=0;
      }
      for(const enemy of arena.enemies){enemy.ph+=dt*6;enemy.hitT-=dt}
      stepCombatEffects(dt);
    });
  }

  function movementInput(){
    let x=pointer?.x||0,y=pointer?.y||0;
    if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;
    if(keys.w||keys.arrowup)y--;if(keys.s||keys.arrowdown)y++;
    const length=Math.hypot(x,y);
    if(length<=(pointer?.deadzone??.12))return {x:0,y:0,active:false};
    return {x:x/Math.max(1,length),y:y/Math.max(1,length),active:true};
  }

  function moveLocal(me,input,dt){
    const gap=localPosition?Math.hypot(me.x-localPosition.x,me.y-localPosition.y):Infinity;
    if(!localPosition||localPosition.dead!==(me.hp<=0)||gap>100){
      localPosition={x:me.x,y:me.y,dead:me.hp<=0};
    }
    if(!input.active||me.hp<=0)return;
    const speed=clamp(ST.spd,155,265), step=speed*dt;
    const length=Math.hypot(input.x,input.y);
    const x=input.x/length,y=input.y/length;
    // Only correct while moving, and only along the current input direction.
    const along=(me.x-localPosition.x)*x+(me.y-localPosition.y)*y;
    const correction=clamp(along*.08,-step*.2,step*.2);
    localPosition.x=clamp(localPosition.x+input.x*step+x*correction,43,WIDTH-43);
    localPosition.y=clamp(localPosition.y+input.y*step+y*correction,49,HEIGHT-49);
  }

  function tick(dt) {
    if (!visible || !state) return;
    if (['prepare', 'battle'].includes(state.phase)) {
      const input=movementInput(),me=state.players.find(p=>p.id===NET.me());
      if(me)moveLocal(me,input,dt);
      sendWait-=dt;
      if(sendWait<=0||input.x!==sentX||input.y!==sentY){
        sendWait=.07;sentX=input.x;sentY=input.y;
        NET.defense('move',{x:sentX,y:sentY});
      }
      fight(dt,input);
    }
    draw(dt);
  }

  return { get visible() { return visible; }, open, receive, tick, disconnect() {
    if (visible) { state = null; statsSent = false; pointer = null; rooms = []; screen(); $('defense-error').textContent = '연결이 끊겨 방에서 나왔어요.'; }
  } };
})();
