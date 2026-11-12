'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../minigame/lane-core'),heroes=require('../minigame/hero-pixels'),sprites=require('../minigame/sprite-art');
test('回城显示引导与高地队伍，最终战显示首领和伙伴',()=>{
  let time=1700000000000,touch,frame,labels=[],drawnHeroes=[],drawnBoss=[],state;
  const originalNow=Date.now,originalCreate=G.create,originalHero=heroes.draw,originalBoss=sprites.boss;
  Date.now=()=>time;G.create=(...args)=>(state=originalCreate(...args));heroes.draw=(ctx,id,...rest)=>{drawnHeroes.push(id);return originalHero(ctx,id,...rest);};sprites.boss=(ctx,x,y,size,t,kind,...rest)=>{drawnBoss.push({kind,size});return originalBoss(ctx,x,y,size,t,kind,...rest);};
  const noop=()=>{},ctx=new Proxy({fillText:t=>labels.push(String(t))},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>{o[k]=v;return true;}});
  global.wx={createCanvas:()=>({getContext:()=>ctx}),getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1,safeArea:{top:24}}),onTouchStart:f=>{touch=f;},onHide:noop,onShow:noop,showModal:noop,getStorageSync:()=>'',setStorageSync:noop};global.requestAnimationFrame=f=>{frame=f;};
  const draw=()=>{labels=[];drawnHeroes=[];drawnBoss=[];frame();};const tap=(x,y)=>{touch({changedTouches:[{clientX:x,clientY:y}]});draw();};
  try{delete require.cache[require.resolve('../minigame/game')];require('../minigame/game');tap(100,330);tap(100,430);assert(state);state.shop=['ao'];G.buy(state,0);G.deploy(state,0);assert(G.recall(state));draw();assert(labels.some(x=>x.includes('回城引导')));assert(drawnHeroes.includes('ao'));for(let i=0;i<22;i++){time+=100;draw();}assert.equal(state.location,'high');assert(labels.some(x=>x.includes('已回到 611 高地')));assert(drawnHeroes.includes('ao'));state.wave=5;state.waveTime=G.WAVE_SECONDS;G.step(state,.01);draw();assert(state.boss);assert(drawnBoss.some(b=>b.kind==='warden'&&b.size>=60));assert(drawnHeroes.includes('ao'));state.chapter='tower';state.boss=null;state.wave=5;state.waveTime=G.WAVE_SECONDS;G.step(state,.01);draw();assert(drawnBoss.some(b=>b.kind==='shade'&&b.size>=60));}
  finally{Date.now=originalNow;G.create=originalCreate;heroes.draw=originalHero;sprites.boss=originalBoss;delete global.wx;delete global.requestAnimationFrame;}
});
