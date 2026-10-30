'use strict';
const C=require('./core');
const P=require('./progression');
const config=require('./config');
const canvas=wx.createCanvas(),ctx=canvas.getContext('2d');
const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
const sw=info.windowWidth,sh=info.windowHeight,dpr=Math.min(info.pixelRatio||1,3);
canvas.width=sw*dpr;canvas.height=sh*dpr;
const scale=sw/390, vh=sh/scale;
const top=Math.max(28,(info.safeArea?info.safeArea.top:0)/scale+8);
let page='home',role=0,state=null,myId='me',socket=null,room=null,error='',toast='',toastUntil=0;
let serverUrl=config.serverUrl,profile=P.normalize(wx.getStorageSync('611.profile')),settled=false,award=0;
let buttons=[],joy=null,hidden=false,last=Date.now(),sendAt=0,lastMessage=0,keys={};
const colors={bg:'#101d29',panel:'#1b2c3a',ink:'#f5eedf',muted:'#8fa6b8',mint:'#7edac8',gold:'#ffcf82'};
function text(t,x,y,size=16,color=colors.ink,align='left'){ctx.fillStyle=color;ctx.font=`${size}px sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(t),x,y);}
function box(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}}
function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function button(label,x,y,w,h,fn,accent=false){box(x,y,w,h,accent?colors.mint:colors.panel,accent?null:'#385165');text(label,x+w/2,y+h/2,16,accent?colors.bg:colors.ink,'center');buttons.push({x,y,w,h,fn});}
function note(t){toast=t;toastUntil=Date.now()+3200;}
function save(){try{wx.setStorageSync('611.profile',profile);}catch(e){note('成长保存失败，请检查存储空间');}}
function stopSocket(){if(socket){const old=socket;socket=null;old.close({});}room=null;}
function home(){stopSocket();state=null;page='home';joy=null;keys={};}
function solo(){stopSocket();myId='me';settled=false;award=0;state=C.createGame([{id:'me',name:'我',role,level:P.level(profile)},{id:'bot1',name:'老伙计·电脑',role:(role+1)%3,bot:true},{id:'bot2',name:'好室友·电脑',role:(role+2)%3,bot:true}],Date.now());page='game';}
function send(type,data={}){if(socket)socket.send({data:JSON.stringify(Object.assign({type},data)),fail:()=>note('发送失败，请检查连接')});}
function connect(action,code){
  stopSocket();error='';page='connecting';let opened=false;const ws=wx.connectSocket({url:serverUrl});socket=ws;
  const timeout=setTimeout(()=>{if(socket===ws&&page==='connecting'){stopSocket();page='home';error='连接超时，请确认服务器已启动和地址正确';}},10000);
  ws.onOpen(()=>{if(socket!==ws)return;opened=true;lastMessage=Date.now();send(action,{code,name:'611室友',role,level:P.level(profile)});});
  ws.onMessage(e=>{if(socket!==ws)return;lastMessage=Date.now();let m;try{m=JSON.parse(e.data);}catch(e){return;}
    if(m.type==='room'){room=m.room;myId=m.id;page='lobby';}
    if(m.type==='state'){state=m.state;myId=m.id;page='game';}
    if(m.type==='error'){error=m.message;if(page==='connecting'){stopSocket();page='home';}else note(m.message);}
  });
  ws.onError(()=>{if(socket!==ws)return;error='连不上房间服务器，请检查地址和网络';stopSocket();page='home';});
  ws.onClose(()=>{clearTimeout(timeout);if(socket!==ws)return;socket=null;room=null;error=opened?'连接已断开，请回首页重新加入':'无法连接服务器';state=null;page='home';});
}
function join(){wx.showModal({title:'加入 611 房间',editable:true,placeholderText:'输入六位房间号',success:r=>{if(r.confirm){const code=(r.content||'').trim();if(/^\d{6}$/.test(code))connect('join',code);else note('请输入六位数字房间号');}}});}
function settings(){wx.showModal({title:'房间服务器地址',content:serverUrl,editable:true,placeholderText:'ws://电脑地址:6110',success:r=>{if(r.confirm){const url=(r.content||'').trim();if(/^wss?:\/\//.test(url)){serverUrl=url;note('服务器地址已修改，本次有效');}else note('地址需要以 ws:// 或 wss:// 开头');}}});}
function header(tag){text('611',24,top+22,42,colors.mint);text(tag,108,top+24,14,colors.muted);box(24,top+57,342,1,'#304653');}
function renderHome(){
  header('今晚，老地方见');
  text('今晚守家',24,top+103,35);text('一人练默契，一起守 611。',24,top+140,16,colors.muted);
  const cy=top+224;
  circle(195,cy,61,'#1b3b40');circle(195,cy,43,'#285450');
  ctx.beginPath();ctx.moveTo(195,cy-40);ctx.lineTo(224,cy);ctx.lineTo(195,cy+40);ctx.lineTo(166,cy);ctx.closePath();ctx.fillStyle=colors.mint;ctx.fill();text('611',195,cy,20,colors.bg,'center');
  text('自动攻击 · 手动放技能 · 6 分钟一局',195,cy+84,14,colors.muted,'center');
  const ry=cy+115;
  C.ROLES.forEach((r,i)=>{const x=24+i*116;button(r.name,x,ry,110,46,()=>{role=i;},role===i);});
  text(C.ROLES[role].desc,195,ry+68,14,C.ROLES[role].color,'center');
  button('单人出发 · 两位电脑室友',24,ry+96,342,51,solo,true);
  button('创建房间',24,ry+160,165,48,()=>connect('create'));
  button('输入房间号',201,ry+160,165,48,join);
  text(`室友默契 Lv.${P.level(profile)}  ·  普攻 +${P.level(profile)}%  ·  ${profile.xp} 经验`,195,ry+234,14,colors.gold,'center');
  text(`已完成 ${profile.runs} 局 · 胜利 ${profile.wins} 局 · 上限 +5%`,195,ry+258,12,colors.muted,'center');
  button('联机地址设置',114,ry+282,162,33,settings);
  if(error)text(error.slice(0,25),195,ry+334,12,'#ff9f98','center');
}
function renderLobby(){
  header('室友集合中');text('房间号',195,top+108,16,colors.muted,'center');text(room.code,195,top+155,43,colors.gold,'center');
  text('把六位数字告诉朋友，使用同一服务器。',195,top+201,13,colors.muted,'center');
  room.members.forEach((p,i)=>{const y=top+243+i*46;box(24,y,342,39,colors.panel);text(`${i+1}  ${p.name}${p.id===myId?'（我）':''}${p.id===room.host?' · 房主':''}`,36,y+19,14);text(C.ROLES[p.role].name,350,y+19,14,C.ROLES[p.role].color,'right');});
  const y=top+536;
  if(room.host===myId)button(room.members.length>=2?'全员出发':'等待至少两位室友',24,y,342,49,()=>send('start'),room.members.length>=2);
  else text('等待房主开始',195,y+23,16,colors.muted,'center');
  button('离开房间',110,y+65,170,40,home);
}
function arenaRect(){const height=Math.min(500,Math.max(260,vh-top-211));return {x:(390-height*390/500)/2,y:top+90,k:height/500,h:height};}
function renderArena(){
  const a=arenaRect();ctx.save();ctx.translate(a.x,a.y);ctx.scale(a.k,a.k);
  box(0,0,390,500,'#172a34');
  ctx.strokeStyle='#223d47';ctx.lineWidth=1;for(let x=0;x<390;x+=39){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,500);ctx.stroke();}for(let y=0;y<500;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(390,y);ctx.stroke();}
  [[12,60],[326,60],[12,380],[326,380]].forEach(([x,y])=>{box(x,y,52,70,'#263f49','#39535b');box(x+6,y+7,40,24,'#3f6265');});
  circle(195,250,48,'#254c4d');circle(195,250,36,'#346960');
  ctx.save();ctx.translate(195,250);ctx.rotate(Math.PI/4);box(-19,-19,38,38,colors.mint);ctx.restore();text('611',195,252,16,colors.bg,'center');
  state.enemies.forEach(e=>{circle(e.x,e.y,e.boss?24:e.fast?8:11,e.boss?'#e78199':e.slow>0?'#95cfea':e.fast?'#f4c078':'#c68c82');
    circle(e.x-3,e.y-2,2,'#1c2732');circle(e.x+3,e.y-2,2,'#1c2732');
    if(e.boss){text('断电巨兽',e.x,e.y-36,12,'#f4acb9','center');box(e.x-27,e.y+31,54,4,'#43323b');box(e.x-27,e.y+31,54*Math.max(0,e.hp/e.maxHp),4,'#ff9ca5');}
  });
  state.players.forEach(p=>{const color=C.ROLES[p.role].color;
    if(p.hp<=0){text(`起身 ${Math.ceil(p.down)}s`,p.x,p.y,12,colors.muted,'center');return;}
    if(p.id===myId){ctx.beginPath();ctx.arc(p.x,p.y,21,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}
    circle(p.x,p.y,13,color);text(['盾','星','补'][p.role],p.x,p.y,12,colors.bg,'center');
    text(p.id===myId?'我':p.name.slice(0,5),p.x,p.y-27,11,color,'center');box(p.x-17,p.y+20,34,4,'#493c3b');box(p.x-17,p.y+20,34*p.hp/100,4,color);
    if(p.shield>0){ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.strokeStyle='#ffffff';ctx.stroke();}
  });
  state.fx.forEach(f=>{ctx.globalAlpha=Math.min(1,f.life/.24);ctx.strokeStyle=f.color;ctx.lineWidth=f.kind==='bolt'?3:2;ctx.beginPath();
    if(f.kind==='bolt'){ctx.moveTo(f.x,f.y);ctx.lineTo(f.x2,f.y2);}else ctx.arc(f.x,f.y,f.r*(1-f.life/.3),0,Math.PI*2);ctx.stroke();});ctx.globalAlpha=1;
  ctx.restore();
}
function renderGame(){
  const p=state.players.find(p=>p.id===myId);if(!p)return;
  const remaining=Math.max(0,Math.ceil(360-state.time));
  text('611 / 今晚守家',20,top+15,18,colors.mint);text(`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`,370,top+15,22,colors.gold,'right');
  text(`第 ${state.wave} 波 · 击败 ${state.kills} · ${socket?'联机':'单人 + 电脑队友'}`,20,top+44,12,colors.muted);
  box(20,top+64,350,8,'#3c3c3d');box(20,top+64,350*state.base/611,8,colors.mint);text(`水晶 ${Math.ceil(state.base)}/611`,195,top+82,11,colors.muted,'center');
  renderArena();const a=arenaRect(),y=a.y+a.h+47;
  circle(70,y,39,'#253e4e');circle(70+(joy?joy.dx:0)*25,y+(joy?joy.dy:0)*25,18,'#527384');text('拖动移动',70,y+57,12,colors.muted,'center');
  button(p.cd>0?`${Math.ceil(p.cd)} 秒`:C.ROLES[p.role].skill,239,y-31,130,60,()=>cast(),p.cd<=0);text('自动攻击 · 技能点这里',302,y+47,11,colors.muted,'center');
  button('退出',156,y+29,65,31,()=>wx.showModal({title:'退出本局？',content:'退出不会获得本局成长。',success:r=>{if(r.confirm)home();}}));
  if(state.time<9)text('靠近敌人自动攻击，守住中央水晶',195,a.y+a.h/2-75,14,colors.gold,'center');
  if(p.choices.length)renderChoices(p);
  if(state.status!=='playing')renderEnd();
}
function renderChoices(p){
  box(15,top+180,360,269,'#13232f','#78938e');text('开黑补给 · 三选一',195,top+207,21,colors.gold,'center');text('战斗继续，抓紧选！',195,top+234,12,colors.muted,'center');
  p.choices.forEach((id,i)=>{const u=C.UPGRADES.find(u=>u.id===id),y=top+258+i*58;button(`${u.name}  ·  ${u.desc}`,25,y,340,49,()=>{if(socket)send('choose',{choice:id});else C.choose(state,myId,id);});});
}
function renderEnd(){
  box(15,top+178,360,318,'#13232f','#7edac8');text(state.status==='won'?'611 守住了！':'今晚差一点，再来！',195,top+215,26,colors.gold,'center');
  text(state.status==='won'?'老地方，老伙计，下次还一起。':state.base<=0?'水晶熄灭了，试试多带一位补给。':'六分钟到了，下次优先集火断电巨兽。',195,top+252,13,colors.muted,'center');
  text(`守护 ${Math.floor(state.time)} 秒 · 击败 ${state.kills}`,195,top+287,16,colors.ink,'center');
  text(`默契经验 +${award} · Lv.${P.level(profile)} · 普攻 +${P.level(profile)}%`,195,top+324,16,colors.mint,'center');
  text('成长保存在本机，单人和联机通用',195,top+352,12,colors.muted,'center');
  button('回到寝室',65,top+391,260,54,home,true);
}
function cast(){if(!state||state.status!=='playing')return;if(socket)send('skill');else C.skill(state,myId);}
function setInput(x,y){if(!state||state.status!=='playing')return;const p=state.players.find(p=>p.id===myId);if(p)p.input={x,y};if(socket)send('input',{x,y});}
function touchStart(touches){for(const t of touches){const x=t.clientX/scale,y=t.clientY/scale;
  const b=buttons.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(b){b.fn();continue;}
  if(page==='game'&&state&&state.status==='playing'){const a=arenaRect(),cy=a.y+a.h+47;if(x<145&&y>cy-58&&y<cy+58&&!joy)joy={id:t.identifier,x,y,dx:0,dy:0};}
}}
wx.onTouchStart(e=>touchStart(e.changedTouches));
wx.onTouchMove(e=>{if(!joy)return;const t=e.touches.find(t=>t.identifier===joy.id);if(!t)return;const dx=(t.clientX/scale-joy.x)/38,dy=(t.clientY/scale-joy.y)/38,n=Math.max(1,Math.hypot(dx,dy));joy.dx=dx/n;joy.dy=dy/n;});
function touchEnd(e){if(joy&&e.changedTouches.some(t=>t.identifier===joy.id)){joy=null;setInput(0,0);}}
wx.onTouchEnd(touchEnd);if(wx.onTouchCancel)wx.onTouchCancel(touchEnd);
wx.onHide(()=>{hidden=true;joy=null;keys={};setInput(0,0);});wx.onShow(()=>{hidden=false;last=Date.now();});
if(wx.onKeyDown)wx.onKeyDown(e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')cast();});
if(wx.onKeyUp)wx.onKeyUp(e=>{keys[e.key.toLowerCase()]=false;});
function frame(){
  const now=Date.now(),dt=Math.min(.1,(now-last)/1000);last=now;
  if(!hidden&&page==='game'&&state){
    if(state.status==='playing'){
      const x=joy?joy.dx:(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=joy?joy.dy:(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
      if(now-sendAt>66){setInput(x,y);sendAt=now;}if(!socket)C.step(state,dt);
    }
    if(state.status!=='playing'&&!settled){settled=true;award=P.reward(state);profile=P.settle(profile,state);save();joy=null;}
  }
  if(socket&&now-lastMessage>15000){stopSocket();state=null;page='home';error='服务器没有响应，请重新连接';}
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);box(0,0,390,vh,colors.bg);buttons=[];
  if(page==='home')renderHome();else if(page==='lobby'&&room)renderLobby();else if(page==='game'&&state)renderGame();else{text('正在连接寝室…',195,250,22,colors.mint,'center');button('取消',110,310,170,45,home);}
  if(now<toastUntil){box(15,vh-63,360,42,'#35534e');text(toast.slice(0,26),195,vh-42,13,colors.ink,'center');}
  requestAnimationFrame(frame);
}
frame();
