// Execute the real worker with deterministic CacheStorage and network doubles.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const handlers={},storage=new Map(),root='https://example.test/TagGen-Orbit/';
let offline=false,claimed=false;
const caches={
 async open(name){if(!storage.has(name))storage.set(name,new Map());const entries=storage.get(name);return{
  async addAll(urls){for(const url of urls)entries.set(url,{url,ok:true,clone(){return this;}});},
  async put(req,response){entries.set(req.url||req,response);},
  async match(req){return entries.get(req.url||req);}
 };},
 async keys(){return [...storage.keys()];},
 async delete(name){return storage.delete(name);}
};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
 URL,caches,self:{registration:{scope:root},clients:{async claim(){claimed=true;}},addEventListener(name,fn){handlers[name]=fn;}},
 fetch:async()=>{if(offline)throw Error('offline');return {ok:true,clone(){return this;}};}
});
async function lifecycle(name){let task;handlers[name]({waitUntil(p){task=p;}});await task;}
(async()=>{
 storage.set('taggen-orbit-shell-5',new Map());storage.set('taggen-orbit-shell-6-universe-system-theme',new Map());storage.set('unrelated-app',new Map());
 await lifecycle('install');
 const shell=storage.get('taggen-universe-shell-6-0-0');
 assert(shell,'New shell cache installed');
 for(const file of ['','index.html','universe.css','universe.js','manifest.webmanifest','assets/orbit-icon-192.png','assets/orbit-icon-512.png'])assert(shell.has(root+file),file+' cached');
 await lifecycle('activate');assert(claimed);
 assert.deepEqual([...storage.keys()].sort(),['taggen-universe-shell-6-0-0','unrelated-app']);
 offline=true;
 for(const file of ['universe.js','universe.css','missing-page']){
  let task;handlers.fetch({request:{url:root+file,method:'GET',mode:file==='missing-page'?'navigate':'cors'},respondWith(p){task=p;}});
  const response=await task;assert(response);assert.equal(response.url,root+(file==='missing-page'?'index.html':file));
 }
 for(const url of [root+'private-project.json','https://covers.test/image.png']){
  let handled=false;handlers.fetch({request:{url,method:'GET',mode:'cors'},respondWith(){handled=true;}});assert(!handled,'Private/remote files outside shell');
 }
 console.log('Offline shell: assets, old cache cleanup, unrelated cache preservation and offline fallback passed');
})().catch(e=>{console.error(e);process.exit(1);});
