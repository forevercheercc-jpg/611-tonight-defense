'use strict';
const {CHAPTERS,sectionFor}=require('./encounters');

// Standalone game rules. Numbers are prototype tuning, not final balance.
const CARDS = [
  {id:'ao',name:'敖犬',job:'守卫',tribe:'611',cost:1,atk:13,skill:'反击螺旋',desc:'被攻击三次后旋盾反击附近敌人'},
  {id:'zhi',name:'志兵',job:'守卫',tribe:'611',cost:2,atk:10,skill:'千手护阵',desc:'周期护盾，吸伤后爆炸'},
  {id:'csy',name:'CSY',job:'战士',tribe:'611',cost:2,atk:17,skill:'越战越勇',desc:'持续攻击逐渐增强'},
  {id:'tang',name:'唐卵',job:'法师',tribe:'611',cost:2,atk:14,skill:'一杖断灯',desc:'闪电跳跃攻击多个怪'},
  {id:'ge',name:'歌姬',job:'潜行者',tribe:'611',cost:3,atk:19,skill:'小贱连跳',desc:'对残血目标连续追击，游走时留影协防'},
  {id:'hong',name:'红星',job:'猎人',tribe:'611',cost:1,atk:15,skill:'猥琐撤',desc:'优先射击漏网怪，受击时向后撤步'},
  {id:'thorn',name:'赤斧酋长',job:'战士',tribe:'洞洞族',cost:1,atk:11,skill:'嘲讽',desc:'吸引附近怪物攻击自己，短暂提升护甲'},
  {id:'hammer',name:'岩之灵',job:'战士',tribe:'灵族',cost:1,atk:13,skill:'投掷',desc:'抛退怪物，落地伤害并眩晕周围敌人'},
  {id:'forge',name:'霸天者',job:'工匠',tribe:'哥布林',cost:1,atk:11,skill:'弹片冲击',desc:'持续发射弹片，伤害并短暂打断附近怪物'},
  {id:'gate',name:'海渊守卫',job:'战士',tribe:'海族',cost:2,atk:15,skill:'侵蚀',desc:'降低随机怪物的护甲'},
  {id:'blade',name:'剑客',job:'战士',tribe:'洞洞族',cost:2,atk:18,skill:'旋风斩',desc:'持续旋转，对近处怪物造成魔法伤害'},
  {id:'axe',name:'海象拳王',job:'战士',tribe:'野兽',cost:1,atk:20,skill:'北海神拳',desc:'强化普攻，将目标击飞'},
  {id:'swift',name:'狂战士',job:'战士',tribe:'冰川族',cost:3,atk:19,skill:'风之狂斧',desc:'切换目标或攻击时挥出狂斧，伤害一群怪物'},
  {id:'spear',name:'战神',job:'战士',tribe:'神族',cost:3,atk:0,skill:'持盾猛击',desc:'抵御正面攻击，周期击退前方怪物'},
  {id:'fire',name:'焰灵法师',job:'法师',tribe:'人族',cost:2,atk:15,skill:'神灭',desc:'重创随机怪物，随后提升自身攻速'},
  {id:'ice',name:'冰蝠',job:'法师',tribe:'龙族',extraTribe:'不眠',cost:1,atk:14,skill:'低温愈合',desc:'冰封并保护半血以下的队友，同时恢复生命'},
  {id:'bow',name:'光羽弩手',job:'猎人',tribe:'光羽族',cost:1,atk:16,skill:'星之矢',desc:'狙击最远怪物，距离越远伤害和眩晕越强'},
  {id:'shadow',name:'刺魂者',job:'潜行者',tribe:'哥布林',cost:1,atk:17,skill:'麻痹飞镖',desc:'向随机怪物投掷飞镖，造成伤害并短暂眩晕'},
  {id:'priest',name:'蚀光之暗',job:'牧师',tribe:'不眠',cost:3,atk:12,skill:'鲜血之潮',desc:'汲取受伤队友附近怪物的生命，治疗队友'}
];
const BY_ID = Object.fromEntries(CARDS.map(x=>[x.id,x]));
const CAP=[2,3,4,6,7];
const SHOP_SIZE=5;
const WAVE_SECONDS=72;
const PREP_SECONDS=6;
const BOSS_LIMIT_SECONDS=120;
const RESCUE_WAVE_SECONDS=35;
const RESCUE_PREP_SECONDS=3;
const RESCUE_BOSS_LIMIT_SECONDS=64;
const ITEMS={blade:{name:'战意剑',desc:'普攻伤害提升'},frost:{name:'冰霜符',desc:'攻击减速'},spark:{name:'电弧符',desc:'攻击额外目标'}};
function rng(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function choose(s,a){return a[Math.floor(rng(s)*a.length)];}
const ROLE_HP={'守卫':165,'战士':125,'潜行者':95,'法师':85,'猎人':90,'牧师':90,'工匠':135};
function newCard(s,id,star=1){const maxHp=Math.round(ROLE_HP[BY_ID[id].job]*(1+(star-1)*.65));return {uid:s.next++,id,star,atkClock:0,skillClock:0,charge:0,hp:maxHp,maxHp};}
function formationPoint(slot){return {x:.105+(slot%4)*.79/3,p:slot<4?.48:.70};}
function enemyX(id){return .5+((id%3)-1)*.082;}
function livingCards(s){return s.board.filter(c=>c&&c.hp>0);}
function distance(a,b){return Math.hypot(a.x-b.x,a.p-b.p);}
function monsterPoint(m){return {x:enemyX(m.id),p:m.p};}
function advance(c,destination,speed,dt,reach=0){
  const pos=c.position,dist=distance(pos,destination);
  if(dist<=reach||dist===0)return;
  const step=Math.min(speed*dt,dist-reach)/dist;
  pos.x+=(destination.x-pos.x)*step;
  pos.p+=(destination.p-pos.p)*step;
}
function create(seed,chapter='chapel'){
  if(!Object.prototype.hasOwnProperty.call(CHAPTERS,chapter))chapter='chapel';
  const s={seed:(seed||611)>>>0,chapter,next:1,time:0,wave:1,waveTime:0,prep:0,status:'playing',gold:12,base:100,maxBase:100,
  lane:1,travel:null,location:'lane',lanes:[0,1,2].map(i=>({hp:12,maxHp:12,shield:0,lost:false,monsters:[],spawn:3+i})),
  boss:null,board:Array(7).fill(null),bench:Array(8).fill(null),
  shop:[],locked:false,selected:null,combine:null,notices:[],effects:[],kills:0,combatProgress:0,damage:0,teamEnergy:0,teamCooldown:0,recallCooldown:0,rankXP:0};
  refresh(s,true);s.notices.push('开局先买伙伴，点击备战伙伴上阵');return s;}
function createRescue(seed,carry='tang'){
  const s=create(seed,'chapel');
  if(carry!=='tang'&&carry!=='hong')carry='tang';
  s.mode='rescue';s.board[0]=newCard(s,'ao');s.board[1]=newCard(s,carry);s.gold=0;s.shop=[];s.bench=[];
  s.rescue={carry,nextEvent:0,lastLane:-1,eventsAt:[14,48,81],active:null,saves:0,misses:0,supportUses:0,bossBreaks:0,baseSaved:0,supportReadyAt:0};
  s.lanes.forEach((lane,i)=>lane.spawn=2.5+i*.6);
  s.notices=['敖犬守前排。红色警报出现后，点对应路线去救场。'];
  return s;
}
function notice(s,message){s.notices.push(message);if(s.notices.length>5)s.notices.shift();}
function effect(s,kind,data,life){s.effects.push(Object.assign({kind,life,duration:life},data));if(s.effects.length>60)s.effects.shift();}
function refresh(s,free){if(s.status!=='playing')return false;if(!free){if(s.gold<2){notice(s,'金币不足，刷新需要 2 金币');return false;}s.gold-=2;}
  const pool=CARDS.filter(c=>c.cost<=Math.min(3,1+Math.floor((s.wave+1)/2)));
  const owned=s.board.concat(s.bench).filter(c=>c&&c.star===1);
  const weighted=pool.concat(pool.filter(c=>owned.filter(card=>card.id===c.id).length>=2));
  if(s.wave>=4&&pool.some(c=>c.id==='ge'))weighted.push(BY_ID.ge,BY_ID.ge,BY_ID.ge,BY_ID.ge,BY_ID.ge);
  s.shop=Array.from({length:SHOP_SIZE},()=>choose(s,weighted).id);return true;}
function combine(s){
  let changed=true;while(changed){changed=false;
    for(const def of CARDS){for(let star=1;star<3;star++){
      const all=[];s.board.forEach((c,i)=>{if(c&&c.id===def.id&&c.star===star)all.push({a:s.board,i,c});});
      s.bench.forEach((c,i)=>{if(c&&c.id===def.id&&c.star===star)all.push({a:s.bench,i,c});});
      if(all.length>=3){const dest=all[0],gear=all.slice(0,3).map(x=>x.c.item).filter(Boolean);all.slice(0,3).forEach(x=>x.a[x.i]=null);dest.a[dest.i]=newCard(s,def.id,star+1);if(gear.length){dest.a[dest.i].item=gear[0];s.gold+=gear.slice(1).reduce((n,item)=>n+4+(item.level-1)*4,0);}effect(s,'merge',{uid:dest.a[dest.i].uid,id:def.id,star:star+1},1.5);notice(s,def.name+' 合成 '+(star+1)+' 星！'+(gear.length>1?'多余装备已返金币':''));changed=true;break;}
    }if(changed)break;}
  }
}
function buy(s,index){if(s.status!=='playing'||index<0||index>=s.shop.length)return false;const id=s.shop[index];if(!id)return false;const def=BY_ID[id];if(s.gold<def.cost){notice(s,'金币不足');return false;}
  let slot=s.bench.indexOf(null);if(slot<0){const matches=s.board.concat(s.bench).filter(c=>c&&c.id===id&&c.star===1).length;if(matches<2){notice(s,'备战区已满，请先上阵或出售');return false;}s.bench.push(null);slot=s.bench.length-1;}
  s.gold-=def.cost;s.shop[index]=null;s.bench[slot]=newCard(s,id);effect(s,'buy',{uid:s.bench[slot].uid,id},.8);notice(s,def.name+' 已加入备战区');combine(s);if(s.bench.length>8)s.bench.pop();return true;}
function deploy(s,index){if(s.status!=='playing')return false;const c=s.bench[index];if(!c)return false;const cap=CAP[s.wave-1],slot=s.board.indexOf(null);if(slot<0||s.board.filter(Boolean).length>=cap){notice(s,'上阵已满，点上阵伙伴先下阵');return false;}s.board[slot]=c;s.bench[index]=null;effect(s,'deploy',{uid:c.uid,id:c.id},1);notice(s,BY_ID[c.id].name+' 已上阵');return true;}
function undeploy(s,index){const c=s.board[index],slot=s.bench.indexOf(null);if(!c)return false;if(slot<0){notice(s,'备战区已满');return false;}delete c.position;s.bench[slot]=c;s.board[index]=null;return true;}
function swapSlots(s,area,a,b){const slots=area==='board'?s.board:area==='bench'?s.bench:null;if(s.status!=='playing'||!slots||a<0||b<0||a>=slots.length||b>=slots.length||!slots[a])return false;[slots[a],slots[b]]=[slots[b],slots[a]];if(area==='board'){if(slots[a])delete slots[a].position;if(slots[b])delete slots[b].position;}return true;}
function equip(s,index,id){const c=s.board[index];if(s.status!=='playing'||!c||!ITEMS[id])return false;if(c.item){notice(s,'该伙伴已有装备');return false;}if(s.gold<4){notice(s,'装备需要 4 金币');return false;}s.gold-=4;c.item={id,level:1};notice(s,BY_ID[c.id].name+' 装备 '+ITEMS[id].name);return true;}
function upgradeItem(s,index){const c=s.board[index];if(s.status!=='playing'||!c||!c.item)return false;if(c.item.level>=2){notice(s,'装备已满级');return false;}if(s.gold<4){notice(s,'升级需要 4 金币');return false;}s.gold-=4;c.item.level++;notice(s,ITEMS[c.item.id].name+' 升至 2 级');return true;}
function sell(s,index){const c=s.bench[index];if(!c)return false;s.gold+=Math.max(1,BY_ID[c.id].cost*Math.pow(3,c.star-1)- (c.star>1?1:0))+(c.item?4+(c.item.level-1)*4:0);s.bench[index]=null;notice(s,'已出售 '+BY_ID[c.id].name+(c.item?'，装备返金币':''));return true;}
const SYNERGY_RULES={
  '守卫':[[2,'防线定时补充 12 点护盾'],[4,'防线定时补充 20 点护盾'],[6,'防线定时补充 30 点护盾']],
  '战士':[[2,'友方战士护甲 +4'],[4,'友方战士护甲 +8'],[6,'友方战士护甲 +16']],
  '法师':[[2,'敌方魔法抗性降低 15 个百分点'],[4,'降低 30 个百分点'],[6,'降低 70 个百分点']],
  '猎人':[[2,'友方猎人有 10% 概率追加普攻'],[4,'追加普攻概率 20%'],[6,'追加普攻概率 50%']],
  '洞洞族':[[2,'全队生命上限 +30'],[4,'全队生命上限 +80'],[6,'全队生命上限 +120，基地受损越多加成越高']],
  '牧师':[[2,'基地受到至少 2 点伤害时减免 10%'],[4,'基地伤害减免 20%'],[6,'基地伤害减免 30%']],
  '611':[[2,'室友普攻伤害 +5%'],[4,'室友普攻伤害 +8%'],[6,'室友普攻伤害 +10%，六人存活时积攒合击能量']]
};
function cardTags(card){return [card.tribe,card.extraTribe,card.job].filter(Boolean);}
function synergy(s){
  const unique=new Set(s.board.filter(Boolean).map(c=>c.id)),counts={};
  for(const id of unique)for(const name of cardTags(BY_ID[id]))counts[name]=(counts[name]||0)+1;
  return counts;
}
function tier(count,levels){return levels.reduce((active,level)=>count>=level?level:active,0);}
function synergyProgress(s,card){
  const counts=synergy(s);
  const names=card?cardTags(card):Object.keys(counts);
  const rows=names.map(name=>{
    const count=counts[name]||0,rule=SYNERGY_RULES[name]||[];
    const level=tier(count,rule.map(([threshold])=>threshold));
    const next=(rule.length?rule:[[2,null],[4,null],[6,null]]).find(([threshold])=>threshold>count);
    const effect=rule.find(([threshold])=>threshold===level)||next;
    const available=CARDS.filter(def=>cardTags(def).includes(name)).length;
    return {name,count,level,next:next?next[0]:null,effect:effect?effect[1]:null,available};
  });
  if(!card)rows.sort((a,b)=>Number(Boolean(b.level))-Number(Boolean(a.level))||Number(Boolean(b.effect))-Number(Boolean(a.effect))||b.count-a.count);
  return rows;
}
function activeSynergies(s){
  return synergyProgress(s).filter(row=>row.level).map(({name,level})=>({name,level}));
}
function move(s,target,index){if(s.status!=='playing'||s.boss||target!=='lane'||!Number.isInteger(index)||!s.lanes[index])return false;if(s.travel){notice(s,'队伍正在移动');return false;}
  if(s.lanes[index].lost){notice(s,'该防线已失守');return false;}
  if(s.location==='lane'&&s.lane===index){notice(s,'队伍已在这条路线');return false;}
  leaveEcho(s);
  s.board.forEach(c=>{if(c)delete c.position;});
  s.travel={target,index,t:s.mode==='rescue'?1.1:3};s.location='travel';notice(s,s.mode==='rescue'?'队伍赶去支援！原路线仍有敌人前进':'整队出发，途中无法守线');return true;}
function leaveEcho(s){
  if(s.location!=='lane')return;
  const slot=s.board.findIndex(c=>c&&c.hp>0&&c.id==='ge');
  if(slot<0)return;
  const lane=s.lanes[s.lane];
  lane.echo=9;
  lane.echoSlot=slot;
  lane.echoClock=0;
}
function recall(s){if(s.status!=='playing'||s.boss||s.travel||s.location==='high')return false;if(s.recallCooldown>0){notice(s,'回城冷却中 '+Math.ceil(s.recallCooldown)+' 秒');return false;}leaveEcho(s);s.travel={target:'high',index:0,t:2};s.location='travel';s.recallCooldown=30;notice(s,'回城引导中，2 秒后抵达高地');return true;}
function spawn(s,lane){const type=choose(s,sectionFor(s.chapter,s.wave).types),wave=s.wave;
  const hp=(type==='heavy'?58:type==='fast'?23:type==='healer'?30:33)*(1+(wave-1)*.25);
  lane.monsters.push({id:s.next++,type,p:0,hp,max:hp,slow:0,hitClock:0});}
function healerCasting(s,lane,m,index){
  if(m.type!=='healer')return false;
  if(m.healAt){
    if(m.healAt>s.time)return true;
    const target=lane.monsters.find(enemy=>enemy.id===m.healTarget&&enemy.hp>0&&Math.abs(enemy.p-m.p)<.24);
    m.healAt=0;m.nextHeal=s.time+6;
    if(target){
      const amount=Math.min(target.max-target.hp,target.max*.28);
      if(amount>0){
        target.hp+=amount;
        effect(s,'enemy-heal',{lane:index,monsterId:target.id,p:target.p,amount:Math.round(amount)},.6);
      }
    }
    return false;
  }
  if(m.p<.15||m.nextHeal>s.time)return false;
  const target=lane.monsters.find(enemy=>enemy!==m&&enemy.hp>0&&enemy.hp<enemy.max*.8&&Math.abs(enemy.p-m.p)<.2);
  if(!target)return false;
  m.healTarget=target.id;m.healAt=s.time+1.8;
  return true;
}
function hit(s,m,n,source){if(m.hp<=0)return;const d=Math.min(m.hp,n);m.hp-=n;m.hitAt=s.time;s.damage+=d;effect(s,'hit',{lane:s.lane,monsterId:m.id,p:m.p,amount:Math.max(1,Math.round(d)),source},.65);}
function skillFx(s,c,cue,targets=[]){
  effect(s,'hero-skill',{
    lane:s.lane,id:c.id,slot:s.board.indexOf(c),origin:c.position&&{...c.position},cue,
    targets:targets.map(m=>({id:m.id,p:m.p}))
  },.42);
}
function heal(s,c,target,value){
  const amount=Math.min(target.maxHp-target.hp,value);
  if(amount<=0)return;
  target.hp+=amount;
  effect(s,'heal',{lane:s.lane,id:c.id,origin:{...c.position},position:{...target.position},amount:Math.round(amount)},.55);
}
function magicHit(s,c,m,power,mageTier){
  const resistance=.3-(mageTier>=6?.7:mageTier>=4?.3:mageTier>=2?.15:0);
  hit(s,m,power*(1-resistance),c.id);
}
function rosterSkill(s,c,lane,target,power,mageTier){
  if(c.skillClock>0)return;
  const nearby=(position,range)=>lane.monsters.filter(m=>m.hp>0&&distance(position,monsterPoint(m))<=range);
  const enemies=lane.monsters.filter(m=>m.hp>0);
  const cast=(cooldown,cue,targets)=>{c.skillClock=cooldown;skillFx(s,c,cue,targets);};
  switch(c.id){
    case 'priest': {
      const allies=livingCards(s).filter(a=>a.hp<a.maxHp&&distance(a.position,c.position)<=.55)
        .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
      for(const ally of allies){
        const donors=nearby(ally.position,.23);
        if(!donors.length)continue;
        let drained=0;
        for(const m of donors){
          const amount=Math.min(m.hp,m.max*(.13+.03*c.star));
          drained+=amount;hit(s,m,amount,c.id);m.max=Math.max(1,m.max-amount);
        }
        heal(s,c,ally,drained);cast(5,'drain',donors);break;
      }
      break;
    }
    case 'ice': {
      const ally=livingCards(s).filter(a=>a.hp<a.maxHp*.5&&distance(a.position,c.position)<=.55)
        .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
      if(ally){ally.frozenUntil=s.time+2;ally.iceSource={...c.position};ally.iceHeal=2;cast(9,'frostWard',[]);}
      break;
    }
    case 'thorn': {
      const close=nearby(c.position,.15);
      if(close.length){c.tauntUntil=s.time+2.5;for(const m of close)m.tauntedBy=c.uid;cast(7,'taunt',close);}
      break;
    }
    case 'hammer': {
      const close=nearby(c.position,.095)[0];
      if(close){close.p=Math.max(0,close.p-.07);const landing=nearby(monsterPoint(close),.12);for(const m of landing){hit(s,m,18*c.star,c.id);m.stunUntil=s.time+1.5;}cast(7,'slam',landing);}
      break;
    }
    case 'forge':
    case 'blade':
      if(nearby(c.position,.14).length){c.channelUntil=s.time+5;c.channelNext=s.time;c.skillClock=10;}
      break;
    case 'gate':
      if(target&&enemies.length){const m=choose(s,enemies);m.armorDownUntil=s.time+20;cast(8,'corrode',[m]);}
      break;
    case 'axe':
      if(target&&c.atkClock<=0&&distance(c.position,monsterPoint(target))<=.09){target.stunUntil=s.time+1;hit(s,target,power*2,c.id);cast(7,'slam',[target]);}
      break;
    case 'swift':
      if(target&&(c.lastTarget!==target.id||rng(s)<.2)){
        const close=nearby(monsterPoint(target),.18);
        close.forEach(m=>{hit(s,m,power*.75,c.id);m.hitClock+=.3;});
        cast(.9,'fury',close);
      }
      break;
    case 'spear': {
      const front=nearby(c.position,.25).filter(m=>m.p<=c.position.p);
      if(front.length){front.forEach(m=>{hit(s,m,32*c.star,c.id);m.p=Math.max(0,m.p-.065);});cast(10,'slam',front);}
      break;
    }
    case 'fire':
      if(target&&enemies.length){const m=choose(s,enemies);magicHit(s,c,m,48*c.star,mageTier);c.hasteUntil=s.time+30;cast(8,'fire',[m]);}
      break;
    case 'bow':
      if(target&&enemies.length){
        const m=enemies.sort((a,b)=>distance(c.position,monsterPoint(b))-distance(c.position,monsterPoint(a)))[0];
        const span=Math.min(1,distance(c.position,monsterPoint(m)));
        magicHit(s,c,m,(5+36*span)*c.star,mageTier);m.stunUntil=s.time+1+span*4;
        cast(7,'arrowSkill',[m]);
      }
      break;
    case 'shadow':
      if(target&&enemies.length){const m=choose(s,enemies);magicHit(s,c,m,39*c.star,mageTier);m.stunUntil=s.time+.1;cast(7,'dart',[m]);}
      break;
  }
}
function attackLane(s,dt){const lane=s.lanes[s.lane];if(lane.lost)return;const sync=synergy(s),living=livingCards(s),guard=(sync['守卫']||0),mageTier=tier(sync['法师']||0,[2,4,6]);
  const cave=tier(sync['洞洞族']||0,[2,4,6]);
  living.forEach(c=>{
    if(!c.position)c.position=formationPoint(s.board.indexOf(c));
    const bonus=cave===6?120+(1-s.base/s.maxBase)*180:cave===4?80:cave===2?30:0;
    const maxHp=Math.round(ROLE_HP[BY_ID[c.id].job]*(1+(c.star-1)*.65)+bonus);
    if(c.maxHp!==maxHp){c.hp=c.hp/c.maxHp*maxHp;c.maxHp=maxHp;}
  });
  living.forEach(c=>{
    c.atkClock-=dt;c.skillClock-=dt;
    const def=BY_ID[c.id],slot=s.board.indexOf(c),home=formationPoint(slot);
    if(c.frozenUntil>s.time){
      if(c.iceHeal>0&&c.frozenUntil-s.time<=c.iceHeal){
        c.iceHeal--;heal(s,{id:'ice',position:c.iceSource},c,4+c.maxHp*.1);
      }
      return;
    }
    const ranged=def.job==='法师'||def.job==='猎人'||def.job==='牧师';
    const reach=ranged ? .58 : .095;
    const threats=lane.monsters.filter(m=>m.hp>0&&m.p<=.91&&(ranged
      ? distance(home,monsterPoint(m))<=1.05
      : Math.abs(m.p-home.p)<=.34));
    threats.sort((a,b)=>s.mode==='rescue'&&c.id==='hong'?b.p-a.p:distance(home,monsterPoint(a))-distance(home,monsterPoint(b)));
    const target=threats[0];
    if(!ranged){
      if(target)advance(c,monsterPoint(target),c.id==='ge'?.62:.42,dt,reach*.75);
      else advance(c,home,.34,dt);
    }else advance(c,home,.42,dt);
    const roommateTier=tier(sync['611']||0,[2,4,6]);
    const multiplier=def.tribe==='611'?(roommateTier>=6?1.10:roommateTier>=4?1.08:roommateTier>=2?1.05:1):1;
    const rescueBoost=s.mode==='rescue'&&s.rescue?1+s.rescue.saves*.12:1;
    const pow=(def.atk*(1+(c.star-1)*.85)+(c.item&&c.item.id==='blade'?c.item.level*5:0))*multiplier*rescueBoost;
    if(def.tribe!=='611')rosterSkill(s,c,lane,target,pow,mageTier);
    if(c.channelUntil>s.time&&c.channelNext<=s.time){
      let close=lane.monsters.filter(m=>m.hp>0&&distance(c.position,monsterPoint(m))<=(c.id==='forge'?.24:.14));
      if(c.id==='forge'&&close.length){close=[choose(s,close)];close[0].stunUntil=s.time+.1;}
      close.forEach(m=>magicHit(s,c,m,(c.id==='forge'?8:13)*c.star,mageTier));
      if(close.length)skillFx(s,c,c.id==='forge'?'shrapnel':'counter',close);
      c.channelNext=s.time+(c.id==='forge'?.7:1);
    }
    const targets=target&&target.hp>0&&distance(c.position,monsterPoint(target))<=reach ? threats : [];
    if(targets.length&&c.atkClock<=0&&c.id!=='spear'){
      c.atkClock=(c.id==='swift'?.55:.88)/(c.hasteUntil>s.time?1.4:1);
      effect(s,'shot',{lane:s.lane,id:c.id,slot,origin:{...c.position},charge:c.id==='csy'?Math.min(8,c.charge+1):0,targetId:targets[0].id,p:targets[0].p},ranged ? .18 : .26);
      const physical=pow*(target.armorDownUntil>s.time?1.35:1);
      hit(s,targets[0],physical,c.id);
      const hunter=tier(sync['猎人']||0,[2,4,6]);
      if(def.job==='猎人'&&hunter>=2&&rng(s)<(hunter>=6?.5:hunter>=4?.2:.1))hit(s,target,physical,c.id);
      if(c.item&&c.item.id==='frost')targets[0].slow=1+c.item.level;
      if(c.item&&c.item.id==='spark')targets.slice(1,2+c.item.level).forEach(m=>hit(s,m,pow*.3));
      if(c.id==='csy'){c.charge=Math.min(8,c.charge+1);hit(s,targets[0],c.charge*1.2,c.id);if(c.charge===8&&c.skillClock<=0){c.skillClock=3;skillFx(s,c,'fury');}}
      if(c.id==='tang'&&c.skillClock<=0){
        c.skillClock=4.8;
        const chain=targets.slice(1,4+c.star).filter(m=>m.hp>0);
        chain.forEach(m=>magicHit(s,c,m,pow*.85,mageTier));
        skillFx(s,c,'chain',[targets[0],...chain]);s.flash=.35;
      }
      if(c.id==='ge'&&targets[0].hp<=0){
        const chase=targets.slice(1,1+c.star).filter(m=>m.hp>0);
        chase.forEach(m=>hit(s,m,pow*.75,c.id));
        if(chase.length)skillFx(s,c,'chase',[targets[0],...chase]);
      }
      c.lastTarget=target.id;
    }
    if(target&&c.id==='zhi'&&c.skillClock<=0){c.skillClock=7;const oldShield=lane.shield;lane.shield=Math.min(100,lane.shield+35*c.star);if(lane.shield>oldShield)skillFx(s,c,'shield');}
  });
  lane.guardClock=Math.max(0,(lane.guardClock||0)-dt);
  if(guard>=2&&lane.shield<=0&&lane.guardClock<=0){lane.shield=guard>=6?30:guard>=4?20:12;lane.guardClock=8;}
  if(new Set(living.filter(c=>BY_ID[c.id].tribe==='611').map(c=>c.id)).size>=6){s.teamEnergy+=dt; if(s.teamEnergy>=25&&s.teamCooldown<=0){const targets=lane.monsters.filter(m=>m.hp>0);targets.forEach(m=>hit(s,m,80));effect(s,'team-combo',{lane:s.lane,targets:targets.map(m=>({id:m.id,p:m.p}))},1.1);s.teamEnergy=0;s.teamCooldown=25;notice(s,'611 合击：我一贱，你就笑！');}}
}
function aiLane(s,idx,dt){const lane=s.lanes[idx];if(lane.lost)return;lane.ai=(lane.ai||0)-dt;const target=lane.monsters.filter(m=>m.hp>0&&m.p>.16&&!m.rescueThreat).sort((a,b)=>b.p-a.p)[0];if(target&&lane.ai<=0){lane.ai=.65;target.hp-=18+s.wave*3;target.hitAt=s.time;}}
function makeRescueThreat(s,index){
  let options=[0,2].filter(i=>!s.lanes[i].lost);
  if(options.length>1&&s.rescue.lastLane>=0)options=options.filter(i=>i!==s.rescue.lastLane);
  if(!options.length)options=s.lanes.map((lane,i)=>lane.lost?-1:i).filter(i=>i>=0);
  const laneIndex=options.length?choose(s,options):-1;
  if(laneIndex<0)return;
  s.rescue.lastLane=laneIndex;
  const lane=s.lanes[laneIndex],id=s.next++;
  const monster={id,type:'heavy',p:.50,hp:126,max:126,slow:0,hitClock:0,rescueThreat:true,
    castAt:s.time+2,castUntil:s.time+8,casting:false,castResolved:false};
  lane.monsters.push(monster);
  s.rescue.active={id,lane:laneIndex,deadline:s.time+30,usedSupport:false};
  effect(s,'rescue-warning',{lane:laneIndex,monsterId:id,p:monster.p},1.2);
  notice(s,'警报：'+['上路','中路','下路'][laneIndex]+'出现破门怪！点路线赶去拦截');
}
function rescueSkill(s){
  if(s.status!=='playing'||s.mode!=='rescue'||!s.rescue)return false;
  if(s.time<s.rescue.supportReadyAt){notice(s,'援护还在蓄力 '+Math.ceil(s.rescue.supportReadyAt-s.time)+' 秒');return false;}
  if(s.boss&&s.boss.hp>0&&s.boss.cast<=2){
    const plan=CHAPTERS[s.chapter].boss;s.boss.cast=Math.max(5,plan.castTime);s.rescue.supportReadyAt=s.time+12;
    s.rescue.supportUses++;s.rescue.bossBreaks++;s.rescue.baseSaved+=9;
    effect(s,'rescue-break',{lane:1,p:.82,boss:true},1.05);notice(s,'首领蓄力被打断！避免基地受损 9 点');return true;
  }
  const event=s.rescue.active;
  if(!event){notice(s,'先等红色警报出现');return false;}
  if(s.location!=='lane'||s.lane!==event.lane){notice(s,'先赶到红色警报所在路线');return false;}
  const monster=s.lanes[event.lane].monsters.find(m=>m.id===event.id&&m.hp>0);
  if(!monster){notice(s,'破门怪已被拦下');return false;}
  if(!monster.casting||s.time>monster.castUntil){notice(s,'等破门怪亮起蓄力红光，再按援护');return false;}
  monster.castResolved=true;monster.casting=false;monster.hp=0;
  event.usedSupport=true;s.rescue.supportReadyAt=s.time+12;s.rescue.supportUses++;s.rescue.baseSaved+=10;
  effect(s,'rescue-break',{lane:event.lane,monsterId:event.id,p:monster.p},1.05);
  notice(s,'打断成功！破门怪被击退，避免基地受损 10 点');
  return true;
}
function defendWithEcho(s,lane,index,dt){
  if(!lane.echo||lane.lost)return;
  lane.echoClock-=dt;
  if(lane.echoClock>0)return;
  const m=lane.monsters.find(enemy=>enemy.p>.3&&enemy.hp>0);
  if(!m)return;
  lane.echoClock=1;
  m.hp-=15;m.hitAt=s.time;
  effect(s,'shot',{lane:index,id:'ge',slot:lane.echoSlot,targetId:m.id,p:m.p},.26);
}
function monsterAttack(s,lane,m,defender,warriorTier){
  m.hitClock=1.4;
  if(defender.frozenUntil>s.time)return;
  const armor=(BY_ID[defender.id].job==='战士'?(warriorTier>=6?16:warriorTier>=4?8:warriorTier>=2?4:0):0)+(defender.tauntUntil>s.time?10:0);
  const facing=defender.id==='spear'&&m.p<=defender.position.p?.7:1;
  const job=BY_ID[defender.id].job;
  const exposure=job==='守卫'?1:job==='战士'?.78:job==='潜行者'?.52:.4;
  const damage=Math.max(1,Math.round(((m.type==='heavy'?14:m.type==='fast'?7:10)+s.wave)*facing*exposure/(1+.06*armor)));
  const absorbed=Math.min(lane.shield,damage);
  lane.shield-=absorbed;
  const amount=Math.min(defender.hp,damage-absorbed);
  defender.hp-=amount;
  defender.hitAt=s.time;
  effect(s,'hero-hurt',{lane:s.lane,position:{...defender.position},amount,absorbed},.42);
  if(defender.hp>0&&defender.id==='ao'){
    defender.charge++;
    if(defender.charge>=3){
      defender.charge=0;
      const targets=lane.monsters.filter(enemy=>enemy.hp>0&&distance(defender.position,monsterPoint(enemy))<=.19);
      targets.forEach(enemy=>hit(s,enemy,24*defender.star,defender.id));
      skillFx(s,defender,'counter',targets);
    }
  }
  if(defender.hp>0&&defender.id==='hong'&&defender.skillClock<=0){
    defender.skillClock=6;
    skillFx(s,defender,'retreat');
    defender.position.p=Math.min(.9,defender.position.p+.11);
  }
  const zhi=absorbed>0&&lane.shield===0&&livingCards(s).find(c=>c.id==='zhi');
  if(zhi){
    const targets=lane.monsters.filter(enemy=>enemy.hp>0&&distance(defender.position,monsterPoint(enemy))<=.22);
    targets.forEach(enemy=>hit(s,enemy,24,zhi.id));
    skillFx(s,zhi,'break',targets);
  }
}
function damageBase(s,amount){
  const priest=tier(synergy(s)['牧师']||0,[2,4,6]);
  if(amount>=2&&priest)amount-=Math.round(amount*(priest>=6?.3:priest>=4?.2:.1));
  s.base=Math.max(0,s.base-amount);
}
function armyPower(s){
  const roommateTier=tier(synergy(s)['611']||0,[2,4,6]);
  return livingCards(s).reduce((power,c)=>{const multiplier=BY_ID[c.id].tribe==='611'?(roommateTier>=6?1.10:roommateTier>=4?1.08:roommateTier>=2?1.05:1):1;return power+(BY_ID[c.id].atk*(1+(c.star-1)*.85)+(c.item&&c.item.id==='blade'?c.item.level*5:0))*multiplier;},0);
}
function makeBoss(chapter){
  const plan=CHAPTERS[chapter].boss;
  const hp=chapter==='tower'?9800:8200;return {hp,max:hp,hit:0,cast:plan.castTime,phase:0,adds:[],ritual:0};
}
function canInterruptBoss(s){
  return s.status==='playing'&&Boolean(s.boss)&&s.boss.ritual>0&&s.boss.adds.some(add=>add.kind==='cleric'&&add.hp>0)
    &&livingCards(s).some(c=>['hammer','axe','bow','shadow'].includes(c.id));
}
function interruptBoss(s){
  if(!canInterruptBoss(s))return false;
  s.boss.ritual=0;
  s.boss.interruptedAt=s.time;
  notice(s,'复苏仪式被打断！');
  return true;
}
function startBossInterlude(s,b,plan){
  if(s.mode==='rescue'){b.phase=2;b.cast=8;notice(s,'首领露出破绽！继续集火，留意下一次蓄力');return;}
  const chapel=s.chapter==='chapel';
  b.phase=1;
  b.adds=(chapel?['cleric']:['flame','flame']).map((kind,i)=>({
    kind,name:chapel?plan.addName:(i===0?'左':'右')+'侧'+plan.addName,hp:plan.addHp,max:plan.addHp
  }));
  b.ritual=chapel?5:0;
  b.cast=chapel?plan.castTime:6;
  notice(s,chapel?'司礼官开始复苏！':'守望者升空，先击倒两只余烬火灵');
}
function fightBoss(s,b,dt,power){
  const plan=CHAPTERS[s.chapter].boss;
  b.hit-=dt;
  if(power&&b.hit<=0){
    b.hit=.75;
    const add=b.adds.find(add=>add.hp>0);
    const target=add||b;
    target.hp=Math.max(0,target.hp-power);
    target.hitAt=s.time;
    if(!add&&b.hp>0&&b.phase===0&&b.hp<=b.max*plan.turnAt)startBossInterlude(s,b,plan);
  }
  if(b.hp<=0)return;
  if(b.phase===1){
    const priest=b.adds.find(add=>add.kind==='cleric'&&add.hp>0);
    if(priest&&b.ritual>0){
      b.ritual=Math.max(0,b.ritual-dt);
      if(b.ritual===0){
        b.hp=Math.min(b.max,b.hp+Math.round(b.max*.12));
        b.adds.push({kind:'warden',name:'复苏卫士',hp:220,max:220});
        notice(s,'司礼官完成复苏，卫士重新加入战斗！');
      }
    }
    if(b.adds.every(add=>add.hp<=0)){
      b.phase=2;b.ritual=0;b.cast=7;
      notice(s,s.chapter==='chapel'?'指挥官再战！':'两只火灵已击倒，守望者降落！');
    }
    if(s.chapter==='chapel'&&b.phase===1)return;
  }
  if(s.chapter==='tower'&&b.phase===2&&b.hp<=b.max*.25){
    b.phase=3;b.cast=Math.min(b.cast,4);
    notice(s,'裂翼守望者进入狂暴！');
  }
  b.cast-=dt;
  if(b.cast<=0){
    const airborne=s.chapter==='tower'&&b.phase===1;
    b.cast=b.phase===0?plan.castTime:b.phase===3?5:airborne?6:9;
    b.slamAt=s.time;
    damageBase(s,b.phase===3?12:9);
    notice(s,airborne?'高地遭到灼光扫射！':plan.name+'猛击基地！');
  }
}
function settleRescueAtBoss(s){
  if(!s.rescue||!s.rescue.active)return;
  const event=s.rescue.active,lane=s.lanes[event.lane],monster=lane&&lane.monsters.find(m=>m.id===event.id);
  if(monster&&monster.hp<=0&&!monster.escaped){
    monster.rescueResolved=true;s.rescue.saves++;if(!event.usedSupport)s.rescue.baseSaved+=10;
    effect(s,'rescue-save',{lane:event.lane,monsterId:event.id,p:monster.p},.9);
  }else{
    s.rescue.misses++;
    if(monster&&monster.hp>0){
      monster.rescueResolved=true;monster.hp=0;monster.escaped=true;
      lane.monsters=lane.monsters.filter(m=>m.id!==event.id);
      damageBase(s,10);
      effect(s,'rescue-breach',{lane:event.lane,monsterId:event.id,p:monster.p},.9);
    }
  }
  s.rescue.active=null;
}
function settleRescueIntercept(s,lane,index,monster){
  if(s.mode!=='rescue'||!monster.rescueThreat||monster.rescueResolved)return;
  monster.rescueResolved=true;s.rescue.saves++;s.rescue.baseSaved+=10;
  if(s.rescue.active&&s.rescue.active.id===monster.id)s.rescue.active=null;
  effect(s,'rescue-save',{lane:index,monsterId:monster.id,p:monster.p},.9);
  notice(s,'破门怪被高地火力拦下！避免基地受损 10 点');
}
function step(s,dt){if(s.status!=='playing')return;dt=Math.min(.1,Math.max(0,dt));s.effects.forEach(e=>e.life-=dt);s.effects=s.effects.filter(e=>e.life>0);s.time+=dt;s.waveTime+=dt;s.flash=Math.max(0,(s.flash||0)-dt);s.teamCooldown=Math.max(0,s.teamCooldown-dt);
  const rescue=s.mode==='rescue',waveSeconds=rescue?RESCUE_WAVE_SECONDS:WAVE_SECONDS,maxWaves=rescue?3:5,prepSeconds=rescue?RESCUE_PREP_SECONDS:PREP_SECONDS,bossLimit=rescue?RESCUE_BOSS_LIMIT_SECONDS:BOSS_LIMIT_SECONDS;
  if(rescue&&s.rescue.nextEvent<s.rescue.eventsAt.length&&s.time>=s.rescue.eventsAt[s.rescue.nextEvent]&&!s.rescue.active){makeRescueThreat(s,s.rescue.nextEvent);s.rescue.nextEvent++;}
  s.recallCooldown=Math.max(0,s.recallCooldown-dt);if(s.travel){s.travel.t-=dt;if(s.travel.t<=0){const t=s.travel;s.travel=null;if(t.target==='lane'&&s.lanes[t.index].lost){s.location='high';notice(s,'目标失守，队伍退回高地');}else{s.location=t.target;if(t.target==='lane')s.lane=t.index;}}}
  if(s.prep>0){s.prep=Math.max(0,s.prep-dt);s.waveTime=0;return;}
  if(s.waveTime>=waveSeconds&&s.wave<maxWaves){s.wave++;s.waveTime=0;if(!rescue){s.gold+=8;if(!s.locked)refresh(s,true);}s.prep=prepSeconds;notice(s,rescue?'队伍整顿完成！下一批敌人来了':'第 '+s.wave+' 波：上阵上限 '+CAP[s.wave-1]);
    for(const c of s.board.concat(s.bench)){if(c&&c.maxHp){c.hp=c.maxHp;delete c.position;}}}
  if(s.wave===maxWaves&&s.waveTime>=waveSeconds&&!s.boss){s.waveTime=0;if(rescue)settleRescueAtBoss(s);s.lanes.forEach(l=>{l.lost=true;});s.location='high';s.travel=null;s.boss=makeBoss(s.chapter);if(rescue){s.boss.hp=1800;s.boss.max=1800;s.boss.adds=[];s.boss.cast=8;notice(s,'救场结算：拦截 '+s.rescue.saves+' 次 · 漏怪 '+s.rescue.misses+' 次。'+CHAPTERS[s.chapter].boss.name+'冲上高地！');}else notice(s,'最终波突破防线！首领降临高地，全员迎战');}
  if(s.prep>0)return;
  const warriorTier=tier(synergy(s)['战士']||0,[2,4,6]);
  if(!s.boss){s.lanes.forEach((l,i)=>{l.echo=Math.max(0,(l.echo||0)-dt);l.spawn-=dt;if(l.spawn<=0){l.spawn=Math.max(4.5,7.5-s.wave*.4);const burst=1+Math.floor(s.wave/2)+(s.wave>=4&&s.waveTime>=waveSeconds*.48?1:0);for(let n=0;n<burst&&l.monsters.length<35;n++)spawn(s,l);}
    if(i===s.lane&&s.location==='lane'&&!l.lost)attackLane(s,dt);
    else{if(i!==1)aiLane(s,i,dt);defendWithEcho(s,l,i,dt);}
    l.monsters.forEach(m=>{
      if(m.hp<=0)return;
      if(m.stunUntil>s.time){
        if(m.healAt){m.healAt=0;m.nextHeal=s.time+4;effect(s,'enemy-interrupted',{lane:i,monsterId:m.id,p:m.p},.55);}
        return;
      }
      if(healerCasting(s,l,m,i))return;
      m.slow=Math.max(0,m.slow-dt);m.hitClock-=dt;
      if(m.rescueThreat&&!m.castResolved&&s.time>=m.castAt&&s.time<=m.castUntil)m.casting=true;
      if(m.rescueThreat&&s.time>m.castUntil)m.casting=false;
      let defender=null,closest=.10,guard=null,guardGap=.13;
      if(i===s.lane&&s.location==='lane'&&!l.lost){
        for(const c of livingCards(s)){
          const gap=distance(c.position,monsterPoint(m));
          if(m.tauntedBy===c.uid&&c.tauntUntil>s.time&&gap<.19){defender=c;break;}
          const job=BY_ID[c.id].job;
          if((job==='守卫'||job==='战士')&&gap<guardGap){guard=c;guardGap=gap;}
          if(gap<closest){closest=gap;defender=c;}
        }
        if(guard)defender=guard;
      }
      if(defender&&m.hitClock<=0)monsterAttack(s,l,m,defender,warriorTier);
      if(m.hp<=0)return;
      if(!defender||defender.hp<=0){
        const woundedScout=s.chapter==='tower'&&s.wave>=4&&m.type==='fast'&&m.hp<m.max*.5;
        m.p+=dt*(m.type==='fast'?.038:m.type==='heavy'?.019:.026)*(m.slow>0?.55:1)*(woundedScout?1.5:1);
      }
      if(m.p>=.86&&!m.leaked&&!l.lost){m.leaked=true;l.hp-=m.type==='heavy'?2:1;if(l.hp<=0){l.hp=0;l.lost=true;if(i===s.lane&&s.location==='lane'){s.location='high';notice(s,'防线失守，队伍退回高地');}}}
      if(m.p>=1){
        damageBase(s,m.rescueThreat?10:m.type==='heavy'?5:3);m.hp=0;m.escaped=true;
        if(m.rescueThreat&&rescue&&!m.rescueResolved){m.rescueResolved=true;s.rescue.misses++;s.rescue.active=null;notice(s,'破门怪冲进基地！这次没拦住');}
      }
    });l.monsters=l.monsters.filter(m=>{
      if(m.hp>0)return true;
      if(m.rescueThreat&&rescue&&!m.rescueResolved){
        m.rescueResolved=true;s.rescue.saves++;s.rescue.active=null;
        const assisted=s.rescue.supportUses>0&&m.castResolved;
        if(!assisted)s.rescue.baseSaved+=10;
        effect(s,'rescue-save',{lane:i,monsterId:m.id,p:m.p},.9);
        notice(s,assisted?'成功救场！及时打断破门怪，避免基地受损 10 点':'破门怪被击杀！避免基地受损 10 点，全队伤害提高 12%');
      }
      if(!m.escaped){
        s.kills++;
        if(i===s.lane&&s.location==='lane'&&!l.lost){
          s.combatProgress=(s.combatProgress||0)+1;
          if(s.combatProgress>=8){s.combatProgress-=8;s.gold+=2;notice(s,'守线击败 8 个敌人，获得 2 金币');}
        }
        effect(s,'enemy-down',{lane:i,monsterId:m.id,p:m.p,type:m.type},.26);
      }
      return false;
    });});}
  else {
    // 最终波停止刷新，但已经在路上的怪仍向基地前进。
    s.lanes.forEach((l,index)=>{l.monsters.forEach(m=>{m.slow=Math.max(0,m.slow-dt);m.p+=dt*(m.type==='fast'?.038:m.type==='heavy'?.019:.026)*(m.slow>0?.55:1);if(m.p>=1){if(rescue&&m.rescueThreat&&!m.rescueResolved){damageBase(s,10);m.rescueResolved=true;s.rescue.misses++;if(s.rescue.active&&s.rescue.active.id===m.id)s.rescue.active=null;notice(s,'破门怪冲进基地！这次没拦住');}else damageBase(s,m.type==='heavy'?5:3);m.hp=0;m.escaped=true;}});l.monsters=l.monsters.filter(m=>m.hp>0);});
    const b=s.boss;if(b){
    // 玩家回到高地后也能处理靠近基地的漏网怪；不改变个人队伍和羁绊。
    const power=armyPower(s);
    b.clearTick=(b.clearTick||0)-dt;if(power&&b.clearTick<=0){const remaining=s.lanes.flatMap(l=>l.monsters).filter(m=>m.hp>0&&m.p>=.75).sort((a,b)=>b.p-a.p);if(remaining.length){b.clearTick=.75;const target=remaining[0],damage=Math.min(target.hp,power*.4);target.hp-=damage;target.hitAt=s.time;s.damage+=damage;effect(s,'high-shot',{lane:s.lanes.findIndex(l=>l.monsters.includes(target)),monsterId:target.id,p:target.p,amount:Math.round(damage)},.35);if(target.hp<=0){s.kills++;s.lanes.forEach(l=>{l.monsters=l.monsters.filter(m=>m.hp>0);});}}}
    if(b.hp>0)fightBoss(s,b,dt,power);
    if(b.hp<=0){if(!b.defeated){b.defeated=true;notice(s,'首领已击败，注意残余怪物！');}if(s.lanes.every(l=>l.monsters.length===0)){s.status='won';notice(s,'611 守住了！');}}
    if(s.waveTime>=bossLimit&&b.hp>0){s.status='lost';notice(s,'首领攻破了最后防线');}}}
  if(s.location==='high'&&!s.boss){
    s.highAttackClock=Math.max(0,(s.highAttackClock||0)-dt);
    const power=armyPower(s),targets=[];
    s.lanes.forEach((lane,index)=>lane.monsters.forEach(m=>{if(m.hp>0&&m.p>=.7)targets.push({lane,index,m});}));
    targets.sort((a,b)=>b.m.p-a.m.p);
    if(power&&s.highAttackClock<=0&&targets.length){const {lane,index,m}=targets[0];s.highAttackClock=.75;const damage=Math.min(m.hp,power*.4);m.hp-=damage;m.hitAt=s.time;s.damage+=damage;effect(s,'high-shot',{lane:index,monsterId:m.id,p:m.p,amount:Math.round(damage)},.35);if(m.hp<=0){s.kills++;settleRescueIntercept(s,lane,index,m);lane.monsters=lane.monsters.filter(other=>other!==m);}}
  }
  if(s.base<=0)s.status='lost';
}
module.exports={CARDS,BY_ID,ITEMS,CAP,SHOP_SIZE,WAVE_SECONDS,PREP_SECONDS,BOSS_LIMIT_SECONDS,RESCUE_WAVE_SECONDS,RESCUE_PREP_SECONDS,RESCUE_BOSS_LIMIT_SECONDS,formationPoint,enemyX,create,createRescue,rescueSkill,refresh,buy,deploy,undeploy,swapSlots,equip,upgradeItem,sell,move,recall,step,synergy,synergyProgress,activeSynergies,canInterruptBoss,interruptBoss};
