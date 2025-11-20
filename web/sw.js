const CACHE='ireader-cache-v1'
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./index.html'])))})
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))})
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'){return}e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res}).catch(()=>caches.match('./index.html'))))})