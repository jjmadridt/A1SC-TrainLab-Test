/* A1SC TRAIN LAB -> FUEL LAB: v1 summary builder and optional week-specific planned load. Preview saves locally only. */
(function(root){
 'use strict';
 const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const KEYS={strength:'fitclimb-v1',cycle:'a1sc-cycle-weekly-plan-v03',run:'a1sc-run-weekly-v1',swim:'a1sc-swim-weekly-plan-v01',triathlon:'a1sc-triathlon-weekly-plan-v01'};
 function read(key){try{return JSON.parse(root.localStorage.getItem(key)||'null')}catch(_){return null}}
 function monday(reference){const d=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
 function isoLocal(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
 function validItems(v){return Array.isArray(v)?v.filter(x=>x!==null&&x!==undefined):[]}
 const LOAD_PREFIX='a1sc.trainlab.planned-load.v1:';
 const INTENSITIES=['unknown','easy','moderate','hard'];
 function validMinutes(v){return v===null||(Number.isInteger(v)&&v>=1&&v<=1440)}
 function rowsForWeek(now=new Date()){
  const strength=read(KEYS.strength)?.weeklyProgram||{};
  const cycle=read(KEYS.cycle)||{},run=read(KEYS.run)||{},swim=read(KEYS.swim)||{},tri=read(KEYS.triathlon)||{};
  const start=monday(now);
  return DAYS.map((name,i)=>{
   const date=new Date(start);date.setDate(start.getDate()+i);
   const groups=[['strength',validItems(strength[name])],['cycle',validItems(cycle[i])],['run',validItems(run[name])],['swim',validItems(swim[i])],['triathlon',validItems(tri[i]?.items)]];
   return {date:isoLocal(date),sessions:groups.filter(([,items])=>items.length>0).map(([discipline,items])=>({discipline,count:items.length,signature:JSON.stringify(items)}))};
  });
 }
 function loadFor(rows){
  const v=read(LOAD_PREFIX+rows[0].date);
  return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 }
 function rowKey(day,session){return day.date+'|'+session.discipline}
 function savedEstimate(saved,day,session){
  const x=saved[rowKey(day,session)];
  return x&&x.signature===session.signature&&validMinutes(x.plannedMinutes)&&INTENSITIES.includes(x.intensity)?{plannedMinutes:x.plannedMinutes,intensity:x.intensity}:{plannedMinutes:null,intensity:'unknown'};
 }
 function build(now=new Date()){
  const rows=rowsForWeek(now),saved=loadFor(rows);
  const days=rows.map(day=>({date:day.date,sessions:day.sessions.map(session=>({discipline:session.discipline,...savedEstimate(saved,day,session)}))}));
  return {schema:'a1sc.training-summary',version:1,source:'trainlab',weekStart:rows[0].date,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',days};
 }
 const FUEL_URL='https://jjmadridt.github.io/A1SC-FuelLab-Test/';
 const FUEL_ORIGIN='https://jjmadridt.github.io';
 const FUEL_PATH='/A1SC-FuelLab-Test/';
 const PROTOCOL='a1sc.trainlab-fuellab';
 const TIMEOUT_MS=30000;
 let active=false;
 function sendToFuelLab(){
  if(active){alert('A transfer is already in progress.');return}
  if(!root.crypto||!root.crypto.getRandomValues){alert('Secure transfer is not supported in this browser.');return}
  const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);
  const token=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  const summary=build();
  // The fragment carries only a random handshake token, NEVER training information.
  let child=null, done=false, timer, phase='WAIT_READY', diagnostic='no READY received';
  active=true;
  function cleanup(){
   if(done)return;
   done=true;active=false;root.removeEventListener('message',onMessage);
   root.clearTimeout(timer);
  }
  function fail(message){cleanup();root.alert(message)}
  function onMessage(event){
   if(done||!child||event.source!==child)return;
   if(event.origin!==FUEL_ORIGIN){diagnostic='receiver origin rejected';return}
   const m=event.data;
   if(!m||typeof m!=='object'||m.protocol!==PROTOCOL||m.version!==1||m.token!==token){diagnostic='invalid handshake envelope';return}
   // Path inspection is possible only for same-origin windows. Across origins,
   // trust the exact origin, opened window and one-time token, not a claimed path.
   if(root.location.origin===FUEL_ORIGIN){
    try{if(child.location.origin!==FUEL_ORIGIN||child.location.pathname!==FUEL_PATH){diagnostic='receiver path rejected';return}}catch(_){diagnostic='receiver location unavailable';return}
   }
   if(m.type==='READY'&&phase==='WAIT_READY'){
    phase='WAIT_ACK';diagnostic='READY accepted; no acknowledgment received';
    try{child.postMessage({protocol:PROTOCOL,version:1,type:'SUMMARY',token,payload:summary},FUEL_ORIGIN)}catch(_){fail('Unable to send training summary.');}
   }else if(m.type==='RECEIVED'&&phase==='WAIT_ACK'){
    cleanup();
   }else if(m.type==='ERROR'){
    fail('FUEL LAB rejected the transfer. No TRAIN LAB data was changed.');
   }
  }
  root.addEventListener('message',onMessage);
  try{child=root.open(FUEL_URL+'#tlhandoff='+token,'_blank')}catch(_){fail('Unable to open FUEL LAB.');return}
  if(!child){fail('Allow TRAIN LAB to open FUEL LAB, then try again.');return}
  timer=root.setTimeout(()=>fail('FUEL LAB transfer timed out: '+diagnostic+'. No TRAIN LAB data was changed.'),TIMEOUT_MS);
 }
 function previewSummary(){
  const rows=rowsForWeek(),saved=loadFor(rows),d=root.document;
  const old=d.getElementById('tl-fuel-preview');if(old&&!old.tlClose())return;
  const panel=d.createElement('section');panel.id='tl-fuel-preview';
  panel.style.cssText='margin:12px auto;padding:16px;max-width:560px;background:#102c43;color:white;border:1px solid #527fa0;border-radius:12px';
  const form=d.createElement('form');form.style.cssText='display:grid;gap:12px';panel.append(form);
  const translations=[];const es=()=>d.getElementById('language-toggle')?.value==='es';
  const tr=(a,b)=>es()?b:a;
  function translate(el,en,spanish){translations.push([el,en,spanish]);el.textContent=tr(en,spanish);return el;}
  function add(parent,tag,en,spanish){const el=d.createElement(tag);if(spanish!==undefined)translate(el,en,spanish);else el.textContent=en;parent.append(el);return el;}
  add(form,'h3','Weekly export preview — 3B.2','Vista previa semanal — 3B.2');
  add(form,'p','Optional planned load for this week. Enter the total minutes and overall effort for each discipline, including all its exercises. Leave either field unknown if unsure.','Carga prevista opcional para esta semana. Ingresa los minutos totales y el esfuerzo general de cada disciplina, incluyendo todos sus ejercicios. Deja cualquier campo sin definir si no lo sabes.');
  add(form,'p','Estimates stay on this device. They do not modify your exercises, logs or meal plan. Nothing is sent.','Las estimaciones se guardan en este dispositivo. No modifican tus ejercicios, registros ni plan de comidas. No se envía nada.');
  add(form,'p',rows[0].date+' · '+Intl.DateTimeFormat().resolvedOptions().timeZone);
  const labels={strength:['Total Body','Cuerpo completo'],cycle:['Cycle','Ciclismo'],run:['Run','Carrera'],swim:['Swim','Natación'],triathlon:['Triathlon','Triatlón']};
  const intensityLabels={unknown:['Unknown','Sin definir'],easy:['Easy','Suave'],moderate:['Moderate','Moderado'],hard:['Hard','Intenso']};
  const inputs=[];
  rows.forEach(day=>{
   const box=d.createElement('section');box.style.cssText='border-top:1px solid #345c79;padding-top:10px;display:grid;gap:8px';form.append(box);
   const weekday=locale=>new Intl.DateTimeFormat(locale,{weekday:'long',timeZone:'UTC'}).format(new Date(day.date+'T00:00:00Z'))+' · '+day.date;
   add(box,'strong',weekday('en'),weekday('es'));
   if(!day.sessions.length){add(box,'small','No saved sessions','Sin sesiones guardadas');return;}
   day.sessions.forEach(session=>{
    const item=d.createElement('div');item.style.cssText='display:grid;gap:6px;padding:8px;border-radius:8px;background:#162e44';box.append(item);
    add(item,'strong',labels[session.discipline][0]+' · '+session.count+' '+(session.count===1?'activity':'activities'),labels[session.discipline][1]+' · '+session.count+' '+(session.count===1?'actividad':'actividades'));
    const grid=d.createElement('div');grid.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px';item.append(grid);
    const estimate=savedEstimate(saved,day,session);
    const ml=d.createElement('label');grid.append(ml);add(ml,'span','Planned minutes','Minutos previstos');
    const m=d.createElement('input');m.type='number';m.min='1';m.max='1440';m.step='1';m.inputMode='numeric';m.placeholder='—';m.value=estimate.plannedMinutes??'';m.style.cssText='display:block;width:100%;box-sizing:border-box';ml.append(m);
    const il=d.createElement('label');grid.append(il);add(il,'span','Planned effort','Esfuerzo previsto');
    const intensity=d.createElement('select');intensity.style.cssText='display:block;width:100%;box-sizing:border-box';il.append(intensity);
    for(const val of INTENSITIES){const option=d.createElement('option');option.value=val;translate(option,...intensityLabels[val]);intensity.append(option);}
    intensity.value=estimate.intensity;
    const id=rowKey(day,session);m.id='tl-fuel-min-'+id;intensity.id='tl-fuel-effort-'+id;
    inputs.push({day,session,m,intensity,estimate});
   });
  });
  const status=add(form,'p','');status.setAttribute('role','status');status.style.margin='0';
  let statusPair=['',''];function message(en,spanish){statusPair=[en,spanish];status.textContent=tr(en,spanish);}
  const buttons=d.createElement('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:8px';form.append(buttons);
  const save=add(buttons,'button','Save planned load','Guardar carga prevista');save.type='submit';save.disabled=!inputs.length;
  const close=add(buttons,'button','Close preview','Cerrar vista previa');close.type='button';
  function dirty(){return inputs.some(x=>x.m.value!==String(x.estimate.plannedMinutes??'')||x.intensity.value!==x.estimate.intensity)}
  panel.tlClose=()=>{if(dirty()&&!root.confirm(tr('Discard unsaved estimates?','¿Descartar estimaciones sin guardar?')))return false;d.getElementById('language-toggle')?.removeEventListener('change',refreshLanguage);panel.remove();return true;};close.onclick=panel.tlClose;
  function refreshLanguage(){if(!panel.isConnected){d.getElementById('language-toggle')?.removeEventListener('change',refreshLanguage);return;}translations.forEach(([el,en,spanish])=>el.textContent=tr(en,spanish));status.textContent=tr(...statusPair);}
  d.getElementById('language-toggle')?.addEventListener('change',refreshLanguage);
  form.addEventListener('input',()=>message('Unsaved changes','Cambios sin guardar'));
  form.addEventListener('submit',event=>{
   event.preventDefault();
   // Reject stale editor snapshots. Do not overwrite data for a changed plan or week.
   if(JSON.stringify(rowsForWeek())!==JSON.stringify(rows)){message('The week or workout plan changed. Close and reopen the preview before saving.','La semana o el plan cambió. Cierra y abre la vista previa antes de guardar.');return;}
   const next={},totals={};
   for(const x of inputs){
    const plannedMinutes=x.m.value===''?null:Number(x.m.value),intensity=x.intensity.value;
    if(x.m.validity.badInput||!validMinutes(plannedMinutes)||!INTENSITIES.includes(intensity)){message('Enter whole minutes between 1 and 1440, or leave blank.','Ingresa minutos enteros entre 1 y 1440, o deja el campo vacío.');return;}
    totals[x.day.date]=(totals[x.day.date]||0)+(plannedMinutes??0);
    if(totals[x.day.date]>1440){message('Daily planned minutes cannot exceed 1440 across all disciplines.','Los minutos previstos diarios no pueden superar 1440 entre todas las disciplinas.');return;}
    if(plannedMinutes!==null||intensity!=='unknown')next[rowKey(x.day,x.session)]={signature:x.session.signature,plannedMinutes,intensity};
   }
   try{root.localStorage.setItem(LOAD_PREFIX+rows[0].date,JSON.stringify(next));}
   catch(_){message('Could not save estimates. Previous data was not changed.','No se pudieron guardar las estimaciones. No se cambiaron los datos anteriores.');return;}
   inputs.forEach(x=>x.estimate=savedEstimate(next,x.day,x.session));message('Saved on this device. Nothing sent.','Guardado en este dispositivo. No se envió nada.');
  });
  d.getElementById('tl-send-fuel').parentElement.after(panel);panel.scrollIntoView({block:'nearest'});
 }
 root.TrainLabFuelLab={buildSummary:build,sendToFuelLab,previewSummary};

})(window);
