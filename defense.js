'use strict';

const bossInRange = (e,p) => p.hp > 0 && Math.hypot(p.x-e.hx,p.y-e.hy)<=e.radius;
const WIDTH = 1920, HEIGHT = 2560, CENTER_X = WIDTH / 2, CENTER_Y = HEIGHT / 2;
const HEAL_RADIUS = 34, DAILY_LIMIT = 10;
const dayKey = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
// 1~5단계: 챕터 1 · 6~10단계: 챕터 2 몬스터 (금화는 클라이언트에서 지역 금화 배율을 곱함)
const REWARDS = Array.from({ length: 10 }, (_, i) => ({
  first: { gold: 3000 * (i + 1) * (i >= 5 ? 3 : 1), scr: 2 * (i + 1) },
  repeat: { gold: 600 * (i + 1) * (i >= 5 ? 3 : 1), scr: Math.ceil((i + 1) / 2) }
}));
const ENTRIES = {
  north: [CENTER_X, 60], east: [WIDTH - 54, CENTER_Y],
  south: [CENTER_X, HEIGHT - 60], west: [54, CENTER_Y]
};
const LANES = [[], ['north'], ['east', 'west'], ['north', 'east', 'west'], ['north', 'east', 'south', 'west']];
const WAVES = [
  { type: 'sprout', count: 5, hp: 3000 },
  { type: 'cactus', count: 7, hp: 4700 },
  { type: 'toxic', count: 9, hp: 6500 },
  { type: 'yeti', count: 10, hp: 8500 },
  { type: 'magma', count: 11, hp: 9500 },
  { type: 'c2crab', count: 10, hp: 4e6, dmg: 2e4 },
  { type: 'c2frog', count: 11, hp: 1e7, dmg: 5e4 },
  { type: 'c2gem', count: 11, hp: 2.5e7, dmg: 1e5 },
  { type: 'c2ghost', count: 12, hp: 4e7, dmg: 2e5 },
  { type: 'c2drake', count: 12, hp: 8e7, dmg: 4e5 }
];
const BOSSES = { 5: { type: 'volc', hp: 38000, dmg: 2100 }, 10: { type: 'c2dragon', hp: 1.5e9, dmg: 1.6e6 } };

