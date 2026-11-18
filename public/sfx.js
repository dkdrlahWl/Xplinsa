/* 효과음·배경 소리: 실제 녹음 소리(Kenney·Ninja Adventure, CC0)만 사용. 전자음 없음
   SFX.play(이름, {v:볼륨, x,y:위치}) · 지역마다 배경 소리(바람·물·불 등) 자동 전환 */
window.SFX = (() => {
  const LIST = {
    // 휘두르기
    sw_light: ['woosh1', 'woosh2'], sw_heavy: ['woosh5', 'woosh6'], sw_blade: ['woosh2', 'woosh3'],
    sw_knife: ['woosh1', 'woosh3'], sw_bow: ['woosh3'], sw_gun: ['soft_m1'], sw_staff: ['woosh4'],
    // 맞히기
    hit: ['soft_m0', 'soft_m1', 'soft_m2', 'soft_m3'], hit_crit: ['soft_h0', 'soft_h1', 'soft_h2'], hit_blunt: ['soft_h1', 'soft_h3'],
    hit_metal: ['soft_m0', 'soft_m2'], hit_arrow: ['soft_m1', 'soft_m3'], hit_boss: ['soft_h0', 'soft_h2'],
    kill: ['cloth1', 'cloth2'], kill_boss: ['boom2'],
    // 플레이어
    hurt: ['soft_m0', 'soft_m1', 'soft_m2'], die: ['wood_h3', 'cloth1'], step_grass: ['st_grass0', 'st_grass1', 'st_grass2', 'st_grass3'], step_sand: ['st_conc0', 'st_conc1', 'st_conc2'],
    step_snow: ['st_snow0', 'st_snow1', 'st_snow2', 'st_snow3'], step_wood: ['st_wood0', 'st_wood1', 'st_wood2', 'st_wood3'], step_stone: ['st_conc3', 'st_conc4', 'st_conc0'],
    // 줍기·재화
    coin: ['coin1', 'coin2'], gem: ['glass_l0', 'glass_l1', 'glass_l2'], cry: ['glass_m0', 'glass_m1'], orb: ['bell0'], deposit: ['chips1', 'chips2', 'chips3'],
    // 성장·UI
    levelup: ['jingle_lv'], upgrade: ['metal_l0', 'metal_l1', 'metal_l2'], anvil: ['anvil0', 'anvil1', 'anvil2'], merge: ['bell1'], fanfare: ['jingle_big'],
    chest: ['chest_open'], reward: ['coins_bag'], open: ['book_flip1', 'book_flip2'], close: ['book_close'], click: ['click_soft'], error: ['cloth2'],
    // 보스 패턴·스킬
    slam: ['rock1', 'rock2'], warn: ['drag1', 'drag2'], skill: ['fireball1', 'fireball2'], explode: ['boom1', 'boom2', 'boom3'], recall: ['woosh4'],
  };
  const AMB = { field: null, desert: 'amb_wind', forest: 'amb_river', snow: 'amb_wind2', ruins: 'amb_river', volcano: 'amb_fire', camp: null, sea: 'amb_wavefar', swamp: 'amb_river', sky: 'amb_wind2', castle: 'amb_wind', raid: 'amb_wind' };
  const KEY = 'xp_sound';
  let ctx = null, master = null, sfxGain = null, ambGain = null, on = { sfx: true, amb: true }, buf = {}, loading = {}, last = {}, live = 0;
  try { Object.assign(on, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  let amb = { name: null, src: null, g: null };
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = on.sfx ? .7 : 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = .5; sfxGain.connect(lp); lp.connect(master);
    ambGain = ctx.createGain(); ambGain.gain.value = on.amb ? .3 : 0; ambGain.connect(master);
    for (const k of ['coin', 'hit', 'sw_light', 'sw_blade', 'kill', 'click_soft', 'open']) (LIST[k] || [k]).forEach(load);
  }
  function load(n) {
    if (buf[n] || loading[n] || !ctx) return loading[n];
    return loading[n] = fetch('assets/sfx/' + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(a => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then(b => { buf[n] = b; return b; }).catch(() => null);
  }
  // 화면 밖·먼 소리는 작게, 같은 소리가 너무 자주 겹치지 않게
  function play(name, o = {}) {
    // 소리 장치가 멈춰 있으면(폰 화면 꺼짐·탭 전환·첫 터치 전) 요청을 쌓지 말고 버림 → 나중에 한꺼번에 터지는 일 방지
    if (!ctx || !on.sfx || document.hidden || ctx.state !== 'running') return;
    const now = ctx.currentTime, gap = o.gap ?? (name.startsWith('hit') ? .11 : name.startsWith('sw_') ? .13 : name === 'coin' ? .07 : name === 'explode' || name === 'skill' ? .6 : .06);
    if (last[name] && now - last[name] < gap) return; last[name] = now;
    if (live > 8) return;
    let v = o.v ?? 1;
    if (o.x !== undefined && window.P) { const d = Math.hypot(o.x - P.x, o.y - P.y); if (d > 520) return; v *= Math.max(.1, 1 - d / 520); }
    const arr = LIST[name] || [name], n = arr[Math.floor(Math.random() * arr.length)], b = buf[n];
    if (!b) { load(n); return; }
    const s = ctx.createBufferSource(), g = ctx.createGain();
    if (o.x !== undefined && window.P && Math.hypot(o.x - P.x, o.y - P.y) > 900) return;
    s.buffer = b; s.playbackRate.value = (o.rate || 1) * (o.fixed ? 1 : .94 + Math.random() * .12);
    g.gain.value = v; s.connect(g);
    if (o.x !== undefined && ctx.createStereoPanner && window.P) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-.7, Math.min(.7, (o.x - P.x) / 600)); g.connect(p); p.connect(sfxGain); } else g.connect(sfxGain);
    live++; s.onended = () => live--; s.start();
  }
  // 배경 소리: 지역이 바뀌면 2초에 걸쳐 바꿈
  function ambience(kind) {
    const n = AMB[kind] || null; if (!ctx || n === amb.name) return;
    const old = amb; amb = { name: n, src: null, g: null };
    if (old.g) { old.g.gain.setTargetAtTime(0, ctx.currentTime, .6); setTimeout(() => { try { old.src.stop(); } catch (e) {} }, 3000); }
    if (!n) return;
    Promise.resolve(buf[n] || load(n)).then(b => {
      if (!b || amb.name !== n) return;
      const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(ambGain);
      s.start(0, Math.random() * Math.max(0, b.duration - 1)); g.gain.setTargetAtTime(1, ctx.currentTime, .8); amb.src = s; amb.g = g;
    });
  }
  function set(k, v) { on[k] = v; try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) {} if (ctx) { sfxGain.gain.value = on.sfx ? .7 : 0; ambGain.gain.value = on.amb ? .3 : 0; } }
  for (const ev of ['pointerdown', 'touchstart', 'keydown']) addEventListener(ev, init, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  return { play, ambience, set, get on() { return on; }, init };
})();
