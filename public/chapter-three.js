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

const CH3_POINTS = [[15,70],[38,69],[62,69],[86,69],[15,28],[39,28],[62,29],[84,25]];
// Coastline points in world coordinates, clockwise around a single landmass.
const CH3_COAST = [
 [260,5510],[550,4240],[930,3150],[1380,1650],[2050,995],[3420,910],
 [5160,800],[6680,970],[8190,805],[10460,900],[12170,680],[13740,850],
 [14745,1820],[14930,3100],[14380,4400],[14620,5760],[14170,6950],[13640,8010],
 [12730,8590],[11100,8390],[9870,8820],[8010,8660],[6570,8970],[4910,8640],
 [3380,8760],[1830,8110],[725,7590],[260,6910]
];
const CH3_CENTERS = [[750,220],[2100,220],[3450,220],[4800,220],[750,-1500],[2100,-1500],[3450,-1500],[4800,-1500]];
const ZS3 = CHAPTER_THREE.map(([n,req,c],i) => {
 const [x,y]=CH3_CENTERS[i],p='c3_'+i+'_';
 return {n,req,c,rim:'#644a49',path:'#e1bd99',lk:1,
  m:[0,1,2,3].map(j=>p+j),e:p+'elite',boss:p+'boss',boss2:p+'guard',ch:p+'chest',
  b:[[-320,0,365],[0,0,365],[230,340,300],[330,-170,365],[0,-440,315]].map(([dx,dy,r])=>[x+dx,y+dy,r]),
  hub:i===0?[[0,0,240]]:[]};
});
const CH3_ROADS=[[0,-1,0,0],...ZS3.slice(1).map((_,i)=>[i,1,i+1,1])];

function chapterThreeMonsters(mt) {
 const base=mt.c2dragon;
 ZS3.forEach((z,i)=>{
  const p='c3_'+i+'_',scale=1.46**i, gold=Math.round(mt.c2drake.gold*1.8*scale);
  const ordinary=['들짐승','떠도는 요괴','그림자 무사','수호 정령'];
  z.m.forEach((k,j)=>{
   const src=mt[['c2drake','c2ghost','c2armor','c2ember'][j]];
   mt[k]={...src,img:['c2drake','c2ghost','c2armor','c2ember'][j],n:z.n+' '+ordinary[j],lv:z.req+j,
    hp:Math.round(mt.c2drake.hp*1.8*scale*(1+j*.12)),atk:Math.round(base.atk*.85*scale*(1+j*.08)),
    xp:Math.round(NEEDF(z.req)*(.012+j*.002)),gold,c2ch:1,gem:0};
  });
  mt[z.e]={...mt.c2dknight,img:'c2dknight',n:z.n+' 무사대장',lv:z.req+4,hp:Math.round(mt.c2dknight.hp*2*scale),
   atk:Math.round(base.atk*1.12*scale),xp:Math.round(NEEDF(z.req)*.09),gold:gold*8};
  mt[z.boss]={...base,img:CHAPTER_THREE[i][4],n:CHAPTER_THREE[i][3],lv:z.req+8,hp:Math.round(base.hp*2.4*scale),
   atk:Math.round(base.atk*2.1*1.29**i),xp:Math.round(NEEDF(z.req)*.8),gold:gold*110,gem:(3+i)*4,rb:8+2*i}; // 보석: 2챕 기준(나중에 /4 → 3~10개)
  mt[z.boss2]={...mt[z.boss],img:'c2dknight',n:z.n+' 수문장',hp:Math.round(mt[z.boss].hp*.65),
   atk:Math.round(mt[z.boss].atk*.8),gold:gold*70,gem:(3+i)*4,rb:4+i};
  mt[z.ch]={...mt.c2chest5,img:'chest6',lv:z.req,hp:Math.round(mt.c2chest5.hp*2*scale),gold:gold*20};
  mt[p+'crys']={...mt[z.m[0]],img:'crys0',n:'수정 슬라임',hp:mt[z.m[0]].hp*2,cry:3};
 });
 const last=mt[ZS3[7].boss];
 mt.wboss3={...mt.wboss2,n:'뇌명룡 라이진',img:'wboss2',lv:145,hp:last.hp*3,atk:Math.round(last.atk*1.4),
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
