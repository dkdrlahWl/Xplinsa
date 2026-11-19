/* 특성: Lv.10부터 레벨마다 특성 포인트 1개. 원하는 방향으로 찍어서 캐릭터를 다르게 키움 */
(() => {
  const TL = [
    { k: 'atk', n: '맹공', d: '공격력', per: .005, max: 20, ic: 'sword' },
    { k: 'hp', n: '강철 몸', d: '최대 체력', per: .0075, max: 20, ic: 'hp' },
    { k: 'critd', n: '급소 공략', d: '치명타 피해', per: .005, max: 20, ic: 'crit' },
    { k: 'skill', n: '무기 숙련', d: '스킬 피해', per: .005, max: 20, ic: 'flag' },
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
    ST.critDamage += lv('critd') * .005;
    ST.skill += lv('skill') * .005;
    ST.regen *= 1 + lv('regen') * .015;
    if (!S.riding) ST.spd *= 1 + lv('spd') * .0025;
    ST.pow = Math.round(ST.atk * 12 + ST.maxhp * .8);
    return r;
  };

  const _tabs = upTabs;
  upTabs = function (on) {
    const h = _tabs.apply(this, arguments);
    if (S.lv < START) return h;
    const tab = '<div class="tab' + (on === 'tal' ? ' on' : '') + '" ' + (on === 'tal' ? '' : 'data-a="upt:tal"') + '>특성' + (left() > 0 ? ' <span style="color:#ff6b6b">❗</span>' : '') + '</div>';
    return h.replace(/<\/div>$/, tab + '</div>');
  };
  const pct = (t, n) => (t.k === 'regen' || t.k === 'skill' || t.k === 'critd' || t.k === 'atk' || t.k === 'hp' || t.k === 'spd') ? '+' + Math.round(n * t.per * 1000) / 10 + '%' : n;
  const st = document.createElement('style');
  st.textContent = `.tlg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;width:100%;box-sizing:border-box}
.tlc{min-width:0;box-sizing:border-box;overflow:hidden;display:flex;align-items:center;gap:5px;background:#2e2a48;border:2px solid #1c1830;border-radius:12px;padding:6px 6px 6px 4px}
.tlc .ti{flex:0 0 30px;height:30px}.tlc .ti>img,.tlc .ti>svg{width:100%;height:100%;object-fit:contain}
.tlc .tt{flex:1;min-width:0;line-height:1.15}.tlc .tt b{display:block;font-size:13px;font-weight:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tlc .tt small{display:block;font-size:11px!important;color:#9d93ff;white-space:nowrap}.tlc .tt i{display:block;font-style:normal;font-size:11px;color:#7be36a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tlc button{flex:0 0 36px;min-width:0;height:32px;font:inherit;font-size:15px;color:#fff;border:2px solid #1c1830;border-radius:9px;background:linear-gradient(#8fe26a,#4fb83a);box-shadow:inset 0 -3px 0 #2f8a24;padding:0}
.tlc button:disabled{background:#4a4466;box-shadow:none;color:#9d93ff}
.tlh{display:flex;justify-content:space-between;align-items:center;margin:2px 2px 8px;font-size:15px}.tlh b{font-weight:normal;font-size:20px}
.tlr{display:block;margin:10px auto 0;font:inherit;font-size:13px;color:#cfc8ee;background:#38324f;border:2px solid #1c1830;border-radius:10px;padding:5px 14px}
.tlr:disabled{opacity:.5}.tlr img,.tlr svg,.tlr .aimg{width:18px!important;height:18px!important;vertical-align:middle;display:inline-block}`;
  document.head.appendChild(st);
  function panelHTML() {
    const L = left(), can = used() && S.gem >= RESET;
    return `<div class="tlh"><span style="color:#cfc8ee">Lv.${START}부터 레벨업마다 1포인트</span><span>남은 포인트 <b style="color:${L ? '#7be36a' : '#cfc8ee'}">${L}</b><small style="color:#9d93ff">/${total()}</small></span></div><div class="tlg">` +
      TL.map(t => {
        const n = lv(t.k), mx = n >= t.max;
        return `<div class="tlc"><span class="ti">${IC[t.ic] || ''}</span><span class="tt"><b>${t.n} <small style="display:inline">${n}/${t.max}</small></b><small>${t.d}</small><i>${pct(t, n)}${mx ? ' MAX' : ' → ' + pct(t, n + 1)}</i></span>
          <button data-a="tal:${t.k}" ${!mx && L ? '' : 'disabled'}>${mx ? 'MAX' : '+1'}</button></div>`;
      }).join('') +
      `</div><button class="tlr" data-a="talreset" ${can ? '' : 'disabled'}>특성 초기화 · ${IC.gem}${RESET}</button>`;
  }
  // 남은 포인트가 있으면 강화 버튼에 느낌표
  setInterval(() => {
    const el = document.querySelector('[data-p="up"]'); if (!el) return;
    const on = S.lv >= START && left() > 0; let b = el.querySelector(':scope>.tdot');
    if (on && !b) { b = document.createElement('i'); b.className = 'ndot tdot'; b.textContent = '!'; el.appendChild(b) } else if (!on && b) b.remove();
  }, 500);
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
