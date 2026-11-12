(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PixelArt = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const palette = {
    ink: '#101b27', night: '#142331', deep: '#1b2c3b', panel: '#263b4b',
    stone: '#344b5a', stoneLight: '#4c6674', stoneEdge: '#6d8790',
    floor: '#334a51', floorLight: '#3b535a', floorDark: '#2c4149',
    mint: '#80d5bd', mintLight: '#c3f2d5', gold: '#e6bc73',
    amber: '#b5804e', ember: '#ee9674', purple: '#afa3d5',
    white: '#f3ecd6', muted: '#a4b9bb', moss: '#526a54'
  };

  function r(ctx, x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function stepRect(ctx, x, y, w, h, cut, color) {
    r(ctx, x + cut, y, w - cut * 2, h, color);
    r(ctx, x, y + cut, w, h - cut * 2, color);
  }

  function hash(x, y, salt) {
    let value = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ salt;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return (value ^ (value >>> 16)) >>> 0;
  }

  function frame(ctx, x, y, w, h, options = {}) {
    const fill = options.fill || palette.panel;
    const edge = options.edge || palette.stoneLight;
    const light = options.light || palette.stoneEdge;
    stepRect(ctx, x, y + 4, w, h, 4, palette.ink);
    stepRect(ctx, x, y, w, h, 4, palette.ink);
    stepRect(ctx, x + 2, y + 2, w - 4, h - 4, 2, edge);
    r(ctx, x + 4, y + 4, w - 8, h - 8, fill);
    r(ctx, x + 6, y + 2, w - 12, 2, light);
    r(ctx, x + 2, y + 6, 2, h - 12, light);
    r(ctx, x + 6, y + h - 4, w - 12, 2, palette.deep);
    r(ctx, x + w - 4, y + 6, 2, h - 12, palette.deep);
    if (options.accent) {
      r(ctx, x + 10, y + 4, w - 20, 2, options.accent);
      r(ctx, x + 4, y + 10, 2, 10, options.accent);
      r(ctx, x + w - 6, y + h - 20, 2, 10, options.accent);
    }
    r(ctx, x + 6, y + 6, 2, 2, palette.ink);
    r(ctx, x + w - 8, y + 6, 2, 2, palette.ink);
    r(ctx, x + 6, y + h - 8, 2, 2, palette.ink);
    r(ctx, x + w - 8, y + h - 8, 2, 2, palette.ink);
  }

  const ICONS = {
    coin: [
      '...####...', '..#++++#..', '.#++##++#.', '.#+#++#+#.', '.#+#++#+#.',
      '.#+#++#+#.', '.#++##++#.', '..#++++#..', '...####...'
    ],
    heart: [
      '.###.###.', '#+++#+++#', '#+++++++#', '#+++++++#', '.#+++++#.', '..#+++#..', '...#+#...', '....#....'
    ],
    sword: [
      '.......##', '......#+#', '.....#++#', '....#++#.', '...#++#..', '.##++#...', '..###....', '.#.#.....', '#........'
    ],
    shield: [
      '.#######.', '#+++++++#', '#+++#+++#', '#+++#+++#', '#+++#+++#', '.#++#++#.', '..#+++#..', '...#+#...', '....#....'
    ],
    magic: [
      '....#....', '...#+#...', '..#+++#..', '.#+++++#.', '#+++#+++#', '.#+++++#.', '..#+++#..', '...#+#...', '....#....'
    ],
    pulse: [
      '.....#...', '....##...', '.####+###', '###++++##', '.####+###', '....##...', '.....#...', '...#...#.', '..##...##'
    ],
    arrow: [
      '....#....', '...###...', '..##+##..', '.##+++##.', '##++#++##', '...#+#...', '...#+#...', '...#+#...', '...###...'
    ],
    star: [
      '....#....', '...#+#...', '...#+#...', '###+++###', '.#+++++#.', '..#+++#..', '..#+.+#..', '.##...##.'
    ],
    lock: [
      '..#####..', '.##...##.', '.##...##.', '.##...##.', '#########', '#+++++++#', '#+++#+++#', '#+++#+++#', '#########'
    ],
    refresh: [
      '..#####..', '.##...##.', '##.....##', '##....###', '##...####', '##.......', '.##...##.', '..#####..'
    ],
    bag: [
      '...###...', '..#...#..', '.#######.', '#+++++++#', '#+++++++#', '#++###++#', '#++###++#', '#+++++++#', '.#######.'
    ],
    synergy: [
      '.##...##.', '#++#.#++#', '#++#.#++#', '.##...##.', '...###...', '.##...##.', '#++#.#++#', '#++#.#++#', '.##...##.'
    ],
    home: [
      '....#....', '...###...', '..##+##..', '.##+++##.', '##+++++##', '.#+++++#.', '.#+###+#.', '.#+#.#+#.', '.###.###.'
    ],
    settings: [
      '...###...', '.#######.', '.##...##.', '##..#..##', '##.###.##', '##..#..##', '.##...##.', '.#######.', '...###...'
    ],
    boot: [
      '..####...', '..#++#...', '..#++#...', '..#++#...', '..#++###.', '..#+++++#', '.#++++++#', '#+++++++#', '#########'
    ],
    sound: [
      '....#....', '...##..#.', '.####...#', '#+++#.#.#', '#+++#.#.#', '#+++#.#.#', '.####...#', '...##..#.', '....#....'
    ],
    skull: [
      '..#####..', '.#+++++#.', '#+++++++#', '#+##+##+#', '#+##+##+#', '.#+++++#.', '..##+##..', '..#.#.#..', '..#####..'
    ],
    plus: [
      '...###...', '...#+#...', '...#+#...', '####+####', '#+++++++#', '####+####', '...#+#...', '...#+#...', '...###...'
    ],
    heal: [
      '...###...', '...#+#...', '...#+#...', '####+####', '#+++++++#', '####+####', '...#+#...', '...#+#...', '...###...'
    ]
  };

  // Icon coordinates identify the top-left corner. Size is the outer square.
  function icon(ctx, name, x, y, size = 18, color = palette.gold) {
    const pixels = ICONS[name] || ICONS.magic;
    const unit = Math.max(1, Math.floor(size / 9));
    const dx = Math.round(x + (size - pixels[0].length * unit) / 2);
    const dy = Math.round(y + (size - pixels.length * unit) / 2);
    pixels.forEach((row, py) => {
      for (let px = 0; px < row.length; px++) {
        if (row[px] === '#') r(ctx, dx + px * unit, dy + py * unit, unit, unit, color);
        if (row[px] === '+') r(ctx, dx + px * unit, dy + py * unit, unit, unit, name === 'heart' ? '#df7978' : palette.white);
      }
    });
  }

  function masonry(ctx, x, y, w, h, seed, dark = false) {
    const color = dark ? palette.deep : palette.stone;
    r(ctx, x, y, w, h, palette.ink);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let row = 0; row < Math.ceil(h / 16); row++) {
      const offset = row % 2 ? -16 : 0;
      for (let col = -1; col < Math.ceil(w / 32) + 1; col++) {
        const bx = x + col * 32 + offset;
        const by = y + row * 16;
        const n = hash(col, row, seed);
        r(ctx, bx + 1, by + 1, 30, 14, color);
        r(ctx, bx + 2, by + 2, 28, 2, dark ? '#263c4b' : '#47616e');
        r(ctx, bx + 2, by + 4, 2, 8, dark ? '#233746' : '#3d5663');
        r(ctx, bx + 5 + (n % 6) * 2, by + 10, 4, 2, dark ? '#1a2b39' : '#2f4553');
        if (n % 13 === 0) {
          r(ctx, bx + 20, by + 4, 2, 4, '#243c49');
          r(ctx, bx + 18, by + 8, 2, 4, '#243c49');
        }
      }
    }
    ctx.restore();
  }

  function torch(ctx, x, y, time, small = false) {
    const s = small ? 1 : 2;
    const flicker = Math.floor(time * 7) % 3;
    r(ctx, x - 7 * s, y - 9 * s, 14 * s, 18 * s, '#3b3b3b');
    r(ctx, x - 5 * s, y - 6 * s, 10 * s, 14 * s, '#4c4140');
    r(ctx, x - 3 * s, y - 2 * s, 6 * s, 8 * s, '#6e503e');
    r(ctx, x - 1 * s, y + 3 * s, 2 * s, 10 * s, '#3a292b');
    r(ctx, x - 3 * s, y + 2 * s, 6 * s, 2 * s, '#b08957');
    r(ctx, x - 2 * s, y - 4 * s, 4 * s, 6 * s, '#bb7049');
    r(ctx, x - 1 * s, y - 6 * s - flicker, 2 * s, 6 * s, '#e5a55e');
    r(ctx, x - 1 * s, y - 2 * s, 2 * s, 3 * s, '#f4d49a');
    if (flicker === 1) r(ctx, x + 3 * s, y - 10 * s, s, s, '#e6bc73');
  }

  function backdrop(ctx, {width = 390, height = 844, time = 0} = {}) {
    r(ctx, 0, 0, width, height, palette.night);
    for (let i = 0; i < 48; i++) {
      const n = hash(i, 9, 611);
      const x = n % Math.max(1, width);
      const y = ((n >>> 8) % Math.max(1, height));
      r(ctx, x - x % 2, y - y % 2, 2, 2, i % 7 === 0 ? '#344957' : '#213544');
    }
    masonry(ctx, 0, 0, width, 32, 611, true);
    masonry(ctx, 0, height - 20, width, 20, 7, true);
    r(ctx, 0, 30, width, 2, '#4b606b');
    r(ctx, 0, 32, width, 4, palette.ink);
    r(ctx, 0, height - 22, width, 2, '#465d69');
    for (let x = 8; x < width; x += 32) {
      r(ctx, x, 8, 2, 2, '#3c5260');
      r(ctx, x + 12, height - 10, 2, 2, '#3c5260');
    }
  }

  function arch(ctx, cx, y, width, focus, boss) {
    const w = Math.round(width / 2) * 2;
    const x = Math.round(cx - w / 2);
    r(ctx, x - 4, y + 10, w + 8, 28, palette.ink);
    r(ctx, x + 6, y, w - 12, 4, '#65808a');
    r(ctx, x, y + 4, w, 4, '#546e7b');
    r(ctx, x - 4, y + 8, w + 8, 4, '#425c6b');
    r(ctx, x - 6, y + 12, 8, 26, '#3a5362');
    r(ctx, x + w - 2, y + 12, 8, 26, '#3a5362');
    r(ctx, x - 6, y + 12, 2, 26, '#647e86');
    r(ctx, x + w + 4, y + 12, 2, 26, '#263e4b');
    r(ctx, x + 4, y + 12, w - 8, 22, boss ? '#332d3d' : '#182a35');
    r(ctx, x + 10, y + 6, w - 20, 6, boss ? '#463b4b' : '#223744');
    for (let px = x + 10; px < x + w - 8; px += 10) {
      r(ctx, px, y + 12, 2, 22, boss ? '#5f4b58' : '#3d505b');
    }
    r(ctx, x - 8, y + 36, w + 16, 4, '#253b48');
    r(ctx, x - 10, y + 40, w + 20, 2, '#50646a');
    if (focus) {
      r(ctx, cx - 4, y + 3, 8, 6, palette.amber);
      r(ctx, cx - 2, y + 3, 4, 4, palette.gold);
    }
  }

  function paving(ctx, lane, focus, seed) {
    const {x, y, w, h} = lane;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    r(ctx, x, y, w, h, focus ? '#344c53' : '#2a3e48');
    for (let row = 0; row < Math.ceil(h / 24); row++) {
      const offset = row % 2 ? -16 : 0;
      for (let col = -1; col < Math.ceil(w / 32) + 1; col++) {
        const px = x + col * 32 + offset;
        const py = y + row * 24;
        const n = hash(col, row, seed);
        const light = focus ? ['#3a5157', '#3d5459', '#354d54'][n % 3] : ['#30454e', '#2c414b', '#30454b'][n % 3];
        r(ctx, px + 1, py + 1, 30, 22, light);
        r(ctx, px + 2, py + 2, 28, 2, focus ? '#465b60' : '#384e56');
        r(ctx, px + 2, py + 4, 2, 16, focus ? '#40565b' : '#344a52');
        r(ctx, px + 7 + n % 5 * 2, py + 17, 6, 2, focus ? '#30474e' : '#293f48');
        if (n % 6 === 0) {
          r(ctx, px + 18, py + 8, 2, 4, '#2b4249');
          r(ctx, px + 16, py + 12, 2, 4, '#2b4249');
          r(ctx, px + 14, py + 16, 4, 2, '#2b4249');
        }
        if (n % 9 === 0) {
          r(ctx, px + 5, py + 6, 4, 2, focus ? '#526758' : '#3b514d');
          r(ctx, px + 7, py + 8, 2, 2, focus ? '#63745b' : '#435b51');
        }
      }
    }
    ctx.restore();
  }

  function railing(ctx, x, y, h, right) {
    r(ctx, x, y, 8, h, '#182d39');
    r(ctx, x + 2, y, 4, h, '#3f5864');
    r(ctx, x + (right ? 4 : 0), y, 2, h, '#607985');
    for (let py = y; py < y + h; py += 30) {
      r(ctx, x - 2, py, 12, 4, '#5d7780');
      r(ctx, x - 2, py + 4, 12, 2, '#293f4d');
      r(ctx, x, py + 6, 8, 4, '#415d69');
    }
  }

  function tower(ctx, cx, y, focus, time) {
    const x = Math.round(cx - 11);
    r(ctx, x - 8, y + 15, 38, 6, '#1a3039');
    r(ctx, x - 3, y + 12, 28, 6, '#62757a');
    r(ctx, x, y - 2, 22, 16, '#526b74');
    r(ctx, x + 2, y, 18, 12, '#3b5661');
    r(ctx, x - 2, y - 6, 26, 4, '#7e9290');
    r(ctx, x, y - 12, 5, 7, '#6e8588');
    r(ctx, x + 8, y - 12, 6, 7, '#6e8588');
    r(ctx, x + 17, y - 12, 5, 7, '#6e8588');
    r(ctx, x + 8, y + 2, 6, 10, '#203a43');
    r(ctx, x + 9, y + 3, 4, 6, focus ? palette.mint : '#719e9b');
    r(ctx, x + 3, y + 1, 2, 2, '#879c96');
    r(ctx, x + 17, y + 7, 2, 2, '#78918e');
    if (focus) {
      r(ctx, cx - 3, y - 24, 6, 6, palette.mint);
      r(ctx, cx - 1, y - 22, 2, 2, palette.mintLight);
      const drift = Math.floor(time * 3) % 4;
      r(ctx, cx - 16, y - 18 - drift * 2, 2, 2, '#76ad9e');
      r(ctx, cx + 16, y - 12 - drift * 2, 2, 2, '#76ad9e');
    }
  }

  function formationSlot(ctx, cx, cy, size, n) {
    const half = size / 2;
    r(ctx, cx - half + 4, cy - half, size - 8, 2, '#70998f');
    r(ctx, cx - half + 4, cy + half - 2, size - 8, 2, '#70998f');
    r(ctx, cx - half, cy - half + 4, 2, size - 8, '#70998f');
    r(ctx, cx + half - 2, cy - half + 4, 2, size - 8, '#70998f');
    r(ctx, cx - 2, cy + half - 1, 4, 2, palette.mint);
  }

  function arena(ctx, options = {}) {
    const {x = 12, y = 120, w = 366, h = 350, focus = 1, time = 0, boss = false, formation = false, theme = 'chapel'} = options;
    const towerTheme=theme==='tower';
    frame(ctx, x, y, w, h, {fill: towerTheme?'#211f3b':'#203440', edge: towerTheme?'#615b86':'#354e5d', light: towerTheme?'#aaa0cf':'#71848a'});
    masonry(ctx, x + 4, y + 4, w - 8, 48, 66, true);
    const gap = 6;
    const available = w - 20 - gap * 2;
    const mainWidth = Math.round(available * .52 / 2) * 2;
    const narrow = Math.floor((available - mainWidth) / 4) * 2;
    const widths = [narrow, narrow, narrow];
    widths[Math.max(0, Math.min(2, focus))] = available - narrow * 2;
    const lanes = [];
    let left = x + 10;
    const roadY = y + 48;
    const roadH = h - 98;
    for (let i = 0; i < 3; i++) {
      const selected = i === focus;
      const width = widths[i];
      const lane = {x: left, y: roadY, w: width, h: roadH, centerX: left + width / 2, spawnY: roadY + 12, baseY: roadY + roadH - 12};
      lanes.push(lane);
      paving(ctx, lane, selected, i + 611);
      if(towerTheme){r(ctx,left+3,roadY+8,width-6,2,selected?'#726b9b':'#484664');for(let star=0;star<4;star++){const sx=left+8+((star*37+i*19)%Math.max(12,width-16));r(ctx,sx,roadY+26+star*39,2,2,star%2?'#b8a9da':'#91b9c7');}}
      if(towerTheme){r(ctx,left+3,roadY+8,width-6,2,selected?'#726b9b':'#484664');for(let star=0;star<4;star++){const sx=left+8+((star*37+i*19)%Math.max(12,width-16));r(ctx,sx,roadY+26+star*39,2,2,star%2?'#b8a9da':'#91b9c7');}}
      r(ctx, left, roadY, 2, roadH, selected ? '#65877e' : '#425961');
      r(ctx, left + width - 2, roadY, 2, roadH, selected ? '#65877e' : '#425961');
      arch(ctx, lane.centerX, y + 8, selected ? 70 : 42, selected, boss);
      // A few embedded warm lights direct the eye down the road.
      for (let py = roadY + 54; py < roadY + roadH - 18; py += 72) {
        r(ctx, left + 5, py, 4, 6, '#263b43');
        r(ctx, left + 6, py + 1, 2, 3, selected ? '#a49263' : '#716e56');
        r(ctx, left + width - 9, py, 4, 6, '#263b43');
        r(ctx, left + width - 8, py + 1, 2, 3, selected ? '#a49263' : '#716e56');
      }
      if (formation && selected) {
        const frontY = roadY + roadH * .61;
        const backY = roadY + roadH * .82;
        for (let s = 0; s < 4; s++) formationSlot(ctx, left + width * (.17 + s * .22), frontY, 28, s);
        for (let s = 0; s < 3; s++) formationSlot(ctx, left + width * (.28 + s * .22), backY, 28, s + 4);
      }
      const towerY = y + h - 38;
      r(ctx, left, roadY + roadH, width, 4, '#52686b');
      r(ctx, left + 2, roadY + roadH + 4, width - 4, 4, '#334d56');
      tower(ctx, lane.centerX, towerY, selected, time);
      left += width + gap;
    }
    railing(ctx, x + 2, y + 50, h - 64, false);
    railing(ctx, x + w - 10, y + 50, h - 64, true);
    // Low warm torches retain the campus-at-night mood without filling the road.
    torch(ctx, x + 12, y + 30, time, true);
    torch(ctx, x + w - 12, y + 30, time + .3, true);
    r(ctx, x + 14, y + h - 9, w - 28, 2, '#496068');
    r(ctx, x + 24, y + h - 7, w - 48, 2, '#283e49');
    return lanes;
  }

  return {palette, frame, icon, backdrop, arena};
});
