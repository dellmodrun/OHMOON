const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname);
const map=JSON.parse(fs.readFileSync(path.join(ROOT,'snapshots/map.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.glb':'model/gltf-binary','.ico':'image/x-icon'};
const send=(res,file,type,status=200)=>{try{let data=fs.readFileSync(file);const mime=type||types[path.extname(file)]||'application/octet-stream';if(mime.includes('text/html')){let html=data.toString('utf8');html=html.replace('</head>','<link rel="icon" type="image/png" sizes="64x64" href="/assets/onemod-favicon.png?v=4"><link rel="apple-touch-icon" sizes="180x180" href="/brand/app-apple-180.png?v=4"><link rel="stylesheet" href="/onemod.css"></head>').replace('</body>','<script src="/onemod.js"></script></body>');data=Buffer.from(html)}res.writeHead(status,{'content-type':mime,'cache-control':'no-cache'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}};
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4184');
 const exact=map[u.pathname+u.search];if(exact)return send(res,path.join(ROOT,exact.file),exact.type,exact.status);
 if(u.searchParams.has('_rsc')){
  let candidate=Object.entries(map).find(([key])=>key.startsWith(u.pathname+'?_rsc='));
  if(!candidate&&u.pathname.startsWith('/c/'))candidate=Object.entries(map).find(([key])=>key.startsWith('/c/')&&key.includes('?_rsc='));
  if(candidate)return send(res,path.join(ROOT,candidate[1].file),candidate[1].type);
 }
 let pathname=decodeURIComponent(u.pathname);let file=path.join(ROOT,pathname.replace(/^\//,''));
 if(pathname==='/'||pathname.endsWith('/'))file=path.join(file,'index.html');
 else if(!path.extname(pathname)&&fs.existsSync(path.join(file,'index.html')))file=path.join(file,'index.html');
 if(fs.existsSync(file)&&fs.statSync(file).isFile())return send(res,file);
 if(pathname.startsWith('/c/')){const detail=map['/c/5QLhJag4UGsLod7H2Ci9HmgtMprgvG574Bv93v1NhDvq'];if(detail)return send(res,path.join(ROOT,detail.file),detail.type,detail.status)}
 if(pathname==='/sw.js'){res.writeHead(200,{'content-type':'application/javascript; charset=utf-8','cache-control':'no-cache'});return res.end('self.addEventListener("fetch",()=>{});')}
 res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Local mirror route not captured: '+u.pathname);
}).listen(4184,'127.0.0.1',()=>console.log('Onemod launchpad: http://127.0.0.1:4184/'));
