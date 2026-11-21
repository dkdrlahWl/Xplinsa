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
  function rows(stats = ST) {
    const ST = stats;
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
  function inspectSave(save) {
    const previous = S, base = fresh();
    try {
      S = {...base, ...structuredClone(save), up:{...base.up, ...save.up}};
      S.slots = base.slots.map((_, i) => {
        const key = save.slots?.[i];
        const [type, grade] = String(key || '').split('_');
        return Object.hasOwn(WT, type) && Object.hasOwn(GR, grade) ? key : null;
      });
      S.slv = base.slv.map((lv, i) => Number(save.slv?.[i]) || lv);
      calc();
      return {...ST};
    } finally {
      S = previous;
      calc();
    }
  }
  async function adminUsers() {
    if (!window.IS_ADMIN) return;
    const j = await fetch('/api/adminsaves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: TOK() }) }).then(r => r.json()).catch(() => ({}));
    if (!Array.isArray(j.list)) { toast(j.err || '불러오지 못했어요'); return }
    document.getElementById('statpop')?.remove();
    const d = document.createElement('div'); d.id = 'statpop';
    d.innerHTML = '<div class="sp" style="width:min(94vw,460px)"><div class="sph"><b>전체 유저 능력치</b><button class="spx" aria-label="닫기">✕</button></div><p class="sps">마지막 저장 기준 · 유저를 눌러 상세 보기</p><div class="stat-users"></div></div>';
    const list = d.querySelector('.stat-users');
    if (!j.list.length) list.textContent = '등록된 유저가 없어요';
    j.list.sort((a,b) => Number(b.save?.lv || 0) - Number(a.save?.lv || 0));
    for (const u of j.list) {
      const save = u.save;
      const card = document.createElement('details');
      card.className = 'spr'; card.style.display = 'block';
      const title = document.createElement('summary');
      title.textContent = u.n + (save ? ' · Lv.' + (save.lv || 1) + ' · 챕터 ' + (save.ch || 1) : ' · 저장 기록 없음');
      card.append(title);
      if (save) card.addEventListener('toggle', () => {
        if (!card.open || card.childElementCount > 1) return;
        const content = document.createElement('div');
        try {
          const stats = inspectSave(save);
          const hero = HERO.find(h => h.k === save.hero) || HERO[0];
          const pet = PET.BY[save.pet]?.n || '미장착';
          const mount = MOUNT.BY[save.mount]?.n || '미장착';
          const equipment = Array.from({length:6}, (_,i) => {
            const key = save.slots?.[i], [type, grade] = String(key || '').split('_');
            return Object.hasOwn(WT,type) && Object.hasOwn(GR,grade) ? wName(key)+' Lv.'+Math.min(Number(save.slv?.[i])||1,GMAX[grade]) : '비어 있음';
          });
          content.innerHTML = '<div class="spp">⚡ ' + fmt(stats.pow) + '</div>' + rows(stats);
          const progress = document.createElement('p');
          progress.textContent = '승급 ' + (save.promotion || 0) + '차 · 대장간 Lv.' + ((save.step || 0)+1) + ' · 탑 ' + (save.tower?.clear || 0) + '층 · 챕터 3 임무 ' + (save.chs?.[3]?.q || 0) + '/100';
          const loadout = document.createElement('p');
          loadout.textContent = '영웅 ' + hero.n + ' · 펫 ' + pet + ' · 탈것 ' + mount;
          content.append(progress, loadout);
          const slots = document.createElement('ol');
          for (const name of equipment) { const slot = document.createElement('li'); slot.textContent = name; slots.append(slot); }
          content.append(slots);
        } catch { content.textContent = '저장 기록에서 능력치를 계산할 수 없어요'; }
        card.append(content);
      });
      list.append(card);
    }
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.spx')) d.remove() });
    document.body.appendChild(d);
  }
  const _draw2 = draw;
  // 관리자 송금 (링피지 방식): 재화 고르기 → 받는 사람 고르기 → 수량 → 확인 화면 → 송금. 받는 사람 우편함으로 바로 들어감
  const SEND = [['gold', '금화'], ['gem', '보석'], ['cry', '크리스탈'], ['orb', '오브'], ['rb', '무지개 오브'], ['scr', '주문서'], ['myth', '신화석'], ['scl', '용의 비늘'],
    ['b1', '초보자의 무기상자 열쇠'], ['b2', '전문가의 무기상자 열쇠'], ['b3', '전사의 무기상자 열쇠'], ['pet', '펫 알 상자 교환권'], ['mount', '탈것 상자 교환권'], ['lv', '레벨 설정']];
  const SN = Object.fromEntries(SEND);
  const sIcon = k => k === 'lv' ? '⭐' : /^(b[123]|pet|mount)$/.test(k) ? '🔑' : (IC[k] || '');
  async function adminSend() {
    const j = await fetch('/api/adminusers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || '') }) }).then(r => r.json()).catch(() => ({}));
    if (!j.list) { toast(j.err || '불러오지 못했어요'); return }
    const people = j.list.filter(u => u.id && u.id !== 'ehgus').sort((a, b) => (b.on - a.on) || (b.lv - a.lv));
    let res = 'gold', to = null, review = null, busy = false;
    const d = document.createElement('div'); d.id = 'admSend'; 
    d.innerHTML = `<div class="sp" style="width:min(94vw,400px);max-height:88vh;overflow:auto"><div class="sph"><b>💸 재화 송금</b><button class="spx">✕</button></div>
      <div id="asForm"><div class="sps" style="margin-top:0">보낼 재화</div><div class="as-res">${SEND.map(([k, n]) => `<button type="button" data-res="${k}">${sIcon(k)}<span>${n}</span></button>`).join('')}</div>
      <div class="sps">받는 사람 · 🟢 접속 중</div><div class="as-ppl">${people.map(u => `<button type="button" data-to="${u.id}"><b>${u.on ? '🟢' : '⚪'} ${u.n}</b><small>Lv.${u.lv} · ${u.ch}챕 · ID ${u.id}</small></button>`).join('') || '<div class="as-none">보낼 수 있는 유저가 없어요</div>'}</div>
      <div class="sps">수량 (레벨 설정은 바꿀 레벨)</div><input id="asN" inputmode="numeric" placeholder="보낼 수량" autocomplete="off"><div class="as-q">${[[1, '1'], [10, '10'], [100, '100'], [1000, '1천'], [10000, '1만'], [100000, '10만'], [1000000, '100만'], [100000000, '1억']].map(([n, l]) => `<button type="button" data-add="${n}">+${l}</button>`).join('')}<button type="button" data-add="0">초기화</button></div></div>
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
        q('#asReview').innerHTML = res === 'lv' ? `<b>${review.name}</b> (ID ${review.to}) 계정의<br>⭐ <b>레벨을 Lv.${review.n}</b>로 바꿉니다.<br><small>경험치는 0이 되고, 접속 중이면 바로 다시 불러와요.</small>` : `<b>${review.name}</b> (ID ${review.to}) 계정에<br>${sIcon(res)} <b>${SN[res]} ${review.n.toLocaleString("ko-KR")}개</b>를 보냅니다.<br><small>받는 사람 우편함으로 바로 들어가요.</small>`;
        return;
      }
      busy = true; sync(); q('#asSt').textContent = '송금 중…';
      const k = await fetch('/api/admsend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || ''), to: review.to, res: review.res, n: review.n }) }).then(r => r.json()).catch(() => ({ err: '연결이 끊겼어요. 우편함에 들어갔는지 확인해 주세요.' }));
      busy = false;
      if (k.ok) { const msg = k.res === 'lv' ? `${k.to}님 레벨을 Lv.${k.n}로 바꿨어요` : `${k.to}님에게 ${SN[k.res]} ${Number(k.n).toLocaleString("ko-KR")}개 보냈어요`; toast(msg); q('#asN').value = ''; form(); q('#asSt').textContent = '✔ ' + msg; }
      else { q('#asSt').textContent = k.err || '송금하지 못했어요'; sync() }
    });
    q('#asN').addEventListener('input', () => { const n = N(); q('#asN').value = n ? n.toLocaleString('ko-KR') : ''; sync() });
    form();
  }
  // 전체 우편: 멘트 + 보상 여러 개 → 모든 유저 우편함으로
  async function adminMailAll() {
    const items = {}; let res = 'gem', busy = false, review = false;
    const d = document.createElement('div'); d.id = 'admSend';
    d.innerHTML = `<div class="sp" style="width:min(94vw,400px);max-height:88vh;overflow:auto"><div class="sph"><b>📮 전체 우편</b><button class="spx">✕</button></div>
      <div id="amForm"><div class="sps" style="margin-top:0">우편 내용 (최대 80자)</div><textarea id="amMsg" maxlength="80" rows="2" placeholder="예) 점검 보상이에요! 즐거운 모험 되세요"></textarea>
      <div class="sps">보상 (없어도 됨) · 재화 고르고 수량 넣고 추가</div><div class="as-res">${SEND.filter(([k]) => k !== 'lv').map(([k, n]) => `<button type="button" data-res="${k}">${sIcon(k)}<span>${n}</span></button>`).join('')}</div>
      <div class="am-add"><input id="amN" inputmode="numeric" placeholder="수량" autocomplete="off"><button type="button" class="btn" id="amAdd">추가</button></div>
      <div id="amList"></div></div><div id="asReview" hidden></div><div id="asSt"></div>
      <div class="as-act"><button type="button" class="btn" id="asBack" hidden>뒤로</button><button type="button" class="btn" id="asGo" disabled>우편 내용 확인</button></div></div>`;
    document.body.appendChild(d);
    const q = s => d.querySelector(s), N = () => Number(q('#amN').value.replace(/[^0-9]/g, '')) || 0, msg = () => q('#amMsg').value.trim();
    const list = () => Object.entries(items).map(([k, n]) => `<span class="am-it" data-del="${k}">${sIcon(k)} ${SN[k]} ${n.toLocaleString('ko-KR')} ✕</span>`).join('');
    const sync = () => { d.querySelectorAll('[data-res]').forEach(b => b.classList.toggle('on', b.dataset.res === res)); q('#amList').innerHTML = list() || '<small>보상 없음 (멘트만)</small>'; q('#asGo').disabled = busy || !msg() };
    const form = () => { review = false; q('#amForm').hidden = false; q('#asReview').hidden = true; q('#asBack').hidden = true; q('#asGo').textContent = '우편 내용 확인'; sync() };
    d.addEventListener('click', async e => {
      if (e.target === d || e.target.closest('.spx')) { if (!busy) d.remove(); return }
      const r = e.target.closest('[data-res]'); if (r) { res = r.dataset.res; sync(); q('#amN').focus(); return }
      const del = e.target.closest('[data-del]'); if (del) { delete items[del.dataset.del]; sync(); return }
      if (e.target.closest('#amAdd')) { const n = N(); if (n >= 1) { items[res] = n; q('#amN').value = '' } sync(); return }
      if (e.target.closest('#asBack')) { if (!busy) form(); return }
      if (!e.target.closest('#asGo') || q('#asGo').disabled) return;
      if (!review) { review = true; q('#amForm').hidden = true; q('#asReview').hidden = false; q('#asBack').hidden = false; q('#asGo').textContent = '전체 발송';
        q('#asReview').innerHTML = `<b>모든 유저</b> 우편함에 보냅니다.<br>📮 ${msg().replace(/[<>&]/g, '')}<br>${list().replace(/ ✕/g, '') || '<small>보상 없음</small>'}`; return }
      busy = true; sync(); q('#asSt').textContent = '보내는 중…';
      const k = await fetch('/api/admmail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || ''), msg: msg(), items }) }).then(r => r.json()).catch(() => ({ err: '연결이 끊겼어요. 다시 보내기 전에 우편이 갔는지 확인해 주세요.' }));
      busy = false;
      if (k.ok) { toast(`우편 ${k.cnt}명에게 보냈어요!`); for (const x in items) delete items[x]; q('#amMsg').value = ''; form(); q('#asSt').textContent = `✔ ${k.cnt}명에게 보냈어요` }
      else { q('#asSt').textContent = k.err || '보내지 못했어요'; sync() }
    });
    q('#amMsg').addEventListener('input', sync);
    q('#amN').addEventListener('input', () => { const n = N(); q('#amN').value = n ? n.toLocaleString('ko-KR') : '' });
    q('#amN').addEventListener('keydown', e => { if (e.key === 'Enter') q('#amAdd').click() });
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
#admSend textarea{width:100%;box-sizing:border-box;border:2px solid #1c1830;border-radius:10px;background:#1c1830;color:#fff;font:inherit;font-size:15px;padding:8px 10px;resize:none}
#admSend .am-add{display:flex;gap:6px;margin-top:6px}#admSend .am-add input{flex:1}#admSend .am-add .btn{flex:0 0 80px}
#admSend #amList{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;color:#cfc8ee}#admSend .am-it{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:10px;background:#6b5a2b;border:2px solid #ffd23c;font-size:13px;cursor:pointer}#admSend .am-it :is(img,svg){width:18px;height:18px}
#admSend #asReview span{display:inline-flex;align-items:center;gap:3px;margin:2px 4px}#admSend #asReview span :is(img,svg){width:18px;height:18px}
#admSend .as-act{display:flex;gap:6px;margin-top:6px}#admSend .as-act .btn{flex:1}`; document.head.appendChild(sendCss);
  draw = function () { const r = _draw2.apply(this, arguments); if (panel === 'admin' && window.IS_ADMIN && !document.getElementById('admUsersBtn')) { const b = document.createElement('button'); b.id = 'admUsersBtn'; b.className = 'btn'; b.textContent = '전체 유저 능력치 · 장착 현황'; b.style.cssText = 'width:100%;margin:0 0 10px'; b.onclick = adminUsers; const s = document.createElement('button'); s.id = 'admSendBtn'; s.className = 'btn'; s.textContent = '💸 재화 송금 (모든 재화·열쇠)'; s.style.cssText = 'width:100%;margin:0 0 10px'; s.onclick = adminSend; const m = document.createElement('button'); m.id = 'admMailBtn'; m.className = 'btn'; m.textContent = '📮 전체 우편 (멘트 + 보상)'; m.style.cssText = 'width:100%;margin:0 0 10px'; m.onclick = adminMailAll; const mt = document.createElement('div'); mt.style.cssText = 'display:flex;gap:6px;margin:0 0 10px'; mt.innerHTML = '<button class="btn" style="flex:1" data-mt="1">🔧 점검 시작</button><button class="btn" style="flex:1" data-mt="0">✅ 점검 종료</button>'; mt.onclick = async e => { const x = e.target.closest('[data-mt]'); if (!x) return; const on = x.dataset.mt === '1'; if (on && !confirm('관리자 외 모든 유저 접속을 막을까요?')) return; const j = await fetch('/api/maint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: (sessionStorage.xp_tok || ''), on }) }).then(r => r.json()).catch(() => ({})); toast(j.ok ? (j.on ? '점검 시작: 관리자 외 접속 차단' : '점검 종료: 모두 접속 가능') : (j.err || '실패')) }; $('mbody').prepend(b, s, m, mt) } return r };
  const _act = act;
  act = function (a) { if (a === 'powinfo') { show(); return } return _act.apply(this, arguments) };
})();

// PC 넓은 화면 렉 수정: 바닥 조각 캐시가 12개로 고정이라 넓은 화면(15개 이상 보임)에서 매 프레임 바닥을 다시 그렸음
// → 화면에 보이는 조각 수 + 여유만큼 캐시하도록 바꿈 (game.html은 안 건드려서 접속 중인 사람은 새로고침 안 됨, 다음 접속부터 적용)
(function () {
  if (typeof groundChunk !== 'function' || typeof drawGround !== 'function' || typeof GC_ === 'undefined') return;
  let lim = 12;
  const _dg = drawGround;
  drawGround = function (x0, y0, x1, y1) {
    lim = Math.max(12, (Math.floor(x1 / GCS) - Math.floor(x0 / GCS) + 3) * (Math.floor(y1 / GCS) - Math.floor(y0 / GCS) + 3));
    return _dg.apply(this, arguments);
  };
  groundChunk = function (cx, cy, K) {
    const key = cx + ',' + cy; let c = GC_.map.get(key);
    if (c) { GC_.map.delete(key); GC_.map.set(key, c); return c }
    const W = Math.ceil(GCS * K) + 2; c = document.createElement('canvas'); c.width = W; c.height = W; const g = c.getContext('2d'); if (!g) return null;
    g.setTransform(K, 0, 0, K, -cx * GCS * K + 1, -cy * GCS * K + 1); g.lineWidth = 2.2; g.strokeStyle = OLC; g.lineJoin = 'round';
    const old = ctx; ctx = g; try { groundStatic(cx * GCS - 4, cy * GCS - 4, (cx + 1) * GCS + 4, (cy + 1) * GCS + 4) } catch (e) { console.error(e) } ctx = old;
    GC_.map.set(key, c); while (GC_.map.size > lim) GC_.map.delete(GC_.map.keys().next().value);
    return c;
  };
})();
