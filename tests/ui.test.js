'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

test('地图可直接换路，羁绊面板可查看且详情不会买卡',()=>{
  let now=1700000000000, touch, nextFrame, labels=[];
  const realNow=Date.now;Date.now=()=>now;
  const noop=()=>{};
  const ctx=new Proxy({fillText:t=>labels.push(String(t))},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>{o[k]=v;return true;}});
  const canvas={getContext:()=>ctx};
  global.wx={createCanvas:()=>canvas,getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1,safeArea:{top:24}}),onTouchStart:f=>{touch=f;},onHide:noop,onShow:noop,showModal:noop};
  global.requestAnimationFrame=f=>{nextFrame=f;};
  function draw(){labels=[];nextFrame();}
  function tap(x,y){touch({changedTouches:[{clientX:x,clientY:y}]});draw();}
  try{
    require('../minigame/game');tap(120,350);tap(120,440);
    assert(!labels.some(label=>/营地|大电灯泡/.test(label)));
    tap(120,724);
    assert(labels.includes('回高地'));
    tap(53,763);
    assert(labels.some(label=>label.startsWith('整队游走')));
    for(let i=0;i<32;i++){now+=100;draw();}
    assert(labels.includes('上路 · 我'));
    tap(194,723);
    assert(labels.includes('场上羁绊'));
    assert(labels.includes('上阵伙伴后可查看羁绊进度'));
    tap(330,119);
    tap(45,724);
    tap(38,812);
    assert(labels.some(label=>label.startsWith('技能 · ')));
    assert(labels.includes('查看场上羁绊'));
    tap(38,772);
    assert(labels.includes('金币 12'));
    tap(330,119);
    tap(38,772);
    assert(!labels.includes('金币 12'));
    tap(32,646);tap(270,685);tap(194,723);
    assert(labels.includes('场上羁绊'));
    assert(labels.some(label=>label.endsWith(' · 1 名')));
  }finally{Date.now=realNow;delete global.wx;delete global.requestAnimationFrame;}
});
