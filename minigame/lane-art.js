'use strict';

const {frame: insetFrame} = require('./adventure/scene-art');

const palettes = {
  chapel: {
    background:'#17131a', panel:'#281f26', edge:'#765548', light:'#e4b987',
    wallTrim:'#95654d', shadow:'#110e15', accent:'#f0bb7d', selected:'#4b302c',
    stone:['#382a31','#412d34','#48323a'], joint:'#281d28', rim:'#825744',
    path:'#5c3038', trim:'#a26250', night:'#221923', glow:'241,125,77'
  },
  tower: {
    background:'#121422', panel:'#212239', edge:'#585e86', light:'#c9c3eb',
    wallTrim:'#747ca0', shadow:'#0d101e', accent:'#bfd1fc', selected:'#394369',
    stone:['#2a3048','#30374e','#393e56'], joint:'#202439', rim:'#626e91',
    path:'#353a57', trim:'#7b8eb8', night:'#15172a', glow:'155,177,250'
  },
  rescue: {
    background:'#171820', panel:'#252630', edge:'#73624f', light:'#e4c8a1',
    wallTrim:'#8c7656', shadow:'#10131b', accent:'#f1cd8f', selected:'#4c3d38',
    stone:['#37343a','#3e373d','#454048'], joint:'#25242e', rim:'#76634f',
    path:'#4d3d3c', trim:'#b08b5e', night:'#20202c', glow:'244,155,83'
  }
};

function palette(chapter, mode) {
  return palettes[mode==='rescue'?'rescue':chapter] || palettes.chapel;
}

function rect(ctx,x,y,w,h,color) {
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
}

function shape(ctx,points,color) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.closePath();
  ctx.fill();
}

function frame(ctx,x,y,w,h,skin,active=false) {
  insetFrame(ctx,x,y,w,h,active?{...skin,panel:skin.selected,edge:skin.accent}:skin);
}

function glow(ctx,x,y,r,color,alpha) {
  const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
  gradient.addColorStop(0,'rgba('+color+','+alpha+')');
  gradient.addColorStop(1,'rgba('+color+',0)');
  rect(ctx,x-r,y-r,2*r,2*r,gradient);
}

function backdrop(ctx,w,h,skin) {
  const gradient=ctx.createLinearGradient(0,0,0,h);
  gradient.addColorStop(0,skin.night);
  gradient.addColorStop(.58,skin.background);
  gradient.addColorStop(1,skin.shadow);
  rect(ctx,0,0,w,h,gradient);
  rect(ctx,6,32,1,h-60,skin.wallTrim);
  rect(ctx,w-7,32,1,h-60,skin.wallTrim);
}

function lamp(ctx,x,y,skin,time,tower,halo=true) {
  if(halo)glow(ctx,x,y,22,skin.glow,.2);
  rect(ctx,x-3,y-2,6,12,skin.shadow);
  rect(ctx,x-2,y+4,4,7,skin.rim);
  const spark=Math.floor(time*7+x)%3;
  rect(ctx,x-2,y-5-spark,4,8,tower?'#8097d2':'#d97c54');
  rect(ctx,x-1,y-3-spark,2,6,skin.light);
  rect(ctx,x-4,y+4,8,2,skin.trim);
}

function gate(ctx,cx,y,width,skin,tower,lit) {
  const half=width/2;
  shape(ctx,[[cx-half,y+32],[cx-half,y+14],[cx-half*.65,y+6],[cx,y],
    [cx+half*.65,y+6],[cx+half,y+14],[cx+half,y+32]],skin.rim);
  shape(ctx,[[cx-half+4,y+31],[cx-half+4,y+16],[cx-half*.54,y+9],[cx,y+4],
    [cx+half*.54,y+9],[cx+half-4,y+16],[cx+half-4,y+31]],skin.shadow);
  if(tower){
    for(const side of [-1,1]){
      const x=cx+side*(half-3);
      rect(ctx,x-2,y+1,4,30,skin.trim);
      rect(ctx,x-1,y+7,2,16,skin.rim);
      rect(ctx,x-3,y+23,6,2,skin.light);
    }
    rect(ctx,cx-3,y+8,6,8,lit?skin.accent:skin.rim);
  }else{
    const glass=lit?'#b75e56':'#6e3c49';
    for(let x=cx-half+9;x<cx+half-6;x+=8){
      rect(ctx,x,y+14,5,13,glass);
      rect(ctx,x+1,y+15,2,4,lit?'#e8a16f':'#9e5b53');
      rect(ctx,x,y+22,5,1,skin.shadow);
    }
    rect(ctx,cx-half+5,y+28,width-10,2,skin.trim);
  }
}

