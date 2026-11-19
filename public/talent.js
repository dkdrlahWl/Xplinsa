/* 특성: Lv.10부터 레벨마다 특성 포인트 1개. 원하는 방향으로 찍어서 캐릭터를 다르게 키움 */
(() => {
  const TL = [
    { k: 'atk', n: '맹공', d: '공격력', per: .005, max: 20, ic: 'sword' },
    { k: 'hp', n: '강철 몸', d: '최대 체력', per: .0075, max: 20, ic: 'hp' },
    { k: 'critd', n: '급소 공략', d: '치명타 피해', per: .01, max: 20, ic: 'crit' },
    { k: 'skill', n: '무기 숙련', d: '스킬 피해', per: .01, max: 20, ic: 'flag' },
    { k: 'regen', n: '재생', d: '체력 회복', per: .015, max: 20, ic: 'regen' },
    { k: 'spd', n: '질풍', d: '이동 속도', per: .0025, max: 15, ic: 'spd' },
  ];
  const START = 10, RESET = 100;
  const T0 = () => (S.tal = S.tal || {});
  const total = () => Math.max(0, S.lv - START + 1);
  const used = () => TL.reduce((a, t) => a + (T0()[t.k] || 0), 0);
  const left = () => total() - used();
  const lv = k => T0()[k] || 0;

  const _calc = calc;
  calc = function () {
    const r = _calc.apply(this, arguments);
    if (!S.tal) return r;
    ST.atk = Math.round(ST.atk * (1 + lv('atk') * .005));
    ST.maxhp = Math.round(ST.maxhp * (1 + lv('hp') * .0075));
    ST.critDamage += lv('critd') * .01;
    ST.skill += lv('skill') * .01;
    ST.regen *= 1 + lv('regen') * .015;
    if (!S.riding) ST.spd *= 1 + lv('spd') * .0025;
    ST.pow = Math.round(ST.atk * 12 + ST.maxhp * .8);
    return r;
  };

  const _tabs = upTabs;
  upTabs = function (on) {
    const h = _tabs.apply(this, arguments);
    if (S.lv < START) return h;
    const tab = '<div class="tab' + (on === 'tal' ? ' on' : '') + '" ' + (on === 'tal' ? '' : 'data-a="upt:tal"') + '>특성' + (left() > 0 && on !== 'tal' ? ' <span style="color:#ff6b6b">●</span>' : '') + '</div>';
    return h.replace(/<\/div>$/, tab + '</div>');
  };
  const pct = (t, n) => (t.k === 'regen' || t.k === 'skill' || t.k === 'critd' || t.k === 'atk' || t.k === 'hp' || t.k === 'spd') ? '+' + Math.round(n * t.per * 1000) / 10 + '%' : n;
  function panelHTML() {
    const L = left();
    return `<div class="note" style="text-align:center">Lv.${START}부터 레벨이 오를 때마다 <b style="color:#ffe066">특성 포인트 1개</b>를 받아요.<br>어디에 찍느냐에 따라 친구와 다르게 성장해요.</div>
      <div style="text-align:center;font-size:22px;margin:8px 0">남은 포인트 <b style="color:${L ? '#7be36a' : '#cfc8ee'}">${L}</b> <small style="color:#9d93ff">/ ${total()}</small></div>` +
      TL.map(t => {
        const n = lv(t.k), mx = n >= t.max;
        return `<div class="row"><div class="ic">${IC[t.ic] || ''}</div><div class="tx"><div class="t">${t.n} <small style="color:#9d93ff">${n}/${t.max}</small></div>
          <div class="l">${t.d} <b style="color:#7be36a">${pct(t, n)}</b>${mx ? '' : ' → ' + pct(t, n + 1)}</div></div>
          ${mx ? '<button class="btn no">MAX</button>' : `<button class="btn${L ? '' : ' no'}" data-a="tal:${t.k}" ${L ? '' : 'disabled'}>+1</button>`}</div>`;
      }).join('') +
      `<div style="text-align:center;margin-top:10px"><button class="btn${used() && S.gem >= RESET ? '' : ' no'}" data-a="talreset" ${used() && S.gem >= RESET ? '' : 'disabled'}>특성 초기화 · ${IC.gem}${RESET}</button></div>`;
  }
  const _draw = draw;
  draw = function () {
    if (panel === 'up' && window.UPT === 'tal') {
      if (S.lv < START) window.UPT = 'base';
      else { $('mtitle').textContent = '강화 · 특성'; cur(['gem', 'gold']); $('mbody').innerHTML = panelHTML(); $('mfoot').innerHTML = upTabs('tal'); return }
    }
    return _draw.apply(this, arguments);
  };
  const _act = act;
  act = function (a) {
    const [k, v] = String(a).split(':');
    if (k === 'tal') { const t = TL.find(x => x.k === v); if (t && left() > 0 && lv(v) < t.max) { T0()[v] = lv(v) + 1; calc(); save(); window.SFX && SFX.play('upgrade', { v: .5 }) } draw(); return }
    if (k === 'talreset') { if (used() && S.gem >= RESET) { S.gem -= RESET; S.tal = {}; calc(); save(); toast('특성을 초기화했어요') } draw(); return }
    return _act.apply(this, arguments);
  };
  window.TALENT = { left, total };
  setTimeout(() => { try { calc() } catch (e) {} }, 0);
})();
