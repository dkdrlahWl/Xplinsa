/* 성장 패스 (시즌 1): 5레벨마다 일반 보상 + 프리미엄 보상. 프리미엄은 운영자가 켜 줌(₩1,200) */
(() => {
  const SEASON = 's1', START = Date.parse('2026-11-19T19:00:00+09:00'), END = START + 30 * 864e5, PRICE = '₩1,200';
  const TIERS = [];
  for (let t = 1; t <= 20; t++) {
    const lv = t * 5, G = Math.round(800 * t * t / 100) * 100;
    const free = t % 4 === 1 ? { gem: 50 } : t % 4 === 2 ? { gold: G } : t % 4 === 3 ? { key: ['b2', 1] } : { key: ['b3', 1] };
    let prem = t % 5 === 1 ? { gem: 150 } : t % 5 === 2 ? { key: ['b3', 2] } : t % 5 === 3 ? { orb: 20 + 10 * t } : t % 5 === 4 ? { key: [t % 2 ? 'pet' : 'mount', 1] } : { gem: 300, scr: 50 * t };
    if (t === 20) prem = { gem: 500, myth: 2 };
    const x2 = r => { const o = {}; for (const k in r) o[k] = k === 'key' ? [r.key[0], r.key[1] * 2] : r[k] * 2; return o }; // 전 구간 2배
    TIERS.push({ lv, free: x2(free), prem: x2(prem) });
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
    const msg = Object.keys(rw).length ? give(rw) : ''; return (msg ? msg : '') + (r.key ? (msg ? ', ' : '') + ShopBoxItem.name(r.key[0]) + ' x' + r.key[1] : '');
  }
  function rwHTML(r) {
    const out = [];
    for (const k in r) {
      if (k === 'key') {
        const [id, n] = r.key;
        out.push(`<span class="pi" title="${ShopBoxItem.name(id)}" aria-label="${ShopBoxItem.name(id)} ${n}개">${ShopBoxItem.icon(id)}<i>x${n}</i></span>`);
      }
      else out.push(`<span class="pi">${IC[k] || ''}<i>${fmt(r[k])}</i></span>`);
    }
    return out.join('');
  }
  function left() { const ms = Date.now() < START ? START - Date.now() : END - Date.now(); if (ms <= 0) return '시즌 종료'; const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return (Date.now() < START ? '시작까지 ' : '남은 기간 ') + (d ? d + '일 ' : '') + h + '시간 ' + m + '분' }

  const css = document.createElement('style');
  css.textContent = `
#passBtn{position:relative;align-self:flex-end;width:67px;height:66px;border:0;padding:0 0 2px;margin-top:2px;pointer-events:auto;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;background:transparent}
#passBtn .pbIc{position:absolute;top:0;left:50%;transform:translateX(-50%);width:51px;height:47px;object-fit:contain;filter:drop-shadow(0 2px 4px #140b2c)}
#passBtn b{position:relative;font-size:12px;color:#fff6d8;line-height:1;padding:4px 10px;background:#251445;border:1px solid #ffc96c;border-radius:9px}
#passBtn:active{transform:scale(.94)}
#quests #mailBtn,#quests #passBtn{width:40px;height:40px;margin:6px 4px 0 0;padding:0;align-self:flex-end;filter:drop-shadow(0 2px 0 #1c1830)}
#quests #mailBtn img,#quests #passBtn .pbIc{top:0;width:40px;height:40px;filter:none}
#quests #mailBtn b,#quests #passBtn b{display:none}
.pass-board{--pass-gold:#ffdb91;position:relative;isolation:isolate;min-width:0;padding:8px;border:1px solid #bc8b53;border-radius:16px;color:#fff9e9;background:#1c1337;box-shadow:inset 0 0 18px #100b24}
.pass-board::before{content:'';position:absolute;z-index:-1;inset:0;border-radius:inherit;background:linear-gradient(180deg,#1b103139 10%,#22143ebe 400px,#1a112e 770px),url(assets/pass_hall.webp) center top/100% auto no-repeat}
.pass-top{text-align:center;margin:0 0 12px;padding:10px 6px 12px;border:1px solid #edbd71;border-radius:12px;background:linear-gradient(#160c2b0a,#201333e8);box-shadow:inset 0 0 0 2px #4f3567,0 3px 9px #100a22b0}
.pass-top .pass-emblem{display:block;width:94px;height:80px;object-fit:contain;margin:auto;filter:drop-shadow(0 3px 8px #140b28)}
.pass-top h3{margin:0;font-size:clamp(19px,5vw,28px);font-weight:normal;color:#fff3cc}
.pass-top .tm{color:#ffe4ac;font-size:13px;margin:4px 0 8px}
.pass-prem{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-size:13px}
.pass-prem button,.pass-all{font:inherit;color:#fff;border:0;background-color:transparent;background-position:center;background-size:100% 100%;background-repeat:no-repeat;text-shadow:0 2px 3px #160924}
.pass-prem button{background-image:url(assets/pass_premium.webp);padding:9px 18px;min-height:36px}
.pass-all{display:block;margin:0 auto 10px;width:min(210px,84%);min-height:48px;background-image:url(assets/pass_claim.webp);font-size:17px}
.pass-all:disabled{filter:saturate(.45) brightness(.78)}
.pass-hd,.pass-row{display:grid;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr);gap:6px;align-items:center;text-align:center}
.pass-hd{margin:4px 0 7px;font-size:13px;color:var(--pass-gold)}
.pass-hd span:first-child,.pass-hd span:last-child{padding:5px 2px;background:#1b1133bf;border-bottom:1px solid #aa764c;border-radius:7px}
.pass-row{margin-bottom:6px}
.pass-lv{width:39px;height:39px;margin:auto;border:1px solid #886787;border-radius:11px;background:#211738;color:#e5d2f3;display:grid;place-items:center;font-size:14px}
.pass-lv.on{border-color:#f8cf81;background:linear-gradient(#8b522e,#47233f);color:#fff1c9}
.pass-c{position:relative;isolation:isolate;min-width:0;min-height:69px;border:0;border-radius:9px;background:transparent url(assets/pass_free_slot.webp) center/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;gap:3px;padding:8px 5px;font:inherit;color:#fff;cursor:pointer}
.pass-c.pr{background-image:url(assets/pass_prem_slot.webp)}
.pass-c.ready{box-shadow:inset 0 0 0 2px #abffba,0 0 9px #5bd577a8}
.pass-c.lock,.pass-c.future{filter:saturate(.65)}
.pass-c .pass-state{position:absolute;z-index:1;top:4px;right:4px;border-radius:7px;padding:1px 4px;background:#181025e8;color:#fce7c4;font-size:10px;line-height:1.2}
.pass-c.ready .pass-state,.pass-c.got .pass-state{background:#183e24;color:#d8ffcf}
.pass-c .pi{position:relative;width:clamp(23px,8vw,41px);height:44px;display:inline-flex;align-items:center;justify-content:center;flex:0 1 41px;min-width:0}
.pass-c .pi>img,.pass-c .pi>svg{width:85%;height:32px;object-fit:contain;margin-top:-5px}
.pass-c .pi i{position:absolute;right:0;bottom:-2px;padding:0 2px;background:#1e122ce6;border-radius:4px;font-style:normal;font-size:10px;color:#fff;text-shadow:0 1px #170e2b;white-space:nowrap}
.pass-adm{margin-top:12px;background:#24163d;border:1px dashed #d5a762;border-radius:12px;padding:8px;font-size:14px}
.pass-adm input{font:inherit;width:108px;padding:4px 6px;border-radius:8px;border:2px solid #1c1830}
.pass-adm button{font:inherit;font-size:14px;padding:4px 7px;border-radius:8px;border:2px solid #1c1830;margin-left:3px}`;
  document.head.appendChild(css);

  const rewardStatus = state => {
    const label = { ready: '받기', got: '완료', lock: '잠김' }[state];
    return label ? `<span class="pass-state">${label}</span>` : '';
  };

  function panelHTML() {
    const ready = anyReady();
    let h = `<section class="pass-board" aria-label="성장 패스"><header class="pass-top"><img class="pass-emblem" src="assets/pass_emblem.webp" alt=""><h3 class="ts">성장 패스 · 시즌 1</h3><div class="tm">${left()}</div>
      <div class="pass-prem">${PREM ? '<b style="color:#7be36a">✔ 프리미엄 패스 활성화</b>' : `<span>프리미엄 보상까지 모두 받기</span><button class="ts" data-a="passbuy">${PRICE}</button>`}</div></header>
      <button class="pass-all ts" data-a="passall" ${ready ? '' : 'disabled'}>모두 받기</button>
      <div class="pass-hd"><span>일반 보상</span><span>Lv</span><span>프리미엄 ${PREM ? '' : '🔒'}</span></div>`;
    for (const t of TIERS) {
      const f = st().f[t.lv], p = st().p[t.lv], on = S.lv >= t.lv;
      const fc = f ? 'got' : can(t, false) ? 'ready' : 'future';
      const pc = !PREM ? 'lock' : p ? 'got' : can(t, true) ? 'ready' : 'future';
      h += `<div class="pass-row"><button class="pass-c ${fc}" data-a="passc:${t.lv}:f">${rwHTML(t.free)}${rewardStatus(fc)}</button>
        <div class="pass-lv ${on ? 'on' : ''}">${t.lv}</div>
        <button class="pass-c pr ${pc}" data-a="passc:${t.lv}:p">${rwHTML(t.prem)}${rewardStatus(pc)}</button></div>`;
    }
    if (window.IS_ADMIN) h += `<div class="pass-adm">관리자: 프리미엄 켜기/끄기<br><input id="passNick" placeholder="닉네임"><button data-a="passgrant:1">켜기</button><button data-a="passgrant:0">끄기</button>
      <div style="margin-top:6px;color:#cfc8ee">활성화: ${(ADMIN_LIST || []).join(', ') || '없음'}</div></div>`;
    return h + '</section>';
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
    if (k === 'passbuy') { toast('링구에게 기부좀요'); num(P.x, P.y - 120, '링구에게 기부좀요', '#ffe066', true); return }
    if (k === 'passgrant') { const n = (document.getElementById('passNick') || {}).value || ''; if (!n.trim()) { toast('닉네임을 적어 주세요'); return } fetchPrem({ a: 'grant', nick: n, on: v === '1' }).then(() => toast('처리했어요')); return }
    return _act.apply(this, arguments);
  };
  // 탈것 버튼 아래 패스 버튼 + 받을 보상 있으면 느낌표
  setInterval(() => {
    const q = document.getElementById('quests'); if (!q) return;
    let b = document.getElementById('passBtn');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'passBtn';
      b.innerHTML = '<img class="pbIc" src="assets/pass_emblem.webp" alt=""><b class="ts">패스</b>';
      b.addEventListener('click', e => { e.stopPropagation(); open('pass') });
      b.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const mb = document.getElementById('mailBtn') || document.getElementById('mountBtn');
    if (mb && mb.nextSibling !== b) mb.after(b); else if (!mb && b.parentNode !== q) q.appendChild(b);
    b.style.display = combatArena ? 'none' : '';
    let d = b.querySelector(':scope>.ndot'); const on = anyReady();
    if (on && !d) { d = document.createElement('i'); d.className = 'ndot'; d.textContent = '!'; b.appendChild(d) } else if (!on && d) d.remove();
    if (panel === 'pass' && Math.random() < .1) { const tm = document.querySelector('.pass-top .tm'); if (tm) tm.textContent = left() }
  }, 500);
  window.PASS = { TIERS, get prem() { return PREM }, refresh: fetchPrem };
})();
