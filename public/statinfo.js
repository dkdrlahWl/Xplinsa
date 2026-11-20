/* 장비 화면 ⚡ 전투력 버튼 → 내 능력치 상세 창 */
(() => {
  const css = document.createElement('style');
  css.textContent = `#statpop{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(15,12,29,.55);font-family:Jua,sans-serif}
#statpop .sp{width:min(84vw,330px);max-height:78vh;overflow:auto;background:#2b2546;border:4px solid #1c1830;border-radius:18px;padding:12px 14px 14px;color:#fff;box-shadow:0 8px 0 rgba(0,0,0,.35)}
#statpop .sph{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
#statpop .sph b{font-size:20px;font-weight:normal;color:#ffe066}
#statpop .spx{font:inherit;font-size:18px;width:32px;height:32px;border-radius:10px;border:2px solid #1c1830;background:#e8504a;color:#fff;padding:0}
#statpop .spp{text-align:center;font-size:24px;margin:2px 0 10px;color:#ffd23c}
#statpop .spr{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:#38324f;margin-bottom:5px;font-size:15px}
#statpop .spr .i{flex:0 0 24px;height:24px}#statpop .spr .i>img,#statpop .spr .i>svg{width:100%;height:100%;object-fit:contain}
#statpop .spr span{flex:1;color:#cfc8ee}#statpop .spr em{font-style:normal;color:#fff}
#statpop .sps{font-size:13px;color:#9d93ff;margin:10px 2px 4px}`;
  document.head.appendChild(css);
  const pct = v => (Math.round(v * 1000) / 10) + '%';
  function rows() {
    const R = [
      ['sword', '공격력', fmt(ST.atk)],
      ['hp', '최대 체력', fmt(ST.maxhp)],
      ['crit', '치명타 확률', pct(Math.min(1, ST.crit || 0))],
      ['crit', '치명타 피해', pct(ST.critDamage || 1.5)],
      ['flag', '스킬 피해', pct(ST.skill || 1)],
      ['flag', '스킬 쿨타임 감소', pct(Math.max(0, 1 - (ST.skillCooldown == null ? 1 : ST.skillCooldown)))],
      ['up', '공격 속도', pct(ST.aspd || 1)],
      ['up', '이중 공격 확률', pct(Math.min(1, ST.dbl || 0))],
      ['up', '삼중 공격 확률', pct(Math.min(1, ST.triple || 0))],
      ['regen', '체력 회복', fmt(Math.round((ST.regen || 0) * 10) / 10) + '/초'],
      ['hp', '생명력 흡수', pct(ST.ls || 0)],
      ['spd', '이동 속도', Math.round(ST.spd || 0)],
      ['bag', '가방 용량', fmt(ST.bag || 0)],
    ];
    return R.map(([ic, n, v]) => `<div class="spr"><span class="i">${IC[ic] || ''}</span><span>${n}</span><em>${v}</em></div>`).join('');
  }
  function show() {
    let d = document.getElementById('statpop'); if (d) d.remove();
    d = document.createElement('div'); d.id = 'statpop';
    d.innerHTML = `<div class="sp"><div class="sph"><b>내 능력치</b><button class="spx" aria-label="닫기">✕</button></div>
      <div class="spp">⚡ ${fmt(ST.pow)}</div>${rows()}<div class="sps">강화·장비·영웅·펫·탈것·특성이 모두 합쳐진 값이에요</div></div>`;
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.spx')) d.remove() });
    document.body.appendChild(d);
  }
  // 대장간 정보: 모루 버튼 왼쪽 위 ⓘ → 현재 대장간 레벨·경험치·제작 확률(현재/다음)
  function smithInfo() {
    let d = document.getElementById('statpop'); if (d) d.remove();
    const st = S.step || 0, mx = st >= SXP.length, cur = SM[st], nx = SM[Math.min(st + 1, SM.length - 1)];
    const rows = GR.slice(0, 4).map((g, i) => `<div class="spr"><span style="color:${g.c};flex:0 0 52px">${g.n}</span><span></span><em>${cur[i] || 0}%</em>${mx ? '' : `<em style="color:#7be36a;margin-left:10px">→ ${nx[i] || 0}%</em>`}</div>`).join('');
    d = document.createElement('div'); d.id = 'statpop';
    d.innerHTML = `<div class="sp"><div class="sph"><b>대장간 Lv.${st + 1}${mx ? ' (최대)' : ''}</b><button class="spx" aria-label="닫기">✕</button></div>
      <div class="sps" style="margin-top:0">${mx ? '최고 레벨이에요' : '경험치 ' + fmt(S.sxp || 0) + ' / ' + fmt(SXP[st]) + ' · 다 차면 모루를 눌러 승급 (금화 ' + fmt(SMITH_PROMOTION_GOLD[st]) + ')'}</div>
      <div class="sps">모루 1번 = 크리스탈 ${smithCost()}개${mx?'':' (다음 레벨 '+SMITH_COST[Math.min(st+1,SMITH_COST.length-1)]+'개)'} · 무기 제작 확률 (지금${mx ? '' : ' → 다음 레벨'})</div>${rows}
      <div class="sps">같은 무기 3개를 합성하면 한 등급 위 무기가 돼요</div></div>`;
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.spx')) d.remove() });
    document.body.appendChild(d);
  }
  const sb = document.querySelector('.bb[data-p="smith"]');
  if (sb) {
    const b = document.createElement('i'); b.className = 'sinfo'; b.textContent = 'i'; b.setAttribute('aria-label', '대장간 정보');
    b.style.cssText = 'position:absolute;top:-6px;left:-6px;width:22px;height:22px;border-radius:50%;background:#3a7bd5;border:2px solid #fff;color:#fff;font:bold 13px/18px Jua,sans-serif;font-style:normal;text-align:center;z-index:3;pointer-events:auto';
    b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); smithInfo() }, true);
    b.addEventListener('pointerdown', e => e.stopPropagation(), true);
    sb.appendChild(b);
  }
  // 관리자 모드: 유저 현황 (대장간 레벨·레벨·챕터·승급·크리스탈)
  async function adminUsers() {
    const j = await fetch('/api/adminusers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok||'') }) }).then(r => r.json()).catch(() => ({}));
    if (!j.list) { toast(j.err || '불러오지 못했어요'); return }
    let d = document.getElementById('statpop'); if (d) d.remove(); d = document.createElement('div'); d.id = 'statpop';
    d.innerHTML = `<div class="sp" style="width:min(94vw,420px)"><div class="sph"><b>유저 현황</b><button class="spx">✕</button></div>
      <div class="sps" style="margin-top:0">대장간 레벨 높은 순 · 🟢 접속 중</div>` + j.list.map(u => `<div class="spr" style="font-size:13px"><span style="flex:0 0 auto;color:#fff">${u.on ? '🟢' : '⚪'} ${u.n}</span><span></span><em>대장간 Lv.${u.smith} · Lv.${u.lv} · ${u.ch}챕 · ${u.promo}차 · 💎${fmt(u.gem)} · 크리 ${fmt(u.cry)} · 주문서 ${fmt(u.scr || 0)} · 탑 ${u.tw || 0}층</em></div>`).join('') + '</div>';
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.spx')) d.remove() });
    document.body.appendChild(d);
  }
  const _draw2 = draw;
  // 관리자 송금 (링피지 방식): 재화 고르기 → 받는 사람 고르기 → 수량 → 확인 화면 → 송금. 받는 사람 우편함으로 바로 들어감
  const SEND = [['gold', '금화'], ['gem', '보석'], ['cry', '크리스탈'], ['orb', '오브'], ['rb', '무지개 오브'], ['scr', '주문서'], ['myth', '신화석'], ['scl', '용의 비늘'],
    ['b1', '초보자의 무기상자 열쇠'], ['b2', '전문가의 무기상자 열쇠'], ['b3', '전사의 무기상자 열쇠'], ['pet', '펫 알 상자 교환권'], ['mount', '탈것 상자 교환권']];
  const SN = Object.fromEntries(SEND);
  const sIcon = k => /^(b[123]|pet|mount)$/.test(k) ? '🔑' : (IC[k] || '');
  async function adminSend() {
    const j = await fetch('/api/adminusers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || '') }) }).then(r => r.json()).catch(() => ({}));
    if (!j.list) { toast(j.err || '불러오지 못했어요'); return }
    const people = j.list.filter(u => u.id && u.id !== 'ehgus').sort((a, b) => (b.on - a.on) || (b.lv - a.lv));
    let res = 'gold', to = null, review = null, busy = false;
    const d = document.createElement('div'); d.id = 'admSend'; 
    d.innerHTML = `<div class="sp" style="width:min(94vw,400px);max-height:88vh;overflow:auto"><div class="sph"><b>💸 재화 송금</b><button class="spx">✕</button></div>
      <div id="asForm"><div class="sps" style="margin-top:0">보낼 재화</div><div class="as-res">${SEND.map(([k, n]) => `<button type="button" data-res="${k}">${sIcon(k)}<span>${n}</span></button>`).join('')}</div>
      <div class="sps">받는 사람 · 🟢 접속 중</div><div class="as-ppl">${people.map(u => `<button type="button" data-to="${u.id}"><b>${u.on ? '🟢' : '⚪'} ${u.n}</b><small>Lv.${u.lv} · ${u.ch}챕 · ID ${u.id}</small></button>`).join('') || '<div class="as-none">보낼 수 있는 유저가 없어요</div>'}</div>
      <div class="sps">수량</div><input id="asN" inputmode="numeric" placeholder="보낼 수량" autocomplete="off"><div class="as-q">${[[1, '1'], [10, '10'], [100, '100'], [1000, '1천'], [10000, '1만'], [100000, '10만'], [1000000, '100만'], [100000000, '1억']].map(([n, l]) => `<button type="button" data-add="${n}">+${l}</button>`).join('')}<button type="button" data-add="0">초기화</button></div></div>
      <div id="asReview" hidden></div><div id="asSt"></div>
      <div class="as-act"><button type="button" class="btn" id="asBack" hidden>뒤로</button><button type="button" class="btn" id="asGo" disabled>송금 내용 확인</button></div></div>`;
    document.body.appendChild(d);
    const q = s => d.querySelector(s), N = () => { const v = q('#asN').value.replace(/[^0-9]/g, ''); return v ? Number(v) : 0 };
    const sync = () => {
      d.querySelectorAll('[data-res]').forEach(b => b.classList.toggle('on', b.dataset.res === res));
      d.querySelectorAll('[data-to]').forEach(b => b.classList.toggle('on', b.dataset.to === (to && to.id)));
      const n = N(); q('#asGo').disabled = busy || !to || !(n >= 1) || n > 1e15;
    };
    const form = () => { review = null; q('#asForm').hidden = false; q('#asReview').hidden = true; q('#asBack').hidden = true; q('#asGo').textContent = '송금 내용 확인'; sync() };
    d.addEventListener('click', async e => {
      if (e.target === d || e.target.closest('.spx')) { if (!busy) d.remove(); return }
      const r = e.target.closest('[data-res]'); if (r) { res = r.dataset.res; sync(); return }
      const t = e.target.closest('[data-to]'); if (t) { to = people.find(u => u.id === t.dataset.to); q('#asSt').textContent = ''; sync(); return }
      const a = e.target.closest('[data-add]'); if (a) { const v = +a.dataset.add; q('#asN').value = v ? (N() + v).toLocaleString('ko-KR') : ''; sync(); return }
      if (e.target.closest('#asBack')) { if (!busy) form(); return }
      if (!e.target.closest('#asGo') || q('#asGo').disabled) return;
      if (!review) {
        review = { to: to.id, name: to.n, res, n: N() };
        q('#asForm').hidden = true; q('#asReview').hidden = false; q('#asBack').hidden = false; q('#asGo').textContent = '송금하기';
        q('#asReview').innerHTML = `<b>${review.name}</b> (ID ${review.to}) 계정에<br>${sIcon(res)} <b>${SN[res]} ${review.n.toLocaleString("ko-KR")}개</b>를 보냅니다.<br><small>받는 사람 우편함으로 바로 들어가요.</small>`;
        return;
      }
      busy = true; sync(); q('#asSt').textContent = '송금 중…';
      const k = await fetch('/api/admsend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || ''), to: review.to, res: review.res, n: review.n }) }).then(r => r.json()).catch(() => ({ err: '연결이 끊겼어요. 우편함에 들어갔는지 확인해 주세요.' }));
      busy = false;
      if (k.ok) { toast(`${k.to}님에게 ${SN[k.res]} ${Number(k.n).toLocaleString("ko-KR")}개 송금 완료!`); q('#asN').value = ''; form(); q('#asSt').textContent = `✔ ${k.to}님에게 ${SN[k.res]} ${Number(k.n).toLocaleString("ko-KR")}개 보냈어요`; }
      else { q('#asSt').textContent = k.err || '송금하지 못했어요'; sync() }
    });
    q('#asN').addEventListener('input', () => { const n = N(); q('#asN').value = n ? n.toLocaleString('ko-KR') : ''; sync() });
    form();
  }
  const sendCss = document.createElement('style'); sendCss.textContent = `
#admSend{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(15,12,29,.6);font-family:Jua,sans-serif}
#admSend .sp{background:#2b2546;border:4px solid #1c1830;border-radius:18px;padding:12px 14px 14px;color:#fff;box-shadow:0 8px 0 rgba(0,0,0,.35)}
#admSend .sph{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
#admSend .sph b{font-size:20px;font-weight:normal;color:#ffe066}
#admSend .spx{font:inherit;font-size:18px;width:32px;height:32px;border-radius:10px;border:2px solid #1c1830;background:#e8504a;color:#fff;padding:0}
#admSend .sps{color:#cfc8ee;font-size:13px;margin:10px 0 5px}
#admSend .as-res{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
#admSend .as-res button,#admSend .as-ppl button,#admSend .as-q button{display:flex;align-items:center;gap:6px;min-height:38px;padding:5px 8px;border:2px solid #1c1830;border-radius:10px;background:#3a3358;color:#fff;font:inherit;font-size:13px;text-align:left;cursor:pointer}
#admSend .as-res button :is(img,svg){width:20px;height:20px;object-fit:contain;flex:0 0 auto}
#admSend .as-res button span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#admSend .on{background:#6b5a2b!important;border-color:#ffd23c!important}
#admSend .as-ppl{display:grid;gap:4px;max-height:200px;overflow:auto}
#admSend .as-ppl button{justify-content:space-between}#admSend .as-ppl small{color:#cfc8ee;font-size:11px;white-space:nowrap}
#admSend .as-none{color:#cfc8ee;text-align:center;padding:8px}
#admSend input{width:100%;box-sizing:border-box;min-height:42px;border:2px solid #1c1830;border-radius:10px;background:#1c1830;color:#fff;font:inherit;font-size:18px;padding:6px 10px}
#admSend .as-q{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}#admSend .as-q button{min-height:32px;padding:3px 9px;font-size:12px}
#admSend #asReview{margin-top:6px;padding:14px;border:2px solid #ffd23c;border-radius:12px;background:#2a2340;line-height:1.7;text-align:center;font-size:15px}
#admSend #asReview :is(img,svg){display:inline-block;width:22px;height:22px;vertical-align:-5px}
#admSend #asReview small{color:#cfc8ee}
#admSend #asSt{min-height:20px;margin-top:8px;color:#ffe066;font-size:13px;text-align:center}
#admSend .as-act{display:flex;gap:6px;margin-top:6px}#admSend .as-act .btn{flex:1}`; document.head.appendChild(sendCss);
  draw = function () { const r = _draw2.apply(this, arguments); if (panel === 'admin' && window.IS_ADMIN && !document.getElementById('admUsersBtn')) { const b = document.createElement('button'); b.id = 'admUsersBtn'; b.className = 'btn'; b.textContent = '👥 유저 현황 (대장간 레벨 등)'; b.style.cssText = 'width:100%;margin:0 0 10px'; b.onclick = adminUsers; const s = document.createElement('button'); s.id = 'admSendBtn'; s.className = 'btn'; s.textContent = '💸 재화 송금 (모든 재화·열쇠)'; s.style.cssText = 'width:100%;margin:0 0 10px'; s.onclick = adminSend; $('mbody').prepend(b, s) } return r };
  const _act = act;
  act = function (a) { if (a === 'powinfo') { show(); return } return _act.apply(this, arguments) };
})();
