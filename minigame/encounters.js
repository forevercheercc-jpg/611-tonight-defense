'use strict';

// Each chapter shares the same three lanes and has its own wave and boss plan.
const CHAPTERS={
  chapel:{
    name:'赤灯礼堂',intro:['旧礼堂的灯一盏盏亮起，巡逻队走出了门。','留意给怪群加血的医官，最后一起守高地。'],
    enemyNames:{normal:'赤灯哨兵',fast:'回廊斥候',heavy:'赤甲卫士',healer:'提灯医官'},
    sections:[
      {name:'回廊巡逻',through:1,types:['normal','normal','fast'],story:'旧礼堂的灯亮了，巡逻队正在接近。'},
      {name:'甲库增援',through:2,types:['normal','fast','heavy','heavy'],story:'甲库大门打开，重甲卫士前来增援。'},
      {name:'礼堂仪式',through:5,types:['normal','heavy','healer','healer'],story:'提灯医官治疗怪物，控制技能可以打断。'}
    ],
    boss:{name:'赤灯指挥官',kind:'warden',turnAt:.62,addHp:360,castTime:10,
      stages:['指挥官迎战','司礼官复苏仪式','指挥官再战'],addName:'赤灯司礼官'}
  },
  tower:{
    name:'黑塔之巅',intro:['晚风卷过校园旧钟楼，两道火光落在塔顶。','先清掉火灵，才有机会迎战降落的首领。'],
    enemyNames:{normal:'黑塔残卫',fast:'暮翼斥候',heavy:'灰甲傀儡',healer:'余烬祭司'},
    sections:[
      {name:'塔门斥候',through:1,types:['fast','normal','fast'],story:'钟楼传来异响，暮翼斥候涌出塔门。'},
      {name:'灰烬长廊',through:2,types:['fast','heavy','normal','healer'],story:'残血暮翼斥候会加速，注意远程拦截。'},
      {name:'登顶攻势',through:5,types:['heavy','fast','heavy','healer'],story:'灰甲傀儡掩护暮翼，塔顶的影子正在苏醒。'}
    ],
    boss:{name:'裂翼守望者',kind:'shade',turnAt:.65,addHp:520,castTime:9,
      stages:['塔顶交锋','升空 · 两侧火灵','降落再战','裂翼狂暴'],addName:'余烬火灵'}
  }
};
function sectionFor(chapter,wave){
  return CHAPTERS[chapter].sections.find(section=>wave<=section.through);
}
module.exports={CHAPTERS,sectionFor};
