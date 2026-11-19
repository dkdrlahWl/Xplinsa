/* 필드 이벤트: 황금 토끼 — 사냥 중 가끔 나타나 도망다니는 보물 몬스터 (XP Hero 황금 고블린 같은 것) */
(() => {
  MT.gbun = M('황금 토끼', 1, 100, 0, 1, 0, 26, 0, 'slime', '#ffd23c', { ears: 1, c2: '#fff3a8', resp: 1e12 });
  mk('gbun', -9999, -9999, 0, null);
  const G = mons[mons.length - 1]; G.dead = true; G.respT = 1e12; G.gob = 0;
  const LIFE = 30;
  let next = 180 + Math.random() * 120; // 첫 등장은 3~5분 사냥 뒤

  function fieldOK() {
    return !P.dead && !combatArena && !window.RAID?.visible && !window.DEFENSE?.visible && !window.TOWER?.visible && !P.recall &&
      Math.hypot(P.x - BASE.x, P.y - BASE.y) > BASE.sand + 120 && S.lv >= 3;
  }
  function spawn() {
    let ref = null, bd = 1e9;
    for (const m of mons) { if (m === G || m.dead || m.d.boss || m.d.chest || /^crys|^c2crys/.test(m.type) || !zoneOpen(m.z)) continue; const d = Math.hypot(m.x - P.x, m.y - P.y); if (d < bd) { bd = d; ref = m } }
    if (!ref || bd > 900) return false;
    const t = ref.d, a = Math.random() * Math.PI * 2;
    G.d = Object.assign({}, MT.gbun, { lv: t.lv, hp: Math.round(t.hp * 30), xp: Math.max(1, Math.round(t.xp * 3)), gold: 1, gem: 0, orb: 0, spd: 0, r: 26 });
    G.rw = { gold: Math.round(t.gold * 250), gem: 10 + Math.floor(Math.random() * 21), orb: Math.random() < .5 ? 2 + Math.floor(Math.random() * 3) : 0 };
    G.z = ref.z; G.x = G.fx = P.x + Math.cos(a) * 280; G.y = G.fy = P.y + Math.sin(a) * 280; G.cx = ref.x; G.cy = ref.y;
    G.hx = G.x; G.hy = G.y; G.hp = G.d.hp; G.dead = false; G.respT = 1e12; G.gob = LIFE; G.agg = false; G.slam = null; G.hitT = 0;
    num(P.x, P.y - 120, '✨ 황금 토끼 출현! ✨', '#ffd23c', true); toast('황금 토끼가 나타났어요! ' + LIFE + '초 안에 잡으면 보물을 줘요');
    window.SFX && SFX.play('fanfare', { v: .5, fixed: 1 });
    return true;
  }
  const _update = update;
  update = function (dt) {
    const r = _update.apply(this, arguments);
    if (G.dead) {
      if (fieldOK()) { next -= dt; if (next <= 0) next = spawn() ? 420 + Math.random() * 300 : 20 }
      return r;
    }
    G.gob -= dt; G.cd = 99; G.slam = null;
    if (G.gob <= 0 || !fieldOK() && !P.dead) {
      G.dead = true; G.respT = 1e12; fxs.push({ x: G.fx, y: G.fy - 20, t: .5, r: 60, c: '#ffd23c' });
      if (G.gob <= 0) toast('황금 토끼가 도망갔어요…'); return r;
    }
    // 플레이어에게서 도망 (플레이어보다 조금 느림), 처음 위치 주변을 벗어나면 옆으로 꺾음
    const dx = G.fx - P.x, dy = G.fy - P.y, l = Math.hypot(dx, dy) || 1;
    let vx = dx / l, vy = dy / l;
    const ox = G.fx - G.cx, oy = G.fy - G.cy, ol = Math.hypot(ox, oy);
    if (ol > 520) { const tx = -oy / ol, ty = ox / ol, s = tx * vx + ty * vy >= 0 ? 1 : -1; vx = (vx * .3 + tx * s - ox / ol * .6); vy = (vy * .3 + ty * s - oy / ol * .6); const k = Math.hypot(vx, vy) || 1; vx /= k; vy /= k }
    const sp = l < 420 ? (ST.spd || 200) * .78 : (ST.spd || 200) * .35;
    G.fx += vx * sp * dt + Math.sin(T * 9) * 20 * dt; G.fy += vy * sp * dt + Math.cos(T * 7) * 20 * dt;
    G.x = G.fx; G.y = G.fy; G.tx = G.x; G.ty = G.y;
    if (Math.random() < dt * 8) fxs.push({ x: G.x + rnd(-16, 16), y: G.y - rnd(10, 40), t: .3, r: 6, c: '#fff3a8' });
    return r;
  };
  const _kill = kill;
  kill = function (m) {
    const was = m === G && !m.dead;
    const r = _kill.apply(this, arguments);
    if (was) {
      G.respT = 1e12; G.gob = 0;
      const rw = {}; for (const k in G.rw) if (G.rw[k]) rw[k] = G.rw[k];
      S.keys = S.keys || {}; let key = '';
      if (Math.random() < .3) { S.keys.b3 = (S.keys.b3 || 0) + 1; key = ' · 🔑 전사의 상자 열쇠' }
      toast('황금 토끼 처치! ' + give(rw) + key); num(m.x, m.y - 90, '대박!', '#ffd23c', true);
      save();
    }
    return r;
  };
  const _dm = drawMates;
  drawMates = function () {
    _dm.apply(this, arguments);
    if (G.dead) return;
    const top = 118, bot = ch - 150, cx = cw / 2, cy = (top + bot) / 2, p = scr(G.x, G.y - 20);
    const left = Math.ceil(G.gob);
    if (p.x > -10 && p.x < cw + 10 && p.y > top - 30 && p.y < ch + 10) { label(left + '초', p.x, p.y - 56, 13, '#ffd23c'); return }
    const dx = p.x - cx, dy = p.y - cy, hw = cw / 2 - 16, hh = (bot - top) / 2, k = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6)), x = cx + dx * k, y = cy + dy * k, a = Math.atan2(dy, dx);
    const pu = 1 + Math.sin(T * 10) * .15;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(pu, pu); ctx.fillStyle = '#ffd23c'; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    label('황금 토끼 ' + left + '초', Math.max(60, Math.min(cw - 60, x - Math.cos(a) * 22)), Math.max(top, Math.min(bot, y - Math.sin(a) * 18)) + 4, 12, '#ffd23c');
  };
  window.GBUN = { spawn, get m() { return G } };
})();
