'use strict';

const surfaces = {
  landing: ['#282b30', '#575044', '#aa8358'],
  dorm: ['#302b29', '#584034', '#b98b56'],
  storage: ['#302923', '#6c4c32', '#bd8a52'],
  wash: ['#253638', '#3a5a57', '#83a599'],
  bunks: ['#262930', '#48404a', '#ab6a54'],
  school: ['#252f37', '#43505b', '#8d9a93'],
  classroom: ['#293530', '#45574b', '#9a9472'],
  foyer: ['#343039', '#65454c', '#ab6d61'],
  power: ['#263239', '#445f65', '#a4bfaf'],
  north: ['#282c39', '#434a66', '#9da8c4']
};

function hash(x, y) {
  return ((Math.imul(x + 29, 73856093) ^ Math.imul(y + 47, 19349663)) >>> 0) / 4294967296;
}

function fill(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  ctx.closePath();
  ctx.fill();
}

function floor(ctx, px, py, tile, x, y, scene) {
  const [base, trim, detail] = surfaces[scene] || surfaces.school;
  const seed = hash(x, y);
  fill(ctx, px, py, tile, tile, base);
  fill(ctx, px, py, tile, tile, seed > .55 ? 'rgba(205,192,151,.035)' : 'rgba(8,12,17,.11)');

  if (scene === 'dorm' || scene === 'storage' || scene === 'bunks') {
    for (let plank = 0; plank < 3; plank++) {
      const row = py + Math.round((plank + 1) * tile / 3) - 1;
      const joint = Math.floor(hash(x + plank, y) * tile);
      fill(ctx, px, row, tile, 1, '#171b21');
      fill(ctx, px + joint, row - tile / 3 + 2, 1, tile / 3 - 2, trim);
    }
  } else {
    const joint = (x + y) % 2 ? 0 : Math.floor(tile * .48);
    fill(ctx, px, py + tile - 1, tile, 1, '#1b222a');
    fill(ctx, px + joint, py, 1, tile - 1, trim);
    if (scene === 'wash') fill(ctx, px, py + Math.floor(tile * .51), tile, 1, '#1b282c');
    if (scene === 'landing' && x >= 10 && x <= 12 && y >= 18) {
      fill(ctx, px, py + tile*.09, tile, tile*.82, '#463a35');
      if (x !== 11) fill(ctx, px + (x === 10 ? 2 : tile - 4), py, 2, tile, '#85684a');
    }
    if (scene === 'foyer' && x >= 10 && x <= 12) {
      fill(ctx, px, py, tile, tile, '#493439');
      if (x !== 11) fill(ctx, px + (x === 10 ? 3 : tile - 5), py, 2, tile, '#8e6658');
    }
    if (scene === 'power' && (y === 12 || x === 16)) {
      fill(ctx, px + tile * .1, py + tile * .78, tile * .8, 2, trim);
      fill(ctx, px + tile * .7, py + tile * .72, 3, 4, detail);
    }
  }
  if (seed > .42) fill(ctx, px + 4 + seed * tile * .3, py + 4 + seed * tile * .45, 3, 1, trim);
}

function landmark(ctx, kind, px, py, tile) {
  ctx.save();
  ctx.translate(Math.round(px), Math.round(py));
  ctx.scale(tile / 32, tile / 32);
  const rect = (x, y, w, h, color) => fill(ctx, x, y, w, h, color);
  const poly = (points, color) => polygon(ctx, points, color);

  if (kind === 'dormSign' || kind === 'fireSign' || kind === 'westSign' || kind === 'eastSign') {
    const labels = {dormSign: '611', fireSign: '礼堂', westSign: '储物间', eastSign: '盥洗区'};
    poly([[4,8],[28,6],[29,23],[6,25]], '#120f15');
    poly([[5,7],[27,6],[27,21],[6,23]], '#634634');
    rect(7,8,19,2,'#aa8155');
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0d4a5';
    ctx.fillText(labels[kind], 16, 15, 21);
  } else if (kind === 'window') {
    poly([[6,25],[7,7],[11,4],[24,5],[27,8],[26,25]], '#0a1721');
    rect(9,8,15,15,'#355e70');
    rect(10,9,13,2,'#86b3b8');
    rect(16,8,2,15,'#192832');
    rect(9,16,15,1,'#1a2a36');
    rect(5,25,23,3,'#64797b');
  } else if (kind === 'bunk') {
    rect(3,23,26,5,'#181921');
    rect(4,8,24,3,'#847b6b');
    rect(5,11,22,8,'#5c4847');
    rect(6,12,8,6,'#cbb78c');
    rect(15,12,11,6,'#80646a');
    rect(4,21,24,3,'#645c59');
    rect(4,7,2,21,'#a39c89');
    rect(26,7,2,21,'#9a9484');
  } else if (kind === 'boxes' || kind === 'workbench' || kind === 'desks') {
    poly([[3,20],[24,18],[30,25],[9,28]], '#141820');
    rect(5,11,22,13,kind === 'workbench' ? '#3d5559' : '#593e31');
    poly([[5,11],[10,8],[28,9],[26,13],[6,14]], kind === 'workbench' ? '#819692' : '#9c7753');
    rect(8,15,2,9,'#302d30');
    rect(22,14,2,10,'#302d30');
    rect(12,10,7,2,'#b8ad89');
    if (kind === 'workbench') rect(20,9,4,3,'#edc07b');
  } else if (kind === 'pipes') {
    rect(3,10,25,3,'#253138');
    rect(4,8,23,2,'#698786');
    rect(21,8,3,19,'#51746f');
    rect(19,21,7,3,'#9a976d');
    rect(21,27,2,2,'#8ec2b9');
  } else if (kind === 'warning') {
    poly([[4,20],[9,13],[29,13],[24,20]], '#24242a');
    for (let x = 8; x < 26; x += 6) poly([[x-2,19],[x+1,14],[x+4,14],[x+1,19]], '#be9360');
  }
  ctx.restore();
}

