/* TagGen Orbit offline shell. Private projects, NFC dumps and remote covers are not cached. */
const CACHE='taggen-orbit-shell-5-rc8-restored-graphics';
const PREFIX='taggen-orbit-shell-';
const ROOT=new URL('./',self.registration.scope);
const SHELL=['./','./index.html','./manifest.webmanifest','./assets/orbit-icon-192.png','./assets/orbit-icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(SHELL.map(p=>new URL(p,ROOT).href));})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==ROOT.origin)return;const url=new URL(req.url);if(!url.pathname.startsWith(ROOT.pathname))return;if(req.mode!=='navigate'&&!SHELL.some(path=>new URL(path,ROOT).pathname===url.pathname))return;event.respondWith((async()=>{try{const response=await fetch(req);if(response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone());}return response;}catch(error){const cache=await caches.open(CACHE);const cached=await cache.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await cache.match(new URL('./index.html',ROOT).href):null);if(cached)return cached;throw error;}})());});
