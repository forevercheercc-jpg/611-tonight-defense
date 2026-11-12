'use strict';

// Small original pixel characters. Everything is drawn as rectangles so the
// sprites stay sharp at different device sizes and require no image downloads.
const STYLES={
  ao:{coat:'#a86d45',hair:'#55382c',accent:'#e6bd60',weapon:'roundShield'},
  zhi:{coat:'#668abd',hair:'#d8e3e9',accent:'#8ed8e0',weapon:'towerShield'},
  csy:{coat:'#a65550',hair:'#523e3a',accent:'#ddd6bc',weapon:'greatSword'},
  tang:{coat:'#657fd3',hair:'#8cb3ec',accent:'#f9dc72',weapon:'staff'},
  ge:{coat:'#755483',hair:'#3a3158',accent:'#d2b5d8',weapon:'blades'},
  hong:{coat:'#71814c',hair:'#d5ad72',accent:'#b2bc87',weapon:'rifle'},
  thorn:{coat:'#527a52',hair:'#443653',accent:'#b5d887',weapon:'axe'},
  hammer:{coat:'#9b684b',hair:'#514851',accent:'#f0be79',weapon:'hammer'},
  forge:{coat:'#5a7f7c',hair:'#6a4c43',accent:'#ffc880',weapon:'tongs'},
  gate:{coat:'#8a6067',hair:'#594453',accent:'#f6d297',weapon:'gateShield'},
  blade:{coat:'#a85350',hair:'#533839',accent:'#f68a5f',weapon:'sabre'},
  axe:{coat:'#77617c',hair:'#544040',accent:'#e1aa75',weapon:'axe'},
  swift:{coat:'#477c8e',hair:'#5d4d61',accent:'#8be2dc',weapon:'axe'},
  spear:{coat:'#4a6791',hair:'#49466d',accent:'#b5e0f7',weapon:'towerShield'},
  fire:{coat:'#a45541',hair:'#673943',accent:'#f7a754',weapon:'ember'},
  ice:{coat:'#5367a4',hair:'#739ab9',accent:'#aae9f7',weapon:'crystal'},
  bow:{coat:'#547b58',hair:'#785d41',accent:'#c9e49b',weapon:'bow'},
  shadow:{coat:'#494865',hair:'#383348',accent:'#a798dd',weapon:'dagger'},
  priest:{coat:'#7db19a',hair:'#e3d9bd',accent:'#dcf9ac',weapon:'lantern'}
};
const JOB_COLORS={'守卫':'#69b9bc','战士':'#dd9b6c','法师':'#b6a7ec','猎人':'#83c898','潜行者':'#dd86a2','牧师':'#bcf2a5','工匠':'#e2b087'};
function draw(ctx,id,job,x,y,size){
  const fallback={coat:JOB_COLORS[job]||'#81d9c2',hair:'#523b32',accent:'#d6c28d',weapon:job==='守卫'?'towerShield':job==='法师'?'staff':job==='猎人'?'rifle':'greatSword'};
  const s=STYLES[id]||fallback,k=size/24;
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  function r(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  // Ground shadow, boots, garment and head.
  r(-9,10,18,3,'#15262e');r(-7,7,6,4,'#263241');r(2,7,6,4,'#263241');
  r(-8,-4,16,12,'#24303a');r(-6,-3,12,10,s.coat);r(-5,-12,10,9,'#252934');
  r(-4,-11,8,7,'#f2d2aa');r(-5,-13,10,3,s.hair);r(-5,-11,2,4,s.hair);
  r(-2,-8,1,2,'#1a2630');r(2,-8,1,2,'#1a2630');r(-2,2,4,2,s.accent);
  if(job==='守卫'){
    r(-7,-5,4,4,s.accent);r(4,-5,4,4,s.accent);
    if(id==='gate'||id==='hammer'){r(-6,-13,12,3,s.coat);r(-4,-15,8,2,s.accent);}
  }else if(job==='战士'){
    r(-9,-4,4,5,s.coat);r(5,-4,4,5,s.coat);r(-4,4,8,2,s.hair);
    if(id==='csy'||id==='blade')r(-5,-10,10,2,s.coat);
  }else if(job==='潜行者'){
    r(-6,-13,12,3,s.coat);r(-6,-10,2,6,s.coat);r(4,-10,2,6,s.coat);r(-4,-6,8,3,s.hair);
  }else if(id==='fire'||id==='ice'){
    r(-7,-12,14,2,s.coat);r(-4,-15,8,3,s.coat);r(-2,-17,4,2,s.accent);
  }else if(id==='bow'){
    r(-6,-14,12,3,s.coat);r(3,-17,2,5,s.accent);
  }
  // Distinct silhouette and equipment for each of the six roommates.
  if(s.weapon==='roundShield'){
    r(-12,-3,7,9,'#4d4030');r(-11,-4,7,11,s.accent);r(-9,-2,3,7,s.coat);r(-8,0,2,2,'#f8e09c');
    r(6,-6,3,10,'#c9d3d1');
  }else if(s.weapon==='towerShield'){
    r(-12,-5,8,13,'#384a65');r(-11,-4,6,11,'#dae9ed');r(-10,-3,4,9,s.coat);r(-9,0,2,3,s.accent);
    r(6,-2,4,2,s.accent);
  }else if(s.weapon==='greatSword'){
    r(-7,-6,2,12,'#d57762');r(7,-8,4,15,'#303943');r(8,-7,2,12,'#e4e6d9');r(6,3,6,2,s.accent);
  }else if(s.weapon==='staff'){
    r(-7,-14,14,3,'#3b4e8e');r(-4,-17,8,3,s.coat);r(7,-11,3,19,'#725238');r(6,-14,5,4,s.accent);r(7,-15,3,2,'#eaf8fa');
  }else if(s.weapon==='blades'){
    r(-5,-5,10,3,s.accent);r(-11,0,5,2,'#d8dbe1');r(7,0,5,2,'#d8dbe1');r(-10,-1,2,4,'#e9eced');r(9,-1,2,4,'#e9eced');
  }else if(s.weapon==='rifle'){
    r(-6,-14,12,3,s.coat);r(-3,-15,6,2,s.accent);r(5,-3,10,3,'#553f35');r(8,-4,7,2,'#d7bb87');r(5,-1,2,4,'#98705a');
  }else if(s.weapon==='thornShield'||s.weapon==='gateShield'){
    r(-13,-5,8,12,'#283b3d');r(-12,-4,6,10,s.accent);
    if(s.weapon==='thornShield'){r(-15,-2,4,2,s.accent);r(-14,3,4,2,s.accent);r(-9,-7,2,4,s.accent);}
    else{r(-10,-4,2,10,s.coat);r(-12,0,6,2,s.coat);r(-13,-6,8,2,s.accent);}
  }else if(s.weapon==='hammer'||s.weapon==='axe'||s.weapon==='tongs'){
    r(8,-6,2,14,'#72543d');
    if(s.weapon==='hammer'){r(5,-10,10,6,'#393b4b');r(6,-9,8,4,s.accent);}
    if(s.weapon==='axe'){r(9,-11,6,7,s.accent);r(12,-10,4,5,'#fff1cf');}
    if(s.weapon==='tongs'){r(6,-10,2,8,s.accent);r(11,-10,2,8,s.accent);r(8,-4,3,2,'#f0d1a4');}
  }else if(s.weapon==='sabre'||s.weapon==='rapier'||s.weapon==='spear'||s.weapon==='dagger'){
    const reach={sabre:11,rapier:13,spear:17,dagger:7}[s.weapon];
    r(8,4-reach,2,reach,s.accent);r(7,2,5,2,'#ded8b7');r(8,4,2,4,'#5b4b49');
    if(s.weapon==='sabre')r(10,-7,2,7,'#f9ded1');
    if(s.weapon==='spear')r(7,-13,4,4,'#e8f7ff');
    if(s.weapon==='dagger')r(10,-1,2,3,'#e7d9ff');
  }else if(s.weapon==='ember'||s.weapon==='crystal'){
    r(8,-8,2,16,'#6f4f42');r(6,-13,6,6,s.accent);
    if(s.weapon==='ember')r(8,-16,3,4,'#ffe3a4');else r(8,-16,2,12,'#e8faff');
  }else if(s.weapon==='bow'){
    r(7,-9,4,2,s.accent);r(11,-7,2,4,s.accent);r(13,-3,2,5,s.accent);r(11,2,2,4,s.accent);r(7,6,4,2,s.accent);r(7,-7,1,13,'#e8e3ca');
  }else if(s.weapon==='lantern'){
    r(-6,-14,12,3,'#dfebe0');r(8,-8,2,16,'#6f5e50');r(6,-12,6,6,'#63806a');r(7,-11,4,4,s.accent);
  }
  ctx.restore();
}
const MONSTERS={
  normal:{speed:6,step:1,color:'#ff9b82'}, fast:{speed:14,step:2,color:'#f7d678'},
  heavy:{speed:4,step:1,color:'#cdb5f5'}, healer:{speed:5,step:1,color:'#f7d892'}, slime:{speed:5,step:2,color:'#b5e795'},
  mushroom:{speed:3,step:1,color:'#f5ad9c'}, turtle:{speed:3,step:1,color:'#97d9d1'}
};
function towerEnemy(r,type,beat,hit,casting){
  const light=hit?'#fff1d0':'#b3dddc';
  if(type==='fast'){
    const flap=beat>0?-9:-4;
    for(const side of [-1,1]){
      const x=side<0?-14:5;
      r(x,flap,9,3,'#64648e');
      r(x+2,flap+3,6,4,'#45435e');
      r(x+3,flap+7,3,2,'#7978a0');
    }
    r(-5,-8,10,16,'#322b49');
    r(-5,-10,3,4,'#847bad');r(2,-10,3,4,'#847bad');
    r(-3,-4,2,2,light);r(2,-4,2,2,light);
    r(-2,6,4,4,'#5b537b');
  }else if(type==='heavy'){
    r(-13,-7,26,13,'#24273c');r(-9,-12,18,20,'#55586f');
    r(-13,-5,5,11,'#6b718a');r(8,-5,5,11,'#6b718a');
    r(-8,-11,15,3,'#9193a8');r(-6,-6,12,4,'#2c2c44');
    r(-4,-5,3,2,light);r(2,-5,3,2,light);
    r(-2,1,4,5,light);r(2,5,5,1,'#b38caa');
    r(-8,7,6,4,'#3e4159');r(2,7,6,4,'#3e4159');
  }else if(type==='healer'){
    r(-6,-13,12,10,'#554263');r(-8,-4,16,14,'#594767');
    r(-5,-7,10,7,'#2e2940');r(-3,-5,2,2,light);r(2,-5,2,2,light);
    r(-3,0,5,9,'#9b6585');r(8,-10,2,19,'#a68d9a');
    r(6,-12,6,5,'#e19a69');r(8,-14,2,5,'#ffe1a1');
    if(casting){r(-11,-8,2,2,light);r(13,-8,2,2,light);r(5,-17,8,1,'#f2b77d');}
  }else{
    r(-6,-10,12,15,'#4e536d');r(-7,-8,14,3,'#8895ab');
    r(-5,-5,10,4,'#202335');r(-3,-4,2,2,light);r(2,-4,2,2,light);
    r(-6,0,12,8,'#55506e');r(-4,3,8,2,'#8894af');
    r(-6,7,4,3,'#35354f');r(2,7,4,3,'#35354f');
    r(7,-7,2,17,'#a1b4cb');r(6,-7,4,2,light);r(5,6,6,1,'#9b83ad');
  }
}
function enemy(ctx,type,x,y,size,time,{hit=false,attack=0,casting=false,theme='chapel'}={}){
  const look=MONSTERS[type]||MONSTERS.normal;
  const beat=Math.sin(time*look.speed+x*.13);
  const step=Math.round(beat*look.step);
  const recoil=hit?-1:0;
  ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);
  function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  r(-8,9,16,3,'#17252b');
  ctx.translate(0,step+recoil+Math.round(attack*(type==='heavy'?2:3)));
  const lit=hit?'#fff1d0':look.color;
  if(theme==='tower'&&['normal','fast','heavy','healer'].includes(type)){
    towerEnemy(r,type,beat,hit,casting);
  }else switch(type){
    case 'fast': {
      const wing=beat>0?-8:-3;
      r(-13,wing,8,4,'#96703b');r(5,wing,8,4,'#96703b');
      r(-12,wing+1,6,2,lit);r(6,wing+1,6,2,lit);
      r(-6,-7,12,13,'#ad773e');r(-5,-9,3,5,lit);r(2,-9,3,5,lit);
      r(-4,-4,3,2,'#ffeaba');r(2,-4,3,2,'#ffeaba');r(-2,4,4,3,'#63463a');
      r(-6,1,12,2,'#a84e4e');r(-8,4,4,4,'#a84e4e');
      break;
    }
    case 'heavy':
      r(-10,-7,20,16,'#492d3a');r(-8,-11,16,16,'#80524f');
      r(-12,-6,5,10,lit);r(7,-6,5,10,lit);r(-7,-10,14,3,lit);
      r(-6,-5,12,4,'#292435');r(-4,-4,3,2,'#eec3ff');r(1,-4,3,2,'#eec3ff');
      r(-8,7,6,4,'#393342');r(2,7,6,4,'#393342');
      r(7,-6,5,11,'#a97152');r(8,-4,3,6,'#be8260');r(-2,1,4,6,'#b65c51');break;
    case 'healer': {
      const robe=theme==='tower'?'#645080':'#884b5a';
      r(-6,-10,12,10,robe);r(-8,0,16,9,robe);r(-4,-5,8,5,'#372d45');
      r(-3,-4,2,2,lit);r(2,-4,2,2,lit);r(8,-6,2,15,'#ac8155');
      r(6,-10,6,5,lit);r(-2,1,4,6,'#c99d61');
      r(6,-11,6,1,'#a67559');r(7,-5,4,1,'#a67559');
      if(casting){r(-12,-4,2,2,lit);r(13,0,2,2,lit);r(-8,-13,16,2,lit);}
      break;
    }
    case 'slime':
      r(-9,-2,18,10,'#3d7754');r(-6,-6,12,4,'#6bb570');r(-7,-2,5,3,lit);
      r(-4,2,2,3,'#244537');r(3,2,2,3,'#244537');r(-11,6,22,3,'#609e62');break;
    case 'mushroom':
      r(-4,-2,8,11,'#e1c1a2');r(-10,-5,20,6,'#a55e67');r(-7,-10,14,5,'#d68280');
      r(-6,-8,3,3,lit);r(2,-6,4,3,lit);r(-3,3,2,2,'#503c49');r(2,3,2,2,'#503c49');break;
    case 'turtle':
      r(-8,-7,15,15,'#326361');r(-6,-9,11,4,lit);r(-5,-5,8,7,'#558d80');
      r(6,-2,6,6,'#a0b98a');r(9,-1,2,2,'#243c43');r(-7,6,4,4,'#617d62');r(3,6,4,4,'#617d62');break;
    default:
      r(-7,-8,14,15,theme==='tower'?'#594765':'#8e4d58');r(-5,-10,10,3,lit);
      r(-9,0,4,6,'#b66966');r(5,0,4,6,'#b66966');r(-4,-4,3,2,'#ffe7a7');r(2,-4,3,2,'#ffe7a7');
      r(-7,6,5,4,'#553844');r(2,6,5,4,'#553844');
      if(theme==='chapel'){
        r(8,-7,3,15,'#bd9366');r(7,-10,5,4,'#f0b376');r(-7,0,5,6,'#6b444f');
      }else r(-9,-11,2,7,'#9481b8');
  }
  if(attack>0){
    const reach=Math.round((1-attack)*7);
    r(-8-reach,10,5,2,look.color);r(3+reach,10,5,2,look.color);
    if(type==='heavy')r(-7,13,14,2,look.color);
    if(type==='fast')r(-3,13+reach,6,2,look.color);
  }
  if(hit){r(-12,-4,3,2,lit);r(10,-6,3,2,lit);}
  ctx.restore();
}
function enemyBurst(ctx,type,x,y,progress,theme){
  const color=theme==='tower'?'#a2b9e5':theme==='chapel'?'#e5a069':(MONSTERS[type]||MONSTERS.normal).color;
  const radius=5+14*progress,count=type==='heavy'?9:6;
  ctx.save();ctx.globalAlpha=1-progress;
  for(let i=0;i<count;i++){
    const angle=i*2.39996,travel=radius*(.7+(i%3)*.2);
    ctx.fillStyle=i%3===0?'#f4e2be':color;
    ctx.fillRect(Math.round(x+Math.cos(angle)*travel),Math.round(y+Math.sin(angle)*travel+progress*progress*7),type==='heavy'?3:2,2);
  }
  ctx.restore();
}
function boss(ctx,x,y,size,time,kind,{warning=false,hit=false,slam=false,defeated=false,airborne=false,enraged=false}={}){
  const lamp=kind==='lamp';
  const bob=defeated?4:Math.round(Math.sin(time*(lamp?5:3))*(lamp?2:1));
  ctx.save();ctx.translate(x,y+bob-(airborne?5:0)+(warning?-2:0)+(slam?3:0));ctx.scale(size/40,size/40);
  function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
  if(kind==='warden'){
    const steel=hit?'#ffe1b7':'#cc9b68';
    r(-11,-9,22,25,'#492937');
    r(-14,-10,5,23,'#722f3d');r(9,-10,5,23,'#722f3d');
    r(-12,9,3,5,'#b45750');r(10,9,3,5,'#b45750');
    r(-12,-15,24,8,'#6d3b48');r(-9,-17,18,3,steel);r(-9,-8,18,17,'#9c514e');r(-6,-11,12,4,'#33283a');
    r(-3,-20,6,5,'#a24a47');r(-1,-21,2,5,'#df7762');
    r(-8,-4,16,2,'#d28661');r(-6,4,12,2,'#613943');
    r(-5,-10,3,2,steel);r(2,-10,3,2,steel);r(-10,9,7,6,'#4e3845');r(3,9,7,6,'#4e3845');
    r(-20,-6,11,18,'#644652');r(-18,-4,7,14,steel);r(-16,0,3,8,'#963f50');
    r(-19,-4,2,13,'#e6b482');r(-17,-3,5,2,'#f2d3a0');
    r(11,warning?-19:-5,4,18,steel);r(9,warning?-4:10,8,3,'#66404a');
  }else if(kind==='cleric'){
    const light=hit?'#fff2d0':'#f0ce8a';
    r(-9,-14,18,13,'#894a62');r(-13,0,26,13,'#704353');r(-6,-9,12,9,'#3c2d40');
    r(-4,-5,3,2,light);r(2,-5,3,2,light);r(-3,2,6,10,'#cba368');
    r(13,-9,3,21,'#a57c65');r(11,-12,7,7,light);
    if(warning){r(-16,-8,3,3,light);r(17,-15,3,3,light);}
  }else if(kind==='shade'){
    const glow=hit?'#fff0ce':enraged?'#ff856c':'#a3e2da';
    r(-8,-13,16,23,'#43405e');r(-6,-16,12,5,'#757196');
    r(-10,-17,4,7,'#8c7ead');r(6,-17,4,7,'#8c7ead');r(-6,-8,4,3,glow);r(2,-8,4,3,glow);r(-3,2,6,5,glow);
    const wing=airborne?-13:-6;
    r(-24,wing,12,5,'#63638d');r(12,wing,12,5,'#63638d');r(-16,wing+5,9,7,'#72629a');r(7,wing+5,9,7,'#72629a');
    r(-22,wing-2,7,2,'#a49dc2');r(15,wing-2,7,2,'#a49dc2');
    r(-21,wing+4,4,5,'#413c66');r(17,wing+4,4,5,'#413c66');
    r(-12,wing+9,3,6,'#4a456e');r(9,wing+9,3,6,'#4a456e');
    if(airborne){
      r(-28,wing+4,6,3,'#94b9c4');r(22,wing+4,6,3,'#94b9c4');
      r(-30,wing+1,3,2,glow);r(27,wing+1,3,2,glow);
    }
    r(-10,10,6,5,'#322f48');r(4,10,6,5,'#322f48');
  }else if(kind==='flame'){
    const spark=Math.round(Math.sin(time*13)*2),hot=hit?'#fff1b9':'#f59c62';
    r(-13,4,26,9,'#935462');r(-10,-6,20,15,'#d47958');r(-6,-13+spark,7,12,hot);
    r(3,-9-spark,5,10,hot);r(-6,0,3,3,'#483849');r(3,0,3,3,'#483849');
  }else if(lamp){
    const glass=defeated?'#77705c':hit?'#fff3bc':'#edbd63';
    r(-8,-17,16,24,'#896747');r(-12,-11,24,13,glass);r(-8,-15,16,20,glass);
    r(-7,-13,4,5,defeated?'#6f6859':'#fff2af');r(-5,6,10,5,'#7b776e');r(-5,7,10,1,'#cac0a3');r(-3,11,6,2,'#514651');
    r(-5,-6,3,3,'#4d3e40');r(2,-6,3,3,'#4d3e40');r(-2,-1,4,2,'#614548');
    if(hit&&!defeated){r(-16,-8,3,2,'#ffeaa3');r(14,-13,3,3,'#fff3bc');}
  }else{
    const energy=hit?'#fff2df':warning?'#ff9a78':'#e9b980';
    r(-15,16,30,3,'#281f36');r(-16,-15,5,11,'#a182a6');r(11,-15,5,11,'#a182a6');
    r(-17,-6,34,17,'#49384e');r(-11,-10,22,19,'#775772');
    r(-20,warning?-10:0,8,12,'#634457');r(12,warning?-10:0,8,12,'#634457');
    r(-17,warning?-11:1,4,4,energy);r(13,warning?-11:1,4,4,energy);
    r(-8,-5,16,6,'#2e2437');r(-6,-4,4,2,energy);r(2,-4,4,2,energy);
    r(-3,4,6,5,energy);r(-10,11,7,6,'#4a3549');r(3,11,7,6,'#4a3549');
    if(warning){r(-4,-20,8,2,energy);r(-1,-23,2,7,energy);}
  }
  ctx.restore();
}
module.exports={draw,enemy,enemyBurst,boss,JOB_COLORS};
