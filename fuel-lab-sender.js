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
 root.TrainLabFuelLab={buildSummary:build,sendToFuelLab};

})(window);
