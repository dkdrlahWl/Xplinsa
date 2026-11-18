// 링구 HERO 멀티 서버 — 외부 패키지 없이 Node만으로 동작
// 정적 파일 + 회원가입/로그인/저장 API + 실시간 WebSocket(/ws)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = +process.env.PORT || 80;
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA, 'users.json');
fs.mkdirSync(DATA, { recursive: true });

/* ---------------- 저장소 ---------------- */
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); if (!db.users) db.users = {}; } catch (e) {}
let dirty = false;
function markDirty() { dirty = true; }
setInterval(flush, 3000);
function flush() {
  if (!dirty) return; dirty = false;
  const tmp = DB_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), err => { if (!err) fs.rename(tmp, DB_FILE, () => {}); });
}
process.on('SIGTERM', () => { if (dirty) fs.writeFileSync(DB_FILE, JSON.stringify(db)); process.exit(0); });
process.on('SIGINT', () => { if (dirty) fs.writeFileSync(DB_FILE, JSON.stringify(db)); process.exit(0); });

const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const byToken = t => { if (!t) return null; for (const id in db.users) if (db.users[id].token === t) return db.users[id]; return null; };
const nickTaken = n => Object.values(db.users).some(u => u.nick && u.nick.toLowerCase() === n.toLowerCase());

/* ---------------- 거래소 ---------------- */
// 무기를 금화·보석으로 사고팖. 판매 대금(수수료 10% 제외)은 판매자 우편함에 쌓였다가 접속 시 받음
const MK_FILE = path.join(DATA, 'market.json');
// 운영자 선물: id를 새로 추가하면 모든 유저가 다음 접속 때 1번 받음
const GIFTS = [
  { id: 'test-season-1', gem: 50000, msg: '테스트 시즌 선물' },
  { id: 'test-season-2', gem: 100000, msg: '테스트 시즌 선물 2' },
];
let mk = { list: [], mail: {}, seq: 0 };
try { mk = Object.assign(mk, JSON.parse(fs.readFileSync(MK_FILE, 'utf8'))); } catch (e) {}
const saveMk = () => { const t = MK_FILE + '.tmp'; fs.writeFile(t, JSON.stringify(mk), e => { if (!e) fs.rename(t, MK_FILE, () => {}); }); };
const MK_LIMIT = { gold: 1e15, gem: 1e6 }, MK_FEE = .1, MK_MAX = 10;
function market(u, b, res) {
  const mail = mk.mail[u.id] || [];
  if (b.a === 'list') return send(res, 200, { list: mk.list.slice(-300).reverse(), mail: mail.length, me: u.id });
  if (b.a === 'sell') {
    const key = String(b.key || ''), q = Math.round(Number(b.q) * 100) / 100, price = Math.floor(Number(b.price)), cur = b.cur === 'gem' ? 'gem' : 'gold';
    if (!/^(dagger|sword|mace|spear|axe|bow|gun|staff)_[0-6]$/.test(key) || !(q >= .8 && q <= 1.2)) return send(res, 400, { err: '잘못된 무기예요' });
    if (!(price >= 1 && price <= MK_LIMIT[cur])) return send(res, 400, { err: '가격을 확인해 주세요' });
    if (mk.list.filter(l => l.seller === u.id).length >= MK_MAX) return send(res, 400, { err: '한 사람당 ' + MK_MAX + '개까지 등록할 수 있어요' });
    const l = { id: ++mk.seq, seller: u.id, nick: u.nick || '모험가', key, q, price, cur, t: Date.now() };
    mk.list.push(l); saveMk(); return send(res, 200, { ok: 1, l });
  }
  if (b.a === 'buy' || b.a === 'cancel') {
    const i = mk.list.findIndex(l => l.id === (b.id | 0));
    if (i < 0) return send(res, 400, { err: '이미 팔렸거나 내려간 물건이에요' });
    const l = mk.list[i];
    if (b.a === 'cancel') { if (l.seller !== u.id) return send(res, 403, { err: '내 물건만 내릴 수 있어요' }); mk.list.splice(i, 1); saveMk(); return send(res, 200, { ok: 1, key: l.key, q: l.q }); }
    if (l.seller === u.id) return send(res, 400, { err: '내 물건은 살 수 없어요' });
    mk.list.splice(i, 1);
    (mk.mail[l.seller] = mk.mail[l.seller] || []).push({ [l.cur]: Math.floor(l.price * (1 - MK_FEE)), key: l.key, buyer: u.nick || '모험가' });
    saveMk(); return send(res, 200, { ok: 1, key: l.key, q: l.q, price: l.price, cur: l.cur });
  }
  if (b.a === 'claim') { delete mk.mail[u.id]; if (mail.length) saveMk(); return send(res, 200, { mail }); }
  return send(res, 404, { err: 'no' });
}