function ground(ctx,x,y,w,h,skin,tower,detail) {
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  rect(ctx,x,y,w,h,skin.joint);
  for(let row=0;row<Math.ceil(h/22);row++){
    for(let col=-1;col<Math.ceil(w/32);col++){
      const px=x+col*32-(row%2)*16,py=y+row*22;
      const n=(col+11)*17+row*13;
      rect(ctx,px+1,py+1,30,20,skin.stone[n%3]);
      if(detail&&n%4===0){
        rect(ctx,px+7,py+7,10,1,skin.rim);
        rect(ctx,px+17,py+8,1,5,skin.joint);
        rect(ctx,px+17,py+13,5,1,skin.joint);
      }
    }
  }
  const runner=Math.min(tower?w*.31:w*.36,76);
  const center=x+w/2;
  rect(ctx,center-runner/2,y,runner,h,skin.path);
  for(const side of [-1,1])rect(ctx,center+side*(runner/2-3),y,1,h,skin.trim);
  if(tower){
    for(let py=y+14;py<y+h-10;py+=31){
      rect(ctx,center-4,py,8,1,skin.trim);
      rect(ctx,center-1,py-2,2,5,skin.trim);
    }
  }
  ctx.restore();
}

function towerPost(ctx,x,y,skin,lost,focus,tower) {
  rect(ctx,x-17,y+13,34,4,skin.shadow);
  if(lost){
    rect(ctx,x-13,y+5,11,9,skin.rim);
    rect(ctx,x-12,y+5,6,2,skin.trim);
    rect(ctx,x+2,y+9,9,6,skin.stone[1]);
    rect(ctx,x+11,y+5,4,4,skin.trim);
    return;
  }
  rect(ctx,x-13,y-5,26,20,skin.rim);
  rect(ctx,x-9,y-1,18,13,skin.path);
  rect(ctx,x-15,y-8,30,4,skin.trim);
  rect(ctx,x-10,y-13,4,7,skin.rim);
  rect(ctx,x+6,y-13,4,7,skin.rim);
  rect(ctx,x-2,y-1,4,10,focus?skin.accent:skin.trim);
  if(tower)rect(ctx,x-2,y-18,4,7,skin.light);
}

function routeDetails(ctx,lane,skin,tower,wave) {
  const {x,y,w,h}=lane;
  for(const side of [-1,1]){
    const edge=x+w/2+side*(w/2-8);
    for(let py=y+53;py<y+h-27;py+=72){
      if(tower){
        rect(ctx,edge-3,py-2,6,24,skin.shadow);
        for(let link=0;link<4;link++)rect(ctx,edge-1+(link%2),py+link*5,2,4,skin.trim);
        rect(ctx,edge-3,py+21,6,2,skin.rim);
      }else{
        const column=side<0?edge-4:edge-3;
        rect(ctx,column,py,7,17,skin.shadow);
        rect(ctx,column+1,py+1,5,13,skin.rim);
        rect(ctx,column+1,py+2,5,2,wave>=3?'#a65956':skin.trim);
      }
    }
  }
}

function particles(ctx,x,y,w,h,skin,time,tower,count=20) {
  ctx.save();
  for(let i=0;i<count;i++){
    const px=x+(((i*97)%307)/307*w+time*(tower?9:3))%w;
    const py=y+h-(((i*71)%239)/239*h+time*(tower?5:11))%h;
    ctx.globalAlpha=.15+.24*(.5+.5*Math.sin(time*1.9+i));
    rect(ctx,Math.round(px),Math.round(py),i%5===0?3:2,1,i%3===0?skin.light:skin.trim);
  }
  ctx.restore();
}

function arena(ctx,{x,y,w,h,focus,time,chapter,mode,wave,lost,alertLane}) {
  const skin=palette(chapter,mode),tower=chapter==='tower';
  frame(ctx,x,y,w,h,skin);
  ctx.save();ctx.beginPath();ctx.rect(x+4,y+4,w-8,h-8);ctx.clip();
  rect(ctx,x+4,y+4,w-8,h-8,skin.night);
  if(tower){
    for(let i=0;i<6;i++)rect(ctx,x+8+i*62,y+24+i%2*12,35,2,skin.stone[0]);
  }else{
    for(let i=0;i<8;i++)rect(ctx,x+6+i*47,y+22,38,9,skin.stone[i%3]);
  }
  const available=w-32;
  const wide=Math.round(available*.52/2)*2;
  const narrow=Math.floor((available-wide)/4)*2;
  const laneY=y+48,laneH=h-98,lanes=[];
  let left=x+10;
  for(let index=0;index<3;index++){
    const active=index===focus,urgent=index===alertLane;
    const width=active?available-narrow*2:narrow;
    const cx=left+width/2;
    const lane={x:left,y:laneY,w:width,h:laneH,centerX:cx};
    lanes.push(lane);
    ground(ctx,left,laneY,width,laneH,skin,tower,active);
    routeDetails(ctx,lane,skin,tower,wave);
    const border=urgent?'#da726d':active?skin.trim:skin.joint;
    rect(ctx,left,laneY,2,laneH,border);
    rect(ctx,left+width-2,laneY,2,laneH,border);
    gate(ctx,cx,y+17,active?72:42,skin,tower,active);
    if(urgent)glow(ctx,cx,y+35,36,'248,81,70',.28+.14*Math.sin(time*9));
    for(let py=laneY+24;py<laneY+laneH-12;py+=wave>=3?66:91){
      lamp(ctx,left+7,py,skin,time,tower,py===laneY+24);
      if(active)lamp(ctx,left+width-7,py,skin,time+.3,tower,py===laneY+24);
    }
    towerPost(ctx,cx,y+h-38,skin,lost[index],active,tower);
    if(lost[index]){
      rect(ctx,left+2,laneY,width-4,laneH,'rgba(15,11,20,.30)');
    }
    left+=width+6;
  }
  particles(ctx,x+12,y+36,w-24,h-70,skin,time,tower);
  ctx.restore();
  return lanes;
}

