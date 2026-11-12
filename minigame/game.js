'use strict';
const G=require('./lane-core');
const sprites=require('./sprite-art');
const pixelArt=require('./pixel-art');
const heroPixels=require('./hero-pixels');
const heroFx=require('./hero-effects');
const {CHAPTERS,sectionFor}=require('./encounters');
const adventure=require('./adventure/core');
const adventureAction=require('./adventure/action');
const adventureArt=require('./adventure/scene-art');
const nightRollCall = require('./adventure/night-roll-call');
const nightRollCallView = require('./adventure/night-roll-call-view');
const laneArt=require('./lane-art');
const canvas=wx.createCanvas();const ctx=canvas.getContext('2d');
const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
const width=info.windowWidth,height=info.windowHeight,dpr=Math.min(info.pixelRatio||1,3);canvas.width=width*dpr;canvas.height=height*dpr;
const scale=width/390,H=height/scale, safe=Math.max(25,(info.safeArea?info.safeArea.top:0)/scale+5);
let state=null,page='home',panel='shop',buttons=[],last=Date.now(),hidden=false,selection=-1,boardSelection=-1,ended=false;
let synergyView=null;
let adventureState=null;
let adventureHintStep=0,adventureSaveBlocked=false,adventureDialogueText='',adventureDialoguePage=0;
let adventureVisual={floor:-1,platform:false,liftUntil:0};
const actionInput={x:0,y:0,aimX:0,aimY:0,attack:false,moveId:null,attackId:null};
function clearActionInput(){actionInput.x=0;actionInput.y=0;actionInput.aimX=0;actionInput.aimY=0;actionInput.attack=false;actionInput.moveId=null;actionInput.attackId=null;}
const ADVENTURE_SAVE='611-adventure-v1';
const NIGHT_ROLL_CALL_SAVE = '611-night-roll-call-v1';
let nightStory = null;
const storyTouches = new Map();
const WEAPON_ARCHIVE_KEY='611-weapon-archive-v1';
const C={bg:'#101c2a',panel:'#263b4b',panel2:'#304959',line:'#658087',white:'#f4edda',muted:'#a4b9bb',gold:'#e6bc73',mint:'#80d5bd',red:'#ee9674',purple:'#afa3d5'};
const ADVENTURE_THEMES={
  dorm:{background:'#12141b',panel:'#201c22',edge:'#745f51',light:'#d6b78a',accent:'#efc990',selected:'#4b3a34',muted:'#c2b4a6',fog:'#0c111a',wall:'#51423d',wallLight:'#8a6b54',wallDark:'#252733',wallTrim:'#79604f',shadow:'#11131c'},
  corridor:{background:'#10151e',panel:'#1a222d',edge:'#4f6778',light:'#b5d2d0',accent:'#a5d9d7',selected:'#2b444e',muted:'#b5c3ca',fog:'#0a101a',wall:'#354350',wallLight:'#667983',wallDark:'#212a36',wallTrim:'#536772',shadow:'#0c131e'}
};
const WEAPON_INFO={
  sword:{slot:'近距·单体',range:'1.4格',detail:'快速精准斩击，集中伤害一个目标。'},
  cleave:{slot:'近距·扇扫',range:'1.7格',detail:'宽弧挥砍，近身最多命中3名敌人。'},
  saber:{slot:'光剑·穿线',range:'2.1格',detail:'窄直线穿刺，最多贯穿3个敌人。'},
  pulse:{slot:'脉冲·贯穿',range:'5格',detail:'远距窄束贯穿最多3敌，后续伤害递减。'},
  lightning:{slot:'引雷·连锁',range:'3.8格',detail:'命中后跳向2个近敌，连锁伤害递减。'}
};
const WEAPON_ARCHIVE=[
  {name:'旧练习剑',kind:'sword',place:'611 寝室'},
  {name:'储物间床板短棍',kind:'cleave',place:'西侧储物间'},
  {name:'盥洗区练习剑',kind:'sword',place:'东侧盥洗区'},
  {name:'合照短棍',kind:'cleave',place:'回忆抽屉'},
  {name:'礼堂守夜刃',kind:'cleave',place:'封锁教学楼'},
  {name:'冷光短刃',kind:'cleave',place:'教学楼旧教室'},
  {name:'黎明光剑',kind:'saber',place:'北教学区'},
  {name:'脉冲手枪',kind:'pulse',place:'教学楼武器回廊'},
  {name:'唐卵的引雷杖',kind:'lightning',place:'教学楼武器回廊'}
];
function weaponInfo(kind){return WEAPON_INFO[kind]||WEAPON_INFO.sword;}
function discoveredWeapons(){
  try{const saved=wx.getStorageSync&&wx.getStorageSync(WEAPON_ARCHIVE_KEY);if(Array.isArray(saved))return saved;if(typeof saved==='string'){const parsed=JSON.parse(saved);return Array.isArray(parsed)?parsed:[];}}catch(e){}
  return [];
}
function rememberWeapon(weapon){
  if(!weapon||!weapon.name)return;
  const found=discoveredWeapons();if(found.includes(weapon.name))return;
  found.push(weapon.name);try{if(wx.setStorageSync)wx.setStorageSync(WEAPON_ARCHIVE_KEY,found);}catch(e){}
}
function box(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.lineWidth=1;ctx.strokeStyle=stroke;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}}
function text(t,x,y,size=14,color=C.white,align='left'){ctx.fillStyle=color;ctx.font=size+'px sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(t),x,y);}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function adventureBackdrop(theme,safe,H,now){
  box(0,0,390,H,theme.background);
  if(theme===ADVENTURE_THEMES.dorm){
    for(let y=safe+66;y<H-8;y+=86){box(0,y,9,1,'#3e3730');box(381,y,9,1,'#3e3730');}
    [8,378].forEach((x,i)=>{box(x,0,4,H,'#292b28');box(x+1,0,1,H,'#67513a');for(let y=safe+80;y<H-36;y+=122){box(x-3,y,10,3,'#514338');box(x-1,y+3,6,10,'#7a5639');box(x,y+3,4,6,Math.floor(now*5+i)%2?'#e2ab58':'#f2d27b');}});
    for(let y=safe+105;y<H-20;y+=172)box(24,y,3,2,'#857253');
  }else{
    box(0,safe+61,390,3,'#31475a');box(0,safe+65,390,1,'#7390a3');
    [8,378].forEach((x,i)=>{box(x,0,4,H,'#1c2b3b');box(x+1,0,1,H,'#607a8d');for(let y=safe+92;y<H-40;y+=142){box(x-3,y,9,2,'#4d6578');box(x-2,y+3,6,14,'#263b50');box(x,y+6,3,3,i===0?'#df8f76':'#8acde1');}});
    for(let y=safe+112;y<H-18;y+=166){box(25,y,3,1,'#567086');box(29,y+5,2,2,'#8398a3');}
  }
}
function adventureWall(px,py,tile,x,y,theme,warm){
  box(px,py,tile,tile,theme.shadow);
  if(warm){
    box(px+2,py+1,tile-4,tile-3,theme.wallDark);box(px+3,py+3,tile-6,tile*.46,theme.wall);
    for(let i=0;i<3;i++)box(px+5,py+6+i*5,tile-10,1,i===0?theme.wallLight:'#8c775c');
    box(px+3,py+tile*.57,tile-6,tile*.31,'#604c39');box(px+3,py+tile*.58,tile-6,2,theme.wallTrim);
    box(px+5,py+tile-5,tile-10,2,'#312d28');
    if((x*3+y*5)%4===0){box(px+7,py+10,2,2,'#bd965b');box(px+tile-9,py+10,2,2,'#bd965b');}
  }else{
    box(px+2,py+1,tile-4,tile-3,theme.wallDark);box(px+3,py+3,tile-6,tile*.52,theme.wall);
    box(px+4,py+5,tile-8,2,theme.wallLight);box(px+4,py+tile*.58,tile-8,tile*.25,'#3d5364');
    box(px+4,py+tile*.58,tile-8,2,theme.wallTrim);box(px+4,py+tile-5,tile-8,2,'#1a2937');
    if((x+y)%2===0){box(px+tile*.35,py+tile*.69,1,tile*.14,'#617887');box(px+tile*.68,py+tile*.69,1,tile*.14,'#617887');}
    if((x*5+y*7)%9===0){box(px+tile*.28,py+tile*.32,3,1,'#a4a797');box(px+tile*.31,py+tile*.35,1,3,'#839294');}
  }
}
function adventureDoor(px,py,tile,warm){
  box(px+4,py+2,tile-8,tile-3,warm?'#47352a':'#293c4b',warm?'#d2a662':'#82a7b9');
  box(px+7,py+5,tile-14,tile-10,warm?'#895f3e':'#567082');
  box(px+10,py+8,tile-20,tile-16,warm?'#a77a4c':'#344b60');
  box(px+tile*.68,py+tile*.52,3,3,warm?'#f0ca78':'#dfaa64');
  pixelArt.icon(ctx,'lock',px+tile*.37,py+tile*.34,tile*.24,warm?'#f0ca78':'#c9dce3');
  if(!warm){box(px+tile*.25,py+4,tile*.5,3,'#a2b9c2');box(px+tile*.22,py+tile-7,tile*.56,2,'#b0c0bc');}
}
function adventureWallLamp(px,py,tile,warm,now){
  const cx=px+tile*.5,cy=py+tile*.43;box(cx-2,cy+2,4,tile*.25,warm?'#75543a':'#526d80');
  box(cx-5,cy-5,10,8,warm?'#44372c':'#24394b');box(cx-3,cy-4,6,6,warm?'#f0c56e':'#92d7e5');
  const flicker=.72+.28*(.5+.5*Math.sin(now*17+px*.07));ctx.save();ctx.globalAlpha=flicker;
  box(cx-2,cy-3,3,4,warm?(Math.sin(now*31+py)>.35?'#fff0b1':'#ffd476'):'#d0f5ee');
  box(cx-3,cy-6,2,2,warm?'#ffd98a':'#d0f5ee');ctx.restore();
  box(cx-7,cy+4,14,2,warm?'#8b6845':'#5f7b8c');
}
function adventurePickup(px,py,tile,kind,warm){
  const cx=px+tile*.5,cy=py+tile*.53;box(cx-tile*.2,cy+tile*.16,tile*.4,3,'rgba(3,8,13,.4)');
  if(kind==='key'){box(cx-2,cy-7,4,11,warm?'#efc96f':'#f2d777');box(cx+1,cy-7,5,3,warm?'#d99e4b':'#c4d3d2');box(cx+4,cy-4,2,7,warm?'#d99e4b':'#c4d3d2');}
  else if(kind==='gold'){box(cx-5,cy-3,9,7,warm?'#c38a42':'#b7a16d');box(cx-4,cy-5,8,7,'#f0ca69');box(cx+1,cy-3,2,3,'#fff0a0');}
  else if(kind==='heal'){box(cx-5,cy-4,10,9,'#e4dfbd');box(cx-3,cy-7,6,3,'#89ab79');box(cx-1,cy-3,3,7,'#df8572');box(cx-4,cy,9,3,'#df8572');}
  else if(kind==='weapon'||kind==='saber'||kind==='pulse'){
    box(cx-6,cy+1,12,2,'rgba(3,8,13,.45)');
    if(kind==='saber'){box(cx-2,cy-10,4,12,'#72e6f3');box(cx-1,cy-11,2,10,'#f0ffff');box(cx-4,cy+1,8,3,'#6a719a');}
    else if(kind==='pulse'){box(cx-6,cy-3,11,7,'#536b88');box(cx+3,cy-2,5,3,'#8defff');box(cx-3,cy-5,4,2,'#b2eff5');}
    else{box(cx-1,cy-9,3,14,warm?'#d7d0bb':'#b8d6e2');box(cx+1,cy-8,2,9,warm?'#e2b962':'#8ed2df');box(cx-4,cy+2,8,3,warm?'#815533':'#58768d');}
  }
  else if(kind==='fuse'){box(cx-7,cy-3,14,6,'#b4d8d2');box(cx-5,cy-2,10,4,'#e3d9ac');box(cx-9,cy-2,2,4,'#d28c58');box(cx+7,cy-2,2,4,'#d28c58');}
}
function mountPixels(x,y,tile,facing=1){
  const u=Math.max(1,Math.round(tile/22));
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(facing<0?-1:1,1);
  const p=(dx,dy,w,h,color)=>box(dx*u,dy*u,w*u,h*u,color);
  // A small warm pixel hound with a simple saddle, drawn behind the rider.
  p(-10,-13,12,7,'#664a3b');p(-9,-14,10,6,'#a87b52');p(-7,-15,6,3,'#d3ad73');
  p(1,-17,7,7,'#a87b52');p(2,-19,2,3,'#664a3b');p(6,-18,2,2,'#d3ad73');
  p(7,-15,2,2,'#382e35');p(7,-12,3,1,'#e7b86f');
  p(-11,-12,3,2,'#664a3b');p(-8,-7,2,5,'#664a3b');p(-2,-7,2,5,'#664a3b');p(4,-11,2,2,'#664a3b');
  p(-5,-14,5,2,'#e6bc73');p(-2,-16,2,3,'#fff0c4');
  ctx.restore();
}
function schoolBoard(px,py,tile){
  box(px+3,py+tile*.18,tile-6,tile*.58,'#1c2938');
  box(px+5,py+tile*.22,tile-10,tile*.48,'#31485c');
  box(px+8,py+tile*.29,tile*.46,2,'#c3c7ae');box(px+8,py+tile*.39,tile*.6,2,'#b7c2c0');
  box(px+8,py+tile*.51,tile*.37,2,'#b9bbc0');box(px+tile*.38,py+tile*.7,tile*.24,3,'#9a795a');
}
function noticeboard(px,py,tile){
  box(px+3,py+tile*.17,tile-6,tile*.62,'#4e382d');box(px+6,py+tile*.23,tile-12,tile*.48,'#c7ad78');
  box(px+9,py+tile*.29,tile*.24,5,'#f0d99e');box(px+tile*.55,py+tile*.29,tile*.25,5,'#e8c990');
  box(px+9,py+tile*.5,tile*.52,2,'#826b52');box(px+9,py+tile*.58,tile*.35,2,'#826b52');
}
function locker(px,py,tile){
  box(px+4,py+3,tile-8,tile-6,'#293b53');box(px+6,py+5,tile-12,tile-10,'#526b86');
  box(px+tile*.28,py+7,2,tile-14,'#8097a9');box(px+tile*.67,py+7,2,tile-14,'#344a64');
  box(px+tile*.75,py+tile*.48,2,3,'#d6b578');
}
function recentHit(monster){return state.time-monster.hitAt<.14;}
function battleSkin(){return laneArt.palette(state.chapter,state.mode);}
function button(t,x,y,w,h,fn,active){
  let skin=null;
  if(page==='adventure'&&adventureState)skin=ADVENTURE_THEMES[adventure.chapter.floors[adventureState.floor].id];
  else if(page==='game'&&state)skin=battleSkin();
  else if(page==='rescue-choice')skin=laneArt.palette('chapel','rescue');
  if(skin)laneArt.frame(ctx,x,y,w,h,skin,active);
  else pixelArt.frame(ctx,x,y,w,h,{fill:active?'#31564f':C.panel,edge:active?C.mint:C.line,light:active?C.mint:'#80949a'});
  text(t,x+w/2,y+h/2,13,active?(skin?skin.accent:C.mint):C.white,'center');
  buttons.push({x,y,w,h,fn});
}
function bar(x,y,w,h,p,color){box(x,y,w,h,'#132530');box(x,y,w*Math.max(0,Math.min(1,p)),h,color);}
function start(chapter){state=G.create(Date.now(),chapter);page='game';panel='shop';selection=-1;boardSelection=-1;ended=false;last=Date.now();}
function startRescue(carry){state=G.createRescue(Date.now(),carry);page='game';panel='rescue';selection=-1;boardSelection=-1;ended=false;last=Date.now();}
function home(){page='home';state=null;synergyView=null;adventureState=null;clearActionInput();}
function saveAdventure(){if(!adventureState||adventureSaveBlocked||!wx.setStorageSync)return;try{adventureState.saveError=false;wx.setStorageSync(ADVENTURE_SAVE,JSON.stringify(adventureState));}catch(e){adventureState.saveError=true;}}
function reviveAdventure(){
  const a=adventureState;
  if(!adventure.revive(a)){a.message='复活失败：检查点数据不可用。你可以重开整章继续。';saveAdventure();return;}
  adventureAction.prepare(a,true);clearActionInput();a.message='';a.reviveLocation=adventure.checkpointName(a);a.reviveNoticeUntil=Date.now()+2200;saveAdventure();
}
function startAdventure(){
  let saved=null,raw=null;adventureHintStep=0;adventureSaveBlocked=false;
  if(wx.getStorageSync){try{raw=wx.getStorageSync(ADVENTURE_SAVE);saved=raw?adventure.restore(JSON.parse(raw)):null;}catch(e){adventureSaveBlocked=true;}}
  if(raw&&!saved)adventureSaveBlocked=true;
  adventureState=saved||adventure.start();
  (adventureState.weaponSlots||[]).forEach(rememberWeapon);
  adventureAction.prepare(adventureState);clearActionInput();
  if(adventureSaveBlocked)adventureState.message='本地存档无法读取，本次暂不保存。可以返回或选择重开本章。';
  page='adventure';saveAdventure();
}
function homeChapter(x,y,chapter,title,detail,enemy){
  const skin=laneArt.palette(chapter);
  laneArt.frame(ctx,x,y,166,166,skin);
  laneArt.preview(ctx,x+8,y+8,150,75,chapter);
  sprites.boss(ctx,x+111,y+61,54,0,enemy,{});
  heroPixels.draw(ctx,chapter==='chapel'?'ao':'tang',x+49,y+74,{scale:1.1,pose:'idle',time:0});
  text(title,x+13,y+101,16,C.white);
  text(detail,x+13,y+123,11,C.muted);
  text(chapter==='chapel'?'打断司礼官复苏':'击倒火灵，让首领落地',x+13,y+145,10,skin.accent);
}
function homeRoommates(y){
  const bottom=Math.min(H-39,y+120);
  if(bottom-y<64)return;
  box(22,bottom-27,346,3,'#314c59');box(31,bottom-24,328,4,'#263f4d');
  box(153,bottom-102,84,75,'#213847');box(157,bottom-98,76,67,'#2c4653');
  box(166,bottom-90,58,3,'#6a7e78');box(170,bottom-83,50,54,'#192e39');
  box(178,bottom-75,34,29,'#344e58');box(185,bottom-67,20,15,'#d3ad69');
  text('611',195,bottom-59,10,'#35434a','center');
  const ids=['ao','zhi','csy','tang','ge','hong'];
  ids.forEach((id,i)=>heroPixels.draw(ctx,id,48+i*58,bottom-20,{scale:.7,pose:'idle',time:0}));
}
function renderChapters(){
  laneArt.backdrop(ctx,390,H,laneArt.palette('chapel'));
  text('611',24,safe+48,42,C.mint);text('今晚守家',24,safe+95,30,C.white);
  text('老室友，再一起守一局',25,safe+124,13,C.muted);
  box(25,safe+145,24,2,C.gold);text('三路守城  ·  抽卡合成  ·  齐守高地',56,safe+146,11,C.muted);
  text('选择副本',24,safe+179,13,C.gold);text('单人试玩',366,safe+179,11,C.muted,'right');
  homeChapter(24,safe+191,'chapel','赤灯礼堂','巡逻队走出了门','warden');
  homeChapter(200,safe+191,'tower','黑塔之巅','塔顶传来双翼的风声','shade');
  for(const [chapter,x] of [['chapel',24],['tower',200]]){
    const y=safe+369,skin=laneArt.palette(chapter);
    laneArt.frame(ctx,x,y,166,42,skin,true);
    text('进入副本',x+83,y+21,13,skin.accent,'center');
    buttons.push({x,y:safe+191,w:166,h:220,fn:()=>start(chapter)});
  }
  text('共 5 波 · 左右路由电脑队友防守',195,safe+438,11,C.muted,'center');
  button('3 分钟救场 · 单人试玩',24,safe+475,342,44,()=>{page='rescue-choice';},true);
  button('返回模式选择',24,Math.min(H-48,safe+543),342,36,home);
}
function renderRescueChoice(){
  const skin=laneArt.palette('chapel','rescue');
  laneArt.backdrop(ctx,390,H,skin);
  text('3分钟救场实验',195,safe+73,27,C.white,'center');
  text('单人玩法试验 · 不代表联机版本',195,safe+105,12,C.muted,'center');
  laneArt.frame(ctx,26,safe+132,338,77,skin,true);
  heroPixels.draw(ctx,'ao',68,safe+181,{scale:1.1,pose:'idle',time:0});
  text('敖犬已自动上阵',111,safe+158,15,C.white);text('再选一位搭档，直接开始，不用整理商店。',111,safe+183,11,C.muted);
  laneArt.frame(ctx,25,safe+225,164,197,laneArt.palette('tower'));
  heroPixels.draw(ctx,'tang',106,safe+278,{scale:1.35,pose:'idle',time:0});
  text('唐卵 · 闪电清场',107,safe+321,15,C.white,'center');
  text('怪物扎堆时连锁攻击',107,safe+346,11,C.muted,'center');
  text('适合：一群怪一起冲来',107,safe+372,10,C.gold,'center');
  button('选唐卵出发',40,safe+387,134,26,()=>startRescue('tang'),true);
  laneArt.frame(ctx,201,safe+225,164,197,skin);
  heroPixels.draw(ctx,'hong',282,safe+278,{scale:1.35,pose:'idle',time:0});
  text('红星 · 远程点杀',283,safe+321,15,C.white,'center');
  text('优先射击逼近基地的怪',283,safe+346,11,C.muted,'center');
  text('适合：盯住单个漏网怪',283,safe+372,10,C.gold,'center');
  button('选红星出发',216,safe+387,134,26,()=>startRescue('hong'));
  text('红色警报亮起：点对应路线赶去；蓄力发红光时按援护。',195,safe+458,11,C.muted,'center');
  button('返回',115,Math.min(H-52,safe+505),160,38,()=>{page='chapters';});
}
function titlePortal(){
  const y=safe+8;box(18,y,354,139,'#111b2b','#5d7182');
  for(let i=0;i<8;i++){box(26+i*46,y+7,38,3,i%2?'#344b5e':'#40566a');box(26+i*46,y+127,38,3,'#344b5e');}
  box(28,y+15,58,104,'#202c3a');box(34,y+21,46,90,'#2b3946');box(304,y+15,58,104,'#202c3a');box(310,y+21,46,90,'#2b3946');
  box(85,y+22,220,97,'#293847');box(96,y+30,198,81,'#101c2b');
  box(145,y+37,100,72,'#1b5660');box(153,y+43,84,62,'#57a39b');box(162,y+48,66,54,'#a2d4c4');box(174,y+55,42,47,'#d5d8c0');
  box(180,y+61,29,41,'#394d5c');box(185,y+68,18,34,'#1a2938');
  for(let i=0;i<15;i++){const x=38+((i*47+11)%314),py=y+27+((i*31+7)%85);box(x,py,2,2,i%3?'#83c7c1':'#e2c27e');}
  box(42,y+50,12,24,'#7c5943');box(46,y+42,4,10,'#ffcd77');box(336,y+50,12,24,'#7c5943');box(340,y+42,4,10,'#ffcd77');
  pixelArt.frame(ctx,120,y+101,150,31,{fill:'#26374a',edge:'#bd9b64',light:'#dfc78a'});text('611 · 今晚守家',195,y+116,17,'#f4ddb0','center');
}
function renderHome(){
  titlePortal();text('老室友，再一起冒险',195,safe+168,13,C.muted,'center');
  text('选择玩法',24,safe+195,14,C.gold);
  const storyTheme=ADVENTURE_THEMES.dorm;
  adventureArt.frame(ctx,24,safe+211,342,72,{...storyTheme,panel:storyTheme.selected});
  adventureArt.landmark(ctx,'window',30,safe+218,48);
  heroPixels.draw(ctx,'csy',55,safe+273,{scale:.62,pose:'idle',time:0});
  text('剧情模式',91,safe+232,17,C.white);
  text('重返 611 · 探索校园、寻找室友',91,safe+257,11,storyTheme.muted);
  pixelArt.icon(ctx,'arrow',334,safe+236,18,storyTheme.accent);
  buttons.push({x:24,y:safe+211,w:342,h:72,fn:startAdventure});
  pixelArt.frame(ctx,24,safe+293,342,72,{fill:'#283d4c',edge:C.line,light:'#91a3a6'});
  heroPixels.draw(ctx,'ao',55,safe+345,{scale:.9,pose:'idle',time:0});text('三路守城',85,safe+314,17,C.white);text('五波守城 · 抽卡合成 · 高地首领',85,safe+339,11,C.muted);buttons.push({x:24,y:safe+293,w:342,h:72,fn:()=>{page='chapters';}});
  pixelArt.frame(ctx,24,safe+375,342,64,{fill:'#223442',edge:'#526875',light:'#71868c'});heroPixels.draw(ctx,'ge',55,safe+423,{scale:.85,pose:'idle',time:0});text('好友对棋',85,safe+394,16,C.muted);text('自走棋对战 · 开发中',85,safe+419,11,C.muted);buttons.push({x:24,y:safe+375,w:342,h:64,fn:()=>{page='home';}});
  const labY = safe + 447;
  pixelArt.frame(ctx, 24, labY, 342, 58, {fill:'#2d344b',edge:'#6e7295',light:'#9c97bb'});
  pixelArt.icon(ctx, 'magic', 43, labY + 16, 25, C.purple);
  text('实验室', 85, labY + 18, 16, C.white);
  text('611 怨秽 · 横版剧情试玩', 85, labY + 39, 11, C.muted);
  buttons.push({x:24,y:labY,w:342,h:58,fn:openLab});
  const found=discoveredWeapons().filter(name=>WEAPON_ARCHIVE.some(w=>w.name===name)).length;
  button('武器回廊  ·  '+found+'/'+WEAPON_ARCHIVE.length+' 已发现',24,labY+66,342,36,()=>{page='weapon-gallery';});
  if(H>680)homeRoommates(labY+111);text('原创像素风 · 611 室友故事',195,H-30,10,C.muted,'center');
}

