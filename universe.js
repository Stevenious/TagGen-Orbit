/* TagGen Universe 6 — presentation adapter over the tested Orbit engine. */
(function () {
'use strict';
const el=id=>document.getElementById(id);
const api=()=>window.orbitCollection;
const worlds=['Geschichten','Musik','Einschlafen','Unterwegs','Eigene Kreationen'];
const physicalFormats=[
 ['round40','Münzkapsel · Rund 40 mm'],['round30','Münzkapsel · Rund 30 mm'],
 ['square43','Quadratkapsel · 43 × 43 mm'],['capsule43','Münzkapsel · Rund 43 mm'],
 ['round25','Freies Format · Rund 25 mm']
];
const view={world:'',passportId:null,batch:[],batchBusy:false,batchGeneration:0,cardGeneration:0};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls='')=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
const snapshot=()=>api().snapshot();
const formatName=k=>physicalFormats.find(x=>x[0]===k)?.[1]|| (k?'Eigenes Format':'Format noch nicht angegeben');
const addOptions=(select,values)=>{for(const [value,label] of values){const o=node('option',label);o.value=value;select.append(o);}};
function safeCloseMenu(){const menu=el('universe-more');if(menu)menu.open=false;}
function startSearch(query='',keepEntry=false){
 if(!keepEntry)api().clearEditing();
 el('search').value=query;state.page=0;search();go('studio');step('library');el('search').focus({preventScroll:true});
}
function startOwn(){
 api().clearEditing();go('studio');el('custom').click();step('editor');
}
function openPassport(id){view.passportId=id;go('passport');}
function cardStatus(item){return !item.content?.design?'Cover noch offen':!item.confirmed?'Vorschlag prüfen':item.universe?.printedAt?'Druck bestätigt':'Cover bereit';}
function renderEntryCards(target,items){
 target.replaceChildren();const generation=++view.cardGeneration;
 if(!items.length){const empty=node('div',undefined,'universe-empty');empty.append(node('strong',view.world?'In dieser Welt ist noch kein Tag.':'Deine Sammlung beginnt mit einem Cover.'),node('span','Suche eine Geschichte oder starte mit deinem eigenen Bild.'),button('＋ Erstellen',()=>go('create'),'primary'));target.append(empty);return;}
 for(const item of items){const b=button('',()=>openPassport(item.entryId),'universe-card');const art=node('div',undefined,'universe-art');art.append(node('span','◌'));const copy=node('span',undefined,'universe-card-copy');copy.append(node('strong',item.content.title||'Ohne Titel'),node('small',[item.content.series,cardStatus(item)].filter(Boolean).join(' · ')));b.append(art,copy);target.append(b);const d=item.content.design;if(d)coverCanvas(d,360).then(c=>{if(!b.isConnected)return;art.replaceChildren(c);}).catch(()=>{art.replaceChildren(node('span','◌'));});}
}
function refreshHome(){
 const s=snapshot(),items=s.items;
 renderEntryCards(el('universe-home-cards'),items.slice(-4).reverse());
 const worldRoot=el('universe-worlds');worldRoot.replaceChildren();
 for(const world of worlds){const count=items.filter(x=>x.universe?.world===world).length;const b=button('',()=>{view.world=world;go('collection');});b.append(node('strong',world),node('small',count+' Tags'));worldRoot.append(b);}
 const next=el('universe-next');next.replaceChildren();
 const queued=state.slots.filter(Boolean).length;
 if(queued){const row=node('div',undefined,'row between');row.append(node('span',queued+' Cover auf dem Druckbogen'),button('Druckbogen öffnen →',()=>go('print')));next.append(row);}
 const unfinished=items.filter(x=>!x.content.design||!x.confirmed||!x.universe?.printedAt);
 for(const item of unfinished.slice(0,3)){const row=node('div',undefined,'row between');row.append(node('span',(item.content.title||'Ohne Titel')+' · '+(!item.content.design?'Cover wählen':!item.confirmed?'Zuordnung prüfen':'Druck noch offen')),button('Weiter →',()=>openPassport(item.entryId)));next.append(row);}
 if(!next.children.length)next.append(node('div',items.length?'Alles erledigt. Zeit für deine nächste Geschichte.':'Erstelle deinen ersten Tag — die Werkstatt brauchst du dafür nicht.'));
}
function refreshCollection(){
 const s=snapshot(),filtered=s.items.filter(x=>!view.world||x.universe?.world===view.world);
 renderEntryCards(el('universe-collection-cards'),filtered);
 el('universe-collection-status').textContent=s.items.length+' / 12 Tags in „'+s.name+'“'+(view.world?' · '+view.world:'');
 el('universe-collection-filter').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.world===view.world)));
}
function passport(){
 const item=snapshot().items.find(x=>x.entryId===view.passportId),root=el('universe-passport');root.replaceChildren();
 if(!item){el('universe-passport-title').textContent='Tag nicht mehr vorhanden';root.append(button('Zur Sammlung',()=>go('collection')));return;}
 el('universe-passport-title').textContent=item.content.title||'Deine Tag-Karte';
 const grid=node('div',undefined,'universe-passport-grid'),art=node('div',undefined,'universe-passport-art');
 const d=item.content.design;
 if(d){const placeholder=node('span','Cover wird vorbereitet …','muted');art.append(placeholder);coverCanvas(d,600).then(c=>{if(!art.isConnected)return;placeholder.replaceWith(c);}).catch(()=>{placeholder.textContent='Bild nicht verfügbar. Cover im Editor öffnen.';});}
 else art.append(node('p','Noch kein Cover gewählt.','muted'));
 art.append(button(d?'Cover bearbeiten':'Inhalt wählen',()=>api().openEntry(item.entryId,!d),'primary'));
 const right=node('div'),status=node('div',undefined,'universe-passport-box'),list=node('dl');
 status.append(node('h2','Dein Stand'));
 const queued=state.slots.some(x=>x?.collectionId===item.entryId);
 for(const [key,value] of [['Inhalt',d?'Gewählt':'Noch offen'],['Cover',cardStatus(item)],['Druckbogen',queued?'Vorgemerkt':'Noch offen'],['NFC',item.tag.uid?'UID dokumentiert':'Nicht angegeben']])list.append(node('dt',key),node('dd',value));
 status.append(list);
 const printed=node('label',undefined,'check'),check=node('input');check.type='checkbox';check.checked=Boolean(item.universe?.printedAt);check.onchange=()=>{api().setMetadata(item.entryId,{printed:check.checked});};printed.append(check,document.createTextNode('Ich habe diesen Tag gedruckt'));status.append(printed);right.append(status);
 const physical=node('div',undefined,'universe-passport-box');physical.append(node('h2','Sammlung & Träger'));
 const worldLabel=node('label','Deine Welt'),world=node('select');addOptions(world,[['','Noch nicht zugeordnet'],...worlds.map(x=>[x,x])]);world.value=item.universe?.world||'';world.onchange=()=>api().setMetadata(item.entryId,{world:world.value});worldLabel.append(world);physical.append(worldLabel);
 const carrierLabel=node('label','Physischer Träger'),carrier=node('select');addOptions(carrier,[['unknown','Unbekannt'],['capsule43','43-mm-Kapsel'],['customTag','Custom Tag'],['creativeTonie','Kreativ-Tonie'],['originalTonie','Original-Tonie'],['customFigure','Custom-Figur']]);carrier.value=item.physical.type;carrier.onchange=()=>api().setMetadata(item.entryId,{carrier:carrier.value});carrierLabel.append(carrier);physical.append(carrierLabel);
 physical.append(node('p',formatName(item.physical.preset),'muted'));
 const technical=node('details'),summary=node('summary','Technische Angaben'),technicalList=node('dl');
 for(const [key,value] of [['UID',item.tag.uid||'Unbekannt'],['Audio-ID',d?.audioId||'Nicht angegeben'],['NFC-Datei',item.tag.dumpName||'Keine']])technicalList.append(node('dt',key),node('dd',value));
 technical.append(summary,technicalList,button('Werkstatt öffnen →',()=>{api().openEntry(item.entryId);go('workshop');}));physical.append(technical);right.append(physical);
 right.append(button('Für Druck öffnen →',()=>{api().openEntry(item.entryId);toast('Cover prüfen und „Zum Druckbogen“ wählen.');},'primary'));grid.append(art,right);root.append(grid);
}
function refresh(){
 if(state.view==='home')refreshHome();
 if(state.view==='collection')refreshCollection();
 if(state.view==='passport')passport();
}
function onView(viewName){safeCloseMenu();if(viewName==='collection')refreshCollection();if(viewName==='home')refreshHome();if(viewName==='passport')passport();}
function onStep(which){const h=el('view-studio').querySelector('h1');h.textContent=which==='library'?'Deine nächste Geschichte.':'Deine Tag-Karte';syncSmart();}
window.Universe={refresh,onView,onStep,startSearch,startOwn,openPassport};
// More keeps tools discoverable without adding them to everyday navigation.
const more=node('details',undefined,'universe-more');more.id='universe-more';const summary=node('summary','•••');summary.setAttribute('aria-label','Mehr: Einstellungen, Sicherung und Werkstatt');more.append(summary);
const menu=node('div',undefined,'universe-menu');menu.append(button('Werkstatt · Expertenmodus',()=>go('workshop')),el('save-project'),button('Projekt laden',()=>{safeCloseMenu();el('import-project').click();}),button('Sammlung sichern',()=>{safeCloseMenu();el('collection-export').click();}),button('Quellen & Rechte',()=>{safeCloseMenu();el('open-credits').click();}));more.append(menu);document.querySelector('.header-end').append(more);
document.addEventListener('keydown',e=>{if(e.key==='Escape')more.open=false;});
document.addEventListener('click',e=>{if(more.open&&!more.contains(e.target))more.open=false;});
// Keep legacy editing controls and their event handlers as Pro tools.
const settings=document.querySelector('.settings-panel .controls'),oldControls=[...settings.children],smart=node('div',undefined,'universe-smart');smart.id='universe-smart';
const formatLabel=node('label','Träger & Coverformat'),format=node('select');format.id='universe-editor-format';addOptions(format,physicalFormats);formatLabel.append(format);smart.append(formatLabel);
const titleLabel=el('bottom-text').closest('label'),seriesLabel=el('top-text').closest('label'),imageLabel=el('image-file').closest('label');
smart.append(titleLabel,seriesLabel,imageLabel);
const layoutLabel=node('label','Layout'),layouts=node('div',undefined,'row');layouts.id='universe-layouts';smart.append(layoutLabel,layouts);
const styles={
 Original:{font:100,zoom:100,x:0,y:0,accent:'#5545c9',background:'#ffffff',fit:'contain'},
 Modern:{font:105,zoom:105,x:0,y:0,accent:'#2863dc',background:'#f2f5fc',fit:'contain'},
 Kids:{font:115,zoom:95,x:0,y:0,accent:'#16845b',background:'#fff9e9',fit:'contain'},
 Minimal:{font:85,zoom:100,x:0,y:0,accent:'#374151',background:'#ffffff',fit:'contain'}
};
for(const [name,values] of Object.entries(styles)){const b=button(name,()=>{Object.assign(state.design,values);syncControls();state.dirty=true;renderEditor();layouts.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});layouts.append(b);}
const backLabel=node('label','Rückseite'),back=node('select');back.id='universe-editor-back';addOptions(back,[['none','Keine'],['title','Titel'],['qr','Titel + QR · Pro']]);backLabel.append(back);smart.append(backLabel);
const pro=node('details',undefined,'universe-pro');pro.id='universe-pro';pro.append(node('summary','Feinabstimmung · Pro'));const proControls=node('div');proControls.id='universe-pro-controls';for(const child of oldControls)proControls.append(child);pro.append(proControls);settings.replaceChildren(smart,pro);
const shapeSelect=el('cover-shape');shapeSelect.addEventListener('input',()=>syncSmart());
format.onchange=async()=>{const key=format.value;const accepted=await applyGeometry(Core.presets[key],key);if(!accepted){syncSmart();return;}state.design.shape=Core.presets[key].shape||'round';state.dirty=true;syncControls();renderEditor();};
back.onchange=()=>{const b=state.design.back;b.enabled=back.value!=='none';b.qr=back.value==='qr';b.mode='collection';b.includeUid=false;syncBack();state.dirty=true;if(back.value==='qr'){pro.open=true;el('back-options').open=true;}};
function syncSmart(){if(!el('universe-editor-format'))return;const key=state.design.shape==='square'?'square43':physicalFormats.some(x=>x[0]===state.preset&&Core.presets[x[0]].shape!=='square')?state.preset:'capsule43';format.value=key;const b=state.design.back||{};back.value=!b.enabled?'none':b.qr===false?'title':'qr';}
const originalRenderEditor=renderEditor;renderEditor=function(){syncSmart();return originalRenderEditor();};
el('add-cover').textContent='Zum Druckbogen →';
const originalAddHandler=el('add-cover').onclick;el('add-cover').onclick=async()=>{const before=state.slots.filter(Boolean).length;await originalAddHandler();if(state.slots.filter(Boolean).length>before)go('print');};
const originalSaveHandler=el('collection-add-cover').onclick;
el('collection-add-cover').onclick=()=>{
 const existing=api().activeEntryId(),before=snapshot().items.length;originalSaveHandler();
 const s=snapshot(),id=existing||s.items.at(-1)?.entryId;
 if(id&&(existing?!api().activeEntryId():s.items.length===before+1)) {
   if(!existing)api().setMetadata(id,{preset:state.preset,carrier:state.design.shape==='square'?'customTag':state.preset==='capsule43'?'capsule43':'customTag'});
   openPassport(id);
 }
};
el('universe-search-form').onsubmit=e=>{e.preventDefault();startSearch(el('universe-search').value);};
el('universe-start-search').onclick=()=>startSearch();
el('universe-start-own').onclick=startOwn;
el('universe-start-nfc').onclick=()=>{go('workshop');el('dump-file').click();};
// Collection becomes a visual library; legacy management remains in a disclosure.
const collection=el('view-collection'),heading=collection.querySelector('.page-heading');
heading.querySelector('p').textContent='Deine Tags visuell ordnen und zum Druck vorbereiten.';
heading.querySelector('.eyebrow').textContent='Deine persönliche Bibliothek';
const newButton=button('＋ Neuer Tag',()=>go('create'),'primary');heading.querySelector('.badge').replaceWith(newButton);
const filters=node('div',undefined,'universe-filter');filters.id='universe-collection-filter';
for(const world of ['',...worlds]){const b=button(world||'Alle',()=>{view.world=world;refreshCollection();});b.dataset.world=world;b.setAttribute('aria-pressed',String(!world));filters.append(b);}
const collectionStatus=node('p',undefined,'status');collectionStatus.id='universe-collection-status';collectionStatus.setAttribute('role','status');
const collectionCards=node('div',undefined,'universe-cards');collectionCards.id='universe-collection-cards';
heading.after(filters,collectionStatus,collectionCards);
const batchActions=node('div',undefined,'universe-batch-actions');
batchActions.append(button('Stapel zum Druckbogen →',()=>el('collection-print').click(),'primary'),button('Sammlung sichern',()=>el('collection-export').click()));
collectionCards.after(batchActions);
const manage=node('details',undefined,'universe-collection-tools');manage.append(node('summary','Sammlung verwalten · Name, Import & Sicherung'),document.querySelector('.collection-layout>.panel:first-child .panel-body'));document.querySelector('.collection-layout').before(manage);
document.querySelector('.collection-flow').hidden=true;
const optionalBatch=node('details',undefined,'universe-collection-tools');optionalBatch.append(node('summary','Druckplätze & Stapelwerkzeuge'));const tools=[...document.querySelectorAll('.collection-layout .collection-tools')];for(const t of tools)optionalBatch.append(t);document.querySelector('.collection-layout').append(optionalBatch);
const layoutOptions=el('collection-format');for(const [value,label] of physicalFormats)if(![...layoutOptions.options].some(o=>o.value===value))addOptions(layoutOptions,[[value,label]]);
// Explicit print confirmation does not mistake opening a print dialog for success.
const confirmPrint=button('Gedruckte Tags bestätigen',()=>{const ids=[...new Set(state.slots.filter(Boolean).map(x=>x.collectionId).filter(Boolean))];if(!ids.length){toast('Diese Cover sind noch nicht mit der Sammlung verknüpft. Erst „Druckbogen übernehmen“ in der Sammlung wählen.');return;}for(const id of ids)api().setMetadata(id,{printed:true});toast('✓ Druck für '+ids.length+' Sammlungseinträge bestätigt.');});
document.querySelector('.print-settings .panel-body').append(confirmPrint);
el('print-button').textContent='Drucken / als PDF sichern';
const pdfHint=node('small','Im Druckdialog „Als PDF sichern“ wählen. A4 · Hochformat · 100 %.','muted');document.querySelector('.print-settings .panel-body').append(pdfHint);
// Batch images: no speculative UID, no OCR and no automatic fuzzy catalog assignment.
addOptions(el('universe-batch-format'),physicalFormats);
el('universe-start-batch').onclick=()=>{el('universe-batch').hidden=false;el('universe-batch').scrollIntoView({behavior:'smooth',block:'start'});};
const readData=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Bild konnte nicht gelesen werden.'));reader.readAsDataURL(file);});
async function imageData(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('PNG/JPG/WebP bis 10 MB verwenden.');
 const raw=await readData(file),image=await getImage(raw),limit=1000,scale=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight)),c=document.createElement('canvas');
 c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/png');
}
function fileTitle(name){return name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim().slice(0,180)||'Mein Cover';}
function suggest(title){
 const candidates=state.items.map(item=>({item,rank:Core.rank(item,title)})).filter(x=>x.rank>0).sort((a,b)=>b.rank-a.rank);
 const exact=candidates.filter(x=>Core.norm(x.item.title)===Core.norm(title));
 const identities=new Set(exact.map(x=>Core.norm(x.item.series)+'|'+Core.norm(x.item.title)+'|'+x.item.audioIds.join(',')));
 return {item:(exact[0]||candidates[0])?.item||null,unique:identities.size===1&&exact.length>0};
}
async function loadBatch(files){
 if(view.batchBusy)return;const generation=++view.batchGeneration;view.batchBusy=true;el('universe-batch-add').disabled=true;
 const accepted=[...files].slice(0,12);view.batch=[];let failed=0;
 el('universe-batch-status').textContent='Bilder werden vorbereitet …';
 for(const file of accepted){try{const image=await imageData(file);if(generation!==view.batchGeneration)return;const title=fileTitle(file.name),hit=suggest(title);view.batch.push({image,title,series:hit.unique?hit.item.series:'',source:hit.unique?hit.item:null,suggestion:hit.item,unique:hit.unique});}catch{failed++;}}
 if(generation!==view.batchGeneration)return;view.batchBusy=false;renderBatch();
 el('universe-batch-status').textContent=view.batch.length+' Bilder bereit'+(failed?' · '+failed+' nicht unterstützt':'')+(files.length>12?' · nur die ersten 12 Dateien übernommen':'')+'.';
}
function renderBatch(){
 const target=el('universe-batch-list');target.replaceChildren();
 for(const row of view.batch){const entry=node('div',undefined,'universe-batch-row'),img=node('img');img.src=row.image;img.alt='';const fields=node('div'),label=node('label','Titel'),input=node('input');input.type='text';input.value=row.title;input.maxLength=180;input.oninput=()=>{row.title=input.value;row.source=null;row.series='';note.textContent='Eigener Titel · keine Katalogzuordnung';};label.append(input);const note=node('small',row.source?'✓ Eindeutiger Titel im Katalog':row.suggestion?'Möglicher Treffer · bitte bewusst auswählen':'Eigenes Cover · keine Katalogzuordnung');fields.append(label,note);
 if(row.suggestion&&!row.source)fields.append(button('Vorschlag: '+row.suggestion.title,()=>{row.source=row.suggestion;row.title=row.source.title;row.series=row.source.series;renderBatch();}));
 if(row.source)fields.append(button('Als eigenes Cover verwenden',()=>{row.source=null;row.series='';row.suggestion=null;renderBatch();}));
 entry.append(img,fields);target.append(entry);}
 el('universe-batch-add').disabled=view.batchBusy||!view.batch.length;
}
const drop=el('universe-batch-drop');drop.onclick=()=>el('universe-batch-files').click();drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();drop.click();}};drop.ondragover=e=>{e.preventDefault();drop.classList.add('is-over');};drop.ondragleave=()=>drop.classList.remove('is-over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('is-over');loadBatch([...e.dataTransfer.files]);};
el('universe-batch-files').onchange=e=>{const files=[...e.target.files];e.target.value='';loadBatch(files);};
el('universe-batch-cancel').onclick=()=>{++view.batchGeneration;view.batchBusy=false;view.batch=[];renderBatch();el('universe-batch').hidden=true;};
el('universe-batch-add').onclick=()=>{
 if(view.batchBusy||!view.batch.length)return;
 if(view.batch.some(x=>!x.title.trim())){el('universe-batch-status').textContent='Bitte jedem Bild einen Titel geben.';return;}
 try{const preset=el('universe-batch-format').value;
 const designs=view.batch.map(row=>({...Core.initialDesign(),shape:Core.presets[preset].shape||'round',image:row.image,top:row.series,bottom:row.title,audioId:row.source?.audioIds[0]||'',source:row.source?structuredClone(row.source):null}));
 api().addDesigns(designs,preset);view.batch=[];renderBatch();el('universe-batch').hidden=true;view.world='';go('collection');toast('✓ Tags erstellt. Unter „Druckplätze & Stapelwerkzeuge“ den Stapel zum Druckbogen übernehmen.');
 }catch(error){el('universe-batch-status').textContent=error.message;}
};
// Entry links survive editor, collection and print; unknown technical data remain empty.
const originalSelectItem=selectItem;selectItem=function(item){originalSelectItem(item);syncSmart();};
syncSmart();go('home');
})();
