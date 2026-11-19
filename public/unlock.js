/* 콘텐츠 레벨 해금 · 새 콘텐츠 알림 · 느낌표 · 레벨업 체력 회복 · 부화기 튜토리얼 */
(() => {
  const U = [
    { k: 'heroes', n: '영웅', lv: 2, d: '장비 화면에서 영웅을 바꿀 수 있어요', acts: ['heroes', 'hdetail'], sel: '[data-a="heroes"]' },
    { k: 'shop', n: '상점', lv: 3, d: '보석으로 무기·영웅·펫 상자를 열어요', opens: ['shop'], sel: '[data-p="shop"]' },
    { k: 'pets', n: '펫', lv: 4, d: '기지에 부화기를 지어 알을 부화시켜요', opens: ['pets'], acts: ['pets'], sel: '[data-p="pets"],[data-a="pets"]' },
    { k: 'tower', n: '도전 (탑)', lv: 5, d: '탑을 올라 보상을 받아요', opens: ['tower', 'challenges'], sel: '[data-p="tower"]' },
    { k: 'defense', n: '캠프 방어', lv: 6, d: '친구와 함께 캠프를 지켜요', acts: ['challengeDefense'], sel: '[data-a="challengeDefense"]' },
    { k: 'market', n: '거래소', lv: 8, d: '친구와 무기를 사고팔아요', acts: ['market'], sel: '[data-a="market"]' },
    { k: 'mount', n: '탈것', lv: 10, d: '임무 아래 버튼으로 타고 빠르게 달려요', sel: '#mountBtn,[data-a="mounts"]' },
  ];
  const BYK = Object.fromEntries(U.map(u => [u.k, u]));
  const isOpen = k => S.lv >= BYK[k].lv;
  window.UNLOCK = { U, isOpen };
  function st() { S.seenU = S.seenU || {}; if (!S.uInit) { S.uInit = 1; for (const u of U) if (S.lv >= u.lv) S.seenU[u.k] = 1 } }
  const lockMsgU = u => toast(u.n + '은(는) Lv.' + u.lv + '에 열려요');
  // 열기 막기
  const _open = open; open = function (p) { st(); for (const u of U) if (u.opens && u.opens.includes(p) && !isOpen(u.k)) return lockMsgU(u); for (const u of U) if (u.opens && u.opens.includes(p)) S.seenU[u.k] = 1; return _open.apply(this, arguments) };
  const _act = act; act = function (a) { st(); const k = String(a).split(':')[0]; for (const u of U) if (u.acts && u.acts.includes(k)) { if (!isOpen(u.k)) return lockMsgU(u); S.seenU[u.k] = 1 } if (k === 'mounts' || k === 'mride') S.seenU.mount = 1; return _act.apply(this, arguments) };
  // 화면 표시: 잠금 / 느낌표
  function badge(el, on, txt) { let b = el.querySelector(':scope>.ndot'); if (on) { if (!b) { b = document.createElement('i'); b.className = 'ndot'; el.appendChild(b) } b.textContent = txt || '!' } else if (b) b.remove() }
  function lockTag(el, u) { const lk = !isOpen(u.k); el.classList.toggle('ulock', lk); let t = el.querySelector(':scope>.ulk'); if (lk) { if (!t) { t = document.createElement('i'); t.className = 'ulk'; el.appendChild(t) } t.textContent = '🔒Lv.' + u.lv } else if (t) t.remove() }
  function mapReady() { try { if (typeof stageClear !== 'function') return false; for (let i = 0; i < 6; i++) if (stageClear(i) && !(S.stageClaimed || {})[i]) return true } catch (e) {} return false }
  let tickT = 0, lastLv = null, banQ = [];
  function tick() {
    st();
    if (lastLv == null) lastLv = S.lv;
    if (S.lv > lastLv) { // 레벨업: 체력 가득 + 새 콘텐츠 알림
      if (!P.dead) P.hp = ST.maxhp;
      for (const u of U) if (u.lv > lastLv && u.lv <= S.lv) banQ.push(u);
      lastLv = S.lv; save();
    }
    if (banQ.length && !document.getElementById('ubanner')) showBan(banQ.shift());
    for (const u of U) for (const el of document.querySelectorAll(u.sel)) { lockTag(el, u); badge(el, isOpen(u.k) && !S.seenU[u.k], 'NEW') }
    const mp = document.querySelector('#lb [data-p="map"]'); if (mp) badge(mp, mapReady());
  }
  function showBan(u) {
    const g = document.getElementById('game'); if (!g) return; const e = document.createElement('div'); e.id = 'ubanner';
    e.innerHTML = '<div class="ubIn"><small>🔓 새로운 콘텐츠 열림!</small><b>' + u.n + '</b><span>' + u.d + '</span></div>'; g.appendChild(e);
    window.SFX && SFX.play('fanfare', { v: .55, fixed: 1 }); setTimeout(() => e.classList.add('out'), 2300); setTimeout(() => e.remove(), 2800);
  }
  setInterval(() => { try { tick() } catch (e) { console.error(e) } }, 400);
  // 부화기 짓기 (Lv.4, 대장간 다음) → 튜토리얼 알 1개(1분 부화)
  if (typeof BLD !== 'undefined' && !BLD.some(b => b.k === 'incubator')) BLD.push({ k: 'incubator', n: '부화기', cost: 150, r: 62, need: 'smith', lv: 4, x: () => BASE.x - 215, y: () => BASE.y + 105 });
  function migrate() { S.built = S.built || {}; S.bp = S.bp || {}; if (S.bp.incubator == null) S.bp.incubator = 0; if (!S.built.incubator && ((S.pets && Object.keys(S.pets).length) || (S.inc || []).some(o => o))) S.built.incubator = true }
  migrate();
  // 임무: Lv.4 달성 다음에 펫 튜토리얼 3개 (기존 진행 중인 유저는 번호 보정)
  if (typeof Q !== 'undefined' && typeof CHAP !== 'undefined' && CHAP === 1) {
    const i = Q.findIndex(q => q.type === 'lv' && q.need === 4);
    if (i >= 0 && !Q.some(q => q.type === 'hatch')) {
      Q.splice(i + 1, 0,
        { t: '금화 150개로 부화기 짓기', type: 'build', key: 'incubator', cost: 150, rw: { gem: 10 } },
        { t: '부화기에 알 넣기', type: 'incput', need: 1, rw: { gold: 80 } },
        { t: '펫 부화하기', type: 'hatch', need: 1, rw: { gem: 15 } });
      if (!S.qv2) { S.qv2 = 1; if (S.q > i) S.q += 3; save() }
    }
  }
  window.UNLOCK.built = () => { // 부화기 완성 시
    if (S.tutEgg) return; S.tutEgg = 1; S.petEggs = S.petEggs || [0, 0, 0, 0, 0]; S.petEggs[0]++; toast('🥚 일반 펫 알 1개를 받았어요! 부화기에 넣어보세요'); save();
  };
})();
