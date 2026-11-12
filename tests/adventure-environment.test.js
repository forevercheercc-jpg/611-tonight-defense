'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../minigame/adventure/core');

test('611旧合照给出可验证线索，归位后奖励护盾和可装备短棍',()=>{
  const s=A.start();s.message='';s.x=10;s.y=16;
  assert.equal(A.nearbyInteraction(s).type,'photo');A.interact(s);assert(s.echoClueRead);s.message='';
  s.x=12;s.y=10;assert.equal(A.nearbyInteraction(s).type,'memory');A.interact(s);assert(s.echoPuzzleOpen);
  assert.equal(A.answerEcho(s,'lamp'),false);assert(s.echoError);assert(s.echoPuzzleOpen);
  assert.equal(A.answerEcho(s,'sword'),true);assert.equal(s.guard,12);assert(s.echoSolved);assert.equal(s.maps[0][10][12],'s');
  s.message='';s.x=12;s.y=9;assert(A.move(s,0,1));assert(s.pendingWeapon);assert.equal(s.pendingWeapon.weapon.name,'合照短棍');
  assert(A.chooseWeapon(s,0));assert.equal(s.weapon,'合照短棍');
});

test('教学楼必须先供旧教室，永久打开维修道，再切到礼堂；电闸通过后仍在地图上',()=>{
  const s=A.start();s.floor=1;s.maps[1]=A.chapter.floors[1].map.map(row=>row.split(''));s.seen[1]=s.maps[1].map(row=>row.map(()=>true));
  s.x=17;s.y=11;s.fuse=true;s.message='';
  assert.equal(A.nearbyInteraction(s).type,'power');A.interact(s);assert(s.powerPanelOpen);assert(s.fuseInstalled);assert.equal(s.fuse,false);
  assert.equal(A.selectPower(s,'hall'),false);assert.match(s.powerError,/旧教室/);
  s.powerPanelOpen=false;
  s.x=16;s.y=18;assert.equal(A.move(s,-1,0),false);
  s.x=17;s.y=11;assert(A.interact(s));
  assert(A.selectPower(s,'classroom'));assert(s.maintenanceOpen);assert.equal(s.lightRestored,false);s.message='';
  s.x=17;s.y=12;assert(A.move(s,1,0));assert.equal(s.maps[1][12][18],'E');
  s.x=16;s.y=18;assert(A.move(s,-1,0));assert.equal(s.maps[1][18][15],'v');
  assert(A.move(s,-1,0));assert.equal(s.x,14);
  s.x=17;s.y=11;A.interact(s);assert(s.powerPanelOpen);assert(A.selectPower(s,'hall'));assert.equal(s.power,'hall');assert(s.lightRestored);
  assert.equal(s.maps[1][12][18],'E');assert.equal(s.maps[1][18][15],'v');
  for(const map of [s.maps[1],s.checkpoint.map]){
    map[18][15]='#';
    map[18][18]='v';
  }
  const restored=A.restore(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.maps[1][18][15],'v');
  assert.equal(restored.checkpoint.map[18][15],'v');
  s.power='off';s.x=17;s.y=12;assert.equal(A.move(s,1,0),false);
});

test('拾取选定路线的武器会打开北门，旧档可以补开',()=>{
  const s=A.start();s.message='';s.rescued=['dorm'];s.x=3;s.y=11;
  assert(A.chooseDormRoute(s,'storage'));s.message='';
  assert(A.interact(s));assert(A.leaveWeapon(s));assert.equal(s.maps[0][8][11],'G');
  assert(A.interact(s));assert(A.chooseWeapon(s,0));
  assert.equal(s.maps[0][8][11],'.');
  s.routeRewardFound=false;s.maps[0][8][11]='G';
  const restored=A.restore(JSON.parse(JSON.stringify(s)));
  assert(restored.routeRewardFound);assert.equal(restored.maps[0][8][11],'.');
});

test('旧版已经修复礼堂电路的存档迁移后不会被新机关锁住',()=>{
  const old=A.start();old.mapRevision=2;old.floor=1;old.rescued=['dorm','corridor'];old.lightRestored=true;
  const restored=A.restore(JSON.parse(JSON.stringify(old)));
  assert(restored);assert.equal(restored.power,'hall');assert(restored.maintenanceOpen);
  assert.equal(restored.maps[1][12][18],'.');assert.equal(restored.maps[1][18][18],'.');
  assert(!restored.maps[1].some(row=>row.includes('L')||row.includes('f')));
  const finished=A.start();finished.mapRevision=2;finished.completed=true;delete finished.lightRestored;
  const completed=A.restore(JSON.parse(JSON.stringify(finished)));
  assert(completed);assert(completed.lightRestored);assert.equal(completed.power,'hall');assert(completed.maintenanceOpen);
});

test('武器回廊增量更新保留当前位置、通电状态与检查点',()=>{
  const s=A.start();s.floor=1;s.maps[1]=A.chapter.floors[1].map.map(row=>row.split(''));s.seen[1]=s.maps[1].map(row=>row.map(()=>true));
  s.mapRevision=3;s.x=19;s.y=17;s.fuseInstalled=true;s.maintenanceOpen=true;s.power='classroom';s.checkpoint.floor=1;s.checkpoint.map=s.maps[1].map(row=>row.slice());
  const restored=A.restore(JSON.parse(JSON.stringify(s)));
  assert(restored);assert.equal(restored.x,19);assert.equal(restored.y,17);assert.equal(restored.power,'classroom');
  assert.equal(restored.maps[1][16][20],'s');assert.equal(restored.maps[1][18][20],'s');
  assert.equal(restored.checkpoint.map[16][20],'s');assert.equal(restored.checkpoint.map[18][20],'s');
});
