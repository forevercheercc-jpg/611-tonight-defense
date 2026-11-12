'use strict';
// Supply a configured HTTPS endpoint when integrating the lobby UI.
function createClient(baseUrl){
  function call(path,data){return new Promise((resolve,reject)=>wx.request({url:baseUrl+path,method:'POST',data,success:r=>r.statusCode===200?resolve(r.data):reject(new Error((r.data&&r.data.error)||'房间请求失败')),fail:()=>reject(new Error('无法连接房间服务'))}));}
  return {create:name=>call('/room/create',{name}),join:(code,name)=>call('/room/join',{code,name}),state:(code,secret)=>call('/room/state',{code,secret}),ready:(code,secret,ready)=>call('/room/ready',{code,secret,ready}),leave:(code,secret)=>call('/room/leave',{code,secret})};
}
module.exports={createClient};
