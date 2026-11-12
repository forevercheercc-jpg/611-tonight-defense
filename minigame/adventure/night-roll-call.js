'use strict';

const rooms = ['611 寝室', '六楼走廊', '613 门口', '613 寝室'];
const floors = {
  dorm: [[0, 390, 208], [100, 173, 157], [151, 211, 104]],
  front: [[0, 105, 208], [285, 325, 142], [285, 390, 208]],
  back: [[98, 173, 180], [203, 288, 180], [250, 321, 142]],
  fight: [[0, 390, 208], [144, 200, 173]],
  end: [[0, 390, 208]]
};

function create(stage = 0, complete = false) {
  return {
    stage, complete, x: [43, 30, 40, 37][stage], y: 208, vy: 0, grounded: true,
    facing: 1, walking: false, back: false, climbing: false, chair: false,
    guitar: stage > 0, lamp: 0, read: {}, table: false, recording: false,
    fight: 'waiting', timer: 0, monsterX: 320, misses: 0, time: 0,
    dialogue: complete ? ['第一关完成', '两间寝室都到齐了。还有一个人在楼下等你。'] :
      stage === 0 ? ['02:17', 'CSY：「敖犬？给我递口水。」', '暖水瓶盖还在转。其余床位全空了。'] : null
  };
}

function platforms(s) {
  if (s.stage === 0) return s.chair ? floors.dorm.concat([[72, 96, 182]]) : floors.dorm;
  if (s.stage === 1) return s.back ? floors.back : floors.front;
  return s.stage === 2 ? floors.fight : floors.end;
}

function ladder(s) {
  if (s.stage === 0) return {x: 160, top: 104, bottom: 157};
  if (s.stage === 1 && s.back) return {x: 266, top: 142, bottom: 180};
  return null;
}

function say(s, ...lines) { s.dialogue = lines; }

function enter(s, stage) {
  const read = s.read;
  Object.assign(s, create(stage), {read});
  if (stage === 1) say(s, '盛雷（消息）：「醒了就来 613。', '带上你那把吉他。」', 'CSY 的回复发送失败。');
  if (stage === 2) say(s, '门内的声音：「我一贱你就笑。」', 'CSY：「红星？」', '墙上先伸出了一条胳膊的影子。');
}

function place(s, x, y) {
  Object.assign(s, {x, y, vy: 0, grounded: true, climbing: false});
}

function nearby(s, x, y, radius = 21) {
  return Math.abs(s.x - x) <= radius && Math.abs(s.y - y) <= 13;
}

function interaction(s) {
  if (s.dialogue || s.complete) return null;
  if (s.climbing) return {label: '继续攀爬', run() {}};
  const pipe = ladder(s);
  if (pipe && nearby(s, pipe.x, pipe.bottom, 11)) return {label: '攀爬', run() {
    s.x = pipe.x;
    s.climbing = true;
    s.grounded = false;
  }};

  if (s.stage === 0) {
    if (!s.guitar && nearby(s, 48, 208, 12)) return {label: '拿吉他', run() {
      s.guitar = true;
      say(s, '琴弦轻响，有一根走了音。');
    }};
    if (!s.chair && nearby(s, 70, 208, 13)) return {label: '推椅子', run() { s.chair = true; }};
    if (nearby(s, 188, 104)) return {label: '翻出气窗', run() {
      if (s.guitar) enter(s, 1);
      else say(s, 'CSY：「先把吉他带上。」');
    }};
    if (!s.read.list && nearby(s, 119, 208, 14)) return {label: '看点名条', run() {
      s.read.list = true;
      say(s, '志兵画了六个勾，唯独你的勾是红的。', '记忆里有人说：「你先替我答一声。」');
    }};
    if (!s.read.chat && nearby(s, 248, 208)) return {label: '查群聊', run() {
      s.read.chat = true;
      say(s, '红星在群里说：「都自己人，开个玩笑嘛。」', '私聊：「原视频别删。我什么也没看见。」');
    }};
    if (nearby(s, 356, 208)) return {label: '推寝室门', run() {
      say(s, '门外倒着一辆铁柜。', '床架旁的管道通到半开的气窗。');
    }};
  }

  if (s.stage === 1) {
    if (!s.back && s.lamp === 1 && nearby(s, 96, 208, 10)) return {label: '钻到后景', run() {
      s.back = true;
      place(s, 109, 180);
    }};
    if (!s.back && nearby(s, 58, 208, 25)) return {label: '拨应急灯', run() { s.lamp = (s.lamp + 1) % 3; }};
    if (s.back && nearby(s, 307, 142, 14)) return {label: '回到前景', run() {
      s.back = false;
      place(s, 308, 142);
    }};
    if (!s.back && !s.read.note && nearby(s, 326, 208, 13)) return {label: '捡便签', run() {
      s.read.note = true;
      say(s, '王凯：「带原件。别只拿群里的截图。」', '截图标题是「611 无人生还」。', '举杯的人身旁，有一只手被裁掉了。');
    }};
    if (!s.back && nearby(s, 362, 208)) return {label: '走向 613', run() { enter(s, 2); }};
  }

  if (s.stage === 2) {
    if (s.fight === 'stunned' && Math.abs(s.x - s.monsterX) <= 47) return {label: '挥吉他', run() {
      s.fight = 'down';
      s.timer = .55;
      say(s, '琴弦炸响。怪物撞上门框。', 'CSY 攥着琴颈，顺墙瘫坐在地。');
    }};
    if (s.fight === 'down' && nearby(s, 346, 208, 28)) return {label: '推开 613', run() { enter(s, 3); }};
  }

  if (s.stage === 3) {
    if (nearby(s, 126, 208)) return {label: '看登记表', run() {
      s.table = true;
      say(s, '611 全员到齐　02:17', '613 全员到齐　02:17', '两间屋子都空着，墨迹还是湿的。');
    }};
    if (nearby(s, 228, 208)) return {label: '听录音', run() {
      s.recording = true;
      say(s, '梅杰：「灯照墙。别回头。」', '李志鹏：「你带他走，我把门顶住。」', '梅杰：「等等。它把那个人拦住了。」', 'CSY 的声音：「你别替我答到。」', '录音里那根走音的弦，和你手里的一样。');
    }};
    if (nearby(s, 344, 208, 25)) return {label: '看手机', run() {
      if (!s.table || !s.recording) {
        say(s, '先看看桌上的两张登记表和旧手机。');
        return;
      }
      s.complete = true;
      say(s, '02:17　CSY（已发送）', '「把门关好。别让醒过来的我进去。」', '夜班人：「两间都到齐了。', '还有一个人在楼下等你。」', '楼下响了三声。第一关完成。');
    }};
  }
  return null;
}

