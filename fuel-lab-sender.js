/* A1SC TRAIN LAB -> FUEL LAB: v1 summary builder. No network, URLs, or writes. */
(function(root){
 'use strict';
 const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const KEYS={strength:'fitclimb-v1',cycle:'a1sc-cycle-weekly-plan-v03',run:'a1sc-run-weekly-v1',swim:'a1sc-swim-weekly-plan-v01',triathlon:'a1sc-triathlon-weekly-plan-v01'};
 function read(key){try{return JSON.parse(root.localStorage.getItem(key)||'null')}catch(_){return null}}
 function monday(reference){const d=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
 function isoLocal(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
 function validItems(v){return Array.isArray(v)?v.filter(x=>x!==null&&x!==undefined):[]}
 function build(now=new Date()){
  const strength=read(KEYS.strength)?.weeklyProgram||{};
  const cycle=read(KEYS.cycle)||{};
  const run=read(KEYS.run)||{};
  const swim=read(KEYS.swim)||{};
  const tri=read(KEYS.triathlon)||{};
  const start=monday(now);
  const days=DAYS.map((name,i)=>{
   const date=new Date(start);date.setDate(start.getDate()+i);
   const groups=[
    ['strength',validItems(strength[name])],
    ['cycle',validItems(cycle[i])],
    ['run',validItems(run[name])],
    ['swim',validItems(swim[i])],
    ['triathlon',validItems(tri[i]?.items)]
   ];
   // One entry per selected workout. We deliberately do not infer duration or
   // intensity from exercise count, catalog defaults, or discipline name.
   const sessions=groups.filter(([,items])=>items.length>0).map(([discipline])=>({discipline,plannedMinutes:null,intensity:'unknown'}));
   return {date:isoLocal(date),sessions};
  });
  return {schema:'a1sc.training-summary',version:1,source:'trainlab',weekStart:isoLocal(start),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',days};
 }
 root.TrainLabFuelLab={buildSummary:build};
})(window);