function highGround(ctx,{x,y,w,h,chapter,mode,time,boss}) {
  const skin=palette(chapter,mode),tower=chapter==='tower',cx=x+w/2;
  frame(ctx,x,y,w,h,skin);
  ctx.save();ctx.beginPath();ctx.rect(x+4,y+4,w-8,h-8);ctx.clip();
  rect(ctx,x+4,y+4,w-8,h-8,skin.night);
  const top=y+36,deckY=y+h-65;
  ground(ctx,x+17,top,w-34,h-58,skin,tower,true);
  gate(ctx,cx,top+6,Math.min(110,w*.3),skin,tower,Boolean(boss));
  for(const side of [-1,1]){
    const edge=cx+side*(w/2-22);
    rect(ctx,edge-4,top,8,h-64,skin.shadow);
    rect(ctx,edge-2,top,3,h-64,skin.rim);
    for(let py=top+25;py<y+h-30;py+=49)rect(ctx,edge-5,py,10,3,skin.trim);
    lamp(ctx,edge+side*-12,top+25,skin,time,tower);
    lamp(ctx,edge+side*-12,deckY-12,skin,time+.6,tower);
  }
  glow(ctx,cx,top+h*.26,Math.min(90,h*.25),skin.glow,boss ? .31 : .14);
  for(let step=0;step<4;step++){
    const span=w*.65+step*12;
    rect(ctx,cx-span/2,deckY+step*6,span,5,step%2?skin.rim:skin.stone[2]);
    rect(ctx,cx-span/2+6,deckY+step*6,span-12,1,skin.trim);
  }
  rect(ctx,cx-33,deckY+24,66,15,skin.panel);
  rect(ctx,cx-33,deckY+24,66,1,skin.trim);
  particles(ctx,x+16,top,w-32,h-60,skin,time,tower,25);
  ctx.restore();
}

function bossCue(ctx,x,y,radius,remaining,elapsed) {
  ctx.save();
  if(remaining>=0&&remaining<2){
    ctx.strokeStyle='#ef8a78';
    ctx.fillStyle='rgba(219,78,68,.13)';
    ctx.lineWidth=1.5;
    ringPath(ctx,x,y,radius,.37,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#ffc5a0';ctx.lineWidth=3;
    ringPath(ctx,x,y,radius+3,.40,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-remaining/2));ctx.stroke();
  }
  if(elapsed>=0&&elapsed<.48){
    const p=elapsed/.48,reach=radius*(.55+1.2*p);
    ctx.globalAlpha=1-p;
    ctx.strokeStyle='#ffd6a0';ctx.lineWidth=3;
    ringPath(ctx,x,y,reach,.32,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<14;i++){
      const a=i*2.39996;
      rect(ctx,x+Math.cos(a)*reach,y+Math.sin(a)*reach*.4,3+(i%2),2,i%2?'#d47862':'#ffd6a0');
    }
  }
  ctx.restore();
}

function ringPath(ctx,x,y,radius,ratio,start,end) {
  ctx.save();ctx.translate(x,y);ctx.scale(1,ratio);
  ctx.beginPath();ctx.arc(0,0,radius,start,end);
  ctx.restore();
}

function preview(ctx,x,y,w,h,chapter) {
  const skin=palette(chapter),tower=chapter==='tower';
  rect(ctx,x,y,w,h,skin.night);
  glow(ctx,x+w*.72,y+h*.45,48,skin.glow,.34);
  gate(ctx,x+w*.71,y+6,w*.42,skin,tower,true);
  rect(ctx,x,y+h-15,w,15,skin.path);
  rect(ctx,x,y+h-15,w,2,skin.rim);
  lamp(ctx,x+13,y+h-28,skin,0,tower);
}

module.exports={palette,frame,backdrop,arena,highGround,bossCue,preview};