function openLab() {
  nightStory = null;
  storyTouches.clear();
  page = 'lab';
}

function renderLab() {
  text('实验室', 24, safe + 48, 27, C.white);
  button('返回首页', 273, safe + 31, 93, 34, home);
  const y = safe + 96;
  pixelArt.frame(ctx, 24, y, 342, 140, {fill:'#2d344b',edge:'#6e7295',light:'#9c97bb'});
  text('611 怨秽', 42, y + 30, 20, C.white);
  text('第一关 · 多出来的一声「到」', 42, y + 59, 13, C.muted);
  button('进入试玩', 42, y + 85, 306, 36, () => startNightStory(), true);
}

function startNightStory(restart = false) {
  let checkpoint;
  if (!restart) {
    try { checkpoint = wx.getStorageSync(NIGHT_ROLL_CALL_SAVE); } catch (_) {}
  }
  const stage = checkpoint && Number.isInteger(checkpoint.stage) && checkpoint.stage >= 0 && checkpoint.stage <= 3
    ? checkpoint.stage : 0;
  nightStory = nightRollCall.create(stage, stage === 3 && checkpoint.complete === true);
  if (checkpoint) {
    for (const clue of ['list', 'chat', 'note']) {
      nightStory.read[clue] = Boolean(checkpoint.read && checkpoint.read[clue] === true);
    }
    nightStory.table = stage === 3 && checkpoint.table === true;
    nightStory.recording = stage === 3 && checkpoint.recording === true;
  }
  storyTouches.clear();
  page = 'nightStory';
  if (restart) saveNightStory();
}

function saveNightStory() {
  try {
    const {stage, complete, read, table, recording} = nightStory;
    wx.setStorageSync(NIGHT_ROLL_CALL_SAVE, {stage, complete, read, table, recording});
  } catch (_) {}
}

function useNightStoryAction() {
  const action = nightRollCall.interaction(nightStory);
  if (!action) return;
  const stage = nightStory.stage;
  action.run();
  if (nightStory.dialogue || stage !== nightStory.stage) {
    storyTouches.clear();
    saveNightStory();
  }
}

function storyDirection() {
  let direction = 0;
  for (const value of storyTouches.values()) direction += value;
  return Math.sign(direction);
}

