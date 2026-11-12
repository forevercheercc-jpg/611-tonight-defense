'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('../minigame/lane-core');

test('守城五波每波缩短到72秒，备战窗口保留6秒',()=>{
  assert.equal(G.WAVE_SECONDS,72);
  assert.equal(G.PREP_SECONDS,6);
  const s=G.create(611);s.waveTime=G.WAVE_SECONDS-.1;s.lanes.forEach(l=>l.spawn=999);
  G.step(s,.2);assert.equal(s.wave,2);assert.equal(s.prep,6);
});

test('第四波商店能抽到歌姬且不会把歌姬写死在商店',()=>{
  let seen=0,missed=false;
  for(let seed=1;seed<=50;seed++){
    const s=G.create(seed);s.wave=4;G.refresh(s,true);
    if(s.shop.includes('ge'))seen++;
    else missed=true;
  }
  assert(seen>=30,`50次刷新中歌姬只出现 ${seen} 次`);
  assert(missed,'歌姬仍应由抽卡决定，不能每次固定出现');
});

test('后段敌人成组出现，波数提高后单体生命没有暴涨',()=>{
  const s=G.create(611);s.wave=4;s.waveTime=G.WAVE_SECONDS*.6;s.lanes.forEach(l=>l.spawn=999);s.lanes[1].spawn=0;
  G.step(s,.01);assert.equal(s.lanes[1].monsters.length,4);
  const normal=s.lanes[1].monsters.find(m=>m.type==='normal');
  if(normal)assert(normal.max<=63,'第四波普通怪生命應維持在可快速清理的范围');
});

test('远程在后排守位，不追着敌人走；前排守卫优先承受近身攻击',()=>{
  const s=G.create(611);s.gold=10;s.shop=['ao','tang'];G.buy(s,0);G.deploy(s,0);G.buy(s,1);G.deploy(s,0);
  const tank=s.board[0],mage=s.board[1],lane=s.lanes[s.lane];
  s.board[0]=null;s.board[1]=tank;s.board[4]=mage;
  tank.position={...G.formationPoint(1),p:.64};mage.position=G.formationPoint(4);
  lane.spawn=999;s.lanes.forEach(l=>{if(l!==lane)l.spawn=999;});
  lane.monsters.push({id:900,type:'heavy',p:.7,hp:500,max:500,slow:0,hitClock:0});
  G.step(s,.1);
  assert(mage.position.p>=.69,'远程应留在后排射程内');
  assert.equal(mage.hp,mage.maxHp,'近身守卫在场时远程不应替前排吃伤害');
  assert(tank.hp<tank.maxHp,'前排守卫仍承担防线压力');
});

