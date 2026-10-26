const fs=require('fs'),path=require('path');
const ROOT=__dirname;
const pages=['index.html','live/index.html','calls/index.html','burns/index.html','launch/index.html','how/index.html'];
for(const rel of pages){
 const file=path.join(ROOT,rel);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 html=html.replace(/<link[^>]+rel=["'](?:icon|apple-touch-icon)["'][^>]*>/gi,'');
 html=html.replace(/<link[^>]+rel=["']preload["'][^>]+as=["'](?:script|image)["'][^>]*>/gi,'');
 html=html.replace(/(href|src)="\/(?!onemod\/)/g,'$1="/onemod/');
 html=html.replace(/src="\/onemod\/(?:brand\/mark-[^"]+|mascot\/pose-[^"]+)"/g,'src="/onemod/assets/onemod-logo-transparent.png"');
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Onemod — One market. Better genesis.</title>');
 html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="A modular genesis layer for tokens launching into Pump.fun.">');
 html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="Onemod — One market. Better genesis.">');
 html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="A modular genesis layer for tokens launching into Pump.fun.">');
 html=html.replace(/<meta property="og:site_name" content="[^"]*">/i,'<meta property="og:site_name" content="Onemod">');
 html=html.replace(/<meta name="twitter:title" content="[^"]*">/i,'<meta name="twitter:title" content="Onemod — One market. Better genesis.">');
 html=html.replace(/<meta name="twitter:description" content="[^"]*">/i,'<meta name="twitter:description" content="A modular genesis layer for tokens launching into Pump.fun.">');
 html=html.replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/i,'<meta name="apple-mobile-web-app-title" content="Onemod">');
 html=html.replace(/<meta name="theme-color" content="[^"]+">/i,'<meta name="theme-color" content="#faf8ee">');
 const head='<link rel="icon" type="image/png" sizes="64x64" href="/onemod/assets/onemod-favicon.png?v=4"><link rel="apple-touch-icon" sizes="180x180" href="/onemod/brand/app-apple-180.png?v=4"><link rel="stylesheet" href="/onemod/onemod.css">';
 const script='<script src="/onemod/onemod.js"></script><script src="/onemod/pump-client.bundle.js"></script>';
 html=html.replace('</head>',head+'</head>').replace('</body>',script+'</body>');
 fs.writeFileSync(file,html);
}
for(const file of fs.readdirSync(path.join(ROOT,'_next/static/immutable/chunks'))){
 if(!file.endsWith('.css'))continue;const p=path.join(ROOT,'_next/static/immutable/chunks',file);let css=fs.readFileSync(p,'utf8');css=css.replace(/url\(\/(?!onemod\/)/g,'url(/onemod/');fs.writeFileSync(p,css);
}
console.log('Prepared '+pages.length+' static routes for /onemod/.');
