/* Content snapshot from the current game rules. Visual prototype only. */
window.GameContent = {
  "cards": [
    {
      "id": "ao",
      "name": "敖犬",
      "job": "守卫",
      "tribe": "611",
      "cost": 1,
      "atk": 13,
      "skill": "反击螺旋",
      "desc": "被攻击三次后旋盾反击附近敌人"
    },
    {
      "id": "zhi",
      "name": "志兵",
      "job": "守卫",
      "tribe": "611",
      "cost": 2,
      "atk": 10,
      "skill": "千手护阵",
      "desc": "周期护盾，吸伤后爆炸"
    },
    {
      "id": "csy",
      "name": "CSY",
      "job": "战士",
      "tribe": "611",
      "cost": 2,
      "atk": 17,
      "skill": "越战越勇",
      "desc": "持续攻击逐渐增强"
    },
    {
      "id": "tang",
      "name": "唐卵",
      "job": "法师",
      "tribe": "611",
      "cost": 2,
      "atk": 14,
      "skill": "一杖断灯",
      "desc": "闪电跳跃攻击多个怪"
    },
    {
      "id": "ge",
      "name": "歌姬",
      "job": "潜行者",
      "tribe": "611",
      "cost": 3,
      "atk": 19,
      "skill": "小贱连跳",
      "desc": "对残血目标连续追击，游走时留影协防"
    },
    {
      "id": "hong",
      "name": "红星",
      "job": "猎人",
      "tribe": "611",
      "cost": 1,
      "atk": 15,
      "skill": "猥琐撤",
      "desc": "优先射击漏网怪，受击时向后撤步"
    },
    {
      "id": "thorn",
      "name": "赤斧酋长",
      "job": "战士",
      "tribe": "洞洞族",
      "cost": 1,
      "atk": 11,
      "skill": "嘲讽",
      "desc": "吸引附近怪物攻击自己，短暂提升护甲"
    },
    {
      "id": "hammer",
      "name": "岩之灵",
      "job": "战士",
      "tribe": "灵族",
      "cost": 1,
      "atk": 13,
      "skill": "投掷",
      "desc": "抛退怪物，落地伤害并眩晕周围敌人"
    },
    {
      "id": "forge",
      "name": "霸天者",
      "job": "工匠",
      "tribe": "哥布林",
      "cost": 1,
      "atk": 11,
      "skill": "弹片冲击",
      "desc": "持续发射弹片，伤害并短暂打断附近怪物"
    },
    {
      "id": "gate",
      "name": "海渊守卫",
      "job": "战士",
      "tribe": "海族",
      "cost": 2,
      "atk": 15,
      "skill": "侵蚀",
      "desc": "降低随机怪物的护甲"
    },
    {
      "id": "blade",
      "name": "剑客",
      "job": "战士",
      "tribe": "洞洞族",
      "cost": 2,
      "atk": 18,
      "skill": "旋风斩",
      "desc": "持续旋转，对近处怪物造成魔法伤害"
    },
    {
      "id": "axe",
      "name": "海象拳王",
      "job": "战士",
      "tribe": "野兽",
      "cost": 1,
      "atk": 20,
      "skill": "北海神拳",
      "desc": "强化普攻，将目标击飞"
    },
    {
      "id": "swift",
      "name": "狂战士",
      "job": "战士",
      "tribe": "冰川族",
      "cost": 3,
      "atk": 19,
      "skill": "风之狂斧",
      "desc": "切换目标或攻击时挥出狂斧，伤害一群怪物"
    },
    {
      "id": "spear",
      "name": "战神",
      "job": "战士",
      "tribe": "神族",
      "cost": 3,
      "atk": 0,
      "skill": "持盾猛击",
      "desc": "抵御正面攻击，周期击退前方怪物"
    },
    {
      "id": "fire",
      "name": "焰灵法师",
      "job": "法师",
      "tribe": "人族",
      "cost": 2,
      "atk": 15,
      "skill": "神灭",
      "desc": "重创随机怪物，随后提升自身攻速"
    },
    {
      "id": "ice",
      "name": "冰蝠",
      "job": "法师",
      "tribe": "龙族",
      "extraTribe": "不眠",
      "cost": 1,
      "atk": 14,
      "skill": "低温愈合",
      "desc": "冰封并保护半血以下的队友，同时恢复生命"
    },
    {
      "id": "bow",
      "name": "光羽弩手",
      "job": "猎人",
      "tribe": "光羽族",
      "cost": 1,
      "atk": 16,
      "skill": "星之矢",
      "desc": "狙击最远怪物，距离越远伤害和眩晕越强"
    },
    {
      "id": "shadow",
      "name": "刺魂者",
      "job": "潜行者",
      "tribe": "哥布林",
      "cost": 1,
      "atk": 17,
      "skill": "麻痹飞镖",
      "desc": "向随机怪物投掷飞镖，造成伤害并短暂眩晕"
    },
    {
      "id": "priest",
      "name": "蚀光之暗",
      "job": "牧师",
      "tribe": "不眠",
      "cost": 3,
      "atk": 12,
      "skill": "鲜血之潮",
      "desc": "汲取受伤队友附近怪物的生命，治疗队友"
    }
  ],
  "chapters": {
    "chapel": {
      "name": "赤灯礼堂",
      "intro": [
        "旧礼堂的灯一盏盏亮起，巡逻队走出了门。",
        "留意给怪群加血的医官，最后一起守高地。"
      ],
      "enemyNames": {
        "normal": "赤灯哨兵",
        "fast": "回廊斥候",
        "heavy": "赤甲卫士",
        "healer": "提灯医官"
      },
      "sections": [
        {
          "name": "回廊巡逻",
          "through": 3,
          "types": [
            "normal",
            "normal",
            "fast"
          ]
        },
        {
          "name": "甲库增援",
          "through": 6,
          "types": [
            "normal",
            "fast",
            "heavy",
            "heavy"
          ]
        },
        {
          "name": "礼堂仪式",
          "through": 9,
          "types": [
            "normal",
            "heavy",
            "healer",
            "healer"
          ]
        }
      ],
      "boss": {
        "name": "赤灯指挥官",
        "kind": "warden",
        "turnAt": 0.62,
        "addHp": 360,
        "castTime": 14,
        "stages": [
          "指挥官迎战",
          "司礼官复苏仪式",
          "指挥官再战"
        ],
        "addName": "赤灯司礼官"
      }
    },
    "tower": {
      "name": "黑塔之巅",
      "intro": [
        "晚风卷过校园旧钟楼，两道火光落在塔顶。",
        "先清掉火灵，才有机会迎战降落的首领。"
      ],
      "enemyNames": {
        "normal": "黑塔残卫",
        "fast": "暮翼斥候",
        "heavy": "灰甲傀儡",
        "healer": "余烬祭司"
      },
      "sections": [
        {
          "name": "塔门斥候",
          "through": 3,
          "types": [
            "fast",
            "normal",
            "fast"
          ]
        },
        {
          "name": "灰烬长廊",
          "through": 6,
          "types": [
            "fast",
            "heavy",
            "normal",
            "healer"
          ]
        },
        {
          "name": "登顶攻势",
          "through": 9,
          "types": [
            "heavy",
            "fast",
            "heavy",
            "healer"
          ]
        }
      ],
      "boss": {
        "name": "裂翼守望者",
        "kind": "shade",
        "turnAt": 0.65,
        "addHp": 280,
        "castTime": 14,
        "stages": [
          "塔顶交锋",
          "升空 · 两侧火灵",
          "降落再战",
          "裂翼狂暴"
        ],
        "addName": "余烬火灵"
      }
    }
  },
  "capacity": [
    2,
    2,
    3,
    4,
    4,
    5,
    6,
    7,
    7,
    7
  ]
};
