'use strict';
const core=require('./core');

// Continuous world coordinates are measured in map cells. Story interactions
// still use the shared chapter rules when the hero crosses a cell boundary.
function prepare(state,force=false){
  if(!force&&state.action&&Array.isArray(state.action.enemies)&&state.action.enemies.length===state.maps.length){if(!state.action.strike)state.action.strike=null;if(typeof state.action.inCombat!=='boolean')state.action.inCombat=false;if(!Number.isFinite(state.action.mountNotice))state.action.mountNotice=0;if(!Number.isFinite(state.action.comboStage))state.action.comboStage=0;if(!Number.isFinite(state.action.comboClock))state.action.comboClock=0;if(!Number.isFinite(state.action.comboNotice))state.action.comboNotice=0;if(typeof state.action.comboLabel!=='string')state.action.comboLabel='';state.action.enemies.forEach(list=>list.forEach(enemy=>{if(!Number.isFinite(enemy.windup))enemy.windup=0;if(typeof enemy.warning!=='boolean')enemy.warning=false;if(!Number.isFinite(enemy.stun))enemy.stun=0;if(!Number.isFinite(enemy.chargeCooldown))enemy.chargeCooldown=1;if(!Number.isFinite(enemy.charging))enemy.charging=0;if(!Number.isFinite(enemy.crashOpen))enemy.crashOpen=0;}));return;}
  state.action={x:state.x,y:state.y,floor:state.floor,facingX:0,facingY:-1,attackClock:0,hurtClock:0,slash:0,strike:null,inCombat:false,mountNotice:0,comboStage:0,comboClock:0,comboNotice:0,comboLabel:'',enemies:state.maps.map((map,index)=>{
    const floor=core.chapter.floors[index],list=[];
    map.forEach((row,y)=>row.forEach((tile,x)=>{
      if(tile!=='m'&&tile!=='b')return;
      const def=tile==='b'?floor.boss:floor.enemy;
      const special=floor.enemiesAt&&floor.enemiesAt[x+','+y]||{};
      list.push({x,y,originX:x,originY:y,type:tile,name:special.name||def.name,hp:special.hp||def.hp,maxHp:special.hp||def.hp,attack:special.attack||def.attack,defense:special.defense===undefined?def.defense:special.defense,gold:def.gold||0,behavior:special.behavior||(tile==='b'&&floor.id==='dorm'?'warden':'chase'),clock:0,windup:0,chargeCooldown:1.4,charging:0,chargeX:0,chargeY:0,stun:0,crashOpen:0});
    }));return list;
  })};
}
function blocked(state){return state.completed||state.defeated||state.message||state.pending||state.pendingWeapon||state.shopOpen||state.echoPuzzleOpen||state.powerPanelOpen||state.routeChoiceOpen||state.postBossOpen;}
function advanceAxis(state,axis,delta){
  if(!delta)return false;
  const action=state.action,current=axis==='x'?state.x:state.y,next=action[axis]+delta,target=Math.round(next);
  if(target!==current){
    const beforeFloor=state.floor;
    const ok=core.move(state,axis==='x'?target-current:0,axis==='y'?target-current:0,{action:true});
    if(!ok){
      // Stop at the wall edge. Resetting to the cell centre makes the hero
      // visibly snap backward every frame while the stick is held forward.
      action[axis]=current+Math.sign(delta)*.49;
      return false;
    }
    if(blocked(state)||state.floor!==beforeFloor||state[axis]===current){
      action.x=state.x;action.y=state.y;action.floor=state.floor;return ok;
    }
  }
  action[axis]=next;return false;
}
function passable(state,map,x,y){const tile=map[Math.round(y)]&&map[Math.round(y)][Math.round(x)];if((tile==='E'&&state.power!=='classroom')||(tile==='v'&&!state.maintenanceOpen))return false;return tile&&!'#CdqtLnxG'.includes(tile);}
function visible(state,map,from,to){
  const dx=to.x-from.x,dy=to.y-from.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*12));
  for(let i=1;i<steps;i++){const x=Math.round(from.x+dx*i/steps),y=Math.round(from.y+dy*i/steps),tile=map[y]&&map[y][x];if(!tile||tile==='#'||tile==='C'||tile==='G'||tile==='d'||(tile==='E'&&state.power!=='classroom')||(tile==='v'&&!state.maintenanceOpen))return false;}
  return true;
}
function finishEnemy(state,enemy){
  if(enemy.hp>0)return;
  if(!enemy.defeated){
    enemy.defeated=true;
    const action=state.action;
    if(action){
      if(!Array.isArray(action.bursts))action.bursts=[];
      action.bursts.push({floor:state.floor,type:enemy.type,x:enemy.x,y:enemy.y,life:.48,duration:.48});
    }
  }
  state.maps[state.floor][enemy.originY][enemy.originX]='.';
  const key=state.floor+':'+enemy.originX+':'+enemy.originY;
  state.rewardedEnemies=state.rewardedEnemies||{};
  if(!state.rewardedEnemies[key]){state.gold+=enemy.gold;state.rewardedEnemies[key]=true;}
}
function syncFollowers(state){
  const a=state.action,ids=state.rescued.map(id=>id==='dorm'?'ao':id==='corridor'?'tang':null).filter(Boolean);
  if(!Array.isArray(a.followers))a.followers=[];
  if(a.followFloor!==state.floor){a.followFloor=state.floor;a.followers=[];a.trail=[];}
  a.followers=a.followers.filter(f=>ids.includes(f.id));
  ids.forEach(id=>{if(!a.followers.some(f=>f.id===id))a.followers.push({id,x:a.x,y:a.y,clock:0,facing:1});});
  if(!Array.isArray(a.trail))a.trail=[];
}
function step(state,dt,input){
  prepare(state);
  if(blocked(state))return false;
  const action=state.action;
  if(action.floor!==state.floor){action.floor=state.floor;action.x=state.x;action.y=state.y;}
  dt=Math.max(0,Math.min(.1,dt));
  action.attackClock=Math.max(0,action.attackClock-dt);action.hurtClock=Math.max(0,action.hurtClock-dt);action.slash=Math.max(0,action.slash-dt);action.mountNotice=Math.max(0,(action.mountNotice||0)-dt);action.comboClock=Math.max(0,(action.comboClock||0)-dt);action.comboNotice=Math.max(0,(action.comboNotice||0)-dt);if(action.comboClock===0)action.comboStage=0;if(action.crashFlash){action.crashFlash.life-=dt;if(action.crashFlash.life<=0)action.crashFlash=null;}if(action.strike){action.strike.life-=dt;if(action.strike.life<=0)action.strike=null;}if(action.damagePopup){action.damagePopup.life-=dt;if(action.damagePopup.life<=0)action.damagePopup=null;}if(!Array.isArray(action.bursts))action.bursts=[];action.bursts.forEach(b=>b.life-=dt);action.bursts=action.bursts.filter(b=>b.life>0);
  const map=state.maps[state.floor],enemies=action.enemies[state.floor];
  const enemyClose=()=>enemies.some(enemy=>enemy.hp>0&&Math.hypot(enemy.x-action.x,enemy.y-action.y)<=3.25);
  action.inCombat=enemyClose()||Boolean(input.attack)||action.hurtClock>0;
  if(state.mounted&&action.inCombat){state.mounted=false;action.mountNotice=1.1;}
  let changed=false;
  const length=Math.hypot(input.x||0,input.y||0);
  if(length>.08){
    const dx=input.x/Math.max(1,length),dy=input.y/Math.max(1,length);
    action.facingX=dx;action.facingY=dy;
    const oldX=state.x,oldY=state.y,oldFloor=state.floor;
    const speed=state.mounted?4.8:3;
    advanceAxis(state,'x',dx*speed*dt);
    if(!blocked(state)&&state.floor===oldFloor)advanceAxis(state,'y',dy*speed*dt);
    changed=oldX!==state.x||oldY!==state.y||oldFloor!==state.floor;
  }
  if(blocked(state))return true;
  syncFollowers(state);
  const last=action.trail[action.trail.length-1];
  if(!last||Math.hypot(last.x-action.x,last.y-action.y)>.18)action.trail.push({x:action.x,y:action.y});
  if(action.trail.length>100)action.trail.shift();
  if(action.followerStrike){action.followerStrike.life-=dt;if(action.followerStrike.life<=0)action.followerStrike=null;}
  action.followers.forEach((f,index)=>{
    const previousX=f.x,previousY=f.y;
    const dest=action.trail[Math.max(0,action.trail.length-1-4*(index+1))],dx=dest.x-f.x,dy=dest.y-f.y,dist=Math.hypot(dx,dy);
    if(dist>.08){const step=Math.min(dist,2.6*dt),nx=f.x+dx/dist*step,ny=f.y+dy/dist*step;if(passable(state,map,nx,f.y))f.x=nx;if(passable(state,map,f.x,ny))f.y=ny;if(Math.abs(dx)>.03)f.facing=dx<0?-1:1;}
    if(Math.hypot(action.x-f.x,action.y-f.y)>5){f.x=action.x;f.y=action.y;}
    f.moving=Math.hypot(f.x-previousX,f.y-previousY)>.004;
    f.clock=Math.max(0,(f.clock||0)-dt);
    const target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<=1.6&&visible(state,map,f,e)).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0];
    if(target&&f.clock<=0){
      f.clock=2;
      if(Math.abs(target.x-f.x)>.08)f.facing=target.x<f.x?-1:1;
      const damage=Math.max(1,4-Math.floor(target.defense/4));
      target.hp-=damage;
      target.hit=.16;
      action.followerStrike={id:f.id,from:{x:f.x,y:f.y},to:{x:target.x,y:target.y},damage,life:.3};
      finishEnemy(state,target);
      changed=true;
    }
  });
  if(input.attack&&action.attackClock<=0){
    const kind=state.weaponKind||'sword',comboStage=action.comboClock>0?(action.comboStage%3)+1:1,finisher=comboStage===3,range=(kind==='pulse'?5:kind==='lightning'?3.8:kind==='saber'?2.1:kind==='cleave'?1.7:1.35)+(finisher&&kind==='cleave'?.25:0);
    action.attackClock=kind==='pulse'?.58:kind==='lightning'?.72:kind==='saber'?.42:kind==='cleave'?.52:.42;action.slash=.2;
    const aimLength=Math.hypot(input.aimX||0,input.aimY||0),aiming=aimLength>.35,aimX=aiming?input.aimX/aimLength:0,aimY=aiming?input.aimY/aimLength:0;
    const aimGate=kind==='sword'?.52:kind==='cleave'?.18:.38;
    const candidates=enemies.filter(e=>{if(e.hp<=0||Math.hypot(e.x-action.x,e.y-action.y)>range||!visible(state,state.maps[state.floor],action,e))return false;if(!aiming)return true;const dx=e.x-action.x,dy=e.y-action.y,distance=Math.hypot(dx,dy)||1;if(kind==='pulse')return dx*aimX+dy*aimY>0&&Math.abs(dx*aimY-dy*aimX)<=.38+distance*.1;if(kind==='saber')return dx*aimX+dy*aimY>0&&Math.abs(dx*aimY-dy*aimX)<=.48;return (dx*aimX+dy*aimY)/distance>=aimGate;}).sort((a,b)=>Math.hypot(a.x-action.x,a.y-action.y)-Math.hypot(b.x-action.x,b.y-action.y));
    const primary=candidates[0];
    let hits=primary?[primary]:[];
    if(primary&&kind==='lightning'){
      while(hits.length<(finisher?4:3)){const last=hits[hits.length-1],next=enemies.filter(e=>e.hp>0&&!hits.includes(e)&&Math.hypot(e.x-last.x,e.y-last.y)<=1.8&&visible(state,state.maps[state.floor],last,e)).sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0];if(!next)break;hits.push(next);}
    }else if(primary&&kind==='pulse'){
      const dx=primary.x-action.x,dy=primary.y-action.y,distance=Math.hypot(dx,dy)||1,fx=aiming?aimX:dx/distance,fy=aiming?aimY:dy/distance;
      hits=enemies.map(e=>{const ex=e.x-action.x,ey=e.y-action.y,along=ex*fx+ey*fy,distance=Math.hypot(ex,ey),cross=Math.abs(ex*fy-ey*fx);return{enemy:e,along,distance,cross};}).filter(v=>v.enemy.hp>0&&v.along>0&&v.along<=range&&v.cross<=.38+v.distance*.1&&visible(state,state.maps[state.floor],action,v.enemy)).sort((a,b)=>a.along-b.along).slice(0,finisher?4:3).map(v=>v.enemy);
    }else if(primary&&kind==='cleave'){
      const dx0=primary.x-action.x,dy0=primary.y-action.y,d0=Math.hypot(dx0,dy0)||1,fx=aiming?aimX:dx0/d0,fy=aiming?aimY:dy0/d0;
      hits=candidates.filter(e=>{const dx=e.x-action.x,dy=e.y-action.y,distance=Math.hypot(dx,dy)||1;return Math.hypot(e.x-primary.x,e.y-primary.y)<=.95&&(dx*fx+dy*fy)/distance>=.22;}).slice(0,finisher?4:3);
    }
    else if(primary&&kind==='saber'){
      const dx0=primary.x-action.x,dy0=primary.y-action.y,d0=Math.hypot(dx0,dy0)||1,fx=aiming?aimX:dx0/d0,fy=aiming?aimY:dy0/d0;
      const extra=candidates.filter(e=>{const dx=e.x-action.x,dy=e.y-action.y,along=dx*fx+dy*fy,cross=Math.abs(dx*fy-dy*fx);return e!==primary&&along>0&&cross<=.48;}).sort((a,b)=>Math.hypot(a.x-action.x,a.y-action.y)-Math.hypot(b.x-action.x,b.y-action.y)).slice(0,finisher?3:2);hits=[primary,...extra];
    }else if(primary&&finisher&&kind==='sword'){
      hits=[primary,...candidates.filter(e=>e!==primary&&Math.hypot(e.x-primary.x,e.y-primary.y)<=1.1).slice(0,2)];
    }
    if(primary){
      const dx=primary.x-action.x,dy=primary.y-action.y,distance=Math.hypot(dx,dy)||1;
      if(!aiming){action.facingX=dx/distance;action.facingY=dy/distance;}
      const targets=[];
      hits.forEach((enemy,index)=>{const scale=(kind==='pulse'?[.95,.76,.62,.5][index]:kind==='saber'?1.15:kind==='lightning'&&index>0?.7:kind==='cleave'&&index>0?.75:1)*(finisher?1.45:1),opening=enemy.crashOpen>0?2.4:1;const damage=Math.max(1,Math.round((state.attack-enemy.defense)*scale*opening));enemy.hp-=damage;enemy.hit=.16;targets.push({x:enemy.x,y:enemy.y,damage});finishEnemy(state,enemy);});
      const labels={sword:['起手斩','回身斩','三段终结'],cleave:['横扫','回旋击','震地终结'],saber:['光刃','追击刺','裂光终结'],pulse:['点射','连射','过载终结'],lightning:['引雷','跃电','雷链爆发']};
      const chain=labels[kind]||labels.sword;action.comboStage=comboStage;action.comboClock=1.8;action.comboNotice=.72;action.comboLabel=chain[comboStage-1];
      action.strike={kind,weaponName:state.weapon||'',comboStage,targets,angle:aiming?Math.atan2(aimY,aimX):Math.atan2(dy,dx),life:finisher ? .32 : .24};changed=true;
    }else{action.comboStage=0;action.comboClock=0;action.comboNotice=0;action.comboLabel='';}
  }
  enemies.forEach(enemy=>{
    if(enemy.hp<=0)return;
    enemy.clock=Math.max(0,enemy.clock-dt);enemy.hit=Math.max(0,(enemy.hit||0)-dt);enemy.chargeCooldown=Math.max(0,(enemy.chargeCooldown||0)-dt);enemy.stun=Math.max(0,(enemy.stun||0)-dt);enemy.crashOpen=Math.max(0,(enemy.crashOpen||0)-dt);
    const dx=action.x-enemy.x,dy=action.y-enemy.y,dist=Math.hypot(dx,dy),isBoss=enemy.behavior==='warden',isCharger=isBoss||enemy.behavior==='charge';
    if(enemy.stun>0)return;
    if(enemy.charging>0){
      enemy.charging=Math.max(0,enemy.charging-dt);
      const speed=isBoss?5.8:4.6,nx=enemy.x+enemy.chargeX*speed*dt,ny=enemy.y+enemy.chargeY*speed*dt,tx=Math.round(nx),ty=Math.round(ny),tile=map[ty]&&map[ty][tx];
      if(tile==='C'&&isBoss){enemy.stun=2.1;enemy.crashOpen=2.1;enemy.charging=0;enemy.warning=false;enemy.clock=2.3;action.crashFlash={x:enemy.x,y:enemy.y,life:1.05};changed=true;return;}
      if(!passable(state,map,nx,enemy.y)||!passable(state,map,enemy.x,ny)){enemy.charging=0;enemy.warning=false;enemy.clock=isBoss?1.2:.9;}
      else{enemy.x=nx;enemy.y=ny;}
      if(Math.hypot(action.x-enemy.x,action.y-enemy.y)<.62&&action.hurtClock<=0){
        const raw=Math.max(1,enemy.attack-state.defense+(isBoss?6:3)),absorbed=Math.min(state.guard||0,raw);state.guard-=absorbed;state.hp=Math.max(0,state.hp-(raw-absorbed));action.hurtClock=.5;action.damagePopup={amount:raw-absorbed,life:.7};enemy.charging=0;enemy.warning=false;enemy.clock=isBoss?1.7:1.2;changed=true;
        if(state.hp===0){state.defeated=true;state.message='你倒下了。门前检查点保留了路线和装备。';}
      }
      if(enemy.charging===0)enemy.chargeCooldown=isBoss?1.45:2.1;
      return;
    }
    if(isCharger&&dist<=(isBoss?6.5:4.5)&&enemy.chargeCooldown<=0&&enemy.windup<=0&&visible(state,map,enemy,action)){const d=dist||1;enemy.chargeX=dx/d;enemy.chargeY=dy/d;enemy.windup=isBoss?1.05:.72;enemy.warning=true;}
    if(enemy.windup>0){enemy.windup=Math.max(0,enemy.windup-dt);if(enemy.windup===0){enemy.warning=false;enemy.charging=isCharger?(isBoss?.85:.55):0;enemy.clock=isBoss?1.5:1.2;
      if(!isCharger&&dist<=.7&&action.hurtClock<=0){const raw=Math.max(1,enemy.attack-state.defense),absorbed=Math.min(state.guard||0,raw);state.guard-=absorbed;state.hp=Math.max(0,state.hp-(raw-absorbed));action.hurtClock=.42;action.damagePopup={amount:raw-absorbed,life:.7};changed=true;if(state.hp===0){state.defeated=true;state.message='你倒下了。门前检查点保留了路线和装备。';}}
    }}
    if(enemy.windup>0)return;
    if(enemy.charging>0)return;
    if(dist>Math.max(4,isBoss?6.5:4.5))return;
    if(dist>.7){const nx=enemy.x+dx/dist*dt*(isBoss?.8:.7),ny=enemy.y+dy/dist*dt*(isBoss?.8:.7);if(passable(state,map,nx,enemy.y))enemy.x=nx;if(passable(state,map,enemy.x,ny))enemy.y=ny;}
    else if(!isCharger&&enemy.clock<=0&&enemy.windup<=0){enemy.windup=.38;enemy.warning=true;}
  });
  return changed;
}
module.exports={prepare,step};