function renderNightStory() {
  nightRollCallView.render(ctx, nightStory, {
    height: H, safe, box, text, button, direction: storyDirection(), leave: openLab,
    advance: () => { nightStory.dialogue = null; }, interact: useNightStoryAction,
    openClues: () => { storyTouches.clear(); nightStory.dialogue = nightRollCall.clues(nightStory); },
    replay: () => startNightStory(true)
  });
}
function renderWeaponGallery(){
  const found=discoveredWeapons();
  text('611',24,safe+47,38,C.mint);text('武器回廊',24,safe+88,25,C.white);
  text('把探索中见过的装备收进回忆册',24,safe+115,11,C.muted);
  const collected=WEAPON_ARCHIVE.filter(w=>found.includes(w.name)).length;
  pixelArt.frame(ctx,24,safe+136,342,38,{fill:'#223847',edge:'#647e8a',light:'#9cafad'});
  text('已收集 '+collected+' / '+WEAPON_ARCHIVE.length,38,safe+155,12,C.gold);
  const top=safe+183,cardH=Math.max(62,Math.min(94,Math.floor((H-safe-277)/5))),gap=8;
  WEAPON_ARCHIVE.forEach((weapon,index)=>{
    const col=index%2,row=Math.floor(index/2),x=24+col*176,y=top+row*(cardH+gap),known=found.includes(weapon.name),info=weaponInfo(weapon.kind);
    pixelArt.frame(ctx,x,y,166,cardH,{fill:known?'#253e4c':'#172634',edge:known?'#76939b':'#354956',light:known?'#b4c4b8':'#536976'});
    if(known)heroPixels.draw(ctx,'csy',x+22,y+cardH*.59,{scale:.64,pose:'idle',time:0,weapon:weapon.name});
    else pixelArt.icon(ctx,'sword',x+22,y+cardH*.55,23,'#5a6d79');
    text(known?weapon.name:'？？？',x+42,y+16,10,known?C.white:'#87979f');
    text(known?info.slot+' · '+info.range:'探索 '+weapon.place,x+42,y+34,9,known?C.mint:C.muted);
    const trait={sword:'快速精准斩击',cleave:'宽弧扫击·最多3目标',saber:'直线穿刺·最多3目标',pulse:'远程贯穿·最多3目标',lightning:'连锁跳电·最多3目标'}[weapon.kind]||'独特攻击方式';
    text(known?trait:'发现后收入图鉴',x+42,y+cardH-15,8,known?C.muted:'#71818b');
  });
  button('返回首页',115,Math.min(H-52,top+5*(cardH+gap)+2),160,36,home);
}
function adventureMove(dx,dy){if(adventure.move(adventureState,dx,dy)){adventureHintStep=0;saveAdventure();}}
function renderAdventure(){
  const a=adventureState,f=adventure.chapter.floors[a.floor];
  if(a.message!==adventureDialogueText){adventureDialogueText=a.message||'';adventureDialoguePage=0;}
  const warm=f.id==='dorm';
  const theme=ADVENTURE_THEMES[f.id]||ADVENTURE_THEMES.dorm;
  const lamps=(f.lamps||[]).map(lamp=>{
    const [x,y,,strength,castsBeam]=lamp;
    if(f.id==='corridor'&&(a.lightRestored||(a.power==='classroom'&&x>=18))) {
      return [x,y,'163,209,205',Math.max(.27,strength),castsBeam];
    }
    return lamp;
  });
  const now=Date.now()/1000;
  if(adventureVisual.floor!==a.floor){adventureVisual={floor:a.floor,platform:false,liftUntil:0};}
  if(!a.platformRaised)adventureVisual.platform=false;
  else if(!adventureVisual.platform){adventureVisual.platform=true;adventureVisual.liftUntil=now+.78;}
  adventureBackdrop(theme,safe,H,now);
  adventureArt.frame(ctx,9,safe+3,372,56,theme);
  text(adventure.chapter.title,20,safe+20,17,C.white);
  text(f.name,108,safe+20,11,theme.accent);
  pixelArt.icon(ctx,'heart',18,safe+36,15,'#e8a389');
  bar(37,safe+41,64,8,a.hp/a.maxHp,a.hp/a.maxHp<.3?'#d48170':'#c3a17d');
  text(Math.ceil(a.hp)+'/'+a.maxHp,108,safe+45,10,C.white);
  text('攻 '+a.attack+'  防 '+a.defense+'  钥匙 '+a.keys+(f.id==='corridor'?'  '+({off:'未供电',classroom:'旧教室供电',hall:'礼堂供电'}[a.power]||'未供电'):''),374,safe+45,11,theme.light,'right');
  const tile=Math.max(13,Math.min(36,Math.floor((H-safe-420)/9))),left=Math.round((390-tile*9)/2),top=safe+67;
  const map=a.maps[a.floor],seen=a.seen[a.floor],actor=a.action,nearby=adventure.nearbyInteraction(a),cameraX=Math.max(0,Math.min(map[0].length-9,actor.x-4)),cameraY=Math.max(0,Math.min(map.length-9,actor.y-4));
  const view={left,top,tile,cameraX,cameraY};
  adventureArt.frame(ctx,left-6,top-6,tile*9+12,tile*9+12,theme);
  ctx.save();ctx.beginPath();ctx.rect(left,top,tile*9,tile*9);ctx.clip();
  const landmarks=f.landmarks||{};
  const pickupMarkers=[];
  map.forEach((row,y)=>row.forEach((cell,x)=>{
    if(x+1<=cameraX||x>=cameraX+9||y+1<=cameraY||y>=cameraY+9)return;
    const px=left+(x-cameraX)*tile,py=top+(y-cameraY)*tile;
    if(!seen[y][x]){box(px,py,tile,tile,theme.fog);if((x*13+y*7)%9===0)box(px+tile*.45,py+tile*.45,2,2,theme.wallDark);return;}
    const region=f.regions.find(r=>x>=r.x1&&x<=r.x2&&y>=r.y1&&y<=r.y2);
    if(cell==='#')adventureWall(px,py,tile,x,y,theme,warm);
    else adventureArt.floor(ctx,px,py,tile,x,y,region?.scene||f.defaultScene);
    const landmark=landmarks[x+','+y];
    if(landmark&&(cell==='.'||cell==='#'))adventureArt.landmark(ctx,landmark,px,py,tile);
    if(cell==='C'){
      if(warm&&x>=16&&y>=8){box(px+3,py+tile*.34,tile-6,tile*.48,'#536d76','#c4d2cb');box(px+5,py+tile*.39,tile-10,tile*.35,'#293b49','#8da8b2');box(px+5,py+tile*.3,tile-10,4,'#e5c77f');box(px+tile*.26,py+tile*.12,tile*.48,tile*.19,'#93b9bf','#dce8df');box(px+tile*.4,py+tile*.05,tile*.2,3,'#becfae');}
      else{box(px+3,py+tile*.18,tile-6,tile*.63,'#566c78','#c4d2cb');box(px+5,py+tile*.24,tile-10,tile*.43,'#293b49','#8da8b2');box(px+6,py+tile*.21,tile-12,3,'#e5c77f');box(px+6,py+tile*.68,tile-12,3,'#8b9ca4');box(px+tile*.22,py+tile*.38,3,tile*.2,'#d0dde0');box(px+tile*.72,py+tile*.38,3,tile*.2,'#d0dde0');}
    }
    if(cell==='P'){
      box(px+tile*.19,py+tile*.34,tile*.62,tile*.34,'#5e5140','#e0bd72');box(px+tile*.26,py+tile*.4,tile*.48,tile*.2,'#d6b366');
      box(px+tile*.35,py+tile*.44,tile*.3,tile*.12,'#fff0ad');
    }
    if(cell==='G'){box(px+tile*.18,py+tile*.08,tile*.64,tile*.82,'#533e32','#edc578');box(px+tile*.27,py+tile*.16,tile*.46,tile*.67,'#72563b');box(px+tile*.33,py+tile*.23,2,tile*.54,'#c39759');box(px+tile*.63,py+tile*.48,3,3,'#f5dc91');}
    if(cell==='#'){
      if(warm&&x===7&&y===13){noticeboard(px,py,tile);box(px+tile-8,py+tile*.6,4,7,'#80563c');box(px+tile-7,py+tile*.48,2,5,'#ffd482');}
      if(warm&&x===4&&y===8){box(px+tile*.22,py+tile*.21,tile*.56,tile*.48,'#634c3a');box(px+tile*.28,py+tile*.28,tile*.44,tile*.32,'#d1bb8b');box(px+tile*.35,py+tile*.36,tile*.3,2,'#8e6f4c');box(px+tile*.35,py+tile*.44,tile*.24,2,'#8e6f4c');}
      if(warm&&((x===7&&y===9)||(x===15&&(y===9||y===14))))adventureWallLamp(px,py,tile,true,now);
      if(!warm&&x===7&&y===10)locker(px,py,tile);
      if(!warm&&x===15&&y===10)schoolBoard(px,py,tile);
      if(!warm&&x===7&&y===17){box(px+tile*.17,py+tile*.2,tile*.66,tile*.48,'#6c4144');box(px+tile*.24,py+tile*.27,tile*.52,tile*.3,'#ad6460');box(px+tile*.38,py+tile*.34,tile*.25,3,'#f1d7a2');}
      if(!warm&&x===15&&(y===14||y===15)){box(px+tile*.42,py,3,tile,'#8796a0');box(px+tile*.42-2,py+tile*.35,7,3,'#c1a96f');box(px+tile*.42-1,py+tile*.72,5,2,'#8ac5d3');}
      if(!warm&&x===4&&y===12){box(px+tile*.2,py+tile*.25,tile*.6,tile*.45,'#344b62');box(px+tile*.28,py+tile*.33,tile*.44,tile*.27,'#87a2b1');box(px+tile*.47,py+tile*.42,4,4,'#e0c16f');}
    }
    if(cell==='d')adventureDoor(px,py,tile,warm);
    else if(cell==='k')adventurePickup(px,py,tile,'key',warm);
    else if(cell==='g')adventurePickup(px,py,tile,'gold',warm);
    else if(cell==='p')adventurePickup(px,py,tile,'heal',warm);
    else if(cell==='s'){
      const key=a.floor+':'+x+':'+y,w=(a.groundWeapons||{})[key]||(f.weaponsAt&&f.weaponsAt[x+','+y])||f.weapon;
      adventurePickup(px,py,tile,w.kind==='saber'?'saber':w.kind==='pulse'?'pulse':'weapon',warm);
      pickupMarkers.push([px,py,nearby?.type==='weapon'&&nearby.x===x&&nearby.y===y,theme.accent]);
    }
    else if(cell==='f'){
      adventurePickup(px,py,tile,'fuse',warm);
      pickupMarkers.push([px,py,false,'#ffc975']);
    }
    else if(cell==='L'){
      const powered=a.power==='hall'?'#9ce9bd':a.power==='classroom'?'#f1c76f':'#d98b62';
      box(px+4,py+3,tile-8,tile-5,warm?'#473d32':'#354f62',theme.edge);box(px+7,py+6,tile-14,tile-11,warm?'#8d6d45':'#708998');
      box(px+10,py+10,3,3,'#df9c5b');box(px+tile-14,py+10,3,3,powered);box(px+10,py+tile-11,tile-20,2,'#c1d0c7');text('配电',px+tile/2,py+tile-8,7,C.white,'center');
    }
    else if(cell==='o'){
      box(px+tile*.2,py+tile*.16,tile*.6,tile*.64,'#715b43','#dfc990');box(px+tile*.27,py+tile*.23,tile*.46,tile*.42,'#82978c');
      box(px+tile*.31,py+tile*.3,tile*.14,tile*.18,'#d9b27a');box(px+tile*.49,py+tile*.3,tile*.14,tile*.18,'#c78f71');box(px+tile*.29,py+tile*.55,tile*.42,2,'#ebd89f');
    }
    else if(cell==='r'){
      box(px+tile*.17,py+tile*.36,tile*.66,tile*.42,'#77533b','#dcb771');box(px+tile*.23,py+tile*.28,tile*.54,tile*.12,'#a87a4e');box(px+tile*.34,py+tile*.42,tile*.32,tile*.08,'#e5c579');
      pixelArt.icon(ctx,'sword',px+tile*.38,py+tile*.21,tile*.26,'#e2e3d1');
    }
    else if(cell==='E'){
      const open=a.power==='classroom';box(px+tile*.17,py+tile*.14,tile*.66,tile*.73,open?'#66553c':'#364555',open?'#f0c978':'#91a8b4');
      box(px+tile*.27,py+tile*.21,tile*.46,tile*.54,open?'#9b7844':'#263746');box(px+tile*.35,py+tile*.26,2,tile*.44,open?'#f1ca76':'#637c8a');
      box(px+tile*.62,py+tile*.47,2,2,'#fff0ac');
    }
    else if(cell==='v'){
      box(px+tile*.11,py+tile*.34,tile*.78,tile*.43,a.maintenanceOpen?'#48665c':'#35414b',a.maintenanceOpen?'#9cd1ac':'#84939c');
      for(let i=0;i<3;i++)box(px+tile*(.26+i*.22),py+tile*.39,2,tile*.31,a.maintenanceOpen?'#aacfb0':'#778b94');
      text(a.maintenanceOpen?'通':'修',px+tile*.5,py+tile*.25,7,a.maintenanceOpen?C.mint:C.muted,'center');
    }
    else if(cell==='x'){
      box(px+4,py+tile*.55,tile-8,tile*.28,warm?'#443b31':'#263e50',theme.accent);
      box(px+7,py+tile*.58,tile-14,tile*.07,theme.light);box(px+9,py+tile*.7,tile-18,tile*.07,theme.edge);
      pixelArt.icon(ctx,'arrow',px+tile*.32,py+tile*.06,tile*.36,theme.accent);
    }
    else if(cell==='n')heroPixels.draw(ctx,a.floor===0?'ao':'tang',px+tile/2,py+tile*.9,{scale:tile/38,pose:'idle',time:now});
    else if(cell==='q'||cell==='t'){heroPixels.draw(ctx,cell==='q'?'priest':'forge',px+tile/2,py+tile*.9,{scale:tile/40,pose:'idle',time:0});text(cell==='q'?'对话':'商店',px+tile/2,py+4,9,C.gold,'center');}
  }));
  if(warm&&a.platformRaised){
    const liftX=a.pathChoice==='storage'?7:15,liftY=11,px=left+(liftX-cameraX)*tile,py=top+(liftY-cameraY)*tile,lift=Math.max(0,Math.min(1,(adventureVisual.liftUntil-now)/.78));
    box(px+3,py+tile*.58,tile-6,tile*.25,'rgba(0,0,0,.32)');
    const rise=lift*tile*.22;
    box(px+2,py+tile*.42-rise,tile-4,tile*.28,'#526b79','#d3c28b');box(px+4,py+tile*.44-rise,tile-8,tile*.12,'#95a6a2');
    box(px+4,py+tile*.62-rise,tile-8,2,'#e8c778');
    if(lift>0){ctx.save();ctx.globalAlpha=lift*.7;for(let i=0;i<4;i++){const sx=px+5+i*(tile-10)/3;box(sx,py+tile*.77-lift*tile*.42,2,3,i%2?'#f1d38a':'#9bd9dc');}ctx.restore();}
  }
  adventureArt.atmosphere(ctx,view,lamps,map,seen,actor,now,warm);
  for(const [px,py,active,color] of pickupMarkers){
    adventureArt.pickupMarker(ctx,px+tile*.5,py+tile*.5,tile,now,color,active);
  }
  actor.enemies[a.floor].forEach(enemy=>{
    if(enemy.hp<=0||!seen[Math.round(enemy.y)]||!seen[Math.round(enemy.y)][Math.round(enemy.x)])return;
    const impactShake=enemy.type==='b'&&enemy.crashOpen>0?Math.sin(now*76)*1.6:0;
    const ex=left+(enemy.x-cameraX+.5)*tile+impactShake,ey=top+(enemy.y-cameraY+.55)*tile;
    if(enemy.type==='b'){
      sprites.boss(ctx,ex,ey,tile*1.25,Date.now()/1000,a.floor===0?'warden':'shade',{warning:Boolean(enemy.warning),hit:enemy.hit>0,enraged:Boolean(enemy.warning),defeated:enemy.hp<=0});
      if(enemy.warning){ctx.save();ctx.strokeStyle='rgba(255,111,92,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ex,ey,tile*.78,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(255,111,92,.52)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+enemy.chargeX*tile*3.7,ey+enemy.chargeY*tile*3.7);ctx.stroke();ctx.setLineDash([]);ctx.restore();text('锁定冲锋 · 横移！',ex,ey-tile*.95,9,C.red,'center');}
      if(enemy.crashOpen>0){ctx.save();ctx.strokeStyle='#fff0a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ex,ey,tile*(.85+Math.sin(now*18)*.1),0,Math.PI*2);ctx.stroke();ctx.restore();text('撞铁架！趁硬直反击',ex,ey-tile*1.05,10,C.gold,'center');}
    }else sprites.enemy(ctx,enemy.type,ex-(enemy.hit>0?Math.sin(now*58)*2:0),ey,tile*.75,now,{theme:warm?'dorm':'chapel',hit:enemy.hit>0,warning:Boolean(enemy.warning)});
    if(enemy.type!=='b'&&enemy.warning&&enemy.behavior==='charge'){ctx.save();ctx.strokeStyle='rgba(255,111,92,.82)';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+enemy.chargeX*tile*2.7,ey+enemy.chargeY*tile*2.7);ctx.stroke();ctx.setLineDash([]);ctx.restore();text('横移躲开',ex,ey-tile*.65,8,C.red,'center');}
    if(enemy.hit>0){
      const pulse=Math.max(.2,enemy.hit/.16);ctx.save();ctx.globalAlpha=pulse;ctx.strokeStyle=enemy.type==='b'?'#fff0a8':(['lightning','pulse','saber'].includes(a.weaponKind)?'#a9edff':'#ffe0a5');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex-tile*.3,ey-tile*.18);ctx.lineTo(ex-tile*.48,ey-tile*.36);ctx.moveTo(ex+tile*.26,ey-tile*.25);ctx.lineTo(ex+tile*.43,ey-tile*.43);ctx.stroke();ctx.restore();
    }
    bar(ex-12,ey-tile*.72,24,4,enemy.hp/enemy.maxHp,enemy.type==='b'?C.gold:C.red);
  });
  if(actor.crashFlash&&actor.crashFlash.life>0){const p=1-actor.crashFlash.life/1.05,cx=left+(actor.crashFlash.x-cameraX+.5)*tile,cy=top+(actor.crashFlash.y-cameraY+.5)*tile;ctx.save();ctx.globalAlpha=actor.crashFlash.life;ctx.strokeStyle='#ffe29b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,8+p*26,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const ang=i*Math.PI/6,reach=10+p*28+(i%2)*3;box(cx+Math.cos(ang)*reach-2,cy+Math.sin(ang)*reach-2,4,4,i%2?'#fff0b1':'#85d9e7');}if(p<.16)box(cx-5,cy-5,10,10,'rgba(255,242,190,.72)');ctx.restore();}
  (actor.bursts||[]).forEach(b=>{
    if(b.floor!==a.floor||!seen[Math.round(b.y)]?.[Math.round(b.x)])return;
    const cx=left+(b.x-cameraX+.5)*tile,cy=top+(b.y-cameraY+.55)*tile,p=1-b.life/b.duration,alpha=Math.max(0,b.life/b.duration);
    sprites.enemyBurst(ctx,b.type==='b'?'heavy':'normal',cx,cy,p);
    // Add crisp, chunky shards around the existing sprite burst so knockouts
    // read at phone scale immediately after the strike, without screen shake.
    ctx.save();ctx.globalAlpha=alpha;const radius=7+tile*.35*p,color=b.type==='b'?'#ffe1a1':(['lightning','pulse','saber'].includes(a.weaponKind)?'#a9edff':'#ffd28e');ctx.fillStyle=color;
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,reach=radius+(i%2)*3;ctx.fillRect(Math.round(cx+Math.cos(angle)*reach-2),Math.round(cy+Math.sin(angle)*reach-2),i%3===0?5:4,i%3===0?5:4);}
    ctx.fillStyle='#fff5d2';ctx.fillRect(Math.round(cx-2),Math.round(cy-2),4,4);ctx.restore();
  });
  if(actor.strike){
    const strike=actor.strike,weaponName=strike.weaponName||'',sx=left+(actor.x-cameraX+.5)*tile,sy=top+(actor.y-cameraY+.45)*tile;
    adventureArt.hitParticles(ctx,strike,view);
    ctx.save();ctx.globalAlpha=Math.min(1,strike.life/.18);
    if(strike.kind==='lightning'){
      let x0=sx,y0=sy;
      strike.targets.forEach(target=>{const x1=left+(target.x-cameraX+.5)*tile,y1=top+(target.y-cameraY+.55)*tile;ctx.strokeStyle='#a9edff';ctx.lineWidth=strike.comboStage===3?5:3;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo((x0+x1)/2+3,(y0+y1)/2-4);ctx.lineTo(x1,y1);ctx.stroke();ctx.fillStyle='#e7ffff';ctx.fillRect(x1-2,y1-2,4,4);x0=x1;y0=y1;});
    }else if(strike.kind==='pulse'){
      const target=strike.targets[strike.targets.length-1];
      if(target){const tx=left+(target.x-cameraX+.5)*tile,ty=top+(target.y-cameraY+.55)*tile;ctx.strokeStyle='#d4ffff';ctx.lineWidth=strike.comboStage===3?8:5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tx,ty);ctx.stroke();ctx.strokeStyle='#49d7f2';ctx.lineWidth=strike.comboStage===3?3:2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tx,ty);ctx.stroke();strike.targets.forEach((hit,index)=>{const hx=left+(hit.x-cameraX+.5)*tile,hy=top+(hit.y-cameraY+.55)*tile;ctx.fillStyle=index===0?'#fff5c5':'#73eaff';ctx.fillRect(hx-3,hy-3,6,6);});if(strike.targets.length>1)text((strike.comboStage===3?'过载贯穿 ×':'贯穿 ×')+strike.targets.length,tx,ty-tile*.4,9,'#b8f7ff','center');}
    }else if(strike.kind==='saber'){
      const angle=strike.angle??Math.atan2(actor.facingY,actor.facingX),end=strike.targets[strike.targets.length-1],reach=end?Math.min(tile*2.1,Math.hypot(end.x-actor.x,end.y-actor.y)*tile):tile*.8,ex=sx+Math.cos(angle)*reach,ey=sy+Math.sin(angle)*reach;
      ctx.strokeStyle='#d9ffff';ctx.lineWidth=strike.comboStage===3?11:8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='#54e5f3';ctx.lineWidth=strike.comboStage===3?4:3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();if(strike.comboStage===3){ctx.fillStyle='#fff3ad';ctx.fillRect(ex-3,ey-3,6,6);}
      for(let i=0;i<3;i++){const p=(i+1)/4;ctx.fillStyle=i%2?'#de9ff2':'#eaffff';ctx.fillRect(Math.round(sx+(ex-sx)*p),Math.round(sy+(ey-sy)*p)-2,3,3);}
    }else if(strike.kind==='cleave'){
      const angle=strike.angle??Math.atan2(actor.facingY,actor.facingX),cold=weaponName.includes('冷光短刃'),club=weaponName.includes('短棍'),hall=weaponName.includes('礼堂');
      const outer=cold?'#a8f8ff':hall?'#ffbd74':club?'#f1c276':'#fff0c4',inner=cold?'#55d8ed':hall?'#ed794e':club?'#b68045':'#e3a858';
      ctx.strokeStyle=outer;ctx.lineWidth=strike.comboStage===3?14:cold?7:9;ctx.beginPath();ctx.arc(sx,sy,tile*(club?1.02:.95),angle-1.35,angle+1.35);ctx.stroke();ctx.strokeStyle=inner;ctx.lineWidth=strike.comboStage===3?4:3;ctx.beginPath();ctx.arc(sx,sy,tile*(club?1.02:.95),angle-1.35,angle+1.35);ctx.stroke();
      strike.targets.forEach((target,index)=>{const tx=left+(target.x-cameraX+.5)*tile,ty=top+(target.y-cameraY+.55)*tile;if(cold){ctx.fillStyle=index%2?'#8beeff':'#eaffff';ctx.fillRect(tx-5,ty-4,3,3);ctx.fillRect(tx+3,ty+2,3,3);}else if(club||hall){ctx.fillStyle=hall?'#ffd27b':'#ffe1a0';ctx.fillRect(tx-4,ty-4,3,3);ctx.fillRect(tx+3,ty-1,3,3);ctx.fillRect(tx-1,ty+4,3,3);}});
    }else{
      const angle=strike.angle??Math.atan2(actor.facingY,actor.facingX),target=strike.targets[0],tx=target?left+(target.x-cameraX+.5)*tile:sx,ty=target?top+(target.y-cameraY+.55)*tile:sy;
      ctx.strokeStyle='#fff6d8';ctx.lineWidth=strike.comboStage===3?10:7;ctx.beginPath();ctx.arc(sx,sy,tile*.7,angle-.74,angle+.74);ctx.stroke();ctx.strokeStyle=weaponName.includes('礼堂')?'#e77d54':'#91c5ef';ctx.lineWidth=strike.comboStage===3?4:3;ctx.beginPath();ctx.arc(sx,sy,tile*.7,angle-.74,angle+.74);ctx.stroke();
      ctx.fillStyle='#fff4c2';ctx.fillRect(tx-2,ty-2,4,4);ctx.fillStyle='#b8eaff';ctx.fillRect(tx-6,ty-1,3,2);ctx.fillRect(tx+4,ty+2,3,2);
      if(strike.comboStage===3){ctx.fillStyle='#ffe08a';ctx.fillRect(tx-7,ty-6,3,3);ctx.fillRect(tx+5,ty-7,3,3);ctx.fillRect(tx-2,ty+6,4,3);}
    }
    strike.targets.forEach(target=>{const damageColor=strike.kind==='lightning'||strike.kind==='pulse'?'#c2f5ff':strike.kind==='saber'||weaponName.includes('冷光短刃')?'#b7fbff':'#ffe0a5';text('-'+target.damage,left+(target.x-cameraX+.5)*tile,top+(target.y-cameraY+.1)*tile-(.24-strike.life)*20,12,damageColor,'center');});
    ctx.restore();
  }
  for(const follower of actor.followers||[]){
    const fx=left+(follower.x-cameraX+.5)*tile,fy=top+(follower.y-cameraY+.9)*tile;
    const pose=follower.clock>1.76?(follower.id==='tang'?'cast':'attack'):follower.moving?'walk':'idle';
    heroPixels.draw(ctx,follower.id,fx,fy,{scale:tile/40,pose,time:now,facing:follower.facing||1});
    text(follower.id==='ao'?'敖犬':'唐卵',fx,fy-tile*1.17,9,C.mint,'center');
  }
  if(actor.followerStrike){
    const strike=actor.followerStrike;
    const sx=left+(strike.from.x-cameraX+.5)*tile,sy=top+(strike.from.y-cameraY+.45)*tile;
    const tx=left+(strike.to.x-cameraX+.5)*tile,ty=top+(strike.to.y-cameraY+.55)*tile;
    const arc=Math.atan2(ty-sy,tx-sx);
    ctx.save();ctx.globalAlpha=Math.min(1,strike.life/.2);
    ctx.beginPath();
    if(strike.id==='ao'){
      ctx.strokeStyle='#e1b67b';ctx.lineWidth=3;
      ctx.arc(sx,sy,tile*.73,arc-.88,arc+.88);
    }else{
      ctx.strokeStyle='#a5e4f5';ctx.lineWidth=2;
      ctx.moveTo(sx,sy);
      ctx.lineTo(sx+(tx-sx)*.36+3,sy+(ty-sy)*.36-4);
      ctx.lineTo(sx+(tx-sx)*.63-3,sy+(ty-sy)*.63+4);
      ctx.lineTo(tx,ty);
    }
    ctx.stroke();
    text('-'+strike.damage,tx,ty-tile*.45,10,C.mint,'center');
    ctx.restore();
  }
  const hx=left+(actor.x-cameraX+.5)*tile,hy=top+(actor.y-cameraY+.9)*tile;
  const riderY=hy-(a.mounted?tile*.2:0);
  if(actionInput.attack&&Math.hypot(actionInput.aimX,actionInput.aimY)>.35){ctx.save();ctx.globalAlpha=.62;ctx.strokeStyle=['lightning','pulse','saber'].includes(a.weaponKind)?'#a9edff':'#f4d28e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx,riderY-tile*.48);ctx.lineTo(hx+actionInput.aimX*tile*.9,riderY-tile*.48+actionInput.aimY*tile*.9);ctx.stroke();ctx.restore();}
  const attacking=actor.slash>0;
  const manualAim=Math.hypot(actionInput.aimX,actionInput.aimY)>.35;
  const aimAngle=attacking?(actor.strike?.angle??(manualAim?Math.atan2(actionInput.aimY,actionInput.aimX):undefined)):undefined;
  const facingX=Number.isFinite(aimAngle)&&Math.abs(Math.cos(aimAngle))>.12?Math.cos(aimAngle):actor.facingX;
  const facing=facingX<0?-1:1;
  if(a.mounted)mountPixels(hx,hy,tile,facing);
  heroPixels.draw(ctx,'csy',hx+(actor.hurtClock>0?Math.sin(now*55)*2:0),riderY,{
    scale:tile/37,pose:attacking?'attack':Math.hypot(actionInput.x,actionInput.y)>.08?'walk':'idle',
    time:now,facing,hit:actor.hurtClock>.3,weapon:a.weapon||'',unarmed:!a.weapon,
    attackPhase:Math.max(0,Math.min(1,1-actor.slash/.2)),comboStage:actor.strike?.comboStage||1,aimAngle
  });
  if(actor.comboNotice>0){ctx.save();ctx.globalAlpha=Math.min(1,actor.comboNotice/.2);if(actor.comboStage===3){ctx.fillStyle='rgba(255,218,127,.2)';ctx.fillRect(hx-tile*.62,hy-tile*1.9,tile*1.24,tile*.42);}text(actor.comboLabel,hx,hy-tile*1.72,actor.comboStage===3?13:11,actor.comboStage===3?C.gold:C.white,'center');ctx.restore();}
  if(actor.damagePopup)text(actor.damagePopup.amount?'-'+actor.damagePopup.amount:'挡',hx,hy-tile*1.2-(.7-actor.damagePopup.life)*15,13,C.red,'center');
  if(actor.slash>0&&!actor.strike&&!['lightning','pulse','saber','cleave'].includes(a.weaponKind)){ctx.save();const angle=Math.atan2(actor.facingY,actor.facingX),cy=riderY-tile*.45;ctx.strokeStyle='#fff0c4';ctx.lineWidth=7;ctx.beginPath();ctx.arc(hx,cy,tile*.7,angle-.82,angle+.82);ctx.stroke();ctx.strokeStyle=C.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(hx,cy,tile*.7,angle-.82,angle+.82);ctx.stroke();ctx.restore();}
  ctx.restore();
  const miniY=top+tile*9+9,miniSize=Math.min(78,Math.floor(78/map.length)*map.length),unit=miniSize/map.length,miniX=390-18-miniSize;
  adventureArt.frame(ctx,miniX-5,miniY-5,miniSize+10,miniSize+10,theme);
  const miniColor=cell=>cell==='#'?(warm?'#80674e':'#71899a'):cell==='C'?'#b7d7df':cell==='P'?'#ffe08a':cell==='G'?'#d29e5d':cell==='d'?(warm?'#c39a5d':'#9bb8c7'):cell==='t'?(warm?'#e3bc72':'#e6a96e'):cell==='n'||cell==='q'?'#84c8b3':cell==='k'?(warm?'#f2ca6f':'#ded7a0'):cell==='g'?(warm?'#c99a5e':'#a9a27c'):cell==='p'?'#82dfba':cell==='s'?(warm?'#e6c783':'#9ed9f2'):cell==='f'?'#f5a85c':cell==='L'?'#d9e9ee':cell==='o'||cell==='r'?'#efcf87':cell==='E'?(a.power==='classroom'?'#f0c978':'#627681'):cell==='v'?(a.maintenanceOpen?'#9cd1ac':'#64737b'):cell==='b'?'#f27f75':cell==='x'?'#9de8ac':(warm?'#5d4b3b':'#3b5264');
  map.forEach((row,y)=>row.forEach((cell,x)=>{if(seen[y][x])box(miniX+x*unit,miniY+y*unit,unit,unit,miniColor(cell));}));
  actor.enemies[a.floor].forEach(enemy=>{const x=Math.round(enemy.x),y=Math.round(enemy.y);if(enemy.hp>0&&seen[y]&&seen[y][x])box(miniX+x*unit,miniY+y*unit,Math.max(3,unit),Math.max(3,unit),C.red);});
  box(miniX+actor.x*unit,miniY+actor.y*unit,Math.max(3,unit),Math.max(3,unit),C.white);
  text('小地图 · '+adventure.regionName(a),18,miniY+13,11,theme.muted);text('金币 '+a.gold,18,miniY+32,12,theme.accent);text('武器：'+(a.weapon||'徒手')+(a.weaponSlots&&a.weaponSlots.filter(Boolean).length===2?' · 可切换':''),18,miniY+51,10,C.white);
  const gearY=miniY+miniSize+8;
  adventureArt.frame(ctx,18,gearY,354,48,theme);
  const mountLocked=!a.mountUnlocked,mountBusy=Boolean(actor.inCombat),mountLabel=mountLocked?'待解锁':mountBusy?'战斗中':a.mounted?'下坐骑':'骑乘 +60%';
  button(mountLabel,23,gearY+9,76,30,()=>{if(adventure.toggleMount(a))saveAdventure();},a.mounted);
  for(let i=0;i<2;i++){const item=a.weaponSlots&&a.weaponSlots[i],active=a.activeWeapon===i,sx=106+i*126,icon=item&&item.kind==='lightning'?'magic':item&&item.kind==='pulse'?'pulse':'sword',iconColor=item&&['lightning','pulse','saber'].includes(item.kind)?'#a9edff':theme.accent,style=item?weaponInfo(item.kind).slot+' · 攻+'+item.attack:'拾取武器可装备';box(sx,gearY+5,116,37,item&&active?theme.selected:theme.panel,item&&active?theme.accent:theme.edge);pixelArt.icon(ctx,icon,sx+7,gearY+12,22,iconColor);text((i+1)+' '+(item?item.name:'空槽'),sx+35,gearY+17,10,C.white);text(style,sx+35,gearY+31,9,theme.muted);}
  const controlY=Math.max(gearY+56,H-235),joyY=H-100;
  const reviveNotice=a.reviveNoticeUntil>Date.now();text(reviveNotice?'已复活 · 返回'+a.reviveLocation:'当前目标 · '+adventure.objective(a),195,controlY,12,reviveNotice?C.mint:theme.accent,'center');
  const chargingEnemy=actor.enemies[a.floor].some(e=>e.hp>0&&e.warning&&(e.behavior==='charge'||e.behavior==='warden'));
  if(chargingEnemy)text('冲锋锁定方向了！横移躲开',195,controlY-16,11,C.red,'center');
  button('返回',14,controlY+16,68,34,()=>{saveAdventure();home();});
  button('重开',88,controlY+16,68,34,()=>wx.showModal({title:'重新开始本章？',content:'当前剧情进度将从头开始。',success:r=>{if(r.confirm){adventureSaveBlocked=false;adventureHintStep=0;adventureState=adventure.start();adventureAction.prepare(adventureState);clearActionInput();saveAdventure();}}}));
  button(a.routeChoicePending?'选路线':'提示',162,controlY+16,68,34,()=>{clearActionInput();if(a.routeChoicePending){a.routeChoicePending=false;a.routeChoiceOpen=true;}else{a.message=adventure.hint(a,adventureHintStep>0);adventureHintStep++;}});
  button('切武器',236,controlY+16,70,34,()=>{if(adventure.switchWeapon(a))saveAdventure();},Boolean(a.weaponSlots&&a.weaponSlots.filter(Boolean).length===2));
  text(adventureSaveBlocked?'存档异常':a.saveError?'存档失败':'自动保存',375,controlY+34,10,adventureSaveBlocked||a.saveError?C.red:C.muted,'right');
  adventureArt.control(ctx,76,joyY,48,theme,actionInput.x*20,actionInput.y*20,actionInput.moveId!==null);
  text('移动',76,joyY+63,11,C.muted,'center');
  adventureArt.control(ctx,312,joyY,43,theme,actionInput.aimX*19,actionInput.aimY*19,Boolean(nearby||actionInput.attack));
  const attackIcon=a.weaponKind==='lightning'?'magic':a.weaponKind==='pulse'?'pulse':'sword',attackColor=['lightning','pulse','saber'].includes(a.weaponKind)?'#c2f5ff':theme.accent;
  const promptIcon=nearby?(nearby.type==='weapon'?'sword':nearby.type==='power'?'magic':'shield'):attackIcon;
  pixelArt.icon(ctx,promptIcon,300+actionInput.aimX*19,joyY-12+actionInput.aimY*19,24,nearby?C.white:attackColor);text(nearby?nearby.label:actor.comboStage?'连招 '+actor.comboStage+'/3':'瞄准/连击',312,joyY+56,11,theme.muted,'center');
  if(actor.mountNotice>0)text(a.mounted?'灰耳加速中':'进入战斗，灰耳已退到一旁',195,joyY-71,11,a.mounted?C.mint:theme.accent,'center');
  if(a.message||a.pending||a.pendingWeapon||a.shopOpen||a.echoPuzzleOpen||a.powerPanelOpen||a.routeChoiceOpen||a.postBossOpen){
    buttons=[];box(0,0,390,H,'rgba(6,13,20,.75)');
    const panelHeight=a.echoPuzzleOpen?270:a.powerPanelOpen?258:a.routeChoiceOpen||a.postBossOpen?258:a.pendingWeapon?220:a.defeated?226:188;
    const y=Math.max(safe+78,Math.min(H-panelHeight-18,top+tile*2));
    adventureArt.frame(ctx,23,y,344,panelHeight,theme);
    if(a.routeChoiceOpen){
      text('敖犬 · 选一条路',42,y+29,16,theme.accent);
      text('两边都会通向同一个首领，敌人和装备不同。',42,y+57,11,C.white);
      button('西·储物间窄道',42,y+83,304,48,()=>{if(adventure.chooseDormRoute(a,'storage')){adventureAction.prepare(a,true);saveAdventure();}},false);
      text('冲锋手 · 扇面床板短棍',195,y+142,10,theme.muted,'center');
      button('东·盥洗区',42,y+163,304,44,()=>{if(adventure.chooseDormRoute(a,'wash')){adventureAction.prepare(a,true);saveAdventure();}},false);
      text('柜台掩体 · 练习剑 + 药水',195,y+220,10,theme.muted,'center');
    }else if(a.postBossOpen){
      text('611 的灯亮了 · 合照碎片已收好',42,y+30,15,theme.accent);
      text('敖犬：红星把下一块带去教学楼了。',42,y+61,12,C.white);
      text('带着现有装备继续剧情，或换另一条路线再战。',42,y+83,10,theme.muted);
      button('下一关 · 封锁教学楼',42,y+108,304,47,()=>{if(adventure.nextFloor(a)){adventureAction.prepare(a,true);clearActionInput();saveAdventure();}},true);
      const other=a.pathChoice==='storage'?'wash':'storage',otherName=other==='storage'?'西侧储物间':'东侧盥洗区';
      button('重玩另一条路 · '+otherName,42,y+171,304,42,()=>{if(adventure.chooseDormRoute(a,other)){adventureAction.prepare(a,true);clearActionInput();saveAdventure();}},false);
    }else if(a.echoPuzzleOpen){
      text('611 · 回忆归位',42,y+28,15,theme.accent);
      text('照片里，熄灯前该把哪件旧物挂回床头？',42,y+56,12,C.white);
      const echoHint=a.echoHint===0?'留意窗边床头的挂物板。':a.echoHint===1?'合照里有人把一件细长旧物挂回板上。':'选出照片里那件旧物：旧练习剑。';
      text(a.echoError||echoHint,42,y+77,10,a.echoError?C.gold:theme.muted);
      button('旧练习剑',42,y+96,304,38,()=>{adventure.answerEcho(a,'sword');saveAdventure();},true);
      button('台灯',42,y+142,146,36,()=>{adventure.answerEcho(a,'lamp');saveAdventure();},false);
      button('搪瓷杯',200,y+142,146,36,()=>{adventure.answerEcho(a,'cup');saveAdventure();},false);
      text('解开抽屉可拿到寝室钥匙、护盾和短棍。',195,y+190,9,theme.muted,'center');
      button(a.echoHint>=3?'提示已用完':'提示 '+(a.echoHint+1)+'/3',42,y+207,146,35,()=>{a.echoHint=Math.min(3,a.echoHint+1);saveAdventure();});
      button('先离开',200,y+207,146,35,()=>{adventure.closeEcho(a);saveAdventure();});
    }else if(a.powerPanelOpen){
      text('走廊配电 · 选择供电区域',42,y+28,15,theme.accent);
      text(a.fuseInstalled?'保险丝已接入。先供旧教室，维修通道会永久打开。':'配电箱缺少保险丝。',42,y+53,11,C.white);
      text('当前：'+({off:'未供电',classroom:'旧教室',hall:'礼堂'}[a.power]||'未供电'),42,y+74,10,theme.muted);
      button(a.power==='classroom'?'旧教室 · 已供电':'旧教室供电',42,y+89,304,39,()=>{if(adventure.selectPower(a,'classroom'))saveAdventure();},a.power==='classroom');
      button(a.power==='hall'?'礼堂 · 已供电':'切换到礼堂',42,y+138,304,39,()=>{if(adventure.selectPower(a,'hall'))saveAdventure();},a.power==='hall');
      text(a.powerError||(a.maintenanceOpen?'下方维修通道已永久接通。':'礼堂供电需先启动旧教室线路。'),195,y+193,10,a.powerError?C.gold:theme.muted,'center');
      button('关闭',115,y+210,160,35,()=>{adventure.closePower(a);saveAdventure();});
    }else if(!a.pendingWeapon&&!a.shopOpen&&!a.pending)text('611 · 对话',346,y+17,10,theme.accent,'right');
    else text(a.pendingWeapon?'战利品':a.shopOpen?'补给站':'遭遇战',42,y+17,10,theme.accent);
    if(a.routeChoiceOpen||a.postBossOpen||a.echoPuzzleOpen||a.powerPanelOpen){
      // The custom puzzle panels above own their complete overlay state.
    }else if(a.pendingWeapon){
      const w=a.pendingWeapon.weapon,info=weaponInfo(w.kind);
      text('发现 '+w.name,42,y+25,16,C.gold);text(info.slot+' · 射程 '+info.range+' · 攻击 +'+w.attack,42,y+49,10,C.white);
      text(info.detail,42,y+70,10,C.muted);text('选择放入的位置，原武器会留在地上',42,y+91,10,C.muted);
      for(let i=0;i<2;i++){const held=a.weaponSlots[i];text((i+1)+'号：'+(held?held.name:'空位'),i?216:42,y+108,10,C.white);button('放入 '+(i+1)+' 号',i?216:42,y+121,132,33,()=>{if(adventure.chooseWeapon(a,i)){rememberWeapon(w);saveAdventure();}},true);}
      button('暂不拾取',115,y+164,160,35,()=>{adventure.leaveWeapon(a);saveAdventure();});
    }else if(a.shopOpen){
      text('611 小卖部 · 金币 '+a.gold,42,y+27,15,C.gold);
      text(a.shopMessage||'选择一件补给',42,y+53,11,C.muted);
      button(a.purchases.potion?'药水已购买':'药水 3金',42,y+72,128,42,()=>{adventure.buy(a,'potion');saveAdventure();});
      button(a.purchases.training?'训练已购买':'训练 5金',218,y+72,128,42,()=>{adventure.buy(a,'training');saveAdventure();});
      button('离开商店',115,y+130,160,42,()=>{a.shopOpen=false;saveAdventure();},true);
    }else if(a.pending){
      text(a.pending.enemy,42,y+30,17,C.gold);
      text(a.pending.loss===null?'攻击不足，无法击败':a.pending.loss>=a.hp?'预计损失 '+a.pending.loss+' 生命，当前无法安全获胜':'预计损失 '+a.pending.loss+' 生命',42,y+62,13,C.white);
      if(a.pending.stats)text('敌方 生命 '+a.pending.stats.hp+' · 攻 '+a.pending.stats.attack+' · 防 '+a.pending.stats.defense,42,y+87,12,C.muted);
      text('当前生命 '+Math.ceil(a.hp)+(a.pending.absorbed?' · 护盾抵挡 '+a.pending.absorbed:''),42,y+108,11,a.pending.absorbed?C.mint:C.muted);
      button('撤退',42,y+123,128,42,()=>{adventure.resolve(a,false);saveAdventure();});
      button('战斗',218,y+123,128,42,()=>{adventure.resolve(a,true);saveAdventure();},true);
    }else{
      const lines=[];a.message.split('\n').forEach(line=>{if(!line)lines.push('');else for(let i=0;i<line.length;i+=22)lines.push(line.slice(i,i+22));});
      const pages=Math.max(1,Math.ceil(lines.length/4));adventureDialoguePage=Math.min(adventureDialoguePage,pages-1);
      lines.slice(adventureDialoguePage*4,adventureDialoguePage*4+4).forEach((line,i)=>text(line,42,y+43+i*17,12,C.white));
      if(pages>1)text((adventureDialoguePage+1)+' / '+pages,346,y+112,10,C.muted,'right');
      if(adventureDialoguePage<pages-1)button('下一页',115,y+130,160,42,()=>{adventureDialoguePage++;},true);
      else if(a.defeated){
        text('复活返回：'+adventure.checkpointName(a),42,y+103,10,theme.accent);
        text('敌人重置 · 金币-25% · 恢复75%生命',42,y+118,9,C.white);
        text('装备、路线与已完成机关保留',42,y+132,9,C.muted);
        button('本层复活',42,y+150,128,42,reviveAdventure,true);
        button('重开整章',218,y+150,128,42,()=>wx.showModal({title:'重新开始剧情？',content:'当前剧情进度将从第一关开始。',success:r=>{if(r.confirm){adventureSaveBlocked=false;adventureHintStep=0;adventureState=adventure.start();adventureAction.prepare(adventureState,true);clearActionInput();saveAdventure();}}}));
      }else if(a.completed){button('返回首页',42,y+130,128,42,()=>{saveAdventure();home();});button('重玩剧情',218,y+130,128,42,()=>wx.showModal({title:'重新开始剧情？',content:'当前剧情进度将从第一关开始。',success:r=>{if(r.confirm){adventureState=adventure.start();adventureAction.prepare(adventureState,true);saveAdventure();}}}),true);}
      else button('继续',115,y+130,160,42,()=>{a.message='';if(a.routeChoicePending){a.routeChoicePending=false;a.routeChoiceOpen=true;}saveAdventure();},true);
    }
  }
}
function mini(){
  const y=safe+54,skin=battleSkin();
  laneArt.frame(ctx,12,y-12,160,25,skin);
  text('基地',21,y,11,C.muted);
  bar(52,y-3,75,6,state.base/state.maxBase,state.base<30?C.red:C.mint);
  text(Math.ceil(state.base),160,y,11,C.white,'right');
  for(let i=0;i<3;i++){
    const lane=state.lanes[i],x=200+i*60,urgent=state.rescue?.active?.lane===i;
    const marked=urgent||lane.lost;
    laneArt.frame(ctx,x,y-12,54,25,marked?{...skin,panel:'#4c292f',edge:'#aa625b'}:skin,
      !marked&&state.location==='lane'&&state.lane===i);
    text((urgent?'! ':'')+['上','中','下'][i]+' '+(lane.lost?'失守':lane.hp),x+27,y,10,marked||lane.hp<=3?C.red:C.white,'center');
    buttons.push({x,y:y-12,w:54,h:25,fn:()=>{if(state.mode==='rescue')G.move(state,'lane',i);else panel='map';}});
  }
  if(state.rescue?.active){
    const laneName=['上路','中路','下路'][state.rescue.active.lane];
    text('破门警报 · '+laneName+'蓄力时按援护',195,y+21,10,C.red,'center');
  }
}
function pixelUnit(id,x,y,size,star){const pose=state&&state.effects.some(e=>e.kind==='shot'&&e.id===id&&e.life>.1)?'attack':'idle';heroPixels.draw(ctx,id,x,y+size*.48,{scale:size/40,pose,time:state?state.time:0});
  if(star>1)text('★'.repeat(star),x,y-size*.75,8,C.gold,'center');}
