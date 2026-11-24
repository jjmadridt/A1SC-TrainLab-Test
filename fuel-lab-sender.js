/* A1SC TRAIN LAB -> FUEL LAB: direct, schedule-only transfer. Existing estimates are optional. */
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
 function buildTransfer(now=new Date()){
  const rows=rowsForWeek(now),saved=loadFor(rows);
  const compact={v:1,w:rows[0].date,z:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',d:rows.map(day=>day.sessions.map(session=>{
   const estimate=savedEstimate(saved,day,session);
   return [DISCIPLINES.indexOf(session.discipline),session.count,estimate.plannedMinutes,INTENSITIES.indexOf(estimate.intensity)];
  }))};
  const u=new URL(FUEL_URL);u.hash='tlplan='+encodeURIComponent(JSON.stringify(compact));
  if(u.href.length>8000)throw Error('oversized schedule');return u.href;
 }
 function sendToFuelLab(){
  try{const url=new URL(buildTransfer());url.searchParams.set('launch',Date.now().toString(36));root.location.assign(url.href);}catch(_){root.alert(root.document.documentElement.lang==='es'?'No se pudo abrir FUEL LAB. Tu plan no ha cambiado.':'Could not open FUEL LAB. Your plan has not changed.');}
 }
 root.TrainLabFuelLab={buildSummary:build,buildTransfer,sendToFuelLab};
})(window);
