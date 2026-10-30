/* 纯游戏规则：微信本地试玩与服务器共用，服务器是联机对局的唯一裁判。 */
'use strict';
const W = 390, H = 500, DURATION = 360;
const ROLES = [
  { name: '铁卫', color: '#7edac8', skill: '震地守护', desc: '范围击退 + 护盾', cd: 9, damage: 13, rate: .72 },
  { name: '星术', color: '#beacff', skill: '星火风暴', desc: '大范围爆发', cd: 11, damage: 20, rate: .85 },
  { name: '补给', color: '#ffcf82', skill: '泡面补给', desc: '治疗队友 + 修复水晶', cd: 13, damage: 12, rate: .65 }
];
const UPGRADES = [
  { id: 'power', name: '超频网卡', desc: '普攻伤害 +25%' },
  { id: 'haste', name: '机械键盘', desc: '攻击间隔 -15%' },
  { id: 'range', name: '加长插排', desc: '攻击范围 +35' },
  { id: 'heal', name: '泡面加蛋', desc: '全队回血 + 水晶修复' },
  { id: 'nova', name: '环绕灯带', desc: '每两秒造成近身伤害' },
  { id: 'slow', name: '冰镇汽水', desc: '普攻命中减速敌人' }
];
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function distance(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }
function rng(s) { s.seed = (Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
function player(id, name, role, i, bot) {
  return { id, name: String(name || '611室友').slice(0,10), role: clamp(role|0,0,2), bot: !!bot,
    x: 195+Math.cos(i*2.1)*65, y: 270+Math.sin(i*2.1)*65, hp: 100, cd: 0, attack: 0,
    shield: 0, down: 0, damage: 0, kills: 0, heals: 0, power: 1, haste: 1, range: 145,
    nova: 0, slow: false, aura: 0, choices: [], upgrades: [], input: {x:0,y:0} };
}
function createGame(members, seed) {
  return { seed: seed == null ? 611 : seed>>>0, time:0, status:'playing', base:611, maxBase:611,
    wave:1, spawn:1.2, nextId:1, kills:0, bossSpawned:false, bossKilled:false, upgradeRound:0,
    players:members.map((m,i)=> {const p=player(m.id,m.name,m.role,i,m.bot);p.power=1+clamp(m.level|0,0,5)*.01;return p;}), enemies:[], fx:[], notice:'守住 611，今晚一起赢！' };
}
function effect(s, x, y, r, color, kind, x2, y2) {
  s.fx.push({x,y,r,color,kind,life:.24,x2,y2});
  if(s.fx.length>80) s.fx.shift();
}
function hit(s,e,n,p) { const actual=Math.min(Math.max(e.hp,0),n); e.hp-=n; if(p) p.damage+=actual; }
function skill(s, id) {
  const p=s.players.find(p=>p.id===id); if(!p || p.hp<=0 || p.cd>0 || s.status!=='playing') return false;
  p.cd=ROLES[p.role].cd;
  if(p.role===2) {
    s.base=Math.min(s.maxBase,s.base+32); p.heals+=32;
    s.players.forEach(q=> { if(q.hp>0) { const n=Math.min(32,100-q.hp); q.hp+=n; p.heals+=n; } });
    effect(s,p.x,p.y,180,'#ffd394','ring');
  } else {
    const radius=p.role===0?135:190, damage=p.role===0?38:70;
    if(p.role===0) p.shield=5;
    s.enemies.forEach(e=> { if(distance(p,e)<radius) { hit(s,e,damage*p.power,p);
      if(p.role===0) { const d=Math.max(1,distance(p,e)); e.x=clamp(e.x+(e.x-p.x)/d*30,8,W-8); e.y=clamp(e.y+(e.y-p.y)/d*30,8,H-8); } } });
    effect(s,p.x,p.y,radius,ROLES[p.role].color,'ring');
  }
  return true;
}
function choose(s,id,choice) {
  const p=s.players.find(p=>p.id===id); if(!p || !p.choices.includes(choice) || s.status!=='playing') return false;
  if(choice==='power') p.power*=1.25;
  if(choice==='haste') p.haste*=.85;
  if(choice==='range') p.range+=35;
  if(choice==='nova') p.nova+=1;
  if(choice==='slow') p.slow=true;
  if(choice==='heal') { s.base=Math.min(s.maxBase,s.base+65); s.players.forEach(q=> {if(q.hp>0) q.hp=Math.min(100,q.hp+40);}); }
  p.upgrades.push(choice); p.choices=[]; return true;
}
function offer(s) {
  s.players.forEach(p=> { const pool=UPGRADES.map(u=>u.id); if(p.slow) pool.splice(pool.indexOf('slow'),1);
    p.choices=[]; while(p.choices.length<3) p.choices.push(pool.splice(Math.floor(rng(s)*pool.length),1)[0]);
    if(p.bot) choose(s,p.id,p.choices[Math.floor(rng(s)*3)]);
  });
}
function spawn(s,boss) {
  const a=rng(s)*Math.PI*2, team=s.players.length;
  const fast=!boss && rng(s)<.23;
  const hp=boss ? 380+team*190 : (18+s.wave*5)*(1+Math.max(0,team-2)*.18);
  s.enemies.push({ id:s.nextId++,x:clamp(195+Math.cos(a)*280,9,W-9),y:clamp(250+Math.sin(a)*320,9,H-9),
    hp,maxHp:hp,boss:!!boss,fast,speed:boss?15:fast?34:20+s.wave*1.5,attack:0,slow:0,phase:rng(s)*6 });
}
function step(s,dt) {
  if(s.status!=='playing') return;
  dt=clamp(dt,0,.1); s.time+=dt; s.wave=Math.min(6,Math.floor(s.time/60)+1);
  s.fx.forEach(f=>f.life-=dt); s.fx=s.fx.filter(f=>f.life>0);
  const round=Math.min(5,Math.floor(s.time/50));
  if(round>s.upgradeRound) {s.upgradeRound=round;offer(s);s.notice='补给到了，选一件开黑装备！';}
  if(s.time>=300 && !s.bossSpawned) {s.bossSpawned=true;spawn(s,true);s.notice='断电巨兽出现！集火守家！';}
  if(s.time<325) {
    s.spawn-=dt;
    if(s.spawn<=0) { s.spawn=Math.max(.48,1.9-s.wave*.19)/Math.sqrt(s.players.length/2); if(s.enemies.length<80) spawn(s,false); }
  }
  s.players.forEach((p,i)=> {
    p.cd=Math.max(0,p.cd-dt);p.shield=Math.max(0,p.shield-dt);p.attack-=dt;p.aura-=dt;
    if(p.hp<=0) {p.down-=dt;if(p.down<=0){p.hp=100;p.x=195;p.y=285;}return;}
    let input=p.input;
    if(p.bot) {
      const target={x:195+Math.cos(s.time*.25+i*2)*85,y:250+Math.sin(s.time*.25+i*2)*85};
      const d=distance(p,target);input={x:d>8?(target.x-p.x)/d:0,y:d>8?(target.y-p.y)/d:0};
      if(s.enemies.some(e=>distance(e,p)<140) || (p.role===2&&s.base<540)) skill(s,p.id);
    }
    const len=Math.max(1,Math.hypot(input.x,input.y));p.x=clamp(p.x+input.x/len*100*dt,18,W-18);p.y=clamp(p.y+input.y/len*100*dt,20,H-20);
    let target=null, best=p.range;
    s.enemies.forEach(e=>{const d=distance(p,e);if(e.hp>0&&d<best){best=d;target=e;}});
    if(target&&p.attack<=0) {p.attack=ROLES[p.role].rate*p.haste;hit(s,target,ROLES[p.role].damage*p.power,p);
      if(p.slow) target.slow=1.3; effect(s,p.x,p.y,0,ROLES[p.role].color,'bolt',target.x,target.y);}
    if(p.nova&&p.aura<=0) {p.aura=2;s.enemies.forEach(e=>{if(distance(p,e)<85)hit(s,e,12*p.nova,p);});effect(s,p.x,p.y,85,ROLES[p.role].color,'ring');}
  });
  s.enemies.forEach(e=> {
    if(e.hp<=0)return; e.attack-=dt;e.slow=Math.max(0,e.slow-dt);
    let target={x:195,y:250}, near=52;
    s.players.forEach(p=>{const d=distance(e,p);if(p.hp>0&&d<near){near=d;target=p;}});
    const d=distance(e,target), reach=target.id?20:38;
    if(d>reach){e.x+=(target.x-e.x)/d*e.speed*dt*(e.slow>0?.45:1);e.y+=(target.y-e.y)/d*e.speed*dt*(e.slow>0?.45:1);}
    else if(e.attack<=0) {e.attack=e.boss?.8:1.2;const damage=e.boss?18:5;
      if(target.id){target.hp=Math.max(0,target.hp-damage*(target.shield>0?.2:1));if(!target.hp){target.down=6;target.input={x:0,y:0};}}
      else s.base=Math.max(0,s.base-damage);
    }
  });
  s.enemies=s.enemies.filter(e=>{if(e.hp>0)return true;s.kills++;if(e.boss)s.bossKilled=true;return false;});
  // 终局：清掉首领后仍需守到六分钟；六分钟未击杀首领判负。
  if(s.base<=0)s.status='lost';
  else if(s.time>=DURATION)s.status=s.bossKilled?'won':'lost';
}
module.exports={W,H,DURATION,ROLES,UPGRADES,createGame,step,skill,choose,clamp};
