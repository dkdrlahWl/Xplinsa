/* Draw one staged effect per cast. Combat hit detection stays in game.html. */
window.WeaponSkillFX = (() => {
  const TAU = Math.PI * 2;
  const palette = {
    4: ['#ffad35', '#fff5ad', '#a95020'],
  };
  const ease = p => 1 - (1 - p) ** 3;
  const phase = (t, start, length) => Math.max(0, Math.min(1, (t - start) / length));
  const point = (r, a, y = 1) => [r * Math.cos(a), y * r * Math.sin(a)];

  function path(c, points, color, width = 0) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (const p of points.slice(1)) c.lineTo(...p);
    if (width) { c.lineWidth = width; c.strokeStyle = color; c.stroke(); }
    else { c.closePath(); c.fillStyle = color; c.fill(); }
  }

  function ring(c, r, y, color, width, sides = 0, a = 0) {
    if (sides) {
      path(c, Array.from({ length: sides + 1 }, (_, i) => point(r, a + i * TAU / sides, y)), color, width);
      return;
    }
    c.beginPath();
    c.ellipse(0, 0, r, r * y, 0, 0, TAU);
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  }

  function shape(c, x, y, a, s, draw) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    draw(); c.restore();
  }

  function blade(c, x, y, a, scale, [color, light, dark]) {
    shape(c, x, y, a, scale, () => {
      path(c, [[-58,5],[27,-14],[71,0],[27,14],[-58,10],[-39,0]], dark);
      path(c, [[-43,6],[28,-10],[71,0],[28,10]], color);
      path(c, [[-17,3],[36,-4],[71,0],[34,3]], light);
    });
  }

  function crescent(c, x, y, a, r, [color, light]) {
    shape(c, x, y, a, r / 100, () => {
      c.beginPath(); c.moveTo(-76, -48);
      c.bezierCurveTo(47, -117, 132, -44, 79, 57);
      c.quadraticCurveTo(85, -35, -76, -48);
      c.fillStyle = color; c.fill();
      c.beginPath(); c.moveTo(-65,-52);
      c.quadraticCurveTo(86,-122,102,-8);
      c.lineWidth = 3; c.strokeStyle = light; c.stroke();
    });
  }

  function sparks(c, r, t, colors, n) {
    for (let i = 0; i < n; i++) {
      const [x, y] = point(r * (.55 + (i % 4) * .15), i * 2.399 + t, .63);
      shape(c, x, y, i, .5 + .18 * (i % 3), () =>
        path(c, [[0,-11],[2,-2],[9,0],[2,2],[0,11],[-2,2],[-9,0],[-2,-2]], colors[i % 2]));
    }
  }

  const legendary = {
    dagger(c, f, p, C) {
      for (let i = 0; i < 2; i++) crescent(c, 0, 0, (i * 2 - 1) * (.9 + p * 2), 46 + p * 28, C);
    },
    sword(c, f, p, C) { crescent(c, 240 * ease(p), 0, 1.57, 70 + 20 * p, C); },
    mace(c, f, p, C) {
      ring(c, 12 + 146 * ease(p), .52, C[0], 8 * (1 - p) + 1);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        path(c, [[0,0],point(65*p,a,.55),point(135*p,a+.13,.55)], C[1], 2);
      }
    },
    spear(c, f, p, C) { blade(c, 155 * ease(p), 0, 0, 1 + p, C); },
    axe(c, f, p, C) { crescent(c, 0, 0, p * TAU * 3, 104, C); },
    bow(c, f, p, C) {
      for (let i = -2; i <= 2; i++) blade(c, 215 * p, i * 35 * p, i * .14, .42, C);
    },
    gun(c, f, p, C) {
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + p * 2, [x,y] = point(48 + 125*p, a);
        blade(c, x, y, a, .28, C);
      }
    },
    staff(c, f, p, C) { sparks(c, 24 + 100 * ease(p), p, C, 9); },
  };

  const indices = {dagger:0,sword:1,mace:2,spear:3,axe:4,bow:5,gun:6,staff:7};
  const atlases = {};
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
    if(f.grade===4)legendary[f.type](c,f,p,palette[4]);
    else illustrated(c,f,p);
    c.restore();
  }
  function projectile(c, shot) {
    const f=shot.weaponArt;
    return f ? sprite(c,f.type,f.grade,f.third?'third':'skill',-8,0,f.type==='staff'?-Math.PI/2:0,f.type==='sword'?118:64,.92) : false;
  }
  return {add,draw,projectile};
})();