function atmosphere(ctx, view, lights, map, seen, actor, time, warm) {
  const {left, top, tile, cameraX, cameraY} = view;
  const width = tile * 9;
  // Clip light and dust to explored cells so a fixture cannot reveal fogged rooms.
  ctx.save();
  ctx.beginPath();
  for (let y = Math.floor(cameraY); y < Math.ceil(cameraY + 9); y++) {
    for (let x = Math.floor(cameraX); x < Math.ceil(cameraX + 9); x++) {
      if (seen[y]?.[x]) ctx.rect(left + (x-cameraX)*tile, top + (y-cameraY)*tile, tile, tile);
    }
  }
  ctx.clip();
  const glow = (x, y, radius, color, strength) => {
    const sx = left + (x-cameraX+.5)*tile, sy = top + (y-cameraY+.5)*tile;
    if (sx+radius<left || sx-radius>left+width || sy+radius<top || sy-radius>top+width) return;
    const pool = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
    pool.addColorStop(0, 'rgba('+color+','+strength+')');
    pool.addColorStop(.45, 'rgba('+color+','+(strength*.46)+')');
    pool.addColorStop(1, 'rgba('+color+',0)');
    fill(ctx, sx-radius, sy-radius, radius*2, radius*2, pool);
  };
  for (const [x,y,color,strength,castsBeam] of lights) {
    if (!seen[y]?.[x]) continue;
    glow(x,y,tile*2.5,color,strength*(.93+.07*Math.sin(time*7+x)));
    if (castsBeam) {
      const sx=left+(x-cameraX+.5)*tile, sy=top+(y-cameraY+.38)*tile;
      const reach=tile*2.2;
      if(sx+reach>=left&&sx-reach<=left+width&&sy+reach>=top&&sy<=top+width){
        const beam=ctx.createLinearGradient(sx,sy,sx,sy+reach);
        beam.addColorStop(0,'rgba('+color+','+(strength*.58)+')');
        beam.addColorStop(1,'rgba('+color+',0)');
        polygon(ctx,[[sx-tile*.14,sy],[sx+tile*.15,sy],[sx+tile*1.14,sy+reach],[sx-tile*.65,sy+reach]],beam);
      }
    }
  }
  glow(actor.x, actor.y, tile*2.15, warm?'247,185,107':'155,217,227', .16);
  const edge = ctx.createRadialGradient(left+width/2,top+width/2,width*.20,left+width/2,top+width/2,width*.72);
  edge.addColorStop(0,'rgba(5,7,14,0)');
  edge.addColorStop(1,'rgba(5,7,14,.65)');
  fill(ctx,left,top,width,width,edge);

  // Two low, slow bands sit behind actors and their combat warnings.
  const mistColor = warm ? '177,157,137' : '153,190,208';
  for (let band=0;band<2;band++) {
    const worldY = Math.floor((cameraY+band*3)/5)*5+2;
    const x = left+width*(.45+.18*Math.sin(time*.17+band*2));
    const y = top+(worldY-cameraY+.15*Math.sin(time*.23+band))*tile;
    const reach = width*.48;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(1,.12);
    const mist = ctx.createRadialGradient(0,0,0,0,0,reach);
    mist.addColorStop(0,'rgba('+mistColor+','+(warm ? .085 : .12)+')');
    mist.addColorStop(1,'rgba('+mistColor+',0)');
    fill(ctx,-reach,-reach,reach*2,reach*2,mist);
    ctx.restore();
  }

  for (let y = Math.floor(cameraY); y < Math.ceil(cameraY+9); y++) {
    for (let x = Math.floor(cameraX); x < Math.ceil(cameraX+9); x++) {
      const seed = hash(x,y);
      if (!seen[y]?.[x] || map[y][x] !== '.' || seed < .82) continue;
      const px = left+(x-cameraX+.14+seed*.4+Math.sin(time*.65+x)*.13)*tile;
      const py = top+(y-cameraY+.55+Math.cos(time*.48+y)*.16)*tile;
      ctx.globalAlpha = .18 + .12*Math.sin(time*1.3+seed*20);
      fill(ctx, Math.round(px), Math.round(py), seed>.94?2:1, 1, warm?'#e8bd80':'#9ed1d4');
      if (seed>.95) {
        ctx.globalAlpha = .065;
        fill(ctx, px-tile*.25, py+4, tile*.6, 2, warm?'#ac9f90':'#afc5d1');
        fill(ctx, px-tile*.11, py+6, tile*.56, 1, warm?'#ac9f90':'#afc5d1');
      }
    }
  }
  ctx.restore();
}

