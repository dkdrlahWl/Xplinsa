window.SFX = (() => {
  const LIST = {
    // 휘두르기
    sw_light: ['woosh1', 'woosh2'], sw_heavy: ['woosh5', 'woosh6'], sw_blade: ['woosh2', 'woosh3'],
    sw_knife: ['woosh1', 'woosh3'], sw_bow: ['woosh3'], sw_gun: ['soft_m1'], sw_staff: ['woosh4'],
    // 맞히기
    hit: ['soft_m0', 'soft_m1', 'soft_m2', 'soft_m3'], hit_crit: ['soft_h0', 'soft_h1', 'soft_h2'], hit_blunt: ['soft_h1', 'soft_h3'],
    hit_metal: ['soft_m0', 'soft_m2'], hit_arrow: ['soft_m1', 'soft_m3'], hit_boss: ['soft_h0', 'soft_h2'],
    kill: ['cloth1', 'cloth2'], kill_boss: ['rock2'],
    // 플레이어
    hurt: ['soft_m0', 'soft_m1', 'soft_m2'], die: ['wood_h3', 'cloth1'], step_grass: ['st_grass0', 'st_grass1', 'st_grass2', 'st_grass3'], step_sand: ['st_conc0', 'st_conc1', 'st_conc2'],
    step_snow: ['st_snow0', 'st_snow1', 'st_snow2', 'st_snow3'], step_wood: ['st_wood0', 'st_wood1', 'st_wood2', 'st_wood3'], step_stone: ['st_conc3', 'st_conc4', 'st_conc0'],
    // 줍기·재화
    coin: ['coin1', 'coin2'], gem: ['glass_l0', 'glass_l1', 'glass_l2'], cry: ['glass_m0', 'glass_m1'], orb: ['bell0'], deposit: ['chips1', 'chips2', 'chips3'],
    // 성장·UI
    levelup: ['jingle_lv'], upgrade: ['metal_l0', 'metal_l1', 'metal_l2'], anvil: ['anvil0', 'anvil1', 'anvil2'], merge: ['bell1'], fanfare: ['jingle_big'],
    chest: ['chest_open'], reward: ['coins_bag'], open: ['book_flip1', 'book_flip2'], close: ['book_close'], click: ['click_soft'], error: ['cloth2'],
    // 보스 패턴·스킬
    slam: ['rock1', 'rock2'], warn: ['drag1', 'drag2'], skill: ['woosh4'], explode: ['rhero_staff_hit', 'rock2'], recall: ['woosh4'],
  };
  const CAMP = new Set(['camp']);
  const KEY = 'xp_sound';
  let ctx = null, sfxGain = null, ambGain = null;
  const on = { sfx: true, amb: true }, buf = {}, loading = {}, last = {}, groups = {}, live = new Set();
  try { Object.assign(on, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  let amb = null;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); const master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = on.sfx ? .7 : 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = .5; sfxGain.connect(lp); lp.connect(master);
    ambGain = ctx.createGain(); ambGain.gain.value = on.amb ? .45 : 0; ambGain.connect(master);
    for (const k of ['coin','hit','click','open']) LIST[k].forEach(load);
    const key = typeof wType === 'function' && weaponSound[wType()];
    if (key) for (const phase of ['air','hit']) load('rhero_' + key + '_' + phase);
  }
  function load(n) {
    if (buf[n] || !ctx) return Promise.resolve(buf[n]);
    if (loading[n]) return loading[n];
    return loading[n] = fetch('assets/sfx/' + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(a => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no))).then(b => { buf[n] = b; return b; }).catch(() => null).finally(() => { delete loading[n]; });
  }
  const weaponSound = { dagger:'knife', sword:'blade', mace:'mace', spear:'spear', axe:'axe', bow:'bow', gun:'gun', staff:'staff' };
  function weapon(type, impact, options) {
    const key = weaponSound[type];
    if (key) play('rhero_' + key + (impact ? '_hit' : '_air'), options);
  }
  function play(name, o = {}) {
    if (!ctx || !on.sfx || document.hidden || ctx.state !== 'running' || live.size >= 5) return;
    const camera = typeof P !== 'undefined' ? P : null;
    const located = camera && Number.isFinite(o.x) && Number.isFinite(o.y);
    const distance = located ? Math.hypot(o.x - camera.x, o.y - camera.y) : 0;
    if (distance > 380) return;
    const group = /_hit$|^hit/.test(name) ? 'impact' : /_air$|^sw_/.test(name) ? 'swing' : null;
    const now = ctx.currentTime;
    const gap = o.gap ?? (group === 'impact' ? .13 : name === 'coin' ? .09 : .12);
    if (now - (last[name] ?? -Infinity) < gap || (group && now - (groups[group] ?? -Infinity) < (group === 'impact' ? .11 : .14))) return;
    const arr = LIST[name] || [name], n = arr[Math.floor(Math.random() * arr.length)], b = buf[n];
    if (!b) { load(n); return; }
    last[name] = now;
    if (group) groups[group] = now;
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = b;
    src.playbackRate.value = (o.rate || 1) * (o.fixed ? 1 : .97 + Math.random() * .06);
    const level = (o.v ?? 1) * Math.max(0, 1 - distance / 380);
    gain.gain.setValueAtTime(level, now);
    const end = Math.min(b.duration / src.playbackRate.value, group ? .38 : name === 'fanfare' || name === 'levelup' ? 1 : .55);
    gain.gain.setValueAtTime(level, now + Math.max(0, end - .035));
    gain.gain.linearRampToValueAtTime(0, now + end);
    src.connect(gain); gain.connect(sfxGain);
    live.add(src);
    src.onended = () => { live.delete(src); src.disconnect(); gain.disconnect(); };
    src.start(now); src.stop(now + end);
  }
  function stopEffects() {
    for (const src of live) { try { src.stop(); } catch {} }
    live.clear();
  }
  function stopMusic() {
    const old = amb; amb = null;
    if (!old?.src) return;
    old.src.disconnect();
    try { old.src.stop(); } catch {}
  }
  function ambience(kind) {
    const name = CAMP.has(kind) ? 'music_camp' : 'music_field';
    if (!ctx || !on.amb || document.hidden || ctx.state !== 'running' || name === amb?.name) return;
    stopMusic();
    const entry = {name, src:null}; amb = entry;
    load(name).then(b => {
      if (amb !== entry || !on.amb || document.hidden || ctx.state !== 'running') return;
      if (!b) { amb = null; return; }
      const src = ctx.createBufferSource(), gain = ctx.createGain(), now = ctx.currentTime;
      src.buffer = b; src.loop = true;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(1, now + .3);
      src.connect(gain); gain.connect(ambGain);
      src.onended = () => gain.disconnect();
      entry.src = src; src.start(now);
    });
  }
  function set(k, v) {
    on[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(on)); } catch {}
    if (!ctx) return;
    if (k === 'sfx') { sfxGain.gain.value = v ? .7 : 0; if (!v) stopEffects(); }
    if (k === 'amb') { ambGain.gain.value = v ? .45 : 0; if (!v) stopMusic(); }
  }
  for (const ev of ['pointerdown', 'touchstart', 'keydown']) addEventListener(ev, init, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) { stopEffects(); stopMusic(); ctx.suspend(); } else ctx.resume(); });
  return { play, weapon, ambience, set, get on() { return on; }, init };
})();
