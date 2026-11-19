/* 탈것: Lv.10에 기본 조랑말 지급 + 버튼(임무 카드 아래) 열림.
   타는 동안 공격·스킬·보조무기 멈춤, 이동만. 맞아도 안 내림. 장애물 통과 없음.
   그림: assets/mount_<키>.webp (오른쪽 보는 옆모습, 등에 안장). 없으면 임시 그림. */
window.MOUNT = (() => {
  // 키, 이름, 등급, 색, 이동속도+, 효과
  // 키, 이름, 등급, 색, 이동속도(고정), 효과, 등급 안 확률 가중치(빠를수록 드묾)
  const L = [
    ['donkey', '꼬마 당나귀', 0, '#9a9088', 230, 'dust', 35], ['sheep', '복슬 양', 0, '#f2ece0', 235, 'dust', 35], ['boar', '아기 멧돼지', 0, '#9a6a5a', 240, 'dust', 30],
    ['goat', '뿔 산양', 0, '#d8cbb0', 245, 'dust', 28], ['pony', '갈색 조랑말', 0, '#a8744a', 250, 'dust', 25], ['shiba', '큰 시바견', 0, '#e8a050', 260, 'dust', 18], ['ostrich', '달리기 타조', 0, '#6a5a6a', 270, 'dust', 12],
    ['tortoise', '거대 거북', 1, '#6aa860', 280, 'leaf', 30], ['bear', '갈색 곰', 1, '#8a5a3a', 285, 'dust2', 28], ['wolf', '초원 늑대', 1, '#9aa4b0', 295, 'dust2', 24],
    ['elk', '숲 사슴', 1, '#b07a4a', 300, 'leaf', 22], ['zebra', '얼룩말', 1, '#e8e8e8', 310, 'dust2', 16], ['panther', '검은 표범', 1, '#3a3a4a', 315, 'dust2', 13], ['raptor', '초록 랩터', 1, '#5ab45a', 320, 'leaf', 10],
    ['rhino', '철갑 코뿔소', 2, '#8a8a9a', 330, 'sand', 28], ['mammoth', '아기 매머드', 2, '#a07050', 335, 'frost', 26], ['camel', '사막 낙타', 2, '#d8b070', 340, 'sand', 24],
    ['bigfrog', '왕개구리', 2, '#4ac860', 345, 'water', 20], ['whitehorse', '백마', 2, '#f4f0ea', 350, 'shine', 18], ['saber', '검치호', 2, '#e8a040', 360, 'sand', 13], ['goldstag', '황금뿔 수사슴', 2, '#c8963a', 365, 'gold', 10],
    ['crystalbear', '수정 곰', 3, '#9ad0ff', 400, 'frost', 28], ['frostwolf', '서리 늑대', 3, '#d8f0ff', 405, 'frost', 25], ['reindeer', '얼음 순록', 3, '#8fd8ff', 410, 'frost', 22],
    ['lion', '화염 사자', 3, '#ff8a3a', 410, 'fire', 22], ['nightmare', '그림자 말', 3, '#5a3a8a', 420, 'shadow', 16], ['lavadrake', '용암 도마뱀', 3, '#ff5a2a', 425, 'fire', 12], ['pegasus', '페가수스', 3, '#ffffff', 430, 'feather', 9],
    ['whitetiger', '백호왕', 4, '#f4f4ff', 480, 'storm', 25], ['stardeer', '별빛 사슴', 4, '#a8b8ff', 485, 'star', 22], ['kirin', '번개 기린', 4, '#4ad8c8', 490, 'storm', 20],
    ['phoenixsteed', '불사조 말', 4, '#ff7a2a', 495, 'fire', 15], ['griffin', '황금 그리핀', 4, '#ffc83c', 500, 'gfeather', 12], ['seraph', '천상의 천마', 4, '#fff6d8', 510, 'gfeather', 8], ['dragon', '붉은 용', 4, '#e83a3a', 520, 'fire', 6],
  ];

  const MS = L.map(([k, n, g, c, sp, fx, w]) => ({ k, n, g, c, sp, fx, w }));
  const BY = Object.fromEntries(MS.map(m => [m.k, m]));
  const GN = ['일반', '희귀', '레어', '에픽', '전설'], GC = ['#c3cad6', '#6fe04f', '#5ab4ff', '#c97bff', '#ffc93c'];
  const MAXST = 5, DUPGEM = [5, 10, 20, 40, 100], UNLOCK = 10;
  function st() { S.mounts = S.mounts || {}; if (S.lv >= UNLOCK && !S.mGot && !Object.keys(S.mounts).length) { S.mounts.donkey = { st: 1 }; if (!S.mount) S.mount = 'donkey'; { S.mGot = 1; setTimeout(() => toast('🐴 탈것이 열렸어요! 임무 아래 버튼으로 타고 내려요'), 400) } } return S.mounts }
  const own = k => st()[k];
  const cur = () => { const k = S.mount; return k && own(k) && BY[k] ? BY[k] : null };
  const riding = () => !!(S.riding && cur() && !combatArena);
  const spd = m => Math.round(m.sp * (1 + .04 * (((own(m.k) || {}).st || 1) - 1)));
  function apply(ST) { RAW = ST.spd; if (riding()) ST.spd = spd(cur()) }
  let RAW = 190;
  function give(k) { const o = own(k); if (!o) { st()[k] = { st: 1 }; if (!S.mount) S.mount = k; return { nw: 1 } } if (o.st < MAXST) { o.st++; return { up: o.st } } const gm = DUPGEM[BY[k].g]; S.gem += gm; return { gem: gm } }
  function rollOf(g) { const pool = MS.filter(m => m.g === g); let r = Math.random() * pool.reduce((a, m) => a + m.w, 0), m = pool[0]; for (const q of pool) { if ((r -= q.w) <= 0) { m = q; break } } return { m, g, ...give(m.k) } }
  function pickGrade(odds) { let r = Math.random() * odds.reduce((a, v) => a + v, 0), g = 0; while (g < 4 && r >= odds[g]) { r -= odds[g]; g++ } return g }
  function rollBox() { const bx = BOX.mount; S.pity = S.pity || {}; let g = pickGrade(bx.odds);
    for (const [pg, pn] of bx.pity) { const key = 'mount_' + pg; S.pity[key] = (S.pity[key] || 0) + 1; if (g < pg && S.pity[key] >= pn) g = pg }
    for (const [pg] of bx.pity) if (g >= pg) S.pity['mount_' + pg] = 0; return rollOf(g) }
  function toggle() { st(); if (S.lv < UNLOCK) return toast('Lv.' + UNLOCK + '부터 탈 수 있어요'); if (!cur()) return toast('탈것이 없어요'); if (combatArena) return;
    S.riding = !S.riding; F.t = 0; calc(); save(); poof(); window.SFX && SFX.play(S.riding ? 'recall' : 'close', { v: .45 }); btn() }
  // ---------- 그리기 (부품: 몸통 + 다리 4개 + 날개) ----------
  // 그림 부품: mount_<키>_body(다리 없는 몸·머리·꼬리·안장, 오른쪽 보기), mount_<키>_leg(다리 1개, 위=몸에 붙는 쪽), 날개 달린 건 mount_<키>_wing(위=어깨)
  // RIG: 다리 붙는 위치(몸통 그림 비율 x,y), 다리 길이(몸 폭 비율), 안장(비율), 걸음 폭, 날개
  const RIG = {
    pony: { fl: [.66, .86], bl: [.27, .80], leg: .38, seat: [0.48, 0.54], amp: .55 },
    boar: { fl: [.66, .82], bl: [.26, .86], leg: .28, seat: [0.37, 0.39], amp: .6 },
    wolf: { fl: [.66, .80], bl: [.25, .82], leg: .38, seat: [0.41, 0.45], amp: .65 },
    tortoise: { fl: [.68, .84], bl: [.26, .82], leg: .24, seat: [0.48, 0.13], amp: .3, slow: 1 },
    camel: { fl: [.64, .84], bl: [.26, .84], leg: .46, seat: [0.47, 0.35], amp: .5 },
    whitehorse: { fl: [.64, .84], bl: [.26, .82], leg: .40, seat: [0.47, 0.47], amp: .6 },
    reindeer: { fl: [.64, .86], bl: [.25, .86], leg: .40, seat: [0.46, 0.57], amp: .6 },
    lion: { fl: [.66, .86], bl: [.25, .86], leg: .34, seat: [0.47, 0.55], amp: .65 },
    griffin: { fl: [.66, .84], bl: [.27, .84], leg: .30, seat: [0.47, 0.49], fly: 1, wing: [.40, .40], wl: 1.05 },
    kirin: { fl: [.64, .86], bl: [.25, .86], leg: .44, seat: [0.46, 0.60], amp: .55 },
    crystalbear: { fl: [.64, .86], bl: [.30, .86], leg: .30, seat: [0.46, 0.37], amp: .55 },
    frostwolf: { fl: [.64, .86], bl: [.30, .86], leg: .36, seat: [0.46, 0.44], amp: .65 },
    nightmare: { fl: [.64, .86], bl: [.30, .86], leg: .38, seat: [0.48, 0.48], amp: .6 },
    lavadrake: { fl: [.64, .86], bl: [.30, .86], leg: .28, seat: [0.46, 0.32], amp: .6 },
    pegasus: { fl: [.64, .86], bl: [.30, .86], leg: .38, seat: [0.48, 0.47], amp: .6, fly: 1, wing: [.40, .36], wl: 1.0 },
    donkey: { fl: [.64, .86], bl: [.30, .86], leg: 0.36, seat: [0.47, 0.52], amp: .6 },
    sheep: { fl: [.64, .86], bl: [.30, .86], leg: 0.28, seat: [0.43, 0.46], amp: .6 },
    goat: { fl: [.64, .86], bl: [.30, .86], leg: 0.36, seat: [0.45, 0.53], amp: .6 },
    shiba: { fl: [.64, .86], bl: [.30, .86], leg: 0.3, seat: [0.47, 0.50], amp: .6 },
    ostrich: { fl: [.50, .84], bl: [.40, .84], leg: 0.52, seat: [0.47, 0.49], amp: .6, biped: 1, amp: .75 },
    bear: { fl: [.64, .86], bl: [.30, .86], leg: 0.3, seat: [0.44, 0.31], amp: .6 },
    elk: { fl: [.64, .86], bl: [.30, .86], leg: 0.4, seat: [0.42, 0.54], amp: .6 },
    zebra: { fl: [.64, .86], bl: [.30, .86], leg: 0.38, seat: [0.46, 0.47], amp: .6 },
    panther: { fl: [.64, .86], bl: [.30, .86], leg: 0.32, seat: [0.46, 0.30], amp: .6 },
    raptor: { fl: [.50, .84], bl: [.40, .84], leg: 0.42, seat: [0.47, 0.38], amp: .6, biped: 1, amp: .75 },
    rhino: { fl: [.64, .86], bl: [.30, .86], leg: 0.3, seat: [0.41, 0.44], amp: .6 },
    mammoth: { fl: [.64, .86], bl: [.30, .86], leg: 0.32, seat: [0.36, 0.37], amp: .6, amp: .4 },
    bigfrog: { fl: [.64, .86], bl: [.30, .86], leg: 0.26, seat: [0.45, 0.46], amp: .6, amp: .45 },
    saber: { fl: [.64, .86], bl: [.30, .86], leg: 0.32, seat: [0.43, 0.38], amp: .6 },
    goldstag: { fl: [.64, .86], bl: [.30, .86], leg: 0.4, seat: [0.43, 0.55], amp: .6 },
    whitetiger: { fl: [.64, .86], bl: [.30, .86], leg: 0.32, seat: [0.47, 0.49], amp: .6 },
    stardeer: { fl: [.64, .86], bl: [.30, .86], leg: 0.4, seat: [0.43, 0.53], amp: .6 },
    phoenixsteed: { fl: [.64, .86], bl: [.30, .86], leg: 0.38, seat: [0.47, 0.46], amp: .6 },
    seraph: { fl: [.64, .86], bl: [.30, .86], leg: 0.34, seat: [0.48, 0.46], amp: .6, fly: 1, wing: [.40, .36], wl: 1.0 },
    dragon: { fl: [.64, .86], bl: [.30, .86], leg: 0.3, seat: [0.45, 0.50], amp: .6, fly: 1, wing: [.42, .36], wl: 1.15 },
  };
  const QUAD = { fl: [.66, .84], bl: [.26, .84], leg: .36, seat: [.40, .45], amp: .6 };
  for (const m of MS) if (!RIG[m.k]) RIG[m.k] = Object.assign({}, QUAD, { ostrich: { fl: [.48, .84], bl: [.40, .84], leg: .55, seat: [.40, .40], amp: .7, biped: 1 }, raptor: { fl: [.50, .84], bl: [.38, .84], leg: .42, seat: [.40, .40], amp: .7, biped: 1 }, sheep: { leg: .26 }, mammoth: { leg: .32, amp: .4 }, bigfrog: { leg: .26, amp: .45 }, bear: { leg: .30 }, rhino: { leg: .30 }, crystalbear: { leg: .30 },
    pegasus: { fly: 1, wing: [.40, .40], wl: 1 }, seraph: { fly: 1, wing: [.40, .40], wl: 1.05 }, dragon: { fly: 1, wing: [.42, .38], wl: 1.15, leg: .30 } }[m.k] || {});

  const PH = {};
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (k < 0 ? v * k : (255 - v) * k)))); return 'rgb(' + f(n >> 16) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')' }
  function phBody(k) { const key = k + ':b'; if (PH[key]) return PH[key]; const m = BY[k], c = document.createElement('canvas'); c.width = 200; c.height = 120; const g = c.getContext('2d');
    g.lineWidth = 5; g.strokeStyle = 'rgba(30,22,46,.8)'; g.lineJoin = 'round';
    const gr = g.createLinearGradient(0, 20, 0, 110); gr.addColorStop(0, shade(m.c, .3)); gr.addColorStop(1, shade(m.c, -.25)); g.fillStyle = gr;
    g.beginPath(); g.moveTo(34, 60); g.quadraticCurveTo(10, 50, 14, 74); g.stroke(); // 꼬리
    g.beginPath(); g.ellipse(98, 72, 66, 32, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(140, 66); g.quadraticCurveTo(150, 26, 166, 22); g.lineTo(186, 40); g.quadraticCurveTo(170, 56, 160, 80); g.closePath(); g.fill(); g.stroke(); // 목·머리
    g.fillStyle = '#1c1830'; g.beginPath(); g.arc(174, 32, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9a3a2a'; g.beginPath(); g.ellipse(96, 46, 26, 10, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#d8a040'; g.fillRect(92, 50, 8, 18);
    PH[key] = c; return c }
  function phLeg(k) { const key = k + ':l'; if (PH[key]) return PH[key]; const m = BY[k], c = document.createElement('canvas'); c.width = 30; c.height = 70; const g = c.getContext('2d');
    g.lineWidth = 4; g.strokeStyle = 'rgba(30,22,46,.8)'; g.fillStyle = shade(m.c, -.12); g.beginPath(); g.roundRect(6, 2, 18, 60, 8); g.fill(); g.stroke(); g.fillStyle = '#3a2a2a'; g.beginPath(); g.roundRect(4, 52, 22, 14, 5); g.fill(); g.stroke();
    PH[key] = c; return c }
  function phWing(k) { const key = k + ':w'; if (PH[key]) return PH[key]; const m = BY[k], c = document.createElement('canvas'); c.width = 120; c.height = 80; const g = c.getContext('2d');
    g.lineWidth = 4; g.strokeStyle = 'rgba(30,22,46,.8)'; g.fillStyle = shade(m.c, .35); g.beginPath(); g.moveTo(10, 70); g.quadraticCurveTo(20, 10, 112, 6); g.quadraticCurveTo(90, 30, 100, 40); g.quadraticCurveTo(70, 50, 76, 62); g.quadraticCurveTo(40, 64, 10, 70); g.fill(); g.stroke();
    PH[key] = c; return c }
  function phCard(k) { const key = k + ':c' + (AI('mount_' + k + '_body') ? 1 : 0); if (PH[key]) return PH[key]; const c = document.createElement('canvas'); c.width = 220; c.height = 220; const g = c.getContext('2d'); const b = part(k, 'body'), l = part(k, 'leg'), r = RIG[k], w = 190, h = w * b.height / b.width, x0 = 15, y0 = r.fly ? 90 : 40;
    { const lh = w * r.leg, lw = lh * l.width / l.height; for (const a of [r.bl, r.fl]) for (const o of [-5, 5]) g.drawImage(l, x0 + a[0] * w - lw / 2 + o, y0 + a[1] * h - 6, lw, lh) }
    g.drawImage(b, x0, y0, w, h); if (r.wing) { const wi = part(k, 'wing'), ww = w * r.wl * .8, wh = ww * wi.height / wi.width; g.save(); g.translate(x0 + r.wing[0] * w, y0 + r.wing[1] * h); g.scale(-1, 1); g.drawImage(wi, -ww * .06, -wh * .92, ww, wh); g.restore() }
    PH[key] = c; c.url = c.toDataURL(); return c }
  const part = (k, p) => AI('mount_' + k + '_' + p) || (p === 'body' ? phBody(k) : p === 'leg' ? phLeg(k) : phWing(k));
  const url = k => AURL['mount_' + k] || AURL['mount_' + k + '_card'] || phCard(k).url;
  const W = 108; // 화면상 몸통 폭
  const FXC = { dust: '#d9c9a8', dust2: '#cfd6dc', leaf: '#8be05a', sand: '#f0d090', shine: '#ffffff', frost: '#bfeaff', fire: '#ffb04a', gold: '#ffe066', storm: '#9ff6ff', shadow: '#b07aff', feather: '#ffffff', gfeather: '#ffd23c', star: '#c8d4ff', water: '#8fe0ff' };
  const F = { t: 0, ghosts: [], parts: [], gT: 0, ph: 0 };
  const RPH = new WeakMap();
  function poof() { for (let i = 0; i < 14; i++) { const a = rnd(0, TAU), s = rnd(40, 110); F.parts.push({ x: P.x, y: P.y - 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .6 - 20, l: .5, c: '#fff', r: rnd(4, 8) }) } }
  // 몸 전체를 그리고 안장 위치(화면 좌표)를 돌려줌
  function drawMount(m, x, y, face, mv, ph, alpha) {
    const r = RIG[m.k], body = part(m.k, 'body'), leg = part(m.k, 'leg'), h = W * body.height / body.width;
    const amp = mv ? r.amp : 0, bob = r.fly ? 26 + Math.sin(T * (mv ? 7 : 3)) * 5 : mv ? Math.abs(Math.sin(ph)) * (r.slow ? 1.5 : 4) : Math.sin(T * 2.2) * 1.2;
    const legLen = W * r.leg, legW = legLen * leg.width / leg.height, top = y - legLen - h * (1 - r.fl[1]) - bob + 4;
    const pitch = r.fly ? (mv ? -.06 : 0) + Math.sin(T * 3) * .03 : mv ? Math.sin(ph * 2) * .025 : 0;
    ctx.save(); if (alpha != null) ctx.globalAlpha *= alpha; ctx.translate(x, top + h * .6); ctx.scale(face, 1); ctx.rotate(pitch); ctx.translate(-W / 2, -h * .6);
    const L = (a, phase, far) => { const ax = a[0] * W, ay = a[1] * h, ang = r.fly ? (mv ? -.55 : -.12) + Math.sin(T * 3 + phase) * .12 * (a === r.fl ? 1 : -1) : amp * Math.sin(ph + phase); ctx.save(); ctx.translate(ax + (far ? -3 : 3), ay - 2); ctx.rotate(-ang); if (far) ctx.filter = 'brightness(.72)'; ctx.drawImage(leg, -legW / 2, 0, legW, legLen); ctx.restore() };
    const flap = mv ? Math.sin(T * 13) : Math.sin(T * 4) * .5;
    const Wg = (far) => { if (!r.wing) return; const wi = part(m.k, 'wing'), ww = W * r.wl, wh = ww * wi.height / wi.width; ctx.save(); ctx.translate(r.wing[0] * W + (far ? 8 : 0), r.wing[1] * h); ctx.scale(-1, 1); ctx.rotate(-.1 - flap * .6 + (far ? -.15 : 0)); if (far) ctx.filter = 'brightness(.7)'; ctx.drawImage(wi, -ww * .06, -wh * .92, ww, wh); ctx.restore() };
    // 대각선 다리끼리 같이 움직이는 걸음(앞-먼쪽 & 뒤-가까운쪽)
    Wg(true); if (!r.biped) { L(r.fl, Math.PI, true); L(r.bl, 0, true) }
    ctx.drawImage(body, 0, 0, W, h);
    L(r.fl, 0, false); L(r.bl, Math.PI, false); Wg(false);
    ctx.restore();
    const ox = (r.seat[0] - .5) * W, oy = (r.seat[1] - .6) * h;
    const c = Math.cos(pitch), sn = Math.sin(pitch);
    return { sx: x + face * (ox * c - oy * sn), sy: top + h * .6 + ox * sn + oy * c, pitch };
  }
  // Draw the far side before the mount and the near side after the rider.
  function aura(m, x, y, front, moving) {
    if (m.g < 3) return;
    const rig = RIG[m.k], color = FXC[m.fx] || '#bfe8ff';
    const sprite = AI('mfx_' + m.fx);
    const lift = rig.fly ? 26 + Math.sin(T * (moving ? 7 : 3)) * 5 : 0;
    const cy = y - 19 - lift, rx = rig.wing ? 74 : 61, ry = 16;
    const clock = T * 2.35;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < (m.g === 4 ? 4 : 3); i++) {
      const angle = clock + i * TAU / (m.g === 4 ? 4 : 3);
      const phase = ((angle % TAU) + TAU) % TAU;
      const min = front ? 0 : Math.PI, max = front ? Math.PI : TAU;
      const end = Math.min(phase, max), start = Math.max(phase - .48, min);
      if (end > start) {
        ctx.globalAlpha = front ? .48 : .29;
        ctx.strokeStyle = color;
        ctx.lineWidth = front ? 2.8 : 1.9;
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, start, end);
        ctx.stroke();
      }
      if ((Math.sin(angle) >= 0) !== front) continue;
      const ox = x + Math.cos(angle) * rx;
      const oy = cy + Math.sin(angle) * ry - 4 - Math.sin(angle * 2 + i) * 4;
      const size = front ? 15 : 12;
      ctx.globalAlpha = front ? .87 : .64;
      if (sprite) ctx.drawImage(sprite, ox - size / 2, oy - size / 2, size, size);
      else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ox, oy, front ? 2.7 : 2, 0, TAU); ctx.fill() }
    }
    ctx.restore();
  }
  function riderDraw(orig, rem) {
    if (typeof PV !== 'undefined' && PV) return orig(); const k = rem ? rem.mt : (riding() ? S.mount : null), m = k && BY[k]; if (!m || P.dead) return orig();
    const face = Math.cos(P.dir) >= 0 ? 1 : -1, mv = P.moving;
    let ph; if (rem) { const o = RPH.get(rem) || { ph: 0, t: T }; o.ph += (T - o.t) * (mv ? 11 : 0); o.t = T; RPH.set(rem, o); ph = o.ph } else ph = F.ph;
    if (!rem) for (const g of F.ghosts) drawMount(m, g.x, g.y, g.f, true, g.ph, g.l * .35);
    shadow(P.x, P.y + 1, RIG[m.k].fly ? 26 : 38); aura(m, P.x, P.y, false, mv);
    const s0 = drawMount(m, P.x, P.y, face, mv, ph);
    const y0 = P.y, x0 = P.x, w0 = P.walk, m0 = P.moving, sitting = P.sit, sway = P.sitK, pitch = P.sitPitch;
    P.x = s0.sx; P.y = s0.sy; P.moving = false; P.walk = 0; P.sit = true;
    P.sitK = mv ? Math.sin(ph) * .08 : 0; P.sitPitch = s0.pitch;
    try { orig() } finally {
      P.x = x0; P.y = y0; P.walk = w0; P.moving = m0;
      P.sit = sitting; P.sitK = sway; P.sitPitch = pitch;
    }
    aura(m, x0, y0, true, mv);
  }
  function trail(dt) {
    const m = cur(); if (!riding() || !m) { F.ghosts.length = 0; return }
    if (P.moving) {
      F.gT -= dt;
      if (m.g >= 4 && F.gT <= 0) { F.gT = .13; F.ghosts.push({ x: P.x, y: P.y, f: Math.cos(P.dir) >= 0 ? 1 : -1, ph: F.ph, l: 1 }) }
      const n = dt * [10, 14, 18, 24, 30][m.g], col = FXC[m.fx] || '#ffffff';
      if (Math.random() < n) F.parts.push({ x: P.x - Math.cos(P.dir) * 26 + rnd(-10, 10), y: P.y + rnd(-4, 4), vx: -Math.cos(P.dir) * rnd(20, 60), vy: rnd(-30, -6), l: rnd(.35, .6), c: col, r: m.g >= 2 ? rnd(2.5, 4.5) : rnd(4, 7), glow: m.g >= 2, fx: m.fx, spin: rnd(-4, 4) })
    }
    for (let i = F.ghosts.length - 1; i >= 0; i--) { F.ghosts[i].l -= dt * 4; if (F.ghosts[i].l <= 0) F.ghosts.splice(i, 1) }
  }
  function drawFx() { for (const q of F.parts) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 2)); const own = q.fx && AI('mfx_' + q.fx), im = own || (q.glow && typeof gImg === 'function' ? gImg(AI('mount_spark') ? 'mount_spark' : 'fx_star', q.c) : null); if (own) { const w = q.r * 4.2; ctx.translate(q.x, q.y); ctx.rotate((q.spin || 0) * q.l); ctx.drawImage(own, -w / 2, -w / 2, w, w) } else if (im) { ctx.globalCompositeOperation = 'lighter'; const w = q.r * 5; ctx.translate(q.x, q.y); ctx.rotate(q.l * 4); ctx.drawImage(im, -w / 2, -w / 2, w, w) } else { const dm = AI('mount_dust'); if (dm) { const w = q.r * 4; ctx.globalAlpha *= .8; ctx.drawImage(dm, q.x - w / 2, q.y - w / 2, w, w) } else { ctx.globalAlpha *= .5; ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill() } } ctx.restore() } }
  function update(dt) {
    st(); if (combatArena && S.riding) { S.riding = false; calc() }
    { const m = cur(); if (riding() && P.moving && m) F.ph += dt * (RIG[m.k].slow ? 6 : 11) * Math.min(1.6, ST.spd / 300) }
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
    const mounted = riding();
    bEl.classList.toggle('on', mounted);
    bEl.setAttribute('aria-pressed', String(mounted));
    bEl.setAttribute('aria-label', mounted ? '탈것에서 내리기' : '탈것 타기');
    bEl.innerHTML = '<b class="ts">' + (mounted ? '내리기' : '타기') + '</b>';
  }
  // ---------- 화면 ----------
  let focus = null;
  function stars(n) { let s = ''; for (let i = 0; i < MAXST; i++) s += '<span style="color:' + (i < n ? '#ffd23c' : '#4a4466') + '">★</span>'; return s }
  function panelHTML() {
    st(); const fk = focus && BY[focus] ? focus : (cur() ? S.mount : MS[0].k), m = BY[fk], o = own(fk), on = S.mount === fk;
    let h = '<div class="petTop" style="border-color:' + GC[m.g] + '"><div class="petPic ' + (o ? '' : 'lock') + '" style="background:radial-gradient(circle at 50% 60%,' + GC[m.g] + '55,transparent 70%);width:120px"><img src="' + url(fk) + '" style="width:112px;height:84px" alt=""></div><div class="petInfo"><b style="color:' + GC[m.g] + '">' + GN[m.g] + '</b><h3>' + m.n + '</h3>' +
      (o ? '<div>' + stars(o.st) + '</div>' : '<div style="color:#9a94c0">미보유</div>') + '<div class="petAb">탈 때 이동 속도 ' + (o ? spd(m) : m.sp) + ' <span style="color:#cfc8ee">(걸을 때 ' + Math.round(RAW) + ')</span></div><div class="petAb2">타는 동안 공격 불가 · 이동만</div></div></div>';
    if (o) h += '<div class="petBtns">' + (on ? '<button class="btn no" disabled>사용 중</button>' : '<button class="btn" data-a="mequip:' + fk + '">이 탈것 쓰기</button>') + '<button class="btn eq" data-a="mride">' + (riding() ? '내리기' : '타기') + '</button></div>';
    h += '<div class="note">같은 탈것이 또 나오면 별 +1 (별마다 이동 속도 +4%, 최대 5성, 이후 보석). 탈것을 타면 내 이동 속도 강화와 상관없이 탈것 속도로 달려요. 얻는 곳: 상점 <b>탈것 상자</b>.</div>';
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
  return { MS, BY, apply, riding, toggle, update, riderDraw, drawFx, rollBox, card, panel: panelHTML, act, admin, url, get key() { return riding() ? S.mount : '' } };
})();
// 그리기 감싸기: 탄 상태면 탈것 위에 캐릭터를 올려 그림(내 캐릭터·다른 유저 모두)
if (typeof drawPlayer === 'function') { const _dp = drawPlayer; drawPlayer = function () { return MOUNT.riderDraw(_dp, window.REM) } }
calc();
