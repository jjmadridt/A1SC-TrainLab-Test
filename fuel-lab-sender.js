/* A1SC TRAIN LAB -> FUEL LAB: direct schedule and opt-in progress transfer. Existing estimates are optional. */
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
 const DISCIPLINES=['strength','cycle','run','swim','triathlon'];
 // Compact, schedule-only link: no names, profile, exercise logs or medical data.
 // URL fragments are not sent in HTTP requests, but are not encrypted or authenticated.
 // A bounded snapshot, not a raw log export. Only two comparable recorded observations per exercise.
 const PROGRESS_PREF='a1sc.trainlab.progress-share.v1';
 function historyConsent(){try{return root.localStorage.getItem(PROGRESS_PREF)}catch(_){return null}}
 function setHistoryConsent(value){root.localStorage.setItem(PROGRESS_PREF,value?'yes':'no')}
 function buildProgress(now=new Date()){
  const groups=new Map(),cutoff=+now-30*86400000;
  const list=v=>Array.isArray(v)?v:[];
  const source=(key,fallback)=>{const raw=root.localStorage.getItem(key);if(raw===null)return fallback;const parsed=JSON.parse(raw);if(Array.isArray(fallback)?!Array.isArray(parsed):!parsed||typeof parsed!=='object'||!Array.isArray(parsed.logs))throw Error('history unreadable');return parsed};
  const num=(v,max,zero=false)=>{if(v===''||v==null||!['number','string'].includes(typeof v)||!Number.isFinite(Number(v))||Number(v)>max||Number(v)<0)return null;const n=Math.round(Number(v)*100)/100;return n>0||zero?n:null;};
  const label=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=80?v.trim():null;
  const date=v=>v==null||v===''?null:Number.isFinite(+new Date(v))?new Date(v):null;
  function add(d,name,kind,when,session,a,b,context='',raw){
   if(raw?.excludedFromProgress||!label(name)||!when||+when<cutoff||+when>+now||a===null&&b===null)return;
   if(a===null&&kind==='lift'||b===null&&kind==='lift')return;
   if(!['lift','reps','timed','distance','duration'].includes(kind))return;
   const ctx=String(context||'').slice(0,80),k=JSON.stringify([d,name,kind,ctx]);
   if(!groups.has(k))groups.set(k,{d,name,kind,ctx,obs:new Map()});const g=groups.get(k),key=isoLocal(when)+'|'+String(session??'');
   const v={date:isoLocal(when),at:+when,a,b};const old=g.obs.get(key);
   // Strength: compare the heaviest recorded set, breaking ties by repetitions; timed activities: latest record.
   if(!old||(kind==='lift'?(a>old.a||a===old.a&&b>old.b):v.at>=old.at))g.obs.set(key,v);
  }
  const dist=(v,u)=>{const n=num(v,10000000);return n===null||!['km','mi','m','yd'].includes(u)?null:num(n*({km:1000,mi:1609.344,m:1,yd:0.9144}[u]),10000000)};
  const seconds=(v)=>num(v,86400);
  const tb=source('fitclimb-v1',{logs:[]});
  for(const x of tb.logs){if(!x||x.excludedFromProgress)continue;const d=date(x.timestamp??x.date),n=label(x.name),s=x.session??'',u=String(x.unit||'').toLowerCase();if(!n)continue;
   if(u==='minutes'){add(0,n,'distance',d,s,dist(x.weight,'km'),seconds(Number(x.count)*60),'',x);}
   else if(['reps','per side','per leg'].includes(u))add(0,n,'lift',d,s,num(x.weight,3000,true),num(x.count,10000),String(x.equipment||'')+' · '+u,x);
   else if(['seconds','sec','s'].includes(u))add(0,n,'timed',d,s,seconds(x.count),null,u,x);
  }
  for(const x of source('a1sc-cycle-activity-log-v05',[])){if(!x)continue;add(1,label(x.workoutName)||label(x.workoutId),'duration',date(x.date),x.id,seconds(x.actualSeconds??Number(x.actualMinutes)*60),null,[x.mode,x.completion].filter(Boolean).join(' · '),x)}
  for(const x of source('a1sc-run-activities-v1',[])){if(!x)continue;add(2,label(x.exercise),'distance',date(x.timestamp),x.timestamp,dist(x.distance,x.unit),seconds(x.durationSeconds),x.kind,x)}
  for(const x of source('a1sc-swim-activity-history-v01',[])){if(!x)continue;const w=list(x.workoutDetails),name=w.length?w.map(z=>z.en||z.id).join(' + '):list(x.workouts).map(z=>z.en||z.name||z.id).join(' + ');add(3,label(name)||'Swim session','distance',date(x.savedAt??x.startedAt),x.id,dist(x.distance,x.unit),seconds(x.durationSeconds),[x.environment,x.pool&&x.unit?x.pool+' '+x.unit:''].filter(Boolean).join(' · '),x)}
  const tri=source('a1sc-triathlon-activity-log-v01',[]),mirror=source('a1sc-triathlon-strength-sets-v01',[]),linked=new Set();
  function triSet(x,when,session){if(!x)return;const n=label(x.exercise);if(n==='Side plank')add(4,n,'timed',when,session,seconds(x.reps),null,'Strength',x);else add(4,n,'lift',when,session,num(x.weightLb,3000,true),num(x.reps,10000),'Strength',x)}
  for(const r of tri){if(!r)continue;for(const x of list(r.sets))if(x?.id)linked.add(x.id);if(r.excludedFromProgress)continue;
   if(r.discipline==='Strength'){for(const x of list(r.sets))triSet(x,date(x?.timestamp??r.completedAt),r.id??r.completedAt);}
   else {const x=r.details||{};add(4,label(r.exercise),'distance',date(r.completedAt),r.id,dist(x.distance,x.distanceUnit),seconds(Number(x.durationMin)*60),[r.discipline,x.environment,x.rideType].filter(Boolean).join(' · '),r)}
  }
  for(const x of mirror){if(x?.id&&!linked.has(x.id))triSet(x,date(x.timestamp),x.sessionId??x.timestamp)}
  const rows=[...groups.values()].map(g=>{const obs=[...g.obs.values()].sort((a,b)=>b.at-a.at).slice(0,2);return {at:obs[0].at,row:[g.d,g.name,g.kind,g.ctx,...obs.map(x=>[x.date,x.a,x.b])]}}).sort((a,b)=>b.at-a.at);
  // Guarantee room for each represented discipline before filling with the newest comparisons.
  const chosen=[];for(let d=0;d<5;d++){const first=rows.find(x=>x.row[0]===d);if(first)chosen.push(first)}for(const r of rows)if(chosen.length<18&&!chosen.includes(r))chosen.push(r);
  return {v:1,asOf:isoLocal(now),rows:chosen.map(x=>x.row),total:rows.length};
 }

 function buildTransfer(now=new Date(),includeHistory=false){
  const rows=rowsForWeek(now),saved=loadFor(rows);
  const compact={v:1,w:rows[0].date,z:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',d:rows.map(day=>day.sessions.map(session=>{
   const estimate=savedEstimate(saved,day,session);
   return [DISCIPLINES.indexOf(session.discipline),session.count,estimate.plannedMinutes,INTENSITIES.indexOf(estimate.intensity)];
  }))};
  const u=new URL(FUEL_URL);if(includeHistory){try{const progress=buildProgress(now);compact.h=progress;while(progress.rows.length&&('tlplan='+encodeURIComponent(JSON.stringify(compact))).length>7600)progress.rows.pop();}catch(_){compact.he=1;}}u.hash='tlplan='+encodeURIComponent(JSON.stringify(compact));
  if(u.href.length>8000)throw Error('oversized schedule');return u.href;
 }
 function sendToFuelLab(){
  try{let consent=historyConsent();if(consent===null){const es=root.document.documentElement.lang==='es';const ok=root.confirm(es?'¿Compartir automáticamente resúmenes recientes de entrenamiento con FUEL LAB? El enlace temporal contiene medidas de rendimiento, no notas ni datos corporales. No está cifrado. Puedes desactivar esto en Perfil → Historial. Cancelar envía solo el programa.':'Automatically share recent training summaries with FUEL LAB? The temporary link contains performance measurements, not notes or body data. It is not encrypted. Change this in Profile → History. Cancel sends schedule only.');setHistoryConsent(ok);consent=ok?'yes':'no';}const url=new URL(buildTransfer(new Date(),consent==='yes'));url.searchParams.set('launch',Date.now().toString(36));root.location.assign(url.href);}catch(_){root.alert(root.document.documentElement.lang==='es'?'No se pudo abrir FUEL LAB. Tu plan no ha cambiado.':'Could not open FUEL LAB. Your plan has not changed.');}
 }
 root.TrainLabFuelLab={buildSummary:build,buildTransfer,sendToFuelLab,buildProgress,historyConsent,setHistoryConsent};
})(window);
