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
  const _act = act;
  act = function (a) { if (a === 'powinfo') { show(); return } return _act.apply(this, arguments) };
})();
