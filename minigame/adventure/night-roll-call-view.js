'use strict';

const level = require('./night-roll-call');
const heroes = require('../hero-pixels');

function layout(height, safe) {
  const controlY = height - 92;
  const mapY = safe + 81;
  const boardY = mapY + 35;
  const zoom = Math.min(362 / 390, Math.max(1, controlY - boardY - 93) / 240);
  return {controlY, mapY, boardY, zoom, boardX: (390 - 390 * zoom) / 2};
}

function scene(ctx, s) {
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const shape = (color, points) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const glow = (x, y, radius, color) => {
    const light = ctx.createRadialGradient(x, y, 1, x, y, radius);
    light.addColorStop(0, color);
    light.addColorStop(1, 'rgba(0,0,0,0)');
    rect(x - radius, y - radius, radius * 2, radius * 2, light);
  };
  const window = (x, y, w, h) => {
    rect(x - 3, y - 3, w + 6, h + 6, '#0d1720');
    rect(x, y, w, h, '#7597a7');
    for (let i = 0; i < w; i += 11) {
      const rise = 10 + ((i * 19) % 25);
      rect(x + i, y + h - rise, Math.min(8, w - i), rise, '#476578');
    }
    rect(x + w / 2, y, 2, h, '#293d4a');
    rect(x, y + h / 2, w, 2, '#293d4a');
  };
  const bed = (x, top, w) => {
    rect(x, top, 3, 208 - top, '#374c58');
    rect(x + w - 3, top, 3, 208 - top, '#374c58');
    rect(x + 3, top + 12, w - 6, 5, '#60747b');
    rect(x + 3, top + 17, w - 6, 3, '#1c2830');
    rect(x + 3, 189, w - 6, 6, '#56636a');
    rect(x + 7, 185, 15, 4, '#7b8580');
  };
  const door = (x, y, n) => {
    rect(x - 4, y - 3, 48, 208 - y + 3, '#141f28');
    rect(x, y, 40, 208 - y, '#26323c');
    rect(x + 4, y + 8, 32, 43, '#202b33');
    rect(x + 30, 177, 5, 2, '#be9a69');
    if (n) {
      rect(x + 10, y + 15, 21, 11, '#9c8e73');
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1c2025';
      ctx.fillText(n, x + 20, y + 21);
    }
  };
  const item = (x, y) => {
    glow(x, y, 16, 'rgba(232,169,87,.31)');
    rect(x - 3, y - 2, 6, 4, '#dcb685');
  };

  const wall = ctx.createLinearGradient(0, 0, 0, 240);
  wall.addColorStop(0, '#182532');
  wall.addColorStop(.63, '#344b58');
  wall.addColorStop(1, '#101920');
  rect(0, 0, 390, 240, wall);
  rect(0, 163, 390, 45, 'rgba(8,22,30,.22)');
  for (let i = 0; i < 28; i++) {
    const x = (i * 97 + 17) % 390;
    const y = (i * 73 + 9) % 202;
    rect(x, y, 3 + i % 13, 1, 'rgba(142,164,165,.11)');
  }

  if (s.stage === 0) {
    window(149, 65, 64, 42);
    window(224, 65, 64, 72);
    shape('rgba(132,177,200,.12)', [[225, 78], [286, 78], [349, 208], [110, 208]]);
    bed(22, 150, 46);
    bed(100, 144, 73);
    bed(278, 146, 45);
    rect(228, 183, 42, 4, '#614e40');
    rect(232, 187, 3, 21, '#23282b');
    rect(264, 187, 3, 21, '#23282b');
    glow(248, 181, 43, 'rgba(231,159,84,.24)');
    rect(245, 177, 9, 4, '#b28956');
    door(337, 116, '611');
    const chairX = s.chair ? 84 : 70;
    rect(chairX - 10, 182, 20, 4, '#786953');
    rect(chairX - 10, 171, 2, 37, '#454c4c');
    rect(chairX + 8, 186, 2, 22, '#454c4c');
    if (!s.guitar) item(48, 197);
    if (!s.read.list) item(119, 195);
    if (!s.read.chat) item(248, 185);
  } else if (s.stage === 1) {
    window(123, 58, 58, 82);
    window(211, 58, 59, 82);
    door(332, 113, '613');
    for (const [a, b, y] of [[98, 173, 180], [203, 288, 180], [250, 321, 142]]) {
      rect(a, y, b - a, 4, s.back ? '#7795a0' : '#354e5e');
    }
    const lampX = 36 + s.lamp * 22;
    rect(25, 202, 67, 2, '#615543');
    for (let i = 0; i < 3; i++) rect(35 + i * 22, 199, 3, 3, '#ad977a');
    glow(lampX, 189, 52, 'rgba(238,164,79,.25)');
    shape('rgba(245,181,105,.18)', [[lampX, 187], [132 + s.lamp * 14, 104], [178 + s.lamp * 14, 177]]);
    rect(lampX - 5, 184, 10, 6, '#dbae73');
    if (s.lamp === 1) {
      shape('#1b2932', [[168, 135], [123, 135], [123, 127], [101, 140], [123, 153], [123, 145], [168, 145]]);
      glow(96, 191, 33, 'rgba(232,169,87,.30)');
      rect(88, 179, 15, 2, '#dcb685');
    } else {
      shape('#23343c', [[130 + s.lamp * 12, 127], [170, 140], [165, 147]]);
    }
    if (!s.read.note) item(326, 198);
  } else if (s.stage === 2) {
    door(326, 109, '613');
    glow(346, 166, 61, 'rgba(239,171,91,.32)');
    rect(368, 120, 2, 84, '#c59c68');
    if (s.fight === 'warn' || s.fight === 'lunge') {
      shape('rgba(9,13,20,.74)', [[320, 193], [167, 190], [128, 204], [319, 208]]);
      rect(176, 206, 139, 2, '#bb8a65');
    }
    if (s.fight !== 'down') {
      const x = s.monsterX;
      const y = s.fight === 'stunned' ? 193 : 170;
      if (s.fight === 'stunned') glow(x, y, 38, 'rgba(231,167,85,.37)');
      shape('#0d141b', [[x - 25, 208], [x - 10, y + 10], [x - 3, y], [x + 7, y - 5], [x + 16, y + 5], [x + 23, 208], [x + 9, 208], [x + 2, y + 18], [x - 12, 208]]);
      rect(x - 4, y + 4, 2, 2, '#aa907e');
    } else if (s.timer > 0) {
      shape('rgba(255,205,135,.69)', [[s.x, s.y - 12], [s.x + 31, s.y - 26], [s.x + 27, s.y - 12], [s.x + 8, s.y - 5]]);
    }
  } else {
    window(168, 62, 59, 68);
    bed(24, 137, 57);
    bed(279, 137, 43);
    rect(102, 182, 49, 4, '#66574a');
    rect(106, 186, 3, 22, '#252a2b');
    rect(145, 186, 3, 22, '#252a2b');
    item(126, 181);
    item(228, 199);
    item(344, 197);
  }

  for (const [left, right, y] of level.platforms(s)) {
    rect(left, y, right - left, y === 208 ? 32 : 7, s.back ? '#304852' : '#15242c');
    rect(left, y, right - left, 2, s.stage === 2 && s.misses >= 3 && y === 173 ? '#d8af79' : '#67818d');
  }
  const pipe = level.ladder(s);
  if (pipe) {
    rect(pipe.x - 3, pipe.top, 6, pipe.bottom - pipe.top, '#182831');
    rect(pipe.x - 1, pipe.top, 2, pipe.bottom - pipe.top, '#8ca6ab');
    for (let y = pipe.top + 7; y < pipe.bottom; y += 12) rect(pipe.x - 5, y, 10, 2, '#708b94');
  }
  for (let i = 0; i < 18; i++) {
    const x = (i * 107 + s.time * (3 + i % 4)) % 390;
    const y = 46 + (i * 19) % 142 + Math.sin(s.time + i) * 3;
    rect(x, y, 1, 1, 'rgba(183,207,213,.31)');
  }
  glow(s.x, s.y - 9, 23, 'rgba(125,179,194,.20)');
  heroes.draw(ctx, 'csy', s.x, s.y, {scale: s.back ? .75 : .86,
    pose: s.stage === 2 && s.fight === 'down' && s.timer > 0 ? 'attack' : s.walking || s.climbing ? 'walk' : 'idle',
    time: s.time, facing: s.facing});
  if (s.guitar) {
    rect(s.x - s.facing * 9 - 2, s.y - 12, 4, 6, '#946c49');
    rect(s.x - s.facing * 9 - 1, s.y - 18, 2, 7, '#c8aa78');
  }
  if (s.stage === 1 && s.back) rect(0, 213, 390, 3, 'rgba(11,21,30,.46)');
  rect(0, 0, 390, 13, '#0d151c');
  rect(0, 0, 6, 240, '#10191f');
  rect(384, 0, 6, 240, '#10191f');
}

