'use strict';

// Each floor is an independent, editable 23x23 area map. Wall segments carve
// rooms and loops out of open ground; props then place story and combat beats.
function buildMap(size,walls,props){
  const grid=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>x===0||y===0||x===size-1||y===size-1?'#':'.'));
  walls.forEach(w=>{
    for(let p=w.from;p<=w.to;p++){
      if((w.openings||[]).includes(p))continue;
      const x=w.axis==='h'?p:w.at,y=w.axis==='h'?w.at:p;
      if(grid[y]&&grid[y][x])grid[y][x]='#';
    }
  });
  props.forEach(([x,y,tile])=>{if(grid[y]&&grid[y][x])grid[y][x]=tile;});
  return grid.map(row=>row.join(''));
}

module.exports = {
  id: 'return-611',
  title: '重返 611',
  mapRevision: 6,
  floors: [
    {
      id: 'dorm', name: '611 寝室',
      regions: [
        {name:'金属床架大厅',scene:'bunks',x1:1,x2:21,y1:1,y2:6},
        {name:'西侧储物间',scene:'storage',x1:1,x2:6,y1:8,y2:17},
        {name:'611寝室大厅',scene:'dorm',x1:8,x2:14,y1:8,y2:17},
        {name:'东侧盥洗区',scene:'wash',x1:16,x2:21,y1:8,y2:17},
        {name:'寝室入口',scene:'landing',x1:8,x2:14,y1:18,y2:21}
      ],
      defaultScene:'landing',
      landmarks:{
        '7,20':'dormSign','11,22':'dormSign','15,20':'window','7,14':'westSign','15,14':'eastSign',
        '1,9':'boxes','2,10':'boxes','6,15':'boxes','8,16':'bunk','14,15':'bunk',
        '17,9':'pipes','21,11':'pipes','21,16':'pipes','9,7':'window','13,7':'window',
        '4,4':'bunk','5,4':'bunk','17,4':'bunk','18,4':'bunk','11,7':'warning'
      },
      lamps:[[11,22,'240,173,90',.34],[7,20,'240,173,90',.26],[15,20,'134,194,215',.20,true],[7,9,'244,174,88',.29],
        [15,9,'135,210,201',.25],[15,14,'224,177,108',.24],[11,5,'228,114,81',.24]],
      intro: '多年后，六个室友约好回学校看看。\nCSY 推开 611 的门，灯突然闪了三下。\n熟悉的寝室变成陌生回廊，门外传来敖犬的声音。\n先找到室友，再一起寻找出去的路。',
      map: buildMap(23,[
        {axis:'h',at:7,from:1,to:21,openings:[11]},
        {axis:'v',at:7,from:8,to:21,openings:[13]},
        {axis:'v',at:15,from:8,to:21,openings:[13]}
      ],[
        [11,20,'@'],[11,19,'p'],[11,14,'n'],[11,11,'m'],[4,12,'m'],[4,10,'m'],[18,12,'m'],[19,9,'m'],[10,9,'P'],[11,8,'G'],[7,13,'G'],[15,13,'G'],[7,11,'C'],[15,11,'C'],
        [3,10,'s'],[19,10,'s'],[19,14,'p'],[2,15,'g'],[20,16,'g'],[10,16,'o'],[13,16,'r'],
        [3,3,'C'],[19,3,'C'],[4,5,'C'],[18,5,'C'],[17,10,'C'],[20,15,'C'],[11,3,'b'],[20,2,'x']
      ]),
      dialogue: ['敖犬：你这横移挺熟练啊！刚才那一下差点把我床铺撞散。', 'CSY：它冲锋会锁定方向，躲开后就会撞上铁架。', '敖犬：趁它发懵，狠狠干它！'],
      npcDialogue: '敖犬：西边储物间窄，里面有把扇面短棍；东边盥洗区能借柜台躲冲锋，墙边放着单体武器和药水。选一边，我们从北门合流。',
      enemy: {name:'回廊哨兵',hp:34,attack:9,defense:1,gold:2},
      enemiesAt: {'11,11':{behavior:'charge',name:'撞门杂兵',hp:26,attack:8,defense:1},'4,12':{behavior:'charge',name:'储物间冲锋手',hp:32,attack:9,defense:2},'4,10':{behavior:'charge',name:'储物间冲锋手',hp:32,attack:9,defense:2},'18,12':{behavior:'charge',name:'盥洗区冲锋手',hp:38,attack:10,defense:3}},
      boss: {name:'611 铁架巨影',hp:150,attack:13,defense:5},
      weapon: {name:'旧练习剑',attack:8,kind:'sword'},
      weaponsAt: {'3,10':{name:'储物间床板短棍',attack:10,kind:'cleave'},'19,10':{name:'盥洗区练习剑',attack:11,kind:'sword'},'12,15':{name:'合照短棍',attack:12,kind:'cleave'}},
      exit: '寝室灯重新亮起。敖犬捡起合照：红星在照片背面画了个箭头。\n敖犬：往东边教学楼走，唐卵应该还在那儿。'
    },
    {
      id: 'corridor', name: '封锁教学楼',
      regions: [
        {name:'北教学区',scene:'north',x1:1,x2:21,y1:1,y2:6},
        {name:'旧教室侧翼',scene:'classroom',x1:1,x2:6,y1:8,y2:20},
        {name:'礼堂前厅',scene:'foyer',x1:8,x2:14,y1:8,y2:18},
        {name:'配电教室',scene:'power',x1:16,x2:21,y1:8,y2:20},
        {name:'教学楼南入口',scene:'school',x1:8,x2:14,y1:19,y2:21}
      ],
      defaultScene:'school',
      landmarks:{
        '7,20':'window','15,20':'window','12,22':'window','10,17':'fireSign','12,17':'fireSign',
        '2,9':'desks','5,9':'desks','2,11':'desks','5,11':'desks','2,15':'desks','5,15':'desks',
        '16,9':'workbench','16,13':'pipes','17,13':'pipes','16,11':'warning',
        '18,11':'pipes','19,14':'warning','16,18':'warning','9,7':'window','13,7':'window'
      },
      lamps:[[12,22,'128,176,218',.30],[7,20,'128,176,218',.25,true],[15,20,'131,172,212',.25,true],[11,16,'198,82,72',.23],
        [17,9,'255,192,108',.31],[18,10,'128,206,213',.13],[20,10,'124,210,219',.13],
        [11,4,'161,139,218',.23]],
      intro: '敖犬：外面这灯光，像不像当年通宵回寝室？\nCSY：等会儿，教学楼里有人。\n防火门轰然落下，走廊另一头传来唐卵的声音。\n找出停电的原因，再想办法进入旧礼堂。',
      map: buildMap(23,[
        {axis:'h',at:7,from:1,to:21,openings:[11]},
        {axis:'v',at:7,from:8,to:21,openings:[]},
        {axis:'v',at:15,from:8,to:21,openings:[]},
        {axis:'v',at:18,from:8,to:21,openings:[12]},
        {axis:'h',at:13,from:1,to:6,openings:[3]},
        {axis:'h',at:13,from:16,to:21,openings:[19]},
        {axis:'v',at:4,from:8,to:12,openings:[10]},
        {axis:'v',at:19,from:8,to:12,openings:[10]},
        {axis:'h',at:17,from:8,to:14,openings:[11]}
      ],[
        [11,21,'@'],[11,20,'p'],[3,20,'t'],[20,20,'q'],[9,19,'k'],[13,19,'k'],
        [11,14,'n'],[3,11,'g'],[5,10,'m'],[3,10,'s'],[6,16,'m'],
        [15,12,'d'],[7,12,'d'],[17,9,'f'],[17,10,'L'],[18,12,'E'],[15,18,'v'],[17,14,'m'],[20,14,'s'],[20,17,'g'],
        [8,4,'m'],[14,4,'m'],[11,3,'b'],[11,2,'x']
      ]),
      dialogue: ['唐卵：一杖断灯……这次真不是我干的！', 'CSY：先找到备用保险丝，把电接上。', '唐卵：礼堂门前还有守卫，等大家到齐再上。'],
      npcDialogue: '值班同学：用钥匙进东侧配电教室，配电箱北边的工作台上就有备用保险丝。先取保险丝，再把电切给旧教室；东侧电闸门通电后才能打开，下面还有维修通道。',
      enemy: {name:'熄灯巡查者',hp:72,attack:18,defense:5,gold:4},
      boss: {name:'赤灯典狱官',hp:190,attack:24,defense:8},
      weapon: {name:'礼堂守夜刃',attack:9,kind:'cleave'},
      weaponsAt: {
        '3,10':{name:'冷光短刃',attack:9,kind:'cleave'},
        '20,14':{name:'黎明光剑',attack:11,kind:'saber'},
        '20,16':{name:'脉冲手枪',attack:8,kind:'pulse'},
        '20,18':{name:'唐卵的引雷杖',attack:7,kind:'lightning'}
      },
      exit: '走廊的灯重新亮起。\n唐卵：刚才那道影子，是往旧礼堂去了？\n敖犬：走，611 的人一个都不能少。\n你们推开礼堂的门，远处传来老旧放映机的声音。'
    }
  ]
};
