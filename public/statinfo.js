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
      <div class="sps">모루 1번 = 크리스탈 5개 · 무기 제작 확률 (지금${mx ? '' : ' → 다음 레벨'})</div>${rows}
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
    const j = await fetch('/api/adminusers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: localStorage.getItem('xp_token') }) }).then(r => r.json()).catch(() => ({}));
    if (!j.list) { toast(j.err || '불러오지 못했어요'); return }
    let d = document.getElementById('statpop'); if (d) d.remove(); d = document.createElement('div'); d.id = 'statpop';
    d.innerHTML = `<div class="sp" style="width:min(94vw,420px)"><div class="sph"><b>유저 현황</b><button class="spx">✕</button></div>
      <div class="sps" style="margin-top:0">대장간 레벨 높은 순 · 🟢 접속 중</div>` + j.list.map(u => `<div class="spr" style="font-size:13px"><span style="flex:0 0 auto;color:#fff">${u.on ? '🟢' : '⚪'} ${u.n}</span><span></span><em>대장간 Lv.${u.smith} · Lv.${u.lv} · ${u.ch}챕 · ${u.promo}차 · 💎${fmt(u.gem)} · 크리 ${fmt(u.cry)}</em></div>`).join('') + '</div>';
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('.spx')) d.remove() });
    document.body.appendChild(d);
  }
  const _draw2 = draw;
  draw = function () { const r = _draw2.apply(this, arguments); if (panel === 'admin' && window.IS_ADMIN && !document.getElementById('admUsersBtn')) { const b = document.createElement('button'); b.id = 'admUsersBtn'; b.className = 'btn'; b.textContent = '👥 유저 현황 (대장간 레벨 등)'; b.style.cssText = 'width:100%;margin:0 0 10px'; b.onclick = adminUsers; $('mbody').prepend(b) } return r };
  const _act = act;
  act = function (a) { if (a === 'powinfo') { show(); return } return _act.apply(this, arguments) };
})();
