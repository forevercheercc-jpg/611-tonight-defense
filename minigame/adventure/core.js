'use strict';
const chapter=require('./chapters/return-611');

const VERSION=1;
function start(){
  const state={version:VERSION,mapRevision:chapter.mapRevision,chapter:chapter.id,floor:0,x:0,y:0,hp:100,maxHp:100,attack:15,defense:5,guard:0,keys:0,gold:0,shopOpen:false,purchases:{},weapon:'',weaponKind:'sword',weaponBonus:0,weaponSlots:[null,null],activeWeapon:-1,groundWeapons:{},pendingWeapon:null,rescued:[],mountUnlocked:false,mounted:false,fuse:false,fuseInstalled:false,power:'off',maintenanceOpen:false,lightRestored:false,echoClueRead:false,echoSolved:false,echoPuzzleOpen:false,echoHint:0,pathChoice:null,routeRewardFound:false,routeChoiceOpen:false,routeChoicePending:false,bossCheckpoint:false,platformRaised:false,postBossOpen:false,dormCleared:false,photoFragments:0,maps:chapter.floors.map(f=>f.map.map(row=>row.split(''))),message:chapter.floors[0].intro,pending:null,completed:false};
  state.seen=state.maps.map(map=>map.map(row=>row.map(()=>false)));
  enter(state,0);
  return state;
}
function enter(state,index){
  state.floor=index;
  const map=state.maps[index];
  for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]==='@'){state.x=x;state.y=y;map[y][x]='.';reveal(state);setCheckpoint(state);return;}
  throw new Error('Missing adventure starting point');
}

