/* A1SC Unified History — individual record management. */
(function(){
'use strict';
const SOURCES={total:'fitclimb-v1',cycle:'a1sc-cycle-activity-log-v05',run:'a1sc-run-activities-v1',swim:'a1sc-swim-activity-history-v01',triathlon:'a1sc-triathlon-activity-log-v01',triSets:'a1sc-triathlon-strength-sets-v01'};
const tr=(en,es)=>document.getElementById('language-toggle')?.value==='es'?es:en;
const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key));return value===null?fallback:value;}catch(e){return fallback;}};
const array=v=>Array.isArray(v)?v:[];
const str=v=>v==null?'':String(v);
const safeDate=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d:null;};
const dateOf=(v,fallback)=>safeDate(v)||safeDate(fallback);
const formatDuration=seconds=>{const n=Number(seconds);if(!Number.isFinite(n)||n<0)return '';const m=Math.floor(n/60),s=Math.round(n%60);return m+'m'+(s?' '+s+'s':'');};
function totalDetail(s,tb){
 const name=str(s.name),minutes=Number(s.count);
 if(name==='Stationary bike')return name+' · '+(Number.isFinite(minutes)?formatDuration(minutes*60):'');
 if(name==='Outdoor ride'){
  const unit=tb?.distanceUnits?.[name]==='mi'?'mi':'km';
  const km=Number(s.weight),distance=Number.isFinite(km)?Number((unit==='mi'?km/1.609344:km).toFixed(2)):null;
  const duration=Number.isFinite(minutes)?Math.floor(minutes/60)+'h '+Math.round(minutes%60)+'m':'';
  const extras=[];
  if(s.elevationGainM!=null)extras.push('↑'+Number((unit==='mi'?s.elevationGainM/0.3048:s.elevationGainM).toFixed(unit==='mi'?0:1))+' '+(unit==='mi'?'ft':'m'));
  const avg=Number.isFinite(km)&&km>=0&&Number.isFinite(minutes)&&minutes>0?km/(minutes/60):(s.averageSpeedKmh!=null?Number(s.averageSpeedKmh):null);
  if(avg!=null&&Number.isFinite(avg))extras.push(Number((unit==='mi'?avg/1.609344:avg).toFixed(1))+' '+(unit==='mi'?'mph':'km/h'));
  return name+' · '+[duration,distance!==null?distance+' '+unit:'',...extras].filter(Boolean).join(' · ');
 }
 if(name==='Elliptical warm-up'){
  const km=Number(s.weight),unit=tb?.distanceUnits?.[name]==='mi'?'mi':'km';
  const distance=Number.isFinite(km)&&km>0?(unit==='mi'?km/1.609344:km):null;
  const distanceText=distance===null?'':Number(distance.toFixed(2))+' '+unit;
  return name+' · '+[Number.isFinite(minutes)?formatDuration(minutes*60):'',distanceText].filter(Boolean).join(' · ');
 }
 return name+' · '+str(s.weight)+' lb × '+str(s.count)+' '+str(s.unit);
}
// Read-only, interval-bounded BLE heart-rate statistics. Never attribute a full day's HR to one exercise.
const HR_JOURNAL_KEY='a1sc-trainlab-hr-journal-v01';
function hrForRecord(record){
 const all=array(read(HR_JOURNAL_KEY,[]));
 const aliases={total:['total body'],cycle:['cycle','indoor cycle'],run:['run'],swim:['swim'],triathlon:['triathlon']}[record.discipline]||[];
 const start=Number(record.hrStart),end=Number(record.hrEnd);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<=0||end<=start||end-start>86400000)return {lines:[],note:tr('Precise exercise timing unavailable; HR cannot be reliably attributed.','Sin horario preciso del ejercicio; no es posible atribuir la FC con fiabilidad.')};
 const samples=all.filter(x=>x&&x.type==='sample'&&Number(x.at)>=start&&Number(x.at)<=end&&aliases.some(a=>str(x.module).toLowerCase().includes(a))&&Number.isFinite(x.bpm)&&x.bpm>=30&&x.bpm<=250);
 if(!samples.length)return {lines:[],note:tr('No HR samples recorded during this exercise.','Sin muestras de FC durante este ejercicio.')};
 const vals=samples.map(x=>x.bpm);
 return {lines:[tr('Average HR: ','FC promedio: ')+Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)+' BPM',tr('Maximum HR: ','FC máxima: ')+Math.max(...vals)+' BPM',tr('Samples: ','Muestras: ')+vals.length],note:tr('Based only on BLE samples within the recorded exercise interval.','Solo muestras BLE dentro del intervalo registrado del ejercicio.')};
}
// Session volume calculated from the same saved Total Body resistance-set records.
function weightMoved(sets,tb){
 let pounds=0,count=0;
 for(const x of sets){
  const unit=str(x.unit).trim().toLowerCase();
  const name=str(x.name).trim().toLowerCase();
  const w=Number(x.weight);
  // A completed Farmer carry counts its saved total load exactly once per set.
  // Ignore its time, distance and equipment label; do not infer a per-hand multiplier.
  if(name==='farmer carry'||name==='caminata del granjero'){
   if(Number.isFinite(w)&&w>0){pounds+=w;count++;}
   continue;
  }
  // All other resistance work uses recorded repetitions only.
  if(!['reps','per side','per leg'].includes(unit))continue;
  const r=Number(x.count);
  if(!Number.isFinite(w)||!Number.isFinite(r)||w<=0||r<=0)continue;
  // Saved dumbbell weight already represents the logged load. Do not double it
  // simply because the equipment label says "weight per hand".
  // A per-side/per-leg count explicitly represents repetitions on each side.
  const sides=(unit==='per side'||unit==='per leg')?2:1;
  pounds+=w*r*sides;count++;
 }
 const unit=tb?.settings?.unit==='kg'?'kg':'lb';
 const value=unit==='kg'?pounds/2.2046226218:pounds;
 const locale=document.documentElement.lang==='es'?'es-MX':'en-US';
 return {label:tr('Total Weight Moved','Peso total movido'),value:new Intl.NumberFormat(locale,{minimumFractionDigits:0,maximumFractionDigits:1}).format(value)+' '+unit,count};
}
// Exact storage snapshots guard against stale index operations, including duplicate legacy records.
const ref=(source,index,raw,label='',nested=null)=>({source,index,raw,label,nested,snapshot:localStorage.getItem(SOURCES[source]),mirror:source==='triathlon'&&nested!==null?localStorage.getItem(SOURCES.triSets):null});
const entryOf=x=>x.nested===null?x.raw:x.raw.sets[x.nested];
const excluded=x=>entryOf(x)?.excludedFromProgress===true;
const triSetDetail=x=>str(x.exercise)+' · '+(x.exercise==='Side plank'?str(x.reps)+' s':str(x.weightLb)+' lb × '+str(x.reps));
function strictRead(raw,fallback){return raw===null?fallback:JSON.parse(raw);}
function mutateHistory(x,operation,patch){
 const key=SOURCES[x.source],original=localStorage.getItem(key);
 if(original!==x.snapshot)throw Error('stale');
 const parsed=strictRead(original,x.source==='total'?{}:[]),list=x.source==='total'?parsed.logs:parsed;
 if(!Array.isArray(list)||JSON.stringify(list[x.index])!==JSON.stringify(x.raw))throw Error('stale');
 const next=list.slice(),r=list[x.index],old=entryOf(x);
 const change=v=>operation==='delete'?null:operation==='exclude'?{...v,excludedFromProgress:!excluded(x)}:{...v,...patch,historyCorrected:true};
 let mirrorNext=null,mirrorRaw=null;
 if(x.nested!==null){
  const sets=r.sets.slice(),v=change(old);if(v===null)sets.splice(x.nested,1);else sets[x.nested]=v;
  next[x.index]={...r,sets};
  mirrorRaw=localStorage.getItem(SOURCES.triSets);if(mirrorRaw!==x.mirror)throw Error('stale');
  const mirror=strictRead(mirrorRaw,[]);if(!Array.isArray(mirror))throw Error('invalid');
  if(old.id){if(list.flatMap(a=>array(a?.sets)).filter(a=>a?.id===old.id).length!==1)throw Error('ambiguous');const matches=mirror.map((m,i)=>m?.id===old.id?i:-1).filter(i=>i>=0);if(matches.length>1)throw Error('ambiguous');
   if(matches.length){mirrorNext=mirror.slice();const i=matches[0],v=change(mirror[i]);if(v===null)mirrorNext.splice(i,1);else mirrorNext[i]=v;}}
 }else{const v=change(r);if(v===null)next.splice(x.index,1);else next[x.index]=v;}
 const output=x.source==='total'?{...parsed,logs:next}:next;
 // Do not discard completed session metadata, body measurements, plans, or HR journal.
 // A mirrored Triathlon set is changed in both stores; roll back the first write if the second fails.
 if(mirrorNext!==null){localStorage.setItem(SOURCES.triSets,JSON.stringify(mirrorNext));try{localStorage.setItem(key,JSON.stringify(output));}catch(e){try{if(mirrorRaw===null)localStorage.removeItem(SOURCES.triSets);else localStorage.setItem(SOURCES.triSets,mirrorRaw);}catch(rollback){throw Error('rollback');}throw e;}}
 else localStorage.setItem(key,JSON.stringify(output));
 if(x.source==='total')window.TrainLabHistoryReloadTotal(output);
 if(x.source==='cycle')window.TrainLabHistoryReloadCycle(next);
 if(x.source==='run')window.TrainLabHistoryReloadRun(next);
 if(x.source==='triathlon'||x.source==='triSets')window.TrainLabHistoryClearTriUndo();
}
function correctionSpec(x){
 const r=entryOf(x),fields=[];const add=(key,en,es,value,min=0,integer=false,max=1e7)=>fields.push({key,label:tr(en,es),value,min:integer?Math.ceil(min):min,integer,max});
 const t=x.source;
 if(t==='total'){
  if(r.name!=='Stationary bike'&&r.name!=='Side plank')add('weight',r.unit==='minutes'?'Distance (km)':'Weight (lb)',r.unit==='minutes'?'Distancia (km)':'Peso (lb)',r.weight);
  add('count',r.unit==='minutes'?'Duration (minutes)':r.unit?.includes('seconds')?'Duration (seconds)':'Repetitions',r.unit==='minutes'?'Duración (minutos)':r.unit?.includes('seconds')?'Duración (segundos)':'Repeticiones',r.count,0.01,r.unit!=='minutes');
  if(r.name==='Outdoor ride'&&r.elevationGainM!=null)add('elevationGainM','Elevation gain (m)','Desnivel (m)',r.elevationGainM);
 }else if(t==='cycle'){add('actualSeconds','Duration (minutes)','Duración (minutos)',Number(r.actualSeconds??Number(r.actualMinutes)*60)/60,0.01,false,1440);if(r.rpe!=null)add('rpe','Effort (RPE 1–10)','Esfuerzo (RPE 1–10)',r.rpe,1,true,10);}
 else if(t==='swim'){add('distance','Distance ('+str(r.unit)+')','Distancia ('+str(r.unit)+')',r.distance,0,true);add('completedSets','Completed sets','Series completadas',r.completedSets,0,true);add('durationSeconds','Duration (minutes)','Duración (minutos)',Number(r.durationSeconds)/60,0,false,1440);}
 else if(t==='run'){
  const labels={minutes:['Duration (minutes)','Duración (minutos)'],distance:['Distance ('+str(r.data?.unit||r.unit||'km')+')','Distancia ('+str(r.data?.unit||r.unit||'km')+')'],incline:['Incline (%)','Inclinación (%)'],cycles:['Cycles','Ciclos'],peak:['Peak (seconds)','Pico (segundos)'],recovery:['Recovery (seconds)','Recuperación (segundos)'],sets:['Sets','Series'],seconds:['Seconds per set','Segundos por serie'],reps:['Repetitions','Repeticiones'],weight:['Weight (kg)','Peso (kg)'],completedSeconds:['Timer elapsed (seconds)','Tiempo registrado (segundos)']};
  for(const [k,v] of Object.entries(r.data||{})){if(!labels[k]||v===''||v==null||(k==='completedSeconds'&&(r.kind==='run'||(!r.kind&&r.data?.minutes!=null))))continue;add(k,...labels[k],v,['minutes','cycles','peak','recovery','sets','seconds','reps'].includes(k)?0.01:0,['cycles','sets','reps'].includes(k));}
 }else if(t==='triSets'||x.nested!==null){if(r.exercise!=='Side plank')add('weightLb','Weight (lb)','Peso (lb)',r.weightLb);add('reps',r.exercise==='Side plank'?'Seconds per side':'Repetitions',r.exercise==='Side plank'?'Segundos por lado':'Repeticiones',r.reps,1,true);}
 else if(t==='triathlon'){const d=r.details||{};if(d.distance!==''&&d.distance!=null)add('distance','Distance ('+str(d.distanceUnit)+')','Distancia ('+str(d.distanceUnit)+')',d.distance);if(d.durationMin!==''&&d.durationMin!=null)add('durationMin','Duration (minutes)','Duración (minutos)',d.durationMin);if(d.rpe!==''&&d.rpe!=null)add('rpe','Effort (RPE 1–10)','Esfuerzo (RPE 1–10)',d.rpe,1,true,10);}
 return fields;
}
function correctionPatch(x,values){
 const r=entryOf(x),t=x.source;
 if(t==='total'){if(r.name==='Outdoor ride')values.averageSpeedKmh=(values.weight??r.weight)/((values.count??r.count)/60);if(r.timerRecordedSeconds!=null&&values.count!==r.count)values.timerRecordedSeconds=null;return values;}
 if(t==='cycle'){values.actualSeconds=Math.round(values.actualSeconds*60);values.actualMinutes=Math.floor(values.actualSeconds/60);return values;}
 if(t==='swim'){values.durationSeconds=Math.round(values.durationSeconds*60);if(!values.distance&&!values.completedSets&&!values.durationSeconds)throw Error('invalid');return values;}
 if(t==='run'){const data={...r.data};for(const [k,v] of Object.entries(values))data[k]=String(v);let duration=r.durationSeconds,distance=r.distance,pace=r.pace;if(r.kind==='run'||(!r.kind&&data.minutes!=null)){if(values.minutes!=null&&Number(values.minutes)!==Number(r.data?.minutes))duration=Math.round(Number(data.minutes)*60);else if(values.completedSeconds!=null&&Number(values.completedSeconds)!==Number(r.data?.completedSeconds))duration=Number(values.completedSeconds);else if(!Number.isFinite(Number(duration))||Number(duration)<=0)duration=Math.round(Number(data.minutes)*60);distance=Number(data.distance)||0;const km=distance*(data.unit==='mi'?1.609344:1);const seconds=km>0?Math.round(duration/km):0;pace=seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} /km`:'';}else if(values.completedSeconds!=null)duration=values.completedSeconds;return {data,durationSeconds:duration,distance,pace};}
 if(t==='triathlon'&&x.nested===null){const details={...r.details};for(const [k,v] of Object.entries(values))details[k]=String(v);if(!Number(details.distance)&&!Number(details.durationMin))throw Error('invalid');return {details};}
 return values;
}
function manageRow(x,refresh){
 const row=document.createElement('div');row.className='uh-manage';row.style.cssText='border:1px solid #36536b;border-radius:10px;padding:10px;margin:8px 0;display:grid;gap:8px';
 const title=document.createElement('strong');title.textContent=x.label||tr('Manage this activity','Administrar esta actividad');row.append(title);
 if(excluded(x)){const label=document.createElement('small');label.textContent=tr('Excluded from progress','Excluido del progreso');label.style.color='#f5c87e';row.append(label);}
 const menu=document.createElement('details');const summary=document.createElement('summary');summary.textContent=tr('Manage record','Administrar registro');menu.append(summary);row.append(menu);
 const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:8px';menu.append(controls);
 const btn=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;b.style.minHeight='40px';return b;};
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.style.margin='0';row.append(msg);
 const apply=(op,patch)=>{try{mutateHistory(x,op,patch);refresh();}catch(e){msg.textContent=e.message==='rollback'?tr('Storage error. Check your records before continuing.','Error de almacenamiento. Revisa tus registros antes de continuar.'):tr('No change saved. Reopen History and try again.','No se guardó el cambio. Abre Historial de nuevo e inténtalo.');}};
 const spec=correctionSpec(x);if(spec.length)controls.append(btn(tr('Correct entry','Corregir registro'),()=>{
  if(menu.querySelector('form'))return;const form=document.createElement('form');form.style.cssText='display:grid;gap:8px;margin-top:10px';
  const fields=spec.map(f=>{const l=document.createElement('label');l.textContent=f.label;const input=document.createElement('input');input.type='number';input.required=true;input.min=String(f.min);input.max=String(f.max);input.step=f.integer?'1':'any';input.value=Number.isFinite(Number(f.value))?String(f.value):'';l.append(input);form.append(l);return [f,input];});
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';const save=btn(tr('Save correction','Guardar corrección'),()=>{});save.type='submit';actions.append(save,btn(tr('Cancel','Cancelar'),()=>form.remove()));form.append(actions);
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const values={};for(const [f,input] of fields){const v=Number(input.value);if(input.value===''||!Number.isFinite(v)||v<f.min||v>f.max||(f.integer&&!Number.isInteger(v)))return;values[f.key]=v;}try{apply('correct',correctionPatch(x,values));}catch(e){msg.textContent=tr('Check the entered values.','Revisa los valores ingresados.');}};menu.append(form);
 }));
 controls.append(btn(excluded(x)?tr('Include in progress','Incluir en progreso'):tr('Exclude from progress','Excluir del progreso'),()=>apply('exclude')));
 const del=btn(tr('Delete entry','Eliminar registro'),async()=>{if(await window.TrainLabConfirmDelete(tr('Permanently delete this one entry? This cannot be undone.','¿Eliminar permanentemente este registro? No se puede deshacer.')))apply('delete');});del.style.color='#ff92a9';controls.append(del);return row;
}

// Empty completed sessions are metadata, not exercise records. Delete only the
// selected metadata row, with the same stale-data guard as individual entries.
function isEmptyTriStrength(r){
 return r?.discipline==='Strength'&&(r.sets==null||(Array.isArray(r.sets)&&r.sets.length===0));
}
function deleteEmptySession(x){
 if(x.source==='triathlon'){
  if(!isEmptyTriStrength(x.raw))throw Error('invalid');
  mutateHistory(x,'delete');return;
 }
 if(x.source!=='total')throw Error('invalid');
 const key=SOURCES.total,raw=localStorage.getItem(key);
 if(raw!==x.snapshot)throw Error('stale');
 const db=strictRead(raw,{});
 if(!Array.isArray(db.completed)||!Array.isArray(db.logs)||JSON.stringify(db.completed[x.index])!==JSON.stringify(x.raw))throw Error('stale');
 if(db.logs.some(r=>r&&str(r.day)===str(x.raw.day)&&str(r.session)===str(x.raw.session)))throw Error('not empty');
 const next={...db,completed:db.completed.filter((_,i)=>i!==x.index)};
 localStorage.setItem(key,JSON.stringify(next));
 window.TrainLabHistoryReloadTotal(next);
}
function emptySessionControl(x,refresh){
 const row=document.createElement('div');row.className='uh-empty-session';row.style.cssText='display:grid;gap:8px;margin:8px 0';
 const b=document.createElement('button');b.type='button';b.textContent=tr('Delete empty session','Eliminar sesión vacía');b.style.cssText='min-height:44px;color:#ff92a9';
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.style.margin='0';
 b.onclick=async()=>{b.disabled=true;try{if(await window.TrainLabConfirmDelete(tr('Permanently delete this empty session? No exercise records will be deleted.','¿Eliminar permanentemente esta sesión vacía? No se eliminarán registros de ejercicios.'))){deleteEmptySession(x);refresh();}}catch(e){msg.textContent=tr('No change saved. Reopen History and try again.','No se guardó el cambio. Abre Historial de nuevo e inténtalo.');}finally{b.disabled=false;}};
 row.append(b,msg);return row;
}

function getRecords(){
 const records=[];
 const tb=read(SOURCES.total,{}),logs=array(tb?.logs),done=array(tb?.completed),groups=new Map();
 for(const [index,x] of logs.entries()){if(!x||typeof x!=='object')continue;const key=str(x.day)+'|'+str(x.session);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({raw:x,index});}
 const completedKeys=new Set();
 for(const [index,c] of done.entries()){if(!c||typeof c!=='object')continue;const key=str(c.day)+'|'+str(c.session);completedKeys.add(key);const sets=groups.get(key)||[];const d=dateOf(c.finishedAt,sets[sets.length-1]?.raw.timestamp||sets[sets.length-1]?.raw.date);if(!d)continue;records.push({discipline:'total',date:d,name:tr('Total Body — '+str(c.day),'Cuerpo completo — '+str(c.day)),summary:tr('Completed session','Sesión finalizada')+' · '+sets.length+' '+tr('entries','registros'),details:[],manage:sets.map(s=>ref("total",s.index,s.raw,totalDetail(s.raw,tb))),weightMoved:weightMoved(sets.map(s=>s.raw).filter(x=>!x.excludedFromProgress),tb),sourceSessionKey:key,emptySession:sets.length===0&&Array.isArray(tb.logs)?ref("total",index,c):null,note:''});}
 for(const [key,sets] of groups){if(completedKeys.has(key)||!sets.length)continue;const d=dateOf(sets[sets.length-1].raw.timestamp,sets[sets.length-1].raw.date);if(!d)continue;records.push({discipline:'total',date:d,name:tr('Total Body — '+str(sets[0].raw.day),'Cuerpo completo — '+str(sets[0].raw.day)),summary:tr('Logged workout','Entrenamiento registrado')+' · '+sets.length+' '+tr('entries','registros'),details:[],manage:sets.map(s=>ref("total",s.index,s.raw,totalDetail(s.raw,tb))),weightMoved:weightMoved(sets.map(s=>s.raw).filter(x=>!x.excludedFromProgress),tb),sourceSessionKey:key,note:''});}
 for(const [index,r] of array(read(SOURCES.cycle,[])).entries()){if(!r||typeof r!=='object')continue;const d=dateOf(r.date);if(!d)continue;records.push({discipline:'cycle',manage:[ref('cycle',index,r)],date:d,name:str(r.workoutName||r.workoutId||'Cycle'),summary:[formatDuration(r.actualSeconds??(Number(r.actualMinutes)*60)),r.rpe?'RPE '+r.rpe:'',r.completion==='complete'?tr('Complete','Completo'):r.completion==='partial'?tr('Partial','Parcial'):''].filter(Boolean).join(' · '),details:[r.mode?tr('Mode: ','Modo: ')+str(r.mode):'',r.plannedMinutes!=null?tr('Planned: ','Planeado: ')+str(r.plannedMinutes)+' min':''].filter(Boolean),note:str(r.notes)});}
 for(const [index,r] of array(read(SOURCES.run,[])).entries()){if(!r||typeof r!=='object')continue;const d=dateOf(r.timestamp);if(!d)continue;const fields=r.data&&typeof r.data==='object'?Object.entries(r.data).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>k+': '+str(v)):[];records.push({discipline:'run',manage:[ref('run',index,r)],date:d,name:str(r.exercise||'Run'),summary:[formatDuration(r.durationSeconds),r.distance?str(r.distance)+' '+str(r.unit):'',str(r.pace)].filter(Boolean).join(' · '),details:fields,note:'',hrStart:!r.historyCorrected&&Number(r.durationSeconds)>0?d.getTime()-Number(r.durationSeconds)*1000:undefined,hrEnd:!r.historyCorrected&&Number(r.durationSeconds)>0?d.getTime():undefined});}
 for(const [index,r] of array(read(SOURCES.swim,[])).entries()){if(!r||typeof r!=='object')continue;const d=dateOf(r.savedAt,r.startedAt);if(!d)continue;const ws=array(r.workoutDetails),fallback=array(r.workouts);const spanish=document.getElementById('language-toggle')?.value==='es';const names=ws.length?ws.map(w=>str(spanish?w.es||w.en:w.en||w.es||w.id)):fallback.map(w=>str(w.en||w.name||w.id||''));records.push({discipline:'swim',manage:[ref('swim',index,r)],date:d,name:names.filter(Boolean).join(' + ')||tr('Swim session','Sesión de natación'),summary:[r.environment==='pool'?tr('Pool','Alberca'):r.environment==='open'?tr('Open Water','Aguas abiertas'):str(r.environment),r.distance!=null?str(r.distance)+' '+str(r.unit):'',formatDuration(r.durationSeconds)].filter(Boolean).join(' · '),details:[...ws.map(w=>str(w.category)).filter(Boolean),r.completedSets!=null?tr('Completed sets: ','Series completadas: ')+str(r.completedSets):''],note:str(r.notes),hrStart:dateOf(r.startedAt)?.getTime(),hrEnd:dateOf(r.finishedAt,r.savedAt)?.getTime()});}

 const tri=array(read(SOURCES.triathlon,[])),triSets=array(read(SOURCES.triSets,[]));
 const linked=new Set();
 for(const [index,r] of tri.entries()){
  if(!r||typeof r!=='object')continue;const d=dateOf(r.completedAt);if(!d)continue;
  const sets=array(r.sets);for(const x of sets)if(x?.id)linked.add(x.id);
  const strength=r.discipline==='Strength';
  const refs=strength?sets.map((x,i)=>ref('triathlon',index,r,triSetDetail(x),i)): [ref('triathlon',index,r)];
  records.push({discipline:'triathlon',date:d,name:str(r.exercise||'Triathlon'),summary:strength?sets.length+' '+tr('sets','series'):[r.details?.distance?str(r.details.distance)+' '+str(r.details.distanceUnit):'',r.details?.durationMin?str(r.details.durationMin)+' min':''].filter(Boolean).join(' · '),details:[],manage:refs,emptySession:isEmptyTriStrength(r)?ref("triathlon",index,r):null,note:str(r.notes)});
 }
 for(const [index,x] of triSets.entries()){
  if(!x||linked.has(x.id))continue;const d=dateOf(x.timestamp);if(!d)continue;
  records.push({discipline:'triathlon',date:d,name:str(x.exercise),summary:tr('Logged set (not in a saved activity)','Serie registrada (sin actividad guardada)'),details:[],manage:[ref('triSets',index,x,triSetDetail(x))],note:''});
 }
 return records.sort((a,b)=>b.date-a.date);
}
function mount(){const host=document.getElementById('athlete-profile-content');if(!host)return;const existing=document.getElementById('unified-history');if(existing)existing.remove();const section=document.createElement('section');section.id='unified-history';section.className='profile-panel card';const before=document.getElementById('profile-progress');host.insertBefore(section,before||document.getElementById('profile-backup'));
 const state={discipline:'all',period:'30'};
 const labels={all:tr('All','Todos'),total:tr('Total Body','Cuerpo completo'),cycle:'CYCLE',run:'RUN',swim:'SWIM',triathlon:'TRIATHLON'};
 section.innerHTML='<h3>'+tr('Activity History','Historial de actividades')+'</h3><div class="uh-summary"></div><div class="uh-filters"></div><div class="uh-list"></div><p class="uh-note">'+tr('Correct or exclude individual entries. Delete only records you no longer need.','Corrige o excluye registros individuales. Elimina solo los registros que ya no necesites.')+'</p>';
 const summary=section.querySelector('.uh-summary'),filters=section.querySelector('.uh-filters'),list=section.querySelector('.uh-list');
 const tabs=document.createElement('div');tabs.className='uh-tabs';for(const key of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.textContent=labels[key];b.dataset.key=key;b.onclick=()=>{state.discipline=key;render();};tabs.append(b);}filters.append(tabs);
 const period=document.createElement('select');period.setAttribute('aria-label',tr('Date range','Rango de fechas'));for(const [value,label] of [['7',tr('Last 7 days','Últimos 7 días')],['30',tr('Last 30 days','Últimos 30 días')],['90',tr('Last 90 days','Últimos 90 días')],['all',tr('All time','Todo el historial')]]){const o=document.createElement('option');o.value=value;o.textContent=label;period.append(o);}period.value=state.period;period.onchange=()=>{state.period=period.value;render();};filters.append(period);
 function render(){const records=getRecords();const now=Date.now();const visible=records.filter(r=>(state.discipline==='all'||r.discipline===state.discipline)&&(state.period==='all'||(r.date.getTime()<=now&&r.date.getTime()>=now-Number(state.period)*86400000)));summary.textContent=visible.length+' '+tr('activities','actividades')+' · '+new Set(visible.map(r=>r.discipline)).size+' '+tr('disciplines','disciplinas');for(const b of tabs.children){b.classList.toggle('uh-selected',b.dataset.key===state.discipline);b.setAttribute('aria-pressed',String(b.dataset.key===state.discipline));}list.replaceChildren();if(!visible.length){const p=document.createElement('p');p.textContent=tr('No recorded activities for this filter.','No hay actividades registradas para este filtro.');list.append(p);return;}for(const r of visible){const details=document.createElement('details');details.className='uh-entry';if(r.emptySession)details.open=true;const heading=document.createElement('summary');const tag=document.createElement('span');tag.className='uh-tag';tag.textContent=labels[r.discipline];const title=document.createElement('strong');title.textContent=r.name;const date=document.createElement('small');date.textContent=r.date.toLocaleDateString(document.documentElement.lang==='es'?'es-MX':'en-US');const desc=document.createElement('div');desc.className='uh-desc';desc.textContent=(r.manage?.length&&r.manage.every(x=>excluded(x))?tr('Excluded · ','Excluido · '):'')+r.summary+(r.weightMoved?' · '+r.weightMoved.label+': '+r.weightMoved.value:'');heading.append(tag,title,date,desc);details.append(heading);const body=document.createElement('div');body.className='uh-detail';if(r.details.length){const ul=document.createElement('ul');for(const line of r.details){const li=document.createElement('li');li.textContent=line;ul.append(li);}body.append(ul);}if(r.weightMoved){
 const weight=document.createElement('div');weight.className='uh-weight-moved';
 const strong=document.createElement('strong');strong.textContent=r.weightMoved.label+': '+r.weightMoved.value;
 const small=document.createElement('small');small.textContent=' · '+r.weightMoved.count+' '+tr('weighted sets','series con peso');
 weight.append(strong,small);body.append(weight);
 }
 const refresh=()=>{render();const progress=document.getElementById("profile-progress");if(progress&&typeof window.TrainLabRefreshHistoryProgress==="function")window.TrainLabRefreshHistoryProgress(progress);};
 if(r.manage?.length)for(const item of r.manage)body.append(manageRow(item,refresh));
 if(r.emptySession)body.append(emptySessionControl(r.emptySession,refresh));
 const hrResult=hrForRecord(r);if(hrResult.lines.length||hrResult.note){const heading=document.createElement('h4');heading.textContent=tr('Heart rate (journal)','Frecuencia cardíaca (registro)');body.append(heading);const hrList=document.createElement('ul');for(const line of hrResult.lines){const li=document.createElement('li');li.textContent=line;hrList.append(li);}body.append(hrList);const caveat=document.createElement('small');caveat.textContent=hrResult.note;body.append(caveat);}if(r.note){const p=document.createElement('p');p.textContent=tr('Notes: ','Notas: ')+r.note;body.append(p);}if(!body.childNodes.length)body.textContent=tr('No additional details saved.','No se guardaron más detalles.');if(r.discipline==='total'&&r.sourceSessionKey&&r.manage?.some(x=>!excluded(x))){const use=document.createElement('button');use.type='button';use.className='primary full';use.textContent=tr('Use as new plan','Usar como plan nuevo');use.onclick=()=>{if(typeof window.TrainLabOpenTotalBodyHistoryPicker==='function')window.TrainLabOpenTotalBodyHistoryPicker(r.sourceSessionKey);};body.append(use);}details.append(body);list.append(details);}}
 render();}
 const old=window.renderAthleteProfile;if(typeof old!=='function')return;window.renderAthleteProfile=function(){old.apply(this,arguments);mount();};
})();