module.exports = function createDefense(clients, send, markDirty) {
  const rooms = new Map(), memberships = new Map();
  const watchers = new Set();
  let sequence = 0;

  function daily(user, day = dayKey()) {
    return user.defenseDaily?.day === day ? user.defenseDaily : { day, wins: 0 };
  }
  function allowance(user) {
    const d = daily(user); return { remaining: Math.max(0, DAILY_LIMIT - d.wins), limit: DAILY_LIMIT, todayCleared: Object.keys(d.st || {}).map(Number) };
  }

  function roomList() {
    return [...rooms.values()].filter(room => room.phase === 'lobby').map(room => ({
      code: room.code, stage: room.stage, count: room.players.size,
      host: room.players.get(room.host)?.nick || '모험가'
    }));
  }

  function publishRooms() {
    const packet = { t: 'defenseRooms', rooms: roomList() };
    for (const id of watchers) {
      const client = clients.get(id);
      if (client && !memberships.has(id)) send(client.sock, packet);
    }
  }
  const clamp = (value, low, high) => Math.min(high, Math.max(low, Number(value) || 0));

  function sendRoom(room) {
    const packet = {
      t: 'defenseState', code: room.code, host: room.host, phase: room.phase,
      stage: room.stage, timer: Math.ceil(room.timer), lanes: room.lanes,
      camp: Math.ceil(room.camp), campMax: room.campMax, resultId: room.resultId,
      players: [...room.players.values()].map(p => ({
        id: p.id, nick: p.nick, ready: p.ready, x: Math.round(p.x), y: Math.round(p.y),
        hp: Math.ceil(p.hp), maxHp: p.maxHp, dir: p.dir, moving: p.moving, swing: p.swing,
        hero: p.hero, weapon: p.weapon, online: Boolean(clients.get(p.id))
      })),
      enemies: room.enemies.map(e => ({
        id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y), hp: Math.ceil(e.hp), maxHp: e.maxHp, boss: e.boss
      }))
    };
    for (const id of room.players.keys()) {
      const client = clients.get(id);
      if (client) send(client.sock, { ...packet, ...allowance(client.u), best: client.u.defenseBest || 0, reward: room.players.get(id)?.reward });
    }
  }

  function leave(id) {
    watchers.delete(id);
    const room = memberships.get(id);
    if (!room) return;
    memberships.delete(id);
    room.players.delete(id);
    if (!room.players.size) { rooms.delete(room.code); publishRooms(); return; }
    if (room.host === id) room.host = room.players.keys().next().value;
    sendRoom(room);
    publishRooms();
  }

  function join(client, room) {
    const id = client.u.id;
    room.players.set(id, { id, nick: client.u.nick, ready: false, x: CENTER_X, y: CENTER_Y,
      hp: 1, maxHp: 1, dir: 0, moving: false, swing: 0, dx: 0, dy: 0, inputAge: 0, revive: 0 });
    memberships.set(id, room);
    sendRoom(room);
    publishRooms();
  }

  function startWave(room) {
    room.phase = 'battle';
    room.timer = 85;
    const wave = WAVES[room.stage - 1];
    room.queue = [];
    for (let i = 0; i < wave.count; i++) {
      for (const lane of room.lanes) room.queue.push({ lane, type: wave.type, hp: wave.hp * (1 + .35 * (room.lanes.length - 1)), boss: false, at: i * 1.15, dmg: wave.dmg });
    }
    const B = BOSSES[room.stage];
    if (B) room.queue.push({ lane: room.lanes[0], type: B.type, hp: B.hp * (1 + .65 * (room.lanes.length - 1)), boss: true, at: 14, dmg: B.dmg });
    room.waveTime = 0;
  }

  function handle(client, message) {
    const id = client.u.id, room = memberships.get(id);
    const error = text => send(client.sock, { t: 'defenseError', text });
    switch (message.action) {
      case 'info':
        watchers.add(id);
        send(client.sock, { t: 'defenseInfo', best: client.u.defenseBest || 0, ...allowance(client.u), rewards: REWARDS, rooms: roomList() });
        return;
      case 'create': {
        if (room) { sendRoom(room); return; }
        if (!allowance(client.u).remaining) return error('오늘 클리어 횟수를 모두 사용했어요.');
        const stage = Number(message.stage);
        if (!Number.isInteger(stage) || stage < 1 || stage > WAVES.length || stage > (client.u.defenseBest || 0) + 1) {
          return error('이전 단계를 먼저 클리어해 주세요.');
        }
        let code;
        do { code = Math.floor(100000 + Math.random() * 900000).toString(); } while (rooms.has(code));
        const newRoom = { code, host: id, phase: 'lobby', players: new Map(), stage,
          lanes: [], enemies: [], timer: 0, camp: 1000, campMax: 1000 };
        rooms.set(code, newRoom);
        join(client, newRoom);
        return;
      }
      case 'join': {
        if (room) { sendRoom(room); return; }
        if (!allowance(client.u).remaining) return error('오늘 클리어 횟수를 모두 사용했어요.');
        const target = rooms.get(String(message.code));
        if (!target || target.phase !== 'lobby') return error('대기 중인 방을 찾을 수 없어요.');
        if (target.players.size >= 4) return error('이 방은 4명이 꽉 찼어요.');
        join(client, target);
        return;
      }
      case 'resume': if (room) sendRoom(room); return;
      case 'leave': leave(id); return;
    }
    if (!room) return;
    const player = room.players.get(id);
    if (room.phase === 'lobby') {
      if (message.action === 'loadout') {
        player.attack = clamp(message.attack, 8, 5e7);
        player.maxHp = clamp(message.hp, 100, 5e9);
        player.leech = clamp(message.leech, 0, .35);
        player.speed = clamp(message.speed, 155, 265);
        player.hero = String(message.hero || 'adv').slice(0, 20);
        player.weapon = String(message.weapon || 'sword_0').slice(0, 20);
        player.ready = id !== room.host && message.ready === true;
        sendRoom(room);
      } else if (message.action === 'start' && room.host === id) {
        const players = [...room.players.values()];
        if (players.some(p => !p.attack || (p.id !== id && !p.ready))) return error('모두 준비 완료한 뒤 시작할 수 있어요.');
        const users = players.map(p => clients.get(p.id)?.u);
        if (users.some(user => !user || !allowance(user).remaining)) return error('오늘 클리어 횟수를 모두 사용한 참가자가 있어요.');
        room.lanes = LANES[players.length];
        room.campMax = room.camp = 750 + 250 * players.length;
        room.phase = 'prepare'; room.timer = 5;
        room.resultId = Date.now().toString(36) + '-' + (++sequence).toString(36);
        for (let i = 0; i < players.length; i++) {
          const p = players[i], [x, y] = ENTRIES[room.lanes[i]];
          p.x = CENTER_X + (x - CENTER_X) * .22;
          p.y = CENTER_Y + (y - CENTER_Y) * .22;
          p.hp = p.maxHp;
        }
        sendRoom(room);
        publishRooms();
      }
    } else if (message.action === 'hit' && room.phase === 'battle') {
      const enemy = room.enemies.find(e => e.id === message.enemy && e.hp > 0);
      if (!enemy || player.hp <= 0 || enemy.boss && !bossInRange(enemy,player) || Math.hypot(player.x - CENTER_X, player.y - CENTER_Y) <= HEAL_RADIUS) return;
      if (Math.hypot(player.x - enemy.x, player.y - enemy.y) > 470) return;
      const damage = clamp(message.damage, 0, player.attack * 18);
      enemy.hp -= damage;
      player.hp = Math.min(player.maxHp, player.hp + damage * player.leech);
    } else if (message.action === 'swing' && room.phase === 'battle' && player.hp > 0) {
      player.dir = clamp(message.dir, -Math.PI, Math.PI);
      player.swing++;
    } else if (message.action === 'move' && (room.phase === 'battle' || room.phase === 'prepare')) {
      const dx = clamp(message.x, -1, 1), dy = clamp(message.y, -1, 1);
      const scale = Math.max(1, Math.hypot(dx, dy));
      player.dx = dx / scale; player.dy = dy / scale;
      player.inputAge = 0;
    }
  }

  function tick(dt) {
    for (const room of rooms.values()) {
      if (!['battle', 'prepare'].includes(room.phase)) continue;
      room.timer = Math.max(0, room.timer - dt);
      for (const p of room.players.values()) {
        if (p.hp <= 0) {
          p.revive -= dt;
          if (p.revive <= 0) { p.hp = p.maxHp * .45; p.x = CENTER_X; p.y = CENTER_Y + 48; }
          continue;
        }
        p.inputAge += dt;
        p.moving = p.inputAge < .4 && Math.hypot(p.dx, p.dy) > .08;
        if (p.moving) {
          p.x = clamp(p.x + p.dx * p.speed * dt, 43, WIDTH - 43);
          p.y = clamp(p.y + p.dy * p.speed * dt, 49, HEIGHT - 49);
          p.dir = Math.atan2(p.dy, p.dx);
        }
        if (Math.hypot(p.x - CENTER_X, p.y - CENTER_Y) <= HEAL_RADIUS) {
          p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .018 * dt);
        }
      }
      if (room.phase === 'prepare') {
        if (!room.timer) startWave(room);
      } else {
        room.waveTime += dt;
        while (room.queue.length && room.queue[0].at <= room.waveTime) {
          const next = room.queue.shift(), [x, y] = ENTRIES[next.lane];
          const offset = (Math.random() - .5) * 54;
          room.enemies.push({ ...next, id: ++sequence, x: x + (x === CENTER_X ? offset : 0),
            y: y + (y === CENTER_Y ? offset : 0), hx:x, hy:y, radius:Math.hypot(x-CENTER_X,y-CENTER_Y)+200, maxHp: next.hp, cooldown: .8 });
        }
        room.enemies = room.enemies.filter(e => e.hp > 0);
        for (const e of room.enemies) {
          if(e.boss && ![...room.players.values()].some(p=>bossInRange(e,p))){
            const dx=e.hx-e.x,dy=e.hy-e.y,dist=Math.hypot(dx,dy),move=dist?Math.min(1,460*dt/dist):0;
            e.x+=dx*move;e.y+=dy*move;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.45*dt);
            continue;
          }
          const campDistance = Math.hypot(e.x - CENTER_X, e.y - CENTER_Y);
          let target = null, nearest = e.boss ? 145 : 86;
          for (const p of room.players.values()) {
            if (p.hp <= 0 || Math.hypot(p.x - CENTER_X, p.y - CENTER_Y) <= HEAL_RADIUS) continue;
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < nearest) { nearest = d; target = p; }
          }
          const x = target ? target.x : CENTER_X, y = target ? target.y : CENTER_Y;
          const d = target ? nearest : campDistance, reach = target ? (e.boss ? 52 : 32) : 48;
          e.cooldown -= dt;
          if (d > reach) {
            const move = Math.min(d - reach, (e.boss ? 72 : 82 + room.stage * 6) * dt);
            e.x += (x - e.x) / d * move; e.y += (y - e.y) / d * move;
          } else if (e.cooldown <= 0) {
            e.cooldown = e.boss ? 1.45 : 1.2;
            if (!target) room.camp = Math.max(0, room.camp - (e.boss ? 55 : 9 + room.stage * 2));
            else {
              target.hp = Math.max(0, target.hp - (e.dmg || (e.boss ? 2100 : 360 + room.stage * 130)));
              if (target.hp === 0) target.revive = 6;
            }
          }
        }
        if (room.camp <= 0 || !room.timer) room.phase = 'failed';
        else if (!room.queue.length && !room.enemies.length) {
          room.phase = 'cleared';
          for (const id of room.players.keys()) {
            const client = clients.get(id);
            if (!client) continue;
            const day = daily(client.u);
            day.st = day.st || {}; const first = !day.st[room.stage]; day.st[room.stage] = 1;
            room.players.get(id).reward = { ...REWARDS[room.stage - 1][first ? 'first' : 'repeat'], first };
            day.wins++;
            client.u.defenseDaily = day;
            if (room.stage === (client.u.defenseBest || 0) + 1) client.u.defenseBest = room.stage;
            markDirty();
          }
        }
      }
      sendRoom(room);
    }
  }
  return { handle, tick, leave };
};
