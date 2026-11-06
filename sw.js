const CACHE='n3srs-v5';
const FILES=['./','./index.html','./data.js','./practice-data.js','./sprint.js','./speech.js','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
const TIMEOUT=4000;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(FILES.map(f=>c.add(f)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))])}
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  e.respondWith((async()=>{
    try{
      const r=await withTimeout(fetch(req),TIMEOUT);
      if(r&&r.ok){const cp=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{}))}
      return r;
    }catch(err){
      const cached=await caches.match(req,{ignoreSearch:true});
      if(cached)return cached;
      if(req.mode==='navigate'){const idx=await caches.match('./index.html');if(idx)return idx}
      return new Response('離線且沒有快取，請連上網路後重新整理。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
