(function () {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const art = window.PixelArt;
  const heroes = window.HeroPixels;
  const content = window.GameContent;
  const byId = Object.fromEntries(content.cards.map(card => [card.id, card]));
  const C = {ink:'#111b28',deep:'#192a39',panel:'#273c50',edge:'#58758b',text:'#f2ecd9',muted:'#9fb3bf',mint:'#80d9bb',gold:'#efc986',red:'#f08b81',blue:'#a4c7ed',purple:'#baa6e2'};
  const rules = {
    '守卫': [[2,'定时为防线补充12点护盾'],[4,'定时补充20点护盾'],[6,'定时补充30点护盾']],
    '战士': [[2,'友方战士护甲 +4'],[4,'友方战士护甲 +8'],[6,'友方战士护甲 +16']],
    '法师': [[2,'敌方魔法抗性降低 15 个百分点'],[4,'降低 30 个百分点'],[6,'降低 70 个百分点']],
    '猎人': [[2,'友方猎人有 10% 概率追加普攻'],[4,'概率提高至 20%'],[6,'概率提高至 50%']],
    '洞洞族': [[2,'全队生命上限 +30'],[4,'全队生命上限 +80'],[6,'全队生命上限 +120']],
    '牧师': [[2,'基地受到较大单次伤害时减免 10%'],[4,'减免 20%'],[6,'减免 30%']],
    '611': [[2,'室友普攻伤害 +5%'],[4,'室友普攻伤害 +8%'],[6,'室友普攻伤害 +10%，六人存活积攒合击']]
  };
  const jobIcon = {'守卫':'shield','战士':'sword','法师':'magic','猎人':'arrow','潜行者':'boot','牧师':'heal','工匠':'settings'};
  const sceneInfo = {
    battle: {label:'三路守城',caption:'点路线标题切换观察，点伙伴看详情。普攻和英雄技能自动触发。',title:'每一下，都看得见。',description:'前冲、挥砍、命中停顿、碎片与击退，组成一次完整攻击。下方按钮只用于预览效果。',note:'战场先于面板',body:'自己的路线更宽，其他两路始终在场。青绿代表友军，红色代表危险，黄色用于金币、升星和关键机会。',hint:'点三路标题切换观察。头顶短条为生命，脚下短条为技能进度。'},
    prepare: {label:'波间备战',caption:'买第一张敖犬可直接合成二星。选择备战伙伴后，点空格或伙伴调整位置。',title:'这一张，刚好升星。',description:'同名伙伴显示已拥有数量，能合成时用金边提示。购买只需一次点击，三张同星自动合成。',note:'给决策留一口气',body:'波间倒计时与阵型格同时可见。备战席保持八格，商店保持五张，升星后保留原来位置。',hint:'点击商店首张敖犬体验升星。点底部布阵可调整场上七个位置。'},
    synergy: {label:'英雄与羁绊',caption:'已激活效果与下一档需求一起展示。同名英雄只计算一次，备战席不参与。',title:'阵容强在哪里。',description:'英雄详情先看站位、技能与羁绊。场上羁绊显示计数和生效条件，便于找下一张有用的伙伴。',note:'数得清，才好搭配',body:'场上计数、当前档位和下一档缺口分开显示。暂未接入的种族效果会直接标注。',hint:'查看各项羁绊的激活条件，可翻页查看全部标签。返回战场后点伙伴查看详情。'},
    boss: {label:'高地首领战',caption:'司礼官正在引导复苏。点击打断复苏，观察读条、怪物与提示的同步变化。',title:'先看懂，再做决定。',description:'首领危险范围先亮起，读条中出现可执行的打断。成功后保留短暂反馈，清理随从后再攻击首领。',note:'压迫感有明确来源',body:'首领占据主视觉，两路仍保留状态。预警用红色阶梯边界，打断机会用青绿色按钮。',hint:'点击战场中打断复苏。此处需有控制伙伴，演示阵容包含岩之灵。'},
    heroes: {label:'像素英雄图鉴',caption:'点击英雄查看像素造型与技能。保留种族、武器和体型差异，强化小屏辨识度。',title:'先看轮廓，就认得。',description:'六位室友有独立武器与配色。其余英雄参考多多自走棋的种族和职业轮廓，以像素重新绘制。',note:'人物与武器一起设计',body:'红斧、岩石躯体、长枪、雷杖和双刃各有轮廓。统一硬边像素、有限色阶与落地阴影。',hint:'点下方英雄头像切换。人物会展示待机与攻击动作。'}
  };

  let scene = 'battle';
  let clock = 2.4;
  let state;
  let overlay = null;
  let selected = null;
  let galleryId = 'ao';
  let boardView = false;
  let effects = [];
  let buttons = [];
  let buttonKey = '';
  let actorPositions = [];
  let monsterPositions = [];
  let toast = null;
  let paused = false;
  let sound = false;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hitStop = 0;
  let audioContext;
  let last = performance.now();
  let lastAuto = -1;
  let lastPaint = 0;
  let uid = 1;

  function unit(id, star = 1) { return {id,star,uid:uid++,item:null,hp:.72}; }
  function newState(mode) {
    const regular = ['ao','zhi','csy','ge','tang','hong','priest'];
    const preparation = ['ao','zhi','csy','hammer','tang','priest',null];
    const boss = ['ao','zhi','csy','hammer','tang','hong','priest'];
    const ids = mode === 'prepare' ? preparation : mode === 'boss' ? boss : regular;
    return {
      wave:mode === 'prepare' ? 7 : mode === 'boss' ? 10 : 9,
      board:ids.map(id => id ? unit(id) : null),
      bench:[unit('ao'),unit('fire'),null,unit('blade'),null,null,null,null],
      shop:['ao','hammer','fire','bow','shadow'],gold:18,focus:1,locked:false,
      base:86,bossInterrupted:false,bossCleared:false,ritualFailed:false,tab:'shop',seconds:8,
      baseTime:clock,reads:0
    };
  }

  function rect(x,y,w,h,color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function text(value,x,y,size=12,color=C.text,align='left') {
    ctx.font = `${size}px FusionPixel, "Microsoft YaHei", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#101a27';
    ctx.fillText(String(value),Math.round(x),Math.round(y+1));
    ctx.fillStyle = color;
    ctx.fillText(String(value),Math.round(x),Math.round(y));
  }
  function wrap(value,x,y,maxWidth,color=C.muted,lineHeight=20) {
    let line = '';
    let row = 0;
    ctx.font = '12px FusionPixel, "Microsoft YaHei", sans-serif';
    for (const char of value) {
      if (ctx.measureText(line+char).width > maxWidth && line) {
        text(line,x,y+row*lineHeight,12,color);
        row++;
        line = '';
      }
      line += char;
    }
    if (line) text(line,x,y+row*lineHeight,12,color);
    return (row+1)*lineHeight;
  }
  function frame(x,y,w,h,fill=C.panel,accent) {
    art.frame(ctx,x,y,w,h,{fill,accent,edge:accent || C.edge,light:accent || '#718696'});
  }
  function icon(name,x,y,size=18,color=C.gold) { art.icon(ctx,name,x,y,size,color); }
  function meter(x,y,w,h,value,color,segments=0) {
    rect(x-2,y-2,w+4,h+4,C.ink);
    rect(x,y,w,h,'#263647');
    const fill = Math.round(w*Math.max(0,Math.min(1,value)));
    rect(x,y,fill,h,color);
    rect(x,y,fill,2,'#ffffff28');
    if (segments) for (let i=1;i<segments;i++) rect(x+Math.round(w*i/segments),y,2,h,C.ink);
  }
  function action(id,label,x,y,w,h,fn,active=false,small=false) {
    frame(x,y,w,h,active ? '#315a55' : '#263a4b',active ? C.mint : null);
    text(label,x+w/2,y+h/2,small?12:12,active?C.mint:C.text,'center');
    hotspot(id,label,x,y,w,h,fn);
  }
  function hotspot(id,label,x,y,w,h,fn) { buttons.push({id,label,x,y,w,h,fn}); }
  function notice(message) {
    toast = {message,until:clock+2.8};
    document.querySelector('#announcement').textContent = message;
  }
  function sprite(id,x,y,scale=1,pose='idle',hit=false) {
    heroes.draw(ctx,id,Math.round(x),Math.round(y),{scale,pose,time:clock,facing:1,hit,shadow:true});
  }
  function countOwned(id,star=1) { return state.board.concat(state.bench).filter(card => card && card.id===id && card.star===star).length; }
  function tagCounts() {
    const counts = {};
    for (const id of new Set(state.board.filter(Boolean).map(card=>card.id))) {
      const d=byId[id];
      for (const tag of [d.tribe,d.extraTribe,d.job].filter(Boolean)) counts[tag]=(counts[tag]||0)+1;
    }
    return counts;
  }
  function activeTag(name,count) { return (rules[name]||[]).filter(([threshold])=>count>=threshold).at(-1); }

  function topHud() {
    rect(0,0,390,26,'#13202e');
    text('611',16,17,12,C.gold);
    text('今晚守家',48,17,12,C.muted);
    frame(292,7,82,24,'#101a24');
    rect(306,17,3,3,C.text);rect(312,17,3,3,C.text);rect(318,17,3,3,C.text);
    rect(335,12,2,14,'#455767');
    icon('settings',347,12,14,C.text);
    text(scene==='heroes'?'伙伴图鉴':'赤灯礼堂',16,48,24,C.text);
    if(scene!=='heroes') text(scene==='boss'?'最终波 · 高地集结':`第 ${state.wave}/10 波 · ${scene==='prepare'?'8s':Math.ceil(38-(clock%38))+'s'}`,374,49,12,scene==='boss'?C.red:C.muted,'right');
    else text('种族 × 职业 × 武器',374,49,12,C.muted,'right');
    frame(12,68,366,42,'#1b2c3c');
    icon('heart',22,78,20,C.mint);
    text('611',48,82,12,C.muted);
    meter(48,96,95,4,state.base/100,C.mint,5);
    text(`${state.base}/100`,151,85,12,C.text);
    rect(206,78,2,22,'#3c5363');
    icon('coin',229,79,18,C.gold);
    text(String(state.gold),255,88,24,C.gold);
    text(scene==='heroes'?'19 位伙伴':scene==='prepare'?'备战中':'自动战斗',366,88,12,scene==='prepare'?C.gold:C.mint,'right');
  }

  function laneLabels(lanes) {
    const owners = ['电脑','我','电脑'];
    lanes.forEach((lane,i)=> {
      frame(lane.x+2,117,lane.w-4,27,i===state.focus?'#29473f':'#263948',i===state.focus?C.mint:null);
      text(`${['上路','中路','下路'][i]} ${owners[i]}`,lane.centerX,131,12,i===state.focus?C.mint:C.muted,'center');
      hotspot(`lane-${i}`,`观察${['上路','中路','下路'][i]}`,lane.x,115,lane.w,42,()=> {state.focus=i;render();});
      text('12',lane.centerX,473,12,C.gold,'center');
    });
  }

  function enemy(x,y,type='normal',hit=false,scale=1) {
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
    const red=hit?'#fff0b8':type==='heavy'?'#916b84':'#bc6b64';
    const dark=type==='heavy'?'#4e3a53':'#6d3f4d';
    rect(-9,-1,18,3,'#1b2b34');
    const step=Math.sin(clock*7+x)>0?1:0;
    rect(-6,-5-step,5,5,'#302d3e');rect(2,-4+step,5,4,'#302d3e');
    if(type==='healer') {
      rect(-7,-20,14,9,'#402b43');rect(-9,-11,18,9,'#795065');
      rect(-5,-18,10,7,red);rect(-4,-15,8,4,C.ink);rect(-2,-14,2,1,C.gold);rect(2,-14,2,1,C.gold);
      rect(10,-24,2,22,'#967049');rect(8,-23,6,6,C.gold);rect(9,-22,3,3,'#fff0b8');
    } else if(type==='heavy') {
      rect(-11,-22,22,17,dark);rect(-9,-25,18,15,red);
      rect(-13,-17,5,10,'#b58691');rect(8,-17,5,10,'#b58691');
      rect(-7,-18,14,5,'#352e43');rect(-5,-17,3,2,C.gold);rect(2,-17,3,2,C.gold);
      rect(-5,-8,10,3,'#b58691');
    } else {
      rect(-7,-18,14,13,dark);rect(-6,-22,12,8,red);rect(-8,-24,16,3,'#d98b76');
      rect(-4,-18,8,4,'#352e3c');rect(-3,-17,2,1,C.gold);rect(2,-17,2,1,C.gold);
      rect(-9,-10,4,5,red);rect(6,-10,4,5,red);rect(10,-20,2,17,'#bea384');
    }
    ctx.restore();
  }
  function prepareWorld(lanes) {
    const lane=lanes[1];
    actorPositions=[];
    state.board.forEach((card,i)=> {
      if(!card) return;
      const front=i<4;
      const x=lane.x+lane.w*(front? .16+(i%4)*.225 : .275+(i-4)*.225);
      const y=lane.y+lane.h*(front?.60:.86);
      rect(x-17,y-8,34,4,'#637a73');rect(x-17,y-5,2,12,'#637a73');rect(x+15,y-5,2,12,'#637a73');rect(x-17,y+8,34,2,'#637a73');
      sprite(card.id,x,y+2,1,'idle');
      actorPositions.push({id:card.id,x,y:y+2,slot:i,uid:card.uid});
      hotspot(`board-${i}`,`${byId[card.id].name}，点击查看或换位`,x-20,y-43,40,52,()=>chooseBoard(i));
      if(selected && selected.area==='board' && selected.index===i) selectionOutline(x-19,y-44,38,54);
    });
    lanes.forEach((side,i)=> {
      if(i===1) return;
      sprite(i===0?'thorn':'bow',side.centerX,side.y+side.h*.73,1,'idle');
    });
    frame(91,171,208,52,'#1a2b39',C.gold);
    text('波间备战',195,187,12,C.gold,'center');
    text('第 7 波 · 礼堂仪式',195,207,12,C.text,'center');
    frame(142,230,106,29,'#1b2b37');
    text('8 秒 · 演示暂停',195,245,12,C.muted,'center');
  }
  function combatWorld(lanes) {
    actorPositions=[];
    monsterPositions=[];
    lanes.forEach((lane,i)=> {
      if(i!==1) {
        for(let m=0;m<3;m++) {
          const x=lane.centerX+(m%2?10:-10);
          const y=lane.y+38+m*44+Math.round(Math.sin(clock*.8+m)*6);
          enemy(x,y,m===1?'heavy':'normal',false,1);
          meter(x-9,y-29,18,3,.6+m*.12,C.red);
        }
        sprite(i===0?'thorn':'bow',lane.centerX,lane.y+lane.h*.77,1,Math.sin(clock*3)>0?'attack':'idle');
        meter(lane.centerX-13,lane.y+lane.h*.77-45,26,3,.83,C.mint);
        return;
      }
      const compact=lane.w<130;
      const unitScale=compact?.5:1;
      for(let m=0;m<6;m++) {
        const x=lane.x+lane.w*(.26+(m%3)*.24);
        const y=lane.y+55+Math.floor(m/3)*45+Math.round(Math.sin(clock*.8+m)*5);
        const struck=effects.some(e=>['slash','spin','lightning'].includes(e.kind)&&clock-e.start<.18);
        const recoil=struck ? (reduced?0:3) : 0;
        enemy(x,y-recoil,m===0?'healer':m%3===1?'heavy':'normal',struck,unitScale);
        const barWidth=compact?12:22;
        meter(x-barWidth/2,y-32*unitScale,barWidth,compact?2:3,.4+(m%3)*.21,C.red);
        monsterPositions.push({x,y:y-13,id:m});
      }
      state.board.forEach((card,index)=> {
        if(!card) return;
        const front=index<4;
        const cycle=(clock*.74+index*.23)%1;
        const approach=front?Math.max(0,Math.sin(cycle*Math.PI*2))*29*unitScale:0;
        const x=lane.x+lane.w*(front?.16+index*.225:.275+(index-4)*.225);
        const y=lane.y+lane.h*(front?.68:.95)-approach;
        const isAttack=front?cycle>.12&&cycle<.38:cycle>.2&&cycle<.32;
        const hurt=effects.some(e=>e.kind==='spin' &&clock-e.start<.11&&card.id==='ao');
        sprite(card.id,x,y,unitScale,isAttack?'attack':approach>1?'walk':'idle',hurt);
        const hp=card.hp;
        meter(x-14*unitScale,y-45*unitScale,28*unitScale,compact?2:3,hp,card.id==='ao'?C.gold:C.mint);
        meter(x-12*unitScale,y+5,24*unitScale,2,((clock*.11+index*.17)%1),C.blue);
        if(card.star>1&&!compact)text('★'.repeat(card.star),x,y-54,12,C.gold,'center');
        actorPositions.push({id:card.id,x,y,slot:index,uid:card.uid});
        if(!compact)hotspot(`board-${index}`,`查看${byId[card.id].name}的技能与羁绊`,x-20,y-44,40,49,()=>{overlay={type:'hero',id:card.id};render();});
      });
      if(compact)hotspot('refocus-my-lane','放大自己的路线',lane.x,lane.y,lane.w,lane.h,()=>{state.focus=1;render();});
    });
  }
  function selectionOutline(x,y,w,h) {
    rect(x,y,9,2,C.gold);rect(x,y,2,8,C.gold);rect(x+w-9,y,9,2,C.gold);rect(x+w-2,y,2,8,C.gold);
    rect(x,y+h-2,9,2,C.gold);rect(x,y+h-8,2,8,C.gold);rect(x+w-9,y+h-2,9,2,C.gold);rect(x+w-2,y+h-8,2,8,C.gold);
  }
  function bossShape(x,y,kind='warden',scale=1) {
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
    rect(-22,1,44,4,'#1b2633');
    if(kind==='cleric') {
      rect(-10,-42,20,15,'#40304e');rect(-13,-32,26,21,'#7c4f75');
      rect(-15,-11,30,12,'#60435f');rect(-7,-29,14,11,'#25283c');rect(-4,-25,3,2,C.gold);rect(3,-25,3,2,C.gold);
      rect(-3,-15,6,16,'#bb8d76');rect(16,-40,3,38,'#ad895b');rect(12,-39,11,12,'#d8b47a');rect(15,-37,5,7,'#f5dda2');
      return ctx.restore();
    }
    rect(-18,-41,36,36,'#4a354e');rect(-15,-41,30,24,'#ad645d');rect(-22,-37,8,20,'#d6a369');rect(14,-37,8,20,'#d6a369');
    rect(-12,-55,24,17,'#c5a071');rect(-15,-51,30,6,'#e3c18c');rect(-10,-43,20,8,'#332c3b');rect(-7,-41,4,2,C.red);rect(4,-41,4,2,C.red);
    rect(-14,-8,10,10,'#554253');rect(5,-8,10,10,'#554253');
    rect(-33,-34,18,33,'#273c50');rect(-31,-32,14,29,'#c6a477');rect(-28,-27,8,19,'#864c51');rect(-26,-23,4,11,C.gold);
    rect(23,-49,5,48,'#d9c5a0');rect(21,-48,2,30,'#f4e2bc');rect(18,-12,16,4,'#8d6a50');
    ctx.restore();
  }
  function bossWorld(lanes) {
    const lane=lanes[1];
    actorPositions=[];
    monsterPositions=[{x:153,y:283},{x:235,y:283},{x:195,y:222}];
    rect(27,230,336,171,'#2b3a46');
    for(let y=234;y<401;y+=22) for(let x=31;x<360;x+=32) {
      rect(x,y,29,19,(x+y)%3?'#324553':'#374b58');rect(x,y,29,1,'#425868');
    }
    rect(25,399,340,6,'#667d85');rect(29,405,332,5,'#425b6a');rect(35,410,320,5,'#2c4054');
    frame(48,153,294,52,'#322e3d',C.red);
    icon('skull',60,164,23,C.red);
    text('赤灯指挥官',92,172,12,C.text);
    text(state.bossCleared?'集中输出':'先清司礼官',326,172,12,state.bossCleared?C.red:C.purple,'right');
    meter(92,188,234,5,state.bossCleared?.45:.59,state.bossCleared?C.red:C.purple);
    bossShape(195,281,'warden',1.45);
    if(!state.bossCleared) {
      bossShape(143,332,'cleric',1);
      enemy(245,330,'heavy');
      meter(129,285,30,4,state.bossInterrupted?.28:.72,C.red);
      meter(232,291,30,4,.65,C.red);
      if(!state.bossInterrupted&&!state.ritualFailed) {
        const remaining=Math.max(0,5-(clock-state.baseTime));
        rect(109,332,176,2,C.red);rect(109,332,2,23,C.red);rect(283,332,2,23,C.red);rect(109,353,176,2,C.red);
        for(let x=116;x<280;x+=14) rect(x,343+(x%3),6,2,'#ad665e');
        frame(73,360,244,49,'#352d3a',C.gold);
        text('司礼官 · 复苏仪式',87,375,12,C.gold);
        text(`${remaining.toFixed(1)}s`,303,375,12,C.red,'right');
        meter(87,392,95,4,remaining/5,C.red);
        if(controlPartner())action('interrupt','打断复苏',211,365,99,38,()=>interrupt(),true);
        else text('缺少控制伙伴',303,393,12,C.muted,'right');
      } else if(state.ritualFailed) {
        enemy(205,332,'heavy');
        frame(78,357,234,37,'#432f3d',C.red);
        text('复苏完成 · 援军抵达',195,376,12,C.red,'center');
      } else {
        frame(88,357,214,37,'#1e3d3c',C.mint);
        text('复苏已打断！',195,376,12,C.mint,'center');
        hotspot('clear-adds','演示清理随从',88,357,214,44,()=>{state.bossCleared=true;notice('随从已清理，首领解除保护');render();});
      }
    } else {
      frame(88,314,214,37,'#343342',C.red);
      text('首领解除保护 · 集中输出',195,333,12,C.gold,'center');
    }
    state.board.forEach((card,i)=> {
      if(!card)return;
      const x=63+i*44;
      const y=455+(i%2?4:0);
      sprite(card.id,x,y,1,Math.sin(clock*3+i)>0?'attack':'idle');
      meter(x-13,y-44,26,3,.72,C.mint);
      actorPositions.push({id:card.id,x,y,slot:i});
      hotspot(`board-${i}`,`查看${byId[card.id].name}`,x-18,y-43,36,49,()=>{overlay={type:'hero',id:card.id};render();});
    });
  }
  function controlPartner() { return state.board.find(card=>card&&['hammer','axe','bow','shadow'].includes(card.id)); }
  function interrupt() {
    const controller=controlPartner();
    if(state.bossInterrupted||state.ritualFailed||!controller)return;
    state.bossInterrupted=true;
    effects.push({kind:'interrupt',start:clock,duration:1.1});
    notice(`${byId[controller.id].name}打断复苏，援军未被唤醒`);
    playSound('lightning');
    render();
  }

  function synergyStrip() {
    frame(12,490,366,34,'#1d303d');
    const counts=tagCounts();
    const tags=Object.entries(counts).sort((a,b)=>Number(!!activeTag(b[0],b[1]))-Number(!!activeTag(a[0],a[1]))||b[1]-a[1]).slice(0,3);
    let x=23;
    tags.forEach(([name,count])=> {
      const active=activeTag(name,count);
      const label=`${name} ${count}`;
      icon(name==='611'?'home':jobIcon[name]||'synergy',x,499,15,active?C.mint:C.muted);
      text(label,x+22,507,12,active?C.mint:C.muted);
      x+=name.length*12+46;
    });
    text('›',365,507,12,C.mint,'right');
    hotspot('synergy-strip','查看场上羁绊',12,487,366,44,()=>{overlay={type:'synergy'};render();});
  }
  function benchPanel() {
    frame(12,530,366,78,'#213342');
    text('备战席',23,544,12,C.muted);
    text(`${state.bench.filter(Boolean).length}/8`,83,544,12,C.text);
    const total=state.board.filter(Boolean).length;
    const cap=content.capacity[state.wave-1];
    text(`上阵 ${total}/${cap}`,365,544,12,C.mint,'right');
    state.bench.forEach((card,index)=> {
      const x=21+index*44;
      rect(x,556,39,43,'#162938');rect(x+1,557,37,1,'#54717c');rect(x,597,39,2,'#3d596a');
      if(card) {
        sprite(card.id,x+19,596,1,'idle');
        if(card.star>1)text('★'.repeat(card.star),x+19,560,12,C.gold,'center');
        if(countOwned(card.id)>=2)rect(x+3,599,33,2,C.gold);
      } else {rect(x+17,575,5,1,'#445d6f');rect(x+19,573,1,5,'#445d6f');}
      if(selected&&selected.area==='bench'&&selected.index===index)selectionOutline(x-1,555,41,46);
      hotspot(`bench-${index}`,card?`选择备战伙伴${byId[card.id].name}`:`备战空位${index+1}`,x-1,554,42,48,()=>chooseBench(index));
    });
  }
  function shopPanel() {
    text('招募伙伴',19,630,12,C.text);
    const lockX=221;
    frame(lockX,615,43,29,state.locked?'#5d513c':'#273c50',state.locked?C.gold:null);
    icon('lock',lockX+13,622,16,state.locked?C.gold:C.muted);
    hotspot('shop-lock',state.locked?'取消锁定商店':'锁定商店',lockX,610,44,43,()=>{state.locked=!state.locked;notice(state.locked?'商店已锁定，下一波保留':'已取消锁定');render();});
    action('refresh','刷新 2G',272,615,104,29,()=>refreshShop());
    const widths=68;
    state.shop.forEach((id,index)=> {
      const x=13+index*74;
      if(!id) {
        frame(x,653,widths,101,'#1c2d3b');text('已招募',x+34,702,12,'#637e8d','center');
        return;
      }
      const d=byId[id];
      const merge=countOwned(id)>=2;
      frame(x,653,widths,101,merge?'#3d4038':'#263b4b',merge?C.gold:null);
      rect(x+5,658,58,43,merge?'#424b40':'#2d4655');
      sprite(id,x+33,699,1,'idle');
      if(merge) {rect(x+5,659,58,13,'#715e3c');text('可升 2 星',x+34,665,12,C.gold,'center');}
      text(d.name,x+34,713,12,C.text,'center');
      icon(jobIcon[d.job],x+8,724,12,C.muted);
      text(d.job,x+24,730,12,C.muted);
      icon('coin',x+16,737,12,C.gold);
      text(d.cost,x+39,743,12,C.gold);
      hotspot(`buy-${index}`,`购买${d.name}，${d.cost}金币${merge?'，可自动合成二星':''}`,x,651,widths,105,()=>buy(index));
    });
    text(scene==='prepare'?'同星三合一 · 点击伙伴再点目标位置换位':'技能自动释放 · 点伙伴查看详情',195,768,12,C.muted,'center');
  }
  function bottomTabs() {
    const tabs=[['shop','bag','商店'],['formation','sword','布阵'],['synergy','synergy','羁绊'],['routes','boot','路线']];
    tabs.forEach(([id,image,label],i)=> {
      const x=13+i*93;
      const active=(id==='shop'&&!boardView&&!overlay)||(id==='formation'&&boardView)||(overlay&&overlay.type===id);
      frame(x,784,86,43,active?'#2c4c49':'#223647',active?C.mint:null);
      icon(image,x+11,796,17,active?C.mint:C.muted);
      text(label,x+51,806,12,active?C.mint:C.muted,'center');
      hotspot(`nav-${id}`,label,x,782,86,47,()=>nav(id));
    });
    rect(160,837,70,3,'#71828d');
  }
  function nav(id) {
    if(id==='shop') {boardView=false;overlay=null;selected=null;}
    if(id==='formation') {boardView=true;overlay=null;}
    if(id==='synergy')overlay={type:'synergy'};
    if(id==='routes')overlay={type:'routes'};
    render();
  }
  function formationPanel() {
    const x=24,y=622;
    frame(12,615,366,158,'#223746');
    text('阵型',26,634,12,C.text);
    text('前四格近敌 · 后三格远离入口',363,634,12,C.muted,'right');
    state.board.forEach((card,index)=> {
      const front=index<4;
      const px=front?44+index*83:84+(index-4)*83;
      const py=front?669:729;
      rect(px-23,py-22,46,45,'#172b39');
      rect(px-23,py+23,46,2,front?'#9d8571':'#5c94a1');
      if(card) sprite(card.id,px,py+17,1,'idle');
      else icon('plus',px-9,py-5,18,'#526e7f');
      if(selected&&selected.area==='board'&&selected.index===index)selectionOutline(px-25,py-24,50,49);
      hotspot(`formation-${index}`,`阵型${index+1}${card?' '+byId[card.id].name:' 空位'}`,px-26,py-23,52,49,()=>chooseBoard(index));
    });
  }
  function buy(index) {
    const id=state.shop[index];
    if(!id)return;
    const d=byId[id];
    if(state.gold<d.cost)return notice('金币不足');
    let empty=state.bench.indexOf(null);
    if(empty<0) {
      if(countOwned(id)<2)return notice('备战席已满，请先上阵或出售');
      empty=state.bench.length;
      state.bench.push(null);
    }
    state.gold-=d.cost;
    state.shop[index]=null;
    state.bench[empty]=unit(id);
    let merged=false;
    for(let star=1;star<3;star++) {
      const matches=[];
      state.board.forEach((card,i)=>{if(card&&card.id===id&&card.star===star)matches.push({array:state.board,index:i,card});});
      state.bench.forEach((card,i)=>{if(card&&card.id===id&&card.star===star)matches.push({array:state.bench,index:i,card});});
      if(matches.length<3)break;
      const target=matches[0];
      const gear=matches.slice(0,3).map(match=>match.card.item).filter(Boolean);
      matches.slice(0,3).forEach(match=>match.array[match.index]=null);
      const upgraded=unit(id,star+1);
      upgraded.item=gear[0]||null;
      state.gold+=gear.slice(1).reduce((gold,item)=>gold+4+(item.level-1)*4,0);
      target.array[target.index]=upgraded;
      const actor=actorPositions.find(actor=>actor.id===id)||{x:195,y:370};
      effects.push({kind:'merge',start:clock,duration:1.5,x:actor.x,y:actor.y,id,star:star+1});
      notice(`${d.name} 合成 ${star+1} 星！`);
      playSound('merge');merged=true;
    }
    if(state.bench.length>8)state.bench.pop();
    selected=null;
    if(!merged){notice(`${d.name} 已加入备战席`);playSound('buy');}
    render();
  }
  function refreshShop() {
    if(state.gold<2)return notice('刷新需要 2 金币');
    state.gold-=2;state.reads++;
    const pool=state.reads%2?['thorn','ice','ao','blade','priest']:['ao','hammer','fire','bow','shadow'];
    state.shop=pool.slice();notice('已刷新五位伙伴');playSound('buy');render();
  }
  function chooseBench(index) {
    if(selected) {
      const from=state[selected.area];
      if(selected.area==='bench'&&selected.index===index) {
        overlay={type:'hero',id:state.bench[index].id,area:'bench',index};selected=null;return render();
      }
      [from[selected.index],state.bench[index]]=[state.bench[index],from[selected.index]];
      selected=null;notice('伙伴位置已调整');return render();
    }
    if(!state.bench[index])return;
    selected={area:'bench',index};boardView=true;
    notice('已选择伙伴，点阵型格上阵或换位');render();
  }
  function chooseBoard(index) {
    if(selected) {
      if(selected.area==='board'&&selected.index===index) {
        overlay={type:'hero',id:state.board[index].id,area:'board',index};selected=null;return render();
      }
      if(selected.area==='bench'&&!state.board[index]&&state.board.filter(Boolean).length>=content.capacity[state.wave-1])return notice('上阵人数已满，可替换场上伙伴');
      const from=state[selected.area];
      [from[selected.index],state.board[index]]=[state.board[index],from[selected.index]];
      selected=null;notice('阵型已调整');return render();
    }
    if(!state.board[index])return;
    selected={area:'board',index};notice('点另一个位置换位，再点自己查看详情');render();
  }

  function modalBase(title,subtitle,y=212,h=544) {
    rect(0,111,390,725,'#07101bd9');
    buttons=[];
    frame(18,y,354,h,'#203344',C.edge);
    text(title,35,y+27,24,C.text);
    text(subtitle,35,y+53,12,C.muted);
    action('close-modal','×',313,y+8,44,44,()=>{overlay=null;render();});
    rect(32,y+72,326,2,'#40586c');
    return y;
  }
  function heroModal() {
    const id=overlay.id;
    const d=byId[id];
    const y=modalBase('伙伴详情','点击场上伙伴，即可查看技能与羁绊',191,581);
    frame(35,y+89,106,131,'#2d4451');
    sprite(id,88,y+202,2,Math.sin(clock*2)>0?'attack':'idle');
    text(d.name,161,y+102,24,C.text);
    text(`${d.tribe} · ${d.job}`,161,y+131,12,C.mint);
    icon(jobIcon[d.job],161,y+151,18,C.gold);
    text(['守卫','战士','潜行者','工匠'].includes(d.job)?'近战 · 前排':'远程 · 后排',187,y+160,12,C.muted);
    icon('coin',161,y+182,17,C.gold);text(`${d.cost} 金币`,187,y+191,12,C.gold);
    rect(35,y+234,320,2,'#40586c');
    text(d.skill,36,y+257,12,C.gold);
    text('自动释放',353,y+257,12,C.muted,'right');
    wrap(d.desc,36,y+283,313,C.text,20);
    const tags=[d.tribe,d.extraTribe,d.job].filter(Boolean);
    const counts=tagCounts();
    tags.forEach((tag,i)=> {
      const py=y+335+i*51;
      const count=counts[tag]||0;
      const tier=activeTag(tag,count);
      const next=(rules[tag]||[]).find(([threshold])=>threshold>count);
      icon(jobIcon[tag]||'synergy',36,py-8,18,tier?C.mint:C.muted);
      text(tag,62,py+2,12,tier?C.mint:C.text);
      text(`${count}${next?'/'+next[0]:''}`,350,py+2,12,tier?C.mint:C.muted,'right');
      const desc=tier?tier[1]:next?`还差 ${next[0]-count} 位不同${tag}伙伴`:'该羁绊效果当前未接入';
      text(desc,62,py+23,12,C.muted);
    });
    action('hero-to-synergy','查看羁绊',36,y+513,152,44,()=>{overlay={type:'synergy'};render();},true);
    const slot=state.board.findIndex(card=>card&&card.id===id);
    action('hero-to-equipment','装备强化',200,y+513,152,44,()=>{if(slot<0){notice('先上阵伙伴再配置装备');overlay=null;}else overlay={type:'equipment',slot};render();});
  }
  function equipmentModal() {
    const card=state.board[overlay.slot];
    if(!card){overlay=null;return;}
    const y=modalBase('装备强化',`${byId[card.id].name} · 每位伙伴装备一件`,230,529);
    const items=[{id:'blade',name:'战意剑',desc:'提高普攻伤害',icon:'sword',color:C.gold},{id:'frost',name:'冰霜符',desc:'普攻附带减速',icon:'magic',color:C.blue},{id:'spark',name:'电弧符',desc:'普攻命中额外目标',icon:'arrow',color:C.purple}];
    items.forEach((item,i)=> {
      const py=y+94+i*99;
      const equipped=card.item?.id===item.id;
      frame(35,py,320,86,'#293f4e',equipped?item.color:null);
      frame(45,py+12,56,56,'#1c2e3d');icon(item.icon,59,py+24,28,item.color);
      text(item.name,115,py+21,12,item.color);
      text(equipped?`${card.item.level} 级 · 已装备`:item.desc,115,py+44,12,C.muted);
      if(equipped&&card.item.level>=2)text('已满级',339,py+62,12,C.mint,'right');
      else if(equipped||!card.item)action(`equip-${item.id}`,equipped?'升级 4G':'装备 4G',259,py+24,82,43,()=> {
        if(state.gold<4){notice('需要 4 金币');return;}
        state.gold-=4;
        if(card.item)card.item.level++;
        else card.item={id:item.id,level:1};
        notice(`${byId[card.id].name} · ${item.name} ${card.item.level}级`);playSound('merge');render();
      },equipped);
      else text('已有装备',338,py+63,12,C.muted,'right');
    });
    text('装备与升级各 4 金币，最高 2 级',195,y+419,12,C.muted,'center');
    action('equipment-back','返回伙伴',36,y+455,316,44,()=>{overlay={type:'hero',id:card.id};render();},true);
  }
  function synergyModal() {
    const y=modalBase('场上羁绊','只统计上阵的不同英雄，同名只算一次',171,601);
    const counts=tagCounts();
    const rows=Object.entries(counts).sort((a,b)=>Number(!!activeTag(b[0],b[1]))-Number(!!activeTag(a[0],a[1]))||b[1]-a[1]);
    const page=Math.min(overlay.page||0,Math.ceil(rows.length/6)-1);
    rows.slice(page*6,page*6+6).forEach(([name,count],i)=> {
      const py=y+91+i*70;
      const tier=activeTag(name,count);
      const next=(rules[name]||[]).find(([threshold])=>threshold>count);
      const thresholds=(rules[name]||[]).map(([threshold])=>threshold);
      rect(34,py,322,63,tier?'#2c4748':'#283b4d');
      rect(34,py,3,63,tier?C.mint:'#596e80');
      icon(jobIcon[name]||'synergy',46,py+11,22,tier?C.mint:C.muted);
      text(name,81,py+19,12,tier?C.mint:C.text);
      text(`${count}${next?'/'+next[0]:''}`,340,py+19,12,tier?C.mint:C.muted,'right');
      if(thresholds.length) {
        let tx=81+name.length*12+13;
        thresholds.forEach(threshold=>{text(threshold,tx,py+19,12,count>=threshold?C.gold:'#7a90a1');tx+=20;});
      }
      const desc=tier?tier[1]:next?`再上阵 ${next[0]-count} 位不同伙伴可激活`:'种族效果当前未接入';
      wrap(desc,46,py+44,296,C.muted,16);
    });
    text('备战席不计入羁绊',195,y+530,12,C.muted,'center');
    const pages=Math.ceil(rows.length/6);
    if(pages>1) {
      action('synergy-page','更多羁绊',35,y+548,111,42,()=>{overlay.page=(page+1)%pages;render();});
      text(`${page+1}/${pages}`,171,y+569,12,C.muted,'center');
      action('synergy-done','返回战场',203,y+548,151,42,()=>{overlay=null;render();},true);
    } else action('synergy-done','返回战场',36,y+548,316,42,()=>{overlay=null;render();},true);
  }
  function routeModal() {
    const y=modalBase('路线与支援','观察路线不影响队伍位置',249,474);
    ['上路','中路','下路'].forEach((name,i)=> {
      const py=y+92+i*67;
      frame(36,py,316,56,i===1?'#2c4a49':'#273d4e');
      icon('shield',49,py+17,20,i===1?C.mint:C.muted);
      text(`${name} · ${i===1?'我':'电脑队友'}`,80,py+19,12,C.text);
      text('防线 12 / 12',80,py+39,12,C.muted);
      action(`observe-${i}`,'观察',278,py+7,63,41,()=>{state.focus=i;overlay=null;notice(`正在观察${name}，队伍仍在中路`);render();},i===state.focus);
    });
    wrap('整队游走需要 3 秒，原防线可能被室友占用。最终波自动集结高地。',38,y+318,309,C.muted,21);
    action('route-recall','回城演出预览',37,y+388,315,47,()=>{overlay=null;effects.push({kind:'recall',start:clock,duration:1.8});notice('回城演出预览 · 正式移动需接入对局');render();},true);
  }
  function gallery() {
    frame(12,118,366,226,'#243a4a');
    const d=byId[galleryId];
    rect(27,135,138,184,'#2b4554');
    for(let y=150;y<305;y+=24)for(let x=37;x<157;x+=24)rect(x,y,1,1,'#577582');
    rect(45,297,100,4,'#466574');
    sprite(galleryId,96,295,3,Math.sin(clock*1.7)>.3?'attack':'idle');
    text(d.name,185,149,24,C.text);
    text(d.tribe,185,179,12,C.mint);
    icon(jobIcon[d.job],185,197,18,C.gold);
    text(d.job,211,206,12,C.gold);
    text(d.skill,185,242,12,C.text);
    wrap(d.desc,185,267,173,C.muted,19);
    text('611 室友与伙伴',18,364,12,C.text);
    text('点击切换',373,364,12,C.muted,'right');
    content.cards.forEach((card,i)=> {
      const col=i%4,row=Math.floor(i/4);
      const x=14+col*93,y=383+row*84;
      const active=galleryId===card.id;
      frame(x,y,83,77,active?'#314d4b':'#233a4a',active?C.mint:null);
      sprite(card.id,x+41,y+52,1,'idle');
      text(card.name,x+41,y+65,12,active?C.mint:C.text,'center');
      hotspot(`gallery-${card.id}`,`查看${card.name}`,x,y,83,77,()=>{galleryId=card.id;render();});
    });
    rect(160,837,70,3,'#71828d');
  }

  function effectActor(kind) {
    const ids={slash:'csy',spin:'ao',lightning:'tang',heal:'priest'};
    return actorPositions.find(actor=>actor.id===ids[kind])||actorPositions[0]||{x:195,y:360};
  }
  function trigger(kind) {
    if(scene==='heroes') {
      galleryId=({slash:'csy',spin:'ao',lightning:'tang',heal:'priest'})[kind];
      render();return;
    }
    if(overlay)overlay=null;
    const actor=effectActor(kind);
    if(kind==='heal')state.board.slice(0,3).forEach(card=>{if(card)card.hp=Math.min(1,card.hp+.22);});
    effects.push({kind,start:clock,duration:kind==='lightning'?.7:kind==='heal'?1.05:.65,x:actor.x,y:actor.y-15});
    if(effects.length>24)effects.shift();
    if(kind==='slash'&&!reduced)hitStop=.045;
    playSound(kind);
    render();
  }
  function pixelLine(x1,y1,x2,y2,color,width=2) {
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2));
    for(let i=0;i<=steps;i++)rect(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,width,width,color);
  }
  function ring(x,y,radius,start,end,color,thickness=3) {
    for(let a=start;a<end;a+=.055)rect(x+Math.cos(a)*radius,y+Math.sin(a)*radius,thickness,thickness,color);
  }
  function particles(x,y,progress,color,count=8) {
    for(let i=0;i<count;i++) {
      const a=i*Math.PI*2/count;
      const radius=7+progress*23;
      rect(x+Math.cos(a)*radius,y+Math.sin(a)*radius,progress<.5?3:2,progress<.5?3:2,color);
    }
  }
  function paintEffects() {
    effects=effects.filter(effect=>clock-effect.start<effect.duration);
    effects.forEach(effect=> {
      const p=Math.max(0,(clock-effect.start)/effect.duration);
      const x=effect.x||195,y=effect.y||350;
      ctx.save();
      ctx.globalAlpha=Math.min(1,(1-p)*2.2);
      if(effect.kind==='slash') {
        const a=-Math.PI*.96+p*Math.PI*.75;
        ring(x,y-22,27,a,a+1.55,C.gold,5);
        ring(x,y-22,33,a+.1,a+1.2,'#fff3cf',3);
        particles(x+7,y-44,p,'#ffde92',7);
        text('36',x+24,y-49-p*18,24,C.gold,'center');
      }
      if(effect.kind==='spin') {
        ring(x,y,31+p*13,p*8,p*8+4.7,C.gold,4);
        ring(x,y,39+p*9,p*8+1,p*8+3.5,'#fff0b2',3);
        particles(x,y,p,C.gold,10);
        text('反击螺旋',x,y-55-p*10,12,C.gold,'center');
        for(let i=0;i<3;i++)text('24',x-40+i*40,y-31-p*14,12,C.gold,'center');
      }
      if(effect.kind==='lightning') {
        rect(12,145,366,340,'#07111b38');
        let from={x,y:y-8};
        const targets=monsterPositions.length?monsterPositions.slice(0,3):[{x:161,y:273},{x:224,y:265},{x:196,y:229}];
        targets.forEach((target,i)=> {
          const midX=(from.x+target.x)/2+((i%2)?-8:8),midY=(from.y+target.y)/2;
          pixelLine(from.x,from.y,midX,midY,C.blue,4);
          pixelLine(midX,midY,target.x,target.y,'#e8fbff',2);
          particles(target.x,target.y,p,C.blue,5);
          text('42',target.x+12,target.y-20-p*10,12,C.blue,'center');
          from=target;
        });
        text('一杖断灯',195,182,12,C.blue,'center');
      }
      if(effect.kind==='heal') {
        const targets=actorPositions.filter(actor=>actor.slot<3);
        targets.forEach((target,i)=> {
          ring(target.x,target.y-12,13+p*16,0,Math.PI*2,C.mint,2);
          icon('heal',target.x-7,target.y-49-p*17,14,C.mint);
          text('+32',target.x+18,target.y-34-p*18,12,C.mint,'center');
        });
        text('鲜血之潮 · 治疗',195,182,12,C.mint,'center');
      }
      if(effect.kind==='merge') {
        particles(x,y-20,p,C.gold,16);
        ring(x,y-20,20+p*30,0,Math.PI*2,C.gold,3);
        frame(83,268,224,59,'#514733',C.gold);
        text(`${byId[effect.id].name} 升星！`,195,287,12,C.gold,'center');
        text('★'.repeat(effect.star),195,311,24,'#fff0b0','center');
      }
      if(effect.kind==='interrupt') {
        pixelLine(245,425,145,313,C.blue,4);
        particles(145,313,p,C.blue,12);
        text('打断！',145,283-p*22,24,C.mint,'center');
      }
      if(effect.kind==='recall') {
        actorPositions.forEach(actor=> {
          ring(actor.x,actor.y,15+p*7,0,Math.PI*2,C.blue,3);
          rect(actor.x-1,actor.y-60*p,2,40*p,C.blue);
        });
      }
      ctx.restore();
    });
    if(scene==='battle'&&!overlay) {
      const p=(clock*.8)%1;
      const from=actorPositions.find(actor=>actor.id==='hong');
      const to=monsterPositions[4];
      if(from&&to&&p<.48) {
        const travel=p/.48;
        const x=from.x+(to.x-from.x)*travel,y=from.y-22+(to.y-from.y+22)*travel;
        rect(x,y,3,9,C.gold);rect(x,y+8,2,6,'#9d8d64');
      }
    }
  }
  function toastLayer() {
    if(!toast||clock>=toast.until)return;
    const width=Math.min(354,toast.message.length*12+24);
    frame((390-width)/2,449,width,33,'#1d343e',C.gold);
    text(toast.message,195,465,12,C.gold,'center');
  }
  function updateHotspots() {
    const key=buttons.map(button=>[button.id,button.label,Math.round(button.x),Math.round(button.y),Math.round(button.w),Math.round(button.h)].join(',')).join('|');
    if(key===buttonKey)return;
    buttonKey=key;
    const focused=document.activeElement?.dataset?.hotspot;
    const layer=document.querySelector('#hotspots');
    const currentIds=Array.from(layer.children,element=>element.dataset.hotspot).join('|');
    const nextIds=buttons.map(button=>button.id).join('|');
    if(currentIds!==nextIds)layer.replaceChildren(...buttons.map(button=> {
      const element=document.createElement('button');
      element.type='button';element.className='hotspot';element.dataset.hotspot=button.id;
      element.addEventListener('click',()=>buttons.find(current=>current.id===button.id)?.fn());
      return element;
    }));
    buttons.forEach((button,index)=> {
      const element=layer.children[index];
      element.setAttribute('aria-label',button.label);element.title=button.label;
      Object.assign(element.style,{left:`${button.x}px`,top:`${button.y}px`,width:`${button.w}px`,height:`${button.h}px`});
    });
    if(focused&&currentIds!==nextIds)layer.querySelector(`[data-hotspot="${focused}"]`)?.focus({preventScroll:true});
  }
  function render() {
    if(!state)return;
    buttons=[];
    ctx.setTransform(2,0,0,2,0,0);
    ctx.imageSmoothingEnabled=false;
    art.backdrop(ctx,{width:390,height:844,time:clock});
    topHud();
    if(scene==='heroes')gallery();
    else {
      const shake=effects.some(effect=>['slash','spin'].includes(effect.kind)&&clock-effect.start<.09)&&!reduced?2:0;
      ctx.save();ctx.translate(shake,0);
      const lanes=art.arena(ctx,{x:12,y:145,w:366,h:343,focus:state.focus,time:clock,boss:scene==='boss',formation:scene==='prepare'});
      laneLabels(lanes);
      if(scene==='boss')bossWorld(lanes);
      else if(scene==='prepare')prepareWorld(lanes);
      else combatWorld(lanes);
      paintEffects();ctx.restore();
      synergyStrip();benchPanel();
      if(boardView)formationPanel();else shopPanel();
      bottomTabs();
    }
    toastLayer();
    if(overlay?.type==='hero')heroModal();
    if(overlay?.type==='synergy')synergyModal();
    if(overlay?.type==='routes')routeModal();
    if(overlay?.type==='equipment')equipmentModal();
    updateHotspots();
  }
  function setScene(next) {
    scene=sceneInfo[next]?next:'battle';
    state=newState(scene);overlay=null;selected=null;boardView=false;effects=[];toast=null;
    if(scene==='synergy')overlay={type:'synergy'};
    const info=sceneInfo[scene];
    document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===scene)));
    document.querySelector('#scene-label').textContent=info.label;
    document.querySelector('#scene-caption').textContent=info.caption;
    document.querySelector('#demo-title').textContent=info.title;
    document.querySelector('#demo-description').textContent=info.description;
    document.querySelector('#note-title').textContent=info.note;
    document.querySelector('#note-content').textContent=info.body;
    document.querySelector('#interaction-hint').textContent=info.hint;
    history.replaceState(null,'','#'+scene);
    buttonKey='';render();
  }
  function playSound(kind) {
    if(!sound)return;
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const now=audioContext.currentTime;
    const oscillator=audioContext.createOscillator();
    const volume=audioContext.createGain();
    const frequencies={slash:[120,45],spin:[210,65],lightning:[700,110],heal:[520,860],merge:[520,1040],buy:[800,1200]};
    const [start,end]=frequencies[kind]||[200,60];
    oscillator.type=kind==='heal'||kind==='merge'?'sine':'triangle';
    oscillator.frequency.setValueAtTime(start,now);
    oscillator.frequency.exponentialRampToValueAtTime(end,now+.08);
    volume.gain.setValueAtTime(.0001,now);
    volume.gain.exponentialRampToValueAtTime(.065,now+.006);
    volume.gain.exponentialRampToValueAtTime(.0001,now+.12);
    oscillator.connect(volume);volume.connect(audioContext.destination);
    oscillator.start(now);oscillator.stop(now+.13);
  }
  function tick(now) {
    const dt=Math.min(.05,(now-last)/1000);last=now;
    if(!paused&&!document.hidden&&!overlay) {
      if(hitStop>0)hitStop-=dt;
      else clock+=dt;
      if(scene==='boss'&&!state.bossInterrupted&&clock-state.baseTime>=5)state.ritualFailed=true;
      if(scene==='battle'&&!overlay) {
        state.board.forEach((card,index)=>{if(card)card.hp=Math.max(.34,card.hp-dt*(index<4?.012:.003));});
        const beat=Math.floor(clock/.9);
        if(beat!==lastAuto) {
          lastAuto=beat;
          const kind=beat%9===7?'lightning':beat%9===5?'heal':beat%5===3?'spin':'slash';
          const actor=effectActor(kind);
          if(kind==='heal')state.board.slice(0,3).forEach(card=>{if(card)card.hp=Math.min(1,card.hp+.22);});
          effects.push({kind,start:clock,duration:kind==='heal'?1:.57,x:actor.x,y:actor.y-15});
          if(kind==='slash'&&!reduced)hitStop=.045;
          playSound(kind);
        }
      }
    }
    if(now-lastPaint>32) {render();lastPaint=now;}
    requestAnimationFrame(tick);
  }
  function resize() {
    const column=document.querySelector('.preview-column');
    const shell=document.querySelector('.phone-shell');
    const width=Math.min(414,column.parentElement.clientWidth,window.innerWidth-36);
    const inner=width-24;
    shell.style.width=width+'px';
    canvas.style.width=inner+'px';canvas.style.height=inner*844/390+'px';
    const hotspots=document.querySelector('#hotspots');
    hotspots.style.transformOrigin='top left';hotspots.style.transform=`scale(${inner/390})`;
  }
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setScene(button.dataset.scene)));
  document.querySelectorAll('[data-effect]').forEach(button=>button.addEventListener('click',()=>trigger(button.dataset.effect)));
  document.querySelector('#pause').addEventListener('click',event=> {
    paused=!paused;event.currentTarget.textContent=paused?'继续演出':'暂停演出';event.currentTarget.setAttribute('aria-pressed',String(paused));
  });
  document.querySelector('#sound').addEventListener('click',event=> {
    sound=!sound;event.currentTarget.textContent=sound?'音效开':'音效关';event.currentTarget.setAttribute('aria-pressed',String(sound));
    if(sound)playSound('buy');
  });
  document.querySelector('#motion').setAttribute('aria-pressed',String(reduced));
  document.querySelector('#motion').addEventListener('click',event=> {
    reduced=!reduced;event.currentTarget.setAttribute('aria-pressed',String(reduced));event.currentTarget.textContent=reduced?'震动已减弱':'减弱震动';
  });
  window.addEventListener('resize',resize);
  window.addEventListener('hashchange',()=>setScene(location.hash.slice(1)));
  window.__prototype={
    setScene,trigger,
    getState:()=>JSON.parse(JSON.stringify({scene,state,overlay,selected,boardView,clock,effects})),
    renderAt(time,mode,kind) {paused=true;clock=time;if(mode)setScene(mode);effects=[];if(kind)trigger(kind);clock+=.16;render();},
    seek(time) {paused=true;clock=time;render();},
    buttonBounds:()=>buttons.map(({id,x,y,w,h})=>({id,x,y,w,h})),
    ready:document.fonts.load('12px FusionPixel')
  };
  setScene(location.hash.slice(1)||'battle');resize();
  document.fonts.ready.then(render);
  requestAnimationFrame(tick);
})();
