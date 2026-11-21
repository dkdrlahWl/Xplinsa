/* 펫: 30종(등급별 6마리) · 1마리 장착 → 따라다니며 공격 + 능력치
   그림: assets/pet_<키>.webp, 알: assets/pet_egg0~4.webp (없으면 임시 그림) */
window.PET = (() => {
  // 키, 이름, 등급, 색, 비행, 능력치(기본값), 공격{종류, 대기, 색}
  const L = [
    ['slime', '꼬마 슬라임', 0, '#8be05a', 0, { mag: .2 }, { k: 'bite', cd: 1.5 }],
    ['chick', '병아리', 0, '#ffd84a', 0, { spd: .03 }, { k: 'bite', cd: 1.3 }],
    ['mole', '아기 두더지', 0, '#a07850', 0, { gold: .05 }, { k: 'bite', cd: 1.5 }],
    ['mushroom', '버섯 요정', 0, '#e0483c', 0, { regen: .1 }, { k: 'shot', cd: 1.8, c: '#d48cff', s: 'spore' }],
    ['bunny', '솜털 토끼', 0, '#f4f0ec', 0, { xp: .05 }, { k: 'bite', cd: 1.2 }],
    ['crab', '꼬마 게', 0, '#ff8a3c', 0, { hp: .04 }, { k: 'bite', cd: 1.6 }],
    ['fox', '아기 여우', 1, '#ff9a3c', 0, { crit: .02 }, { k: 'bite', cd: 1.1 }],
    ['frog', '개구리', 1, '#5cc85a', 0, { ls: .006 }, { k: 'shot', cd: 1.6, c: '#9ad84a', s: 'poison' }],
    ['bee', '꿀벌', 1, '#ffcf3a', 1, { gold: .08 }, { k: 'shot', cd: 1.2, c: '#ffe066', s: 'sting' }],
    ['turtle', '아기 거북이', 1, '#6aa860', 0, { dr: .04 }, { k: 'bite', cd: 1.7 }],
    ['bat', '아기 박쥐', 1, '#8a5ad0', 1, { ls: .009 }, { k: 'bite', cd: 1.1 }],
    ['piglet', '아기 돼지', 1, '#ff9ab4', 0, { gold: .1 }, { k: 'bite', cd: 1.5 }],
    ['salamander', '불씨 도마뱀', 2, '#ff5a3a', 0, { atk: .04 }, { k: 'shot', cd: 1.5, c: '#ff7a2a', s: 'fire', aoe: 50 }],
    ['owl', '수정 부엉이', 2, '#7ad0ff', 1, { xp: .08, gold: .04 }, { k: 'shot', cd: 1.4, c: '#8ff0ff', s: 'crystal' }],
    ['squirrel', '도토리 다람쥐', 2, '#c8783a', 0, { spd: .04 }, { k: 'shot', cd: 1.0, c: '#b0703a', s: 'acorn' }],
    ['jelly', '해파리', 2, '#ff9ad8', 1, { crit: .03 }, { k: 'chain', cd: 2.0, c: '#ffe36a', n: 3 }],
    ['cat', '마법 고양이', 2, '#4a3e6a', 0, { critd: .15 }, { k: 'shot', cd: 1.3, c: '#c98bff', s: 'star' }],
    ['otter', '수달', 2, '#9a6a4a', 0, { mag: .3, regen: .15 }, { k: 'shot', cd: 1.4, c: '#6ac8ff', s: 'water' }],
    ['penguin', '얼음 펭귄', 3, '#6ab8ff', 0, { hp: .08 }, { k: 'aura', cd: .8, c: '#bfe8ff', r: 130 }],
    ['wolf', '번개 늑대', 3, '#b07aff', 0, { atk: .06 }, { k: 'chain', cd: 1.6, c: '#ffe36a', n: 4 }],
    ['golem', '꼬마 골렘', 3, '#9a9aa8', 0, { dr: .08 }, { k: 'nova', cd: 2.2, c: '#d9c08a', r: 95 }],
    ['ghost', '꼬마 유령', 3, '#e8f0ff', 1, { crit: .04 }, { k: 'shot', cd: 1.3, c: '#a0f0ff', s: 'wisp', pierce: 1 }],
    ['panda', '쿵푸 판다', 3, '#f0f0f0', 0, { atk: .05, hp: .05 }, { k: 'bite', cd: 1.0, hits: 2 }],
    ['seahorse', '해마', 3, '#3ad0c0', 1, { regen: .3 }, { k: 'shot', cd: 1.5, c: '#7ae8ff', s: 'bubble', heal: .03 }],
    ['dragon', '황금 아기 용', 4, '#ffc83c', 1, { atk: .1 }, { k: 'breath', cd: 2.0, c: '#ff8a2a', r: 130 }],
    ['unicorn', '별빛 유니콘', 4, '#ffffff', 0, { xp: .12, hp: .06 }, { k: 'shot', cd: 1.2, c: '#ffb0f0', s: 'rainbow', heal: .04 }],
    ['phoenix', '불사조 병아리', 4, '#ff7a2a', 1, { atk: .05, revive: 1 }, { k: 'shot', cd: 1.6, c: '#ff6a1a', s: 'fire', aoe: 70 }],
    ['kirin', '번개 기린', 4, '#4ad8c8', 1, { crit: .05, critd: .2 }, { k: 'bolt', cd: 1.8, c: '#bff6ff', r: 70 }],
    ['whale', '하늘 고래', 4, '#7ab8ff', 1, { gold: .2 }, { k: 'nova', cd: 2.4, c: '#8fd8ff', r: 120 }],
    ['twinfox', '벚꽃 쌍미호', 5, '#3ee0c8', 0, { atk: .14, crit: .04 }, { k: 'chain', cd: 1.25, c: '#ffb8df', n: 5 }],
    ['tiger', '아기 백호', 4, '#f4f4ff', 0, { atk: .08, crit: .03 }, { k: 'bite', cd: .9, hits: 2 }],
  ];
  const PETS = L.map(([k, n, g, c, fly, pa, at]) => ({ k, n, g, c, fly: !!fly, pa, at }));
  const BY = Object.fromEntries(PETS.map(p => [p.k, p]));
  const GN = ['일반', '희귀', '레어', '에픽', '전설', '고대'];
  const GC = ['#c3cad6', '#6fe04f', '#5ab4ff', '#c97bff', '#ffc93c', '#3ee0c8'];
  const DPS = [.05, .08, .12, .17, .24, .34]; // 공격력 대비 초당 피해(플레이어 ≈ 공격력×2 기준)
  const KF = { bite: 1, shot: 1, chain: .45, nova: .5, aura: .35, breath: .55, bolt: .7 };
  const MAXLV = 50, MAXST = 5, DUPGEM = [5, 10, 20, 40, 100, 250];
  const PN = { mag: '줍는 범위', spd: '이동 속도', gold: '금화 획득', xp: '경험치 획득', hp: '체력', regen: '체력 회복', atk: '공격력', crit: '치명타 확률', critd: '치명타 피해', ls: '흡혈', dr: '받는 피해 감소' };
  const AN = { bite: '달려들어 물기', shot: '원거리 공격', chain: '연쇄 번개', nova: '주변 충격파', aura: '냉기 오라(적 느려짐)', breath: '화염 브레스', bolt: '번개 낙하' };
  const HATCH = { field: [35, 35, 20, 8, 2], elite: [55, 30, 12, 3, 0], raid: [0, 30, 45, 20, 5] };

  function st() { S.pets = S.pets || {}; if (!Array.isArray(S.petEggs)) S.petEggs = [0, 0, 0, 0, 0]; S.incN = S.incN || 2; if (!Array.isArray(S.inc)) S.inc = []; while (S.inc.length < S.incN) S.inc.push(null); return S.pets }
  // ---------- 알 가방 · 부화기 ----------
  const EGG_CAP = 40, INC_MIN = [10, 30, 90, 240, 480], INC_COST = [0, 0, 300, 800], INC_MAX = 4, OVER_GEM = [2, 4, 8, 15, 30];
  const bagN = () => { st(); return S.petEggs.reduce((a, v) => a + v, 0) };
  const room = n => bagN() + n <= EGG_CAP;
  function addEgg(g) { if (!room(1)) { S.gem += OVER_GEM[g]; toast('알 가방이 가득 차서 보석 +' + OVER_GEM[g] + '으로 바꿨어요'); return false } S.petEggs[g]++; return true }
  const incLeft = i => { const o = S.inc[i]; return o ? Math.max(0, o.t0 + o.d - Date.now()) : 0 };
  const incReady = i => !!S.inc[i] && incLeft(i) <= 0;
  const fastCost = i => Math.max(1, Math.ceil(incLeft(i) / 60000 / 3));
  function tfmt(ms) { const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sc = t % 60; return h ? h + '시간 ' + m + '분' : m ? m + '분 ' + sc + '초' : sc + '초' }
  const mfmt = m => (m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + m % 60 + '분' : '') : m + '분');
  function incPut(g) { st(); if (!S.built || !S.built.incubator) return toast('기지에 부화기를 먼저 지어주세요'); if (!(S.petEggs[g] > 0)) return toast('그 등급 알이 없어요'); const i = S.inc.findIndex(o => !o); if (i < 0) return toast('부화기 자리가 없어요'); S.petEggs[g]--; let dur = INC_MIN[g] * 60000; if (S.tutEgg === 1 && g === 0) { S.tutEgg = 2; dur = 60000 } S.inc[i] = { g, t0: Date.now(), d: dur }; qev('incput', null, 1); save(); window.SFX && SFX.play('merge', { v: .5 }); toast(GN[g] + ' 알을 넣었어요 · ' + tfmt(dur) + ' 뒤 부화') }
  function incFast(i) { if (!S.inc[i] || incReady(i)) return; const c = fastCost(i); if (S.gem < c) return toast('보석이 부족해요 (보석 ' + c + ')'); S.gem -= c; S.inc[i].t0 = Date.now() - S.inc[i].d; save(); window.SFX && SFX.play('gem', { v: .5 }) }
  function incHatch(i) { if (!incReady(i)) return; const g = S.inc[i].g; S.inc[i] = null; const res = [rollOf(g)]; qev('hatch', null, 1); calc(); save(); const ret = panel; close(); startGacha('egg' + g, 1, res); if (GA) GA.ret = ret || 'pets' }
  function incBuy() { st(); if (S.incN >= INC_MAX) return; const c = INC_COST[S.incN]; if (S.gem < c) return toast('보석이 부족해요 (보석 ' + c + ')'); S.gem -= c; S.incN++; st(); save(); toast('부화기 자리 ' + S.incN + '칸!') }
  const own = k => st()[k];
  const lvOf = k => (own(k) || {}).lv || 1, starOf = k => (own(k) || {}).st || 1;
  const mult = k => (1 + .015 * (lvOf(k) - 1)) * (1 + .15 * (starOf(k) - 1));
  function eq() { const k = S.pet; return k && own(k) && BY[k] ? BY[k] : null }
  function b(key) { const p = eq(); if (!p || !p.pa[key]) return 0; return key === 'revive' ? 1 : p.pa[key] * mult(p.k) }
  function ownBonus() { let a = 0; for (const p of PETS) if (own(p.k)) a += .002 * (p.g + 1); return a }
  function cost(k) { const p = BY[k]; return Math.round(3000 * Math.pow(1.13, lvOf(k) - 1) * [1, 1.3, 1.7, 2.2, 3][p.g]) }

  // 능력치 반영 (calc 끝에서 호출)
  function apply(ST) {
    st(); const ob = ownBonus();
    ST.atk = Math.round(ST.atk * (1 + b('atk')) * (1 + ob)); ST.maxhp = Math.round(ST.maxhp * (1 + b('hp')));
    ST.crit += b('crit'); ST.critDamage += b('critd'); ST.ls = (ST.ls || 0) + b('ls'); ST.spd *= 1 + b('spd'); ST.regen *= 1 + b('regen');
  }

  // ---------- 그림 ----------
  const PH = {};
  function drawBlob(g, p, W) {
    const c = p.c, r = W * .3, cx = W / 2, cy = W * .58;
    g.lineWidth = W * .035; g.strokeStyle = 'rgba(30,22,46,.7)'; g.lineJoin = 'round';
    if (p.fly) { g.fillStyle = '#ffffffcc'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * .95, cy - r * .55, r * .55, r * .3, s * -.5, 0, Math.PI * 2); g.fill(); g.stroke() } }
    if (['bunny', 'fox', 'cat', 'wolf', 'tiger', 'piglet'].includes(p.k)) { g.fillStyle = c; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * .5, cy - r * 1.05, r * .22, r * (p.k === 'bunny' ? .55 : .32), s * .3, 0, Math.PI * 2); g.fill(); g.stroke() } }
    const gr = g.createRadialGradient(cx - r * .35, cy - r * .5, r * .1, cx, cy, r * 1.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, c); gr.addColorStop(1, shade(c, -.35));
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, r * 1.05, r * .92, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1c1830'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * .36 + r * .12, cy - r * .1, r * .12, r * .16, 0, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * .36 + r * .16, cy - r * .16, r * .05, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#ff8fa8aa'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * .62 + r * .1, cy + r * .12, r * .13, r * .08, 0, 0, Math.PI * 2); g.fill() }
    if (p.g >= 4) { g.strokeStyle = '#ffd23c'; g.lineWidth = W * .03; g.beginPath(); g.moveTo(cx - r * .4, cy - r * .85); g.lineTo(cx - r * .25, cy - r * 1.15); g.lineTo(cx, cy - r * .92); g.lineTo(cx + r * .25, cy - r * 1.15); g.lineTo(cx + r * .4, cy - r * .85); g.stroke() }
  }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (k < 0 ? v * k : (255 - v) * k)))); return 'rgb(' + f(n >> 16) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')' }
  function ph(k) { if (PH[k]) return PH[k]; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); drawBlob(g, BY[k], 128); PH[k] = c; c.url = c.toDataURL(); return c }
  function phEgg(gd) { const key = 'egg' + gd; if (PH[key]) return PH[key]; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), col = GC[gd];
    const gr = g.createRadialGradient(50, 44, 6, 64, 70, 60); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, col); gr.addColorStop(1, shade(col, -.45));
    g.fillStyle = gr; g.strokeStyle = 'rgba(30,22,46,.7)'; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 70, 38, 50, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#ffffff66'; for (const [x, y, r] of [[48, 60, 7], [76, 82, 9], [60, 96, 5], [80, 54, 5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    g.strokeStyle = 'rgba(30,22,46,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 66); g.lineTo(52, 74); g.lineTo(60, 64); g.lineTo(70, 74); g.lineTo(80, 66); g.stroke();
    PH[key] = c; c.url = c.toDataURL(); return c }
  const img = k => AI('pet_' + k) || ph(k);
  const url = k => AURL['pet_' + k] || ph(k).url;
  const eggURL = g => AURL['pet_egg' + g] || phEgg(g).url;

  // ---------- 획득 ----------
  function give(k) {
    const o = own(k); let res;
    if (!o) { st()[k] = { lv: 1, st: 1 }; res = { nw: 1 }; if (!S.pet) S.pet = k }
    else if (o.st < MAXST) { o.st++; res = { up: o.st } }
    else { const gm = DUPGEM[BY[k].g]; S.gem += gm; res = { gem: gm } }
    return res;
  }
  function pickGrade(odds) { let r = Math.random() * odds.reduce((a, v) => a + v, 0), g = 0; while (g < 4 && r >= odds[g]) { r -= odds[g]; g++ } return g }
  function rollOf(g) { const pool = PETS.filter(p => p.g === g), p = pool[Math.floor(Math.random() * pool.length)]; return { p, g, ...give(p.k) } }
  function rollBox() { // 상점 펫 알 상자 (천장 포함) · 0.3%로 고대 펫(알 대신 바로 지급)
    if (Math.random() < (window.ANC_BOX_P ?? .003)) { const anc = PETS.filter(p => p.g === 5), p = anc[Math.floor(Math.random() * anc.length)]; if (p) return Object.assign({ p, g: 5 }, give(p.k)); }
    const bx = BOX.pet; S.pity = S.pity || {}; let g = pickGrade(bx.odds);
    for (const [pg, pn] of bx.pity) { const key = 'pet_' + pg; S.pity[key] = (S.pity[key] || 0) + 1; if (g < pg && S.pity[key] >= pn) g = pg }
    for (const [pg] of bx.pity) if (g >= pg) S.pity['pet_' + pg] = 0;
    addEgg(g); return { egg: 1, g };
  }
  function egg(src, x, y) { st(); const g = pickGrade(HATCH[src]); if (!addEgg(g)) return g; if (x != null) num(x, y, GN[g] + ' 펫 알 획득!', GC[g], true); else toast(GN[g] + ' 펫 알 획득!'); window.SFX && SFX.play('gem', { v: .6 }); return g }
  function onKill(m) { // 필드 몬스터 처치 시 알 드롭
    if (combatArena) return; const d = m.d, c2 = (typeof CHAP !== 'undefined' && CHAP === 2) ? 1.5 : 1;
    if (d.boss && !d.world && Math.random() < .025 * c2) egg('field', m.x, m.y - d.r * 2 - 50);
    else if (d.elite && Math.random() < .002 * c2) egg('elite', m.x, m.y - d.r * 2 - 50);
  }

  // ---------- 따라다니기 ----------
  const F = { x: 0, y: 0, vx: 0, vy: 0, face: 1, ph: 0, init: 0, side: 1, wx: 0, wy: 0, nextW: 0, idleT: 0, cd: 1, pop: 0, dash: null, aura: 0 };
  const REM = new Map(), shots = [], zaps = [], parts = [];
  let reviveT = 0, lastK = null;
  function follow(f, px, py, dir, moving, dt, spd, dead) {
    if (!f.init || Math.hypot(f.x - px, f.y - py) > 620) { f.x = px - 34; f.y = py + 8; f.vx = f.vy = 0; f.init = 1; poof(f.x, f.y) }
    let tx, ty;
    if (f.dash) { const d = f.dash; d.t += dt; const k = Math.min(1, d.t / d.dur), e = k < .5 ? k * 2 : 2 - k * 2; tx = d.ox + (d.tx - d.ox) * e; ty = d.oy + (d.ty - d.oy) * e; f.x = tx; f.y = ty; if (!d.hit && k >= .5) { d.hit = 1; d.cb && d.cb() } if (k >= 1) f.dash = null; f.mv = 1; f.ph += dt * 16; return }
    if (moving && !dead) { f.idleT = 0; const bk = dir + Math.PI; tx = px + Math.cos(bk) * 44 + Math.cos(bk + Math.PI / 2) * 16 * f.side; ty = py + Math.sin(bk) * 28 + Math.sin(bk + Math.PI / 2) * 10 * f.side + 6 }
    else { f.idleT += dt; if (f.idleT > f.nextW) { const a = rnd(0, Math.PI * 2), r = rnd(34, 62); f.wx = Math.cos(a) * r; f.wy = Math.sin(a) * r * .6 + 8; f.nextW = f.idleT + rnd(1.8, 4) } tx = px + f.wx; ty = py + f.wy }
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy), mx = spd * (d > 220 ? 2.4 : d > 100 ? 1.45 : 1.1), want = Math.min(mx, d * 5);
    const vx = d > 1 ? dx / d * want : 0, vy = d > 1 ? dy / d * want : 0, k = Math.min(1, dt * 9);
    f.vx += (vx - f.vx) * k; f.vy += (vy - f.vy) * k; f.x += f.vx * dt; f.y += f.vy * dt;
    const sp = Math.hypot(f.vx, f.vy); f.mv = sp > 14; if (Math.abs(f.vx) > 10) f.face = f.vx > 0 ? 1 : -1; else if (!f.mv) f.face = px > f.x ? 1 : -1;
    f.ph += dt * (f.mv ? 7 + sp / 40 : 3);
  }
  function poof(x, y) { for (let i = 0; i < 10; i++) { const a = rnd(0, Math.PI * 2), s = rnd(30, 90); parts.push({ x, y: y - 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .6 - 20, l: .5, c: '#ffffff', r: rnd(3, 6) }) } }

  // ---------- 공격 ----------
  function target(range) { let best = null, bd = 1e9; for (const m of mons) { if (m.dead || !zoneOpen(m.z)) continue; const dp = Math.hypot(m.x - P.x, m.y - P.y) - m.d.r; if (dp > range) continue; const d = Math.hypot(m.x - F.x, m.y - F.y); if (d < bd) { bd = d; best = m } } return best }
  function dmgOf(p, crit) { const at = p.at; return Math.max(1, Math.round(ST.atk * DPS[p.g] * 2 * at.cd * KF[at.k] * mult(p.k) / (at.hits || 1) * (crit ? ST.critDamage : 1) * rnd(.9, 1.1))) }
  function hitM(m, d, crit) { if (!m || m.dead) return; window.SFX && SFX.play('hit', { v: .1, gap: .35, x: m.x, y: m.y }); dmg(m, d, crit, 1) }
  function area(x, y, r, p, ex) { for (const o of mons) if (!o.dead && zoneOpen(o.z) && o !== ex && Math.hypot(o.x - x, o.y - y) < r + o.d.r) { const c = Math.random() < ST.crit; hitM(o, dmgOf(p, c), c) } }
  function heal(p) { if (!p.at.heal || P.dead) return; const h = Math.round(ST.maxhp * p.at.heal * Math.min(2, mult(p.k))); if (P.hp >= ST.maxhp) return; P.hp = Math.min(ST.maxhp, P.hp + h); num(P.x, P.y - 70, '+' + fmt(h), '#7dff8a'); for (let i = 0; i < 8; i++) parts.push({ x: P.x + rnd(-18, 18), y: P.y - rnd(10, 50), vx: 0, vy: -50, l: .7, c: '#8dffa0', r: 3, plus: 1 }) }
  function attack(p, dt) {
    const at = p.at; F.cd -= dt;
    if (at.k === 'aura') { F.aura += dt; for (const m of mons) if (!m.dead && Math.hypot(m.x - F.x, m.y - F.y) < at.r + m.d.r) m.petSlow = .3 }
    if (F.cd > 0 || F.dash || P.dead) return;
    const tg = target(at.k === 'bite' ? 200 : 250); if (!tg) { F.cd = .2; return }
    F.cd = at.cd / Math.min(1.6, ST.aspd); F.face = tg.x > F.x ? 1 : -1; F.pop = .18;
    const crit = Math.random() < ST.crit;
    if (at.k === 'bite') { const n = at.hits || 1; F.dash = { ox: F.x, oy: F.y, tx: tg.x - (tg.x > F.x ? 1 : -1) * (tg.d.r * .7), ty: tg.y + 2, t: 0, dur: .32, cb: () => { for (let i = 0; i < n; i++) setTimeout(() => { const c = Math.random() < ST.crit; hitM(tg, dmgOf(p, c), c); parts.push({ x: tg.x + rnd(-8, 8), y: tg.y - tg.d.r, vx: 0, vy: 0, l: .18, c: '#fff', r: 10, ring: 1 }) }, i * 110) } }; window.SFX && SFX.play('sw_light', { v: .12, gap: .3 }) }
    else if (at.k === 'shot') { shots.push({ x: F.x, y: F.y - (p.fly ? 34 : 18), tg, sp: 520, d: dmgOf(p, crit), crit, c: at.c, s: at.s, aoe: at.aoe || 0, pierce: at.pierce, p, t: 0 }); if (at.heal) heal(p) }
    else if (at.k === 'chain') { let cur = tg, from = { x: F.x, y: F.y - (p.fly ? 34 : 18) }; const hit = new Set(); for (let i = 0; i < at.n && cur; i++) { hit.add(cur); zaps.push({ x1: from.x, y1: from.y, x2: cur.x, y2: cur.y - cur.d.r, l: .16, c: at.c }); const c = Math.random() < ST.crit; hitM(cur, dmgOf(p, c), c); from = { x: cur.x, y: cur.y - cur.d.r }; let nb = null, nd = 160; for (const o of mons) { if (o.dead || hit.has(o) || !zoneOpen(o.z)) continue; const d = Math.hypot(o.x - cur.x, o.y - cur.y); if (d < nd) { nd = d; nb = o } } cur = nb } window.SFX && SFX.play('skill', { v: .12, gap: .5 }) }
    else if (at.k === 'nova') { const x = tg.x, y = tg.y; F.dash = { ox: F.x, oy: F.y, tx: x - (x > F.x ? 1 : -1) * 20, ty: y, t: 0, dur: .45, cb: () => { area(x, y, at.r, p); fxs.push({ x, y, t: .4, r: at.r, c: at.c }); window.SFX && SFX.play('slam', { v: .15, gap: .5 }) } } }
    else if (at.k === 'aura') { area(F.x, F.y, at.r, p); fxs.push({ x: F.x, y: F.y, t: .35, r: at.r, c: at.c }) }
    else if (at.k === 'breath') { const a = Math.atan2(tg.y - F.y, tg.x - F.x); for (const o of mons) { if (o.dead || !zoneOpen(o.z)) continue; const dx = o.x - F.x, dy = o.y - F.y, d = Math.hypot(dx, dy); if (d > at.r + o.d.r) continue; const da = Math.abs(((Math.atan2(dy, dx) - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (da < .55 || d < 30) { const c = Math.random() < ST.crit; hitM(o, dmgOf(p, c), c) } } for (let i = 0; i < 26; i++) { const aa = a + rnd(-.45, .45), s = rnd(160, 320); parts.push({ x: F.x + Math.cos(a) * 14, y: F.y - 30, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, l: rnd(.3, .5), c: ['#ffd23c', '#ff8a2a', '#ff4a1a'][i % 3], r: rnd(4, 8), fire: 1 }) } window.SFX && SFX.play('skill', { v: .15, gap: .5 }) }
    else if (at.k === 'bolt') { const x = tg.x, y = tg.y; zaps.push({ x1: x + rnd(-20, 20), y1: y - 320, x2: x, y2: y - 4, l: .22, c: at.c, w: 1 }); area(x, y, at.r, p); fxs.push({ x, y, t: .3, r: at.r, c: at.c }); window.SFX && SFX.play('explode', { v: .12, gap: .5 }) }
  }
  function stepShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; const tg = s.tg; if (!tg || tg.dead || s.t > 2) { shots.splice(i, 1); continue }
      const tx = tg.x, ty = tg.y - tg.d.r, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      if (d < 14) { hitM(tg, s.d, s.crit); if (s.aoe) { area(tg.x, tg.y, s.aoe, s.p, tg); fxs.push({ x: tg.x, y: tg.y - tg.d.r * .5, t: .3, r: s.aoe, c: s.c }) } parts.push({ x: tx, y: ty, vx: 0, vy: 0, l: .2, c: s.c, r: 12, ring: 1 });
        if (s.pierce && !s.hit2) { s.hit2 = 1; let nb = null, nd = 200; for (const o of mons) { if (o.dead || o === tg || !zoneOpen(o.z)) continue; const dd = Math.hypot(o.x - tg.x, o.y - tg.y); if (dd < nd) { nd = dd; nb = o } } if (nb) { s.tg = nb; continue } }
        shots.splice(i, 1); continue }
      const v = s.sp * dt; s.x += dx / d * Math.min(v, d); s.y += dy / d * Math.min(v, d); s.a = Math.atan2(dy, dx);
      if (Math.random() < dt * 30) parts.push({ x: s.x, y: s.y, vx: rnd(-10, 10), vy: rnd(-10, 10), l: .25, c: s.c, r: 3 }) }
  }

  // ---------- 매 프레임 ----------
  // 기지의 부화기 (그림 bld_incubator 있으면 사용)
  const IX = () => BASE.x - 215, IY = () => BASE.y + 105;
  let incIn = 0, incTick = 0;
  function incWorld(dt) {
    const d = Math.hypot(P.x - IX(), P.y - IY());
    if (S.built && S.built.incubator && d < 52 && !incIn && !panel && !P.dead) { incIn = 1; open('pets') } else if (d > 95) incIn = 0;
    incTick -= dt; if (incTick > 0) return; incTick = .5;
    for (let i = 0; i < S.inc.length; i++) { const o = S.inc[i]; if (o && !o.nt && incReady(i)) { o.nt = 1; toast(GN[o.g] + ' 알이 부화할 준비가 됐어요! 펫 화면에서 부화하세요'); window.SFX && SFX.play('levelup', { v: .4 }) } }
    if (panel === 'pets') { let redo = false; document.querySelectorAll('.incT').forEach(e => { const i = +e.dataset.i, l = incLeft(i); if (l <= 0) redo = true; e.textContent = tfmt(l) }); document.querySelectorAll('.incBar i').forEach(e => { const i = +e.dataset.i, o = S.inc[i]; if (o) e.style.width = Math.round((1 - incLeft(i) / o.d) * 100) + '%' }); if (redo) draw() }
  }
  function drawInc() {
    const x = IX(), y = IY(), im = AI('bld_incubator');
    if (!S.built || !S.built.incubator) { if (S.lv < 4 || !S.built || !S.built.smith) return; if (im) { const w = 150, h = w * im.height / im.width; ctx.globalAlpha = .4; ctx.drawImage(im, x - w / 2, y + 16 - h, w, h); ctx.globalAlpha = 1 }
      label('부화기 터', x, y - 34, 15, '#fff'); mini('gold', x - 18, y - 16); label(fmt(Math.ceil(150 - (S.bp.incubator || 0))), x + 4, y - 11, 14, '#ffe066'); return }
    shadow(x, y + 6, 58);
    let ey0 = y - 18, gap = 24; if (im) { const w = 150, h = w * im.height / im.width; ctx.drawImage(im, x - w / 2, y + 16 - h, w, h); ey0 = y + 16 - h * .3; gap = 22 }
    else { ell(x, y - 2, 60, 24, '#8d8a9c'); ell(x, y - 10, 56, 21, '#b7b3c6'); ctx.save(); ctx.lineWidth = 3; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.strokeStyle = i % 2 ? '#c9953f' : '#e8bf62'; ctx.beginPath(); ctx.ellipse(x, y - 16, 46 + (i % 3) * 3, 17 + (i % 3), 0, a, a + .7); ctx.stroke() } ctx.restore(); ell(x, y - 16, 38, 13, '#7a5226', 1) }
    const n = S.incN;
    for (let i = 0; i < n; i++) { const o = S.inc[i], ex = x + (i - (n - 1) / 2) * gap, ey = ey0;
      if (!o) { ctx.globalAlpha = .35; ell(ex, ey, 8, 5, '#1c1830', 1); ctx.globalAlpha = 1; continue }
      const rd = incReady(i), e = AI('pet_egg' + o.g) || null, bob = rd ? Math.abs(Math.sin(T * 7 + i)) * 6 : Math.sin(T * 2 + i) * 1, rot = rd ? Math.sin(T * 14 + i) * .18 : 0;
      ctx.save(); ctx.translate(ex, ey - bob); ctx.rotate(rot); const w = 22, h = 28; if (e) ctx.drawImage(e, -w / 2, -h, w, h); else ell(0, -h / 2, w / 2, h / 2, GC[o.g]); ctx.restore();
      if (rd && Math.random() < .08) fxs.push({ x: ex + rnd(-10, 10), y: ey - 20, t: .4, r: 8, c: GC[o.g], up: 1 }) }
    const anyR = S.inc.some((o, i) => incReady(i)), live = []; S.inc.forEach((o, i) => { if (o && !incReady(i)) live.push(incLeft(i)) });
    const ly = im ? y + 16 - 150 * im.height / im.width - 6 : y - 62; label('부화기', x, ly, 16, '#fff');
    if (anyR) { ctx.globalAlpha = .75 + Math.sin(T * 6) * .25; label('부화 가능!', x, ly - 18, 18, '#7dff8a'); ctx.globalAlpha = 1 }
    else if (live.length) label(tfmt(Math.min(...live)), x, ly - 18, 15, '#ffe066');
    else if (bagN()) label('알을 넣어주세요', x, ly - 18, 14, '#cfc8ee');
  }
  function update(dt) {
    st(); const p = eq();
    if (!combatArena) incWorld(dt);
    if (p && p.k !== lastK) { F.init = 0; lastK = p.k }
    if (p) {
      const away = combatArena || window.RAID?.visible || window.DEFENSE?.visible || window.TOWER?.visible;
      follow(F, P.x, P.y, P.dir, P.moving, dt, ST.spd, P.dead);
      if (!away) attack(p, dt);
      if (F.pop > 0) F.pop -= dt;
    }
    if (reviveT > 0) reviveT -= dt;
    // 느려짐 (냉기 오라): 이번 프레임 이동량을 절반으로
    for (const m of mons) { if (m.petSlow > 0 && !m.dead && !m.d.boss && m._px != null) { m.x = m._px + (m.x - m._px) * .45; m.y = m._py + (m.y - m._py) * .45; m.petSlow -= dt } m._px = m.x; m._py = m.y }
    stepShots(dt);
    for (let i = zaps.length - 1; i >= 0; i--) { zaps[i].l -= dt; if (zaps[i].l <= 0) zaps.splice(i, 1) }
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 3; q.vy *= 1 - dt * 3; if (q.l <= 0) parts.splice(i, 1) }
    // 다른 유저 펫
    if (window.NET) { const seen = new Set(); for (const r of NET.list()) { if (!r.pt || !BY[r.pt]) continue; seen.add(r.id); let f = REM.get(r.id); if (!f || f.k !== r.pt) { f = { x: r.x - 34, y: r.y + 8, vx: 0, vy: 0, face: 1, ph: 0, init: 1, side: -1, wx: 0, wy: 0, nextW: 0, idleT: 0, k: r.pt }; REM.set(r.id, f) } follow(f, r.x, r.y, r.d || 0, !!r.mv, dt, 200, r.dead) } for (const id of REM.keys()) if (!seen.has(id)) REM.delete(id) }
  }
  function drawPet(f, p) {
    const im = img(p.k), w = 44 + p.g * 3, h = w * im.height / im.width, x = f.x, y = f.y;
    let lift = 0, sx = 1, sy = 1;
    if (p.fly) { lift = 30 + Math.sin(T * 3 + f.side) * 5; sy = 1 + Math.sin(T * 6) * .03 }
    else if (f.mv) { const s = Math.abs(Math.sin(f.ph)); lift = s * 9; sy = 1 + (s - .5) * .14; sx = 1 - (s - .5) * .1 }
    else { sy = 1 + Math.sin(f.ph) * .035; sx = 1 - Math.sin(f.ph) * .02 }
    if (f.pop > 0) { const k = 1 + f.pop * 1.2; sx *= k; sy *= k }
    shadow(x, y, w * (p.fly ? .28 : .38));
    if (p.g >= 4) { ctx.save(); ctx.globalAlpha = .35 + Math.sin(T * 4) * .1; const gr = ctx.createRadialGradient(x, y - lift - h * .45, 4, x, y - lift - h * .45, w * .75); gr.addColorStop(0, '#ffe680'); gr.addColorStop(1, '#ffe68000'); ctx.fillStyle = gr; ctx.fillRect(x - w, y - lift - h * 1.2, w * 2, h * 1.5); ctx.restore() }
    ctx.save(); ctx.translate(x, y - lift); const tilt = p.fly ? Math.max(-.25, Math.min(.25, f.vx / 900)) : 0; ctx.rotate(tilt); ctx.scale(f.face * sx, sy); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
  }
  function addDraw(list, x0, y0, x1, y1) {
    const p = eq(); if (p && F.init && !P.dead) list.push({ y: F.y, f: () => drawPet(F, p) });
    if (IX() > x0 - 120 && IX() < x1 + 120 && IY() > y0 - 120 && IY() < y1 + 120) list.push({ y: IY(), f: drawInc });
    for (const f of REM.values()) if (f.x > x0 - 80 && f.x < x1 + 80 && f.y > y0 - 80 && f.y < y1 + 120) { const q = BY[f.k]; list.push({ y: f.y, f: () => drawPet(f, q) }) }
  }
  function drawFx() {
    const p = eq();
    if (p && p.at.k === 'aura' && F.init && !P.dead) { ctx.save(); ctx.globalAlpha = .13 + Math.sin(T * 3) * .04; ctx.fillStyle = p.at.c; ctx.beginPath(); ctx.ellipse(F.x, F.y, p.at.r, p.at.r * .55, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = .4; ctx.strokeStyle = p.at.c; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -T * 30; ctx.stroke(); ctx.restore() }
    for (const s of shots) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a || 0); ctx.shadowColor = s.c; ctx.shadowBlur = 12; ctx.fillStyle = s.c;
      if (s.s === 'acorn') { ctx.rotate(T * 14); ctx.fillStyle = '#b0703a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a4020'; ctx.fillRect(-6, -8, 12, 5) }
      else if (s.s === 'star' || s.s === 'rainbow') { ctx.rotate(T * 10); if (s.s === 'rainbow') ctx.fillStyle = 'hsl(' + ((T * 400) % 360) + ',100%,75%)'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, a = i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) } ctx.fill() }
      else if (s.s === 'crystal') { ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(0, -6); ctx.lineTo(-10, 0); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -2, 6, 3) }
      else if (s.s === 'sting') { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill() }
      else { const r = s.s === 'fire' ? 9 : s.s === 'bubble' || s.s === 'water' ? 8 : 6; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(-r * .3, -r * .3, r * .4, 0, TAU); ctx.fill() }
      ctx.restore() }
    for (const z of zaps) { ctx.save(); ctx.globalAlpha = Math.min(1, z.l / .12); ctx.shadowColor = z.c; ctx.shadowBlur = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; for (const [lw, sc] of [[z.w ? 8 : 5, z.c], [2, '#fff']]) { ctx.strokeStyle = sc; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); zig(ctx, z.x1, z.y1, z.x2, z.y2, z.w ? 80 : 40); ctx.stroke() } ctx.restore() }
    for (const q of parts) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 2.5)); if (q.ring) { ctx.strokeStyle = q.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.6 - q.l * 3), 0, TAU); ctx.stroke() } else if (q.plus) { ctx.fillStyle = q.c; ctx.fillRect(q.x - 4, q.y - 1.5, 8, 3); ctx.fillRect(q.x - 1.5, q.y - 4, 3, 8) } else { ctx.fillStyle = q.c; if (q.fire) ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (q.fire ? .6 + q.l : 1), 0, TAU); ctx.fill() } ctx.restore() }
  }
  function revive() { if (!b('revive') || reviveT > 0) return false; reviveT = 180; P.hp = Math.round(ST.maxhp * .5); fxs.push({ x: P.x, y: P.y - 20, t: .6, r: 110, c: '#ff8a2a' }); num(P.x, P.y - 90, '불사조의 부활!', '#ffb04a', true); window.SFX && SFX.play('fanfare', { v: .5 }); for (let i = 0; i < 30; i++) { const a = rnd(0, TAU), s = rnd(80, 220); parts.push({ x: P.x, y: P.y - 30, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, l: .7, c: ['#ffd23c', '#ff8a2a'][i % 2], r: 5, fire: 1 }) } return true }
  const dr = () => 1 - Math.min(.5, b('dr'));

  // ---------- 화면 ----------
  let focus = null;
  function stars(n, mx) { let s = ''; for (let i = 0; i < mx; i++) s += '<span style="color:' + (i < n ? '#ffd23c' : '#4a4466') + '">★</span>'; return s }
  function passTxt(p, m) { return Object.keys(p.pa).map(k => k === 'revive' ? '쓰러지면 체력 50%로 부활 (3분마다)' : PN[k] + ' +' + Math.round(p.pa[k] * m * 1000) / 10 + '%').join(' · ') }
  function atkTxt(p) { const a = p.at; return AN[a.k] + (a.hits ? ' ' + a.hits + '연타' : '') + (a.n ? ' (' + a.n + '명)' : '') + (a.aoe ? ' · 폭발' : '') + (a.pierce ? ' · 관통' : '') + (a.heal ? ' · 체력 회복' : '') + ' · ' + a.cd.toFixed(1) + '초' }
  function incHTML() {
    st(); const free = S.inc.some(o => !o);
    if (!S.built || !S.built.incubator) return '<div class="incW"><div class="incH"><b>🥚 부화기</b><span>알 가방 ' + bagN() + '/' + EGG_CAP + '</span></div><div class="note">기지 왼쪽 아래 <b>부화기 터</b>에 금화 150개를 넣어 부화기를 지어주세요 (Lv.4부터)</div></div>';
    let h = '<div class="incW"><div class="incH"><b>🥚 부화기</b><span>알 가방 ' + bagN() + '/' + EGG_CAP + '</span></div><div class="incS">';
    for (let i = 0; i < INC_MAX; i++) {
      if (i >= S.incN) { h += i === S.incN ? '<div class="incSl lock" data-a="pincbuy"><b>🔒</b><span>칸 열기</span><i>' + IC.gem + INC_COST[i] + '</i></div>' : '<div class="incSl lock dim"><b>🔒</b></div>'; continue }
      const o = S.inc[i];
      if (!o) { h += '<div class="incSl empty"><b>빈 자리</b><span>' + (bagN() ? '아래 알을 눌러 넣기' : '알이 없어요') + '</span></div>'; continue }
      const rd = incReady(i), k = 1 - incLeft(i) / o.d;
      h += '<div class="incSl' + (rd ? ' ready' : '') + '" style="border-color:' + GC[o.g] + '"><img src="' + eggURL(o.g) + '" alt=""><b style="color:' + GC[o.g] + '">' + GN[o.g] + '</b>' +
        (rd ? '<button class="btn" data-a="pinchatch:' + i + '">부화!</button>' : '<span class="incT" data-i="' + i + '">' + tfmt(incLeft(i)) + '</span><div class="incBar"><i data-i="' + i + '" style="width:' + Math.round(k * 100) + '%"></i></div><button class="btn eq" data-a="pincfast:' + i + '">즉시 ' + IC.gem + fastCost(i) + '</button>') + '</div>';
    }
    h += '</div><div class="petEggs">' + S.petEggs.map((n, g) => '<div class="petEgg ' + (n ? '' : 'none') + '" ' + (n ? 'data-a="pegg:' + g + '"' : '') + '><img src="' + eggURL(g) + '" alt=""><b style="color:' + GC[g] + '">' + GN[g] + '</b><span>' + n + '개 · ' + mfmt(INC_MIN[g]) + '</span>' + (n && free ? '<i>넣기</i>' : '') + '</div>').join('') + '</div>';
    return h + '<div class="note" style="margin-top:4px">기지 왼쪽 아래 <b>부화기</b> 위에 서도 이 화면이 열려요. 부화 시간: 일반 10분 · 희귀 30분 · 레어 1시간 30분 · 에픽 4시간 · 전설 8시간 (게임을 꺼도 흘러가요)</div></div>';
  }
  function panelHTML() {
    st(); const fk = focus && BY[focus] ? focus : (eq() ? S.pet : PETS.find(p => own(p.k))?.k || PETS[0].k), p = BY[fk], o = own(fk), m = mult(fk), on = S.pet === fk;
    const ownN = PETS.filter(q => own(q.k)).length, eggs = S.petEggs;
    let h = incHTML() + '<div class="petTop" style="border-color:' + GC[p.g] + '"><div class="petPic ' + (o ? '' : 'lock') + '" style="background:radial-gradient(circle at 50% 60%,' + GC[p.g] + '55,transparent 70%)"><img src="' + url(fk) + '" alt=""></div><div class="petInfo"><b style="color:' + GC[p.g] + '">' + GN[p.g] + '</b><h3>' + p.n + '</h3>' + (o ? '<div>Lv.' + o.lv + ' / ' + MAXLV + ' · ' + stars(o.st, MAXST) + '</div>' : '<div style="color:#9a94c0">미보유 · 펫 알에서 나와요</div>') +
      '<div class="petAb">' + passTxt(p, o ? m : 1) + '</div><div class="petAb2">' + atkTxt(p) + '</div></div></div>';
    if (o) { const c = cost(fk), mx = o.lv >= MAXLV; h += '<div class="petBtns">' + (on ? '<button class="btn no" data-a="punequip">장착 해제</button>' : '<button class="btn" data-a="pequip:' + fk + '">장착</button>') + '<button class="btn eq" data-a="plv:' + fk + '" ' + (mx ? 'disabled' : '') + '>' + (mx ? '최대 레벨' : '레벨업 · ' + IC.gold + fmt(c)) + '</button></div>' }
    h += '<div class="note">같은 펫이 또 나오면 별이 올라가요 (최대 5성, 이후엔 보석). 보유 효과: 펫 ' + ownN + '/30 · 공격력 +' + (Math.round(ownBonus() * 1000) / 10) + '%</div>';
    h += '<div class="petGrid">' + PETS.map(q => { const qo = own(q.k); return '<div class="petCell' + (q.k === fk ? ' sel' : '') + (qo ? '' : ' lock') + '" data-a="pfocus:' + q.k + '" style="border-color:' + GC[q.g] + '"><img src="' + url(q.k) + '" alt="">' + (S.pet === q.k ? '<i class="pon">장착</i>' : '') + '<b>' + q.n + '</b><span>' + (qo ? 'Lv.' + qo.lv + ' ' + '★' + qo.st : GN[q.g]) + '</span></div>' }).join('') + '</div>';
    h += '<div class="note">펫 알은 상점 <b>펫 알 상자</b>, 필드 보스(2.5%), 보스 레이드 하루 첫 클리어 보상으로 얻어요.</div><button class="btn eq" data-a="back" style="width:100%;margin-top:6px">장비로 돌아가기</button>';
    return h;
  }
  function act(k, v) {
    if (k === 'pets') { panel_('pets'); return true }
    if (k === 'pfocus') { focus = v; panel_('pets'); return true }
    if (k === 'pequip') { if (own(v)) { S.pet = v; F.init = 0; calc(); save(); toast(BY[v].n + ' 장착!'); window.SFX && SFX.play('merge', { v: .5 }) } panel_('pets'); return true }
    if (k === 'punequip') { S.pet = null; calc(); save(); panel_('pets'); return true }
    if (k === 'plv') { const o = own(v); if (!o || o.lv >= MAXLV) return true; const c = cost(v); if (S.gold < c) { toast('금화가 부족해요'); return true } S.gold -= c; o.lv++; calc(); save(); window.SFX && SFX.play('upgrade', { v: .5 }); F.pop = .25; panel_('pets'); return true }
    if (k === 'pegg') { incPut(+v); panel_('pets'); return true }
    if (k === 'pincfast') { incFast(+v); panel_('pets'); return true }
    if (k === 'pinchatch') { incHatch(+v); return true }
    if (k === 'pincbuy') { incBuy(); panel_('pets'); return true }
    return false;
  }
  function panel_(p) { panel = p; draw() }
  function closeModal() { close() }
  function hatch() { toast('알은 부화기에 넣어서 부화해요'); return null }
  function card(r, big) { const p = r.p, tag = r.nw ? '<i class="gnew">NEW</i>' : r.up ? '<i class="gnew" style="background:#ffb020">★' + r.up + '</i>' : r.gem ? '<i class="gnew" style="background:#5ab4ff">보석+' + r.gem + '</i>' : '';
    return '<div class="gc gcb gb' + r.g + (r.g >= 3 ? ' hi' + r.g : '') + (big ? ' big' : '') + '" data-g="' + r.g + '"><img src="' + url(p.k) + '" style="transform:none;width:78%;height:62%;margin-top:4px"><span class="gg ts">' + GN[r.g] + '</span><span class="gn ts">' + p.n + '</span>' + tag + '</div>' }
  function eggCard(r, big) { return '<div class="gc gcb gb' + r.g + (r.g >= 3 ? ' hi' + r.g : '') + (big ? ' big' : '') + '" data-g="' + r.g + '"><img src="' + eggURL(r.g) + '" style="transform:none;width:70%;height:62%;margin-top:4px"><span class="gg ts">' + GN[r.g] + '</span><span class="gn ts">펫 알</span></div>' }
  function admin() { st(); for (const p of PETS) st()[p.k] = { lv: MAXLV, st: MAXST }; S.petEggs = [8, 8, 8, 8, 8]; if (!S.pet) S.pet = 'dragon'; calc(); save() }
  function eggDot() { st(); return S.inc.some((o, i) => o && incReady(i)) || (S.inc.some(o => !o) && bagN() > 0) }
  return { PETS, BY, GN, room, bagN, EGG_CAP, eggCard, apply, b, dr, revive, update, addDraw, drawFx, onKill, egg, rollBox, hatch, card, panel: panelHTML, act, admin, give, url, eggURL, eggDot, img, get F() { return F } };
})();
calc();
