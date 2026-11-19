/* Draw one staged effect per cast. Combat hit detection stays in game.html. */
window.WeaponSkillFX = (() => {
  const TAU = Math.PI * 2;
  const palette = {
    4: ['#ffad35', '#fff5ad', '#a95020'],
    5: ['#43f5d0', '#ddfff6', '#256259'],
    6: ['#ff4e9f', '#fff3ff', '#99144f'],
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

  function shard(c, x, y, a, s, [color, light, dark]) {
    shape(c, x, y, a, s, () => {
      path(c, [[0,-28],[13,-4],[7,19],[-5,24],[-14,-1]], dark);
      path(c, [[0,-28],[13,-4],[7,19],[-3,8]], color);
      path(c, [[0,-28],[-3,8],[-9,-2]], light);
    });
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

  const ancient = {
    dagger(c, f, p, C) {
      ring(c, 78, .62, C[0], 2, 4, p);
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4 + p * 4, [x,y] = point(95 * (1 - .58 * p), a, .74);
        blade(c,x,y,a+Math.PI,.67,C);
      }
    },
    sword(c, f, p, C) {
      const r = 45 + 249 * ease(p);
      path(c, [[0,0],[r*.26,-13],[r*.54,12],[r*.74,-8],[r,0],[r*.72,9],[r*.45,-5]], C[2]);
      for (let i = 1; i <= 5; i++) shard(c,r*i/5, i%2*18-9, .28*(i%2*2-1), .7 + .45*Math.sin(Math.PI*p), C);
    },
    mace(c, f, p, C) {
      const r = 24 + 270 * ease(p);
      ring(c,r,.58,C[0],4,6,Math.PI/6);
      ring(c,r*.8,.58,C[1],2,6,Math.PI/6);
      for (let i = 0; i < 6; i++) {
        const [x,y] = point(r*.92,i*TAU/6,.54);
        shard(c,x,y-40*Math.sin(Math.PI*p),i*.7,.86,C);
      }
    },
    spear(c, f, p, C) {
      for (let i = 0; i < 5; i++) {
        const a=i*TAU/5,[x,y]=point(80+165*ease(p),a);
        blade(c,x,y,a,.9,C);
        path(c,[point(38,a),[x,y]],C[0],3);
      }
      ring(c,60,.75,C[1],2,5);
    },
    axe(c, f, p, C) {
      ring(c,142,.75,C[0],3,6,p*7);
      for (let i = 0; i < 6; i++) {
        const a=i*TAU/6+p*TAU*3,[x,y]=point(142,a,.75);
        shard(c,x,y-21,a,.9,C);
        if (i%2===0) crescent(c,x*.42,y*.7,a,104,C);
      }
    },
    bow(c, f, p, C) {
      ring(c,114,.56,C[0],3,6,p);
      for (let i = 0; i < 8; i++) {
        const [x,y]=point(24+(i%3)*34,i*2.399,.5);
        shard(c,x+(1-p)*47,y-(1-phase(p,i*.047,.65))*210,.24,.65,C);
      }
    },
    gun(c, f, p, C) {
      for (let i = 0; i < 12; i++) {
        const a=i*.78+p*TAU,r=25+(i%6)*(20+13*p),[x,y]=point(r,a,.77);
        blade(c,x,y,a+.7,.39,C);
      }
      ring(c,55,.72,C[0],2,8,p*3);
    },
    staff(c, f, p, C) {
      ring(c,90+48*p,.55,C[0],3,6,p*.5);
      for (let i = 0;i < 5;i++) {
        const [x,y]=point(102,i*TAU/5,.5);
        const h=phase(p,i*.075,.56);
        shard(c,x+45*(1-h),y-185*(1-h),.38,1.55,C);
      }
    },
  };

  const mythic = {
    dagger(c, f, p, C) {
      const cut=phase(p,.58,.28);
      ring(c,112+.3*cut*112,.84,C[2],8);
      crescent(c,-10,-12,p*TAU,115,C);
      crescent(c,10,12,p*TAU+Math.PI,115,C);
      if(cut>0) for(const a of [-.72,.72]) blade(c,0,0,a,1.55+cut*.45,C);
      sparks(c,110,p,C,11);
    },
    sword(c, f, p, C) {
      const land=phase(p,.4,.39);
      ring(c,42+143*ease(land),.52,C[0],4,8,.39);
      for(const side of [-1,1]) crescent(c,side*83,-40,side*(.6+land),103,C);
      blade(c,0,-64-230*(1-land),Math.PI/2,2.1,C);
      if(land>.8)sparks(c,178,p,C,13);
    },
    mace(c, f, p, C) {
      const r=38+257*ease(p);
      ring(c,r,.63,C[2],12,8,0.39);
      ring(c,r*.85,.63,C[1],3,8,0.39);
      for(let i=0;i<8;i++){
        const a=i*TAU/8,[x,y]=point(r,a,.62);
        path(c,[[0,0],point(r*.31,a+.12,.62),point(r*.67,a-.08,.62),[x,y]],C[0],5);
        shard(c,x,y-88*Math.sin(Math.PI*p),a,1.6,C);
      }
      sparks(c,r,p,C,14);
    },
    spear(c, f, p, C) {
      const x=260*ease(p);
      for(let i=8;i>=0;i--){
        const xx=x-i*30,yy=Math.sin(i*.72-p*9)*48;
        shard(c,xx,yy,i*.4+p,1.42-i*.1,C);
      }
      path(c,[[x-35,-9],[x-18,-37],[x+5,-20],[x+29,-35],[x+44,0],[x+16,21],[x-27,14]],C[0]);
      path(c,[[x+8,-11],[x+34,-3],[x+8,4]],C[1]);
      for(const d of [-1,1]) crescent(c,x-65,d*38,d*.9,86,C);
    },
    axe(c, f, p, C) {
      const r=150+76*p;
      ring(c,r,.75,C[2],7,8,p*5);
      for(let i=0;i<4;i++){
        const a=i*TAU/4+p*TAU*3;
        const [x,y]=point(r*.49,a,.7);
        crescent(c,x,y-30,a+1.3,128,C);
        crescent(c,x*.9,y-72,a+1.5,73,C);
      }
      sparks(c,r,p*7,C,16);
    },
    bow(c, f, p, C) {
      const k=phase(p,.3,.65);
      for(let i=0;i<8;i++){
        const a=i*TAU/8,[x,y]=point(120,a,.62);
        blade(c,x*(1.8-k*.85),y-180*(1-k),Math.PI/2+a*.19,.85,C);
        if(k>.72) shard(c,x,y,.5+i, .78,C);
      }
      for(const d of [-1,1]) crescent(c,d*103,-44-47*(1-k),d*.55,112,C);
      ring(c,45+100*k,.62,C[1],3,8,.4);
    },
    gun(c, f, p, C) {
      const fire=phase(p,.68,.23);
      for(let i=0;i<3;i++){
        const x=36+i*70;
        shape(c,x,0,Math.PI/2,1,()=>ring(c,26+i*6,.42,C[i%2],4,6,p*2));
      }
      for(let i=0;i<9;i++){
        const a=i*TAU/9+p*8,[x,y]=point(85,a,.66);
        blade(c,x,y,a,.43,C);
      }
      if(fire>0){
        const end=110+270*ease(fire);
        path(c,[[0,-8],[end*.66,-25],[end,0],[end*.66,25],[0,8]],C[0]);
        path(c,[[0,-4],[end*.72,-10],[end,0],[end*.72,10],[0,4]],C[1]);
      }
    },
    staff(c, f, p, C) {
      const land=phase(p,.58,.36), r=66+162*ease(land);
      ring(c,r,.61,C[0],5,8,p);
      ring(c,r*.78,.61,C[1],2,8,-p);
      for(let i=0;i<7;i++){
        const a=i*TAU/7+p*3,[x,y]=point(r*.68,a,.53);
        shard(c,x,y-75,a+p,1.05,C);
      }
      shard(c,0,-112-130*(1-land),p*.65,2.35,C);
      if(land>0) path(c,[[-30,-158],[24,-158],[45,0],[0,24],[-45,0]],C[0]);
      sparks(c,r,p*3,C,17);
    },
  };

  const renderers = {4:legendary,5:ancient,6:mythic};
  const durations = {
    4:{dagger:.55,sword:.55,mace:.52,spear:.44,axe:1.2,bow:.52,gun:1,staff:1.04},
    5:{dagger:.94,sword:.83,mace:.98,spear:.62,axe:2.4,bow:1.22,gun:1.22,staff:1.53},
    6:{dagger:1.38,sword:1.32,mace:1.38,spear:.96,axe:3,bow:1.08,gun:1.8,staff:2.18},
  };

  function add(fxs, type, grade, player, target, angle) {
    const t=durations[grade][type];
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
    renderers[f.grade][f.type](c,f,p,palette[f.grade]);
    c.restore();
  }
  return {add,draw};
})();