/* ---------------- HTTP ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise(ok => { let s = ''; req.on('data', c => { s += c; if (s.length > 4e6) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { ok({}); } }); });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (p === '/version') { // 게임 파일이 바뀌면 값이 바뀜 → 접속 중인 폰이 알아서 새로고침
    let v = 0; for (const f of ['game.html', 'net.js', 'index.html']) { try { v = Math.max(v, fs.statSync(path.join(PUB, f)).mtimeMs); } catch (e) {} }
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); return res.end(String(Math.round(v)));
  }
  if (p.startsWith('/api/')) {
    if (req.method !== 'POST') return send(res, 405, { err: 'POST만 가능' });
    const b = await body(req);
    if (p === '/api/signup') {
      const id = String(b.id || '').trim().toLowerCase(), pw = String(b.pw || '');
      if (!/^[a-z0-9_]{4,16}$/.test(id)) return send(res, 400, { err: '아이디는 영어 소문자·숫자 4~16자' });
      if (pw.length < 4 || pw.length > 64) return send(res, 400, { err: '비밀번호는 4자 이상' });
      if (db.users[id]) return send(res, 400, { err: '이미 있는 아이디예요' });
      const salt = crypto.randomBytes(12).toString('hex'), token = crypto.randomBytes(24).toString('hex');
      db.users[id] = { id, salt, hash: hashPw(pw, salt), nick: '', token, save: null, at: Date.now() };
      markDirty(); return send(res, 200, { token, nick: '' });
    }
    if (p === '/api/login') {
      const id = String(b.id || '').trim().toLowerCase(), u = db.users[id];
      if (!u || hashPw(String(b.pw || ''), u.salt) !== u.hash) return send(res, 400, { err: '아이디 또는 비밀번호가 틀렸어요' });
      u.token = crypto.randomBytes(24).toString('hex'); // 새 로그인 → 이전 토큰 무효
      kickUser(u.id); markDirty();
      return send(res, 200, { token: u.token, nick: u.nick });
    }
    const u = byToken(b.token);
    if (!u) return send(res, 401, { err: '다른 곳에서 로그인되어 접속이 끊겼어요', kick: 1 });
    if (p === '/api/rank') { // 전투력·탑 랭킹
      const all = Object.values(db.users).filter(x => x.id !== 'ehgus'); // 관리자 계정은 랭킹에서 제외
      const top = f => all.map(x => ({ n: x.nick || x.id, v: (x.save && f(x.save)) || 0, me: x.id === u.id })).sort((a, b) => b.v - a.v);
      const cut = l => { const i = l.findIndex(r => r.me); return { list: l.slice(0, 50), my: i >= 0 ? { rank: i + 1, ...l[i] } : null }; };
      return send(res, 200, { pow: cut(top(s => s.pow)), tower: cut(top(s => s.tower && s.tower.clear)) });
    }
    if (p === '/api/gift') { // 운영자 선물 (모든 유저 1번씩)
      u.gifts = u.gifts || {}; const got = GIFTS.filter(g => !u.gifts[g.id]);
      if (b.a === 'claim') { for (const g of got) u.gifts[g.id] = Date.now(); if (got.length) markDirty(); }
      return send(res, 200, { gifts: got });
    }
    if (p === '/api/market') return market(u, b, res);
    if (p === '/api/me') return send(res, 200, { nick: u.nick, save: u.save, admin: u.id === 'ehgus' });
    if (p === '/api/nick') {
      const n = String(b.nick || '').trim();
      if (!/^[가-힣a-zA-Z0-9_]{2,8}$/.test(n)) return send(res, 400, { err: '닉네임은 한글·영어·숫자 2~8자' });
      if (u.nick !== n && nickTaken(n)) return send(res, 400, { err: '이미 쓰는 닉네임이에요' });
      u.nick = n; markDirty(); return send(res, 200, { nick: n });
    }
    if (p === '/api/save') {
      if (!b.save || typeof b.save !== 'object') return send(res, 400, { err: 'bad' });
      u.save = b.save; markDirty(); return send(res, 200, { ok: 1 });
    }
    return send(res, 404, { err: 'no' });
  }
  // 정적 파일
  let f = decodeURIComponent(p); if (f === '/') f = '/index.html';
  const fp = path.normalize(path.join(PUB, f));
  if (!fp.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.stat(fp, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(fp).toLowerCase(), tag = '"' + st.size.toString(36) + '-' + st.mtimeMs.toString(36) + '"';
    // 항상 서버에 새 버전인지 물어봄 (안 바뀌었으면 304로 바로 끝 → 빠름)
    if (req.headers['if-none-match'] === tag) { res.writeHead(304, { ETag: tag, 'Cache-Control': 'no-cache' }); return res.end(); }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache', ETag: tag });
      res.end(data);
    });
  });
});

/* ---------------- WebSocket (직접 구현) ---------------- */
const clients = new Map(); // id -> {sock, u, st}
const defense = require("./defense")(clients, wsSend, markDirty);
setInterval(() => defense.tick(.1), 100);
const raid = require('./raid')(clients, wsSend, markDirty);
setInterval(() => raid.tick(.1), 100);
// 몬스터: 체력·죽음·리스폰·때린 사람 목록은 서버가 정함. 움직임은 쫓기는 사람(주인) 폰이 계산해서 보냄
// Stable IDs of the two shared bosses in each region. Match the client spawn table.
// 보스 번호는 클라이언트 지도 생성 순서로 정해짐 → 범위만 확인 (일반 몬스터는 애초에 서버로 안 보냄)
const SHARED_BOSSES = { has: i => Number.isInteger(i) && i >= 0 && i < 20000 };
const mons = new Map(); // i -> {hp,max,dead,hit:Set,own,last,resp,rt}
function mon(i, mx, rs) { let m = mons.get(i); if (!m) { m = { hp: mx, max: mx, dead: false, hit: new Set(), own: null, last: 0, resp: rs || 10, rt: 0 }; mons.set(i, m); } else if (mx > 1 && m.max !== mx) { const fraction = m.max > 0 ? m.hp / m.max : 1; m.max = mx; if (!m.dead) m.hp = Math.max(1, Math.round(mx * fraction)); } return m; }
const MONS_FILE = path.join(DATA, 'mons.json');
try { for (const [i, g] of Object.entries(JSON.parse(fs.readFileSync(MONS_FILE, 'utf8')))) if (SHARED_BOSSES.has(+i) && g.rt > Date.now()) mons.set(+i, { hp: 0, max: g.max, dead: true, hit: new Set(), own: null, last: 0, resp: g.resp, rt: g.rt }); } catch (e) {}
function saveMons() { const o = {}; for (const [i, g] of mons) if (g.dead && g.rt > Date.now() && g.resp >= 60) o[i] = { max: g.max, resp: g.resp, rt: g.rt }; fs.writeFile(MONS_FILE, JSON.stringify(o), () => {}); }
// 월드 보스: 매일 12시·18시·22시(한국 시간)에 등장
function nextWorld() { const now = Date.now(), H = [12, 18, 22]; for (let d = 0; d < 2; d++) for (const h of H) { const k = new Date(now + 9 * 3600e3); k.setUTCHours(h, 0, 0, 0); const t = k.getTime() - 9 * 3600e3 + d * 86400e3; if (t > now + 60e3) return t; } return now + 6 * 3600e3; }
function release(id) { for (const [i, m] of mons) if (m.own === id) { m.own = null; broadcast({ t: 'mo', i, o: null }); } }
function wsSend(sock, obj) {
  if (sock.destroyed) return;
  const data = Buffer.from(JSON.stringify(obj));
  let head;
  if (data.length < 126) head = Buffer.from([0x81, data.length]);
  else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(data.length, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(data.length), 2); }
  sock.write(Buffer.concat([head, data]));
}
function wsClose(sock) { try { sock.write(Buffer.from([0x88, 0])); } catch (e) {} sock.destroy(); }
function kickUser(id) {
  const c = clients.get(id); if (!c) return;
  wsSend(c.sock, { t: 'kick' }); clients.delete(id); setTimeout(() => wsClose(c.sock), 50);
  broadcast({ t: 'leave', id }); release(id);
}
function broadcast(obj, except) { for (const [id, c] of clients) if (id !== except) wsSend(c.sock, obj); }

