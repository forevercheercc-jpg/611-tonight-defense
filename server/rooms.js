'use strict';
// In-memory room prototype. The game simulation is not connected yet.
const crypto = require('node:crypto');
const MAX_PLAYERS = 6;
function makeRooms(options={}) {
  const rooms = new Map();
  const now = options.now || Date.now;
  const ttl = options.ttl || 30 * 60 * 1000;
  const token = () => crypto.randomBytes(24).toString('hex');
  function clean() { for (const [code, room] of rooms) if (now() - room.updated > ttl) rooms.delete(code); }
  function nameOf(name) { return typeof name==='string' ? name.trim().slice(0,12) || '611室友' : '611室友'; }
  function view(room) { return {code:room.code,host:room.host,phase:room.phase,players:room.players.map(p=>({id:p.id,name:p.name,ready:p.ready}))}; }
  function find(code,secret) { const room=rooms.get(String(code||'').toUpperCase()); const player=room&&room.players.find(p=>p.secret===secret); return room&&player?{room,player}:null; }
  function create(name) { clean(); let code; do { code=crypto.randomInt(100000,1000000).toString(); } while(rooms.has(code)); const p={id:crypto.randomBytes(8).toString('hex'),secret:token(),name:nameOf(name),ready:false};const room={code,host:p.id,phase:'waiting',players:[p],updated:now()};rooms.set(code,room);return {secret:p.secret,playerId:p.id,room:view(room)}; }
  function join(code,name) { clean(); const room=rooms.get(String(code||'').toUpperCase()); if(!room)throw Error('房间不存在或已过期');if(room.phase!=='waiting')throw Error('对局已经开始');if(room.players.length>=MAX_PLAYERS)throw Error('房间已满');const p={id:crypto.randomBytes(8).toString('hex'),secret:token(),name:nameOf(name),ready:false};room.players.push(p);room.updated=now();return {secret:p.secret,playerId:p.id,room:view(room)}; }
  function state(code,secret) { clean(); const found=find(code,secret);if(!found)throw Error('房间或身份无效');found.room.updated=now();return view(found.room); }
  function ready(code,secret,value) { clean();const found=find(code,secret);if(!found)throw Error('房间或身份无效');if(found.room.phase!=='waiting')throw Error('房间状态已变化');found.player.ready=value===true;found.room.updated=now();return view(found.room); }
  function leave(code,secret) { clean();const found=find(code,secret);if(!found)throw Error('房间或身份无效');const {room,player}=found;room.players=room.players.filter(p=>p!==player);if(!room.players.length)rooms.delete(room.code);else{if(room.host===player.id)room.host=room.players[0].id;room.updated=now();}return {ok:true}; }
  return {create,join,state,ready,leave};
}
module.exports={makeRooms};
