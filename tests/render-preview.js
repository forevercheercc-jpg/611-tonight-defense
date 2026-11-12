'use strict';
// Desktop-only smoke check with a simulated WeChat canvas; never bundled in the game.
const {createCanvas}=require('@napi-rs/canvas');const fs=require('node:fs');
const canvas=createCanvas(390,844);let touch,frame,now=1700000000000;
Date.now=()=>now;
global.wx={createCanvas:()=>canvas,getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:1,safeArea:{top:24}}),onTouchStart:f=>{touch=f;},onHide:()=>{},onShow:()=>{},showModal:()=>{}};
global.requestAnimationFrame=f=>{frame=f;};
function tap(x,y){touch({changedTouches:[{clientX:x,clientY:y}]});frame();}
require('../minigame/game');tap(120,440);tap(50,770);tap(30,647);tap(270,684);
tap(140,770);tap(30,647);tap(270,684);
for(let i=0;i<150;i++){now+=100;frame();}
fs.writeFileSync(process.argv[2]||'preview.png',canvas.toBuffer('image/png'));
if(!touch||!frame)throw new Error('input loop was not installed');
