/* 성장 패스 (시즌 1): 5레벨마다 일반 보상 + 프리미엄 보상. 프리미엄은 운영자가 켜 줌(₩1,200) */
(() => {
  const SEASON = 's1', START = Date.parse('2026-11-19T19:00:00+09:00'), END = START + 30 * 864e5, PRICE = '₩1,200';
  const KEYN = { b2: '전문가 상자 열쇠', b3: '전사의 상자 열쇠', pet: '펫 알 상자 열쇠', mount: '탈것 상자 열쇠' };
  const TIERS = [];
  for (let t = 1; t <= 20; t++) {
    const lv = t * 5, G = Math.round(800 * t * t / 100) * 100;
    const free = t % 4 === 1 ? { gem: 50 } : t % 4 === 2 ? { gold: G } : t % 4 === 3 ? { key: ['b2', 1] } : { key: ['b3', 1] };
    let prem = t % 5 === 1 ? { gem: 150 } : t % 5 === 2 ? { key: ['b3', 2] } : t % 5 === 3 ? { orb: 20 + 10 * t } : t % 5 === 4 ? { key: [t % 2 ? 'pet' : 'mount', 1] } : { gem: 300, scr: 50 * t };
    if (t === 20) prem = { gem: 500, myth: 2 };
    TIERS.push({ lv, free, prem });
  }
  let PREM = false, ADMIN_LIST = null;
  function fetchPrem(extra) {
    return fetch('/api/pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ token: localStorage.getItem('xp_token') }, extra || {})) })
      .then(r => r.json()).then(j => { if (j.err) toast(j.err); PREM = !!j.prem; if (j.list) ADMIN_LIST = j.list; if (panel === 'pass') draw() }).catch(() => {});
  }
  fetchPrem(); setInterval(() => fetchPrem(), 120000);
  const st = () => { const p = S.pass && S.pass.s === SEASON ? S.pass : (S.pass = { s: SEASON, f: {}, p: {} }); return p };
  const live = () => Date.now() >= START && Date.now() < END;
  const can = (t, prem) => live() && S.lv >= t.lv && !(prem ? st().p : st().f)[t.lv] && (!prem || PREM);
  const anyReady = () => TIERS.some(t => can(t, false) || can(t, true));

  function claim(t, prem) {
    if (!can(t, prem)) return false;
    const r = prem ? t.prem : t.free, rw = {}; (prem ? st().p : st().f)[t.lv] = Date.now();
    for (const k in r) { if (k === 'key') { S.keys = S.keys || {}; S.keys[r.key[0]] = (S.keys[r.key[0]] || 0) + r.key[1] } else rw[k] = r[k] }
    const msg = Object.keys(rw).length ? give(rw) : ''; return (msg ? msg : '') + (r.key ? (msg ? ', ' : '') + KEYN[r.key[0]] + ' x' + r.key[1] : '');
  }
  function rwHTML(r) {
    const out = [];
    for (const k in r) {
      if (k === 'key') { const b = BOX[r.key[0]], u = b && (AURL[b.img] || AURL[b.fb]); out.push(`<span class="pi">${u ? `<img src="${u}" alt="">` : '🔑'}<i>🔑${r.key[1]}</i></span>`) }
      else out.push(`<span class="pi">${IC[k] || ''}<i>${fmt(r[k])}</i></span>`);
    }
    return out.join('');
  }
  function left() { const ms = Date.now() < START ? START - Date.now() : END - Date.now(); if (ms <= 0) return '시즌 종료'; const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return (Date.now() < START ? '시작까지 ' : '남은 기간 ') + (d ? d + '일 ' : '') + h + '시간 ' + m + '분' }

  const css = document.createElement('style');
  css.textContent = `#passBtn{position:relative;align-self:flex-end;width:67px;height:66px;border:0;padding:0 0 2px;margin-top:2px;pointer-events:auto;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;background:transparent center top/56px 50px no-repeat}
#passBtn .pbIc{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:50px;height:46px;border-radius:12px;border:3px solid #1c1830;background:linear-gradient(160deg,#ffe07a,#f59a1b);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:inset 0 -4px 0 #c27510}
#passBtn.img .pbIc{display:none}
#passBtn b{position:relative;font-size:12px;color:#fff;line-height:1;padding:3px 8px;background:#241e36;border-radius:9px}
#passBtn:active{transform:scale(.94)}
.pass-top{background:linear-gradient(160deg,#5a3aa8,#2a1f5a);border:3px solid #1c1830;border-radius:14px;padding:10px;text-align:center;margin-bottom:8px}
.pass-top h3{margin:0;font-size:22px;font-weight:normal}.pass-top .tm{color:#ffe066;font-size:14px;margin:2px 0 6px}
.pass-prem{display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px}
.pass-prem button{font:inherit;font-size:16px;color:#fff;border:3px solid #1c1830;border-radius:12px;padding:6px 16px;background:linear-gradient(#ffc24a,#f59a1b);box-shadow:inset 0 -4px 0 #c27510;text-shadow:0 2px 0 #9a5a08}
.pass-hd{display:grid;grid-template-columns:1fr 54px 1fr;gap:6px;text-align:center;font-size:14px;color:#cfc8ee;margin:4px 0}
.pass-row{display:grid;grid-template-columns:1fr 54px 1fr;gap:6px;align-items:center;margin-bottom:6px}
.pass-lv{width:46px;height:46px;margin:auto;border-radius:50%;border:3px solid #1c1830;background:#4a4466;color:#9d93ff;display:flex;align-items:center;justify-content:center;font-size:15px}
.pass-lv.on{background:linear-gradient(#ffe07a,#f59a1b);color:#fff;text-shadow:0 1px 0 #9a5a08}
.pass-c{position:relative;font:inherit;color:#fff;min-height:58px;border:3px solid #1c1830;border-radius:12px;background:#38324f;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;padding:4px}
.pass-c.pr{background:linear-gradient(160deg,#6a46c0,#3a2a78)}
.pass-c.ready{background:linear-gradient(#9be86a,#4fb83a);box-shadow:0 0 10px #7be36a;animation:passPulse 1s infinite alternate;cursor:pointer}
@keyframes passPulse{to{box-shadow:0 0 18px #b6ff8f}}
.pass-c.got::after{content:'✔';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;color:#7be36a;background:rgba(20,16,32,.6);border-radius:9px;text-shadow:0 2px 0 #1c1830}
.pass-c.lock{filter:grayscale(.65) brightness(.6)}
.pass-c.lock::before{content:'🔒';position:absolute;top:-8px;right:-6px;font-size:18px;filter:none}
.pass-c .pi{position:relative;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center}
.pass-c .pi>img,.pass-c .pi>svg{width:36px;height:36px;object-fit:contain}
.pass-c .pi i{position:absolute;right:-4px;bottom:-4px;font-style:normal;font-size:11px;color:#fff;text-shadow:0 1px 0 #1c1830,0 0 3px #1c1830;white-space:nowrap}
.pass-all{display:block;margin:4px auto 10px;font:inherit;font-size:18px;color:#fff;border:3px solid #1c1830;border-radius:12px;padding:6px 26px;background:linear-gradient(#9be86a,#4fb83a);box-shadow:inset 0 -4px 0 #2f8a24}
.pass-all:disabled{filter:grayscale(.9);opacity:.6}
.pass-adm{margin-top:12px;background:#2e2a48;border:2px dashed #ff6b6b;border-radius:12px;padding:8px;font-size:14px}
.pass-adm input{font:inherit;width:120px;padding:4px 6px;border-radius:8px;border:2px solid #1c1830}
.pass-adm button{font:inherit;font-size:14px;padding:4px 10px;border-radius:8px;border:2px solid #1c1830;margin-left:4px}`;
  document.head.appendChild(css);

  function panelHTML() {
    const ready = anyReady();
    let h = `<div class="pass-top"><h3 class="ts">🎖️ 성장 패스 · 시즌 1</h3><div class="tm">${left()}</div>
      <div class="pass-prem">${PREM ? '<b style="color:#7be36a">✔ 프리미엄 패스 활성화</b>' : `<span>프리미엄 보상까지 모두 받기</span><button class="ts" data-a="passbuy">${PRICE}</button>`}</div></div>
      <button class="pass-all ts" data-a="passall" ${ready ? '' : 'disabled'}>모두 받기</button>
      <div class="pass-hd"><span>일반 보상</span><span>Lv</span><span>프리미엄 ${PREM ? '' : '🔒'}</span></div>`;
    for (const t of TIERS) {
      const f = st().f[t.lv], p = st().p[t.lv], on = S.lv >= t.lv;
      const fc = f ? 'got' : can(t, false) ? 'ready' : '', pc = !PREM ? 'lock' : p ? 'got' : can(t, true) ? 'ready' : '';
      h += `<div class="pass-row"><button class="pass-c ${fc}" data-a="passc:${t.lv}:f">${rwHTML(t.free)}</button>
        <div class="pass-lv ${on ? 'on' : ''}">${t.lv}</div>
        <button class="pass-c pr ${pc}" data-a="passc:${t.lv}:p">${rwHTML(t.prem)}</button></div>`;
    }
    if (window.IS_ADMIN) h += `<div class="pass-adm">관리자: 프리미엄 켜기/끄기<br><input id="passNick" placeholder="닉네임"><button data-a="passgrant:1">켜기</button><button data-a="passgrant:0">끄기</button>
      <div style="margin-top:6px;color:#cfc8ee">활성화: ${(ADMIN_LIST || []).join(', ') || '없음'}</div></div>`;
    return h;
  }
  const _draw = draw;
  draw = function () {
    if (panel === 'pass') { $('mtitle').textContent = '성장 패스'; cur(['gem', 'gold']); $('mbody').innerHTML = panelHTML(); $('mfoot').innerHTML = ''; return }
    return _draw.apply(this, arguments);
  };
  const _act = act;
  act = function (a) {
    const [k, v, w] = String(a).split(':');
    if (k === 'passc') {
      const t = TIERS.find(x => x.lv === +v); if (!t) return;
      const prem = w === 'p';
      if (prem && !PREM) { toast('프리미엄 패스(' + PRICE + ')가 필요해요'); return }
      if (!live()) { toast(Date.now() < START ? '시즌은 19시에 시작해요' : '시즌이 끝났어요'); return }
      if (S.lv < t.lv) { toast('Lv.' + t.lv + '에 받을 수 있어요'); return }
      const m = claim(t, prem); if (m) { toast(m); save(); window.SFX && SFX.play('reward', { v: .6 }) } draw(); return;
    }
    if (k === 'passall') { const got = []; for (const t of TIERS) for (const pr of [false, true]) { const m = claim(t, pr); if (m) got.push(m) } if (got.length) { toast('패스 보상 ' + got.length + '개 받음!'); save(); window.SFX && SFX.play('reward', { v: .7 }) } draw(); return }
    if (k === 'passbuy') { toast('김성민!'); num(P.x, P.y - 120, '김성민!', '#ffe066', true); return }
    if (k === 'passgrant') { const n = (document.getElementById('passNick') || {}).value || ''; if (!n.trim()) { toast('닉네임을 적어 주세요'); return } fetchPrem({ a: 'grant', nick: n, on: v === '1' }).then(() => toast('처리했어요')); return }
    return _act.apply(this, arguments);
  };
  // 탈것 버튼 아래 패스 버튼 + 받을 보상 있으면 느낌표
  setInterval(() => {
    const q = document.getElementById('quests'); if (!q) return;
    let b = document.getElementById('passBtn');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'passBtn';
      b.innerHTML = '<span class="pbIc">🎖️</span><b class="ts">패스</b>';
      b.addEventListener('click', e => { e.stopPropagation(); open('pass') });
      b.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const mb = document.getElementById('mountBtn');
    if (mb && mb.nextSibling !== b) mb.after(b); else if (!mb && b.parentNode !== q) q.appendChild(b);
    if (AURL.hud_pass && !b.classList.contains('img')) { b.classList.add('img'); b.style.backgroundImage = 'url(' + AURL.hud_pass + ')' }
    b.style.display = combatArena ? 'none' : '';
    let d = b.querySelector(':scope>.ndot'); const on = anyReady();
    if (on && !d) { d = document.createElement('i'); d.className = 'ndot'; d.textContent = '!'; b.appendChild(d) } else if (!on && d) d.remove();
    if (panel === 'pass' && Math.random() < .1) { const tm = document.querySelector('.pass-top .tm'); if (tm) tm.textContent = left() }
  }, 500);
  window.PASS = { TIERS, get prem() { return PREM }, refresh: fetchPrem };
})();
