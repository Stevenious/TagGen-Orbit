const assert=require('node:assert/strict');
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:'capsule43'});return elements.get(id)};
const Core={presets:{capsule43:{}},geometry:()=>({cols:3,rows:4,shape:'round'}),calibration:()=>{}};
let state,c,messages,checkpoints,accept=true;
const ready=x=>Boolean(x.design&&x.confirmed),toast=x=>messages.push(x),ask=async()=>accept;
const checkpoint=()=>checkpoints++,syncCalibration=()=>{},renderSheet=async()=>{},go=()=>{},render=()=>{};
const formatNotes={capsule43:'test'};
const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const printPending=eval('('+source.slice(source.indexOf(' async function printPending()'),source.indexOf(' async function exportCollection()'))+')');

const row=(id,extra={})=>({id,design:{shape:'round',back:{}},confirmed:true,place:0,...extra});
function setup(rows,slots=Array(12).fill(null)){state={preset:'capsule43',slots,calibration:{}};c={items:rows,busy:false};messages=[];checkpoints=0;accept=true;}
(async()=>{
const occupied={collectionId:'other',sentinel:true};setup([row('a'),row('review',{confirmed:false}),row('printed',{printedAt:'date'}),row('missing',{design:null})],[occupied,...Array(11).fill(null)]);
await printPending();assert.equal(state.slots[0],occupied);assert.equal(state.slots[1].collectionId,'a');assert.equal(state.slots.filter(Boolean).length,2);assert.equal(c.items[0].printedAt,undefined);
const before=JSON.stringify(state.slots);await printPending();assert.equal(JSON.stringify(state.slots),before);assert.equal(checkpoints,1);
setup([row('a'),row('b')],Array.from({length:12},(_,i)=>i===11?null:{collectionId:'x'+i}));const full=JSON.stringify(state.slots);await printPending();assert.equal(JSON.stringify(state.slots),full);assert.equal(checkpoints,0);
setup([row('a')],[occupied,...Array(11).fill(null)]);state.preset='other';await printPending();assert.equal(checkpoints,0);assert.equal(state.slots[0],occupied);
setup([row('a',{design:{shape:'square'}})]);accept=false;await printPending();assert.equal(checkpoints,0);assert.equal(c.busy,false);
setup([row('a',{place:3}),row('b',{place:3}),row('c',{place:null})]);await printPending();assert.equal(new Set(state.slots.filter(Boolean).map(x=>x.collectionId)).size,3);assert.equal(state.slots[3].collectionId,'a');
console.log('6 behavioral scenarios passed: eligibility, preservation/repeat, capacity, format, cancellation, placement.');
})().catch(e=>{console.error(e);process.exitCode=1});
