/* ============================================================
   MadSync 게임 릴레이 (로컬 WebSocket 허브) — 프로토타입
   실행:  npm i ws   →   node relay.js [포트=8090]   (같은 폴더 html도 같이 서비스)
   - 각 PC의 santa_split.html?ws=ws://<마스터IP>:8090 이 접속
   - 받은 메시지를 보낸 클라이언트를 제외한 같은 room 전원에게 그대로 전달
   - 호스트 status(idle/playing/ended)를 기록 → 나중에 MadSync 마스터가 이 값으로 다음 큐 자동 진행
   - 콘솔에서 명령 입력: reset / demo / reload  (MadSync 큐 제어 흉내)
   - HTTP GET /status  → 현재 접속 목록과 게임 상태 JSON
   ============================================================ */
const http=require('http');const {WebSocketServer}=require('ws');
const PORT=+(process.argv[2]||8090);
const clients=new Map();let lastStatus={state:'unknown',count:0,t:0};
const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/status')){res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    res.end(JSON.stringify({status:lastStatus,clients:[...clients.values()].map(c=>({role:c.role,screen:c.screen,room:c.room,ip:c.ip}))},null,2));return;}
  if(req.url.startsWith('/cmd/')){const cmd=decodeURIComponent(req.url.split('/')[2].split('?')[0]);sendCmd(cmd);res.writeHead(200,{'Access-Control-Allow-Origin':'*'});res.end('ok '+cmd);return;}
  // 같은 폴더의 html 파일 제공 (http://<IP>:8090/test.html 등)
  const fs=require('fs'),path=require('path');let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/test.html';
  const f=path.join(__dirname,path.normalize(p).replace(/^([.][.][\\/])+/,''));
  if(f.startsWith(__dirname)&&fs.existsSync(f)&&fs.statSync(f).isFile()){const ext=path.extname(f);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(res);return;}
  res.writeHead(404);res.end('not found');});
const wss=new WebSocketServer({server});
let soundState=null;
function sendCmd(cmd){if(cmd==='sound_on'||cmd==='sound_off')soundState=cmd;broadcast(null,{type:'cmd',cmd});console.log('cmd →',cmd);}
function broadcast(from,m){const s=JSON.stringify(m);for(const [ws,c] of clients){if(ws===from)continue;if(m.room&&c.room&&m.room!==c.room)continue;if(ws.readyState===1)ws.send(s);}}
wss.on('connection',(ws,req)=>{const c={role:'?',screen:'?',room:'demo',ip:req.socket.remoteAddress};clients.set(ws,c);
  ws.on('message',buf=>{let m;try{m=JSON.parse(buf);}catch(_){return;}
    if(m.type==='hello'){Object.assign(c,{role:m.role,screen:m.screen,room:m.room||'demo'});console.log(`+ ${c.role} screen=${c.screen} room=${c.room} (${c.ip})`);
      if(soundState&&ws.readyState===1)setTimeout(()=>{try{ws.send(JSON.stringify({type:'cmd',cmd:soundState}));}catch(_){}},1500);}
    if(m.type==='status'){if(m.state!==lastStatus.state)console.log(`status ${lastStatus.state} → ${m.state}`);lastStatus={state:m.state,count:m.count,step:m.step,t:Date.now()};
      /* TODO(MadSync): state==='ended' 이면 다음 큐 GO */}
    broadcast(ws,m);});
  ws.on('close',()=>{console.log(`- ${c.role} screen=${c.screen}`);clients.delete(ws);});});
server.listen(PORT,()=>{console.log(`MadSync relay  ws://0.0.0.0:${PORT}`);console.log(`  한 PC 테스트:  http://localhost:${PORT}/test.html`);console.log(`  상태:        http://localhost:${PORT}/status`);console.log(`  명령 입력:    reset | demo | map | reload`);});
const STDIN_CMDS=['reset','start','demo','map','reload','sound_on','sound_off'];
process.stdin.on('data',d=>{const cmd=d.toString().trim();if(STDIN_CMDS.includes(cmd))sendCmd(cmd);else if(cmd)console.log('(무시됨: 이 창은 명령 전용 — '+STDIN_CMDS.join(' | ')+')');});
/* ---- OSC(UDP) 수신: MadMapper 큐에서 바로 제어 ----
   포트 8000 (node relay.js 8090 8000 으로 변경)
   /santa/sound 1|0   → 소리 켜기/끄기 (웹게임 큐 진입 때 1, 나갈 때 0)
   /santa/reset · /santa/demo · /santa/reload · /santa/map   (인자 없이) */
const OSC_PORT=+(process.argv[3]||8000);
function oscStr(b,o){let e=o;while(e<b.length&&b[e]!==0)e++;return [b.toString('utf8',o,e),(e+4)&~3];}
function oscParse(b){const [addr,o1]=oscStr(b,0);if(!addr.startsWith('/'))return null;let args=[];if(o1<b.length&&b[o1]===44){const [tags,o2]=oscStr(b,o1);let o=o2;
  for(const t of tags.slice(1)){if(t==='i'){args.push(b.readInt32BE(o));o+=4;}else if(t==='f'){args.push(b.readFloatBE(o));o+=4;}else if(t==='s'){const [v,n]=oscStr(b,o);args.push(v);o=n;}else if(t==='T')args.push(1);else if(t==='F')args.push(0);}}
  return {addr,args};}
try{const dgram=require('dgram');const us=dgram.createSocket('udp4');
  us.on('message',buf=>{let m;try{m=oscParse(buf);}catch(_){return;}if(!m)return;const a=m.addr.toLowerCase();
    if(a==='/santa/sound'){const v=m.args.length?+m.args[0]:1;sendCmd(v>0.5?'sound_on':'sound_off');}
    else if(a==='/santa/sound/on')sendCmd('sound_on');else if(a==='/santa/sound/off')sendCmd('sound_off');
    else{const c=a.replace('/santa/','');if(['reset','start','demo','map','reload'].includes(c)&&(!m.args.length||+m.args[0]>0.5))sendCmd(c);}});
  us.on('error',e=>console.log('OSC 수신 오류:',e.message));
  us.bind(OSC_PORT,()=>console.log(`  OSC 수신:    udp ${OSC_PORT}  (/santa/sound 1|0, /santa/reset ...)`));}catch(e){console.log('OSC 사용 불가',e.message);}
