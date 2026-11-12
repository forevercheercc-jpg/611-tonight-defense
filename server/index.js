'use strict';
const http=require('node:http');
const {makeRooms}=require('./rooms');
const rooms=makeRooms();
function createServer(){return http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'&&req.url==='/health'){res.end(JSON.stringify({ok:true}));return;}
  if(req.method!=='POST'){res.writeHead(404);res.end(JSON.stringify({error:'接口不存在'}));return;}
  let data='';req.setEncoding('utf8');req.on('data',chunk=>{data+=chunk;if(data.length>4096)req.destroy();});req.on('end',()=>{
    try { const b=JSON.parse(data||'{}');let result;
      if(req.url==='/room/create')result=rooms.create(b.name);
      else if(req.url==='/room/join')result=rooms.join(b.code,b.name);
      else if(req.url==='/room/state')result=rooms.state(b.code,b.secret);
      else if(req.url==='/room/ready')result=rooms.ready(b.code,b.secret,b.ready);
      else if(req.url==='/room/leave')result=rooms.leave(b.code,b.secret);
      else{res.writeHead(404);res.end(JSON.stringify({error:'接口不存在'}));return;}
      res.end(JSON.stringify(result));
    }catch(err){res.writeHead(400);res.end(JSON.stringify({error:err instanceof SyntaxError?'请求格式错误':err.message}));}
  });
});}
if(require.main===module){const port=Number(process.env.PORT)||6110;createServer().listen(port,'127.0.0.1',()=>process.stdout.write('611 房间原型已在本机启动，端口 '+port+'\n'));}
module.exports={createServer};
