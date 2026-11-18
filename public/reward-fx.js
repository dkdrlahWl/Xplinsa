/* One visual path for earned rewards. Balances are credited by claim handlers. */
let rewardOrigin=null;
function markRewardOrigin(element){
 if(!element||!element.getBoundingClientRect)return;
 const r=element.getBoundingClientRect(),g=$('game').getBoundingClientRect();
 rewardOrigin={x:r.left-g.left+r.width/2,y:r.top-g.top+r.height/2,time:performance.now()};
}
document.addEventListener('click',event=>{
 const source=event.target.closest('button,[data-a],[data-t],.qc');if(source)markRewardOrigin(source);
},true);
function rewardTarget(kind){
 const tower=document.getElementById('tower-screen');
 if(tower&&!tower.hidden){const e=tower.querySelector('[data-reward-kind="'+kind+'"]');if(e)return e}
 if($('modal').classList.contains('open')){
  const e=$('modal').querySelector(kind==='activity'?'.activity-total':'[data-reward-kind="'+kind+'"]');if(e)return e;
 }else if(['gold','gem','cry'].includes(kind))return $({gold:'cGold',gem:'cGem',cry:'cCry'}[kind]).parentElement;
 return null;
}
function rewardFly(rewards,source){
 if(source)markRewardOrigin(source);
 const rows=Object.entries(rewards).filter(([kind,amount])=>amount>0&&(IC[kind]||kind==='activity'));
 if(!rows.length)return;
 const game=$('game'),bounds=game.getBoundingClientRect();
 let layer=$('reward-fx');if(!layer){layer=document.createElement('div');layer.id='reward-fx';game.appendChild(layer)}
 const origin=rewardOrigin&&performance.now()-rewardOrigin.time<1200?rewardOrigin:{x:bounds.width/2,y:bounds.height*.6};
 let delay=0;
 for(const [kind,amount]of rows){
  let target=rewardTarget(kind);
  if(!target){
   target=layer.querySelector('[data-reward-kind="'+kind+'"]');
   if(!target){target=document.createElement('div');target.className='reward-wallet';target.dataset.rewardKind=kind;target.style.top=(78+layer.querySelectorAll('.reward-wallet').length*34)+'px';layer.appendChild(target)}
   target.innerHTML=(IC[kind]||featureImage('missions'))+'<b>'+fmt(S[kind]||amount)+'</b>';
   clearTimeout(target.rewardTimer);target.rewardTimer=setTimeout(()=>target.remove(),1800);
  }
  const box=target.getBoundingClientRect(),tx=box.left-bounds.left+box.width/2,ty=box.top-bounds.top+box.height/2;
  const count=Math.min(8,Math.max(3,Math.ceil(Math.log10(amount+1)*2)));
  for(let i=0;i<count;i++){
   const sprite=document.createElement('div');sprite.className='rfly';sprite.innerHTML=IC[kind]||featureImage('missions');
   sprite.style.left=origin.x+'px';sprite.style.top=origin.y+'px';
   sprite.style.setProperty('--sx',rnd(-42,42)+'px');sprite.style.setProperty('--sy',rnd(-48,18)+'px');
   sprite.style.setProperty('--tx',(tx-origin.x)+'px');sprite.style.setProperty('--ty',(ty-origin.y)+'px');
   sprite.style.animationDelay=(delay+i*.045)+'s';layer.appendChild(sprite);
   setTimeout(()=>sprite.remove(),1400+(delay+i*.045)*1000);
  }
  setTimeout(()=>{const e=rewardTarget(kind)||target;if(e&&e.isConnected){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');setTimeout(()=>e.classList.remove('bump'),350)}},950+delay*1000);
  delay+=.08;
 }
}
