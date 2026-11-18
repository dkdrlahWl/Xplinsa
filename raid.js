'use strict';
// 보스 레이드: 방(최대 4명) · 서버가 보스 체력/패턴/플레이어 위치를 정함 · 하루 3회 클리어
const W = 1400, H = 1900, BX = W / 2, BY = 640, SPAWN_Y = 1600, DAILY_LIMIT = 3, TIME = 90;
const BOSSES = 4;
const dayKey = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
// 레벨별 보스 능력치 (참가 인원에 따라 체력 증가). 하루 3시간 성장 기준으로 맞춤
const bossHp = (lv, n) => Math.round(4.5e7 * Math.pow(1.22, lv - 1) * (1 + .75 * (n - 1)));
const bossAtk = lv => Math.round(1e5 * Math.pow(1.15, lv - 1));
const reward = lv => ({ myth: 2 + Math.floor(lv / 3), gem: 20 + lv * 2, scl: 2 + lv, goldK: 40 + lv * 4 });

module.exports = function createRaid(clients, send, markDirty) {
  const rooms = new Map(), memberships = new Map(), watchers = new Set();
  let seq = 0;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));
  const daily = u => (u.raidDaily && u.raidDaily.day === dayKey() ? u.raidDaily : { day: dayKey(), wins: 0 });
  const remaining = u => Math.max(0, DAILY_LIMIT - daily(u).wins);
  const best = u => (Array.isArray(u.raidBest) ? u.raidBest : [0, 0, 0, 0]);

  function roomList() {
    return [...rooms.values()].filter(r => r.phase === 'lobby').map(r => ({ code: r.code, boss: r.boss, lv: r.lv, count: r.players.size, host: r.players.get(r.host)?.nick || '모험가' }));
  }
  function publishRooms() {
    const pk = { t: 'raidRooms', rooms: roomList() };
    for (const id of watchers) { const c = clients.get(id); if (c && !memberships.has(id)) send(c.sock, pk); }
  }
  function sendRoom(r) {
    const pk = {
      t: 'raidState', code: r.code, host: r.host, phase: r.phase, boss: r.boss, lv: r.lv, timer: Math.ceil(r.timer), resultId: r.resultId,
      b: r.b ? { x: Math.round(r.b.x), y: Math.round(r.b.y), hp: Math.ceil(r.b.hp), max: r.b.max, atk: r.b.atk } : null,
      warns: r.warns.map(w => ({ id: w.id, x: Math.round(w.x), y: Math.round(w.y), r: w.r, t: Math.round(w.t * 100) / 100, T: w.T })),
      players: [...r.players.values()].map(p => ({ id: p.id, nick: p.nick, ready: p.ready, x: Math.round(p.x), y: Math.round(p.y), hp: Math.ceil(p.hp), maxHp: p.maxHp, dir: p.dir, moving: p.moving, swing: p.swing, hero: p.hero, weapon: p.weapon, pow: p.pow || 0, dmg: Math.round(p.dmg || 0) }))
    };
    for (const id of r.players.keys()) { const c = clients.get(id); if (c) send(c.sock, { ...pk, remaining: remaining(c.u), best: best(c.u), reward: r.players.get(id)?.reward }); }
  }
  function leave(id) {
    watchers.delete(id);
    const r = memberships.get(id); if (!r) return;
    memberships.delete(id); r.players.delete(id);
    if (!r.players.size) { rooms.delete(r.code); publishRooms(); return; }
    if (r.host === id) r.host = r.players.keys().next().value;
    sendRoom(r); publishRooms();
  }
  function join(c, r) {
    const id = c.u.id;
    r.players.set(id, { id, nick: c.u.nick, ready: false, x: BX, y: SPAWN_Y, hp: 1, maxHp: 1, dir: -Math.PI / 2, moving: false, swing: 0, dx: 0, dy: 0, inputAge: 0, revive: 0, win: 0, winT: 0, dmg: 0 });
    memberships.set(id, r); sendRoom(r); publishRooms();
  }
  function handle(c, m) {
    const id = c.u.id, r = memberships.get(id), err = text => send(c.sock, { t: 'raidError', text });
    switch (m.action) {
      case 'info': watchers.add(id); send(c.sock, { t: 'raidInfo', best: best(c.u), remaining: remaining(c.u), limit: DAILY_LIMIT, rooms: roomList() }); return;
      case 'create': {
        if (r) { sendRoom(r); return; }
        const b = m.boss | 0, lv = m.lv | 0;
        if (b < 0 || b >= BOSSES || lv < 1 || lv > best(c.u)[b] + 1) return err('이전 레벨을 먼저 클리어해 주세요.');
        let code; do { code = String(Math.floor(100000 + Math.random() * 900000)); } while (rooms.has(code));
        const nr = { code, host: id, phase: 'lobby', players: new Map(), boss: b, lv, b: null, warns: [], timer: 0 };
        rooms.set(code, nr); join(c, nr); return;
      }
      case 'join': {
        if (r) { sendRoom(r); return; }
        const t = rooms.get(String(m.code));
        if (!t || t.phase !== 'lobby') return err('대기 중인 방을 찾을 수 없어요.');
        if (t.players.size >= 4) return err('이 방은 4명이 꽉 찼어요.');
        join(c, t); return;
      }
      case 'resume': if (r) sendRoom(r); return;
      case 'leave': leave(id); return;
    }
    if (!r) return;
    const p = r.players.get(id);
    if (r.phase === 'lobby') {
      if (m.action === 'loadout') {
        p.attack = clamp(m.attack, 5, 5e7); p.maxHp = clamp(m.hp, 100, 5e9); p.leech = clamp(m.leech, 0, .5); p.speed = clamp(m.speed, 155, 330);
        p.hero = String(m.hero || 'adv').slice(0, 20); p.weapon = String(m.weapon || 'sword_0').slice(0, 20); p.pow = clamp(m.pow, 0, 1e13);
        p.ready = id !== r.host && m.ready === true; sendRoom(r);
      } else if (m.action === 'start' && r.host === id) {
        const ps = [...r.players.values()];
        if (ps.some(q => !q.attack || (q.id !== id && !q.ready))) return err('모두 준비 완료한 뒤 시작할 수 있어요.');
        r.phase = 'prepare'; r.timer = 3; r.resultId = Date.now().toString(36) + '-' + (++seq).toString(36);
        const n = ps.length, max = bossHp(r.lv, n);
        r.b = { x: BX, y: BY, hp: max, max, atk: bossAtk(r.lv), cd: 1.5, pat: 3.5, tg: null };
        r.warns = [];
        ps.forEach((q, i) => { q.x = BX + (i - (n - 1) / 2) * 120; q.y = SPAWN_Y; q.hp = q.maxHp; q.dmg = 0; q.reward = null; });
        sendRoom(r); publishRooms();
      }
    } else if (m.action === 'hit' && r.phase === 'battle' && r.b && r.b.hp > 0) {
      if (p.hp <= 0 || Math.hypot(p.x - r.b.x, p.y - r.b.y) > 560) return;
      // 1초에 공격력의 45배까지만 인정 (스킬 폭딜 포함)
      const now = Date.now(); if (now - p.winT > 1000) { p.winT = now; p.win = 0; }
      const d = Math.min(clamp(m.damage, 0, p.attack * 25), Math.max(0, p.attack * 45 - p.win));
      p.win += d; p.dmg += d; r.b.hp -= d; p.hp = Math.min(p.maxHp, p.hp + d * p.leech);
    } else if (m.action === 'swing' && r.phase === 'battle' && p.hp > 0) {
      p.dir = clamp(m.dir, -Math.PI, Math.PI); p.swing++;
    } else if (m.action === 'move' && (r.phase === 'battle' || r.phase === 'prepare')) {
      const dx = clamp(m.x, -1, 1), dy = clamp(m.y, -1, 1), s = Math.max(1, Math.hypot(dx, dy));
      p.dx = dx / s; p.dy = dy / s; p.inputAge = 0;
    }
  }
  function hurt(p, d) { if (p.hp <= 0) return; p.hp = Math.max(0, p.hp - d); if (!p.hp) p.revive = 7; }
  function tick(dt) {
    for (const r of rooms.values()) {
      if (!['battle', 'prepare'].includes(r.phase)) continue;
      r.timer = Math.max(0, r.timer - dt);
      for (const p of r.players.values()) {
        if (p.hp <= 0) { p.revive -= dt; if (p.revive <= 0 && r.phase === 'battle') { p.hp = p.maxHp * .6; p.x = BX; p.y = SPAWN_Y; } continue; }
        p.inputAge += dt; p.moving = p.inputAge < .4 && Math.hypot(p.dx, p.dy) > .08;
        if (p.moving) { p.x = clamp(p.x + p.dx * p.speed * dt, 40, W - 40); p.y = clamp(p.y + p.dy * p.speed * dt, 60, H - 50); p.dir = Math.atan2(p.dy, p.dx); }
      }
      if (r.phase === 'prepare') { if (!r.timer) { r.phase = 'battle'; r.timer = TIME; } sendRoom(r); continue; }
      const b = r.b, alive = [...r.players.values()].filter(p => p.hp > 0), enr = b.hp < b.max * .4 ? 1.35 : 1;
      // 근접: 가까운 사람 쫓아가서 때림
      let tg = null, nd = 1e9; for (const p of alive) { const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < nd) { nd = d; tg = p; } }
      b.cd -= dt; b.pat -= dt * enr;
      if (tg) {
        if (nd > 110) { const mv = Math.min(nd - 110, 75 * enr * dt); b.x += (tg.x - b.x) / nd * mv; b.y += (tg.y - b.y) / nd * mv; }
        else if (b.cd <= 0) { b.cd = 1.3 / enr; hurt(tg, b.atk); }
      }
      // 패턴: 장판(각자 발밑) / 폭발(보스 주변)
      if (b.pat <= 0 && alive.length) {
        b.pat = 3.2;
        if (Math.random() < .6) for (const p of alive) r.warns.push({ id: ++seq, x: p.x, y: p.y, r: 150, t: 1.3, T: 1.3, d: b.atk * 3 });
        else r.warns.push({ id: ++seq, x: b.x, y: b.y, r: 430, t: 1.8, T: 1.8, d: b.atk * 4 });
      }
      for (const w of r.warns) { w.t -= dt; if (w.t <= 0) for (const p of alive) if (Math.hypot(p.x - w.x, p.y - w.y) < w.r) hurt(p, w.d); }
      r.warns = r.warns.filter(w => w.t > 0);
      if (b.hp <= 0) {
        r.phase = 'cleared'; b.hp = 0;
        for (const id of r.players.keys()) {
          const c = clients.get(id); if (!c) continue;
          const dd = daily(c.u), first = dd.wins < DAILY_LIMIT;
          r.players.get(id).reward = first ? { ...reward(r.lv), lv: r.lv } : { none: 1 };
          if (first) { dd.wins++; c.u.raidDaily = dd; }
          const bb = best(c.u).slice(); if (r.lv > bb[r.boss]) { bb[r.boss] = r.lv; c.u.raidBest = bb; }
          markDirty();
        }
        publishRooms();
      } else if (!r.timer) r.phase = 'failed';
      sendRoom(r);
    }
  }
  return { handle, tick, leave };
};
