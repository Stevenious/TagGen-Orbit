// Real canvas/PNG and restored event handlers; DOM and hardware are simulated.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const canvas=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||__dirname]}));
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const lines=html.split('\n');
const line=start=>{const found=lines.find(x=>x.startsWith(start));assert(found,`Missing ${start}`);return found;};
const core=html.slice(html.indexOf('const Core = (() => {'),html.indexOf('\n})();',html.indexOf('const Core = (() => {'))+6);
const nodes=new Map();
const node=()=>({style:{setProperty(k,v){this[k]=v;}},children:[],hidden:false,disabled:false,value:'',textContent:'',classList:{toggle(){}},append(...xs){this.children.push(...xs);},replaceChildren(...xs){this.children=xs;},click(){return this.onclick?.();}});
function get(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}
function createCanvas(){const c=canvas.createCanvas(1200,1200);c.style=node().style;c.toBlob=(fn,type)=>fn(new Blob([c.toBuffer('image/png')],{type}));return c;}
nodes.set('cover',createCanvas());
const ctx={console,URL,Blob,TextEncoder,structuredClone,AbortSignal,Math,Date,setTimeout,clearTimeout,Uint8Array,
 document:{createElement:tag=>tag==='canvas'?createCanvas():node()},$:get,
 window:{print(){ctx.printCount++;}},printCount:0,printing:false,addingCover:false,imagePromise:null,
 displayOnlyImages:new WeakSet(),requestAnimationFrame:fn=>fn(),renderBack(){},updateBridge(){},renderSheet(){},
 checkpoint(){ctx.state.dirty=true;},backNeedsUpdate:()=>-1,updatePlacedBack(){},ask:async()=>true,
 toast:text=>{ctx.lastToast=text;},saveBlob:(blob,name)=>{ctx.download={blob,name};},filename:s=>s,
 getImage:async src=>src?canvas.loadImage(src):null,
 FileReader:class{readAsDataURL(file){this.result=file.data;this.onload();}},
 updateStatus(){},saveJSON:(doc,name)=>{ctx.project={doc,name};},portableDesign:async d=>structuredClone(d)
};
vm.createContext(ctx);vm.runInContext(core+'\nthis.Core=Core;',ctx);
ctx.state={design:ctx.Core.initialDesign(),geometry:structuredClone(ctx.Core.presets.capsule43),slots:Array(12).fill(null),calibration:{x:0,y:0},preset:'capsule43',renderGeneration:0,dirty:false};
for(const start of ['function arcText','function squareLines','function drawSquare','async function coverCanvas','async function renderEditor','async function addCover','function setSlotPosition','function printExtent','async function preparePrint','async function exportProject'])vm.runInContext(line(start),ctx);
vm.runInContext(line("$('image-file').onchange="),ctx);
vm.runInContext(line("$('add-cover').onclick="),ctx);
ctx.paperMode=()=>get('print-side').value==='auto'?(ctx.state.slots.some(d=>d?.back?.enabled)?'duplex':'front'):get('print-side').value;
ctx.backPosition=(g,i,c)=>ctx.Core.position(g,i,c);
ctx.putBack=(c,g,i,cal)=>ctx.setSlotPosition(c,g,i,'mm',cal);
// A synthetic rear canvas isolates print pagination from QR encoding (covered by unchanged source).
ctx.backCanvas=()=>createCanvas();
get('print-side').value='auto';get('duplex-edge').value='long';
(async()=>{
 const art=canvas.createCanvas(32,32);art.getContext('2d').fillStyle='#da2355';art.getContext('2d').fillRect(0,0,32,32);
 const imageFile={size:100,type:'image/png',data:art.toDataURL('image/png')};
 const fileInput={files:[imageFile],value:'test.png'};
 await get('image-file').onchange({target:fileInput});await ctx.imagePromise;
 assert.equal(ctx.state.design.image,imageFile.data);assert.equal(fileInput.value,'');
 ctx.state.design.top='Serie';ctx.state.design.bottom='Folge';
 const round=await ctx.coverCanvas(ctx.state.design,240);
 assert.equal(round.width,240);assert.equal(round.getContext('2d').getImageData(0,0,1,1).data[3],0);
 assert.equal(round.getContext('2d').getImageData(120,120,1,1).data[0],218);
 const square=await ctx.coverCanvas({...ctx.state.design,shape:'square'},240);
 assert.equal(square.getContext('2d').getImageData(0,0,1,1).data[3],255);
 await get('png').onclick();assert(ctx.download.name.endsWith('.png'));assert.equal(ctx.download.blob.type,'image/png');
 assert.equal(Buffer.from(await ctx.download.blob.arrayBuffer()).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 await ctx.addCover();assert.equal(ctx.state.slots.filter(Boolean).length,1);
 await ctx.preparePrint();assert.equal(ctx.printCount,1);assert.equal(get('print-root').children.length,1);assert.equal(get('print-back-root').hidden,true);
 ctx.state.slots[0].back.enabled=true;
 await ctx.preparePrint();assert.equal(ctx.printCount,2);assert.equal(get('print-back-root').hidden,false);assert.equal(get('print-back-root').children.length,1);
 assert.equal(get('print-root').children[0].style.width,'43mm');
 await ctx.exportProject();assert.equal(ctx.project.doc.format,'taggen-project');assert.equal(ctx.project.doc.sheet.slots.filter(Boolean).length,1);assert.equal(ctx.project.doc.paper.output.mode,'auto');
 console.log('Recovery smoke: actual image import, round/square canvas, PNG signature, add-cover, front/duplex print and private project export passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
