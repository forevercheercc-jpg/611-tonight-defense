'use strict';

// Shape and colour identify the source even when several heroes attack together.
const RANGED={
  tang:['bolt','#8fe3ff'], hong:['bullet','#ffe7a0'], fire:['ember','#ff9d50'],
  ice:['frost','#9ae6f6'], bow:['arrow','#d1efaa'], priest:['glow','#bcf2a5'], swift:['axeThrow','#9ef9de']
};
const SWINGS={
  ao:{reach:20,width:.86,edge:5,color:'#ffd274'}, zhi:{reach:18,width:.64,edge:6,color:'#a7efff'},
  csy:{reach:29,width:1.22,edge:7,color:'#ffab76'}, ge:{reach:21,width:.83,edge:4,color:'#f5a1d9',dual:true},
  thorn:{reach:21,width:.92,edge:4,color:'#b4eb8c'}, hammer:{reach:25,width:.9,edge:7,color:'#ffc387'},
  forge:{reach:18,width:.64,edge:4,color:'#ffca87'}, gate:{reach:19,width:.75,edge:7,color:'#eec18d'},
  blade:{reach:26,width:1.08,edge:5,color:'#ff907a'}, axe:{reach:26,width:.98,edge:8,color:'#d5adff'},
  spear:{reach:30,width:.44,edge:4,color:'#bedcfb'},
  shadow:{reach:19,width:.72,edge:3,color:'#b3a3ee'}
};
function ink(id){
  if(SWINGS[id])return SWINGS[id].color;
  return RANGED[id]?RANGED[id][1]:'#efc979';
}
function line(ctx,points,width=2){
  ctx.lineWidth=width;
  ctx.beginPath();
  points.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.stroke();
}
function ring(ctx,x,y,r,start=0,end=Math.PI*2){
  ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.stroke();
}
function pixel(ctx,x,y,size=3){ctx.fillRect(Math.round(x),Math.round(y),size,size);}
function sparks(ctx,x,y,count,spread){
  for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count;
    pixel(ctx,x+Math.cos(angle)*spread,y+Math.sin(angle)*spread);
  }
}
function zigzag(ctx,from,to){
  const dx=to.x-from.x,dy=to.y-from.y;
  const length=Math.hypot(dx,dy)||1;
  const bend=Math.min(5,length/4);
  line(ctx,[[from.x,from.y],
    [from.x+dx*.36-dy/length*bend,from.y+dy*.36+dx/length*bend],
    [from.x+dx*.68+dy/length*bend,from.y+dy*.68-dx/length*bend],
    [to.x,to.y]]);
}
function bladeArc(ctx,angle,radius,width,edge,direction){
  const outer=[],inner=[];
  for(let i=0;i<=6;i++){
    const progress=i/6;
    const theta=angle-direction*width*(1-progress);
    const r=radius-4*(1-progress);
    const thickness=edge*Math.sin(progress*Math.PI)*.85+1;
    const cos=Math.cos(theta),sin=Math.sin(theta);
    outer.push([Math.round(cos*r),Math.round(sin*r)]);
    inner.push([Math.round(cos*(r-thickness)),Math.round(sin*(r-thickness))]);
  }
  ctx.beginPath();
  outer.concat(inner.reverse()).forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff2d6';
  line(ctx,outer.slice(3),2);
}
function meleeShot(ctx,e,from,to,look,t){
  const direction=Math.atan2(to.y-from.y,to.x-from.x);
  const swing=(t-.42)*1.55;
  const edge=look.edge+(e.charge>=8?2:0);
  ctx.save();ctx.translate(from.x,from.y);
  bladeArc(ctx,direction+swing+.45,look.reach,look.width,edge,1);
  if(look.dual)bladeArc(ctx,direction-swing-.45,look.reach-4,look.width*.86,edge,-1);
  ctx.restore();
  // Contact feedback stays with the struck monster, even across a wide lane.
  if(t<.65)sparks(ctx,to.x,to.y,e.id==='hammer'||e.id==='axe'?5:3,4+8*t);
}
function shot(ctx,e,from,to){
  const ranged=RANGED[e.id],color=ink(e.id);
  const t=1-e.life/e.duration;
  const x=to.x,y=to.y;
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=1-t*.72;
  const swing=SWINGS[e.id];
  if(swing){meleeShot(ctx,e,from,to,swing,t);ctx.restore();return;}
  switch(ranged&&ranged[0]){
    case 'bolt': zigzag(ctx,from,to);pixel(ctx,x-2,y-2,4);break;
    case 'bullet': line(ctx,[[from.x,from.y],[x,y]],1);pixel(ctx,from.x-2,from.y-2,5);pixel(ctx,x-1,y-1,3);break;
    case 'ember': {
      const xOrb=from.x+(x-from.x)*Math.min(1,.75+t);
      const yOrb=from.y+(y-from.y)*Math.min(1,.75+t);
      pixel(ctx,xOrb-3,yOrb-3,6);sparks(ctx,x,y,3,4+t*6);break;
    }
    case 'frost': line(ctx,[[x,y-7],[x+5,y],[x,y+7],[x-5,y],[x,y-7]]);break;
    case 'glow': line(ctx,[[from.x,from.y],[x,y]],1);pixel(ctx,x-2,y-2,4);break;
    case 'axeThrow': line(ctx,[[from.x,from.y],[x,y]],1);line(ctx,[[x-5,y-4],[x+4,y+4]],3);break;
    case 'arrow': {
      const angle=Math.atan2(y-from.y,x-from.x);
      ctx.translate(x,y);ctx.rotate(angle);
      line(ctx,[[-17,0],[0,0]],1);line(ctx,[[-5,-3],[0,0],[-5,3]]);break;
    }
    default: sparks(ctx,x,y,3,4+8*t);
  }
  ctx.restore();
}
function skill(ctx,e,from,targets,shield){
  const t=1-e.life/e.duration;
  ctx.save();ctx.strokeStyle=ink(e.id);ctx.fillStyle=ink(e.id);ctx.globalAlpha=.88*(1-t*.85);
  switch(e.cue){
    case 'counter': {
      const radius=14+24*t;
      if(e.id==='ao'||e.id==='blade'){
        const angle=t*Math.PI*2;
        ring(ctx,from.x,from.y,radius,angle,angle+2.6);
        ring(ctx,from.x,from.y,radius,angle+Math.PI,angle+Math.PI+2.6);
      }else sparks(ctx,from.x,from.y,8,radius);
      targets.forEach(p=>sparks(ctx,p.x,p.y,3,5+6*t));break;
    }
    case 'shield':
      if(e.id==='zhi'){
        for(let i=-2;i<=2;i++)ctx.strokeRect(shield.x+i*9-3,shield.y-9+Math.abs(i)*2,7,12);
      }else{
        line(ctx,[[shield.x-16,shield.y],[shield.x+16,shield.y]],3);
        sparks(ctx,shield.x,shield.y,6,6+10*t);
      }
      break;
    case 'break': ring(ctx,shield.x,shield.y,9+20*t);targets.forEach(p=>sparks(ctx,p.x,p.y,4,4+8*t));break;
    case 'chain': targets.reduce((previous,p)=>{ctx.lineWidth=3;zigzag(ctx,previous,p);ring(ctx,p.x,p.y,5+9*t);sparks(ctx,p.x,p.y,8,7+8*t);return p;},from);break;
    case 'chase': targets.reduce((previous,p,i)=>{if(t>=i*.12){line(ctx,[[previous.x,previous.y],[p.x,p.y]],1);line(ctx,[[p.x-6,p.y+6],[p.x+6,p.y-6]],3);}return p;},from);break;
    case 'fire': targets.forEach(p=>{ring(ctx,p.x,p.y,4+10*t);sparks(ctx,p.x,p.y,4,6+8*t);});break;
    case 'fury': sparks(ctx,from.x,from.y,6,8+9*t);ring(ctx,from.x,from.y,9+6*t,0,Math.PI);break;
    case 'retreat': for(let i=0;i<3;i++)pixel(ctx,from.x-4+i*3,from.y+i*(4+5*t),4-i);break;
    case 'taunt': ring(ctx,from.x,from.y,10+12*t);targets.forEach(p=>line(ctx,[[p.x,p.y-10],[p.x,p.y-5]],2));break;
    case 'slam': targets.forEach(p=>{ring(ctx,p.x,p.y+3,4+9*t,0,Math.PI);sparks(ctx,p.x,p.y,4,4+5*t);});break;
    case 'corrode': targets.forEach(p=>ctx.strokeRect(p.x-6,p.y-6,12,12));break;
    case 'frostWard': sparks(ctx,from.x,from.y,6,5+6*t);break;
    case 'drain': targets.forEach(p=>zigzag(ctx,p,from));break;
    case 'shrapnel': targets.forEach(p=>{line(ctx,[[from.x,from.y],[p.x,p.y]],1);sparks(ctx,p.x,p.y,4,4+5*t);});break;
    case 'arrowSkill': targets.forEach(p=>{line(ctx,[[from.x,from.y],[p.x,p.y]],3);sparks(ctx,p.x,p.y,5,5+7*t);});break;
    case 'dart': targets.forEach(p=>{line(ctx,[[from.x,from.y],[p.x,p.y]],1);pixel(ctx,p.x-2,p.y-2,4);});break;
  }
  ctx.restore();
}
function heal(ctx,e,from,to){
  const t=1-e.life/e.duration;
  const color=e.id==='ice'?'#b4e9ff':'#bcf2a5';
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=1-t*.8;
  line(ctx,[[from.x,from.y-4],[to.x,to.y-4]],2);
  ring(ctx,to.x,to.y,8+8*t);ctx.fillRect(to.x-4,to.y-1,8,2);ctx.fillRect(to.x-1,to.y-4,2,8);
  ctx.restore();
}
module.exports={ink,shot,skill,heal};
