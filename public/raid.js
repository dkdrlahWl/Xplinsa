/* 보스 레이드 (1인용): 탑 → 보스 레이드. 전투는 기기에서 처리.
   보스 4종 · 레벨제 · 90초 · 하루 보상 3번 · 장판/폭발 패턴은 빨간 원으로 미리 보임 */
window.RAID = (() => {
  const W = 1400, H = 1900, BX = W / 2, BY = 640, SPAWN_Y = 1600, TIME = 90, DAILY = 3;
  const NAMES = ['빙결 여제', '염옥 마신', '뇌신 골렘', '심연의 괴수'], FLOOR = ['#a9d6ea', '#4a2620', '#55576e', '#251d3a'];
  // 혼자 기준 능력치 (하루 3시간 성장 계산으로 맞춤)
  const bossHp = lv => Math.round(4.5e7 * Math.pow(1.22, lv - 1)), bossAtk = lv => Math.round(1e5 * Math.pow(1.15, lv - 1));
  const rw = lv => ({ myth: 2 + Math.floor(lv / 3), gem: 20 + lv * 2, scl: 2 + lv, goldK: 40 + lv * 4 });
  const root = document.createElement('section'); root.id = 'raid-screen'; root.hidden = true; $('game').appendChild(root);
  let visible = false, mode = 'lobby', run = null, arena = null, boss = null, pointer = null, selBoss = 0, selLv = 1, floorPat = null, floorKey = '';
  let surface = null, renderElapsed = 0, hudElapsed = 0;
  const RENDER_INTERVAL = 1 / 30, HUD_INTERVAL = .1;
  const btn = (a, label, dis = false) => '<button type="button" data-raid="' + a + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
  const topGold = () => MT[ZS[topZone()].m[0]].gold;
  const items = r => '<span>' + IC.myth + ' ' + r.myth + '</span><span>' + IC.scl + ' ' + r.scl + '</span><span>' + IC.gem + ' ' + r.gem + '</span><span>' + IC.gold + ' ' + fmt(r.goldK * topGold()) + '</span>' + (window.PET && S.raidEggDay !== today() ? '<span><img src="' + PET.eggURL(3) + '" style="width:20px;height:20px;vertical-align:middle"> 펫 알(오늘 첫 클리어)</span>' : '');
  function st() { const day = calendarKey(); const r = S.raid || (S.raid = { day, wins: 0, best: [0, 0, 0, 0] }); if (r.day !== day) { r.day = day; r.wins = 0; } if (!Array.isArray(r.best)) r.best = [0, 0, 0, 0]; return r; }
  const left = () => Math.max(0, DAILY - st().wins);
  function lobby() {
    const previousScroll = root.querySelector('.raid-scroll')?.scrollTop ?? 0;
    const focused = root.contains(document.activeElement) ? document.activeElement.dataset : null;
    mode = 'lobby'; run = null; arena = null; surface = null; root.className = 'raid-lobby'; calc();
    const best = st().best, max = (best[selBoss] || 0) + 1, remaining = left();
    selLv = clamp(selLv, 1, max);
    const cards = NAMES.map((name, i) =>
      `<button type="button" class="raid-pick raid-pick-${i}" data-raid="boss" data-b="${i}" aria-pressed="${i === selBoss}"><span><b>${name}</b><small>${best[i] ? '최고 Lv.' + best[i] : '미격파'}</small></span></button>`
    ).join('');
    root.innerHTML = `<header class="raid-header"><h1>보스 레이드</h1>${btn('exit', '닫기')}</header>
      <main class="raid-scroll">
        <div class="raid-layout">
          <div class="raid-select-title"><h2>보스 선택</h2><span>오늘 보상 <b>${remaining} / ${DAILY}</b></span></div>
          <div class="raid-bosses">${cards}</div>
          <section class="raid-stage">
            <div class="raid-stage-row"><h2>도전 레벨</h2><div class="raid-lv">${btn('lvm', '−', selLv <= 1)}<strong>Lv.${selLv}</strong>${btn('lvp', '+', selLv >= max)}</div></div>
            <div class="raid-stat-row"><b>보스</b><span>체력 <strong>${fmt(bossHp(selLv))}</strong></span><span>공격 <strong>${fmt(bossAtk(selLv))}</strong></span></div>
            <div class="raid-stat-row"><b>나</b><span>체력 <strong>${fmt(ST.maxhp)}</strong></span><span>공격 <strong>${fmt(ST.atk)}</strong></span></div>
          </section>
          <section class="raid-rewards"><h2>${remaining ? '클리어 보상' : '오늘 보상 소진'}</h2>${remaining ? '<div class="raid-reward-items">' + items(rw(selLv)) + '</div>' : '<p>연습 모드로 계속 도전할 수 있어요. 연습 클리어는 단계가 오르지 않아요.</p>'}</section>
          <p class="raid-rules">1인 도전 · 제한 시간 ${TIME}초 · 붉은 장판을 피해요</p>
        </div>
      </main>
      <footer class="raid-actions">${btn('start', NAMES[selBoss] + ' Lv.' + selLv + (remaining ? ' 도전' : ' 연습'))}</footer>`;
    root.querySelector('.raid-scroll').scrollTop = previousScroll;
    if (focused?.raid) {
      const control = Array.from(root.querySelectorAll('[data-raid]')).find(el => el.dataset.raid === focused.raid && el.dataset.b === focused.b);
      if (control && !control.disabled) control.focus({ preventScroll:true });
    }
    root.querySelector('[data-raid="lvm"]').setAttribute('aria-label', '도전 레벨 낮추기');
    root.querySelector('[data-raid="lvp"]').setAttribute('aria-label', '도전 레벨 높이기');
  }
  function start() {
    calc(); const lv = selLv, b = selBoss;
    arena = { width: W, height: H, player: { ...P, x: BX, y: SPAWN_Y, hp: ST.maxhp, dead: false, atkCd: 0, swingT: 0, pend: null, s2: null, sk: [0, 0, 0, 0, 0, 0], sub: {}, extraT: 0, trail: [], scarf: [], dir: -Math.PI / 2 }, enemies: [], shots: [], nums: [], fxs: [], timers: [], hit() {} };
    boss = { i: 'b', z: 0, type: 'raid' + b, ph: 0, hitT: 0, spawnT: 0, x: BX, y: BY, hp: bossHp(lv), dead: false, cd: 1.5, d: { ...MT['raid' + b], lv, hp: bossHp(lv), boss: 1, r: 78 } };
    arena.enemies = [boss];
    run = { lv, b, t: TIME, prep: 2, atk: bossAtk(lv), pat: 3.2, warns: [], revive: 0 };
    mode = 'battle'; root.className = 'raid-arena';
    root.innerHTML = '<canvas id="raid-canvas"></canvas><div class="raid-battle-hud"><header><b id="raid-title"></b>' + btn('exit', '나가기') + '</header><div class="raid-bosshp"><span id="raid-bhp"></span><i><em id="raid-bbar"></em></i></div><div class="raid-myhp"><span id="raid-hp"></span></div></div><div id="raid-notice"></div>';
    const c = $('raid-canvas');
    surface = { canvas: c, ctx: c.getContext('2d', { alpha: false }), title: $('raid-title'), bossHp: $('raid-bhp'), bar: $('raid-bbar'), hp: $('raid-hp') };
    renderElapsed = RENDER_INTERVAL;
    hudElapsed = 0;
    hud();
    c.onpointerdown = e => { if (pointer) return; const bounds = c.getBoundingClientRect(); pointer = { id: e.pointerId, ox: e.clientX, oy: e.clientY, left: bounds.left, top: bounds.top, x: 0, y: 0, radius: 46 }; c.setPointerCapture(e.pointerId); };
    c.onpointermove = e => { if (!pointer || e.pointerId !== pointer.id) return; const x = e.clientX - pointer.ox, y = e.clientY - pointer.oy, l = Math.max(pointer.radius, Math.hypot(x, y)); pointer.x = x / l; pointer.y = y / l; };
    c.onpointerup = c.onpointercancel = c.onlostpointercapture = e => { if (pointer?.id === e.pointerId) pointer = null; };
  }
  function finish(win) {
    mode = 'result'; const r = run, s = st(), got = win && s.wins < DAILY ? rw(r.lv) : null;
    if (win) {
      if (got) { s.wins++; if (r.lv > (s.best[r.b] || 0)) s.best[r.b] = r.lv; }
      const bk = collectionState(); bk.monsters['raid' + r.b] = (bk.monsters['raid' + r.b] || 0) + 1; S.bossKills = S.bossKills || {}; S.bossKills['raid' + r.b] = (S.bossKills['raid' + r.b] || 0) + 1;
      trackTask('raid'); trackTask('boss'); window.SFX && SFX.play('fanfare', { v: .7, fixed: 1 });
    }
    r.reward = got; save();
    const n = $('raid-notice'); n.className = 'raid-result';
    n.innerHTML = '<h2>' + (win ? NAMES[r.b] + ' Lv.' + r.lv + ' 처치!' : '레이드 실패') + '</h2>' + (win ? (got ? '<div class="raid-reward-items">' + items(got) + '</div>' + btn('claim', '보상 받기') : '<p>오늘 보상 횟수를 다 써서 보상은 없어요 (연습)</p>') : '<p>90초 안에 처치하지 못했어요</p>') + btn('again', '다시 준비') + btn('exit', '나가기');
  }
  function hurt(d) { const p = arena.player; if (p.dead || run.prep > 0) return; p.hp -= d; p.hitT = .2; withArenaCombat(arena, () => num(p.x, p.y - 56, '-' + fmt(d), '#ff6b6b')); window.SFX && SFX.play('hurt', { v: .5, gap: .25 }); if (p.hp <= 0) { p.hp = 0; p.dead = true; run.revive = 7; window.SFX && SFX.play('die', { v: .6 }); } }
  function input() {
    let x = pointer?.x || 0, y = pointer?.y || 0;
    if (keys.a || keys.arrowleft) x--; if (keys.d || keys.arrowright) x++; if (keys.w || keys.arrowup) y--; if (keys.s || keys.arrowdown) y++;
    const l = Math.hypot(x, y); if (l < .12) return { x: 0, y: 0, on: false }; return { x: x / Math.max(1, l), y: y / Math.max(1, l), on: true };
  }
  function step(dt) {
    const r = run, p = arena.player, inp = input(), b = boss;
    if (r.prep > 0) r.prep -= dt; else r.t = Math.max(0, r.t - dt);
    if (p.dead) { r.revive -= dt; if (r.revive <= 0) { p.dead = false; p.hp = ST.maxhp * .6; p.x = BX; p.y = SPAWN_Y; } }
    else if (inp.on) { const v = clamp(ST.spd, 155, 330) * dt; p.x = clamp(p.x + inp.x * v, 40, W - 40); p.y = clamp(p.y + inp.y * v, 60, H - 50); }
    const enr = b.hp < b.d.hp * .4 ? 1.35 : 1;
    if (r.prep <= 0 && !b.dead && !p.dead) {
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      b.cd -= dt; r.pat -= dt * enr;
      if (d > 110) { const mv = Math.min(d - 110, 75 * enr * dt); b.x += (p.x - b.x) / d * mv; b.y += (p.y - b.y) / d * mv; }
      else if (b.cd <= 0) { b.cd = 1.3 / enr; hurt(r.atk); }
      if (r.pat <= 0) { r.pat = 3.2; if (Math.random() < .6) r.warns.push({ x: p.x, y: p.y, r: 150, t: 1.3, T: 1.3, d: r.atk * 3 }); else r.warns.push({ x: b.x, y: b.y, r: 430, t: 1.8, T: 1.8, d: r.atk * 4 }); window.SFX && SFX.play('warn', { v: .6 }); }
    }
    for (const w of r.warns) { w.t -= dt; if (w.t <= 0) { window.SFX && SFX.play('slam', { v: .8 }); if (!p.dead && Math.hypot(p.x - w.x, p.y - w.y) < w.r) hurt(w.d); } }
    r.warns = r.warns.filter(w => w.t > 0);
    withArenaCombat(arena, () => {
      T += dt;
      P.moving = !P.dead && inp.on; if (P.swingT <= 0 && P.moving) P.dir = Math.atan2(inp.y, inp.x); if (P.moving) P.walk += dt * 11 * Math.min(1.5, ST.spd / 190);
      if (!P.dead && r.prep <= 0) { P.hp = Math.min(ST.maxhp, P.hp + ST.regen * dt); stepPlayerCombat(dt); stepCombatShots(dt); }
      else { P.pend = null; P.s2 = null; P.extraT = 0; P.swingT = 0; arena.timers.length = 0; arena.shots.length = 0; }
      b.ph += dt * 6; b.hitT -= dt; stepCombatEffects(dt);
      if (arena.nums.length > 24) arena.nums.splice(0, arena.nums.length - 24); if (arena.fxs.length > 50) arena.fxs.splice(0, arena.fxs.length - 50);
    });
    if (b.hp <= 0 && !b.dead) { b.dead = true; b.hp = 0; arena.enemies = []; window.SFX && SFX.play('kill_boss', { v: 1 }); }
    hudElapsed += dt;
    if (b.dead || r.t <= 0) { hud(); draw(); finish(b.dead); }
    else if (hudElapsed >= HUD_INTERVAL) { hudElapsed %= HUD_INTERVAL; hud(); }
  }
  function hud() {
    const r = run, b = boss, p = arena.player;
    const setText = (node, val) => { if (node.textContent !== val) node.textContent = val; };
    setText(surface.title, NAMES[r.b] + ' Lv.' + r.lv + ' · ' + (r.prep > 0 ? '준비 ' + Math.ceil(r.prep) : Math.ceil(r.t) + '초'));
    setText(surface.bossHp, fmt(Math.max(0, b.hp)) + ' / ' + fmt(b.d.hp));
    const scale = 'scaleX(' + Math.max(0, b.hp / b.d.hp) + ')';
    if (surface.bar.style.transform !== scale) surface.bar.style.transform = scale;
    setText(surface.hp, p.dead ? '쓰러짐 · ' + Math.ceil(r.revive) + '초 뒤 부활' : '체력 ' + fmt(Math.max(0, p.hp)) + ' / ' + fmt(ST.maxhp));
  }
  function draw() {
    if (!surface?.ctx || !arena) return;
    const { canvas: c, ctx: g } = surface;
    const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    const dp = Math.min(1.5, devicePixelRatio || 1); if (c.width !== Math.round(w * dp) || c.height !== Math.round(h * dp)) { c.width = Math.round(w * dp); c.height = Math.round(h * dp); }
    const zoom = w / 470, sc = zoom * dp, p = arena.player, vw = w / zoom, vh = h / zoom;
    const follow = (v, s, view) => view >= s ? s / 2 : clamp(v, view / 2, s - view / 2), cx = follow(p.x, W, vw), cy = follow(p.y - 20, H, vh);
    g.setTransform(sc, 0, 0, sc, c.width / 2 - cx * sc, c.height / 2 - cy * sc);
    const fl = AI('raid_floor_' + run.b);
    if (fl) { const fk = run.b + ':' + c.width; if (!floorPat || floorKey !== fk) { floorPat = g.createPattern(fl, 'repeat'); floorKey = fk; } g.fillStyle = floorPat; g.fillRect(cx - vw / 2 - 10, cy - vh / 2 - 10, vw + 20, vh + 20); } else { g.fillStyle = FLOOR[run.b]; g.fillRect(cx - vw / 2 - 10, cy - vh / 2 - 10, vw + 20, vh + 20); }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; g.strokeRect(0, 0, W, H);
    for (const wn of run.warns) { const q = 1 - wn.t / wn.T; g.globalAlpha = .28; g.fillStyle = '#ff3b2f'; g.beginPath(); g.arc(wn.x, wn.y, wn.r, 0, Math.PI * 2); g.fill(); g.globalAlpha = .5; g.beginPath(); g.arc(wn.x, wn.y, wn.r * Math.min(1, q), 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; g.strokeStyle = '#ff7a6a'; g.lineWidth = 4; g.beginPath(); g.arc(wn.x, wn.y, wn.r, 0, Math.PI * 2); g.stroke(); }
    withArenaCombat(arena, () => {
      ctx = g; PV = 0;
      const scene = []; if (!boss.dead && Math.abs(boss.x - cx) < vw / 2 + 180 && Math.abs(boss.y - cy) < vh / 2 + 240) scene.push({ y: boss.y, draw() { drawMon(boss); } });
      if (!p.dead) scene.push({ y: p.y, draw() { drawPlayer(); } });
      scene.sort((a, b) => a.y - b.y); for (const it of scene) it.draw(); drawCombatEffects();
    });
    if (pointer) { const x = pointer.ox - pointer.left, y = pointer.oy - pointer.top; g.setTransform(dp, 0, 0, dp, 0, 0); g.fillStyle = '#1c183059'; g.beginPath(); g.arc(x, y, pointer.radius + 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffffcc'; g.beginPath(); g.arc(x + pointer.x * pointer.radius, y + pointer.y * pointer.radius, 19, 0, Math.PI * 2); g.fill(); }
  }
  function open() {
    if (!ch2Open()) { toast('챕터 2가 열리면(화산 군주 처치 + Lv.50) 도전할 수 있어요'); return; }
    if (P.dead) { toast('부활한 뒤 입장할 수 있어요'); return; }
    close(); visible = true; root.hidden = false; joy.on = false; joy.x = joy.y = 0; P.moving = false; P.recall = null; pointer = null;
    selLv = (st().best[selBoss] || 0) + 1; lobby();
  }
  function exit() { visible = false; root.hidden = true; root.innerHTML = ''; run = null; arena = null; surface = null; pointer = null; save(); }
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-raid]'); if (!c || c.disabled) return; const a = c.dataset.raid;
    window.SFX && SFX.play('click', { v: .35 });
    if (a === 'exit') { if (mode === 'battle' && !confirm('레이드를 그만둘까요?')) return; exit(); }
    else if (a === 'boss') { selBoss = +c.dataset.b; selLv = (st().best[selBoss] || 0) + 1; lobby(); }
    else if (a === 'lvm') { selLv--; lobby(); } else if (a === 'lvp') { selLv++; lobby(); }
    else if (a === 'start') start();
    else if (a === 'again') lobby();
    else if (a === 'claim' && run?.reward) { const r = run.reward; run.reward = null; markRewardOrigin(c); give({ myth: r.myth, scl: r.scl, gem: r.gem, gold: r.goldK * topGold() }); if (window.PET && S.raidEggDay !== today()) { S.raidEggDay = today(); PET.egg('raid') } save(); c.remove(); }
  });
  function tick(dt) {
    if (!visible || mode !== 'battle' || !run) return;
    step(Math.min(dt, .05));
    if (mode !== 'battle') return;
    renderElapsed += dt;
    if (renderElapsed >= RENDER_INTERVAL) {
      renderElapsed %= RENDER_INTERVAL;
      draw();
    }
  }
  return { get visible() { return visible; }, open, tick, receive() {}, disconnect() {} };
})();