function cardIcon(c,x,y,w,h,slotFn,selected){
  const skin=battleSkin();
  const glow=c&&state.effects.some(e=>e.uid===c.uid&&(e.kind==='merge'||e.kind==='buy'||e.kind==='deploy'));
  laneArt.frame(ctx,x,y,w,h,skin,Boolean(glow||selected));
  if(c){
    const d=G.BY_ID[c.id];
    pixelUnit(c.id,x+w/2,y+13,18,1);
    text(d.name,x+w/2,y+28,9,C.white,'center');
    text('★'.repeat(c.star),x+w/2,y+h-5,8,skin.accent,'center');
  }else text('+',x+w/2,y+h/2,16,C.muted,'center');
  buttons.push({x,y,w,h,fn:slotFn});
}
function bossPanel(top,ah){
  const b=state.boss,plan=CHAPTERS[state.chapter].boss,y=top+26;
  const adds=b.adds.filter(add=>add.hp>0),airborne=state.chapter==='tower'&&b.phase===1;
  const warning=b.hp>0&&b.cast<2&&(!adds.length||airborne);
  const impact=(state.time-b.slamAt)/.32,slam=impact>=0&&impact<1;
  const panelHeight=adds.length?(b.ritual>0?149:113):68;
  laneArt.frame(ctx,63,y,264,panelHeight,battleSkin(),warning);
  sprites.boss(ctx,80,y+46,64,state.time,plan.kind,{warning,hit:recentHit(b),slam,defeated:b.hp<=0,airborne,enraged:b.phase===3});
  text(b.hp>0?plan.name+' · '+plan.stages[b.phase]:plan.name+' 已击败',220,y+16,13,C.white,'center');
  bar(123,y+36,205,9,b.hp/b.max,adds.length?'#ad94bd':C.red);
  const protectedText=b.interruptedAt!==undefined?'复苏已打断 · 清理随从':'首领受保护 · 优先清理随从';
  const subtitle=b.hp<=0?'留意路上残余怪物':warning?(airborne?'灼光即将扫过高地！':'首领即将猛击！'):adds.length?protectedText:'全员回高地！';
  text(subtitle,220,y+58,11,warning?C.red:C.gold,'center');
  if(b.phase===1)b.adds.forEach((add,i)=>{
    const x=72+i*125;
    laneArt.frame(ctx,x,y+65,120,39,battleSkin());
    if(add.hp>0){
      sprites.boss(ctx,x+16,y+84,26,state.time,add.kind,{warning:add.kind==='cleric'&&b.ritual>0,hit:recentHit(add)});
      text(add.name,x+76,y+78,10,C.white,'center');
      bar(x+38,y+89,72,5,add.hp/add.max,C.red);
    }else text(add.name+'已击倒',x+60,y+84,10,C.muted,'center');
  });
  if(b.ritual>0){
    text('复苏读条 '+b.ritual.toFixed(1)+' 秒',74,y+127,11,C.gold);
    if(G.canInterruptBoss(state))button('打断复苏',226,y+114,88,26,()=>G.interruptBoss(state),true);
    else text('岩之灵等控制伙伴可打断',306,y+127,10,C.muted,'right');
  }
  if(slam){
    ctx.save();ctx.globalAlpha=1-impact;
    for(let i=-5;i<=5;i++)box(193+i*(7+impact*5),top+ah-55+Math.abs(i%2)*3,6,2,airborne?'#ef966e':C.gold);
    ctx.restore();
  }
}
function highGround(top,ah){
  const b=state.boss,plan=b?CHAPTERS[state.chapter].boss:null;
  const skin=battleSkin(),bossX=195,bossY=top+Math.max(65,ah*.37);
  const addsY=bossY+Math.min(45,ah*.16);
  laneArt.highGround(ctx,{x:12,y:top,w:366,h:ah,chapter:state.chapter,mode:state.mode,time:state.time,boss:Boolean(b)});
  text('611 高地',195,top+ah-34,11,skin.accent,'center');
  if(b){
    laneArt.frame(ctx,31,top+8,328,34,skin);
    text(b.hp>0?plan.name+' · '+plan.stages[b.phase]:plan.name+' 已击败',195,top+17,11,C.white,'center');
    bar(64,top+27,262,6,b.hp/b.max,C.red);
    const adds=b.adds.filter(add=>add.hp>0),warning=b.hp>0&&b.cast<2,hit=recentHit(b);
    const elapsed=state.time-b.slamAt;
    ctx.save();ctx.beginPath();ctx.rect(20,top+43,350,ah-49);ctx.clip();
    laneArt.bossCue(ctx,bossX,bossY+Math.min(28,ah*.16),Math.min(68,ah*.22),warning?b.cast:Infinity,elapsed);
    ctx.restore();
    sprites.boss(ctx,bossX,bossY,Math.min(116,ah*.30),state.time,plan.kind,{warning,hit,slam:elapsed>=0&&elapsed<.18,defeated:b.hp<=0,airborne:state.chapter==='tower'&&b.phase===1,enraged:b.phase===3});
    if(state.mode==='rescue')state.effects.filter(e=>e.kind==='rescue-break'&&e.boss).forEach(e=>{ctx.save();ctx.globalAlpha=Math.min(1,e.life/e.duration);ctx.strokeStyle=C.gold;ctx.lineWidth=4;ctx.beginPath();ctx.arc(bossX,bossY,24+(1-e.life/e.duration)*48,0,Math.PI*2);ctx.stroke();text('打断！',bossX,bossY-55,14,C.gold,'center');ctx.restore();});
    if(warning&&b.ritual<=0)text('首领蓄力 '+Math.max(0,b.cast).toFixed(1)+'秒',195,top+52,11,C.red,'center');
    adds.forEach((add,i)=>{const x=117+i*156,y=addsY;sprites.boss(ctx,x,y,30,state.time,add.kind,{hit:recentHit(add),warning:add.kind==='cleric'&&b.ritual>0});bar(x-20,y+16,40,4,add.hp/add.max,C.red);text(add.name,x,y+25,9,C.white,'center');});
    if(b.ritual>0){text('复苏读条 '+b.ritual.toFixed(1)+'秒',73,top+60,11,C.gold);if(G.canInterruptBoss(state))button('打断复苏',257,top+48,94,26,()=>G.interruptBoss(state),true);}
    else if(adds.length&&!warning)text('先击倒随从，首领受到保护',195,top+52,11,C.gold,'center');
  }else text('已回到 611 高地 · 可从地图重新出发',195,top+35,12,C.gold,'center');
  const highPoint=(lane,p)=>({x:90+lane*105,y:top+ah*(.45+.2*Math.min(1,Math.max(0,(p-.7)/.3)))});
  state.lanes.forEach((lane,i)=>lane.monsters.filter(m=>m.hp>0&&m.p>=.7).slice(-8).forEach(m=>{const pos=highPoint(i,m.p);sprites.enemy(ctx,m.type,pos.x,pos.y,20,state.time,{hit:recentHit(m),theme:state.chapter});bar(pos.x-9,pos.y-14,18,3,m.hp/m.max,C.red);}));
  state.effects.filter(e=>e.kind==='high-shot').forEach(e=>{const pos=highPoint(e.lane,e.p);ctx.save();ctx.globalAlpha=Math.min(1,e.life/.2);ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(195,top+ah*.73);ctx.lineTo(pos.x,pos.y);ctx.stroke();text('-'+e.amount,pos.x,pos.y-22,11,C.gold,'center');ctx.restore();});
  const cards=state.board.filter(Boolean),teamY=top+ah*.75;
  cards.forEach((c,i)=>{const x=195+(i-(cards.length-1)/2)*39,y=teamY+(i%2)*13;
    if(b&&b.hp>0&&c.hp>0&&(recentHit(b)||b.adds.some(add=>recentHit(add)))){ctx.save();ctx.strokeStyle=heroFx.ink(c.id);ctx.globalAlpha=.7;ctx.lineWidth=2;ctx.beginPath();const liveAdds=b.adds.filter(add=>add.hp>0),hitIndex=liveAdds.findIndex(add=>recentHit(add)),targetX=hitIndex>=0?117+hitIndex*156:bossX,targetY=hitIndex>=0?addsY:bossY+10;ctx.moveTo(x,y-8);ctx.lineTo(targetX,targetY);ctx.stroke();ctx.restore();}
    ctx.save();if(c.hp<=0)ctx.globalAlpha=.35;heroPixels.draw(ctx,c.id,x,y,{scale:.72,pose:b&&b.hp>0&&c.hp>0&&recentHit(b)?'attack':'idle',time:state.time});ctx.restore();
    bar(x-11,y+4,22,3,c.hp/c.maxHp,c.hp<c.maxHp*.35?C.red:C.mint);if(c.hp<=0)text('×',x,y-15,14,C.red,'center');
  });
  if(!cards.length)text('上阵伙伴后将在高地集结',195,teamY,11,C.muted,'center');
  if(b&&b.hp<=0)text('清理剩余怪物，守住基地',195,top+ah-20,11,C.gold,'center');
}
function arena(){const top=safe+88,bottom=Math.max(top+140,H-(state.mode==='rescue'?250:345)),ah=bottom-top;
  if(state.location==='high'){highGround(top,ah);return;}
  const skin=battleSkin(),focus=state.lane;
  const lanes=laneArt.arena(ctx,{x:12,y:top,w:366,h:ah,focus,time:state.time,
    chapter:state.chapter,mode:state.mode,wave:state.wave,lost:state.lanes.map(l=>l.lost),alertLane:state.rescue?.active?.lane});
  for(let i=0;i<3;i++){const l=state.lanes[i],visualLane=lanes[i],left=visualLane.x,w=visualLane.w,isPlayer=i===state.lane&&state.location==='lane'&&!l.lost;
    text(['上路','中路','下路'][i]+(isPlayer?' · 我':''),left+w/2,top+12,11,i===focus?skin.accent:C.muted,'center');
    const routeTop=visualLane.y,routeHeight=Math.max(30,visualLane.h);
    const laneFx=state.effects.filter(e=>e.lane===i);
    const worldPoint=point=>({x:left+w*point.x,y:routeTop+Math.max(0,Math.min(1,point.p))*routeHeight});
    const monsterPoint=(id,p)=>worldPoint({x:G.enemyX(id),p});
    const slotPoint=slot=>worldPoint(G.formationPoint(slot));
    const unitSize=Math.max(20,Math.min(32,(ah-100)/5));
    l.monsters.forEach(m=>{
      const {x,y}=monsterPoint(m.id,m.p);
      const attack=Math.max(0,(m.hitClock-1.15)/.25);
      const casting=m.healAt>state.time;
      sprites.enemy(ctx,m.type,x,y,i===focus?20:15,state.time,{hit:recentHit(m),attack,casting,theme:state.chapter});
      bar(x-9,y-13,18,2,m.hp/m.max,C.mint);
      if(m.rescueThreat){box(x-23,y-31,46,13,m.casting?'#a83540':'#723c42',C.red);text(m.casting?'蓄力！':'破门怪',x,y-24,9,C.white,'center');if(m.casting)bar(x-18,y-36,36,3,(m.castUntil-state.time)/6,C.red);}
      if(casting)bar(x-9,y-17,18,2,1-(m.healAt-state.time)/1.8,C.gold);
      if(m.slow>0){box(x-6,y+8,3,2,'#afe9ff');box(x+4,y+9,3,2,'#afe9ff');}
      if(state.chapter==='tower'&&state.wave>=4&&m.type==='fast'&&m.hp<m.max*.5){box(x-8,y+11,5,2,C.gold);box(x+3,y+13,5,2,C.gold);}
    });
    if(isPlayer){const active=state.board.filter(Boolean);const baseY=routeTop+routeHeight*.68;
      state.board.forEach((c,n)=>{if(!c)return;const {x:ux,y:uy}=c.position?worldPoint(c.position):slotPoint(n);
        const glow=state.effects.find(e=>e.uid===c.uid&&(e.kind==='merge'||e.kind==='deploy'));if(glow){ctx.save();ctx.globalAlpha=.25+.25*glow.life/glow.duration;circle(ux,uy,unitSize*.8,C.gold);ctx.restore();}
        ctx.save();if(c.hp<=0)ctx.globalAlpha=.35;pixelUnit(c.id,ux,uy,unitSize,c.star);ctx.restore();
        if(c.hp<=0){text('×',ux,uy-5,12,C.red,'center');return;}
        if(c.frozenUntil>state.time){ctx.strokeStyle='#b4e9ff';ctx.lineWidth=1;ctx.strokeRect(ux-9,uy-11,18,20);}
        const feet=uy+unitSize*.57;
        bar(ux-10,feet,20,3,c.hp/c.maxHp,c.hp<c.maxHp*.35?C.red:C.mint);
        if(c.id==='csy')bar(ux-9,feet+5,18,2,c.charge/8,heroFx.ink(c.id));
        if(c.id==='ao')for(let j=0;j<3;j++)box(ux-7+j*5,feet+5,4,2,j<c.charge?heroFx.ink(c.id):'#172a31');
      });
      if(!active.length)text('上阵伙伴显示在这里',left+w/2,baseY,10,C.muted,'center');
      if(l.shield>0){ctx.strokeStyle='#8be1e0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left+8,routeTop+routeHeight*.62);ctx.lineTo(left+w-8,routeTop+routeHeight*.62);ctx.stroke();}
    }else if(i!==1&&!l.lost){pixelUnit(i===0?'thorn':'bow',left+w/2,routeTop+routeHeight*.7,22,1);text('AI',left+w/2,routeTop+routeHeight*.7+16,9,C.muted,'center');}
    if(!isPlayer&&!l.lost&&l.echo>0&&l.echoSlot!==undefined){
      const {x,y}=slotPoint(l.echoSlot);
      ctx.save();ctx.globalAlpha=.5*Math.min(1,l.echo);pixelUnit('ge',x,y,unitSize,1);ctx.restore();
    }
    for(const e of laneFx){
      if(e.kind==='team-combo'){const t=1-e.life/e.duration;ctx.save();ctx.strokeStyle='#fff0a8';ctx.lineWidth=3;ctx.globalAlpha=1-t;ctx.beginPath();ctx.arc(left+w/2,routeTop+routeHeight*.52,10+t*Math.min(w*.48,75),0,Math.PI*2);ctx.stroke();e.targets.forEach(target=>{const point=monsterPoint(target.id,target.p);box(point.x-3,point.y-3,6,6,'#fff1b0');});ctx.restore();}
      else if(e.kind==='shot'){
        const from=e.origin?worldPoint(e.origin):slotPoint(e.slot);
        const target=l.monsters.find(m=>m.id===e.targetId);
        heroFx.shot(ctx,e,{x:from.x,y:from.y-4},monsterPoint(e.targetId,target?target.p:e.p));
      }else if(e.kind==='hero-skill'){
        const from=e.origin?worldPoint(e.origin):slotPoint(e.slot);
        heroFx.skill(ctx,e,from,e.targets.map(p=>monsterPoint(p.id,p.p)),{x:left+w/2,y:routeTop+routeHeight*.62});
      }else if(e.kind==='heal'){
        const from=worldPoint(e.origin),to=worldPoint(e.position);
        heroFx.heal(ctx,e,from,to);
        text('+'+e.amount,to.x+12,to.y-19,11,e.id==='ice'?'#b4e9ff':'#bcf2a5','center');
      }else if(e.kind==='hero-hurt'){
        const point=worldPoint(e.position);
        text(e.amount?'-'+e.amount:'挡',point.x-10,point.y+10,10,e.amount?C.red:'#a7efff','center');
      }else if(e.kind==='enemy-down'){
        const {x,y}=monsterPoint(e.monsterId,e.p);
        sprites.enemyBurst(ctx,e.type,x,y,1-e.life/e.duration,state.chapter);
      }else if(e.kind==='enemy-heal'||e.kind==='enemy-interrupted'){
        const {x,y}=monsterPoint(e.monsterId,e.p);
        text(e.kind==='enemy-heal'?'+'+e.amount:'打断',x,y-20,10,e.kind==='enemy-heal'?'#b8ef9b':C.gold,'center');
      }else if(e.kind==='rescue-break'||e.kind==='rescue-save'){
        const {x,y}=monsterPoint(e.monsterId||0,e.p||.82);
        ctx.save();ctx.globalAlpha=Math.min(1,e.life/e.duration);ctx.strokeStyle=e.kind==='rescue-break'?C.gold:C.mint;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,8+(1-e.life/e.duration)*23,0,Math.PI*2);ctx.stroke();text(e.kind==='rescue-break'?'打断！':'拦截！',x,y-27,12,e.kind==='rescue-break'?C.gold:C.mint,'center');ctx.restore();
      }
    }
    const shownHits=new Map();
    laneFx.filter(e=>e.kind==='hit').slice(-10).reverse().forEach(e=>{
      const index=shownHits.get(e.monsterId)||0;
      if(index>=3)return;
      shownHits.set(e.monsterId,index+1);
      const {x,y}=monsterPoint(e.monsterId,e.p);
      ctx.save();ctx.globalAlpha=Math.min(1,e.life/.3);
      const dx=[0,-15,15][index];
      text('-'+e.amount,x+dx,y-16-(1-e.life/e.duration)*12-index*3,10,heroFx.ink(e.source),'center');
      ctx.restore();
    });
    const towerY=top+ah-35;if(l.lost)text('×',left+w/2,towerY+3,16,C.red,'center');text(l.lost?'失守':String(l.hp),left+w/2,top+ah-8,10,l.hp<=3?C.red:C.muted,'center');
  }
  if((state.wave===5||state.mode==='rescue'&&state.wave===3)&&state.boss)bossPanel(top,ah);
  else if(state.prep>0){
    const chapter=CHAPTERS[state.chapter],section=sectionFor(state.chapter,state.wave);
    const names=[...new Set(section.types)].map(type=>chapter.enemyNames[type]);
    const y=top+ah*.20;
    laneArt.frame(ctx,36,y,318,65,skin,true);
    text('第 '+state.wave+' 波 · '+section.name,195,y+13,12,C.gold,'center');
    text(names.join(' · '),195,y+32,11,C.white,'center');
    text(section.story,195,y+50,10,C.muted,'center');
  }
  else if(state.location==='travel'){const returning=state.travel.target==='high',x=lanes[state.lane].centerX,y=top+ah*.7;ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=C.mint;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,35,0,Math.PI*2);ctx.stroke();box(x-2,y-65,4,60,'#80d5bd');state.board.filter(Boolean).slice(0,5).forEach((c,i)=>heroPixels.draw(ctx,c.id,x+(i-2)*18,y,{scale:.48,pose:'idle',time:state.time}));ctx.restore();box(70,top+ah*.28,250,38,C.panel,C.mint);text((returning?'回城引导':'整队游走')+' · '+Math.ceil(state.travel.t)+' 秒',195,top+ah*.28+19,13,C.mint,'center');}
  else if(state.location==='high'&&!state.boss){box(83,top+ah*.25,224,37,C.panel,C.gold);text('已退回高地 · 可选择路线',195,top+ah*.25+18,12,C.gold,'center');}
  if(state.flash>0){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(12,top,366,ah);}
  const skill=state.effects.filter(e=>e.kind==='hero-skill').pop();
  if(skill&&state.location==='lane'){
    const name=skill.cue==='break'?'千手护阵 · 破盾':G.BY_ID[skill.id].skill;
    box(133,top+29,124,20,'#182a34');text(name,195,top+39,11,heroFx.ink(skill.id),'center');
  }
}
function boards(){const y=H-286;const cap=G.CAP[state.wave-1];text('上阵 '+state.board.filter(Boolean).length+'/'+cap,15,y-15,12,C.mint);const labels=G.activeSynergies(state).map(({name,level})=>name+' '+level);text(labels.join('  ')||'凑不同伙伴激活羁绊',375,y-15,11,C.gold,'right');
  for(let i=0;i<7;i++){const x=12+i*52;cardIcon(state.board[i],x,y,48,42,()=>{if(boardSelection>=0){if(boardSelection===i)G.undeploy(state,i);else G.swapSlots(state,'board',boardSelection,i);boardSelection=-1;}else if(state.board[i]){selection=-1;boardSelection=i;}else if(selection>=0){if(G.deploy(state,selection)){const from=state.board.findIndex(c=>c&&!state.bench.includes(c)&&c.uid===state.effects.filter(e=>e.kind==='deploy').slice(-1)[0].uid);if(from>=0&&from!==i)G.swapSlots(state,'board',from,i);selection=-1;}}},boardSelection===i);}
  text('前四格前排，后三格后排 · 点两格换位',15,y+58,11,C.muted);
  for(let i=0;i<8;i++){const x=12+i*46;cardIcon(state.bench[i],x,y+70,42,41,()=>{boardSelection=-1;if(selection>=0&&selection!==i){G.swapSlots(state,'bench',selection,i);selection=-1;}else if(state.bench[i]){if(selection===i){G.deploy(state,i);selection=-1;}else selection=i;}},selection===i);}
  if(selection>=0&&state.bench[selection]){const d=G.BY_ID[state.bench[selection].id];text(d.name+' · '+d.job+' · '+d.skill,16,y+126,11,C.gold);button('详情',174,y+113,59,26,()=>showSynergies(d));button('上阵',240,y+113,61,26,()=>{G.deploy(state,selection);selection=-1;});button('出售',306,y+113,65,26,()=>{G.sell(state,selection);selection=-1;});}
  else if(boardSelection>=0&&state.board[boardSelection]){const c=state.board[boardSelection],d=G.BY_ID[c.id];text(d.name+' · '+(c.item?G.ITEMS[c.item.id].name+' '+c.item.level+'级':'未装备'),16,y+126,11,C.gold);button('详情',235,y+113,64,26,()=>showSynergies(d));button('装备',306,y+113,65,26,()=>{panel='equip';});}
}
function showSynergies(card){if(state.status==='playing')synergyView={card,page:0};}
function renderSynergies(){
  const {card}=synergyView;
  const rows=G.synergyProgress(state,card);
  const top=safe+67,header=card?108:70,rowHeight=57;
  const pageSize=Math.max(1,Math.min(5,Math.floor((H-top-header-67)/rowHeight)));
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  const current=Math.min(synergyView.page,pages-1);
  const visible=rows.slice(current*pageSize,(current+1)*pageSize);
  const bottom=top+header+Math.max(1,visible.length)*rowHeight+49;
  buttons=[];
  box(0,0,390,H,'rgba(6,13,20,.78)');
  laneArt.frame(ctx,18,top,354,bottom-top,battleSkin());
  text(card?card.name:'场上羁绊',34,top+22,17,C.white);
  button('关闭',302,top+8,56,28,()=>{synergyView=null;});
  if(card){
    text('技能 · '+card.skill,34,top+51,12,C.gold);
    text(card.desc.slice(0,26),34,top+71,11,C.muted);
    if(card.desc.length>26)text(card.desc.slice(26),34,top+87,11,C.muted);
  }else text('同名棋子只计一次 · 只计上阵棋子',34,top+48,12,C.muted);
  if(!visible.length)text('上阵伙伴后可查看羁绊进度',34,top+header+19,13,C.muted);
  visible.forEach((row,i)=>{
    const y=top+header+i*rowHeight;
    box(30,y,330,52,row.level?'#2e494e':'#26394a',row.level?C.mint:null);
    text(row.name+' · '+row.count+' 名',40,y+13,13,C.white);
    text(row.level?'已激活 '+row.level+' 档':row.next?'未激活':'未接入',349,y+13,11,row.level?C.mint:C.muted,'right');
    text(row.effect||'当前试玩尚未接入该羁绊效果',40,y+29,11,row.level?C.mint:C.muted);
    if(row.next)text(row.available<row.next?'当前英雄池不足 '+row.next+' 名，暂无法激活':'距 '+row.next+' 档还差 '+(row.next-row.count)+' 名不同棋子',40,y+44,10,C.gold);
  });
  if(card)button('查看场上羁绊',34,bottom-39,131,29,()=>showSynergies());
  if(pages>1){
    if(current>0)button('上一页',32,bottom-39,82,29,()=>{synergyView.page=current-1;});
    text((current+1)+' / '+pages,195,bottom-24,12,C.muted,'center');
    if(current+1<pages)button('下一页',276,bottom-39,82,29,()=>{synergyView.page=current+1;});
  }
}
function shopPanel(y){
  const skin=battleSkin();
  text('守线奖励 '+(state.combatProgress||0)+'/8 · 满 8 得 2 金',375,y+117,9,C.muted,'right');
  state.shop.forEach((id,i)=>{
    const x=12+i*55,d=G.BY_ID[id];
    const owned=d?state.board.concat(state.bench).filter(c=>c&&c.id===id&&c.star===1).length:0;
    laneArt.frame(ctx,x,y+41,52,75,skin,owned>=2);
    if(!d){text('已购买',x+26,y+75,10,C.muted,'center');return;}
    pixelUnit(id,x+26,y+57,18,1);
    text(d.name,x+26,y+70,10,C.white,'center');
    text(d.tribe+(d.extraTribe?' '+d.extraTribe:''),x+26,y+82,8,C.muted,'center');
    text(owned>=2?'可升星 · '+d.cost+'金':d.job+' '+d.cost+'金',x+26,y+92,8,C.gold,'center');
    buttons.push({x,y:y+41,w:52,h:55,fn:()=>G.buy(state,i)});
    button('详情',x+1,y+96,50,20,()=>showSynergies(d));
  });
  button('刷新 2金',292,y+41,86,29,()=>G.refresh(state,false));
  button(state.locked?'已锁定':'锁定',292,y+76,86,29,()=>{state.locked=!state.locked;},state.locked);
}
function routePanel(y){
  const names=['上路','中路','下路'];
  names.forEach((name,i)=>{
    const current=state.location==='lane'&&state.lane===i;
    const label=state.lanes[i].lost?name+'已失守':name;
    button(label,12+i*92,y+43,88,34,()=>G.move(state,'lane',i),current);
  });
  button('回高地',288,y+43,90,34,()=>G.recall(state));
  text('整队换路需 3 秒 · 留意原路线的防守',15,y+96,11,C.muted);
}
function controls(){const y=H-137;
  if(state.mode==='rescue'){
    const event=state.rescue.active,threat=event&&state.lanes[event.lane].monsters.find(m=>m.id===event.id);
    const cooldown=Math.max(0,Math.ceil(state.rescue.supportReadyAt-state.time));
    const castReady=Boolean((threat&&threat.casting&&state.location==='lane'&&state.lane===event.lane)||(state.boss&&state.boss.cast<=2));
    const ready=cooldown===0&&castReady;
    const label=ready?'援护！打断':cooldown?'援护 '+cooldown+'秒':event&&state.lane!==event.lane?'先去警报路线':event?'等蓄力红光':'援护待命';
    button(label,12,y,118,42,()=>G.rescueSkill(state),ready);
    button('同阵容再开',142,y,118,42,()=>startRescue(state.rescue.carry));
    button('退出实验',272,y,106,42,home);
    text('等破门怪蓄力发红光时按援护',195,y-13,10,C.gold,'center');
    return;
  }
  button('商店',12,y,68,34,()=>panel='shop',panel==='shop');button('地图',86,y,68,34,()=>panel='map',panel==='map');button('羁绊',160,y,68,34,()=>showSynergies());button('说明',234,y,68,34,()=>panel='help',panel==='help');button('回家',308,y,70,34,()=>wx.showModal({title:'结束本局？',content:'当前试玩进度不会保存。',success:r=>{if(r.confirm)home();}}));
  if(panel==='shop')shopPanel(y);
  else if(panel==='equip'){const c=state.board[boardSelection];if(!c){text('请先点击上阵伙伴',15,y+60,12,C.muted);}else if(c.item){text(G.ITEMS[c.item.id].name+' · '+G.ITEMS[c.item.id].desc+' · '+c.item.level+'级',15,y+54,12,C.gold);button('升级 4金',240,y+70,130,30,()=>G.upgradeItem(state,boardSelection));}else{['blade','frost','spark'].forEach((id,i)=>button(G.ITEMS[id].name+' 4金',12+i*123,y+43,117,30,()=>G.equip(state,boardSelection,id)));text('战意剑加伤 · 冰霜符减速 · 电弧符攻击额外目标',15,y+95,10,C.muted);}}
  else if(panel==='map')routePanel(y);
  else{text('点商店购买 → 点备战伙伴 → 点上阵',15,y+53,11,C.white);text('三张相同伙伴自动合星；地图可换路线',15,y+75,11,C.muted);text('提醒：当前仅单人试玩，数值尚未平衡',15,y+97,11,C.muted);}}
