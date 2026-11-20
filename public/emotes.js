window.EMOTES = (() => {
  const names = [
    '왕오리의 여유','눈물 폭포','깜짝 아홀로틀','개구리 폭소','졸린 치즈냥',
    '화난 아기용','토끼 쌍따봉','놀란 버섯','씰룩 유령','슬라임 하트',
    '해적 햄찌','흘겨보는 올빼미','빙글 박쥐','시바의 박수','삐진 선인장',
    '여우의 뽀뽀','천상의 그리핀','펭귄의 실수','능청 너구리','악어의 눈물',
    '초롱 검은냥','꽃양의 미소','버섯 마법사 한숨','안녕 거북이','선글라스 사자',
    '덜덜 눈사람','레서판다 축하','작전 짜는 족제비','무지개 유니콘','문어 브이',
    '수달 한손 따봉','수줍은 고슴도치','달팽이의 기다림','집게발 분노','신난 병아리',
    '머쓱한 늑대','오리너구리 지각','뚱한 얼음 골렘','깜짝 카멜레온','물개의 별 응원',
    '반짝 해파리','장수풍뎅이 근육 자랑','겁먹은 도토리','빵 터진 앵무새','울컥 꼬마 해골',
    '으쓱 거위','놀란 카피바라','해마 윙크','광부 두더지','등불 나방 하트눈',
    '흑룡 날개 따봉','돼지의 손수건','얼어붙은 북극곰','배 잡는 다람쥐','인사하는 사슴',
    '도롱뇽 양손 뽀뽀','메롱 보라 슬라임','삐딱한 오소리','트리케라 박수','파티 족제비',
    '비버 하품','홍학의 이마 짚기','새침한 블루베리 요정','복어 볼빵빵','카나리아 확성기',
    '눈치 보는 금붕어','알파카 눈웃음','베개 안은 달님','어깨 으쓱 랍스터','코알라의 큰 별',
    '코끼리의 꽃 선물','리트리버 쌍따봉','구르는 아르마딜로','발 동동 흰토끼','이마 짚고 웃는 게코',
    '승리의 불사조','까마귀의 곁눈질','우는 양파 요정','물범 지느러미 하트','얼빠진 잠자리',
    '낮잠 황금 딱정벌레','대나무 뒤 판다','버블 친칠라','다급한 아기 그리핀','꾸벅 사막여우',
    '뾰족별의 환호','배 잡는 아기 하마','사마귀의 느린 박수','망토 속 줄무늬냥','왕관 든 홍학',
    '상어 지느러미 따봉','식은땀 토마토','올빼미의 번뜩임','부끄러운 나비','낙엽 트렌트',
    '주먹 흔드는 코기','메롱 흰담비','선글라스 까마귀','눈물 나는 산양','마법봉 고슴도치',
  ];
  const price = 20;
  const atlases = [];
  const atlasUrl = index => 'assets/emotes_' + index + '.webp?v=1';
  function atlasImage(index){
    if(!atlases[index]){
      const image = new Image();
      image.decoding = 'async';
      image.src = atlasUrl(index);
      atlases[index] = image;
    }
    return atlases[index];
  }
  const valid = id => Number.isInteger(id) && id >= 0 && id < names.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();
  const control = document.createElement('div');
  control.className = 'emote-control';
  control.innerHTML = '<button id="emote-toggle" class="lbb" type="button" aria-label="이모티콘" aria-description="누르면 빠른 슬롯, 길게 누르면 설정" aria-controls="emote-quick" aria-expanded="false"></button><div id="emote-quick" class="emote-quick" role="group" aria-label="빠른 이모티콘" hidden></div>';
  $('game').append(control);
  const toggle = control.querySelector('button'), quick = control.querySelector('.emote-quick');
  const settings = document.createElement('dialog');
  settings.className = 'emote-settings';
  settings.setAttribute('aria-labelledby','emote-title');
  settings.innerHTML = '<header><h2 id="emote-title">이모티콘 설정</h2><button type="button" data-close>닫기</button></header><p>바꿀 슬롯을 고른 뒤 이모티콘을 선택하세요.</p><div class="emote-slots" role="group" aria-label="빠른 이모티콘 슬롯"></div><div class="emote-grid" role="group" aria-label="이모티콘 100종"></div><footer class="emote-shop"><span aria-live="polite"></span><button type="button" data-buy hidden></button></footer>';
  $('game').append(settings);
  const slotButtons = settings.querySelector('.emote-slots');
  const grid = settings.querySelector('.emote-grid');
  const buy = settings.querySelector('[data-buy]');
  const status = settings.querySelector('.emote-shop span');
  const unsynced = new Set();
  let selected = 0, choice = null, hold = null, longPress = false, ready = 0;

  const owned = () => Array.isArray(S.emoteOwned) ? S.emoteOwned.filter(valid) : [];
  const slots = () => Array.from({length:3},(_,i) => owned().includes(S.emoteSlots?.[i]) ? S.emoteSlots[i] : null);


  function icon(id) {
    if(id===null)return '<span class="emote-empty" aria-hidden="true">＋</span>';
    const cell = id % 15, url = atlasUrl(Math.floor(id / 15));
    return '<span class="emote-icon" aria-hidden="true" style="background-image:url(' + url + ');background-position:' +
      (cell % 5 * 25) + '% ' + (Math.floor(cell / 5) * 50) + '%"></span>';
  }
  grid.innerHTML = names.map((name,id) => '<button type="button" data-emote="'+id+'" title="'+name+'">'+icon(id)+'<strong>'+name+'</strong></button>').join('');
  function setQuick(open) {
    quick.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if(open)quick.innerHTML = slots().map((id,i) => '<button type="button" '+(id===null?'data-empty="'+i+'" aria-label="'+(i+1)+'번 슬롯 설정"':'data-emote="'+id+'" aria-label="'+names[id]+'"')+'>'+icon(id)+'</button>').join('');
  }
  function updateSettings() {
    const equipped = slots();
    slotButtons.innerHTML = equipped.map((id,i) => '<button type="button" data-slot="'+i+'" aria-pressed="'+(i===selected)+'">'+icon(id)+(i+1)+'번</button>').join('');
    const unlocked = new Set(owned());
    for(const button of grid.children){
      const id=Number(button.dataset.emote), locked=!unlocked.has(id);
      button.classList.toggle('emote-locked',locked);
      button.setAttribute('aria-pressed',String(choice===id||equipped[selected]===id));
      button.setAttribute('aria-label', names[id]+(locked?', 보석 20개':', 보유 중'));
    }
    buy.hidden=choice===null;
    buy.disabled=S.gem<price;
    buy.innerHTML=IC.gem+' '+price+' 구매';
    status.innerHTML=(choice===null?'':names[choice]+' · ')+'보유 '+IC.gem+' '+fmt(S.gem);
  }
  function openSettings(slot=0) {
    setQuick(false);
    selected = slot;choice=null;
    updateSettings();
    if(!settings.open)settings.showModal();
  }
  async function send(id) {
    setQuick(false);
    if(!valid(id)||!owned().includes(id)||P.dead||performance.now()<ready)return;
    if(!window.NET?.on()){toast('서버에 연결되면 이모티콘을 보낼 수 있어요');return}
    ready=Infinity;
    try{
      if(await NET.emote(id,unsynced.has(id)))unsynced.delete(id);
      else toast('이모티콘을 보내지 못했어요');
    }finally{ready=performance.now()+2250}
  }
  function stopHold() {
    if(hold)clearTimeout(hold.timer);
    hold=null;
  }
  // 이동 중(조이스틱 누른 손가락이 따로 있어도) 눌리게: click 대신 pointer 이벤트로 처리
  toggle.addEventListener('pointerdown',e=>{
    if(e.button>0)return;
    e.preventDefault();e.stopPropagation();
    longPress=false;
    stopHold();
    hold={id:e.pointerId,x:e.clientX,y:e.clientY,timer:setTimeout(()=>{
      stopHold();
      longPress=true;
      openSettings();
    },520)};
  });
  toggle.addEventListener('pointermove',e=>{
    if(hold&&e.pointerId===hold.id&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>12)stopHold();
  });
  toggle.addEventListener('pointerup',e=>{
    e.preventDefault();e.stopPropagation();
    const tap=hold&&e.pointerId===hold.id;stopHold();
    if(!tap||longPress){longPress=false;return}
    setQuick(quick.hidden);
  });
  for(const event of ['pointercancel','pointerleave'])toggle.addEventListener(event,stopHold);
  toggle.addEventListener('contextmenu',e=>{e.preventDefault()});
  toggle.addEventListener('click',e=>{
    e.stopPropagation();
    if(e.detail)return; // 마우스/터치는 pointerup에서 처리함 (키보드 Enter만 여기로)
    if(e.shiftKey){openSettings();return}
    setQuick(quick.hidden);
  });
  quick.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    const button=e.target.closest('[data-emote]');
    if(button)send(Number(button.dataset.emote));
    const empty=e.target.closest('[data-empty]');
    if(empty)openSettings(Number(empty.dataset.empty));
  });
  quick.addEventListener('click',e=>{
    e.stopPropagation();
    if(e.detail)return;
    const button=e.target.closest('[data-emote]');
    if(button)send(Number(button.dataset.emote));
    const empty=e.target.closest('[data-empty]');
    if(empty)openSettings(Number(empty.dataset.empty));
  });
  settings.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){settings.close();return}
    const slot=e.target.closest('[data-slot]');
    if(slot){selected=Number(slot.dataset.slot);choice=null;updateSettings();slotButtons.children[selected].focus();return}
    if(e.target.closest('[data-buy]')){
      const list=owned();
      if(choice===null||list.includes(choice)||S.gem<price)return;
      S.gem-=price;
      S.emoteOwned=[...list,choice];
      unsynced.add(choice);
      equip(choice);
      return;
    }
    const button=e.target.closest('[data-emote]');
    if(button){
      const id=Number(button.dataset.emote);
      if(owned().includes(id))equip(id);
      else{choice=id;updateSettings();if(!buy.disabled)buy.focus()}
    }
  });
  function equip(id){
    const equipped=slots(),prior=equipped.indexOf(id);
    if(prior>=0)equipped[prior]=equipped[selected];
    equipped[selected]=id;
    S.emoteSlots=equipped;choice=null;save();updateSettings();
    grid.children[id].focus();
  }
  settings.addEventListener('close',()=>toggle.focus());
  document.addEventListener('pointerdown',e=>{if(!control.contains(e.target))setQuick(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setQuick(false)});

  // 상점 버튼 바로 위에 붙임 (하단 바가 숨겨지거나 창이 열리면 같이 숨김)
  function place(){
    const shop=document.querySelector('#bar .bb[data-p="shop"]'),bar=$('bar'),modal=$('modal');
    const r=shop&&shop.getBoundingClientRect();
    const cs=bar&&getComputedStyle(bar);
    const vis=r&&r.width>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&!(modal&&modal.classList.contains('open'));
    control.hidden=!vis;
    if(!vis){setQuick(false);return}
    control.style.left=Math.round(r.left+r.width/2-26)+'px';control.style.top=Math.round(r.top-58)+'px';
  }
  addEventListener('resize',place);setInterval(place,250);place();

  function receive({id,emote,ch}) {
    if(ch!==CHAP||!valid(emote)||typeof id!=='string')return;
    const now=performance.now();
    for(const [player,event] of active)if(now-event.start>=2100)active.delete(player);
    atlasImage(Math.floor(emote/15));
    active.set(id,{id:emote,start:now});
  }
  const motions = [
    [1.35,4,19],[.82,9,25],[1.65,14,7],[1.72,10,23],[.84,5,12],
    [1.32,7,31],[1.32,5,14],[1.52,11,20],[.94,11,25],[1.04,6,15],
    [1.30,6,18],[.83,9,9],[1.61,18,26],[1.64,7,26],[.90,8,17],
    [1.05,6,17],[.88,5,13],[1.45,17,25],[1.11,6,13],[.86,8,22],
    [1.43,6,20],[.90,4,13],[1.03,9,20],[1.17,9,19],[1.19,4,13],
    [1.09,17,36],[1.77,10,28],[1.29,7,19],[1.00,7,14],[1.35,11,22],
    [1.52,10,24],[.74,8,14],[.78,5,12],[1.45,14,30],[1.81,10,28],
    [1.05,9,14],[1.25,10,23],[.75,6,13],[1.55,15,22],[1.49,8,18],
    [.92,7,12],[1.27,8,18],[1.18,10,21],[1.76,9,28],[.85,10,19],
    [1.25,6,15],[1.56,9,20],[1.19,7,21],[1.36,8,17],[.92,9,15],
  ];
  const gestures = [
    { ids:[0,11,18,24,27,35,45,57,62,76,89,97], x:5, lift:1, squash:.02 },
    { ids:[1,19,44,51,77,98], x:2, lift:5, squash:.08 },
    { ids:[3,6,13,26,30,34,39,43,50,53,58,59,71,74,75,83,85,86,87,90], x:3, lift:8, squash:.09 },
    { ids:[4,16,21,28,40,49,60,66,67,70,78,80,84,93,94,99], x:4, lift:3, squash:.025 },
    { ids:[2,5,7,12,14,17,25,33,36,38,42,46,52,63,64,72,73,79,81,91,95], x:6, lift:5, squash:.10 },
  ];
  const gestureById = new Map(gestures.flatMap(g => g.ids.map(id => [id,g])));
  const standard = {x:3,lift:3,squash:.035};
  function draw(g, player, x, y) {
    const event=active.get(player);
    if(!event)return;
    const p=(performance.now()-event.start)/2100;
    if(p>=1){active.delete(player);return}
    const image=atlasImage(Math.floor(event.id/15));
    if(!image.complete||!image.naturalWidth)return;
    const [bounce,tilt,speed]=motions[event.id%motions.length], cell=event.id%15;
    const gesture=gestureById.get(event.id)||standard;
    const enter=Math.min(1,p/.16), exit=Math.max(0,(p-.76)/.24), motion=reduce.matches?0:1;
    const lift=1-(1-enter)**3;
    const pulse=Math.sin(p*(speed+event.id*.035))*Math.max(0,1-p*1.5)*motion;
    const zoom=.64+.36*lift+Math.sin(enter*Math.PI)*bounce*.16*motion-exit*.13;
    const size=66*zoom, tile=image.naturalWidth/5;
    g.save();
    g.globalAlpha*=lift*(1-exit*exit);
    g.translate(x+gesture.x*pulse,y-size/2-8+(1-lift)*13*motion-11*exit*motion-gesture.lift*Math.abs(pulse));
    g.rotate(pulse*tilt*Math.PI/180);
    g.scale(1+pulse*gesture.squash,1-pulse*gesture.squash);
    g.drawImage(image,cell%5*tile,Math.floor(cell/5)*tile,tile,tile,-size/2,-size/2,size,size);
    g.restore();
  }
  return {receive,draw};
})();
