/* 탈것: Lv.10에 기본 조랑말 지급 + 버튼(임무 카드 아래) 열림.
   타는 동안 공격·스킬·보조무기 멈춤, 이동만. 맞아도 안 내림. 장애물 통과 없음.
   그림: assets/mount_<키>.webp (오른쪽 보는 옆모습, 등에 안장). 없으면 임시 그림. */
window.MOUNT = (() => {
  // 키, 이름, 등급, 색, 이동속도+, 효과
  const L = [
    ['pony', '갈색 조랑말', 0, '#a8744a', 250, 'dust'],
    ['boar', '아기 멧돼지', 0, '#9a6a5a', 250, 'dust'],
    ['wolf', '초원 늑대', 1, '#9aa4b0', 290, 'dust2'],
    ['tortoise', '거대 거북', 1, '#6aa860', 290, 'leaf'],
    ['camel', '사막 낙타', 2, '#d8b070', 340, 'sand'],
    ['whitehorse', '백마', 2, '#f4f0ea', 340, 'shine'],
    ['reindeer', '얼음 순록', 3, '#8fd8ff', 400, 'frost'],
    ['lion', '화염 사자', 3, '#ff8a3a', 400, 'fire'],
    ['griffin', '황금 그리핀', 4, '#ffc83c', 480, 'gold'],
    ['kirin', '번개 기린', 4, '#4ad8c8', 480, 'storm'],
  ];
  const MS = L.map(([k, n, g, c, sp, fx]) => ({ k, n, g, c, sp, fx }));
  const BY = Object.fromEntries(MS.map(m => [m.k, m]));
  const GN = ['일반', '희귀', '레어', '에픽', '전설'], GC = ['#c3cad6', '#6fe04f', '#5ab4ff', '#c97bff', '#ffc93c'];
  const MAXST = 5, DUPGEM = [5, 10, 20, 40, 100], UNLOCK = 10;
  const BOSSG = { golem: 0, skorp: 1, elder: 1, lord: 2, queen: 2, volc: 3, c2kraken: 2, c2hydra: 3, c2crysk: 3, c2storm: 3, c2lich: 4, c2dragon: 4 };
  function st() { S.mounts = S.mounts || {}; S.mBoss = S.mBoss || {}; if (S.lv >= UNLOCK && !S.mounts.pony) { S.mounts.pony = { st: 1 }; if (!S.mount) S.mount = 'pony'; if (!S.mGot) { S.mGot = 1; setTimeout(() => toast('🐴 탈것이 열렸어요! 임무 아래 버튼으로 타고 내려요'), 400) } } return S.mounts }
  const own = k => st()[k];
  const cur = () => { const k = S.mount; return k && own(k) && BY[k] ? BY[k] : null };
  const riding = () => !!(S.riding && cur() && !combatArena);
  const spd = m => Math.round(m.sp * (1 + .04 * (((own(m.k) || {}).st || 1) - 1)));
  function apply(ST) { RAW = ST.spd; if (riding()) ST.spd = spd(cur()) }
  let RAW = 190;
  function give(k) { const o = own(k); if (!o) { st()[k] = { st: 1 }; if (!S.mount) S.mount = k; return { nw: 1 } } if (o.st < MAXST) { o.st++; return { up: o.st } } const gm = DUPGEM[BY[k].g]; S.gem += gm; return { gem: gm } }
  function rollOf(g) { const pool = MS.filter(m => m.g === g), m = pool[Math.floor(Math.random() * pool.length)]; return { m, g, ...give(m.k) } }
  function pickGrade(odds) { let r = Math.random() * odds.reduce((a, v) => a + v, 0), g = 0; while (g < 4 && r >= odds[g]) { r -= odds[g]; g++ } return g }
  function rollBox() { const bx = BOX.mount; S.pity = S.pity || {}; let g = pickGrade(bx.odds);
    for (const [pg, pn] of bx.pity) { const key = 'mount_' + pg; S.pity[key] = (S.pity[key] || 0) + 1; if (g < pg && S.pity[key] >= pn) g = pg }
    for (const [pg] of bx.pity) if (g >= pg) S.pity['mount_' + pg] = 0; return rollOf(g) }
  function onBoss(type) { // 보스 첫 처치: 탈것 1마리
    st(); if (!(type in BOSSG) || S.mBoss[type] || S.lv < UNLOCK) return; S.mBoss[type] = 1; const r = rollOf(BOSSG[type]); calc(); save();
    setTimeout(() => { if (!GA) startGacha('mountgift', 1, [r]) }, 900) }
  function toggle() { st(); if (S.lv < UNLOCK) return toast('Lv.' + UNLOCK + '부터 탈 수 있어요'); if (!cur()) return toast('탈것이 없어요'); if (combatArena) return;
    S.riding = !S.riding; F.t = 0; calc(); save(); poof(); window.SFX && SFX.play(S.riding ? 'recall' : 'close', { v: .45 }); btn() }
  // ---------- 그리기 ----------
  const PH = {};
  function ph(k) { if (PH[k]) return PH[k]; const m = BY[k], c = document.createElement('canvas'); c.width = 160; c.height = 120; const g = c.getContext('2d');
    g.lineWidth = 4; g.strokeStyle = 'rgba(30,22,46,.75)'; g.lineJoin = 'round'; g.fillStyle = shade(m.c, -.25);
    for (const x of [44, 64, 100, 118]) { g.beginPath(); g.roundRect(x, 70, 14, 40, 6); g.fill(); g.stroke() }
    const gr = g.createLinearGradient(0, 30, 0, 90); gr.addColorStop(0, shade(m.c, .25)); gr.addColorStop(1, shade(m.c, -.2)); g.fillStyle = gr;
    g.beginPath(); g.ellipse(82, 64, 52, 28, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(132, 38, 20, 17, -.3, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1c1830'; g.beginPath(); g.arc(139, 34, 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a3a2a'; g.beginPath(); g.ellipse(80, 42, 22, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (m.g >= 4) { g.fillStyle = '#ffffffcc'; g.beginPath(); g.ellipse(70, 30, 30, 12, -.5, 0, Math.PI * 2); g.fill(); g.stroke() }
    PH[k] = c; c.url = c.toDataURL(); return c }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (k < 0 ? v * k : (255 - v) * k)))); return 'rgb(' + f(n >> 16) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')' }
  const img = k => AI('mount_' + k) || ph(k), url = k => AURL['mount_' + k] || ph(k).url;
  const W = 92; // 화면상 탈것 폭
  const SEAT = .52; // 그림 높이 중 안장 위치(아래에서)
  const F = { t: 0, ghosts: [], parts: [], gT: 0 };
  function poof() { for (let i = 0; i < 14; i++) { const a = rnd(0, TAU), s = rnd(40, 110); F.parts.push({ x: P.x, y: P.y - 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .6 - 20, l: .5, c: '#fff', r: rnd(4, 8) }) } }
  function drawMount(m, x, y, face, mv, ph, alpha) {
    const im = img(m.k), h = W * im.height / im.width, bob = mv ? Math.abs(Math.sin(ph * .5)) * 4 : Math.sin(T * 2) * 1;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.translate(x, y - bob); ctx.scale(face, 1);
    if (mv) ctx.rotate(Math.sin(ph * .5) * .04); ctx.drawImage(im, -W / 2, -h + 4, W, h); ctx.restore();
    return h * SEAT + bob;
  }
  function aura(m, x, y) { if (m.g < 3) return; ctx.save(); const c = m.fx === 'gold' ? '#ffd23c' : m.fx === 'storm' ? '#7ff0ff' : m.fx === 'fire' ? '#ff8a3a' : '#bfe8ff';
    ctx.globalAlpha = .22 + Math.sin(T * 4) * .08; const gr = ctx.createRadialGradient(x, y - 30, 6, x, y - 30, 70); gr.addColorStop(0, c); gr.addColorStop(1, c + '00'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - 30, 70, 58, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = .5; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 2, 44, 14, 0, 0, TAU); ctx.stroke(); ctx.restore() }
  function riderDraw(orig, r) {
    // r: 원격 유저 정보(없으면 나)
    if (typeof PV !== 'undefined' && PV) return orig(); const k = r ? r.mt : (riding() ? S.mount : null), m = k && BY[k]; if (!m || P.dead) return orig();
    const face = Math.cos(P.dir) >= 0 ? 1 : -1, mv = P.moving;
    if (!r) for (const g of F.ghosts) { ctx.save(); drawMount(m, g.x, g.y, g.f, true, g.ph, g.l * .35); ctx.restore() }
    aura(m, P.x, P.y); shadow(P.x, P.y + 2, 40);
    const lift = drawMount(m, P.x, P.y, face, mv, P.walk || 0);
    const y0 = P.y, w0 = P.walk, m0 = P.moving; P.y = y0 - lift; P.moving = false; P.walk = 0;
    try { orig() } finally { P.y = y0; P.walk = w0; P.moving = m0 }
  }
  function trail(dt) {
    const m = cur(); if (!riding() || !m) { F.ghosts.length = 0; return }
    if (P.moving) {
      F.gT -= dt;
      if (m.g >= 4 && F.gT <= 0) { F.gT = .06; F.ghosts.push({ x: P.x, y: P.y, f: Math.cos(P.dir) >= 0 ? 1 : -1, ph: P.walk, l: 1 }) }
      const n = dt * [10, 14, 18, 24, 30][m.g], col = { dust: '#d9c9a8', dust2: '#cfd6dc', leaf: '#8be05a', sand: '#f0d090', shine: '#ffffff', frost: '#bfeaff', fire: '#ffb04a', gold: '#ffe066', storm: '#9ff6ff' }[m.fx];
      if (Math.random() < n) F.parts.push({ x: P.x - Math.cos(P.dir) * 26 + rnd(-10, 10), y: P.y + rnd(-4, 4), vx: -Math.cos(P.dir) * rnd(20, 60), vy: rnd(-30, -6), l: rnd(.35, .6), c: col, r: m.g >= 2 ? rnd(2.5, 4.5) : rnd(4, 7), glow: m.g >= 2 })
    }
    for (let i = F.ghosts.length - 1; i >= 0; i--) { F.ghosts[i].l -= dt * 4; if (F.ghosts[i].l <= 0) F.ghosts.splice(i, 1) }
  }
  function drawFx() { for (const q of F.parts) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 2)); if (q.glow) ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); ctx.restore() } }
  function update(dt) {
    st(); if (combatArena && S.riding) { S.riding = false; calc() }
    trail(dt); for (let i = F.parts.length - 1; i >= 0; i--) { const q = F.parts[i]; q.l -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.l <= 0) F.parts.splice(i, 1) }
    btn();
  }
  // ---------- 버튼 (임무 카드 아래) ----------
  let bEl = null, bSig = '';
  function btn() {
    if (!bEl) { const q = document.getElementById('quests'); if (!q) return; bEl = document.createElement('button'); bEl.type = 'button'; bEl.id = 'mountBtn'; bEl.className = 'mountBtn'; bEl.addEventListener('click', e => { e.stopPropagation(); toggle() }); q.appendChild(bEl) }
    const m = cur(), sig = (S.lv >= UNLOCK) + ':' + (m ? m.k : '') + ':' + riding() + ':' + !!combatArena;
    if (sig === bSig) return; bSig = sig;
    bEl.style.display = S.lv >= UNLOCK && m && !combatArena ? '' : 'none'; if (!m) return;
    bEl.classList.toggle('on', riding()); bEl.style.setProperty('--mc', GC[m.g]);
    bEl.innerHTML = '<img src="' + url(m.k) + '" alt=""><b class="ts">' + (riding() ? '내리기' : '타기') + '</b>';
  }
  // ---------- 화면 ----------
  let focus = null;
  function stars(n) { let s = ''; for (let i = 0; i < MAXST; i++) s += '<span style="color:' + (i < n ? '#ffd23c' : '#4a4466') + '">★</span>'; return s }
  function panelHTML() {
    st(); const fk = focus && BY[focus] ? focus : (cur() ? S.mount : MS[0].k), m = BY[fk], o = own(fk), on = S.mount === fk;
    let h = '<div class="petTop" style="border-color:' + GC[m.g] + '"><div class="petPic ' + (o ? '' : 'lock') + '" style="background:radial-gradient(circle at 50% 60%,' + GC[m.g] + '55,transparent 70%);width:120px"><img src="' + url(fk) + '" style="width:112px;height:84px" alt=""></div><div class="petInfo"><b style="color:' + GC[m.g] + '">' + GN[m.g] + '</b><h3>' + m.n + '</h3>' +
      (o ? '<div>' + stars(o.st) + '</div>' : '<div style="color:#9a94c0">미보유</div>') + '<div class="petAb">탈 때 이동 속도 ' + (o ? spd(m) : m.sp) + ' <span style="color:#cfc8ee">(걸을 때 ' + Math.round(RAW) + ')</span></div><div class="petAb2">타는 동안 공격 불가 · 이동만</div></div></div>';
    if (o) h += '<div class="petBtns">' + (on ? '<button class="btn no" disabled>사용 중</button>' : '<button class="btn" data-a="mequip:' + fk + '">이 탈것 쓰기</button>') + '<button class="btn eq" data-a="mride">' + (riding() ? '내리기' : '타기') + '</button></div>';
    h += '<div class="note">같은 탈것이 또 나오면 별 +1 (별마다 이동 속도 +4%, 최대 5성, 이후 보석). 탈것을 타면 내 이동 속도 강화와 상관없이 탈것 속도로 달려요. 얻는 곳: 상점 <b>탈것 상자</b>, 보스 첫 처치 보상.</div>';
    h += '<div class="petGrid">' + MS.map(q => { const qo = own(q.k); return '<div class="petCell' + (q.k === fk ? ' sel' : '') + (qo ? '' : ' lock') + '" data-a="mfocus:' + q.k + '" style="border-color:' + GC[q.g] + '"><img src="' + url(q.k) + '" style="width:54px;height:40px" alt="">' + (S.mount === q.k ? '<i class="pon">사용</i>' : '') + '<b>' + q.n + '</b><span>' + (qo ? '★' + qo.st : GN[q.g]) + '</span></div>' }).join('') + '</div>';
    return h;
  }
  function act(k, v) {
    if (k === 'mounts') { panel = 'mounts'; draw(); return true }
    if (k === 'mfocus') { focus = v; draw(); return true }
    if (k === 'mequip') { if (own(v)) { S.mount = v; calc(); save(); btn(); toast(BY[v].n + ' 선택!') } draw(); return true }
    if (k === 'mride') { toggle(); draw(); return true }
    return false;
  }
  function card(r, big) { const m = r.m, tag = r.nw ? '<i class="gnew">NEW</i>' : r.up ? '<i class="gnew" style="background:#ffb020">★' + r.up + '</i>' : r.gem ? '<i class="gnew" style="background:#5ab4ff">보석+' + r.gem + '</i>' : '';
    return '<div class="gc gcb gb' + r.g + (r.g >= 3 ? ' hi' + r.g : '') + (big ? ' big' : '') + '" data-g="' + r.g + '"><img src="' + url(m.k) + '" style="transform:none;width:86%;height:58%;margin-top:6px"><span class="gg ts">' + GN[r.g] + '</span><span class="gn ts">' + m.n + '</span>' + tag + '</div>' }
  function admin() { st(); for (const m of MS) st()[m.k] = { st: MAXST }; S.mount = 'griffin'; calc(); save(); bSig = '' }
  return { MS, BY, apply, riding, toggle, update, riderDraw, drawFx, rollBox, onBoss, card, panel: panelHTML, act, admin, url, get key() { return riding() ? S.mount : '' } };
})();
// 그리기 감싸기: 탄 상태면 탈것 위에 캐릭터를 올려 그림(내 캐릭터·다른 유저 모두)
if (typeof drawPlayer === 'function') { const _dp = drawPlayer; drawPlayer = function () { return MOUNT.riderDraw(_dp, window.REM) } }
calc();