function render(ctx, s, ui) {
  const {height, safe, box, text, button, leave, advance, interact, direction, replay, openClues} = ui;
  const {controlY, mapY, boardY, zoom, boardX} = layout(height, safe);
  box(0, 0, 390, height, '#101922');
  text('611 怨秽', 16, safe + 17, 20, '#e2ded3');
  text('多出来的一声「到」', 16, safe + 43, 13, '#9faeb3');
  button('返回', 302, safe + 5, 70, 34, leave);
  if (!s.dialogue) button('线索', 224, safe + 5, 70, 34, openClues);
  text(level.rooms[s.stage], 16, mapY - 16, 13, '#e3c193');
  for (let i = 0; i < level.rooms.length; i++) {
    const x = 16 + i * 91;
    box(x, mapY, 84, 21, i === s.stage ? '#526d79' : i < s.stage ? '#2c4854' : '#26333d');
    if (i < 3) box(x + 84, mapY + 10, 7, 1, '#607584');
    text(level.rooms[i], x + 42, mapY + 10, 10, i <= s.stage ? '#f2eee2' : '#9babb4', 'center');
  }
  box(boardX - 2, boardY - 2, 390 * zoom + 4, 240 * zoom + 4, '#40545f');
  ctx.save();
  ctx.translate(boardX, boardY);
  ctx.scale(zoom, zoom);
  ctx.beginPath();
  ctx.rect(0, 0, 390, 240);
  ctx.clip();
  scene(ctx, s);
  ctx.restore();

  const action = level.interaction(s);
  const hints = [
    !s.guitar ? '先拿吉他' : !s.chair ? '把椅子推到床边' : '跳上床架，沿管道爬到气窗',
    s.back ? '跳过缺口，沿管道爬回前景' : s.x > 280 ? '沿走廊去 613' : '拨动应急灯，看墙上的影子',
    s.fight === 'down' ? '推开 613 的门' : '影子先动，跳上矮台等怪物扑空',
    s.table && s.recording ? '查看最后收到的消息' : '查看登记表与旧手机'
  ];
  const hintY = boardY + 240 * zoom + 23;
  text(s.climbing ? '正在攀爬' : hints[s.stage], 195, hintY, 13, '#c2cbd0', 'center');
  box(16, controlY, 69, 54, direction < 0 ? '#526d79' : '#263b49', '#506674');
  box(93, controlY, 69, 54, direction > 0 ? '#526d79' : '#263b49', '#506674');
  text('◀', 50, controlY + 27, 17, '#ece5d8', 'center');
  text('▶', 127, controlY + 27, 17, '#ece5d8', 'center');
  button('跳跃', 187, controlY, 72, 54, () => level.jump(s));
  if (action && !s.climbing) button(action.label, 268, controlY, 106, 54, interact, true);

  if (s.dialogue) {
    const cardHeight = 78 + s.dialogue.length * 23;
    const y = Math.min(controlY - cardHeight - 12, boardY + 240 * zoom - 29);
    box(15, y, 360, cardHeight, '#18242d', '#70848c');
    s.dialogue.forEach((line, i) => text(line, 29, y + 22 + i * 23, 13, '#f0e6d5'));
    if (s.complete) button('重玩首关', 29, y + cardHeight - 49, 96, 36, replay);
    button(s.complete ? '回实验室' : '继续', 263, y + cardHeight - 49, 96, 36, s.complete ? leave : advance, true);
  }
}

module.exports = {layout, render};
