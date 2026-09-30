// Deterministic end-to-end checks against the real app. No hardware or live catalog required.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const canvas=require('@napi-rs/canvas');
const dir=__dirname;
const png=canvas.createCanvas(64,64);png.getContext('2d').fillStyle='#52715b';png.getContext('2d').fillRect(0,0,64,64);
const image=png.toDataURL('image/png'),buffer=png.toBuffer('image/png');
const catalog=Array.from({length:10},(_,i)=>({series:'Waldgeschichten',episodes:'Waldabenteuer '+(i+1),language:'de',pic:image,audio_id:'audio-'+(i+1),model:String(i+1)}));
const server=http.createServer((req,res)=>{
 const route=decodeURIComponent(req.url.split('?')[0]);const file=path.join(dir,route==='/'?'index.html':route);
 if(!file.startsWith(dir+path.sep)){res.writeHead(403);res.end();return;}
 try{const body=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.png')?'image/png':'text/html');res.end(body);}catch{res.writeHead(404);res.end();}
});
const timeout=30000;
async function run(engine,name,width,theme="light"){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width<=960,hasTouch:width<=960,colorScheme:theme,acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://raw.githubusercontent.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(catalog)}));
 page.setDefaultTimeout(15000);
 try {
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.Universe&&window.orbitCollection&&state.items.length>=8);
 assert(await page.locator('#view-home').isVisible(),name+': collection-first home');
 assert(!await page.locator('#universe-start-fallback').isVisible(),name+': fallback hidden after startup');
 const appearance=await page.evaluate(()=>({scheme:getComputedStyle(document.documentElement).colorScheme,body:getComputedStyle(document.body).backgroundColor,ink:getComputedStyle(document.getElementById('universe-home-title')).color}));
 assert.equal(appearance.scheme,theme);
 assert.equal(appearance.body,theme==='dark'?'rgb(15, 20, 29)':'rgb(247, 248, 251)');
 function luminance(rgb){const channels=rgb.match(/\d+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];}
 function contrast(fg,bg){const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
 assert(contrast(appearance.ink,appearance.body)>=4.5,name+': heading contrast');
 assert.equal(await page.locator('#match option[value="exact"]').textContent(),'Nur exakte Treffer');
 assert.equal(await page.locator('#flow-check').textContent(),'Selbsttest ausführen');
 assert.equal(await page.locator('.main-nav [data-view]').count(),4);
 assert.equal(await page.locator('.main-nav [data-view="workshop"]').count(),0);
 await page.locator('.main-nav [data-view="create"]').click();
 await page.locator('#universe-start-search').click();
 assert(await page.locator('.library-panel').isVisible());
 assert(!await page.locator('.preview-panel').isVisible());
 assert.equal(await page.locator('#cards .card').count(),width<=960?4:8);
 await page.locator('#cards .card-open').first().click();
 await page.waitForFunction(()=>!document.getElementById('add-cover').disabled);
 assert(await page.locator('.preview-panel').isVisible());
 assert(!await page.locator('.library-panel').isVisible());
 assert(!await page.locator('#universe-pro').getAttribute('open'));
 const help=await page.locator('#audio-id-help').textContent();
 assert(help.includes('Tag-UID')&&help.includes('Audio-ID'));
 const buttonColors=await page.locator('#add-cover').evaluate(b=>({fg:getComputedStyle(b).color,bg:getComputedStyle(b).backgroundColor}));
 assert(contrast(buttonColors.fg,buttonColors.bg)>=4.5,name+': primary button contrast');
 await page.locator('#universe-editor-format').selectOption('square43');
 await page.waitForFunction(()=>state.preset==='square43'&&state.design.shape==='square'&&!document.getElementById('add-cover').disabled);
 await page.locator('#bottom-text').fill('Meine Waldgeschichte');await page.locator('#bottom-text').dispatchEvent('input');
 await page.waitForFunction(()=>!document.getElementById('add-cover').disabled);
 await page.locator('#universe-layouts button').filter({hasText:'Kids'}).click();
 await page.waitForFunction(()=>!document.getElementById('add-cover').disabled);
 await page.locator('#universe-editor-back').selectOption('title');
 assert(await page.evaluate(()=>state.design.back.enabled&&state.design.back.titleOnly&&!state.design.back.qr));
 await page.locator('#universe-editor-back').selectOption('none');
 await page.locator('#collection-add-cover').click();
 assert(await page.locator('#view-passport').isVisible());
 const id=await page.evaluate(()=>window.orbitCollection.snapshot().items[0].entryId);
 await page.locator('#universe-passport select').first().selectOption('Einschlafen');
 await page.locator('#universe-passport input[type="checkbox"]').check();
 assert(await page.evaluate(()=>Boolean(window.orbitCollection.snapshot().items[0].universe.printedAt)));
 await page.reload({waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.Universe&&window.orbitCollection.snapshot().items.length===1);
 assert(await page.locator('#view-home').isVisible());
 await page.locator('#universe-home-cards button').first().click();
 assert(await page.locator('#universe-passport input[type="checkbox"]').isChecked());
 await page.locator('.universe-passport-art button').click();
 await page.waitForFunction(()=>!document.getElementById('add-cover').disabled);
 assert.equal(await page.evaluate(()=>window.orbitCollection.activeEntryId()),id);
 await page.locator('#add-cover').click();
 await page.waitForFunction(()=>state.view==='print'&&state.slots.some(Boolean));
 assert.equal(await page.evaluate(()=>state.slots.filter(Boolean)[0].collectionId),id);
 await page.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;};});
 await page.locator('#print-side').selectOption('front');
 await page.locator('#print-button').click();
 await page.waitForFunction(()=>window.__prints===1);
 assert(await page.locator('#print-back-root').isHidden());
 assert.equal(await page.evaluate(()=>document.getElementById('print-root').children[0].style.width),'43mm');
 assert.equal(await page.locator('#sheet').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
 const canvasBefore=await page.evaluate(()=>document.getElementById('print-root').children[0].toDataURL());
 await page.emulateMedia({media:'print'});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
 assert.equal(await page.evaluate(()=>document.getElementById('print-root').children[0].toDataURL()),canvasBefore);
 await page.emulateMedia({media:'screen'});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),theme);
 await page.locator('.main-nav [data-view="collection"]').click();
 assert.equal(await page.locator('#universe-collection-cards button').count(),1);
 await page.locator('#universe-collection-filter button').filter({hasText:'Musik',exact:true}).click();
 assert.equal(await page.locator('#universe-collection-cards .universe-card').count(),0);
 await page.locator('#universe-collection-filter button').filter({hasText:'Einschlafen',exact:true}).click();
 assert.equal(await page.locator('#universe-collection-cards .universe-card').count(),1);
 // Batch remains independent of technical tag data.
 await page.locator('.main-nav [data-view="create"]').click();
 await page.locator('#universe-start-batch').click();
 await page.locator('#universe-batch-files').setInputFiles([{name:'Waldabenteuer 2.png',mimeType:'image/png',buffer},{name:'Familienurlaub.png',mimeType:'image/png',buffer}]);
 await page.waitForFunction(()=>!document.getElementById('universe-batch-add').disabled);
 await page.locator('#universe-batch-format').selectOption('round40');
 await page.locator('#universe-batch-add').click();
 await page.waitForFunction(()=>window.orbitCollection.snapshot().items.length===3&&state.view==='collection');
 assert(await page.evaluate(()=>window.orbitCollection.snapshot().items.slice(1).every(x=>x.tag.uid===''&&x.tag.dumpText===''&&x.physical.preset==='round40')));
 await page.locator('.main-nav [data-view="home"]').click();
 for(const view of ['home','create','collection','print']){
  await page.locator('.main-nav [data-view="'+view+'"]').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+': horizontal overflow in '+view);
 }
 await page.locator('.main-nav [data-view="home"]').click();
 fs.mkdirSync(path.join(dir,'test-output'),{recursive:true});
 await page.screenshot({path:path.join(dir,'test-output',name+'-home.png'),fullPage:true});
 await page.locator('#universe-more summary').click();await page.locator('#universe-more button').filter({hasText:'Werkstatt'}).click();
 assert(await page.locator('#view-workshop').isVisible());
 assert.equal(errors.length,0,name+': browser errors '+errors.join('; '));
 console.log(name+': home, search, editor, passport, persistence, worlds, batch, front print and workshop passed');
 await context.close();await browser.close();
 } catch(error) { fs.mkdirSync(path.join(dir,'test-output'),{recursive:true});await page.screenshot({path:path.join(dir,'test-output',name+'-failure.png'),fullPage:true}).catch(()=>{});await browser.close();throw error; }
}
async function fallback(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const blockCSS of [false,true]){
   const page=await browser.newPage();
   await page.route('**/universe.js',r=>r.abort());
   if(blockCSS)await page.route('**/universe.css',r=>r.abort());
   await page.route('https://raw.githubusercontent.com/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(catalog)}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle'});
   assert(await page.locator('#view-home').isVisible(),'Fallback home visible');
   assert(await page.locator('#universe-start-fallback').isVisible(),'Fallback action visible');
   await page.locator('#universe-start-fallback button').click();
   assert(await page.locator('#view-studio').isVisible(),'Core studio usable without Universe');
   await page.close();
  }
  console.log('Missing Universe JS/CSS: visible home and working core studio passed');
 }finally{await browser.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{await fallback();await run(chromium,'desktop-chromium',1280);await run(chromium,'mobile-chromium',375);await run(webkit,'mobile-webkit',375);await run(chromium,'desktop-chromium-dark',1280,'dark');await run(webkit,'mobile-webkit-dark',375,'dark');}finally{server.close();}
})().catch(error=>{console.error(error);server.close();process.exit(1);});