function jump(s) {
  if (s.dialogue || s.complete || !s.grounded || s.climbing) return;
  s.vy = -218;
  s.grounded = false;
}

function clues(s) {
  const lines = [];
  if (s.read.list) lines.push('611 点名条：CSY 的勾是红笔画的。');
  if (s.read.chat) lines.push('红星私聊：「原视频别删。」');
  if (s.read.note) lines.push('王凯留条：「带原件，别只拿截图。」');
  if (s.table) lines.push('两张登记表：两间寝室均在 02:17 到齐。');
  if (s.recording) lines.push('录音里，CSY 说：「你别替我答到。」');
  return lines.length ? lines : ['目前还没有收录线索。'];
}

function fight(s, dt) {
  if (s.fight === 'waiting' && s.x > 106) {
    s.fight = 'warn';
    s.timer = 1.2;
    s.monsterX = 320;
  } else if (s.fight === 'warn' || s.fight === 'lunge' || s.fight === 'stunned') {
    s.timer -= dt;
    if (s.fight === 'lunge') {
      s.monsterX = Math.max(176, s.monsterX - 350 * dt);
      if (s.y > 187 && Math.abs(s.x - s.monsterX) < 18) {
        s.misses++;
        place(s, 111, 208);
        s.fight = 'waiting';
        s.monsterX = 320;
        say(s, '影子先扫过地面。', '跳上矮台，等它扑空再挥吉他。');
        return;
      }
    }
    if (s.timer > 0) return;
    if (s.fight === 'warn') { s.fight = 'lunge'; s.timer = .42; }
    else if (s.fight === 'lunge') { s.fight = 'stunned'; s.timer = 2.7; }
    else { s.fight = 'warn'; s.timer = 1.2; s.monsterX = 320; }
  } else if (s.fight === 'down') s.timer = Math.max(0, s.timer - dt);
}

function step(s, elapsed, direction) {
  const dt = Math.min(elapsed, .034);
  s.time += dt;
  if (s.dialogue || s.complete) { s.walking = false; return; }
  if (s.climbing) {
    const pipe = ladder(s);
    s.y = Math.max(pipe.top, s.y - 64 * dt);
    if (s.y === pipe.top) place(s, pipe.x, pipe.top);
    return;
  }

  s.walking = Boolean(direction);
  if (direction) s.facing = direction;
  s.x = Math.max(11, Math.min(379, s.x + direction * 111 * dt));
  const nextY = s.y + (s.vy + 285 * dt) * dt;
  s.vy += 570 * dt;
  const ledge = platforms(s).filter(([left, right, y]) =>
    s.x >= left && s.x <= right && s.y <= y && nextY >= y).sort((a, b) => a[2] - b[2])[0];
  s.grounded = Boolean(ledge);
  s.y = ledge ? ledge[2] : nextY;
  if (ledge) s.vy = 0;
  if (s.y > 253) {
    s.back = false;
    place(s, 32, 208);
  }
  if (s.stage === 2) fight(s, dt);
}

module.exports = {rooms, create, platforms, ladder, interaction, jump, step, clues};