function pickupMarker(ctx, x, y, tile, time, color, active) {
  const float = Math.sin(time * 4 + x * .02) * 2;
  const size = active ? 5 : 3;
  const centerX = Math.round(x);
  const centerY = Math.round(y - tile * .32 + float);
  ctx.save();
  ctx.globalAlpha = active ? .95 : .62 + .24 * Math.sin(time * 3);
  polygon(ctx,[[centerX,centerY-size],[centerX+size,centerY],[centerX,centerY+size],[centerX-size,centerY]],color);
  ctx.restore();
}

function frame(ctx, x, y, w, h, theme) {
  const corners = [[0,7],[7,0],[w-7,0],[w,7],[w,h-7],[w-7,h],[7,h],[0,h-7]];
  ctx.save();
  ctx.translate(x,y);
  polygon(ctx,corners,theme.edge);
  polygon(ctx,corners.map(([px,py])=>[px===0?1:px===w?w-1:px,py===0?1:py===h?h-1:py]),theme.panel);
  fill(ctx,9,2,w-18,1,theme.wallTrim);
  fill(ctx,9,h-3,w-18,1,theme.shadow);
  for (const [px,py] of [[6,6],[w-8,6],[6,h-8],[w-8,h-8]]) fill(ctx,px,py,2,2,theme.light);
  ctx.restore();
}

function control(ctx, x, y, radius, theme, dx, dy, active) {
  ctx.save();
  ctx.translate(x,y);
  ctx.beginPath();
  ctx.arc(0,0,radius,0,Math.PI*2);
  ctx.fillStyle = theme.panel;
  ctx.fill();
  ctx.strokeStyle = active ? theme.accent : theme.edge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0,0,radius-6,0,Math.PI*2);
  ctx.fillStyle = theme.background;
  ctx.fill();
  ctx.strokeStyle = theme.wallTrim;
  ctx.stroke();
  for (let i=0;i<8;i++) {
    const angle=i*Math.PI/4;
    const px=Math.cos(angle)*(radius-3), py=Math.sin(angle)*(radius-3);
    fill(ctx,Math.round(px)-1,Math.round(py)-1,2,2,i%2===0?theme.light:theme.wallTrim);
  }
  ctx.beginPath();
  ctx.arc(dx,dy,19,0,Math.PI*2);
  ctx.fillStyle = active ? theme.selected : theme.panel;
  ctx.fill();
  ctx.strokeStyle = active ? theme.accent : theme.wallTrim;
  ctx.stroke();
  ctx.restore();
}

function hitParticles(ctx, strike, view) {
  const {left, top, tile, cameraX, cameraY} = view;
  const heavy = strike.comboStage === 3;
  const progress = Math.max(0, Math.min(1, 1 - strike.life / (heavy ? .32 : .24)));
  const color = strike.kind === 'lightning' ? '#c6b7ff' :
    ['pulse','saber'].includes(strike.kind) || strike.weaponName?.includes('冷光') ? '#8be9f6' : '#efaa68';
  ctx.save();
  ctx.globalAlpha = (1-progress)*.95;
  for (const target of strike.targets) {
    const x = left + (target.x-cameraX+.5)*tile;
    const y = top + (target.y-cameraY+.54)*tile;
    for (let i = 0; i < (heavy ? 12 : 6); i++) {
      const angle = (strike.angle || 0) + i*2.39996;
      const reach = tile*(.09 + progress*(.27+(i%4)*.14))*(heavy?1.5:1);
      const px = Math.round(x + Math.cos(angle)*reach);
      const py = Math.round(y + Math.sin(angle)*reach + progress*progress*tile*.17);
      fill(ctx,px,py,i%3===0?3:2,heavy?3:2,i%3===0?'#fff4d7':color);
    }
  }
  ctx.restore();
}

module.exports = {floor, landmark, atmosphere, pickupMarker, frame, control, hitParticles};
