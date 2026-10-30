'use strict';
function normalize(raw) {return {xp: Math.max(0,Math.min(1000000,Math.floor(Number(raw&&raw.xp)||0))),runs:Math.max(0,Math.floor(Number(raw&&raw.runs)||0)),wins:Math.max(0,Math.floor(Number(raw&&raw.wins)||0))};}
function level(profile){return Math.min(5,Math.floor(profile.xp/100));}
function reward(state){return state.status==='won'?80:state.status==='lost'?Math.min(45,Math.floor(state.time/10)):0;}
function settle(profile,state){const xp=reward(state);return {xp:profile.xp+xp,runs:profile.runs+1,wins:profile.wins+(state.status==='won'?1:0)};}
module.exports={normalize,level,reward,settle};
