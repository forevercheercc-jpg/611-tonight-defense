(function (root) {
  'use strict';

  // Original, code-drawn sprites. Coordinates use a single native pixel and
  // every character is anchored at the centre of its feet.
  const INK = '#101b29';
  const STEEL = ['#43566c', '#849bad', '#d7e3df'];
  const GOLD = ['#815f40', '#c89b58', '#f4d98a'];
  const SKIN = ['#a77160', '#d9a782', '#f0cfab'];
  const meta = {
    ao: { width: 34, height: 38, color: '#d5a761', role: '守卫' },
    zhi: { width: 36, height: 40, color: '#75b3d5', role: '守卫' },
    csy: { width: 34, height: 39, color: '#d47864', role: '战士' },
    tang: { width: 34, height: 42, color: '#8aacf2', role: '法师' },
    ge: { width: 34, height: 38, color: '#bc89d3', role: '潜行者' },
    hong: { width: 38, height: 36, color: '#a4c478', role: '猎人' },
    thorn: { width: 38, height: 38, color: '#d66e5d', role: '战士' },
    hammer: { width: 38, height: 39, color: '#80b8b4', role: '战士' },
    forge: { width: 36, height: 36, color: '#d9aa69', role: '工匠' },
    gate: { width: 36, height: 40, color: '#6db9b4', role: '战士' },
    blade: { width: 36, height: 38, color: '#d38b6c', role: '战士' },
    axe: { width: 38, height: 36, color: '#e2bb87', role: '战士' },
    swift: { width: 38, height: 38, color: '#83c6de', role: '战士' },
    spear: { width: 36, height: 42, color: '#cbbb78', role: '战士' },
    fire: { width: 32, height: 40, color: '#f0a366', role: '法师' },
    ice: { width: 38, height: 33, color: '#97d8ef', role: '法师' },
    bow: { width: 36, height: 38, color: '#9dcf91', role: '猎人' },
    shadow: { width: 34, height: 36, color: '#b8a0d9', role: '潜行者' },
    priest: { width: 34, height: 41, color: '#a5dcb2', role: '牧师' }
  };

  function draw(ctx, id, x, y, options = {}) {
    const {
      scale = 1, pose = 'idle', time = 0, facing = 1, hit = false,
      shadow = true, weapon = '', unarmed = false, attackPhase = 0, comboStage = 1, aimAngle
    } = options;
    const attacking = pose === 'attack';
    const casting = pose === 'cast';
    const walking = pose === 'walk';
    const step = walking ? Math.round(Math.sin(time * 15)) : 0;
    const bob = walking ? Math.abs(step) : Math.round(Math.sin(time * 3 + id.length) * 0.55);
    const reach = attacking ? 3 : 0;
    const lift = casting ? -2 : 0;
    const size = Number.isFinite(scale) && scale > 0 ? scale : 1;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale((facing < 0 ? -1 : 1) * size, size);

    function rect(px, py, w, h, color) {
      ctx.fillStyle = hit && color !== INK ? '#f9f2d6' : color;
      ctx.fillRect(px, py, w, h);
    }
    function slab(px, py, w, h, colors) {
      rect(px, py, w, h, INK);
      rect(px + 1, py + 1, w - 2, h - 2, colors[1]);
      rect(px + 1, py + 1, w - 2, 1, colors[2]);
      rect(px + w - 3, py + 2, 2, h - 3, colors[0]);
    }
    function boots(color = '#394557', gap = 2) {
      slab(-7, -6 + step, 6, 6 - Math.max(step, 0), [INK, color, '#68717e']);
      slab(gap, -6 - step, 6, 6 + Math.min(step, 0), [INK, color, '#68717e']);
    }
    function face(hair, skin = SKIN, top = -34) {
      rect(-7, top, 14, 13, INK);
      rect(-6, top + 1, 12, 9, hair);
      rect(-5, top + 4, 10, 8, skin[1]);
      rect(-5, top + 4, 9, 2, skin[2]);
      rect(-6, top + 3, 3, 4, hair);
      rect(-3, top + 7, 2, 2, INK);
      rect(3, top + 7, 2, 2, INK);
      rect(0, top + 10, 2, 1, skin[0]);
    }
    function detailedFace(top, hair, fringe) {
      rect(-5, top, 10, 2, INK);
      rect(-7, top + 2, 14, 9, INK);
      rect(-5, top + 10, 11, 4, INK);
      rect(-5, top + 2, 10, 4, hair[1]);
      rect(-6, top + 4, 12, 4, hair[0]);
      rect(-4, top + 5, 9, 7, SKIN[1]);
      rect(-3, top + 5, 8, 2, SKIN[2]);
      rect(-5, top + 8, 3, 3, SKIN[0]);
      rect(-3, top + 12, 7, 1, SKIN[0]);
      rect(5, top + 8, 2, 3, SKIN[0]);
      rect(-2, top + 8, 2, 2, INK);
      rect(3, top + 8, 2, 2, INK);
      rect(1, top + 11, 3, 1, '#925c54');
      rect(-4, top + 2, 7, 1, hair[2]);
      rect(-5, top + 4, fringe, 3, hair[0]);
    }
    function cuffs(px, py, colors, extended = false) {
      slab(px, py, extended ? 8 : 6, 7, colors);
      rect(px + (extended ? 6 : 2), py + 4, 3, 3, SKIN[0]);
      rect(px + (extended ? 6 : 2), py + 4, 3, 1, SKIN[2]);
    }
    function tunic(colors, wide = 16) {
      const left = -Math.floor(wide / 2);
      slab(left, -23, wide, 18, colors);
      rect(left + 2, -11, wide - 4, 3, colors[0]);
      rect(-2, -11, 4, 3, GOLD[1]);
      rect(-1, -10, 2, 1, GOLD[2]);
    }
    function shoulder(px, colors) {
      slab(px, -23, 7, 7, colors);
      rect(px + 2, -22, 2, 2, colors[2]);
    }
    function sword(px, py, length = 22, colors = STEEL) {
      rect(px + 2, py, 2, 2, INK);
      slab(px, py + 2, 6, length, colors);
      rect(px + 1, py + 2, 2, length - 2, colors[2]);
      slab(px - 3, py + length + 1, 12, 4, GOLD);
      rect(px + 2, py + length + 5, 2, 4, '#98694b');
    }
    function staff(px, py, glow, length = 29) {
      slab(px, py + 5, 4, length - 4, ['#4b3a32', '#90704e', '#d5af70']);
      rect(px - 3, py + 1, 10, 7, INK);
      rect(px - 2, py, 8, 8, GOLD[1]);
      rect(px - 1, py + 1, 6, 6, glow);
      rect(px, py + 1, 2, 2, '#edf9ec');
      rect(px + 1, py - 2, 2, 2, glow);
      if (casting) {
        rect(px - 6, py - 2, 2, 2, glow);
        rect(px + 8, py + 4, 2, 2, glow);
        rect(px + 3, py - 6, 2, 2, '#edf9ec');
      }
    }
    function axe(px, py, colors, double = false) {
      slab(px + 3, py + 3, 4, 26, ['#503c36', '#93714d', '#d2ad74']);
      rect(px - 3, py, 14, 13, INK);
      rect(px - 5, py + 2, 4, 9, INK);
      rect(px - 4, py + 3, 8, 7, colors[1]);
      rect(px - 3, py + 1, 8, 3, colors[2]);
      rect(px - 4, py + 4, 2, 5, colors[2]);
      if (double) {
        rect(px + 9, py + 2, 4, 9, INK);
        rect(px + 6, py + 3, 6, 7, colors[1]);
        rect(px + 9, py + 3, 3, 6, colors[2]);
      }
      rect(px + 3, py + 4, 4, 5, GOLD[1]);
    }
    function shield(px, py, colors, tower = false) {
      const h = tower ? 23 : 19;
      rect(px + 2, py, 12, h, INK);
      rect(px, py + 2, 16, h - 5, INK);
      rect(px + 2, py + 1, 12, h - 3, colors[1]);
      rect(px + 1, py + 3, 2, h - 7, colors[2]);
      rect(px + 3, py + 2, 10, 2, colors[2]);
      rect(px + 12, py + 4, 2, h - 8, colors[0]);
      rect(px + 5, py + 5, 6, h - 10, colors[0]);
      rect(px + 7, py + 6, 2, h - 10, colors[2]);
      rect(px + 5, py + 9, 6, 2, colors[2]);
      rect(px + 5, py + h - 2, 6, 2, INK);
    }
    function flame(px, py, colors) {
      rect(px - 3, py + 3, 8, 9, colors[0]);
      rect(px - 5, py + 7, 11, 6, colors[0]);
      rect(px - 1, py, 3, 11, colors[1]);
      rect(px - 3, py + 5, 6, 7, colors[1]);
      rect(px - 1, py + 7, 3, 6, colors[2]);
      if (casting) rect(px + 5, py - 2, 2, 3, colors[2]);
    }

    function heldWeapon(handX, handY) {
      const pulse = weapon.includes('脉冲手枪');
      const lightning = weapon.includes('引雷杖');
      const saber = weapon.includes('光剑');
      const club = weapon.includes('短棍');
      const frost = weapon.includes('冷光短刃');
      const hall = weapon.includes('礼堂');
      const swing = [0, .82, -.72, 1.2][comboStage] || .82;
      ctx.save();
      ctx.translate(handX, handY);
      if (pulse) {
        if(attacking&&Number.isFinite(aimAngle)){
          ctx.rotate(Math.atan2(Math.sin(aimAngle),Math.cos(aimAngle)*(facing<0?-1:1)));
        }
        ctx.translate(attacking && attackPhase < .38 ? -2 : 0, 0);
        rect(-2,-8,15,8,INK);
        rect(0,-7,11,5,'#52687f');
        rect(1,-7,8,1,'#a9c7d6');
        rect(9,-6,6,3,'#8be0eb');
        rect(1,-2,4,6,INK);
        rect(2,-2,2,4,'#6d7e91');
        rect(2,-5,4,1,'#7ce3f1');
        if (attacking && attackPhase < .5) {
          rect(16,-7,3,5,'#c7faff');
          rect(19,-6,3,3,'#58dff2');
        }
      } else {
        ctx.rotate(attacking ? (lightning ? .28 : swing * (1 - attackPhase * .4)) : .11);
        if (lightning) {
          staff(-2,-26,'#a9edff',32);
          rect(-3,-27,7,2,'#cfad6d');
          if(attacking) {
            rect(-6,-29,2,2,'#b9f5ff');
            rect(6,-31,3,2,'#6dd4f5');
          }
        } else if (saber) {
          slab(-3,-2,6,10,['#263c57','#556f87','#a9c5d5']);
          rect(-2,-23,5,21,'#6bc8ef');
          rect(-1,-25,2,23,'#efffff');
          rect(2,-21,2,17,'#9c89de');
          rect(-4,-3,8,2,'#b4e9f7');
        } else if (club) {
          slab(-3,-20,7,19,['#4f342a','#a87446','#d8aa73']);
          rect(-2,-18,2,11,'#d8aa73');
          rect(1,-15,2,8,'#805136');
          rect(-3,-17,7,2,'#788589');
          rect(-3,-7,7,2,'#697476');
          rect(-1,-2,3,7,'#5e3d30');
        } else {
          const metal = hall ? ['#8c4e44','#df8962','#ffd391'] : frost ?
            ['#447791','#75c7d8','#dcf8fb'] : ['#455468','#93a7ba','#d9e5eb'];
          sword(-3,frost?-15:-23,frost?11:19,metal);
          if (frost) rect(2,-13,1,7,'#effdff');
          if (hall) rect(2,-19,1,12,'#f5ad72');
        }
      }
      ctx.restore();
      rect(handX - 1,handY + 1,4,3,'#805a52');
      rect(handX - 1,handY + 1,3,1,SKIN[1]);
    }

    if (shadow) {
      rect(-11, -1, 22, 2, '#101c28');
      rect(-8, -2, 16, 4, '#101c28');
    }
    ctx.translate(attacking ? 1 : 0, -bob + lift);

    switch (id) {
      case 'ao': {
        const bronze = ['#74513c', '#a77a4f', '#d8af70'];
        const guardShift = attacking ? 3 : walking ? step : 0;
        rect(-10,-26,20,21,INK);
        rect(-8,-10,16,7,'#453937');
        boots('#584a41');
        tunic(bronze,18);
        rect(-8,-14,16,2,'#533932');
        rect(-6,-13,4,2,'#b28c62');
        rect(1,-17,6,4,'#876144');
        detailedFace(-36,['#402e2f','#62423a','#98674d'],4);
        rect(-6,-33,12,2,'#81614a');
        rect(-4,-34,8,1,'#c29865');
        rect(-4,-26,2,2,'#795047');
        rect(-2,-25,6,1,'#795047');
        shoulder(-11,bronze);
        shoulder(5,bronze);
        rect(-10,-21,4,1,'#ebc889');
        rect(6,-20,3,1,'#ebc889');
        sword(8+reach,-25-reach,14);
        cuffs(6+reach,-16,bronze,true);
        const shieldX=-17-guardShift;
        shield(shieldX,-25,bronze);
        rect(shieldX+3,-22,10,1,'#e4bc79');
        rect(shieldX+5,-17,6,5,'#63473d');
        rect(shieldX+7,-18,2,7,'#f1ce89');
        rect(shieldX+5,-16,6,2,'#bd925a');
        rect(shieldX+4,-10,2,1,'#ebc688');
        break;
      }
      case 'zhi': {
        const blue = ['#344b6c', '#6389b1', '#accde1'];
        rect(-9, -25, 20, 21, INK);
        boots('#3b4f65');
        tunic(blue, 18);
        shoulder(-11, STEEL);
        shoulder(5, STEEL);
        detailedFace(-35,['#8d9da9','#c2d0d7','#f0efdf'],2);
        rect(-8, -36, 16, 5, INK);
        rect(-7, -35, 14, 3, blue[1]);
        rect(-5, -37, 10, 2, blue[2]);
        rect(-7, -32, 2, 7, blue[0]);
        rect(5, -32, 2, 7, blue[0]);
        rect(-6,-35,12,1,'#c9d7df');
        rect(-2,-34,4,2,'#8bd6dc');
        rect(-6,-20,11,2,'#a9c6dd');
        rect(-2,-17,6,4,'#455d81');
        shield(-18 - reach, -25, blue, true);
        rect(-12 - reach, -20, 4, 12, '#a0e2e5');
        rect(-15 - reach, -17, 10, 3, '#a0e2e5');
        rect(-15-reach,-21,2,2,'#f0e3af');
        rect(-15-reach,-8,2,2,'#f0e3af');
        slab(9 + reach, -18, 5, 12, STEEL);
        if (casting) {
          rect(-15, -32, 3, 3, '#a0e2e5');
          rect(13, -28, 3, 3, '#a0e2e5');
        }
        break;
      }
      case 'csy': {
        const red = ['#60343c', '#a45855', '#df9976'];
        const tail = attacking ? 3 : walking ? 2+step : Math.round(Math.sin(time*4));
        rect(-10,-25,19,22,INK);
        rect(-12-tail,-20,8+tail,6,'#703e48');
        rect(-11-tail,-19,6+tail,2,'#b1665e');
        rect(-10,-12,5,8,'#4d363f');
        rect(4,-10,4,6,'#3b3643');
        boots('#49444f');
        slab(-8,-24,16,16,['#303b50','#5a687c','#b4bec5']);
        rect(-6,-20,3,10,'#7b8897');
        rect(-2,-19,7,2,'#8f9da9');
        rect(0,-16,6,1,'#38465a');
        rect(-7,-11,14,3,'#513741');
        rect(-1,-11,4,2,'#c39362');
        detailedFace(-37,['#392e39','#564050','#90616a'],5);
        rect(-5,-25,12,4,'#7f414a');
        rect(-4,-25,10,1,'#d08871');
        rect(2,-23,2,3,'#c07a6a');
        shoulder(-11,red);
        shoulder(5,red);
        rect(-9,-20,4,1,'#f0b28b');
        rect(7,-20,3,1,'#f0b28b');
        cuffs(-10,-17+step,red);
        const handY = -16 + (walking ? -step : 0) - (attacking ? 2 : 0);
        cuffs(6+reach,handY-4,red,true);
        if(!unarmed || weapon)heldWeapon(12+reach,handY);
        break;
      }
      case 'tang': {
        const blue = ['#344369','#5b6da0','#a2b6d7'];
        const hem = walking ? step : 0;
        boots('#3b4160');
        rect(-9,-24,18,17,INK);
        rect(-8,-22,16,14,blue[1]);
        rect(-10-hem,-10,20+hem,6,INK);
        rect(-9-hem,-9,18+hem,4,blue[0]);
        rect(-8-hem,-6,17+hem,1,'#aab5d5');
        rect(-7,-20,5,13,blue[0]);
        rect(4,-19,2,11,'#40517d');
        rect(-2,-21,3,14,'#a08060');
        rect(-1,-20,1,10,'#ddc49a');
        detailedFace(-35,['#626c89','#a6b6cb','#d7e5e7'],4);
        rect(-10,-35,20,4,INK);
        rect(-9,-34,18,2,blue[1]);
        rect(-7,-39,13,5,INK);
        rect(-6,-38,11,4,blue[1]);
        rect(-3,-42,8,5,INK);
        rect(-2,-41,6,4,blue[0]);
        rect(3,-43,3,4,blue[1]);
        rect(-5,-35,11,2,'#b39569');
        rect(0,-36,3,3,'#e8d6a7');
        rect(-6,-22,11,2,'#a1a9c7');
        rect(-2,-21,4,2,'#e0c799');
        cuffs(-12,-18+hem,blue);
        staff(10+reach,-35-reach,'#b0edfb');
        cuffs(7+reach,-17,blue,true);
        break;
      }
      case 'ge': {
        const purple = ['#3e2e56', '#71518f', '#b18ac9'];
        rect(-10, -25, 20, 23, INK);
        rect(-9, -23, 18, 19, purple[0]);
        rect(-10, -7, 6, 4, purple[1]);
        rect(5, -9, 5, 5, purple[1]);
        boots('#3b354e');
        tunic(purple, 14);
        detailedFace(-34,['#382b43','#55405f','#a57ca6'],6);
        rect(-8, -34, 16, 5, INK);
        rect(-7, -33, 14, 4, purple[1]);
        rect(-5, -36, 10, 3, purple[0]);
        rect(-6, -25, 12, 4, purple[0]);
        rect(-4, -24, 8, 1, purple[2]);
        rect(-5,-24,11,3,'#514161');
        rect(-4,-25,7,1,'#a586b7');
        rect(-5,-20,2,9,'#ad839c');
        rect(-6,-11,5,2,'#c29c78');
        rect(6, -22, 8, 3, purple[2]);
        rect(12, -20, 4, 6, purple[1]);
        sword(-15 - reach, -20 - reach, 9, ['#736082', '#b9b2cc', '#eeebf2']);
        sword(10 + reach, -24 - reach, 10, ['#736082', '#b9b2cc', '#eeebf2']);
        break;
      }
      case 'hong': {
        const green = ['#3e523b', '#6b8653', '#a6be7b'];
        rect(-9, -24, 18, 21, INK);
        rect(-8, -23, 15, 18, green[0]);
        boots('#4d493c');
        tunic(green, 15);
        detailedFace(-32,['#795c4d','#b28d59','#d6b97e'],3);
        rect(-9, -32, 18, 3, INK);
        rect(-8, -33, 16, 3, green[1]);
        rect(-5, -35, 10, 3, green[0]);
        rect(-2, -34, 5, 1, green[2]);
        rect(5, -35, 2, 6, GOLD[2]);
        rect(-6,-31,12,1,'#c0c391');
        rect(-6,-22,10,2,'#a68761');
        rect(-5,-21,2,7,'#c0a072');
        rect(-7, -14, 18, 6, INK);
        rect(-6, -13, 11, 4, '#8d6749');
        rect(3, -15, 13 + reach, 5, INK);
        rect(4, -14, 12 + reach, 3, STEEL[1]);
        rect(6, -14, 9 + reach, 1, STEEL[2]);
        rect(1, -11, 3, 5, '#99704f');
        rect(5, -17, 6, 2, INK);
        rect(6, -17, 4, 1, GOLD[2]);
        rect(9,-13,3,2,'#728397');
        rect(13,-13,2,2,'#2a3d4c');
        rect(-10, -17, 5, 5, green[2]);
        if (attacking) {
          rect(18, -16, 3, 7, '#f6d57e');
          rect(21, -14, 2, 3, '#fff0b5');
        }
        break;
      }
      case 'thorn': {
        const redSkin = ['#803c40', '#b85a50', '#de8a68'];
        boots('#4d3e42');
        rect(-11, -25, 22, 20, INK);
        rect(-10, -24, 20, 14, redSkin[1]);
        rect(-8, -24, 6, 7, redSkin[2]);
        rect(5, -19, 5, 9, redSkin[0]);
        slab(-9, -10, 18, 6, ['#493b43', '#695057', '#94716b']);
        face('#3a2b37', redSkin, -34);
        rect(-3, -38, 6, 5, INK);
        rect(-2, -37, 4, 4, '#5c3945');
        rect(-5, -25, 3, 3, '#f3d0a0');
        rect(3, -25, 3, 3, '#f3d0a0');
        rect(-13, -25, 8, 7, '#362d38');
        rect(-12, -26, 3, 4, '#7f7275');
        rect(-9, -24, 3, 5, '#7f7275');
        rect(5, -25, 8, 7, '#362d38');
        rect(8, -26, 3, 4, '#7f7275');
        axe(9 + reach, -31 - reach, ['#653f45', '#a85b50', '#e4b091'], true);
        slab(-15, -18, 6, 10, redSkin);
        break;
      }
      case 'hammer': {
        const rock = ['#3c5662', '#6d8c96', '#a9c2c2'];
        slab(-11, -10 + step, 10, 10, rock);
        slab(3, -10 - step, 11, 10, rock);
        rect(-14, -29, 27, 23, INK);
        slab(-12, -28, 24, 19, rock);
        slab(-16 - reach, -27 - reach, 10, 14, rock);
        slab(9 + reach, -26 - reach, 10, 15, rock);
        slab(-18 - reach, -15 - reach, 11, 9, rock);
        slab(11 + reach, -13 - reach, 10, 9, rock);
        slab(-8, -37, 17, 14, rock);
        rect(-4, -39, 7, 4, rock[1]);
        rect(-4, -30, 3, 2, '#c3f1ce');
        rect(3, -30, 3, 2, '#c3f1ce');
        rect(-3, -23, 9, 11, '#284450');
        rect(-1, -22, 5, 9, '#71bdb4');
        rect(0, -21, 2, 4, '#c1f0d6');
        rect(-10, -20, 4, 2, rock[2]);
        rect(5, -16, 5, 2, rock[2]);
        rect(-6, -12, 4, 2, rock[0]);
        break;
      }
      case 'forge': {
        const copper = ['#725143', '#b58151', '#e6bc7d'];
        boots('#604c44');
        slab(-11, -23, 22, 18, copper);
        slab(-16, -20, 8, 13, copper);
        slab(9 + reach, -22 - reach, 8, 16, STEEL);
        face('#67473c', ['#486e4d', '#77a16e', '#b2c68a'], -34);
        slab(-8, -30, 17, 6, GOLD);
        rect(-6, -29, 5, 3, '#749ca6');
        rect(2, -29, 5, 3, '#749ca6');
        rect(-6, -29, 2, 1, '#d9f4ea');
        slab(-4, -20, 9, 9, STEEL);
        rect(-1, -18, 3, 5, '#f3c879');
        rect(11 + reach, -28 - reach, 4, 10, '#8f7864');
        rect(9 + reach, -31 - reach, 8, 4, GOLD[1]);
        break;
      }
      case 'gate': {
        const teal = ['#345a61', '#64988e', '#a3cfc0'];
        boots('#38535d');
        tunic(teal, 18);
        face('#4d847f', ['#4b7c79', '#79a7a0', '#b0cfc0'], -34);
        rect(-10, -31, 4, 8, teal[0]);
        rect(7, -31, 4, 8, teal[0]);
        rect(-6, -37, 12, 4, teal[1]);
        rect(-2, -40, 4, 4, GOLD[1]);
        shoulder(-11, GOLD);
        shoulder(5, GOLD);
        shield(-17 - reach, -24, teal, true);
        sword(10 + reach, -29 - reach, 22, GOLD);
        break;
      }
      case 'blade': {
        const brown = ['#553d43', '#93634f', '#c99970'];
        boots('#544246');
        tunic(brown, 17);
        face('#38313c', ['#7c4f47', '#b4795c', '#d7a679'], -33);
        rect(-7, -35, 14, 5, INK);
        rect(-6, -34, 12, 3, '#864f49');
        rect(-6, -27, 12, 6, '#7c5148');
        rect(-4, -26, 8, 2, '#d7bb91');
        rect(-5, -21, 3, 11, '#ae8160');
        shoulder(-11, STEEL);
        rect(9 + reach, -33 - reach, 5, 22, INK);
        rect(10 + reach, -32 - reach, 3, 19, STEEL[1]);
        rect(12 + reach, -32 - reach, 3, 10, STEEL[2]);
        rect(10 + reach, -35 - reach, 3, 4, STEEL[2]);
        slab(6 + reach, -12 - reach, 11, 3, GOLD);
        rect(10 + reach, -9 - reach, 3, 5, '#6c4c3d');
        break;
      }
      case 'axe': {
        const fur = ['#675c58', '#a49983', '#ded2b1'];
        boots('#5d4c45');
        tunic(['#394a68', '#5e7593', '#94afc1'], 20);
        rect(-11, -32, 22, 16, INK);
        rect(-10, -31, 20, 14, fur[1]);
        rect(-9, -30, 18, 3, fur[2]);
        rect(-7, -25, 3, 2, INK);
        rect(4, -25, 3, 2, INK);
        rect(-7, -22, 14, 5, fur[2]);
        rect(-5, -22, 3, 8, '#f2e7cc');
        rect(3, -22, 3, 8, '#f2e7cc');
        rect(-1, -23, 3, 2, '#6f605a');
        slab(-18 - reach, -20 - reach, 10, 12, ['#5d4249', '#a86d59', '#dca178']);
        slab(9 + reach, -22 - reach, 11, 13, ['#5d4249', '#a86d59', '#dca178']);
        rect(-12, -35, 24, 4, '#d0c09b');
        rect(-6, -37, 12, 3, '#ad926c');
        break;
      }
      case 'swift': {
        const blue = ['#3b596e', '#649eaf', '#a2d4db'];
        boots('#3b4c61');
        tunic(blue, 17);
        face('#795b7a', ['#52788c', '#83b6c2', '#b2dce0'], -33);
        rect(-5, -36, 10, 4, '#704973');
        rect(-2, -39, 5, 5, '#a2829f');
        rect(-6, -24, 3, 4, '#ede1c0');
        rect(4, -24, 3, 4, '#ede1c0');
        axe(-17 - reach, -25 - reach, STEEL);
        axe(8 + reach, -31 - reach, STEEL);
        break;
      }
      case 'spear': {
        const brass = ['#61543e', '#ac9258', '#e3ce85'];
        boots('#4e4e48');
        tunic(['#3f5363', '#688a9d', '#b5cbd1'], 18);
        shoulder(-11, brass);
        shoulder(5, brass);
        rect(-8, -35, 16, 15, INK);
        rect(-7, -34, 14, 12, brass[1]);
        rect(-6, -33, 12, 2, brass[2]);
        rect(-5, -29, 10, 4, INK);
        rect(-1, -32, 3, 10, brass[2]);
        rect(-4, -40, 8, 6, '#8c5b55');
        rect(-3, -41, 6, 3, '#c28b72');
        shield(-17 - reach, -25, brass, true);
        slab(12 + reach, -37 - reach, 3, 31, ['#57493a', '#b39962', '#e2c987']);
        rect(11 + reach, -40 - reach, 5, 7, STEEL[2]);
        break;
      }
      case 'fire': {
        const red = ['#7d3e45', '#c3634f', '#efa36c'];
        rect(-8, -35, 16, 29, INK);
        rect(-7, -34, 14, 26, '#a34e40');
        rect(-9, -29, 3, 19, '#dc7a48');
        rect(6, -30, 4, 22, '#eea263');
        boots('#6d3f42');
        rect(-7, -22, 14, 18, INK);
        rect(-6, -21, 12, 16, red[1]);
        rect(-4, -20, 3, 14, red[2]);
        rect(3, -18, 3, 13, red[0]);
        rect(-5, -9, 10, 2, GOLD[1]);
        face('#d77e4d', SKIN, -34);
        rect(-6, -34, 12, 4, '#f0a465');
        rect(-6, -31, 3, 6, '#de824d');
        rect(4, -32, 3, 9, '#dd7d48');
        rect(-1, -36, 3, 4, GOLD[2]);
        staff(10 + reach, -30 - reach, '#fac07b', 27);
        flame(11 + reach, -39 - reach, ['#ac4e4c', '#ef9a55', '#ffe0a3']);
        rect(-11, -18, 5, 4, red[1]);
        rect(-12, -14, 4, 4, SKIN[1]);
        break;
      }
      case 'ice': {
        const frost = ['#4f668b', '#8eb5cd', '#c9e8ec'];
        const flap = Math.round(Math.sin(time * 7)) * 2;
        rect(-19, -26 + flap, 13, 7, INK);
        rect(6, -26 - flap, 13, 7, INK);
        rect(-18, -25 + flap, 11, 5, frost[1]);
        rect(7, -25 - flap, 11, 5, frost[1]);
        rect(-15, -20 + flap, 8, 7, INK);
        rect(7, -20 - flap, 8, 7, INK);
        rect(-14, -19 + flap, 6, 4, frost[0]);
        rect(8, -19 - flap, 6, 4, frost[0]);
        slab(-7, -26, 14, 20, frost);
        rect(-9, -32, 5, 9, INK);
        rect(4, -32, 5, 9, INK);
        rect(-8, -31, 3, 7, frost[1]);
        rect(5, -31, 3, 7, frost[1]);
        rect(-5, -24, 3, 3, '#d7f4e6');
        rect(3, -24, 3, 3, '#d7f4e6');
        rect(-4, -15, 8, 6, frost[2]);
        rect(-4, -7, 3, 5, '#86a5b4');
        rect(2, -7, 3, 5, '#86a5b4');
        if (casting) {
          rect(-11, -9, 2, 4, '#c9f0f6');
          rect(-12, -8, 4, 2, '#c9f0f6');
          rect(12, -29, 2, 4, '#c9f0f6');
        }
        break;
      }
      case 'bow': {
        const green = ['#3b6254', '#709869', '#b0ca8f'];
        rect(-9, -27, 18, 23, INK);
        rect(-8, -25, 16, 20, green[0]);
        boots('#4c5846');
        tunic(green, 14);
        face('#a7bca0', ['#ae8e77', '#ddc3a0', '#f0dfbe'], -33);
        rect(-11, -28, 5, 3, SKIN[1]);
        rect(7, -28, 5, 3, SKIN[1]);
        rect(-7, -35, 14, 4, green[0]);
        rect(-4, -37, 8, 3, green[1]);
        rect(3, -38, 2, 7, '#c5dbb2');
        rect(-7, -18, 22, 5, INK);
        rect(-6, -17, 20, 3, '#ad9161');
        rect(3, -23, 4, 15, INK);
        rect(4, -22, 2, 13, STEEL[2]);
        rect(1, -25, 8, 3, GOLD[1]);
        rect(-9, -21, 3, 9, green[2]);
        rect(12, -22, 3, 9, green[2]);
        break;
      }
      case 'shadow': {
        const violet = ['#3d3656', '#76618d', '#b49bc6'];
        boots('#363849');
        tunic(violet, 14);
        face('#4a3c59', ['#557453', '#7da46c', '#aec491'], -31);
        rect(-10, -27, 4, 4, '#7da46c');
        rect(7, -27, 4, 4, '#7da46c');
        rect(-8, -34, 16, 8, INK);
        rect(-7, -33, 14, 5, violet[1]);
        rect(-6, -23, 12, 4, violet[0]);
        slab(-5, -22, 10, 4, STEEL);
        sword(10 + reach, -23 - reach, 10, ['#5f5d75', '#aaa8b7', '#e4dedf']);
        rect(-13 - reach, -17, 6, 3, GOLD[1]);
        rect(-11 - reach, -20, 2, 9, STEEL[2]);
        rect(-14 - reach, -17, 8, 2, STEEL[2]);
        break;
      }
      case 'priest': {
        const robe = ['#334c4b', '#5a8073', '#9ac6a0'];
        rect(-9, -27, 18, 24, INK);
        rect(-11, -10, 22, 8, INK);
        rect(-8, -26, 16, 22, robe[1]);
        rect(-10, -9, 20, 5, robe[0]);
        rect(-6, -21, 3, 14, robe[2]);
        rect(4, -20, 3, 16, robe[0]);
        rect(-2, -23, 4, 19, '#c2ba86');
        rect(-8, -36, 16, 16, INK);
        rect(-7, -35, 14, 13, robe[0]);
        rect(-5, -38, 10, 4, INK);
        rect(-4, -37, 8, 3, robe[1]);
        rect(-6, -33, 12, 4, robe[1]);
        rect(-5, -29, 10, 7, '#1c2e37');
        rect(-3, -28, 2, 2, '#c8f2c2');
        rect(3, -28, 2, 2, '#c8f2c2');
        rect(0, -25, 2, 2, '#7faaa0');
        staff(11, -35 - reach, '#b9edb8', 32);
        rect(8, -35 - reach, 10, 2, GOLD[1]);
        rect(8, -28 - reach, 10, 2, GOLD[1]);
        rect(-12, -20, 4, 8, robe[2]);
        rect(-12, -14, 3, 3, '#aac9ad');
        break;
      }
      default:
        boots();
        tunic(STEEL);
        face('#635360');
        sword(9, -29, 21);
    }
    ctx.restore();
  }

  const api = { draw, meta, ids: Object.keys(meta) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.HeroPixels = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
