'use strict';

const CHAPTER_THREE = [
 ['벚꽃 마을',100,'#dba6a5','벚꽃 갑옷 오니','c2gargo'],
 ['청죽의 숲',105,'#669d6b','청죽 뱀신','c2hydra'],
 ['안개 도리이 계곡',110,'#84a8b7','안개 여우신','c2ghost'],
 ['붉은 단풍 사원',115,'#bb7455','단풍 텐구','c2valk'],
 ['설산 신사',120,'#a9c0d4','설산 설귀','c2crysk'],
 ['달빛 요괴림',125,'#75648c','월영 거미 여왕','ancsp'],
 ['흑철 사무라이 성채',130,'#685868','흑철 사무라이','c2dk'],
 ['황금 쇼군성',135,'#c4a168','황금 쇼군','c2dragon'],
];

const CH3_SCALE = Math.sqrt(.6);
const CH3_POINTS = [[15,70],[38,69],[62,69],[86,69],[15,28],[39,28],[62,29],[84,25]];
// Coastline points in world coordinates, clockwise around a single landmass.
const CH3_COAST = [
 [260,5510],[550,4240],[930,3150],[1380,1650],[2050,875],[3420,850],
 [5160,800],[6680,970],[8190,805],[10460,900],[12170,680],[13740,850],
 [14745,1820],[14930,3100],[14380,4400],[14620,5760],[14170,6950],[13980,8740],
 [12730,9190],[11100,8390],[9870,8820],[8010,8660],[6570,8970],[4910,8640],
 [3380,8760],[1830,8110],[725,7590],[260,6910]
].map(point=>point.map(coord=>coord*CH3_SCALE));
const CH3_CENTERS = [[750,220],[2100,220],[3450,220],[4800,220],[750,-1500],[2100,-1500],[3450,-1500],[4800,-1500]];
// Battle grounds use chapter 2's footprint as the reference. The coast is decorative outside the fields and trails.
const CH3_FIELDS = [
 [[-290,40,280],[0,0,275],[175,285,245],[300,-100,260],[-35,-380,255]],
 [[-340,-75,305],[0,0,330],[145,355,290],[335,25,320],[55,-455,280]],
 [[-365,65,315],[0,0,350],[255,320,315],[345,-205,340],[-40,-460,315]],
 [[-340,-45,325],[0,0,330],[210,345,275],[370,-130,300],[100,-455,300]],
 [[-320,60,320],[0,0,335],[255,345,290],[365,-165,320],[-55,-455,300]],
 [[-350,-30,340],[0,0,320],[180,355,290],[355,-65,310],[75,-455,280]],
 [[-320,55,315],[0,0,330],[240,340,295],[390,-110,310],[10,-455,290]],
 [[-345,-5,335],[0,0,340],[210,350,300],[365,-155,330],[15,-465,310]],
];
const ZS3 = CHAPTER_THREE.map(([n,req,c],i) => {
 const [x,y]=CH3_CENTERS[i],p='c3_'+i+'_';
 return {n,req,c,rim:'#644a49',path:'#e1bd99',lk:1,
  m:[0,1,2,3].map(j=>p+j),e:p+'elite',boss:p+'boss',boss2:p+'guard',ch:p+'chest',
  b:CH3_FIELDS[i].map(([dx,dy,r])=>[x+dx,y+dy,r]),
  hub:i===0?[[0,0,240]]:[]};
});
const CH3_ROADS=[
 [0,-1,0,0],[0,3,1,0],[1,3,2,0],[2,3,3,0],
 [3,4,4,2,[[4800,-665],[750,-665]]],
 [4,3,5,0],[5,3,6,0],[6,3,7,0],
];