function rescueStats(){
  const y=H-211,carry=state.rescue.carry==='tang'?'唐卵':'红星';
  laneArt.frame(ctx,18,y,354,53,battleSkin(),true);
  text('敖犬 + '+carry+'  ·  救场 '+state.rescue.saves+'/3',30,y+16,13,C.white);
  text('避免基地伤害 '+state.rescue.baseSaved+' 点  ·  漏怪 '+state.rescue.misses+'  ·  首领打断 '+state.rescue.bossBreaks,30,y+38,10,C.gold);
}
function rescueEnd(){
  const y=Math.max(safe+100,H-365);
  laneArt.frame(ctx,22,y,346,260,battleSkin(),state.status==='won');
  text(state.status==='won'?'611 守住了！':'这次没守住',195,y+36,23,state.status==='won'?C.gold:C.red,'center');
  text('救场 '+state.rescue.saves+'/3  ·  漏怪 '+state.rescue.misses,195,y+83,15,C.white,'center');
  text('避免基地伤害 '+state.rescue.baseSaved+' 点  ·  首领打断 '+state.rescue.bossBreaks,195,y+112,12,C.gold,'center');
  text('换一个搭档，试试另一种守法。',195,y+143,11,C.muted,'center');
  button('再来一次',43,y+168,304,40,()=>startRescue(state.rescue.carry),true);
  button('换战术',43,y+215,145,32,()=>{state=null;page='rescue-choice';});
  button('返回',202,y+215,145,32,home);
}
function renderRescue(){
  laneArt.backdrop(ctx,390,H,battleSkin());
  laneArt.frame(ctx,12,safe+4,366,32,battleSkin());
  const remaining=Math.max(0,Math.ceil(175-state.time));
  text('3分钟救场实验',14,safe+19,17,C.gold);
  text(Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'),375,safe+19,20,C.white,'right');
  mini();
  if(!state.rescue.active)text(state.boss?'首领蓄力发红光时按援护':'红色警报时点路线 · 蓄力发红光时按援护',195,safe+77,10,C.gold,'center');
  arena();rescueStats();controls();
  const message=state.notices[state.notices.length-1];
  if(message){box(22,H-248,346,23,'#263d43');text(message.slice(0,30),195,H-236,10,C.white,'center');}
  if(state.status!=='playing')rescueEnd();
}
function render(){
  if(state.mode==='rescue'){renderRescue();return;}
  const skin=battleSkin();
  laneArt.backdrop(ctx,390,H,skin);
  laneArt.frame(ctx,12,safe+4,366,32,skin);
  text('第 '+state.wave+'/5 波',22,safe+20,16,C.white);
  text(state.prep>0?'准备 '+Math.ceil(state.prep)+' 秒':state.boss?'高地决战 · '+Math.max(0,Math.ceil(G.BOSS_LIMIT_SECONDS-state.waveTime))+' 秒':'下波 '+Math.max(0,Math.ceil(G.WAVE_SECONDS-state.waveTime))+' 秒',195,safe+20,12,state.prep>0?skin.accent:C.muted,'center');
  text('金币 '+state.gold,368,safe+20,13,skin.accent,'right');mini();
  const section=sectionFor(state.chapter,state.wave);
  text(CHAPTERS[state.chapter].name+' · '+(state.boss?'高地决战':section?.name||'首领战'),195,safe+75,11,skin.accent,'center');
  arena();boards();controls();
  const merge=state.effects.filter(e=>e.kind==='merge').slice(-1)[0];const message=merge?G.BY_ID[merge.id].name+'  ★'.repeat(merge.star)+'  合成成功！':state.notices[state.notices.length-1];if(message){box(18,H-330,354,25,merge?'#665331':'#263d43',merge?C.gold:null);text(message.slice(0,26),195,H-317,11,merge?C.gold:C.white,'center');}
  if(state.status!=='playing'){
    const y=H-345;
    laneArt.frame(ctx,12,y,366,68,skin,state.status==='won');
    text(state.status==='won'?'611 守住了！':'高地失守',26,y+17,16,state.status==='won'?skin.accent:C.red);
    text('击败 '+state.kills+' · 伤害 '+Math.floor(state.damage),26,y+43,11,C.white);
    button('返回',286,y+18,78,32,home,true);
  }
}
function moveStick(t){const dx=t.clientX/scale-76,dy=t.clientY/scale-(H-100),length=Math.hypot(dx,dy),divisor=Math.max(36,length);actionInput.x=dx/divisor;actionInput.y=dy/divisor;}
function aimStick(t){const dx=t.clientX/scale-312,dy=t.clientY/scale-(H-100),length=Math.hypot(dx,dy),divisor=Math.max(28,length);actionInput.aimX=dx/divisor;actionInput.aimY=dy/divisor;}
wx.onTouchStart(e=>{for(const t of e.changedTouches){const x=t.clientX/scale,y=t.clientY/scale,id=t.identifier===undefined?0:t.identifier;
  if (page === 'nightStory' && !nightStory.dialogue) {
    const {controlY} = nightRollCallView.layout(H, safe);
    if (y >= controlY && y <= controlY + 54) {
      if (x >= 16 && x <= 85) { storyTouches.set(id, -1); continue; }
      if (x >= 93 && x <= 162) { storyTouches.set(id, 1); continue; }
    }
  }
  if(page==='adventure'&&adventureState&&!adventureState.message&&!adventureState.pending&&!adventureState.pendingWeapon&&!adventureState.shopOpen&&!adventureState.echoPuzzleOpen&&!adventureState.powerPanelOpen&&!adventureState.routeChoiceOpen&&!adventureState.postBossOpen&&!adventureState.defeated&&!adventureState.completed){
    if(actionInput.moveId===null&&Math.hypot(x-76,y-(H-100))<=60){actionInput.moveId=id;moveStick(t);continue;}
    if(actionInput.attackId===null&&Math.hypot(x-312,y-(H-100))<=52){const target=adventure.nearbyInteraction(adventureState);if(target){adventure.interact(adventureState);clearActionInput();saveAdventure();}else{actionInput.attackId=id;actionInput.attack=true;aimStick(t);if(adventureAction.step(adventureState,0,actionInput))saveAdventure();}continue;}
  }
  const b=buttons.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
  if(b){
    const previousPage=page;
    b.fn();
    if(previousPage!=='nightStory'||page!==previousPage||nightStory.dialogue)break;
  }
}});
if(wx.onTouchMove)wx.onTouchMove(e=>{for(const t of e.changedTouches){const id=t.identifier===undefined?0:t.identifier;if(id===actionInput.moveId)moveStick(t);if(id===actionInput.attackId)aimStick(t);}});
function releaseTouches(e){for(const t of e.changedTouches){const id=t.identifier===undefined?0:t.identifier;storyTouches.delete(id);if(id===actionInput.moveId){actionInput.moveId=null;actionInput.x=0;actionInput.y=0;}if(id===actionInput.attackId){actionInput.attackId=null;actionInput.attack=false;actionInput.aimX=0;actionInput.aimY=0;}}if(page==='adventure')saveAdventure();}
if(wx.onTouchEnd)wx.onTouchEnd(releaseTouches);if(wx.onTouchCancel)wx.onTouchCancel(releaseTouches);
wx.onHide(()=>{hidden=true;if(page==='adventure')saveAdventure();storyTouches.clear();clearActionInput();});wx.onShow(()=>{hidden=false;last=Date.now();});
function frame(){
  const now=Date.now(),dt=Math.min(.1,(now-last)/1000);
  last=now;
  if(state&&page==='game'&&!hidden&&!synergyView)G.step(state,dt);
  if(adventureState&&page==='adventure'&&!hidden){
    if(adventureAction.step(adventureState,dt,actionInput))saveAdventure();
    const a=adventureState;
    if(a.message||a.pendingWeapon||a.shopOpen||a.echoPuzzleOpen||a.powerPanelOpen||a.defeated||a.completed)clearActionInput();
  }
  if (page === 'nightStory' && !hidden) {
    const slices = Math.max(1, Math.ceil(dt / .03));
    for (let i = 0; i < slices; i++) nightRollCall.step(nightStory, dt / slices, storyDirection());
    if (nightStory.dialogue) storyTouches.clear();
  }
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
  buttons=[];
  if(page==='home'||page==='weapon-gallery'||page==='lab'){
    pixelArt.backdrop(ctx,{width:390,height:H,time:0});
    if(page==='home')renderHome();else if(page==='lab')renderLab();else renderWeaponGallery();
  }else if(page==='nightStory')renderNightStory();
  else if(page==='chapters')renderChapters();
  else if(page==='rescue-choice')renderRescueChoice();
  else if(page==='adventure')renderAdventure();
  else{
    render();
    if(synergyView)renderSynergies();
  }
  requestAnimationFrame(frame);
}
frame();
