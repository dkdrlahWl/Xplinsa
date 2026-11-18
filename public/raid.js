/* 보스 레이드: 탑 → 보스 레이드. 방(최대 4명)을 만들어 같이 잡음. 보스 체력·패턴·위치는 서버(raid.js)가 정함 */
window.RAID = (() => {
  const W = 1400, H = 1900;
  const root = document.createElement('section');
  root.id = 'raid-screen'; root.hidden = true; $('game').appendChild(root);
  const NAMES = ['빙결 여제', '염옥 마신', '뇌신 골렘', '심연의 괴수'], FLOOR = ['#a9d6ea', '#4a2620', '#55576e', '#251d3a'];
  const positions = new Map(), swings = new Map();
  let arena = null, localPosition = null, sentX = 0, sentY = 0, bossT = null;
  let state = null, visible = false, pointer = null, sendWait = 0, statsSent = false, best = [0, 0, 0, 0], rooms = [], remaining = null, selBoss = 0, selLv = 1;
  const btn = (a, label, dis = false, extra = '') => '<button type="button" data-raid="' + a + '" ' + extra + (dis ? ' disabled' : '') + '>' + label + '</button>';
  const ui = (k, e) => AURL[k] ? '<img src="' + AURL[k] + '" style="width:20px;height:20px;vertical-align:-4px" alt="">' : e;
  const topGold = () => MT[ZS[topZone()].m[0]].gold;
  const rw = lv => ({ myth: 2 + Math.floor(lv / 3), gem: 20 + lv * 2, scl: 2 + lv, goldK: 40 + lv * 4 });
  const items = r => '<span>' + IC.myth + ' ' + r.myth + '</span><span>' + IC.scl + ' ' + r.scl + '</span><span>' + IC.gem + ' ' + r.gem + '</span><span>' + IC.gold + ' ' + fmt(r.goldK * topGold()) + '</span>';
  const bossImg = b => { const k = 'mon_raid' + b, al = ALIAS[k]; return AURL[k] ? '<img src="' + AURL[k] + '" alt="">' : al && AURL[al[0]] ? '<img src="' + AURL[al[0]] + '" style="filter:hue-rotate(' + al[1] + 'deg)" alt="">' : '' };
  function resetCombat() {
    localPosition = null; sentX = sentY = 0; bossT = null;
    arena = { width: W, height: H, player: { ...P, atkCd: 0, swingT: 0, pend: null, s2: null, sk: [0, 0, 0, 0, 0, 0], sub: {}, extraT: 0, trail: [], scarf: [] }, enemies: [], shots: [], nums: [], fxs: [], timers: [], hit(e, d) { NET.raid('hit', { damage: d }) } };
  }
  function loadout(ready) { calc(); NET.raid('loadout', { ready, hero: S.hero, weapon: S.slots[0], attack: ST.atk, hp: ST.maxhp, speed: ST.spd, leech: ST.ls, pow: ST.pow }); }
  function showRooms() {
    const list = $('raid-rooms'); if (!list) return; list.replaceChildren();
    if (!rooms.length) { const p = document.createElement('p'); p.textContent = '대기 중인 방이 없어요.'; list.appendChild(p); return; }
    for (const r of rooms) {
      const li = document.createElement('li'), b = document.createElement('b'), c = document.createElement('span'), j = document.createElement('button');
      b.textContent = NAMES[r.boss] + ' Lv.' + r.lv + ' · ' + r.host + '의 방'; c.textContent = r.count + '/4';
      j.type = 'button'; j.dataset.raid = 'join'; j.dataset.room = r.code; j.disabled = r.count >= 4; j.textContent = r.count >= 4 ? '만석' : '입장';
      li.append(b, c, j); list.appendChild(li);
    }
  }
  function screen() {
    root.className = state && state.phase !== 'lobby' ? 'raid-arena' : 'raid-lobby';
    if (!state) {
      const mx = (best[selBoss] || 0) + 1; selLv = clamp(selLv, 1, mx);
      root.innerHTML = '<header>' + (AURL.raid_banner ? '<span style="background:url(' + AURL.raid_banner + ') center/100% 100% no-repeat;padding:6px 26px 10px;color:#fff">보스 레이드</span>' : '보스 레이드') + btn('exit', '닫기') + '</header><div class="defense-card defense-browser"><div class="defense-section"><h2>방 만들기</h2><small class="defense-attempts">오늘 남은 보상 <b>' + (remaining ?? '…') + ' / 3</b></small></div>' +
        '<div class="raid-bosses">' + NAMES.map((n, i) => '<button type="button" data-raid="boss" data-b="' + i + '" aria-pressed="' + (i === selBoss) + '">' + bossImg(i) + '<b>' + n + '</b><small>최고 Lv.' + (best[i] || 0) + '</small></button>').join('') + '</div>' +
        '<div class="raid-lv">' + btn('lvm', '－', selLv <= 1) + '<b>Lv.' + selLv + '</b>' + btn('lvp', '＋', selLv >= mx) + '</div>' +
        '<div class="defense-prizes"><div><b>클리어 보상 (하루 3번)</b>' + items(rw(selLv)) + '</div></div>' +
        btn('create', NAMES[selBoss] + ' Lv.' + selLv + ' 방 만들기', remaining === null) +
        '<small class="defense-attempt-note">1~4명 · 인원이 많을수록 보스 체력 증가 · 90초 안에 처치 · 보상 횟수를 다 써도 친구 도와주기는 가능</small>' +
        '<div class="defense-section"><h3>대기 중인 방</h3><span>최대 4명</span></div><ul id="raid-rooms"></ul><p id="raid-error" role="status"></p></div>';
      showRooms(); return;
    }
    if (state.phase === 'lobby') {
      const host = state.host === NET.me(), me = state.players.find(p => p.id === NET.me());
      root.innerHTML = '<header>보스 레이드 대기실' + btn('exit', '나가기') + '</header><div class="defense-card"><div class="raid-banner" style="' + (AURL.raid_card ? 'background:url(' + AURL.raid_card + ') center/100% 100% no-repeat;padding:14px 16px' : '') + '">' + bossImg(state.boss) + '<div><h2>' + NAMES[state.boss] + ' Lv.' + state.lv + '</h2><p>대기실 ' + state.players.length + '/4 · 방 번호 ' + state.code + '</p></div></div>' +
        '<small class="defense-attempts">오늘 남은 보상 <b>' + (state.remaining ?? '…') + ' / 3</b></small><div class="defense-prizes"><div><b>클리어 보상</b>' + items(rw(state.lv)) + '</div></div><ul>' +
        state.players.map((p, i) => '<li><b id="raid-m-' + i + '"></b><span>⚡ ' + fmt(p.pow || 0) + ' · ' + (p.id === state.host ? ui('raid_crown', '👑') + ' 방장' : p.ready ? ui('raid_ready', '✅') + ' 준비 완료' : '대기 중') + '</span></li>').join('') + '</ul>' +
        (host ? btn('start', '시작', !statsSent || state.players.some(p => p.id !== state.host && !p.ready)) : btn('ready', me?.ready ? '준비 취소' : '준비 완료')) + '<p id="raid-error" role="status"></p></div>';
      state.players.forEach((p, i) => { $('raid-m-' + i).textContent = p.nick || '모험가'; });
      return;
    }
    root.innerHTML = '<canvas id="raid-canvas"></canvas><div class="defense-hud"><header><b id="raid-title"></b>' + btn('exit', '나가기') + '</header><div class="raid-bosshp"><span id="raid-bhp"></span><i><em id="raid-bbar"></em></i></div><div class="raid-myhp"><span id="raid-hp"></span></div></div><div id="raid-notice"></div>';
    const c = $('raid-canvas');
    c.onpointerdown = e => { if (pointer) return; pointer = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0, radius: 46, deadzone: .1 }; c.setPointerCapture(e.pointerId); };
    c.onpointermove = e => { if (!pointer || e.pointerId !== pointer.id) return; const x = e.clientX - pointer.ox, y = e.clientY - pointer.oy, l = Math.max(pointer.radius, Math.hypot(x, y)); pointer.x = x / l; pointer.y = y / l; };
    c.onpointerup = c.onpointercancel = c.onlostpointercapture = e => { if (pointer?.id === e.pointerId) { pointer = null; sendWait = 0; } };
  }
  function updateHud() {
    const t = $('raid-title'); if (!t) return;
    const b = state.b, me = state.players.find(p => p.id === NET.me());
    t.textContent = NAMES[state.boss] + ' Lv.' + state.lv + ' · ' + state.timer + '초';
    if (b) { $('raid-bhp').textContent = fmt(Math.max(0, b.hp)) + ' / ' + fmt(b.max); $('raid-bbar').style.width = Math.max(0, b.hp / b.max * 100) + '%'; }
    if (me) $('raid-hp').textContent = '체력 ' + fmt(Math.max(0, me.hp)) + ' / ' + fmt(me.maxHp);
    const n = $('raid-notice');
    if (state.phase === 'cleared' || state.phase === 'failed') {
      const clear = state.phase === 'cleared', r = state.reward, can = clear && r && !r.none && S.raidClaim !== state.resultId;
      const rank = state.players.slice().sort((a, b) => b.dmg - a.dmg).map((p, i) => '<li><b>' + (i + 1) + '. ' + (p.nick || '모험가') + '</b><span>' + fmt(p.dmg) + '</span></li>').join('');
      n.className = 'defense-result';
      n.innerHTML = '<h2>' + (clear ? NAMES[state.boss] + ' 처치!' : '레이드 실패') + '</h2>' + (clear ? (r && !r.none ? '<div class="defense-earned">' + items(r) + '</div>' : '<p>오늘 보상 횟수를 다 써서 보상은 없어요</p>') : '<p>90초 안에 처치하지 못했어요</p>') +
        '<ul class="raid-dmg">' + rank + '</ul>' + (can ? btn('claim', '보상 받기') : '') + btn('exit', '나가기');
    } else {
      n.className = '';
      n.textContent = state.phase === 'prepare' ? '곧 시작해요 · ' + state.timer : me?.hp === 0 ? '쓰러졌어요 · 잠시 후 부활합니다' : '';
    }
  }
  function receive(m) {
    if (!visible) return;
    if (m.t === 'raidInfo') { best = m.best || best; rooms = m.rooms || []; remaining = m.remaining; selLv = Math.max(1, (best[selBoss] || 0) + 1); if (!state) screen(); return; }
    if (m.t === 'raidRooms') { rooms = m.rooms; if (!state) showRooms(); return; }
    if (m.t === 'raidError') { const e = $('raid-error'); if (e) e.textContent = m.text; else toast(m.text); return; }
    const prev = state; state = m; best = m.best || best; remaining = m.remaining;
    if (!prev || prev.phase === 'lobby' || state.phase === 'lobby' && prev.phase !== 'lobby' || state.phase !== 'lobby' && !$('raid-canvas')) screen();
    else if (state.phase === 'lobby') screen();
    if (state.phase === 'lobby' && !statsSent) { statsSent = true; loadout(false); }
    if (state.phase !== 'lobby') {
      if (!arena || prev?.phase === 'lobby') resetCombat();
      const b = state.b;
      if (b) {
        if (!bossT) bossT = { i: 'b', z: 0, type: 'raid' + state.boss, ph: 0, hitT: 0, spawnT: 0 };
        Object.assign(bossT, { x: b.x, y: b.y, hp: b.hp, dead: b.hp <= 0, d: { ...MT['raid' + state.boss], lv: state.lv, hp: b.max, boss: 1, r: 78 } });
        arena.enemies = b.hp > 0 ? [bossT] : [];
      }
      updateHud();
    }
  }
  function open() {
    if (!window.NET?.on()) { toast('서버에 연결된 후 입장할 수 있어요'); return; }
    if (!ch2Open()) { toast('챕터 2가 열리면(화산 군주 처치 + Lv.50) 도전할 수 있어요'); return; }
    if (P.dead) { toast('부활한 뒤 입장할 수 있어요'); return; }
    close(); visible = true; root.hidden = false; statsSent = false; state = null; rooms = []; remaining = null;
    joy.on = false; joy.x = joy.y = 0; P.moving = false; P.recall = null; positions.clear(); swings.clear(); arena = null;
    screen(); NET.raid('info'); NET.raid('resume');
  }
  function exit() { NET.raid('leave'); visible = false; root.hidden = true; state = null; pointer = null; arena = null; save(); }
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-raid]'); if (!c || c.disabled) return;
    const a = c.dataset.raid;
    if (a === 'exit') return exit();
    if (a === 'boss') { selBoss = +c.dataset.b; selLv = (best[selBoss] || 0) + 1; screen(); return; }
    if (a === 'lvm') { selLv--; screen(); return; }
    if (a === 'lvp') { selLv++; screen(); return; }
    if (a === 'create') return NET.raid('create', { boss: selBoss, lv: selLv });
    if (a === 'join') return NET.raid('join', { code: c.dataset.room });
    if (a === 'start') return NET.raid('start');
    if (a === 'ready') return loadout(!state.players.find(p => p.id === NET.me())?.ready);
    if (a === 'claim' && state?.phase === 'cleared' && state.reward && !state.reward.none && S.raidClaim !== state.resultId) {
      S.raidClaim = state.resultId; const r = state.reward;
      markRewardOrigin(c); give({ myth: r.myth, scl: r.scl, gem: r.gem, gold: r.goldK * topGold() }); save(); updateHud();
    }
  });
  function drawHero(player, pos, g, time) {
    if (player.hp <= 0) return;
    const prior = swings.get(player.id); if (!prior || prior.count !== player.swing) swings.set(player.id, { count: player.swing, at: time });
    const el = time - swings.get(player.id).at, hs = { ...P }, oh = S.hero, ow = S.slots[0], oc = ctx, opv = PV;
    Object.assign(P, { x: pos.x, y: pos.y, dir: player.dir, dead: false, moving: player.moving, walk: time * .012, swingT: player.swing ? Math.max(0, .24 - el / 1000) : 0, sw: .24, trail: [], scarf: [], hitT: 0 });
    if (HERO.some(h => h.k === player.hero)) S.hero = player.hero;
    if (WT[player.weapon?.split('_')[0]] && GR[Number(player.weapon.split('_')[1])]) S.slots[0] = player.weapon;
    ctx = g; PV = 1; try { drawPlayer(); } finally { Object.assign(P, hs); S.hero = oh; S.slots[0] = ow; ctx = oc; PV = opv; }
  }
  function draw(dt) {
    const c = $('raid-canvas'); if (!c || !state) return;
    const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    const dp = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(w * dp) || c.height !== Math.round(h * dp)) { c.width = Math.round(w * dp); c.height = Math.round(h * dp); }
    const g = c.getContext('2d'), zoom = w / 470, sc = zoom * dp, time = performance.now(), alive = new Set();
    const smooth = (k, e) => { alive.add(k); const p = positions.get(k) || { x: e.x, y: e.y }, a = Math.min(1, dt * 17); p.x += (e.x - p.x) * a; p.y += (e.y - p.y) * a; positions.set(k, p); return p; };
    const you = state.players.find(p => p.id === NET.me()); if (!you || !arena) return;
    const focus = localPosition || you, vw = w / zoom, vh = h / zoom, follow = (v, s, view) => view >= s ? s / 2 : clamp(v, view / 2, s - view / 2);
    const cx = follow(focus.x, W, vw), cy = follow(focus.y - 20, H, vh);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    g.setTransform(sc, 0, 0, sc, c.width / 2 - cx * sc, c.height / 2 - cy * sc);
    const fl = AI('raid_floor_' + state.boss);
    if (fl) { g.fillStyle = g.createPattern(fl, 'repeat'); g.fillRect(0, 0, W, H); } else { g.fillStyle = FLOOR[state.boss]; g.fillRect(0, 0, W, H); }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; g.strokeRect(0, 0, W, H);
    for (const wn of state.warns) { const p = 1 - wn.t / wn.T; g.globalAlpha = .28; g.fillStyle = '#ff3b2f'; g.beginPath(); g.arc(wn.x, wn.y, wn.r, 0, Math.PI * 2); g.fill(); g.globalAlpha = .5; g.beginPath(); g.arc(wn.x, wn.y, wn.r * Math.min(1, p), 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; g.strokeStyle = '#ff7a6a'; g.lineWidth = 4; g.beginPath(); g.arc(wn.x, wn.y, wn.r, 0, Math.PI * 2); g.stroke(); }
    withArenaCombat(arena, () => {
      ctx = g; PV = 0;
      const scene = arena.enemies.map(en => ({ y: en.y, draw() { const pos = smooth('b', en); drawMon({ ...en, x: pos.x, y: pos.y }); } }));
      for (const pl of state.players) {
        if (pl.hp <= 0) continue;
        const pos = pl.id === you.id ? focus : smooth('p' + pl.id, pl);
        scene.push({ y: pos.y, draw() {
          if (pl.id === you.id) { const x = P.x, y = P.y; P.x = pos.x; P.y = pos.y; try { drawPlayer() } finally { P.x = x; P.y = y } }
          else { drawHero(pl, pos, g, time); g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.strokeStyle = '#211a35'; g.lineWidth = 3; g.strokeText(pl.nick || '모험가', pos.x, pos.y - 65); g.fillStyle = '#fff'; g.fillText(pl.nick || '모험가', pos.x, pos.y - 65); }
        } });
      }
      scene.sort((a, b) => a.y - b.y); for (const it of scene) it.draw();
      drawCombatEffects();
    });
    for (const k of positions.keys()) if (!alive.has(k)) positions.delete(k);
    if (pointer) { const b = c.getBoundingClientRect(), x = pointer.ox - b.left, y = pointer.oy - b.top; g.setTransform(dp, 0, 0, dp, 0, 0); g.fillStyle = '#1c183059'; g.beginPath(); g.arc(x, y, pointer.radius + 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffffcc'; g.beginPath(); g.arc(x + pointer.x * pointer.radius, y + pointer.y * pointer.radius, 19, 0, Math.PI * 2); g.fill(); }
  }
  function fight(dt, input) {
    const me = state.players.find(p => p.id === NET.me()); if (!arena || !me) return;
    withArenaCombat(arena, () => {
      T += dt;
      if (me.hp < P.hp && me.hp > 0) { P.hitT = .2; num(me.x, me.y - 56, '-' + fmt(P.hp - me.hp), '#ff6b6b'); }
      Object.assign(P, { x: localPosition.x, y: localPosition.y, hp: me.hp, dead: me.hp <= 0, moving: me.hp > 0 && input.active });
      if (P.swingT <= 0 && P.moving) P.dir = Math.atan2(input.y, input.x);
      if (P.moving) P.walk += dt * 11 * Math.min(1.5, ST.spd / 190);
      if (state.phase === 'battle' && !P.dead) { const pr = P.pend; stepPlayerCombat(dt); if (P.pend && P.pend !== pr) NET.raid('swing', { dir: P.dir }); stepCombatShots(dt); }
      else { P.pend = null; P.s2 = null; P.extraT = 0; P.swingT = 0; arena.timers.length = 0; arena.shots.length = 0; }
      for (const en of arena.enemies) { en.ph += dt * 6; en.hitT -= dt; }
      stepCombatEffects(dt);
    });
  }
  function movementInput() {
    let x = pointer?.x || 0, y = pointer?.y || 0;
    if (keys.a || keys.arrowleft) x--; if (keys.d || keys.arrowright) x++; if (keys.w || keys.arrowup) y--; if (keys.s || keys.arrowdown) y++;
    const l = Math.hypot(x, y); if (l <= (pointer?.deadzone ?? .12)) return { x: 0, y: 0, active: false };
    return { x: x / Math.max(1, l), y: y / Math.max(1, l), active: true };
  }
  function moveLocal(me, input, dt) {
    const gap = localPosition ? Math.hypot(me.x - localPosition.x, me.y - localPosition.y) : Infinity;
    if (!localPosition || localPosition.dead !== (me.hp <= 0) || gap > 100) localPosition = { x: me.x, y: me.y, dead: me.hp <= 0 };
    if (!input.active || me.hp <= 0) return;
    const step = clamp(ST.spd, 155, 330) * dt, l = Math.hypot(input.x, input.y), x = input.x / l, y = input.y / l;
    const along = (me.x - localPosition.x) * x + (me.y - localPosition.y) * y, cor = clamp(along * .08, -step * .2, step * .2);
    localPosition.x = clamp(localPosition.x + input.x * step + x * cor, 40, W - 40); localPosition.y = clamp(localPosition.y + input.y * step + y * cor, 60, H - 50);
  }
  function tick(dt) {
    if (!visible || !state) return;
    if (['prepare', 'battle'].includes(state.phase)) {
      const input = movementInput(), me = state.players.find(p => p.id === NET.me());
      if (me) moveLocal(me, input, dt);
      sendWait -= dt;
      if (sendWait <= 0 || input.x !== sentX || input.y !== sentY) { sendWait = .07; sentX = input.x; sentY = input.y; NET.raid('move', { x: sentX, y: sentY }); }
      fight(dt, input);
    }
    draw(dt);
  }
  return { get visible() { return visible; }, open, receive, tick, disconnect() { if (visible) { state = null; statsSent = false; pointer = null; rooms = []; screen(); const e = $('raid-error'); if (e) e.textContent = '연결이 끊겨 방에서 나왔어요.'; } } };
})();
