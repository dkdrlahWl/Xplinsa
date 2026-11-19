/* Draw one staged effect per cast. Combat hit detection stays in game.html. */
window.WeaponSkillFX = (() => {
  const TAU = Math.PI * 2;
  const ease = p => 1 - (1 - p) ** 3;
  const phase = (t, start, length) => Math.max(0, Math.min(1, (t - start) / length));

  const indices = {dagger:0,sword:1,mace:2,spear:3,axe:4,bow:5,gun:6,staff:7};
  const atlases = {};
  const gold = new Image();
  gold.src = 'assets/weapon_skill_4.webp?v=1';
  atlases['4skill'] = gold;
  for (const grade of [5,6]) for (const kind of ['skill','third']) {
    const image = new Image();
    image.src = `assets/weapon_${kind}_${grade}.webp?v=2`;
    atlases[grade + kind] = image;
  }

  function sprite(c, type, grade, kind, x, y, angle, size, alpha, stretch = 1) {
    const image = atlases[grade + kind];
    if (!image?.naturalWidth) return false;
    const tile = image.naturalWidth / 4, i = indices[type];
    c.save();
    c.translate(x,y); c.rotate(angle); c.globalAlpha *= alpha;
    c.drawImage(image, (i%4)*tile, Math.floor(i/4)*tile, tile, tile,
      -size/2,-size*stretch/2,size,size*stretch);
    c.restore();
    return true;
  }

  function legendary(c, f, p) {
    const paint = (x, y, angle, size, alpha = 1) =>
      sprite(c, f.type, 4, 'skill', x, y, angle, size, alpha);
    switch (f.type) {
      case 'dagger':
        paint(0, -12, -.55 + p * 1.2, 107 + 31 * ease(p));
        break;
      case 'mace':
        paint(0, -27, 0, 115 + 67 * ease(p));
        break;
      case 'spear':
        paint(45 + 143 * ease(p), 0, 0, 150 + 35 * p);
        break;
      case 'axe':
        paint(0, 0, p * TAU * 3, 154);
        break;
      case 'staff': {
        const impact = phase(p, 0, .58);
        const fade = 1 - phase(p, .58, .42);
        paint(35 * (1 - impact), -185 * (1 - impact) - 32, 0, 138 + 29 * impact, fade);
        break;
      }
    }
  }

  function illustrated(c, f, p) {
    const myth = f.grade === 6, size = (myth ? 265 : 208) * (f.third ? .60 : 1);
    const kind = f.third ? 'third' : 'skill';
    const paint = (x,y,a,s,opacity=1,stretch=1) =>
      sprite(c,f.type,f.grade,kind,x,y,a,s*size,opacity,stretch);
    if (f.third) {
      const thrust = ['spear','bow','gun'].includes(f.type);
      paint(thrust?size*p*.62:0,0,0,.72+ease(p)*.45);
      return;
    }
    switch(f.type) {
      case 'dagger':
        for(let i=0;i<(myth?3:2);i++)paint((i-1)*38*Math.sin(p*7),-15+i*12,p*1.2+i*2.1,.65+p*.45,1-i*.18);
        break;
      case 'sword':
        if(myth)paint(0,-170*(1-ease(p)),Math.PI*.65,.9+.35*p);
        else for(const offset of [-.26,0,.26])paint(180*ease(p),offset*140,offset,.76);
        break;
      case 'mace':
        for(let i=0;i<(myth?3:2);i++)paint(0,-10-i*12,0,.53+ease(p)*(.65+i*.3),1-i*.24,.8);
        break;
      case 'spear':
        for(let i=0;i<(myth?8:5);i++){
          const a=i*TAU/(myth?8:5);
          paint(Math.cos(a)*176*ease(p),Math.sin(a)*176*ease(p),a,i===0?1.25:.72,i===0?1:.65);
        }
        break;
      case 'axe':
        paint(0,0,p*TAU*(myth?3:2),1+p*.32);
        if(myth)paint(0,-32,-p*TAU*2,.82,.73);
        break;
      case 'bow':
        for(let i=0;i<(myth?7:5);i++){
          const q=phase(p,i*.048,.62), x=(i-(myth?3:2))*38;
          if(q>0)paint(x,-182*(1-q),Math.PI*.43,.46+q*.12,1-q*.48);
        }
        break;
      case 'gun':
        for(let i=0;i<(myth?7:5);i++){
          const a=i*TAU/(myth?7:5)+p*5;
          paint(Math.cos(a)*115*p,Math.sin(a)*115*p,a,.46,.72);
        }
        if(myth&&p>.65)paint(160*ease(phase(p,.65,.35)),0,0,1.6);
        break;
      case 'staff':
        for(let i=0;i<(myth?5:3);i++){
          const q=phase(p,i*.10,.57);
          if(q>0&&q<1)paint((i-(myth?2:1))*63,-170*(1-q),0,.60);
        }
        if(myth&&p>.58)paint(0,-210*(1-phase(p,.58,.42)),0,1.3);
    }
  }

  const durations = {
    4:{dagger:.55,sword:.55,mace:.52,spear:.44,axe:1.2,bow:.52,gun:1,staff:1.04},
    5:{dagger:.94,sword:.83,mace:.98,spear:.62,axe:2.4,bow:1.22,gun:1.22,staff:1.53},
    6:{dagger:1.38,sword:1.32,mace:1.38,spear:.96,axe:3,bow:1.08,gun:1.8,staff:2.18},
  };

  function add(fxs, type, grade, player, target, angle, third = false) {
    if (grade === 4 && ['sword','bow','gun'].includes(type)) return;
    const t=third?(type==='staff'?.56:.38):durations[grade][type];
    if(third) {
      const directed=['sword','spear','bow','gun'].includes(type);
      const anchor=['axe','mace','spear','bow','gun'].includes(type)?player:target;
      fxs.push({weaponSkill:true,type,grade,third,t,T:t,x:anchor.x,y:anchor.y-18,angle:directed?angle:0});
      return;
    }
    const aimed=type==='dagger'||type==='staff'||(type==='bow'&&grade>=5)||(type==='sword'&&grade===6);
    const anchor=aimed?target:player;
    const directed=type==='spear'||type==='gun'||(type==='sword'&&grade<6)||(type==='bow'&&grade===4);
    const ground=type==='mace'||type==='staff'||type==='bow'&&grade>=5;
    fxs.push({weaponSkill:true,type,grade,t,T:t,x:anchor.x,y:anchor.y-(ground?0:18),angle:directed?angle:0,follow:type==='axe'});
  }

  function draw(c, f, player) {
    const p=1-f.t/f.T;
    c.save();
    c.translate(f.follow?player.x:f.x,f.follow?player.y-18:f.y);
    c.rotate(f.angle);
    c.globalAlpha=Math.min(1,.2+p*12,(1-p)*5)*.9;
    c.lineJoin='round'; c.lineCap='round';
    if(f.grade===4)legendary(c,f,p);
    else illustrated(c,f,p);
    c.restore();
  }
  function projectile(c, shot) {
    const f=shot.weaponArt;
    return f ? sprite(c,f.type,f.grade,f.third?'third':'skill',-8,0,f.type==='staff'?-Math.PI/2:0,f.type==='sword'?118:64,.92) : false;
  }
  return {add,draw,projectile};
})();