function chapterThreeMonsters(mt) {
 const base=mt.c2dragon;
 const normalFloor=Math.max(...ZS2.at(-1).m.map(k=>mt[k].atk))*1.10;
 const eliteFloor=mt.c2dknight.atk*1.10;
 ZS3.forEach((z,i)=>{
  const p='c3_'+i+'_',scale=1.46**i, gold=Math.round(mt.c2drake.gold*1.8*scale);
  const ordinary=['들짐승','떠도는 요괴','그림자 무사','수호 정령'];
  z.m.forEach((k,j)=>{
   const src=mt[['c2drake','c2ghost','c2armor','c2ember'][j]];
   mt[k]={...src,img:'c3_normal_'+j,n:z.n+' '+ordinary[j],lv:z.req+j,
    hp:Math.round(mt.c2drake.hp*1.8*scale*(1+j*.12)),atk:Math.round(Math.max(base.atk*.85*scale,normalFloor*1.22**i)*(1+j*.08)),
    xp:Math.round(NEEDF(z.req)*(.05+j*.008)),gold,c2ch:1,gem:0}; // 1121: 레벨 1업 ≈ 20마리 (2챕 10~14, 1챕 30~46 사이)
  });
  mt[z.e]={...mt.c2dknight,img:'c3_elite_'+i,n:z.n+' 무사대장',lv:z.req+4,hp:Math.round(mt.c2dknight.hp*2*scale),
   atk:Math.round(Math.max(base.atk*1.12*scale,eliteFloor*1.22**i)),xp:Math.round(NEEDF(z.req)*.09),gold:gold*8};
  mt[z.boss]={...base,img:CHAPTER_THREE[i][4],n:CHAPTER_THREE[i][3],lv:z.req+8,hp:Math.round(base.hp*2.4*scale),
   atk:Math.round(base.atk*2.1*1.29**i),xp:Math.round(NEEDF(z.req)*.8),gold:gold*110,gem:(3+i)*4,rb:2+Math.floor(i/2),cry:Math.round((base.cry||0)*(1+.2*i)),orb:Math.round((base.orb||0)*(1+.2*i)),scr:(base.scr||0)+i}; // 1121: 무지개 2~5(2챕 1에서 완만하게), 크리·오브·주문서 스테이지마다 증가 // 보석: 2챕 기준(나중에 /4 → 3~10개)
  mt[z.boss2]={...mt[z.boss],img:'c3_guard_'+i,n:z.n+' 수문장',hp:Math.round(mt[z.boss].hp*.65),
   atk:Math.round(mt[z.boss].atk*.8),gold:gold*70,gem:(3+i)*4,rb:1+Math.floor(i/3)};
  mt[z.ch]={...mt.c2chest5,img:'chest6',lv:z.req,hp:Math.round(mt.c2chest5.hp*2*scale),gold:gold*20};
  mt[p+'crys']={...mt[z.m[0]],img:'crys0',n:'수정 슬라임',hp:mt[z.m[0]].hp*2,cry:3};
 });
 const last=mt[ZS3[7].boss];
 mt.wboss3={...mt.wboss2,n:'뇌명룡 라이진',img:'wboss3',lv:145,hp:last.hp*3,atk:Math.round(last.atk*1.4),
  gold:last.gold*5,xp:last.xp*3,gem:100,orb:300,rb:30,cry:500,r:110};
}

function chapterThreeQuests() {
 const quests=[];
 ZS3.forEach((z,i)=>{
  const gold=MT[z.m[0]].gold;
  const add=(t,type,need,rw,key)=>quests.push({t,type,need,rw,key});
  const kill=(key,need,rw)=>add(MT[key].n+' '+(need===1?'처치':need+'마리 처치'),'kill',need,rw,key);
  add('Lv.'+z.req+' 달성','lv',z.req,{orb:8+i});
  kill(z.m[0],25+i*3,{gold:gold*35});
  add('공격력 1번 강화','up',1,{gold:gold*50},'atk');
  kill(z.m[1],35+i*3,{gold:gold*45});
  add('금화 '+fmt(gold*140)+'개 입금하기','dep',gold*140,{gem:20+i*2});
  kill(z.m[2],40+i*4,{gold:gold*60});
  add('체력 1번 강화','up',1,{gold:gold*55},'hp');
  kill(z.e,3+i,{orb:10+i,cry:25+i*5});
  kill(z.m[3],45+i*4,{gold:gold*75});
  if(i%2===0)add('모루에서 무기 '+(8+i)+'개 만들기','craft',8+i,{cry:35+i*5});
  add('가방 1번 강화','up',1,{gold:gold*65},'bag');
  kill(z.boss2,1,{rb:5+i,gold:gold*150});
  kill(z.boss,1,{rb:10+i,gem:90+i*10});
 });
 return quests;
}
