(() => {
  const art = 'assets/hud_mailbox.webp';
  const style = document.createElement('style');
  style.textContent = `
#mailBtn{position:relative;align-self:flex-end;width:67px;height:58px;padding:0 0 2px;border:0;display:grid;place-items:end center;background:transparent;pointer-events:auto;cursor:pointer}
#mailBtn img{position:absolute;top:0;left:50%;transform:translateX(-50%);width:53px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 4px #140b2c)}
#mailBtn b{position:relative;padding:4px 8px;border:1px solid #ffcd77;border-radius:9px;background:#261640;color:#fff6e0;font-size:12px;line-height:1}
#mailBtn:active{transform:scale(.94)}
.mail-panel{padding:12px;border:1px solid #b78959;border-radius:15px;background:radial-gradient(ellipse at top,#53357e,#241838 68%);color:#fff2dc}
.mail-panel header{text-align:center;padding:4px 0 12px}
.mail-panel header img{width:88px;height:76px;object-fit:contain}
.mail-panel header p{margin:2px 0;color:#ffe0a0;font-size:15px}
.mail-panel ul{list-style:none;margin:0;padding:0}
.mail-panel li{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px;padding:9px;border:1px solid #86618d;border-radius:10px;background:#20142e;font-size:14px}
.mail-panel li strong{color:#ffe4a5;text-align:right}
.mail-panel .mail-empty{text-align:center;color:#e4cceb;padding:14px 4px}
.mail-panel button{display:block;margin:10px auto 0;min-height:44px;padding:6px 22px;border:1px solid #f6ca82;border-radius:10px;background:linear-gradient(#a86634,#673a3e);color:#fff8e2;font:inherit}
.mail-panel button:disabled{opacity:.55}
`;
  document.head.appendChild(style);
  let mail = null, loading = false, claiming = false, failed = false;
  const number = new Intl.NumberFormat('ko-KR');
  const openPanel = () => panel === 'mailbox';
  const refreshPanel = () => { if (openPanel()) draw(); };
  const KN = { b1: '초보자의 무기상자 열쇠', b2: '전문가의 무기상자 열쇠', b3: '전사의 무기상자 열쇠', pet: '펫 알 상자 교환권', mount: '탈것 상자 교환권' };
  const amount = m => ['gold', 'gem'].filter(k => m[k] > 0).map(k => `${RWN[k]} ${number.format(m[k])}`).concat(Object.entries(m.keys || {}).map(([k, n]) => `${KN[k] || k} ${n}개`)).join(' · ');

  async function refresh() {
    if (loading || claiming) return;
    loading = true;
    try {
      const result = await mkApi('inbox');
      if (!Array.isArray(result.mail)) throw Error('mail');
      mail = result.mail;
      failed = false;
    } catch {
      failed = true;
    } finally {
      loading = false;
      refreshPanel();
    }
  }

  async function collect() {
    if (claiming || loading || !mail?.length) return;
    claiming = true;
    refreshPanel();
    try {
      const result = await mkApi('claim');
      if (!Array.isArray(result.mail)) throw Error('mail');
      const rewards = {}, gotKeys = [];
      for (const m of result.mail) {
        for (const k of ['gold', 'gem']) if (m[k] > 0) rewards[k] = (rewards[k] || 0) + m[k];
        for (const [k, n] of Object.entries(m.keys || {})) { if (!KN[k] || !(n > 0)) continue; S.keys = S.keys || {}; S.keys[k] = (S.keys[k] || 0) + n; gotKeys.push(KN[k] + ' ' + n + '개') }
      }
      mail = [];
      if (Object.keys(rewards).length || gotKeys.length) { toast([Object.keys(rewards).length ? give(rewards) : ''].concat(gotKeys).filter(Boolean).join(', ')); save(); }
    } catch {
      toast('우편을 받지 못했어요. 다시 확인해 주세요.');
    } finally {
      claiming = false;
      refresh();
      refreshPanel();
    }
  }

  const previousDraw = draw;
  draw = function () {
    if (!openPanel()) return previousDraw.apply(this, arguments);
    $('mtitle').textContent = '우편함';
    cur(['gem', 'gold']);
    $('mfoot').innerHTML = '';
    const rows = mail?.map(m => `<li><span>${m.t || '거래소 판매 대금'}</span><strong>${amount(m) || '0'}</strong></li>`).join('');
    const status = failed ? '우편을 불러오지 못했어요.' : mail ? '받을 우편이 없어요.' : '우편을 불러오는 중…';
    $('mbody').innerHTML = `<section class="mail-panel"><header><img src="${art}" alt=""><p>받을 우편 ${mail?.length ?? 0}건</p></header>
      ${rows ? `<ul>${rows}</ul><button data-a="mailcollect" ${claiming || loading ? 'disabled' : ''}>모두 받기</button>`
        : `<div class="mail-empty">${status}</div>${failed ? '<button data-a="mailrefresh">다시 불러오기</button>' : ''}`}</section>`;
  };
  const previousAct = act;
  act = function (action) {
    if (action === 'mailcollect') return collect();
    if (action === 'mailrefresh') return refresh();
    return previousAct.apply(this, arguments);
  };

  function orderButton() {
    const queue = $('quests');
    if (!queue) return;
    let button = $('mailBtn');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'mailBtn';
      button.innerHTML = `<img src="${art}" alt=""><b>우편함</b><i class="ndot" hidden></i>`;
      button.addEventListener('click', e => { e.stopPropagation(); open('mailbox'); refresh(); });
      button.addEventListener('pointerdown', e => e.stopPropagation());
    }
    const mount = $('mountBtn'), pass = $('passBtn');
    if (mount && mount.nextSibling !== button) mount.after(button);
    else if (!mount && pass && button.nextSibling !== pass) pass.before(button);
    else if (!button.parentNode) queue.appendChild(button);
    button.style.display = combatArena ? 'none' : '';
    const count = mail?.length || 0, badge = button.querySelector('.ndot');
    badge.hidden = !count;
    badge.textContent = '!';
  }
  orderButton();
  setInterval(orderButton, 500);
  setTimeout(refresh, 4000);
  setInterval(refresh, 30000);
})();
