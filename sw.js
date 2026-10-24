/* Stringwalker — service worker : fonctionnement 100 % hors ligne */
const C='stringwalker-v6',F=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  /* chaque fichier est mis en cache séparément : un manquant ne bloque pas l'installation */
  e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
/* Cache d'abord (instantané même sans réseau ou avec une mauvaise réception),
   puis mise à jour en arrière-plan : la nouvelle version apparaît au rechargement suivant. */
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(new URL(r.url).pathname.endsWith('/version.json'))return; /* toujours depuis le réseau */
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&res.ok){const k=res.clone();caches.open(C).then(c=>c.put(r,k))}return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return net.then(res=>res||(r.mode==='navigate'?caches.match('./index.html'):Response.error()));
  }));
});
