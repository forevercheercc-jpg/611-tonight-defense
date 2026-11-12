'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const G=require('../minigame/lane-core');
function tick(s,seconds){for(let i=0;i<Math.ceil(seconds*10);i++)G.step(s,.1);}
test('装备购买和升级影响战斗，合成保留装备',()=>{const s=G.create(611);s.gold=50;s.shop=['ao','ao','ao'];G.buy(s,0);G.deploy(s,0);assert(G.equip(s,0,'blade'));assert(G.upgradeItem(s,0));s.lanes[1].monsters.push({id:999,type:'heavy',p:.3,hp:100,max:100,slow:0,hitClock:0});tick(s,1);assert.equal(s.damage,23);G.buy(s,1);G.buy(s,2);assert.equal(s.board[0].star,2);assert.deepEqual(s.board[0].item,{id:'blade',level:2});});
test('波次准备期间暂停怪物推进，仍可购买伙伴',()=>{const s=G.create(611);s.waveTime=G.WAVE_SECONDS-.1;s.lanes[1].monsters.push({id:901,type:'heavy',p:.2,hp:100,max:100,slow:0,hitClock:0});tick(s,.2);assert(s.prep>0);const p=s.lanes[1].monsters[0].p;s.gold=50;s.shop=['ao'];assert(G.buy(s,0));tick(s,1);assert.equal(s.lanes[1].monsters[0].p,p);assert.equal(s.waveTime,0);});
test('商店购买进备战，三个同名合成并保留上阵位置',()=>{const s=G.create(611);s.gold=30;s.shop=['ao','ao','ao'];assert(G.buy(s,0));assert(G.deploy(s,0));assert(G.buy(s,1));assert(G.buy(s,2));assert.equal(s.board[0].id,'ao');assert.equal(s.board[0].star,2);assert.equal(s.bench.filter(Boolean).length,0);});
test('守线击杀奖励只计算当前玩家的防线',()=>{const s=G.create(611);s.shop=['ao'];G.buy(s,0);G.deploy(s,0);s.combatProgress=7;const gold=s.gold;s.lanes[1].monsters.push({id:901,type:'normal',p:.5,hp:0,max:10});s.lanes[0].monsters.push({id:902,type:'normal',p:.5,hp:0,max:10});tick(s,.1);assert.equal(s.gold,gold+2);assert.equal(s.combatProgress,0);assert.equal(s.kills,2);});
test('第五波可上阵七人且羁绊提示英雄池不足',()=>{const s=G.create(611);assert.equal(G.CAP[4],7);s.wave=5;s.shop=['hong'];G.buy(s,0);G.deploy(s,0);const hunter=G.synergyProgress(s).find(row=>row.name==='猎人');assert.equal(hunter.next,2);assert.equal(hunter.available,2);});
test('后期出怪更快且怪物生命随波数提高',()=>{const early=G.create(611),late=G.create(611);early.wave=2;late.wave=5;early.lanes[1].spawn=0;late.lanes[1].spawn=0;tick(early,.1);tick(late,.1);assert(late.lanes[1].spawn<early.lanes[1].spawn);const base={normal:33,fast:23,heavy:58,healer:30};const a=early.lanes[1].monsters[0],b=late.lanes[1].monsters[0];assert(b.max/base[b.type]>a.max/base[a.type]);});
test('黑塔受伤斥候从第四波起加速，减速仍生效',()=>{const s=G.create(611,'tower');s.wave=4;s.location='high';s.lanes[1].spawn=99;const lane=s.lanes[1];lane.monsters.push({id:701,type:'fast',p:.2,hp:20,max:40,slow:0,hitClock:0},{id:702,type:'fast',p:.2,hp:19,max:40,slow:0,hitClock:0},{id:703,type:'fast',p:.2,hp:19,max:40,slow:2,hitClock:0});tick(s,1);const [normal,wounded,slowed]=lane.monsters;assert(wounded.p>normal.p);assert(slowed.p<wounded.p);});
test('羁绊按上阵不同伙伴计数，不统计备战',()=>{const s=G.create(611);s.gold=30;s.shop=['ao','zhi','thorn'];G.buy(s,0);G.buy(s,1);G.buy(s,2);G.deploy(s,0);G.deploy(s,1);assert.equal(G.synergy(s)['守卫'],2);assert.equal(G.synergy(s)['611'],2);assert.equal(s.bench.filter(Boolean).length,1);});
test('换路只接受有效防线，目标途中失守则退回高地',()=>{
  const s=G.create(611);
  assert(!G.move(s,'camp',0));assert(!G.move(s,'lane',1));
  assert(G.move(s,'lane',0));s.lanes[0].lost=true;tick(s,3.1);
  assert.equal(s.location,'high');
  assert(G.move(s,'lane',2));tick(s,3.1);
  assert.equal(s.location,'lane');assert.equal(s.lane,2);
});
test('商城锁定跨波保留，解锁后刷新',()=>{const s=G.create(611);s.locked=true;s.shop=['ao','zhi','csy'];s.waveTime=G.WAVE_SECONDS-.2;tick(s,.3);assert.deepEqual(s.shop,['ao','zhi','csy']);assert.equal(s.wave,2);});
test('第五波结束全员撤回高地并保留队伍和金币',()=>{const s=G.create(611);s.shop=['ao'];G.buy(s,0);G.deploy(s,0);const gold=s.gold;s.wave=5;s.waveTime=G.WAVE_SECONDS-.2;s.base=1000;tick(s,.3);assert.equal(s.wave,5);assert.equal(s.location,'high');assert(s.boss);assert.equal(s.board[0].id,'ao');assert.equal(s.gold,gold);assert(s.lanes.every(l=>l.lost));});
test('最终波之前漏下的怪会继续前进并伤害基地',()=>{const s=G.create(611);s.wave=5;s.waveTime=G.WAVE_SECONDS-.1;s.base=100;s.lanes.forEach(l=>l.spawn=99);s.lanes[0].monsters.push({id:812,type:'normal',p:.999,hp:100,max:100,slow:0,hitClock:0});tick(s,.2);assert.equal(s.wave,5);assert.equal(s.base,97);assert(!s.lanes[0].monsters.some(m=>m.id===812));});
test('首领倒下后要等存活怪抵达基地才结算',()=>{const s=G.create(611);s.wave=5;s.waveTime=G.WAVE_SECONDS-.1;s.lanes.forEach(l=>l.spawn=99);s.lanes[0].monsters.push({id:813,type:'normal',p:.95,hp:100,max:100,slow:0,hitClock:0});tick(s,.2);s.boss.hp=0;tick(s,.1);assert.equal(s.status,'playing');assert(s.boss.defeated);tick(s,3);assert.equal(s.status,'won');assert.equal(s.base,97);});
test('高地队伍可以清除漏网怪后胜利',()=>{const s=G.create(611);s.shop=['csy'];G.buy(s,0);G.deploy(s,0);s.wave=5;s.waveTime=G.WAVE_SECONDS-.1;s.lanes.forEach(l=>l.spawn=99);s.lanes[0].monsters.push({id:814,type:'normal',p:.8,hp:5,max:5,slow:0,hitClock:0});tick(s,.2);s.boss.hp=0;tick(s,1);assert.equal(s.status,'won');assert.equal(s.base,100);assert(s.kills>=1);});
test('最终首领死亡后获胜',()=>{const s=G.create(611);s.shop=['csy'];G.buy(s,0);G.deploy(s,0);s.wave=5;s.waveTime=G.WAVE_SECONDS-.1;s.lanes.forEach(l=>l.spawn=99);s.base=1000;tick(s,.2);s.boss.hp=1;tick(s,1);assert.equal(s.status,'won');});
function enterBoss(chapter,card){
  const s=G.create(611,chapter);
  s.shop=[card];G.buy(s,0);G.deploy(s,0);
  s.wave=5;s.waveTime=G.WAVE_SECONDS;tick(s,.1);
  return s;
}
test('礼堂复苏会召回卫士，也可以由控制伙伴打断',()=>{
  for(const [card,interrupt] of [['ao',false],['hammer',true]]){
    const s=enterBoss('chapel',card),b=s.boss;
    b.hp=b.max*.62;b.hit=0;tick(s,.1);
    assert.equal(b.phase,1);assert(b.ritual>0);
    assert.equal(G.interruptBoss(s),interrupt);
    b.hit=100;const hp=b.hp;tick(s,5.1);
    assert.equal(b.adds.some(add=>add.kind==='warden'),!interrupt);
    assert.equal(b.hp>hp,!interrupt);
  }
});
test('黑塔首领升空后先清掉两侧火灵，降落后可进入狂暴',()=>{
  const s=enterBoss('tower','csy'),b=s.boss;
  b.hp=b.max*.65;b.hit=0;tick(s,.1);
  assert.equal(b.phase,1);assert.equal(b.adds.length,2);
  const bossHp=b.hp;
  b.adds[0].hp=1;b.hit=0;tick(s,.1);
  assert.equal(b.hp,bossHp);assert.equal(b.phase,1);
  b.adds[1].hp=1;b.hit=0;tick(s,.1);
  assert.equal(b.phase,2);assert.equal(b.hp,bossHp);
  b.hp=b.max*.24;b.hit=0;tick(s,.1);
  assert.equal(b.phase,3);assert(b.hp<bossHp);
});
test('医官读条后治疗附近怪物，眩晕可以打断',()=>{
  for(const interrupt of [false,true]){
    const s=G.create(611),lane=s.lanes[1];
    const healer={id:500,type:'healer',p:.24,hp:40,max:40,slow:0,hitClock:0};
    const ally={id:501,type:'normal',p:.25,hp:10,max:40,slow:0,hitClock:0};
    lane.monsters.push(healer,ally);
    tick(s,.1);assert(healer.healAt>s.time);
    if(interrupt)healer.stunUntil=s.time+1;
    tick(s,2);assert.equal(ally.hp>10,!interrupt);
  }
});
test('回城引导两秒且冷却期间不能再用',()=>{const s=G.create(611);assert(G.recall(s));assert.equal(s.location,'travel');tick(s,2.1);assert.equal(s.location,'high');s.location='lane';assert.equal(G.recall(s),false);});
test('备战区满时仍可购买立即合星的伙伴',()=>{const s=G.create(611);s.gold=99;s.bench=[...Array(8)].map((_,i)=>({uid:i+100,id:i<2?'ao':'blade',star:i<2?1:2}));s.shop=['ao'];assert.equal(G.buy(s,0),true);assert.equal(s.bench.length,8);assert.equal(s.bench.filter(c=>c&&c.id==='ao'&&c.star===2).length,1);});
test('购买、上阵与升星反馈绑定正确伙伴，短暂展示后消失',()=>{const s=G.create(611);s.gold=30;s.shop=['ao','ao','ao'];G.buy(s,0);const uid=s.bench[0].uid;assert(s.effects.some(e=>e.kind==='buy'&&e.uid===uid));G.deploy(s,0);assert(s.effects.some(e=>e.kind==='deploy'&&e.uid===uid));G.buy(s,1);G.buy(s,2);const merged=s.board[0];assert(s.effects.some(e=>e.kind==='merge'&&e.uid===merged.uid&&e.star===2));tick(s,2);assert(!s.effects.some(e=>e.kind==='merge'));});
test('近战先追敌，进入射程后伤害和挥砍从实际位置产生',()=>{
  const s=G.create(611);s.shop=['ao'];G.buy(s,0);G.deploy(s,0);
  s.lanes[1].monsters.push({id:900,type:'heavy',p:.3,hp:100,max:100,slow:0,hitClock:0});
  tick(s,.1);assert.equal(s.damage,0);assert(s.board[0].position.x>G.formationPoint(0).x);
  for(let i=0;i<10&&!s.damage;i++)G.step(s,.1);
  const shot=s.effects.find(e=>e.kind==='shot'&&e.targetId===900);
  assert(shot&&shot.origin.x>G.formationPoint(0).x);
  assert.equal(s.effects.find(e=>e.kind==='hit'&&e.monsterId===900).amount,13);
  assert.equal(s.damage,13);assert(s.effects.length<=60);
});
test('敖犬承受三次近身攻击后反击，牧师汲取怪物生命为队友治疗',()=>{
  const s=G.create(611);s.shop=['ao','priest'];G.buy(s,0);G.deploy(s,0);G.buy(s,1);G.deploy(s,0);
  const ao=s.board[0],priest=s.board[1],monster={id:900,type:'heavy',p:.45,hp:500,max:500,slow:0,hitClock:0};
  assert(G.swapSlots(s,'board',1,5));
  s.lanes[1].monsters.push(monster);
  ao.position={x:G.enemyX(900)-.064,p:.45};ao.atkClock=8;priest.skillClock=8;
  tick(s,.1);assert(ao.hp<ao.maxHp);assert.equal(ao.charge,1);
  monster.hitClock=0;tick(s,.1);assert.equal(ao.charge,2);
  monster.hitClock=0;tick(s,.1);assert.equal(ao.charge,0);
  assert(s.effects.some(e=>e.kind==='hero-skill'&&e.cue==='counter'));
  const wounded=ao.hp;priest.skillClock=0;tick(s,.1);
  assert(ao.hp>wounded);assert(monster.max<500);
  assert(s.effects.some(e=>e.kind==='heal'&&e.id==='priest'));
  ao.hp=1;monster.hitClock=0;tick(s,.1);
  assert.equal(ao.hp,0);
  ao.atkClock=0;tick(s,.1);
  assert(!s.effects.some(e=>e.kind==='shot'&&e.id==='ao'));
  s.waveTime=G.WAVE_SECONDS;tick(s,.1);
  assert.equal(ao.hp,ao.maxHp);
});
test('棋子名称、双种族及羁绊档位按不同棋子计数',()=>{
  const s=G.create(611);assert.equal(s.shop.length,5);s.wave=9;s.gold=50;
  s.shop=['thorn','blade','csy','ice','ice','priest'];
  for(let i=0;i<s.shop.length;i++){assert(G.buy(s,i));assert(G.deploy(s,0));}
  assert.equal(G.BY_ID.thorn.name,'赤斧酋长');
  assert.equal(G.synergy(s)['龙族'],1);assert.equal(G.synergy(s)['不眠'],2);
  assert.deepEqual(G.activeSynergies(s).filter(e=>e.name==='战士'),[{name:'战士',level:2}]);
  assert(G.activeSynergies(s).some(e=>e.name==='洞洞族'&&e.level===2));
});
