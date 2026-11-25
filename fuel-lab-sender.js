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

 // Version 2: classify actual selected exercise IDs. Source namespace disambiguates duplicate names.
 const CLASS_CODES=["strength", "cycle", "run", "swim", "triathlon", "cardio", "stability", "mobility", "technique", "unknown"];
 const EXERCISE_CLASSES={"strength": {"stationary bike": "cycle", "outdoor ride": "cycle", "elliptical warm-up": "cardio", "romanian deadlift": "strength", "leg press": "strength", "standing calf raise": "strength", "chest press": "strength", "seated cable row": "strength", "lat pulldown": "strength", "dumbbell shoulder press": "strength", "goblet squat": "strength", "glute bridge": "strength", "step-up": "strength", "farmer carry": "strength", "dead bug": "stability", "pallof press": "stability", "side plank": "stability"}, "run": {"easy run": "run", "long run": "run", "recovery run": "run", "treadmill run": "run", "tempo run": "run", "short intervals": "run", "long intervals": "run", "hill repeats": "run", "treadmill intervals": "run", "strides": "technique", "high knees": "technique", "butt kicks": "technique", "a-skips": "technique", "cadence drills": "technique", "single-leg balance": "stability", "step-ups": "strength", "calf raises": "strength", "glute bridges": "strength", "dynamic mobility": "mobility"}, "triathlon": {"continuous swim": "swim", "technique drills": "swim", "interval sets": "swim", "threshold swim": "swim", "open water sighting": "swim", "endurance ride": "cycle", "tempo ride": "cycle", "threshold intervals": "cycle", "vo₂max intervals": "cycle", "cadence drills": "cycle", "goblet squat": "strength", "romanian deadlift": "strength", "split squat": "strength", "standing calf raise": "strength", "seated cable row": "strength", "side plank": "stability", "pallof press": "stability", "dead bug": "stability", "easy aerobic run": "run", "long run": "run", "tempo run": "run", "interval repeats": "run", "strides": "technique"}, "cycle": {"recovery-ride": "cycle", "aerobic-base": "cycle", "long-endurance": "cycle", "progressive-endurance": "cycle", "tempo-endurance": "cycle", "tempo-intervals": "cycle", "threshold-intervals": "cycle", "vo2-max-intervals": "cycle", "sprint-repeats": "cycle", "over-under-intervals": "cycle", "cadence-intervals": "cycle", "sustained-climbing": "cycle", "climbing-intervals": "cycle", "seated-climbing": "cycle", "standing-climbing": "cycle", "cadence-control": "cycle", "bike-handling": "technique"}, "swim": {"continuous": "swim", "aerobic": "swim", "progression": "swim", "recovery": "swim", "sprints": "swim", "pace": "swim", "threshold": "swim", "speedendurance": "swim", "freestyle": "swim", "breathing": "swim", "kickboard": "swim", "pullbuoy": "swim", "coordination": "swim"}};
 function exerciseClass(source,item){const id=typeof item==='string'?item:item?.id;return typeof id==='string'&&Object.prototype.hasOwnProperty.call(EXERCISE_CLASSES[source]||{},id.trim().toLowerCase())?EXERCISE_CLASSES[source][id.trim().toLowerCase()]:'unknown';}
 // Compact change detection only; not authentication or encryption. No exercise names transferred.
 function planFingerprint(value){let h=2166136261;for(const c of JSON.stringify(value)){h=Math.imul(h^c.charCodeAt(0),16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function classifiedRows(now){const rows=rowsForWeek(now),saved=loadFor(rows);return rows.map(day=>{const groups=new Map();for(const parent of day.sessions){const items=JSON.parse(parent.signature),classified=items.map(item=>[exerciseClass(parent.discipline,item),item]);const homogeneous=new Set(classified.map(x=>x[0])).size===1;const estimate=homogeneous?savedEstimate(saved,day,parent):{plannedMinutes:null,intensity:'unknown'};for(const [cls,item] of classified){if(!groups.has(cls))groups.set(cls,{discipline:cls,items:[],parents:new Set(),estimates:[]});const g=groups.get(cls);g.items.push([parent.discipline,item]);if(!g.parents.has(parent.discipline)){g.parents.add(parent.discipline);g.estimates.push(estimate);}}}return {date:day.date,sessions:[...groups.values()].map(g=>{const minutes=g.estimates.every(e=>e.plannedMinutes!==null)?g.estimates.reduce((a,e)=>a+e.plannedMinutes,0):null;const effort=new Set(g.estimates.map(e=>e.intensity));return {discipline:g.discipline,activityCount:g.items.length,plannedMinutes:minutes!==null&&minutes<=1440?minutes:null,intensity:effort.size===1?[...effort][0]:'unknown',fingerprint:planFingerprint(g.items),overlap:g.parents.has('triathlon')&&g.parents.size>1};}).sort((a,b)=>CLASS_CODES.indexOf(a.discipline)-CLASS_CODES.indexOf(b.discipline))};});}
 function build(now=new Date()){
  const days=classifiedRows(now);
  return {schema:'a1sc.training-summary',version:2,source:'trainlab',weekStart:days[0].date,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',days};
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
  function groupKey(d,name,kind,ctx){return JSON.stringify([d,name,kind,String(ctx||'').slice(0,80)])}
  function addSimple(d,name,kind,when,session,a,b,context='',raw){
   if(raw?.excludedFromProgress||!label(name)||!when||+when<cutoff||+when>+now||a===null&&b===null)return;
   if(a===null&&kind==='lift'||b===null&&kind==='lift')return;
   if(!['lift','reps','timed','distance','duration'].includes(kind))return;
   const ctx=String(context||'').slice(0,80),k=groupKey(d,name,kind,ctx);
   if(!groups.has(k))groups.set(k,{d,name,kind,ctx,obs:new Map()});const g=groups.get(k),key=isoLocal(when)+'|'+String(session??'');
   const v={date:isoLocal(when),at:+when,a,b};const old=g.obs.get(key);
   if(old&&['reps','timed'].includes(kind)){v.a=old.a+a;v.at=Math.max(old.at,v.at);g.obs.set(key,v);return;}
   if(!old||(kind==='lift'?(a>old.a||a===old.a&&b>old.b):v.at>=old.at))g.obs.set(key,v);
  }
  function addVolume(d,name,when,session,volume,reps,sets,maxWeight,context=''){
   if(!label(name)||!when||+when<cutoff||+when>+now)return;
   const vol=num(volume,10000000),totalReps=num(reps,10000),totalSets=num(sets,1000),max=num(maxWeight,3000,true);
   if(vol===null||totalReps===null||totalSets===null||max===null)return;
   const ctx=String(context||'').slice(0,80),k=groupKey(d,name,'volume',ctx);
   if(!groups.has(k))groups.set(k,{d,name,kind:'volume',ctx,obs:new Map()});
   const g=groups.get(k),key=isoLocal(when)+'|'+String(session??'');
   const v={date:isoLocal(when),at:+when,volume:vol,reps:totalReps,sets:totalSets,max};
   const old=g.obs.get(key);if(!old||v.at>=old.at)g.obs.set(key,v);
  }
  const dist=(v,u)=>{const n=num(v,10000000);return n===null||!['km','mi','m','yd'].includes(u)?null:num(n*({km:1000,mi:1609.344,m:1,yd:0.9144}[u]),10000000)};
  const seconds=(v)=>num(v,86400);
  function strengthAggregate(keyObj,when,weight,reps){
   if(!when||weight===null||reps===null||weight<=0||reps<=0)return;
   const key=JSON.stringify(keyObj);
   let row=groups.get(key);
   if(!row){row={pending:true,...keyObj,at:+when,date:isoLocal(when),volume:0,reps:0,sets:0,max:0};groups.set(key,row)}
   row.at=Math.max(row.at,+when);row.date=isoLocal(when);row.volume=Math.round((row.volume+weight*reps)*100)/100;row.reps=Math.round((row.reps+reps)*100)/100;row.sets+=1;row.max=Math.max(row.max,weight);
  }
  const pendingGroups=new Map();
  function volumeKey(d,name,ctx,when,session){return JSON.stringify({d,name,ctx:String(ctx||'').slice(0,80),session:String(session??''),date:isoLocal(when)})}
  function addStrengthSet(d,name,when,session,weight,reps,context=''){
   const n=label(name),w=num(weight,3000,true),r=num(reps,10000);if(!n||!when||+when<cutoff||+when>+now||w===null||r===null||w<=0||r<=0)return;
   const key=volumeKey(d,n,context,when,session);let row=pendingGroups.get(key);
   if(!row){row={d,name:n,ctx:String(context||'').slice(0,80),when,session,volume:0,reps:0,sets:0,max:0};pendingGroups.set(key,row)}
   row.volume=Math.round((row.volume+w*r)*100)/100;row.reps=Math.round((row.reps+r)*100)/100;row.sets+=1;row.max=Math.max(row.max,w);
  }
  const tb=source('fitclimb-v1',{logs:[]});
  for(const x of tb.logs){if(!x||x.excludedFromProgress)continue;const d=date(x.timestamp??x.date),n=label(x.name),s=String(x.day||'')+'|'+String(x.session??''),u=String(x.unit||'').trim().toLowerCase();if(!n||!d)continue;
   if(u==='minutes'){addSimple(0,n,'distance',d,s,dist(x.weight,'km'),seconds(Number(x.count)*60),'',x);}
   else if(['reps','per side','per leg'].includes(u)){
    const w=num(x.weight,3000,true),count=num(x.count,10000),r=count===null?null:count*(u==='per side'||u==='per leg'?2:1),ctx=String(x.equipment||'').trim()+' · '+u;
    if(w!==null&&w>0&&r!==null&&r>0)addStrengthSet(0,n,d,s,w,r,ctx); else if(w===0&&r!==null)addSimple(0,n,'reps',d,s,r,null,ctx,x);
   }
   else if(['seconds','sec','s'].includes(u))addSimple(0,n,'timed',d,s,seconds(x.count),null,u,x);
  }
  for(const row of pendingGroups.values())addVolume(row.d,row.name,row.when,row.session,row.volume,row.reps,row.sets,row.max,row.ctx);
  for(const x of source('a1sc-cycle-activity-log-v05',[])){if(!x)continue;addSimple(1,label(x.workoutName)||label(x.workoutId),'duration',date(x.date),x.id,seconds(x.actualSeconds??Number(x.actualMinutes)*60),null,[x.mode,x.completion].filter(Boolean).join(' · '),x)}
  for(const x of source('a1sc-run-activities-v1',[])){if(!x)continue;addSimple(2,label(x.exercise),'distance',date(x.timestamp),x.timestamp,dist(x.distance,x.unit),seconds(x.durationSeconds),x.kind,x)}
  for(const x of source('a1sc-swim-activity-history-v01',[])){if(!x)continue;const w=list(x.workoutDetails),name=w.length?w.map(z=>z.en||z.id).join(' + '):list(x.workouts).map(z=>z.en||z.name||z.id).join(' + ');addSimple(3,label(name)||'Swim session','distance',date(x.savedAt??x.startedAt),x.id,dist(x.distance,x.unit),seconds(x.durationSeconds),[x.environment,x.pool&&x.unit?x.pool+' '+x.unit:''].filter(Boolean).join(' · '),x)}
  const tri=source('a1sc-triathlon-activity-log-v01',[]),mirror=source('a1sc-triathlon-strength-sets-v01',[]),linked=new Set(),triPending=new Map();
  function addTriStrengthSet(x,when,session){if(!x||x.excludedFromProgress)return;const n=label(x.exercise);if(!n||!when)return; if(n==='Side plank'){addSimple(4,n,'timed',when,session,seconds(x.reps),null,'Strength',x);return;} const reps=num(x.reps,10000); const weight=num(x.weightLb,3000,true); if(weight!==null&&weight>0&&reps!==null&&reps>0){const key=volumeKey(4,n,'Strength',when,session); let row=triPending.get(key); if(!row){row={d:4,name:n,ctx:'Strength',when,session,volume:0,reps:0,sets:0,max:0}; triPending.set(key,row);} row.volume=Math.round((row.volume+weight*reps)*100)/100; row.reps=Math.round((row.reps+reps)*100)/100; row.sets+=1; row.max=Math.max(row.max,weight);} else if(reps!==null&&reps>0) addSimple(4,n,'reps',when,session,reps,null,'Strength',x); }
  for(const r of tri){if(!r)continue;for(const x of list(r.sets))if(x?.id)linked.add(x.id);if(r.excludedFromProgress)continue;
   if(r.discipline==='Strength'){for(const x of list(r.sets))addTriStrengthSet(x,date(x?.timestamp??r.completedAt),r.id??r.completedAt);}
   else {const x=r.details||{};addSimple(4,label(r.exercise),'distance',date(r.completedAt),r.id,dist(x.distance,x.distanceUnit),seconds(Number(x.durationMin)*60),[r.discipline,x.environment,x.rideType].filter(Boolean).join(' · '),r)}
  }
  for(const x of mirror){if(x?.id&&!linked.has(x.id))addTriStrengthSet(x,date(x.timestamp),x.sessionId??x.timestamp)}
  for(const row of triPending.values())addVolume(row.d,row.name,row.when,row.session,row.volume,row.reps,row.sets,row.max,row.ctx);
  const rows=[...groups.values()].filter(g=>!g.pending&&[...g.obs.values()].some(x=>g.kind==='reps'?x.a<=10000:g.kind==='timed'?x.a<=86400:true)).map(g=>{const obs=[...g.obs.values()].filter(x=>g.kind==='volume'||g.kind==='reps'?g.kind==='volume'||x.a<=10000:g.kind==='timed'?x.a<=86400:true).sort((a,b)=>b.at-a.at).slice(0,2);return {at:obs[0].at,row:g.kind==='volume'?[g.d,g.name,g.kind,g.ctx,...obs.map(x=>[x.date,x.volume,x.reps,x.sets,x.max])]:[g.d,g.name,g.kind,g.ctx,...obs.map(x=>[x.date,x.a,x.b])]};}).sort((a,b)=>b.at-a.at);
  const chosen=[];for(let d=0;d<5;d++){const first=rows.find(x=>x.row[0]===d);if(first)chosen.push(first)}for(const r of rows)if(chosen.length<18&&!chosen.includes(r))chosen.push(r);
  return {v:1,asOf:isoLocal(now),rows:chosen.map(x=>x.row),total:rows.length};
 }


 function buildTransfer(now=new Date(),includeHistory=false){
  const summary=build(now);
  const compact={v:2,w:summary.weekStart,z:summary.timezone,d:summary.days.map(day=>day.sessions.map(x=>[CLASS_CODES.indexOf(x.discipline),x.activityCount,x.plannedMinutes,INTENSITIES.indexOf(x.intensity),x.fingerprint,x.overlap?1:0]))};
  const u=new URL(FUEL_URL);if(includeHistory){try{const progress=buildProgress(now);compact.h=progress;while(progress.rows.length&&('tlplan='+encodeURIComponent(JSON.stringify(compact))).length>7600)progress.rows.pop();}catch(_){compact.he=1;}}u.hash='tlplan='+encodeURIComponent(JSON.stringify(compact));
  if(u.href.length>8000)throw Error('oversized schedule');return u.href;
 }
 function sendToFuelLab(){
  try{let consent=historyConsent();if(consent===null){const es=root.document.documentElement.lang==='es';const ok=root.confirm(es?'¿Compartir automáticamente resúmenes recientes de entrenamiento con FUEL LAB? El enlace temporal contiene medidas de rendimiento, no notas ni datos corporales. No está cifrado. Puedes desactivar esto en Perfil → Historial. Cancelar envía solo el programa.':'Automatically share recent training summaries with FUEL LAB? The temporary link contains performance measurements, not notes or body data. It is not encrypted. Change this in Profile → History. Cancel sends schedule only.');setHistoryConsent(ok);consent=ok?'yes':'no';}const url=new URL(buildTransfer(new Date(),consent==='yes'));url.searchParams.set('launch',Date.now().toString(36));root.location.assign(url.href);}catch(_){root.alert(root.document.documentElement.lang==='es'?'No se pudo abrir FUEL LAB. Tu plan no ha cambiado.':'Could not open FUEL LAB. Your plan has not changed.');}
 }
 root.TrainLabFuelLab={classifyExercise:exerciseClass,buildSummary:build,buildTransfer,sendToFuelLab,buildProgress,historyConsent,setHistoryConsent};
})(window);
