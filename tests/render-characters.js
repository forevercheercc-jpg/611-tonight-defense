'use strict';
// Local visual smoke check; requires @napi-rs/canvas, not part of the game.
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('node:fs');
const sprites=require('../minigame/sprite-art');
const cards=require('../minigame/lane-core').BY_ID;
const characters=['ao','zhi','csy','tang','ge','hong'];
const c=createCanvas(720,180),ctx=c.getContext('2d');
ctx.fillStyle='#172637';ctx.fillRect(0,0,c.width,c.height);
ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='18px sans-serif';
characters.forEach((id,i)=>{const x=65+i*118;sprites.draw(ctx,id,cards[id].job,x,83,70);ctx.fillStyle='#eee9d5';ctx.fillText(cards[id].name,x,145);});
fs.writeFileSync(process.argv[2]||'characters-preview.png',c.toBuffer('image/png'));
