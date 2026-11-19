/* 상점 개편: 스페셜(VIP·패키지) / 상자 / 충전(데일리 할인 상점) / 교환 — XP Hero 진열 방식 */
(() => {
  const css = `
#mfoot .stabs{display:flex;gap:6px;padding:8px 8px 12px;background:#1c1830}
#mfoot .stabs .stab{position:relative;flex:1;font:inherit;font-size:16px;padding:11px 0;border-radius:12px;border:3px solid #120f20;background:#2e2a48;color:#7d7799;box-shadow:inset 0 -4px 0 #221e38}
#mfoot .stabs .stab.on{background:linear-gradient(#ffc24a,#f59a1b);color:#fff;text-shadow:0 2px 0 #9a5a08;box-shadow:inset 0 -5px 0 #c27510;transform:translateY(-3px)}
.stab .sbang,.s2card .sbang{position:absolute;top:-9px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#e8322c;border:2px solid #fff;color:#fff;font-size:13px;line-height:18px;text-align:center;padding:0 4px;z-index:2}
.s2ban{position:relative;height:118px;border-radius:14px;overflow:hidden;border:3px solid #1c1830;background:radial-gradient(circle at 50% 80%,#7a4a2a,#2a1a14)}
.s2ban img{width:100%;height:100%;object-fit:cover}
.s2rib{margin:-14px auto 10px;position:relative;width:62%;text-align:center;background:linear-gradient(#8a5a34,#5e3a1e);border:3px solid #1c1830;border-radius:10px;font-size:24px;padding:2px 0;color:#fff}
.s2head{margin:16px 2px 10px;text-align:center;background:linear-gradient(#4a4466,#38324f);border:2px solid #1c1830;border-radius:10px;font-size:20px;padding:5px 0;color:#fff;box-shadow:inset 0 -3px 0 #2a2540}
.s2sub{text-align:center;color:#9d93ff;font-size:14px;margin:-4px 0 10px}
.s2timer{display:block;width:max-content;margin:-6px auto 8px;background:#1c1830;border-radius:0 0 12px 12px;padding:3px 18px;color:#fff;font-size:17px}
.s2grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.s2card{position:relative;font:inherit;border:3px solid #1c1830;border-radius:14px;padding:0;overflow:visible;display:flex;flex-direction:column;color:#fff;cursor:pointer}
.s2card.daily{background:linear-gradient(#ffcf8a,#f6a85a)}
.s2card.ex{background:linear-gradient(#a8dcff,#6fbcff)}
.s2card .nm{font-size:14px;padding:6px 4px 0;text-align:center;color:#3a2410;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s2card.ex .nm{font-size:21px;color:#fff;text-shadow:0 2px 0 #1c1830,0 0 3px #1c1830}
.s2card .ic{position:relative;width:64%;aspect-ratio:1;margin:6px auto;border-radius:12px;background:#d9e3ef;border:3px solid #6b7a90;display:flex;align-items:center;justify-content:center}
.s2card.ex .ic{background:none;border:0;width:62%}
.s2card .ic>img,.s2card .ic>svg{width:86%;height:86%;object-fit:contain}
.s2card .ic .kq{left:-4px;top:-6px;right:auto;bottom:auto;width:26px;height:26px;font-size:20px}.s2card .ic .kq>img{width:100%;height:100%}
.s2card .ic .q{position:absolute;right:2px;bottom:0;font-size:16px;color:#fff;text-shadow:0 2px 0 #1c1830,0 0 3px #1c1830}
.s2card .ic.puz{background:#7fd14a;border-color:#2f6a1a;border-radius:16px 16px 16px 4px}
.s2card .ic.puz.g1{background:#58b4ff;border-color:#1f4f8a}.s2card .ic.puz.g2{background:#58b4ff;border-color:#1f4f8a}.s2card .ic.puz.g3{background:#c97bff;border-color:#5a2a8a}.s2card .ic.puz.g4{background:#ffc93c;border-color:#8a5a0a}
.s2card .pr{margin-top:auto;background:#fff3dc;border-top:3px solid #1c1830;border-radius:0 0 11px 11px;padding:4px 2px 5px;display:flex;flex-direction:column;align-items:center;color:#1c1830;line-height:1}
.s2card.ex .pr{background:#dff0ff}
.s2card .pr s{font-size:13px;color:#8a6a5a;text-decoration-color:#e8322c;text-decoration-thickness:2px}
.s2card .pr b{display:flex;align-items:center;gap:3px;font-size:22px;font-weight:normal;text-shadow:none}
.s2card .pr b .aimg,.s2card .pr b svg{width:22px;height:22px}
.s2card .sale{position:absolute;top:-10px;right:-8px;width:50px;height:50px;border-radius:50%;background:radial-gradient(#ff5a4a,#c8221c);border:2px dashed #ffd23c;color:#ffe066;font-size:15px;line-height:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(12deg);text-shadow:0 1px 0 #6a0a08;z-index:2}
.s2card .sale small{font-size:10px!important;color:#fff}
.s2card.sold{filter:none;cursor:default}
.s2card.sold::after{content:'';position:absolute;inset:0;border-radius:11px;background:rgba(40,26,20,.72)}
.s2card .soldtag{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-12deg);z-index:3;border:3px solid #ffb05a;border-radius:10px;color:#fff;font-size:17px;padding:2px 8px;white-space:nowrap;text-shadow:0 0 6px #ff8a2a;box-shadow:0 0 10px #ff8a2a}
.s2card .chk{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:3;font-size:30px;color:#6fe04f;text-shadow:0 2px 0 #1c1830}
.s2card:disabled:not(.sold){filter:grayscale(.5);opacity:.75}
.s2note{text-align:center;color:#9d93ff;font-size:14px;margin:10px 0}
.s2ref{display:block;margin:4px auto 6px;font:inherit;font-size:22px;color:#fff;padding:8px 40px;border-radius:14px;border:3px solid #1c1830;background:linear-gradient(#9be86a,#4fb83a);box-shadow:inset 0 -5px 0 #2f8a24;text-shadow:0 2px 0 #1c5a14}
.s2ref small{display:block;font-size:14px!important}
.s2ref:disabled{filter:grayscale(.9);opacity:.6}
.s2pack{position:relative;border:3px solid #1c1830;border-radius:16px;overflow:hidden;margin:0 0 12px;background:linear-gradient(160deg,#ffe07a,#f5b23a);color:#3a2410}
.s2pack.vip{background:linear-gradient(160deg,#5a3aa8,#2a1f5a);color:#fff}
.s2pack.wk{background:linear-gradient(160deg,#8fe0ff,#4f9fe8)}
.s2pack .art{position:absolute;left:0;top:0;bottom:56px;width:38%;display:flex;align-items:center;justify-content:center}
.s2pack .art img{width:100%;height:100%;object-fit:contain}
.s2pack .body{margin-left:38%;padding:10px 10px 8px;text-align:center}
.s2pack h3{margin:0;font-size:22px;font-weight:normal;color:#fff;text-shadow:0 2px 0 #1c1830,0 0 3px #1c1830}
.s2pack .lim{display:inline-block;margin:4px 0 6px;background:rgba(90,50,20,.75);color:#ffcf6a;border-radius:10px;padding:2px 14px;font-size:14px}
.s2pack .items{display:flex;justify-content:center;gap:5px;flex-wrap:wrap}
.s2pack .it{position:relative;width:52px;height:52px;border-radius:10px;border:2px solid #1c1830;background:linear-gradient(#ffd8a8,#f08a5a)}
.s2pack .it.p{background:linear-gradient(#c79bff,#7a3fd8)}.s2pack .it.b{background:linear-gradient(#d9e3ef,#9aa8bc)}
.s2pack .it>img,.s2pack .it>svg{width:80%;height:80%;margin:10%;object-fit:contain}
.s2pack .it i{position:absolute;right:2px;bottom:0;font-style:normal;font-size:12px;color:#fff;text-shadow:0 1px 0 #1c1830,0 0 3px #1c1830}
.s2pack .buy{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;font:inherit;font-size:28px;color:#fff;border:0;border-top:3px solid #1c1830;padding:6px 0 8px;background:linear-gradient(#f5a84a,#d9782a);text-shadow:0 2px 0 #1c1830,0 0 3px #1c1830}
.s2pack .buy .aimg,.s2pack .buy svg{width:28px;height:28px}
.s2pack .buy:disabled{filter:grayscale(.7)}
.s2pack .val{position:absolute;left:-4px;top:-4px;z-index:2;width:78px;height:62px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(#ff7a2a,#e8322c 70%);border-radius:50% 50% 50% 10%;color:#fff;font-size:22px;line-height:18px;transform:rotate(-10deg);text-shadow:0 2px 0 #6a0a08}
.s2pack .val small{font-size:13px!important;color:#ffe066}
.s2pack .req{position:absolute;left:8px;bottom:62px;background:#fff8e8;border:2px solid #1c1830;border-radius:8px;padding:2px 8px;font-size:13px;color:#3a2410;z-index:2}
.s2pack .req b{color:#e8322c;font-weight:normal}
.s2vip{list-style:none;margin:0;padding:0 0 6px;text-align:left}
.s2vip li{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.28);border-radius:10px;padding:5px 8px;margin:4px 0;font-size:14px}
.s2vip li .vi{flex:0 0 30px;height:30px}.s2vip li .vi>img,.s2vip li .vi>svg{width:100%;height:100%;object-fit:contain}
.s2vip li b{color:#ffe066;font-weight:normal}
.s2pack.vip .stat{font-size:13px;color:#cfc8ee;margin:2px 0 4px}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const A = (k, fb) => AURL[k] || fb || '';
  const img = (k, fb) => { const u = A(k, fb); return u ? `<img src="${u}" alt="">` : '' };
  const icon = k => k === 'key' ? (AURL.icon_key ? `<img src="${AURL.icon_key}" class="aimg" alt="">` : '<span style="font-size:26px">🔑</span>') : IC[k];
  const day = () => calendarKey(), week = () => calendarKey(true);

  /* ---------- 데일리 할인 상점 ---------- */
  const BOXN = { b3: '전사의 상자 열쇠', b2: '전문가 상자 열쇠', b1: '초보자 상자 열쇠', pet: '펫 알 상자 열쇠', mount: '탈것 상자 열쇠' };
  const POOL = [
    { t: 'key', k: 'b3', n: 1, p: 150, w: 10 }, { t: 'key', k: 'b2', n: 1, p: 100, w: 10 },
    { t: 'key', k: 'pet', n: 1, p: 200, w: 7 }, { t: 'key', k: 'mount', n: 1, p: 200, w: 7 },
    { t: 'cur', k: 'scr', n: 72, p: 300, w: 10 }, { t: 'cur', k: 'orb', n: 40, p: 300, w: 10 }, { t: 'cur', k: 'rb', n: 20, p: 300, w: 8 },
    { t: 'hero', g: 0, n: 10, p: 300, w: 8 }, { t: 'hero', g: 1, n: 10, p: 400, w: 6 }, { t: 'hero', g: 2, n: 10, p: 500, w: 4 },
    { t: 'hero', g: 3, n: 10, p: 800, w: 2 }, { t: 'hero', g: 4, n: 15, p: 1100, w: 1 },
  ];
  const MAXREF = 2;
  function goldFree() { return Math.max(1, Math.floor(Math.max(1, Math.floor(ST.bag)) * 3 * 3 / 4)) }
  function genList() {
    const out = [{ t: 'gold', n: goldFree(), p: 0 }], pool = POOL.slice();
    while (out.length < 6 && pool.length) {
      let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), i = 0;
      for (; i < pool.length - 1; i++) { if ((r -= pool[i].w) <= 0) break }
      const it = Object.assign({}, pool.splice(i, 1)[0]);
      if (it.t === 'hero') { const hs = HERO.filter(h => h.k !== 'adv' && h.g === it.g); if (!hs.length) continue; it.k = hs[Math.floor(Math.random() * hs.length)].k }
      delete it.w; out.push(it);
    }
    return out;
  }
  function dstate() {
    let d = S.dshop;
    if (!d || d.day !== day()) { d = S.dshop = { day: day(), items: genList(), sold: [], buys: 0, ref: 0 } }
    return d;
  }
  const disc = d => Math.min(50, 10 * (d.buys + 1));
  const price = (it, d) => Math.floor(it.p * (100 - disc(d)) / 100);
  function itName(it) {
    if (it.t === 'gold') return '골드';
    if (it.t === 'key') return BOXN[it.k];
    if (it.t === 'cur') return RWN[it.k];
    if (it.t === 'hero') { const h = HERO.find(x => x.k === it.k); return h ? h.n : '영혼 파편' }
    return '';
  }
  function itIcon(it) {
    if (it.t === 'gold') return `<div class="ic">${IC.gold}<span class="q">${fmt(it.n)}</span></div>`;
    if (it.t === 'key') return `<div class="ic">${img(BOX[it.k]?.img, AURL[BOX[it.k]?.fb])}<span class="q kq">${icon('key')}</span><span class="q">x${it.n}</span></div>`;
    if (it.t === 'cur') return `<div class="ic">${IC[it.k]}<span class="q">x${it.n}</span></div>`;
    if (it.t === 'hero') { const h = HERO.find(x => x.k === it.k), u = AURL['hero_' + it.k + '_head']; return `<div class="ic puz g${h ? h.g : 0}">${u ? `<img src="${u}" alt="">` : `<b style="font-size:26px">${h ? h.n[0] : '?'}</b>`}<span class="q">x${it.n}</span></div>` }
    return '<div class="ic"></div>';
  }
  function untilMidnight() { const now = Date.now() + 9 * 3600e3, end = (Math.floor(now / 864e5) + 1) * 864e5, s = Math.max(0, Math.floor((end - now) / 1000)); return Math.floor(s / 3600) + 'H ' + Math.floor(s % 3600 / 60) + 'M ' + (s % 60) + 'S' }
  function dailyFreeReady() { const d = dstate(); return !d.sold.includes(0) }
  function dailyPanel() {
    const d = dstate(), dc = disc(d);
    const cards = d.items.map((it, i) => {
      const sold = d.sold.includes(i), pr = price(it, d), free = !it.p;
      return `<button class="s2card daily${sold ? ' sold' : ''}" data-a="sdbuy:${i}" ${sold || (!free && S.gem < pr) ? 'disabled' : ''}>
        ${!free && !sold ? `<div class="sale">${dc}%<small>SALE</small></div>` : ''}${free && !sold ? '<span class="sbang">!</span>' : ''}
        <div class="nm">${itName(it)}</div>${itIcon(it)}
        <div class="pr">${free ? '<b>무료</b>' : `<s>${fmt(it.p)}</s><b>${IC.gem}${fmt(pr)}</b>`}</div>
        ${sold ? '<div class="soldtag">SOLD OUT</div><div class="chk">✔</div>' : ''}</button>`;
    }).join('');
    return `<div class="s2ban">${img('shop_banner_daily', AURL.shop_banner)}</div><div class="s2rib ts">• 충전 •</div>
      <div class="s2head ts">데일리 젬 할인 상점</div><span class="s2timer ts" id="s2tm">⏱ ${untilMidnight()}</span>
      <div class="s2sub">구매할수록 추가 할인됩니다 (다음 ${Math.min(50, dc + 10)}%)</div>
      <div class="s2grid">${cards}</div>
      <div class="s2note">새로고침 시, 상품 리스트와 누적 할인율이 초기화됩니다.</div>
      <button class="s2ref ts" data-a="sdref" ${d.ref >= MAXREF ? 'disabled' : ''}>새로고침<small>(${MAXREF - d.ref}/${MAXREF})</small></button>`;
  }
  function dailyBuy(i) {
    const d = dstate(), it = d.items[i]; if (!it || d.sold.includes(i)) return;
    const pr = price(it, d); if (S.gem < pr) { toast('보석이 부족해요'); return }
    S.gem -= pr; d.sold.push(i); if (it.p) d.buys++;
    const rw = {};
    if (it.t === 'gold') { S.gold += it.n; rw.gold = it.n }
    else if (it.t === 'key') { S.keys = S.keys || {}; S.keys[it.k] = (S.keys[it.k] || 0) + it.n }
    else if (it.t === 'cur') { S[it.k] = (S[it.k] || 0) + it.n; rw[it.k] = it.n }
    else if (it.t === 'hero') { S.shards[it.k] = (S.shards[it.k] || 0) + it.n }
    calc(); save(); if (Object.keys(rw).length && window.rewardFly) rewardFly(rw);
    window.SFX && SFX.play('gem', { v: .6 }); toast(itName(it) + ' ' + (it.t === 'gold' ? fmt(it.n) : 'x' + it.n) + ' 획득!');
  }

  /* ---------- 스페셜: VIP · 패키지 ---------- */
  const STAGEP = [0, 1, 2, 3, 4, 5].map(i => ({ id: 'stage' + i, stage: i, cost: 300 + 300 * i, items: [['key', 'b3', 4 + 4 * i], ['orb', 0, 50 + 50 * i], ['scr', 0, 100 + 100 * i], ['rb', 0, 10 + 10 * i]] }));
  const UPG = { id: 'upgrade', cost: 600, items: [['scr', 0, 500], ['gold', 0, 0]] };
  const WEEK = { id: 'weekly', cost: 1000, items: [['key', 'pet', 3], ['key', 'mount', 3], ['key', 'b3', 2]] };
  const VAL = { b3: 150, b2: 100, b1: 30, pet: 200, mount: 200, orb: 7.4, rb: 15.4, scr: 4, gold: 0 };
  const upgGold = () => Math.max(10000, Math.floor(Math.max(1, Math.floor(ST.bag)) * 3 * 20));
  const items = p => p.items.map(([k, s, n]) => k === 'gold' && !n ? [k, s, upgGold()] : [k, s, n]);
  const value = p => { const v = items(p).reduce((a, [k, s, n]) => a + (k === 'key' ? VAL[s] : VAL[k] || 0) * n, 0) + (p.id === 'upgrade' ? 600 : 0); return Math.round(v / p.cost * 100 / 50) * 50 };
  function packState() { const s = S.packs = S.packs || {}; if (s.wk !== week()) { s.wk = week(); s.weekly = 0 } return s }
  function itemHTML([k, s, n]) {
    if (k === 'key') return `<div class="it b">${img(BOX[s]?.img, AURL[BOX[s]?.fb])}<i>🔑x${n}</i></div>`;
    return `<div class="it${k === 'orb' || k === 'rb' ? ' p' : ''}">${IC[k]}<i>x${fmt(n)}</i></div>`;
  }
  function packHTML(p, title, cls, art, lim, req) {
    const can = !req && S.gem >= p.cost;
    return `<div class="s2pack ${cls}"><div class="val">${value(p)}%<small>가치</small></div><div class="art">${art}</div>
      ${req ? `<div class="req">${req}</div>` : ''}
      <div class="body"><h3>${title}</h3><div class="lim">${lim}</div><div class="items">${items(p).map(itemHTML).join('')}</div></div>
      <button class="buy" data-a="spack:${p.id}" ${can ? '' : 'disabled'}>${IC.gem}${fmt(p.cost)}</button></div>`;
  }
  function specialPanel() {
    const ps = packState(), on = vipActive();
    const vip = `<div class="s2pack vip"><div class="art">${img('shop_vip', 'assets/adventurer_rank_5.webp')}</div>
      <div class="body"><h3>VIP 30일권</h3><div class="stat">${on ? '이용 중 · <b style="color:#6fe04f">' + vipRemaining() + '일 남음</b>' : '구매 즉시 30일간 적용'}</div>
      <ul class="s2vip">
        <li><span class="vi">${IC.tower}</span><span>탑 보상 <b>2배</b> · 하루 3회</span></li>
        <li><span class="vi">${img('icon_raidticket') || IC.tower}</span><span>탑 입장권 <b>+1장</b> / 일</span></li>
        <li><span class="vi">${featureImage('exchange')}</span><span>교환소 무료 <b>3회</b> / 일</span></li>
      </ul></div>
      <button class="buy" data-a="buyvip" ${S.gem < VIP_PRICE ? 'disabled' : ''}>${IC.gem}${fmt(VIP_PRICE)}${on ? '<span style="font-size:16px">&nbsp;· 30일 연장</span>' : ''}</button></div>`;
    const next = STAGEP.find(p => !ps[p.id]);
    const stage = next ? packHTML(next, '스테이지 ' + (next.stage + 1) + ' 패키지', '', img('pack_stage', AURL.shop_chest3), '1회 구매 가능', stageClear(next.stage) ? '' : '스테이지 ' + (next.stage + 1) + ' <b>보스 처치</b> 시 해금') : '<div class="s2note">스테이지 패키지를 모두 구매했어요</div>';
    const upg = ps.upgrade ? '' : `<div class="s2head ts">무기 업그레이드 팩</div>` + packHTML(UPG, '무기 업그레이드 팩', '', img('pack_upgrade', 'assets/icon_anvil.webp'), '1회 구매 가능', S.lv >= 15 ? '' : '<b>Lv.15</b> 달성 시 해금');
    const wk = packHTML(WEEK, '주간 탐험 패키지', 'wk', img('pack_weekly', AURL.shop_petbox), '이번 주 ' + (1 - (ps.weekly || 0)) + '/1', ps.weekly ? '이번 주 구매 완료' : '');
    return `<div class="s2ban">${img('shop_banner_special', AURL.shop_banner)}</div><div class="s2rib ts">• 스페셜 •</div>
      <div class="s2head ts">VIP 멤버십</div>${vip}
      <div class="s2head ts">스테이지 패키지</div>${stage}${upg}
      <div class="s2head ts">주간 패키지</div>${wk}`;
  }
  function packBuy(id) {
    const ps = packState(), p = id === 'upgrade' ? UPG : id === 'weekly' ? WEEK : STAGEP.find(x => x.id === id); if (!p) return;
    if (id === 'weekly' ? ps.weekly : ps[id]) return;
    if (p.stage != null && (!stageClear(p.stage) || STAGEP.find(x => !ps[x.id]) !== p)) return;
    if (id === 'upgrade' && S.lv < 15) return;
    if (S.gem < p.cost) { toast('보석이 부족해요'); return }
    S.gem -= p.cost; if (id === 'weekly') ps.weekly = 1; else ps[id] = 1;
    const rw = {}; S.keys = S.keys || {};
    for (const [k, s, n] of items(p)) { if (k === 'key') S.keys[s] = (S.keys[s] || 0) + n; else { S[k] = (S[k] || 0) + n; rw[k] = n } }
    calc(); save(); if (window.rewardFly) rewardFly(rw); window.SFX && SFX.play('gem', { v: .7 }); toast('패키지 구매 완료! 열쇠는 상자 탭에서 사용해요');
  }

  /* ---------- 교환 ---------- */
  window.exchangePanel = function () {
    const rows = exchangeOffers(), grp = [['gold', '능력 강화 재료 · 골드'], ['orb', '영웅 성장 재료 · 오브'], ['rb', '특수 재료 · 무지개 오브']];
    const card = ([kind, amount, cost], index) => {
      const remaining = cost ? 0 : freeExchangeRemaining(kind), used = !cost && remaining === 0;
      return `<button class="s2card ex${used ? ' sold' : ''}" data-a="exchange:${index}" ${used || S.gem < cost ? 'disabled' : ''}>${remaining ? `<span class="sbang">${remaining}</span>` : ''}
        <div class="nm ts">${fmt(amount)}</div><div class="ic">${IC[kind]}</div>
        <div class="pr"><b>${cost ? IC.gem + cost : '무료'}</b></div>${used ? '<div class="chk">✔</div>' : ''}</button>`;
    };
    return `<div class="s2ban">${img('shop_banner_exchange', AURL.shop_banner)}</div><div class="s2rib ts">• 교환 •</div>` +
      grp.map(([k, t]) => `<div class="s2head ts">${t}</div><div class="s2grid">${rows.map((r, i) => r[0] === k ? card(r, i) : '').join('')}</div>`).join('') +
      `<div class="s2note">무료 교환은 재화별 하루 ${vipActive() ? '3회 (VIP)' : '1회 · VIP 3회'} · 골드 양은 가방 용량에 따라 늘어나요</div>`;
  };
  window.benefitsPanel = specialPanel;

  /* ---------- 탭 ---------- */
  function exFree() { return ['gold', 'orb', 'rb'].some(k => freeExchangeRemaining(k) > 0) }
  function boxFree() { return BOX.b1.free && S.freeDay !== today() || Object.values(S.keys || {}).some(n => n > 0) }
  window.SHOP2 = { dailyFreeReady, exFree, boxFree, any: () => dailyFreeReady() || exFree() || boxFree() };
  window.shopTabs = function (exchange = false) {
    const tab = exchange === true ? 'exchange' : exchange || 'shop';
    const T = [['benefits', '스페셜', 'benefits', false], ['shop', '상자', 'goshop', boxFree()], ['daily', '충전', 'sdaily', dailyFreeReady()], ['exchange', '교환', 'exchangego', exFree()]];
    return '<div class="stabs">' + T.map(([key, label, action, bang]) => `<button class="stab ts ${tab === key ? 'on' : ''}" data-a="${action}">${label}${bang && tab !== key ? '<span class="sbang">!</span>' : ''}</button>`).join('') + '</div>';
  };

  const _draw = draw;
  draw = function () {
    if (panel === 'daily') { const B = $('mbody'), F = $('mfoot'); $('mtitle').textContent = '상점 · 충전'; cur(['gem', 'gold']); B.innerHTML = dailyPanel(); F.innerHTML = shopTabs('daily'); queueMicrotask(() => refreshRewardNotices(true)); return }
    const r = _draw.apply(this, arguments);
    if (panel === 'benefits') $('mtitle').textContent = '상점 · 스페셜';
    return r;
  };
  const _act = act;
  act = function (a) {
    const [k, v] = String(a).split(':');
    if (k === 'sdaily') { panel = 'daily'; draw(); return }
    if (k === 'sdbuy') { dailyBuy(+v); draw(); return }
    if (k === 'sdref') { const d = dstate(); if (d.ref >= MAXREF) return; d.ref++; d.items = genList(); d.sold = []; d.buys = 0; save(); toast('상품 목록을 새로고침했어요'); draw(); return }
    if (k === 'spack') { packBuy(v); draw(); return }
    if (k === 'buyvip') { const was = vipActive(), r = _act.apply(this, arguments); if (!was && vipActive() && S.tower) { S.tower.tickets = (S.tower.tickets || 0) + 1; save() } return r }
    return _act.apply(this, arguments);
  };
  setInterval(() => { const e = document.getElementById('s2tm'); if (e && panel === 'daily') { e.textContent = '⏱ ' + untilMidnight(); if (S.dshop && S.dshop.day !== day()) draw() } }, 1000);
})();