server.on('upgrade', (req, sock) => {
  const url = new URL(req.url, 'http://x');
  const u = byToken(url.searchParams.get('token'));
  const key = req.headers['sec-websocket-key'];
  if (url.pathname !== '/ws' || !key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true);
  if (!u) { wsSend(sock, { t: 'kick' }); return setTimeout(() => wsClose(sock), 50); }
  const old = clients.get(u.id);
  if (old && old.sock !== sock) { wsSend(old.sock, { t: 'kick' }); setTimeout(() => wsClose(old.sock), 50); }
  const c = { sock, u, st: null, alive: Date.now() };
  clients.set(u.id, c);
  wsSend(sock, { t: 'hi', id: u.id, ms: [...mons].map(([i, m]) => [i, m.hp, m.dead ? 1 : 0, m.own, m.dead ? Math.max(0, (m.rt - Date.now()) / 1000) : 0]), all: [...clients.values()].filter(o => o !== c && o.st).map(o => ({ id: o.u.id, n: o.u.nick, ...o.st })) });
  let buf = Buffer.alloc(0);
  sock.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 15, masked = buf[1] & 128; let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > 1e6) return sock.destroy();
      const mk = masked ? buf.slice(off, off + 4) : null; if (masked) off += 4;
      if (buf.length < off + len) return;
      const pl = Buffer.from(buf.slice(off, off + len)); buf = buf.slice(off + len);
      if (mk) for (let i = 0; i < pl.length; i++) pl[i] ^= mk[i & 3];
      if (op === 8) return wsClose(sock);
      if (op === 9) { sock.write(Buffer.concat([Buffer.from([0x8a, pl.length]), pl])); continue; }
      if (op !== 1) continue;
      let m; try { m = JSON.parse(pl.toString()); } catch (e) { continue; }
      onMsg(c, m);
    }
  });
  const bye = () => { if (clients.get(u.id) === c) { clients.delete(u.id); defense.leave(u.id); raid.leave(u.id); broadcast({ t: 'leave', id: u.id }); release(u.id); } };
  sock.on('close', bye); sock.on('error', bye);
});

