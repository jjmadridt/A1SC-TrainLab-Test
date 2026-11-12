/* A1SC Unified History v1 — read-only adapters. No activity storage writes. */
(function(){
'use strict';
const SOURCES={total:'fitclimb-v1',cycle:'a1sc-cycle-activity-log-v05',run:'a1sc-run-activities-v1',swim:'a1sc-swim-activity-history-v01'};
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
function getRecords(){
 const records=[];
 const tb=read(SOURCES.total,{}),logs=array(tb?.logs),done=array(tb?.completed),groups=new Map();
 for(const x of logs){if(!x||typeof x!=='object')continue;const key=str(x.day)+'|'+str(x.session);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);}
 const completedKeys=new Set();
 for(const c of done){if(!c||typeof c!=='object')continue;const key=str(c.day)+'|'+str(c.session);completedKeys.add(key);const sets=groups.get(key)||[];const d=dateOf(c.finishedAt,sets[sets.length-1]?.timestamp||sets[sets.length-1]?.date);if(!d)continue;records.push({discipline:'total',date:d,name:tr('Total Body — '+str(c.day),'Cuerpo completo — '+str(c.day)),summary:tr('Completed session','Sesión finalizada')+' · '+sets.length+' '+tr('entries','registros'),details:sets.map(s=>totalDetail(s,tb)),note:''});}
 for(const [key,sets] of groups){if(completedKeys.has(key)||!sets.length)continue;const d=dateOf(sets[sets.length-1].timestamp,sets[sets.length-1].date);if(!d)continue;records.push({discipline:'total',date:d,name:tr('Total Body — '+str(sets[0].day),'Cuerpo completo — '+str(sets[0].day)),summary:tr('Logged workout','Entrenamiento registrado')+' · '+sets.length+' '+tr('entries','registros'),details:sets.map(s=>totalDetail(s,tb)),note:''});}
 for(const r of array(read(SOURCES.cycle,[]))){if(!r||typeof r!=='object')continue;const d=dateOf(r.date);if(!d)continue;records.push({discipline:'cycle',date:d,name:str(r.workoutName||r.workoutId||'Cycle'),summary:[formatDuration(r.actualSeconds??(Number(r.actualMinutes)*60)),r.rpe?'RPE '+r.rpe:'',r.completion==='complete'?tr('Complete','Completo'):r.completion==='partial'?tr('Partial','Parcial'):''].filter(Boolean).join(' · '),details:[r.mode?tr('Mode: ','Modo: ')+str(r.mode):'',r.plannedMinutes!=null?tr('Planned: ','Planeado: ')+str(r.plannedMinutes)+' min':''].filter(Boolean),note:str(r.notes)});}
 for(const r of array(read(SOURCES.run,[]))){if(!r||typeof r!=='object')continue;const d=dateOf(r.timestamp);if(!d)continue;const fields=r.data&&typeof r.data==='object'?Object.entries(r.data).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>k+': '+str(v)):[];records.push({discipline:'run',date:d,name:str(r.exercise||'Run'),summary:[formatDuration(r.durationSeconds),r.distance?str(r.distance)+' '+str(r.unit):'',str(r.pace)].filter(Boolean).join(' · '),details:fields,note:'',hrStart:Number(r.durationSeconds)>0?d.getTime()-Number(r.durationSeconds)*1000:undefined,hrEnd:Number(r.durationSeconds)>0?d.getTime():undefined});}
 for(const r of array(read(SOURCES.swim,[]))){if(!r||typeof r!=='object')continue;const d=dateOf(r.savedAt,r.startedAt);if(!d)continue;const ws=array(r.workoutDetails),fallback=array(r.workouts);const spanish=document.getElementById('language-toggle')?.value==='es';const names=ws.length?ws.map(w=>str(spanish?w.es||w.en:w.en||w.es||w.id)):fallback.map(w=>str(w.en||w.name||w.id||''));records.push({discipline:'swim',date:d,name:names.filter(Boolean).join(' + ')||tr('Swim session','Sesión de natación'),summary:[r.environment==='pool'?tr('Pool','Alberca'):r.environment==='open'?tr('Open Water','Aguas abiertas'):str(r.environment),r.distance!=null?str(r.distance)+' '+str(r.unit):'',formatDuration(r.durationSeconds)].filter(Boolean).join(' · '),details:[...ws.map(w=>str(w.category)).filter(Boolean),r.completedSets!=null?tr('Completed sets: ','Series completadas: ')+str(r.completedSets):''],note:str(r.notes),hrStart:dateOf(r.startedAt)?.getTime(),hrEnd:dateOf(r.finishedAt,r.savedAt)?.getTime()});}
 return records.sort((a,b)=>b.date-a.date);
}
function mount(){const host=document.getElementById('athlete-profile-content');if(!host)return;const existing=document.getElementById('unified-history');if(existing)existing.remove();const section=document.createElement('section');section.id='unified-history';section.className='profile-panel card';const before=document.getElementById('profile-progress');host.insertBefore(section,before||document.getElementById('profile-backup'));
 const records=getRecords();const state={discipline:'all',period:'30'};
 const labels={all:tr('All','Todos'),total:tr('Total Body','Cuerpo completo'),cycle:'CYCLE',run:'RUN',swim:'SWIM'};
 section.innerHTML='<h3>'+tr('Activity History','Historial de actividades')+'</h3><div class="uh-summary"></div><div class="uh-filters"></div><div class="uh-list"></div><p class="uh-note">'+tr('Read-only view. Your original activity records remain unchanged on this device.','Vista de solo lectura. Los registros originales permanecen sin cambios en este dispositivo.')+'</p>';
 const summary=section.querySelector('.uh-summary'),filters=section.querySelector('.uh-filters'),list=section.querySelector('.uh-list');
 const tabs=document.createElement('div');tabs.className='uh-tabs';for(const key of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.textContent=labels[key];b.dataset.key=key;b.onclick=()=>{state.discipline=key;render();};tabs.append(b);}filters.append(tabs);
 const period=document.createElement('select');period.setAttribute('aria-label',tr('Date range','Rango de fechas'));for(const [value,label] of [['7',tr('Last 7 days','Últimos 7 días')],['30',tr('Last 30 days','Últimos 30 días')],['90',tr('Last 90 days','Últimos 90 días')],['all',tr('All time','Todo el historial')]]){const o=document.createElement('option');o.value=value;o.textContent=label;period.append(o);}period.value=state.period;period.onchange=()=>{state.period=period.value;render();};filters.append(period);
 function render(){const now=Date.now();const visible=records.filter(r=>(state.discipline==='all'||r.discipline===state.discipline)&&(state.period==='all'||(r.date.getTime()<=now&&r.date.getTime()>=now-Number(state.period)*86400000)));summary.textContent=visible.length+' '+tr('activities','actividades')+' · '+new Set(visible.map(r=>r.discipline)).size+' '+tr('disciplines','disciplinas');for(const b of tabs.children){b.classList.toggle('uh-selected',b.dataset.key===state.discipline);b.setAttribute('aria-pressed',String(b.dataset.key===state.discipline));}list.replaceChildren();if(!visible.length){const p=document.createElement('p');p.textContent=tr('No recorded activities for this filter.','No hay actividades registradas para este filtro.');list.append(p);return;}for(const r of visible){const details=document.createElement('details');details.className='uh-entry';const heading=document.createElement('summary');const tag=document.createElement('span');tag.className='uh-tag';tag.textContent=labels[r.discipline];const title=document.createElement('strong');title.textContent=r.name;const date=document.createElement('small');date.textContent=r.date.toLocaleDateString(document.documentElement.lang==='es'?'es-MX':'en-US');const desc=document.createElement('div');desc.className='uh-desc';desc.textContent=r.summary;heading.append(tag,title,date,desc);details.append(heading);const body=document.createElement('div');body.className='uh-detail';if(r.details.length){const ul=document.createElement('ul');for(const line of r.details){const li=document.createElement('li');li.textContent=line;ul.append(li);}body.append(ul);}const hrResult=hrForRecord(r);if(hrResult.lines.length||hrResult.note){const heading=document.createElement('h4');heading.textContent=tr('Heart rate (journal)','Frecuencia cardíaca (registro)');body.append(heading);const hrList=document.createElement('ul');for(const line of hrResult.lines){const li=document.createElement('li');li.textContent=line;hrList.append(li);}body.append(hrList);const caveat=document.createElement('small');caveat.textContent=hrResult.note;body.append(caveat);}if(r.note){const p=document.createElement('p');p.textContent=tr('Notes: ','Notas: ')+r.note;body.append(p);}if(!body.childNodes.length)body.textContent=tr('No additional details saved.','No se guardaron más detalles.');details.append(body);list.append(details);}}
 render();}
 const old=window.renderAthleteProfile;if(typeof old!=='function')return;window.renderAthleteProfile=function(){old.apply(this,arguments);mount();};
})();