function regionAt(floorIndex,x,y){const floor=chapter.floors[floorIndex],region=(floor.regions||[]).find(r=>x>=r.x1&&x<=r.x2&&y>=r.y1&&y<=r.y2);return region?region.name:floor.name;}
function setCheckpoint(state){state.checkpoint={floor:state.floor,x:state.x,y:state.y,regionName:regionAt(state.floor,state.x,state.y),bossDoor:Boolean(state.floor===0&&state.bossCheckpoint),bossApproach:Boolean(state.floor===1&&state.y<=7&&state.x>=9&&state.x<=13),keys:state.keys,gold:state.gold,rescued:state.rescued.slice(),fuse:state.fuse,fuseInstalled:state.fuseInstalled,power:state.power,maintenanceOpen:state.maintenanceOpen,lightRestored:state.lightRestored,echoClueRead:state.echoClueRead,echoSolved:state.echoSolved,pathChoice:state.pathChoice,routeRewardFound:state.routeRewardFound,routeChoicePending:state.routeChoicePending,routeChoiceOpen:state.routeChoiceOpen,map:state.maps[state.floor].map(row=>row.slice())};}
function relocateFuse(map,needed){
  if(!Array.isArray(map)||!map[15]||!map[9])return;
  if(map[15][17]==='f')map[15][17]='.';
  if(needed&&(map[9][17]==='.'||map[9][17]==='f'))map[9][17]='f';
}
function patchFuseCheckpoint(data,needed){
  const cp=data.checkpoint;if(!cp||cp.floor!==1||!Array.isArray(cp.map))return;
  cp.map=cp.map.map(row=>row.slice());relocateFuse(cp.map,needed);
  cp.fuse=Boolean(data.fuse);cp.fuseInstalled=Boolean(data.fuseInstalled);
  cp.power=data.power||(data.lightRestored?'hall':'off');cp.maintenanceOpen=Boolean(data.maintenanceOpen||data.lightRestored);cp.lightRestored=Boolean(data.lightRestored);
}
function restoreMaintenanceShortcut(map){
  const row=map?.[18];
  if(row?.[15]!=='#'||(row[18]!=='v'&&row[18]!=='.'))return;
  row[18]='.';
  row[15]='v';
}
function maybeCheckpoint(state,floor,x,y){
  if(state.action&&state.action.inCombat)return;
  const area=regionAt(state.floor,x,y),previous=state.checkpoint&&state.checkpoint.regionName;
  const dormBoss=state.floor===0&&state.pathChoice&&y<=7;
  const corridorBoss=state.floor===1&&y===7&&x>=9&&x<=13;
  if(dormBoss)state.bossCheckpoint=true;
  if(dormBoss||corridorBoss||area!==previous)setCheckpoint(state);
}
function checkpointName(state){
  const cp=state&&state.checkpoint;if(!cp)return '本层入口';
  if(cp.bossDoor)return '寝室首领门前';if(cp.bossApproach)return '教学楼首领门前';
  return cp.regionName||(chapter.floors[cp.floor]&&chapter.floors[cp.floor].name)||'本层入口';
}
function revive(state){
  if(!state.defeated||!state.checkpoint)return false;
  const cp=state.checkpoint,currentMap=state.maps[state.floor];
  if(cp.floor!==state.floor||!Array.isArray(cp.map)||!currentMap||cp.map.length!==currentMap.length||!cp.map.every(row=>Array.isArray(row)&&row.length===currentMap.length)||!Number.isInteger(cp.x)||!Number.isInteger(cp.y)||!cp.map[cp.y]||!cp.map[cp.y][cp.x]||'#CG'.includes(cp.map[cp.y][cp.x]))return false;
  const previous=state.maps[state.floor];state.maps[state.floor]=cp.map.map((row,y)=>row.map((tile,x)=>('gs'.includes(tile)&&previous[y]&&previous[y][x]==='.')?'.':tile));state.x=cp.x;state.y=cp.y;state.keys=cp.keys;state.gold=Math.floor(state.gold*.75);
  // Route weapons open the north gate. Keep that gate open across a retry
  // even when the checkpoint snapshot predates the weapon pickup.
  if(state.floor===0&&state.routeRewardFound&&state.maps[0][8]&&state.maps[0][8][11]==='G')state.maps[0][8][11]='.';
  state.rescued=cp.rescued.slice();state.fuse=cp.fuse;state.fuseInstalled=Boolean(cp.fuseInstalled);state.power=cp.power||((cp.lightRestored)?'hall':'off');state.maintenanceOpen=Boolean(cp.maintenanceOpen||cp.lightRestored);state.lightRestored=cp.lightRestored;state.echoClueRead=Boolean(cp.echoClueRead);state.echoSolved=Boolean(cp.echoSolved);state.pathChoice=cp.pathChoice||state.pathChoice||null;state.routeRewardFound=Boolean(cp.routeRewardFound||state.routeRewardFound);state.bossCheckpoint=Boolean(cp.bossDoor);state.routeChoiceOpen=false;state.routeChoicePending=Boolean(cp.floor===0&&state.rescued.includes('dorm')&&!state.pathChoice&&!cp.bossDoor);if(state.routeChoicePending&&state.maps[0])[[13,7],[13,15]].forEach(([y,x])=>{if(state.maps[0][y]&&state.maps[0][y][x]==='G')state.maps[0][y][x]='.';});state.hp=Math.max(55,Math.round(state.maxHp*.75));state.guard=0;state.defeated=false;state.pending=null;state.pendingWeapon=null;state.echoPuzzleOpen=false;state.shopOpen=false;state.message='';state.reviveLocation=checkpointName(state);state.reviveNoticeUntil=Date.now()+2200;
  state.seen[state.floor]=state.seen[state.floor].map(row=>row.slice());reveal(state);return true;
}
function reveal(state){
  const map=state.maps[state.floor],seen=state.seen[state.floor],queue=[[state.x,state.y,0]],visited=new Set();
  for(let i=0;i<queue.length;i++){
    const [x,y,d]=queue[i],key=x+','+y;
    if(visited.has(key)||!map[y]||!map[y][x])continue;
    visited.add(key);seen[y][x]=true;
    if(d>=3||map[y][x]==='#'||map[y][x]==='C'||map[y][x]==='G'||map[y][x]==='d')continue;
    queue.push([x+1,y,d+1],[x-1,y,d+1],[x,y+1,d+1],[x,y-1,d+1]);
  }
}
function damage(state,enemy){
  const dealt=state.attack-enemy.defense;
  if(dealt<=0)return null;
  return Math.max(0,Math.ceil(enemy.hp/dealt)-1)*Math.max(0,enemy.attack-state.defense);
}
function move(state,dx,dy,options={}){
  if(state.completed||state.pending||state.pendingWeapon||state.message||state.shopOpen||state.echoPuzzleOpen||state.powerPanelOpen||state.routeChoiceOpen||state.postBossOpen)return false;
  if(Math.abs(dx)+Math.abs(dy)!==1||!Number.isInteger(dx)||!Number.isInteger(dy))return false;
  const floor=chapter.floors[state.floor],map=state.maps[state.floor],x=state.x+dx,y=state.y+dy;
  const tile=map[y]&&map[y][x];
  if(!tile||tile==='#'||tile==='C'||tile==='G')return false;
  if((tile==='E'&&state.power!=='classroom')||(tile==='v'&&!state.maintenanceOpen))return false;
  // NPCs and merchants are approached, then activated with the interaction button.
  if(tile==='q'||tile==='t'||tile==='n'||tile==='o'||tile==='r'||tile==='L')return false;
  if(tile==='d'){
    if(!state.keys){state.message='门锁住了，先找一把钥匙。';return false;}
    state.keys--;state.message='使用一把钥匙，打开了门。';
  }
  if(tile==='m'||tile==='b'){
    if(options.action){state.x=x;state.y=y;reveal(state);maybeCheckpoint(state,floor,x,y);return true;}
    const enemy=tile==='b'?floor.boss:floor.enemy;
    const total=damage(state,enemy),absorbed=total===null?0:Math.min(state.guard||0,total);
    const loss=total===null?null:total-absorbed;
    state.pending={x,y,loss,absorbed,gold:enemy.gold||0,enemy:enemy.name,stats:{hp:enemy.hp,attack:enemy.attack,defense:enemy.defense}};
    return true;
  }
  if(tile==='k'){state.keys++;state.message='找到一把钥匙。';}
  if(tile==='g'){state.gold+=4;state.message='找到 4 枚金币，可以在小卖部购买补给。';}
  if(tile==='P'){
    state.platformRaised=true;map[y][x]='.';
    const shortcut=state.pathChoice==='storage'?7:15;
    if(map[11]&&map[11][shortcut]==='C')map[11][shortcut]='.';
    if(map[8]&&map[8][10]==='.')map[8][10]='p';
    state.message='咔哒！踩下压力板，铁架平台升起，所选侧路捷径和药水显现。';
  }
  if(tile==='p'&&state.hp>=state.maxHp){state.x=x;state.y=y;reveal(state);return true;}
  if(tile==='p'){state.hp=Math.min(state.maxHp,state.hp+35);state.message='找到药水，恢复最多 35 点生命。';}
  if(tile==='f'){state.fuse=true;state.message='找到一枚保险丝。配电箱能把电切给旧教室或礼堂。';}
  if(tile==='x'){
    if(!state.rescued.includes(floor.id)){state.message='先找到这层的室友，再一起前进。';return false;}
    if(floor.id==='corridor'&&!state.lightRestored){state.message='走廊还没通电，先修好配电箱。';return false;}
    if(map.some(row=>row.includes('b'))){state.message='守卫仍在，先解决它再前进。';return false;}
    if(state.floor===0){state.postBossOpen=true;state.dormCleared=true;state.photoFragments=Math.max(1,state.photoFragments||0);state.x=x;state.y=y;reveal(state);state.message='寝室的灯一盏盏亮起。\n敖犬：这张合照少了一角，红星肯定把它带去教学楼了。\n照片碎片收入回廊图册。去封锁教学楼找唐卵，还是换条寝室路线再战？';return true;}
    map[y][x]='.';
    if(state.floor+1<chapter.floors.length){enter(state,state.floor+1);state.message=floor.exit+'\n'+chapter.floors[state.floor].intro;}
    else{state.completed=true;state.message=floor.exit;}
    return true;
  }
  state.x=x;state.y=y;if(tile!=='E'&&tile!=='v'&&tile!=='C'&&tile!=='s')map[y][x]='.';reveal(state);if(options.action)maybeCheckpoint(state,floor,x,y);if(tile==='f')setCheckpoint(state);
  if(state.floor===0&&state.pathChoice&&!state.bossCheckpoint&&y<=6){state.bossCheckpoint=true;setCheckpoint(state);}
  return true;
}
function nearbyInteraction(state){
  if(!state||state.completed||state.defeated||state.message||state.pending||state.pendingWeapon||state.shopOpen||state.echoPuzzleOpen||state.powerPanelOpen||state.routeChoiceOpen||state.postBossOpen)return null;
  const map=state.maps[state.floor],actor=state.action||state,choices=[];
  for(let y=Math.max(0,Math.floor(actor.y)-2);y<=Math.min(map.length-1,Math.ceil(actor.y)+2);y++)for(let x=Math.max(0,Math.floor(actor.x)-2);x<=Math.min(map[y].length-1,Math.ceil(actor.x)+2);x++){
    const tile=map[y][x],distance=Math.hypot(x-actor.x,y-actor.y);
    if(distance>1.55)continue;
    if(tile==='q')choices.push({type:'npc',x,y,distance,label:'对话'});
    else if(tile==='t')choices.push({type:'shop',x,y,distance,label:'商店'});
    else if(tile==='n')choices.push({type:'rescue',x,y,distance,label:'营救'});
    else if(tile==='s')choices.push({type:'weapon',x,y,distance,label:'拾取武器'});
    else if(tile==='o')choices.push({type:'photo',x,y,distance,label:'看合照'});
    else if(tile==='r')choices.push({type:'memory',x,y,distance,label:'回忆归位'});
    else if(tile==='L')choices.push({type:'power',x,y,distance,label:'配电'});
  }
  return choices.sort((a,b)=>a.distance-b.distance)[0]||null;
}
function interact(state){
  const target=nearbyInteraction(state);if(!target)return false;
  const floor=chapter.floors[state.floor],map=state.maps[state.floor];
  if(target.type==='weapon'){
    const key=state.floor+':'+target.x+':'+target.y,picked=(state.groundWeapons||{})[key]||(floor.weaponsAt&&floor.weaponsAt[target.x+','+target.y])||floor.weapon;
    if(!picked)return false;
    state.pendingWeapon={floor:state.floor,x:target.x,y:target.y,weapon:{...picked}};
  }
  else if(target.type==='photo'){
    state.echoClueRead=true;
    state.message='旧合照背面写着：熄灯前，把窗边床头用过的旧物挂回原处。那是611最后一晚的习惯。';
  }
  else if(target.type==='memory'){
    if(state.echoSolved)state.message='照片和旧物都归位了。抽屉里留下了一根合照短棍。';
    else if(!state.echoClueRead)state.message='桌上的回忆抽屉卡住了。先看看床边那张旧合照。';
    else {state.echoPuzzleOpen=true;state.echoHint=0;state.echoError='';}
  }
  else if(target.type==='power'){
    if(!state.fuseInstalled&&!state.fuse)state.message='配电箱北侧的工作台上有备用保险丝。先取保险丝，再给教室供电。';
    else{
      if(!state.fuseInstalled){state.fuse=false;state.fuseInstalled=true;setCheckpoint(state);}
      state.powerPanelOpen=true;state.powerError='';
    }
  }
  else if(target.type==='npc')state.message=floor.npcDialogue||'前方有危险，注意安全。';
  else if(target.type==='shop'){state.shopOpen=true;state.shopMessage='小卖部：金币可以换补给和训练。';}
  else{
    map[target.y][target.x]='.';
    const firstRescue=!state.rescued.includes(floor.id);
    if(firstRescue)state.rescued.push(floor.id);
    if(floor.id==='dorm'){state.guard+=10;state.mountUnlocked=true;state.routeChoicePending=!state.pathChoice;if(!state.pathChoice){[[13,7],[13,15]].forEach(([y,x])=>{if(map[y]&&map[y][x]==='G')map[y][x]='.';});}state.message=(firstRescue?floor.dialogue.join('\n')+'\n敖犬给你加了 10 点护盾。\n解锁坐骑「灰耳巡风犬」：骑乘更快，遇敌自动下马。':'敖犬：我缓过来了，去北边找那个铁皮怪！')+(state.routeChoicePending?'\n选储物间还是东侧盥洗区？':'');}
    else state.message=floor.dialogue.join('\n');
    reveal(state);setCheckpoint(state);
  }
  return true;
}
function chooseDormRoute(state,route){
  if(!state||state.floor!==0||!state.rescued.includes('dorm')||!['storage','wash'].includes(route)||state.pending||state.pendingWeapon)return false;
  if(state.postBossOpen)return replayDormRoute(state,route);
  const map=state.maps[0];state.pathChoice=route;state.routeChoiceOpen=false;state.routeChoicePending=false;
  if(route==='storage')map[13][15]='#';else map[13][7]='#';
  state.message=route==='storage'?'敖犬：西边储物间窄，床板短棍能一挥打中一片。我们从北门合流。':'敖犬：东边盥洗区柜台能挡冲锋，单体练习剑和药水都在里头。我们从北门合流。';
  setCheckpoint(state);return true;
}
function replayDormRoute(state,route){
  if(!state.postBossOpen||!['storage','wash'].includes(route))return false;
  const map=chapter.floors[0].map.map(row=>row.split(''));
  map.forEach((row,y)=>{const x=row.indexOf('@');if(x>=0)map[y][x]='.';});
  map[14][11]='.';map[13][7]='.';map[13][15]='.';if(route==='storage')map[13][15]='#';else map[13][7]='#';
  state.maps[0]=map;state.floor=0;state.x=11;state.y=14;state.hp=state.maxHp;state.guard=0;state.pathChoice=route;state.routeRewardFound=false;state.routeChoicePending=false;state.routeChoiceOpen=false;state.dormCleared=false;state.postBossOpen=false;state.bossCheckpoint=false;state.platformRaised=false;state.groundWeapons=Object.fromEntries(Object.entries(state.groundWeapons||{}).filter(([key])=>!key.startsWith('0:')));state.message=route==='storage'?'再战寝室：本次选择西侧窄道，保留当前装备，路线奖励刷新。':'再战寝室：本次选择东侧盥洗区，保留当前装备，路线奖励刷新。';state.seen[0]=map.map(row=>row.map(()=>false));reveal(state);setCheckpoint(state);return true;
}
function nextFloor(state){
  if(!state||!state.postBossOpen||state.floor!==0)return false;
  state.postBossOpen=false;const floor=chapter.floors[0];enter(state,1);state.message=floor.exit+'\n'+chapter.floors[1].intro;return true;
}
function answerEcho(state,answer){
  if(!state.echoPuzzleOpen||state.echoSolved||!['sword','lamp','cup'].includes(answer))return false;
  if(answer!=='sword'){state.echoError='再看看合照背面的提示：床头那件旧物，是熄灯前挂回去的。';return false;}
  state.echoPuzzleOpen=false;state.echoSolved=true;state.echoError='';state.guard+=18;
  const map=state.maps[0];if(map[15]&&map[15][12]==='.')map[15][12]='s';
  state.message='旧物归位，回忆抽屉弹开。额外获得 18 点护盾和一根合照短棍。';
  setCheckpoint(state);
  return true;
}
function closeEcho(state){if(!state.echoPuzzleOpen)return false;state.echoPuzzleOpen=false;state.echoError='';return true;}
function selectPower(state,circuit){
  if(!state.powerPanelOpen||!['classroom','hall'].includes(circuit))return false;
  if(!state.fuseInstalled){state.powerError='先装入保险丝。';return false;}
  if(circuit==='hall'&&!state.maintenanceOpen){state.powerError='先把电切给旧教室，打开永久维修通道。';return false;}
  state.power=circuit;state.powerPanelOpen=false;state.powerError='';
  if(circuit==='classroom'){
    state.maintenanceOpen=true;state.lightRestored=false;
    state.message='旧教室的灯亮了，电动门开启。断电后维修通道仍会保持打开。';
  }else{
    state.lightRestored=true;
    state.message='电力切到礼堂。维修通道保持畅通，旧教室的电动门落下。';
  }
  setCheckpoint(state);
  return true;
}
function closePower(state){if(!state.powerPanelOpen)return false;state.powerPanelOpen=false;state.powerError='';return true;}
function toggleMount(state){
  if(!state||!state.mountUnlocked||state.completed||state.defeated||state.message||state.pending||state.pendingWeapon||state.shopOpen||state.echoPuzzleOpen||state.powerPanelOpen||(state.action&&state.action.inCombat))return false;
  state.mounted=!state.mounted;
  if(state.action)state.action.mountNotice=1.1;
  return true;
}
function equipSlot(state,index){
  const weapon=state.weaponSlots&&state.weaponSlots[index];if(!weapon)return false;
  state.attack=Math.max(1,state.attack-(state.weaponBonus||0)+weapon.attack);state.weaponBonus=weapon.attack;state.weapon=weapon.name;state.weaponKind=weapon.kind||'sword';state.activeWeapon=index;return true;
}
function switchWeapon(state){if(state.completed||state.defeated||state.message||state.pendingWeapon||state.pending||state.shopOpen||state.echoPuzzleOpen||state.powerPanelOpen)return false;const other=state.activeWeapon===0?1:0;if(!state.weaponSlots||!state.weaponSlots[other])return false;return equipSlot(state,other);}
function openDormGate(state){
  state.routeRewardFound=true;
  if(state.maps[0][8]?.[11]==='G')state.maps[0][8][11]='.';
}
function chooseWeapon(state,index){
  const pick=state.pendingWeapon;if(!pick||pick.floor!==state.floor||![0,1].includes(index)||!state.maps[pick.floor][pick.y]||state.maps[pick.floor][pick.y][pick.x]!=='s')return false;
  const old=state.weaponSlots[index],key=pick.floor+':'+pick.x+':'+pick.y;state.groundWeapons=state.groundWeapons||{};
  if(old)state.groundWeapons[key]={...old};else{delete state.groundWeapons[key];state.maps[pick.floor][pick.y][pick.x]='.';}
  state.weaponSlots[index]={...pick.weapon};
  state.pendingWeapon=null;
  equipSlot(state,index);
  const routeX=state.pathChoice==='storage'?3:state.pathChoice==='wash'?19:null;
  if(pick.floor===0&&pick.y===10&&pick.x===routeX)openDormGate(state);
  return true;
}
function leaveWeapon(state){if(!state.pendingWeapon)return false;state.pendingWeapon=null;return true;}
function buy(state,item){
  if(!state.shopOpen||!['potion','training'].includes(item))return false;
  const price=item==='potion'?3:5;
  if(state.purchases[item]){state.shopMessage='这件商品本章已经买过。';return false;}
  if(state.gold<price){state.shopMessage='金币不足，还需要 '+(price-state.gold)+' 枚。';return false;}
  if(item==='potion'&&state.hp>=state.maxHp){state.shopMessage='生命已满，暂时不用购买药水。';return false;}
  state.gold-=price;state.purchases[item]=true;
  if(item==='potion'){state.hp=Math.min(state.maxHp,state.hp+35);state.shopMessage='买到药水，恢复最多 35 点生命。';}
  else{state.attack+=3;state.shopMessage='训练完成，攻击增加 3。';}
  return true;
}
function resolve(state,accept){
  const fight=state.pending;
  if(!fight)return false;
  state.pending=null;
  if(!accept)return true;
  if(fight.loss===null||fight.loss>=state.hp){state.message='当前无法安全击败 '+fight.enemy+'，先寻找装备或药水。';return false;}
  state.guard=Math.max(0,(state.guard||0)-fight.absorbed);state.hp-=fight.loss;state.x=fight.x;state.y=fight.y;state.maps[state.floor][fight.y][fight.x]='.';reveal(state);
  state.gold+=fight.gold||0;state.message='击败 '+fight.enemy+'，损失 '+fight.loss+' 点生命。'+(fight.gold?'获得 '+fight.gold+' 金币。':'');
  return true;
}
function objective(state){
  const floor=chapter.floors[state.floor],map=state.maps[state.floor];
  if(!state.rescued.includes(floor.id))return floor.id==='dorm'?'寻找敖犬':'寻找唐卵';
  if(floor.id==='dorm'&&state.routeChoicePending)return '选一条路线去找首领';
  if(floor.id==='dorm'&&!state.pathChoice)return '选一条路线去找首领';
  if(floor.id==='corridor'&&!state.fuseInstalled&&!state.fuse)return '找到备用保险丝';
  if(floor.id==='corridor'&&!state.maintenanceOpen)return '先给旧教室供电，打开维修通道';
  if(floor.id==='corridor'&&!state.lightRestored)return '把电力切到礼堂';
  if(map.some(row=>row.includes('b')))return '击败出口附近的守卫';
  return '寻找绿色出口';
}
function regionName(state){
  const floor=chapter.floors[state.floor],actor=state.action||state,regions=floor.regions||[];
  const region=regions.find(r=>actor.x>=r.x1&&actor.x<=r.x2&&actor.y>=r.y1&&actor.y<=r.y2);
  return region?region.name:floor.name;
}
function hint(state,detail){
  const floor=chapter.floors[state.floor];
  if(!state.rescued.includes(floor.id))return detail?'从南侧入口进入中央大厅，再沿两侧寝室与支路寻找室友。':'先探索中央大厅和相连的侧翼，找到这一层的室友。';
  if(floor.id==='dorm'&&state.routeChoicePending)return detail?'西侧储物间：窄道和扇面短棍，适合一次打多个敌人。东侧盥洗区：柜台挡冲锋，练习剑和药水。选一条，北侧会合。':'选西储物间拿范围武器，或东盥洗区拿单体武器和药水。';
  if(floor.id==='dorm'&&!state.pathChoice)return detail?'先救敖犬，再选西侧储物间或东侧盥洗区；两条路的敌人和装备不同，北侧汇合打首领。旧合照是可选回忆。':'救敖犬后选一条不同战斗与奖励的路线，合流打首领。';
  if(floor.id==='corridor'&&!state.fuseInstalled&&!state.fuse){
    return detail?'用钥匙进入东侧配电教室，先取配电箱北侧台面上的保险丝；东侧电闸门通电后才能打开。':'开东侧配电教室门，去配电箱北侧的工作台取保险丝。';
  }
  if(floor.id==='corridor'&&!state.maintenanceOpen){
    return detail?'配电箱在东侧隔墙西边。先选择“旧教室”，会打开电动门并永久接通下方维修通道。':'把电先切给旧教室，打开维修通道。';
  }
  if(floor.id==='corridor'&&!state.lightRestored){
    return detail?'穿过旧教室电动门拿装备并营救唐卵，再从维修通道返回配电箱，把电切给礼堂。':'去配电箱把电力切到礼堂。';
  }
  if(state.maps[state.floor].some(row=>row.includes('b')))return floor.id==='corridor'?(detail?'首领在北教学区。可以先探索西侧旧教室找武器，再开东侧配电教室恢复照明、营救唐卵，最后从中央礼堂前厅上行。':'先营救唐卵并恢复供电；西侧旧教室的武器是可选补给。'):(detail?'选定路线的奖励拿到后往北走，首领在寝室金属床架大厅。它锁定方向冲锋，横移诱它撞铁架，再趁硬直攻击。旧合照谜题可选。':'路线已选。向北找首领，冲锋时横移诱它撞床架！');
  if(floor.id==='dorm'&&state.maps[state.floor].some(row=>row.includes('k')))return detail?'先看大厅旧合照，再把提示的旧物归回回忆抽屉取得钥匙。西侧储物间有一条支路和可选武器。':'查看旧合照并在回忆抽屉归位旧物，取得钥匙；储物间武器可以按流派选择。';
  return detail?'前往地图上方的绿色箭头，就能进入下一段故事。':'这一层的主要目标已完成，寻找出口。';
}
function restore(data){
  if(!data||data.version!==VERSION||data.chapter!==chapter.id||!Number.isInteger(data.floor)||!chapter.floors[data.floor]||!Array.isArray(data.rescued)||!Array.isArray(data.maps)||data.maps.length!==chapter.floors.length)return null;
  const originalMapRevision=data.mapRevision;
  const legacyHall=Boolean(data.lightRestored||data.completed);
  if((data.mapRevision===4||data.mapRevision===3)&&data.maps[0]&&data.maps[0].length===23&&data.maps[1]&&data.maps[1].length===23){
    const oldRevision=data.mapRevision;
    if(oldRevision===3)[[20,16],[20,18]].forEach(([x,y])=>{if(data.maps[1][y][x]==='.')data.maps[1][y][x]='s';});
    data.maps[0]=chapter.floors[0].map.map(row=>row.split(''));
    data.maps[0].forEach((row,y)=>{const x=row.indexOf('@');if(x>=0)data.maps[0][y][x]='.';});
    if(data.rescued.includes('dorm')){data.maps[0][14][11]='.';[[13,7],[13,15]].forEach(([y,x])=>{data.maps[0][y][x]='.';});}
    if(data.floor===0){data.x=11;data.y=data.rescued.includes('dorm')?14:20;}
    data.pathChoice=null;data.routeChoicePending=data.floor===0&&data.rescued.includes('dorm');data.routeChoiceOpen=false;data.bossCheckpoint=false;
    data.action=null;data.pending=null;data.pendingWeapon=null;data.checkpoint=null;
    data.seen=chapter.floors.map(f=>f.map.map(()=>false));data.mapRevision=chapter.mapRevision;
    data.message='611 寝室改成了可选分路的新布局。武器和室友进度已保留。';
  }
  if(data.mapRevision!==chapter.mapRevision){
    const oldMaps=data.maps;
    const reachableFusePatch=originalMapRevision===5&&oldMaps.every(map=>Array.isArray(map)&&map.length===23&&map.every(row=>Array.isArray(row)&&row.length===23&&row.every(tile=>typeof tile==='string'&&tile.length===1)));
    const additiveWeaponPatch=data.mapRevision===3&&oldMaps.every(map=>Array.isArray(map)&&map.length===23&&map.every(row=>Array.isArray(row)&&row.length===23&&row.every(tile=>typeof tile==='string'&&tile.length===1)));
    if(reachableFusePatch){
      data.maps=oldMaps.map(map=>map.map(row=>row.slice()));
      const needsFuse=!data.fuse&&!data.fuseInstalled&&!legacyHall;
      relocateFuse(data.maps[1],needsFuse);
      patchFuseCheckpoint(data,needsFuse);
      data.mapRevision=chapter.mapRevision;
      data.message='第二关保险丝已移到配电箱旁、闸门前的工作台。路线与已完成进度保留。';
    }else if(additiveWeaponPatch){
      data.maps=oldMaps.map(map=>map.map(row=>row.slice()));
      [[20,16],[20,18]].forEach(([x,y])=>{if(data.maps[1][y][x]==='.')data.maps[1][y][x]='s';});
      if(data.checkpoint&&data.checkpoint.floor===1&&Array.isArray(data.checkpoint.map))[[20,16],[20,18]].forEach(([x,y])=>{if(data.checkpoint.map[y]&&data.checkpoint.map[y][x]==='.')data.checkpoint.map[y][x]='s';});
      data.mapRevision=chapter.mapRevision;
      data.message='教学楼武器回廊新增光剑与脉冲枪，原有位置和进度已保留。';
    }else{
    const oldShape=oldMaps.every(map=>Array.isArray(map)&&map.length>0&&map.every(row=>Array.isArray(row)&&row.length===map.length&&row.every(tile=>typeof tile==='string'&&tile.length===1)));
    if(!oldShape)return null;
    data.maps=chapter.floors.map((floor,index)=>floor.map.map(row=>row.split('')));
    data.maps.forEach((map,index)=>{
      chapter.floors[index].map.forEach((row,y)=>{const x=row.indexOf('@');if(x>=0)map[y][x]='.';});
      const old=oldMaps[index],oldTiles=[];old.forEach(row=>oldTiles.push(...row));
      const oldDoorCount=oldTiles.filter(tile=>tile==='d').length,initialDoors=index===0?1:2;
      const oldKeyCount=oldTiles.filter(tile=>tile==='k').length,initialKeys=index===0?1:2;
      const openedDoors=Math.max(0,initialDoors-oldDoorCount),collectedKeys=Math.max(0,initialKeys-oldKeyCount);
      const removeTiles=(tile,count)=>{for(let y=map.length-1;y>=0&&count>0;y--)for(let x=map[y].length-1;x>=0&&count>0;x--)if(map[y][x]===tile){map[y][x]='.';count--;}};
      removeTiles('d',openedDoors);removeTiles('k',collectedKeys);
      if(!oldTiles.includes('b'))removeTiles('b',1);
      if(data.rescued.includes(chapter.floors[index].id))removeTiles('n',1);
      if(index===1){if(legacyHall){removeTiles('f',1);removeTiles('L',1);map[12][18]='.';map[18][18]='.';}else if(data.fuse)removeTiles('f',1);}
      // Legacy small maps have no stable coordinate correspondence. Restart
      // exploration at the new entrance while retaining story and inventory.
      let at=null;chapter.floors[index].map.forEach((row,y)=>{const x=row.indexOf('@');if(x>=0)at=[x,y];});
      if(index===data.floor&&at){data.x=at[0];data.y=at[1];}
    });
    if(data.rescued.includes('dorm')){data.maps[0][14][11]='.';data.maps[0][13][7]='.';data.maps[0][13][15]='.';data.pathChoice=null;data.routeChoicePending=data.floor===0;data.routeChoiceOpen=false;}
    data.seen=data.maps.map(map=>map.map(row=>row.map(()=>false)));
    data.action=null;data.pending=null;data.pendingWeapon=null;data.checkpoint=null;data.mounted=false;
    data.mapRevision=chapter.mapRevision;
    data.lightRestored=legacyHall;data.power=legacyHall?'hall':'off';data.fuseInstalled=legacyHall;data.maintenanceOpen=legacyHall;
    data.echoClueRead=false;data.echoSolved=false;data.echoPuzzleOpen=false;data.powerPanelOpen=false;
    data.message='校园地图已扩建，已保留背包与剧情进度。重新探索当前区域吧。';
    }
  }
  if((originalMapRevision===3||originalMapRevision===4)&&data.maps[1]){
    const needsFuse=!data.fuse&&!data.fuseInstalled&&!legacyHall;
    relocateFuse(data.maps[1],needsFuse);
    patchFuseCheckpoint(data,needsFuse);
    if(needsFuse)data.message='第二关保险丝已移到配电箱旁、闸门前的工作台。路线与已完成进度保留。';
  }
  const valid=data.maps.every((map,i)=>Array.isArray(map)&&(map.length===chapter.floors[i].map.length||((i===0||i===1)&&map.length===9))&&map.every(row=>Array.isArray(row)&&row.length===map.length&&row.every(tile=>typeof tile==='string'&&tile.length===1&&'#.@kdmpnsxbfLgtqorEvCPG'.includes(tile))));
  if(!valid||!Number.isInteger(data.x)||!Number.isInteger(data.y)||!data.maps[data.floor][data.y]||!data.maps[data.floor][data.y][data.x]||!Number.isFinite(data.hp)||data.hp<0||(data.hp===0&&!data.defeated)||!Number.isFinite(data.attack)||!Number.isFinite(data.defense)||!Number.isInteger(data.keys)||data.keys<0)return null;
  if(!Number.isFinite(data.guard)||data.guard<0)data.guard=0;
  if(!Number.isFinite(data.gold)||data.gold<0)data.gold=0;
  data.fuseInstalled=Boolean(data.fuseInstalled);data.power=['off','classroom','hall'].includes(data.power)?data.power:(data.lightRestored?'hall':'off');data.maintenanceOpen=Boolean(data.maintenanceOpen||data.lightRestored);data.echoClueRead=Boolean(data.echoClueRead);data.echoSolved=Boolean(data.echoSolved);data.echoPuzzleOpen=false;data.powerPanelOpen=false;
  data.mountUnlocked=Boolean(data.mountUnlocked||data.rescued.includes('dorm'));data.mounted=Boolean(data.mounted&&data.mountUnlocked);data.pathChoice=['storage','wash'].includes(data.pathChoice)?data.pathChoice:null;data.routeRewardFound=Boolean(data.routeRewardFound);data.routeChoicePending=Boolean(data.routeChoicePending);data.routeChoiceOpen=Boolean(data.routeChoiceOpen&&!data.pathChoice&&data.rescued.includes('dorm'));data.bossCheckpoint=Boolean(data.bossCheckpoint);data.platformRaised=Boolean(data.platformRaised);data.postBossOpen=Boolean(data.postBossOpen);data.dormCleared=Boolean(data.dormCleared);data.photoFragments=Number.isInteger(data.photoFragments)?data.photoFragments:0;
  if(!data.purchases||typeof data.purchases!=='object')data.purchases={};
  if(!Array.isArray(data.seen)||data.seen.length!==data.maps.length||!data.seen.every((m,i)=>Array.isArray(m)&&m.length===data.maps[i].length&&m.every((row,y)=>Array.isArray(row)&&row.length===data.maps[i][y].length)))data.seen=data.maps.map(map=>map.map(row=>row.map(()=>false)));
  if(!data.weaponKind)data.weaponKind='sword';if(!Number.isFinite(data.weaponBonus))data.weaponBonus=({'旧练习剑':8,'星辉练习剑':5,'床板短棍':6,'合照短棍':10,'冷光短刃':9,'礼堂守夜刃':9,'唐卵的引雷杖':7,'黎明光剑':11,'脉冲手枪':8})[data.weapon]||0;if(!Array.isArray(data.weaponSlots)||data.weaponSlots.length!==2){data.weaponSlots=[data.weapon?{name:data.weapon,attack:data.weaponBonus,kind:data.weaponKind}:null,null];data.activeWeapon=data.weapon?0:-1;}if(!data.groundWeapons||typeof data.groundWeapons!=='object')data.groundWeapons={};if(!data.pendingWeapon||data.pendingWeapon.floor!==data.floor||!data.maps[data.floor][data.pendingWeapon.y]||data.maps[data.floor][data.pendingWeapon.y][data.pendingWeapon.x]!=='s')data.pendingWeapon=null;data.shopOpen=false;reveal(data);if(!data.checkpoint||data.checkpoint.floor!==data.floor||!Array.isArray(data.checkpoint.map)||data.checkpoint.map.length!==data.maps[data.floor].length||!Number.isInteger(data.checkpoint.x)||!Number.isInteger(data.checkpoint.y)||!Array.isArray(data.checkpoint.rescued)){data.checkpoint={floor:data.floor,x:data.x,y:data.y,bossDoor:Boolean(data.floor===0&&data.bossCheckpoint),pathChoice:data.pathChoice,routeRewardFound:data.routeRewardFound,keys:data.keys,gold:data.gold,rescued:data.rescued.slice(),fuse:Boolean(data.fuse),fuseInstalled:data.fuseInstalled,power:data.power,maintenanceOpen:data.maintenanceOpen,lightRestored:Boolean(data.lightRestored),echoClueRead:data.echoClueRead,echoSolved:data.echoSolved,map:data.maps[data.floor].map(row=>row.slice())};}
  Object.assign(data.checkpoint,{fuseInstalled:Boolean(data.checkpoint.fuseInstalled||data.checkpoint.lightRestored),power:data.checkpoint.power||(data.checkpoint.lightRestored?'hall':'off'),maintenanceOpen:Boolean(data.checkpoint.maintenanceOpen||data.checkpoint.lightRestored),echoClueRead:Boolean(data.checkpoint.echoClueRead),echoSolved:Boolean(data.checkpoint.echoSolved)});
  if(!data.checkpoint.regionName)data.checkpoint.regionName=regionAt(data.checkpoint.floor,data.checkpoint.x,data.checkpoint.y);
  if(typeof data.checkpoint.bossApproach!=='boolean')data.checkpoint.bossApproach=Boolean(data.checkpoint.floor===1&&data.checkpoint.y===7&&data.checkpoint.x>=9&&data.checkpoint.x<=13);
  if(typeof data.lightRestored!=='boolean'){
    data.fuse=false;data.lightRestored=Boolean(data.completed);
    if(!data.completed&&data.maps[1].length===9){data.maps[1][7][6]='f';data.maps[1][3][6]='L';}
  }
  if(data.completed){data.lightRestored=true;data.power='hall';data.fuseInstalled=true;data.maintenanceOpen=true;if(data.mapRevision===chapter.mapRevision&&data.maps[1].length>18){data.maps[1][12][18]='.';data.maps[1][18][18]='.';}}
  restoreMaintenanceShortcut(data.maps[1]);
  if(data.checkpoint.floor===1)restoreMaintenanceShortcut(data.checkpoint.map);
  if(data.floor===0&&data.pathChoice&&data.maps[0].length===23){
    const routeX=data.pathChoice==='storage'?3:19;
    const routeTile=data.maps[0][10][routeX];
    if(data.routeRewardFound||routeTile==='.'||data.groundWeapons['0:'+routeX+':10'])openDormGate(data);
  }
  data.pending=null;return data;
}
module.exports={chapter,start,move,resolve,restore,damage,hint,objective,regionName,checkpointName,buy,reveal,revive,equipSlot,switchWeapon,chooseWeapon,leaveWeapon,nearbyInteraction,interact,chooseDormRoute,nextFloor,answerEcho,closeEcho,selectPower,closePower,toggleMount};