function onMsg(c, m) {
  c.alive = Date.now();
  if (!m || typeof m !== 'object') return;
  if (m.t === 'defense') { defense.handle(c, m); return; }
  if (m.t === 'raid') { raid.handle(c, m); return; }
  if (m.t === 'admboss' && c.u.id === 'ehgus') { for (const [i, g] of mons) { g.dead = false; g.hp = g.max; g.hit.clear(); g.rt = 0; broadcast({ t: 'mr', i }); } saveMons(); return; } // 관리자: 모든 공유 보스 즉시 재생성
  if (m.t === 's') { // 내 상태
    const n = v => (typeof v === 'number' && isFinite(v) ? Math.round(v * 100) / 100 : 0);
    c.st = { x: n(m.x), y: n(m.y), d: n(m.d), mv: m.mv ? 1 : 0, sc: m.sc | 0, sw: n(m.sw), w: String(m.w || 'sword_0').slice(0, 20), h: String(m.h || '').slice(0, 20), pt: String(m.pt || '').slice(0, 20), hp: n(m.hp), lv: m.lv | 0, ch: m.ch === 2 ? 2 : 1, rank: Math.max(0, Math.min(5, m.rank | 0)), dead: m.dead ? 1 : 0 };
    c.dirty = true;
    if (Array.isArray(m.mp)) { const mp = []; for (let k = 0; k + 2 < m.mp.length && k < 300; k += 3) { const g = mons.get(m.mp[k] | 0); if (g && g.own === c.u.id && !g.dead) mp.push(m.mp[k] | 0, n(m.mp[k + 1]), n(m.mp[k + 2])); } c.st.mp = mp; }
  } else if (m.t === 'h') { // 몬스터 때림
    const i = m.i | 0, d = +m.d, mx = +m.mx; if (!(d > 0) || !(mx > 0) || !SHARED_BOSSES.has(i)) return;
    const g = mon(i, mx, +m.rs); if (g.dead) return;
    g.hp -= d; g.hit.add(c.u.id); g.last = Date.now();
    if (g.hp <= 0) { g.dead = true; g.own = null; g.rt = m.w ? nextWorld() : Date.now() + g.resp * 1000; broadcast({ t: 'mk', i, w: [...g.hit], rs: Math.round((g.rt - Date.now()) / 1000) }); saveMons(); g.hit.clear(); }
    else broadcast({ t: 'mh', i, hp: g.hp });
  } else if (m.t === 'c') { // 몬스터 주인 요청
    const i = m.i | 0; if (!SHARED_BOSSES.has(i)) return;
    const g = mon(i, +m.mx > 0 ? +m.mx : 1, +m.rs);
    if (!g.dead && (!g.own || !clients.has(g.own))) { g.own = c.u.id; broadcast({ t: 'mo', i, o: g.own }); }
  } else if (m.t === 'r') { const g = mons.get(m.i | 0); if (g && g.own === c.u.id) { g.own = null; broadcast({ t: 'mo', i: m.i | 0, o: null }); } }
  else if (m.t === 'p') wsSend(c.sock, { t: 'p', k: m.k });
}

// 1초에 20번 묶어서 보냄
setInterval(() => {
  const ups = [];
  for (const c of clients.values()) if (c.dirty && c.st) { c.dirty = false; ups.push({ id: c.u.id, n: c.u.nick, ...c.st }); }
  if (ups.length) for (const c of clients.values()) { const l = ups.filter(o => o.id !== c.u.id); if (l.length) wsSend(c.sock, { t: 'u', l }); }
  const now = Date.now();
  for (const [i, g] of mons) {
    if (g.dead && now >= g.rt) { g.dead = false; g.hp = g.max; g.hit.clear(); broadcast({ t: 'mr', i }); }
    // 원 안에 쫓는 사람이 없으면(주인 없음) 1.5초 뒤부터 빠르게 회복 (약 2.5초에 가득)
    else if (!g.dead && g.hp < g.max && !g.own && now - g.last > 1500) { g.hp = Math.min(g.max, g.hp + g.max * .02); if (g.hp >= g.max) g.hit.clear(); if (g.hp >= g.max || (now / 50 | 0) % 4 === 0) broadcast({ t: 'mh', i, hp: g.hp }); }
  }
  for (const [id, c] of clients) if (now - c.alive > 20000) { clients.delete(id); defense.leave(id); raid.leave(id); wsClose(c.sock); broadcast({ t: 'leave', id }); }
}, 50);

server.listen(PORT, () => console.log('링구 HERO 서버 실행 중: 포트 ' + PORT));
