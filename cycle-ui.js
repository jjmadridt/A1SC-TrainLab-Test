/* A1SC Cycle v0.8 — persistent sessions, wall-clock guided timing, wake lock and accurate activity duration. */
(function(root){
 'use strict';
 const KEY='a1sc-cycle-weekly-plan-v03';
 const LOG_KEY='a1sc-cycle-activity-log-v05';
 const SESSION_KEY='a1sc-cycle-session-v06';
 const DAY_TYPE_KEY='a1sc-cycle-day-types-v01';
 let dayTypes={};
 try{const stored=JSON.parse(localStorage.getItem(DAY_TYPE_KEY)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))dayTypes=stored;}catch(e){}
 function dayType(){const value=dayTypes[selectedDay];return value==='rest'||value==='recovery'?value:'training';}
 function saveDayTypes(){try{localStorage.setItem(DAY_TYPE_KEY,JSON.stringify(dayTypes));return true;}catch(e){return false;}}
 let history=[];
 try {const stored=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(Array.isArray(stored))history=stored;}catch(e){}
 const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const DAYS_ES=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 let selectedDay=(new Date().getDay()+6)%7, selectedCategory='endurance', view='workout';
 let plan={};
 let session=null, ticker=null, wakeLock=null;
 // Step 16E: audio-only addition; no changes to timing, RPE, or stored sessions.
 
 const cycleBell=new Audio('./boxing-bell-double-ding.wav');cycleBell.preload='auto';
 function chime(){
  
  try{cycleBell.pause();cycleBell.currentTime=0;const playback=cycleBell.play();if(playback&&playback.catch)playback.catch(()=>{});}catch(e){}
 }
 function unlockBell(){
  // User gesture allows mobile browsers to enable later interval audio.
  
  try{cycleBell.muted=true;const playback=cycleBell.play();if(playback&&playback.then)playback.then(()=>{cycleBell.pause();cycleBell.currentTime=0;cycleBell.muted=false;}).catch(()=>{cycleBell.muted=false;});else cycleBell.muted=false;}catch(e){cycleBell.muted=false;}
 }

 async function requestWake(){
  if(!session?.running||document.visibilityState!=='visible'||!('wakeLock' in navigator))return;
  try{if(!wakeLock)wakeLock=await navigator.wakeLock.request('screen');}catch(e){}
 }
 function releaseWake(){if(wakeLock){const lock=wakeLock;wakeLock=null;lock.release().catch(()=>{});}}
 function persistSession(){try{if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY);}catch(e){}}
 function activeMs(){return session?Math.max(0,(session.activeMs||0)+(session.running?Date.now()-session.activeSince:0)):0;}
 function syncSession(){
  if(!session||!session.running||session.finished)return;
  if(session.mode==='guided'){
   let remainingMs=Math.max(0,session.segmentEndAt-Date.now());
   const crossedBoundary=remainingMs<=0;
   while(remainingMs<=0&&!session.finished){
    session.index++;
    if(session.index>=session.steps.length){session.activeMs=activeMs();session.activeSince=null;session.finished=true;session.running=false;session.remaining=0;releaseWake();break;}
    session.segmentEndAt+=session.steps[session.index].duration*1000;
    remainingMs=Math.max(0,session.segmentEndAt-Date.now());
   }
   if(crossedBoundary&&document.visibilityState==='visible')chime();
   if(!session.finished)session.remaining=Math.ceil(remainingMs/1000);
  }else{
   session.remaining=Math.max(0,Math.ceil((session.segmentEndAt-Date.now())/1000));
  }
  persistSession();
 }
 try{
  const stored=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
  if(stored&&stored.workout&&Array.isArray(stored.steps)&&stored.steps.length&&typeof stored.index==='number'&&stored.index>=0&&stored.index<stored.steps.length&&Number.isFinite(stored.activeMs)&&(!stored.running||Number.isFinite(stored.segmentEndAt))){
   session=stored;syncSession();
  }
 }catch(e){}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){syncSession();requestWake();render();}else{syncSession();releaseWake();}});
 window.addEventListener('pagehide',()=>{syncSession();persistSession();releaseWake();});

 try {const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))plan=value;}catch(e){}
 function illustrationGender(){
  try {const settings=JSON.parse(localStorage.getItem('fitclimb-v1')||'{}').settings;return settings?.bodyIllustration==='female'?'female':'male';}catch(e){return 'male';}
 }
 function workoutIcon(w){
  const family=w.category==='intervals'?'speed':w.category==='technique'?'climb':'spin';
  const im=make('img','cy-illustration');im.src='cycle-icons/'+family+'-'+illustrationGender()+'.webp';
  im.alt='';im.loading='lazy';im.decoding='async';return im;
 }
 function getWorkouts(){const mod=root.TrainLabCycle;return mod&&Array.isArray(mod.workouts)?mod.workouts:[];}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(plan));return true;}catch(e){return false;}}
 function selected(){return Array.isArray(plan[selectedDay])?plan[selectedDay]:[];}
 function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
 function t(en,es){return lang()==='es'?es:en;}
 function make(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;}
 function secs(v){return Math.max(1,Math.round(v*60));}
 function clock(n){n=Math.max(0,Math.ceil(n));return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
 function stepsFor(w,total){
  const raw=[];const segs=w.segments||[];
  // Pair repeated effort/recovery segments, instead of putting every effort before every recovery.
  for(let i=0;i<segs.length;i++){
   const a=segs[i],b=segs[i+1];
   if(a.repeats>1&&b&&b.repeats>1&&b.repeats===a.repeats-1){
    for(let j=0;j<a.repeats;j++){raw.push(a);if(j<b.repeats)raw.push(b);}
    i++;continue;
   }
   // Alternating under/over blocks (equal repeat counts).
   if(a.repeats>1&&b&&b.repeats===a.repeats&&/under/i.test(a.name)&&/over/i.test(b.name)){
    for(let j=0;j<a.repeats;j++){raw.push(a,b);}i++;continue;
   }
   for(let j=0;j<(a.repeats||1);j++)raw.push(a);
  }
  const original=raw.reduce((sum,x)=>sum+x.minutes,0)||1;
  const ratio=total/original;
  return raw.map((x,i)=>({name:x.name,duration:secs(x.minutes*ratio),rpe:x.rpe,powerZone:x.powerZone,number:i+1}));
 }
 function elapsed(){return Math.floor(activeMs()/1000);}
 function stopTick(){if(ticker){clearInterval(ticker);ticker=null;}}
 function timeLeft(){if(!session)return 0;return session.running?Math.max(0,Math.ceil((session.segmentEndAt-Date.now())/1000)):session.remaining;}
 function pause(){
  if(!session||!session.running)return;
  syncSession();if(session.finished){stopTick();render();return;}
  session.remaining=timeLeft();session.activeMs=activeMs();session.activeSince=null;session.running=false;
  stopTick();releaseWake();persistSession();render();
 }
 function next(){
  if(!session||session.finished)return;
  syncSession();if(session.finished){stopTick();render();return;}
  session.index++;
  chime();
  if(session.index>=session.steps.length){
   session.finished=true;session.remaining=0;
   if(session.running){session.activeMs=activeMs();session.activeSince=null;}
   session.running=false;stopTick();releaseWake();persistSession();render();return;
  }
  session.remaining=session.steps[session.index].duration;
  if(session.running)session.segmentEndAt=Date.now()+session.remaining*1000;
  persistSession();render();
 }
 function tick(){
  if(!session||!session.running)return;
  const oldIndex=session.index;syncSession();
  if(session.finished||oldIndex!==session.index){stopTick();if(session.running)ticker=setInterval(tick,250);render();return;}
  const display=document.getElementById('cy-countdown');if(display)display.textContent=clock(timeLeft());
 }
 function startSession(w,minutes,mode){
  stopTick();releaseWake();
  session={workout:w,steps:stepsFor(w,minutes),index:0,mode,remaining:0,running:false,finished:false,plannedMinutes:minutes,activeMs:0,activeSince:null,segmentEndAt:null};
  session.remaining=session.steps[0].duration;persistSession();render();
 }
 function resume(){
  if(!session||session.finished)return;
  unlockBell();
  session.running=true;session.activeSince=Date.now();session.segmentEndAt=Date.now()+session.remaining*1000;
  persistSession();requestWake();stopTick();ticker=setInterval(tick,250);render();
 }
 if(session?.running){requestWake();ticker=setInterval(tick,250);}
 function finishAndReview(){
  if(!session||session.finished)return;
  syncSession();
  if(session.running){session.activeMs=activeMs();session.activeSince=null;}
  session.running=false;session.finished=true;session.remaining=0;
  stopTick();releaseWake();persistSession();render();
 }
 function sessionView(mount){
  if(!session)return;
  const panel=make('section','cy-panel cy-session');const w=session.workout;
  const sessionHeading=make('div','cy-plan-heading');sessionHeading.appendChild(workoutIcon(w));sessionHeading.appendChild(make('h2','',w.name));panel.appendChild(sessionHeading);
  panel.appendChild(make('p','cy-note',session.mode==='guided'?t('Guided mode · segments advance automatically.','Modo guiado · los segmentos avanzan automáticamente.'):t('Manual mode · use Next to advance.','Modo manual · usa Siguiente para avanzar.')));
  if(session.finished){panel.appendChild(make('h3','',t('Session finished — review before saving','Sesión finalizada — revisa antes de guardar')));}
  else {
   const st=session.steps[session.index];panel.appendChild(make('h3','',st.name+' ('+(session.index+1)+'/'+session.steps.length+')'));
   panel.appendChild(make('div','cy-clock',clock(timeLeft()))).id='cy-countdown';
   panel.appendChild(make('p','cy-rpe',t('RPE — Perceived Effort (1–10): ','Esfuerzo percibido (1–10): ')+st.rpe.join('–')+(st.powerZone?' · '+st.powerZone:'')));
   const actions=make('div','cy-controls');
   function btn(label,fn){const b=make('button','',label);b.type='button';b.addEventListener('click',fn);actions.appendChild(b);}
   btn(session.running?t('Pause','Pausar'):t('Start / Resume','Iniciar / Continuar'),()=>{if(session.running)pause();else resume();});
   btn(t('Next segment','Siguiente segmento'),next);
   btn(t('Finish & Review','Finalizar y revisar'),finishAndReview);
   panel.appendChild(actions);
   panel.appendChild(make('p','cy-note',t('Your session is saved on this device. The clock continues when you switch screens. Screen Awake is requested when supported.','La sesión se guarda en este dispositivo. El tiempo continúa al cambiar de pantalla. Se solicita mantener la pantalla activa cuando sea compatible.')));
  }
  if(session.finished){
  const logging=make('div','cy-logging');
  logging.appendChild(make('h3','',t('Log activity','Registrar actividad')));
  const actualLabel=make('div','',t('Actual duration — automatically measured; editable','Duración real — automática; editable'));
  const actualHours=make('input');actualHours.type='number';actualHours.inputMode='numeric';actualHours.min='0';actualHours.step='1';actualHours.value=String(Math.floor(elapsed()/3600));
  const actualMinutes=make('input');actualMinutes.type='number';actualMinutes.inputMode='numeric';actualMinutes.min='0';actualMinutes.max='59';actualMinutes.step='1';actualMinutes.value=String(Math.floor(elapsed()%3600/60));
  const actualSeconds=make('input');actualSeconds.type='number';actualSeconds.inputMode='numeric';actualSeconds.min='0';actualSeconds.max='59';actualSeconds.step='1';actualSeconds.value=String(elapsed()%60);
  const durationFields=make('div','');durationFields.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px';
  [[actualHours,t('Hours','Horas')],[actualMinutes,t('Minutes','Minutos')],[actualSeconds,t('Seconds','Segundos')]].forEach(([input,label])=>{const field=make('label','',label);field.appendChild(input);durationFields.appendChild(field);});actualLabel.appendChild(durationFields);logging.appendChild(actualLabel);
  const effortLabel=make('label','',t('Actual effort (RPE 1–10)','Esfuerzo real (1–10)'));
  const effort=make('select');for(let i=1;i<=10;i++){const option=make('option','',String(i));option.value=String(i);if(i===5)option.selected=true;effort.appendChild(option);}effortLabel.appendChild(effort);logging.appendChild(effortLabel);
  const notesLabel=make('label','',t('Notes (optional)','Notas (opcional)'));
  const notes=make('textarea');notes.rows=2;notes.maxLength=1000;notesLabel.appendChild(notes);logging.appendChild(notesLabel);
  const saveBtn=make('button','cy-start',t('Save activity','Guardar actividad'));saveBtn.type='button';
  saveBtn.addEventListener('click',()=>{
   const h=Number(actualHours.value),m=Number(actualMinutes.value),sec=Number(actualSeconds.value);const durationSeconds=h*3600+m*60+sec;const rpe=Number(effort.value);
   if(![h,m,sec].every(Number.isInteger)||h<0||m<0||m>59||sec<0||sec>59||durationSeconds>86400||rpe<1||rpe>10){root.alert(t('Check duration and effort.','Revisa duración y esfuerzo.'));return;}
   const record={id:'cycle-'+Date.now(),date:new Date().toISOString(),workoutId:w.id,workoutName:w.name,plannedMinutes:session.plannedMinutes,actualMinutes:Math.floor(durationSeconds/60),actualSeconds:durationSeconds,rpe,completion:session.finished?'complete':'partial',mode:session.mode,notes:notes.value.trim()};
   const updated=[record,...history];
   try{localStorage.setItem(LOG_KEY,JSON.stringify(updated));history=updated;}catch(e){root.alert(t('Could not save activity. Check browser storage.','No se pudo guardar la actividad. Revisa el almacenamiento.'));return;}
   stopTick();releaseWake();session=null;persistSession();render();
  });logging.appendChild(saveBtn);
  logging.appendChild(make('p','cy-note',t('Saving stores this activity only on this device.','El registro se guarda únicamente en este dispositivo.')));
  panel.appendChild(logging);
  }
  const end=make('button','cy-end',t('Close session','Cerrar sesión'));end.type='button';
   end.addEventListener('click',()=>{
    if(panel.querySelector('.cy-discard-confirm'))return;
    const confirmRow=make('div','cy-discard-confirm');
    const discard=make('button','cy-end',t('Discard unsaved session','Descartar sesión sin guardar'));discard.type='button';
    discard.addEventListener('click',()=>{stopTick();releaseWake();session=null;persistSession();render();});
    const cancel=make('button','',t('Cancel','Cancelar'));cancel.type='button';cancel.addEventListener('click',()=>confirmRow.remove());
    confirmRow.append(discard,cancel);panel.appendChild(confirmRow);
   });panel.appendChild(end);
  mount.appendChild(panel);
 }
 function render(){
  const mount=document.getElementById('cycle-builder');if(!mount)return;
  mount.replaceChildren();if(session){sessionView(mount);return;}const workouts=getWorkouts();
  if(!workouts.length){mount.appendChild(make('p','cy-empty',t('Cycle workout library unavailable.','La biblioteca de ciclismo no está disponible.')));return;}
  // Match RUN and SWIM: weekday strip directly below the discipline banner.
  const days=make('div','cy-days cy-weekday-strip');
  (lang()==='es'?DAYS_ES:DAYS).forEach((name,i)=>{
   const b=make('button',i===selectedDay?'cy-active':'',name);
   b.type='button';b.setAttribute('aria-pressed',String(i===selectedDay));
   b.addEventListener('click',()=>{selectedDay=i;render();});days.appendChild(b);
  });mount.appendChild(days);
  const nav=make('div','cy-view-tabs');
  [[ 'workout',t("Today's Workout",'Entrenamiento de hoy') ],[ 'edit',t('Edit Plan','Editar plan') ]].forEach(([id,label])=>{
   const b=make('button',view===id?'cy-active':'',label);b.type='button';
   b.setAttribute('aria-pressed',String(view===id));b.addEventListener('click',()=>{view=id;render();});nav.appendChild(b);
  });mount.appendChild(nav);
  if(view==='workout') {
  const summary=make('div','cy-panel');summary.appendChild(make('h3','',t('Selected workouts','Entrenamientos seleccionados')+' — '+(lang()==='es'?DAYS_ES:DAYS)[selectedDay]));
  const current=dayType()==='rest'?[]:selected();if(dayType()==='recovery')summary.appendChild(make('p','cy-note',t('Active Recovery — choose an easy cycling session.','Recuperación activa — elige una sesión de ciclismo suave.')));if(dayType()==='rest')summary.appendChild(make('p','cy-note',t('Rest Day — no workout scheduled. Your planned selections are preserved.','Día de descanso — sin entrenamiento programado. Se conservan tus selecciones.')));if(dayType()!=='rest'&&!current.length)summary.appendChild(make('p','cy-empty',t('No workouts selected for this day.','No hay entrenamientos seleccionados para este día.')));
  current.forEach(id=>{const w=workouts.find(w=>w.id===id);if(w){
   const item=make('div','cy-plan-item');const heading=make('div','cy-plan-heading');heading.appendChild(workoutIcon(w));heading.appendChild(make('strong','',w.name));item.appendChild(heading);
   const config=make('div','cy-config');config.appendChild(make('span','cy-note',t('Suggested: ','Sugerido: ')+w.defaultDurationMinutes+' min'));
   const durationHours=make('input');durationHours.type='number';durationHours.min='0';durationHours.step='1';durationHours.value=String(Math.floor(w.defaultDurationMinutes/60));
   const durationMinutes=make('input');durationMinutes.type='number';durationMinutes.min='0';durationMinutes.max='59';durationMinutes.step='1';durationMinutes.value=String(w.defaultDurationMinutes%60);
   const duration=make('div','');duration.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px';
   [[durationHours,t('Hours','Horas')],[durationMinutes,t('Minutes','Minutos')]].forEach(([input,label])=>{const field=make('label','',label);field.appendChild(input);duration.appendChild(field);});
   const mode=make('select');[['guided',t('Guided','Guiado')],['manual',t('Manual','Manual')]].forEach(([v,label])=>{const o=make('option','',label);o.value=v;mode.appendChild(o);});
   const start=make('button','cy-start',t('Prepare session','Preparar sesión'));start.type='button';start.addEventListener('click',()=>{
    const h=Number(durationHours.value),m=Number(durationMinutes.value),n=h*60+m;if(!Number.isInteger(h)||!Number.isInteger(m)||h<0||m<0||m>59||n<5||n>360){root.alert(t('Enter a duration between 5 and 360 minutes.','Ingresa una duración entre 5 y 360 minutos.'));return;}
    startSession(w,n,mode.value);
   });config.append(duration,mode,start);item.appendChild(config);summary.appendChild(item);
  }});mount.appendChild(summary);
  }
  if(view==='edit') {
  const typePanel=make('div','cy-panel cy-day-type');
  const typeLabel=make('label','cy-type-label',t('Day type','Tipo de día'));
  const typeSelect=make('select','cy-type-select');
  [['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,label])=>{const opt=make('option','',label);opt.value=value;typeSelect.appendChild(opt);});
  typeSelect.value=dayType();typeSelect.setAttribute('aria-label',t('Day type','Tipo de día'));
  typeSelect.addEventListener('change',()=>{const previous=dayTypes[selectedDay];dayTypes[selectedDay]=typeSelect.value;if(!saveDayTypes()){if(previous===undefined)delete dayTypes[selectedDay];else dayTypes[selectedDay]=previous;root.alert(t('Could not save day type.','No se pudo guardar el tipo de día.'));}render();});
  typeLabel.appendChild(typeSelect);typePanel.appendChild(typeLabel);mount.appendChild(typePanel);
  if(dayType()==='rest'){
   const rest=make('p','cy-rest-note',t('Rest Day — your planned workouts are preserved.','Día de descanso — tus entrenamientos están guardados.'));typePanel.appendChild(rest);
  }else{
   const current=selected();
   const catalog=make('div','cy-panel cy-edit-library');
   catalog.appendChild(make('h2','',t('Build your weekly workout','Prepara tu entrenamiento semanal')));
   catalog.appendChild(make('h3','',t('Selected for ','Seleccionados para ')+(lang()==='es'?DAYS_ES:DAYS)[selectedDay]+' ('+current.length+')'));
   if(!current.length)catalog.appendChild(make('p','cy-note',t('No workouts selected yet. Choose a category below.','Todavía no hay entrenamientos seleccionados. Elige una categoría abajo.')));
   current.forEach(id=>{const w=workouts.find(x=>x.id===id);if(!w)return;
    const label=make('label','cy-workout cy-selected-workout');const cb=make('input');cb.type='checkbox';cb.checked=true;
    cb.addEventListener('change',()=>{const next=new Set(selected());next.delete(w.id);plan[selectedDay]=workouts.filter(x=>next.has(x.id)).map(x=>x.id);if(!save())root.alert(t('Could not save your plan.','No se pudo guardar el plan.'));render();});
    const desc=make('span');desc.appendChild(make('strong','',w.name));label.append(workoutIcon(w),desc,cb);catalog.appendChild(label);
   });
   const categories=root.TrainLabCycle.categories||[];const tabs=make('div','cy-cats cy-edit-cats');
   categories.forEach(c=>{const b=make('button',c.id===selectedCategory?'cy-active':'',c.name);b.type='button';b.setAttribute('aria-pressed',String(c.id===selectedCategory));b.addEventListener('click',()=>{selectedCategory=c.id;render();});tabs.appendChild(b);});catalog.appendChild(tabs);
   workouts.filter(w=>w.category===selectedCategory&&!current.includes(w.id)).forEach(w=>{
    const label=make('label','cy-workout cy-available-workout');const cb=make('input');cb.type='checkbox';cb.checked=false;
    cb.addEventListener('change',()=>{const next=new Set(selected());next.add(w.id);plan[selectedDay]=workouts.filter(x=>next.has(x.id)).map(x=>x.id);if(!save())root.alert(t('Could not save your plan.','No se pudo guardar el plan.'));render();});
    const desc=make('span');desc.appendChild(make('strong','',w.name));desc.appendChild(make('small','',w.purpose));label.append(workoutIcon(w),desc,cb);catalog.appendChild(label);
   });
   mount.appendChild(catalog);
  }
  }
  if(view==='workout') {
  const logPanel=make('div','cy-panel');logPanel.appendChild(make('h2','',t('Recent Cycle activities','Actividades recientes de ciclismo')));
  if(!history.length)logPanel.appendChild(make('p','cy-note',t('No activities logged yet.','Todavía no hay actividades registradas.')));
  history.forEach(r=>{const item=make('div','cy-log-item');const date=new Date(r.date);item.appendChild(make('strong','',r.workoutName+' · '+(Number.isNaN(date.getTime())?'':date.toLocaleDateString())));item.appendChild(make('small','',t('Planned ','Planeado ')+r.plannedMinutes+' min · '+t('Actual ','Real ')+(Number.isFinite(r.actualSeconds)?String(Math.floor(r.actualSeconds/60))+'m '+String(r.actualSeconds%60).padStart(2,'0')+'s':r.actualMinutes+' min')+' · RPE '+r.rpe+' · '+(r.completion==='complete'?t('Complete','Completo'):t('Partial','Parcial'))));if(r.notes)item.appendChild(make('small','',r.notes));
   const del=make('button','cy-delete',t('Delete activity','Eliminar actividad'));del.type='button';
   del.addEventListener('click',()=>{
    // Match SWIM's in-app confirmation rather than the browser-native popup.
    const backdrop=make('div','cy-confirm-backdrop');
    backdrop.style.cssText='position:fixed;inset:0;background:#000b;display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
    const dialog=make('div','cy-confirm-dialog');
    dialog.style.cssText='max-width:350px;width:100%;background:#10273d;padding:20px;border:1px solid #42607a;border-radius:14px;color:#fff';
    dialog.appendChild(make('strong','',t('Delete this Cycling activity? This cannot be undone.','¿Eliminar esta actividad de ciclismo? Esta acción no se puede deshacer.')));
    const controls=make('div','cy-confirm-actions');
    controls.style.cssText='display:flex;gap:10px;justify-content:flex-end;margin-top:18px';
    const cancel=make('button','',t('Cancel','Cancelar'));
    cancel.type='button';cancel.addEventListener('click',()=>backdrop.remove());
    const confirmDelete=make('button','cy-delete',t('Delete','Eliminar'));
    confirmDelete.type='button';confirmDelete.addEventListener('click',()=>{
     const updated=history.filter(x=>x!==r);
     try{localStorage.setItem(LOG_KEY,JSON.stringify(updated));history=updated;backdrop.remove();render();}
     catch(e){root.alert(t('Could not delete activity.','No se pudo eliminar la actividad.'));}
    });
    controls.append(cancel,confirmDelete);dialog.appendChild(controls);backdrop.appendChild(dialog);document.body.appendChild(backdrop);
   });item.appendChild(del);logPanel.appendChild(item);});mount.appendChild(logPanel);
  }
 }
 const style=document.createElement('style');style.textContent='\n/* Cycle v0.7 session controls */\n#cycle-builder .cy-config{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 5px;align-items:center}\n#cycle-builder .cy-config input,#cycle-builder .cy-config select{background:#10283e;color:#fff;border:1px solid #567;border-radius:9px;padding:10px;min-height:43px}\n#cycle-builder .cy-config input{width:85px}\n#cycle-builder .cy-config select{width:110px}\n#cycle-builder .cy-start{background:#176a96;border-color:#5ebbe9}\n#cycle-builder .cy-session{border:1px solid #4281a4;border-radius:14px;padding:16px;background:#112b40}\n#cycle-builder .cy-clock{font-size:clamp(35px,10vw,62px);font-weight:800;letter-spacing:.03em;font-variant-numeric:tabular-nums;text-align:center;padding:16px 0}\n#cycle-builder .cy-controls{display:flex;gap:8px;flex-wrap:wrap}\n#cycle-builder .cy-controls button{flex:1 1 140px;background:#176a96}\n#cycle-builder .cy-end{margin-top:14px;background:#45283c;border-color:#ac6687}\n#cycle-builder .cy-discard-confirm{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}\n\n#cycle-builder .cy-rpe{font-weight:750;font-size:1.05rem;margin:10px 0 14px}\n#cycle-builder .cy-workout{display:flex;align-items:center;justify-content:space-between;gap:12px}\n#cycle-builder .cy-workout input[type=checkbox]{order:2;flex-shrink:0}\n#cycle-builder .cy-logging{display:grid;gap:10px;margin-top:18px;padding-top:12px;border-top:1px solid #42627b}\n#cycle-builder .cy-logging label{display:grid;gap:5px;font-weight:600}\n#cycle-builder .cy-logging input,#cycle-builder .cy-logging select,#cycle-builder .cy-logging textarea{background:#10283e;color:#fff;border:1px solid #567;border-radius:8px;padding:9px;max-width:100%}\n#cycle-builder .cy-log-item{display:grid;gap:4px;padding:10px 0;border-bottom:1px solid #42627b}\n#cycle-builder .cy-log-item small{overflow-wrap:anywhere}\n#cycle-builder .cy-delete,#cycle-builder .cy-delete-all{width:max-content;max-width:100%;padding:8px 12px;margin-top:6px;border:1px solid #9b6679;border-radius:8px;background:#3d2735;color:#fff;font-size:.9rem}\n\n#cycle-builder .cy-illustration{width:64px;height:64px;object-fit:cover;border-radius:12px;flex:0 0 64px;background:#071c30}\n#cycle-builder .cy-workout span{flex:1;min-width:0}\n#cycle-builder .cy-workout input[type=checkbox]{margin-left:auto}\n#cycle-builder .cy-plan-heading{display:flex;align-items:center;gap:12px;margin-bottom:8px}\n#cycle-builder .cy-plan-heading .cy-illustration{width:58px;height:58px;flex-basis:58px}\n#cycle-builder .cy-plan-heading h2{margin:0}\n\n/* Step 15B — Day Type and Edit Plan correction; session engine unchanged */\n#cycle-builder .cy-weekday-strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:12px 0 10px;padding:0;background:transparent;border:0}\n#cycle-builder .cy-weekday-strip button{min-width:0;padding:11px 0;font-size:clamp(11px,2.7vw,14px);border-radius:9px}\n#cycle-builder .cy-view-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 16px}\n#cycle-builder .cy-view-tabs button{width:100%;min-width:0;min-height:58px;padding:10px 6px;font-size:16px;font-weight:700;border-radius:12px}\n\n/* Step 15C — match approved Total Body Edit Plan layout */\n#cycle-builder .cy-day-type{padding:16px 18px;margin-bottom:12px}\n#cycle-builder .cy-type-label{display:flex;flex-direction:column;gap:8px;font-size:14px;color:#b8c9d6}\n#cycle-builder .cy-type-select{display:block;width:100%;box-sizing:border-box;min-height:52px;padding:12px 14px;background:#0d2235;color:#fff;border:1px solid #486a82;border-radius:10px;font-size:17px;appearance:auto}\n#cycle-builder .cy-rest-note{margin:12px 0 0;font-size:14px;color:#b8c9d6}\n#cycle-builder .cy-edit-library{padding:20px 16px}\n#cycle-builder .cy-edit-library h2{font-size:21px;margin:0 0 16px}\n#cycle-builder .cy-edit-library h3{font-size:17px;margin:0 0 8px}\n#cycle-builder .cy-edit-library .cy-workout{padding:12px 4px;gap:12px;border-bottom:1px solid #35516a;min-height:70px}\n#cycle-builder .cy-edit-library .cy-workout strong{font-weight:500;font-size:16px}\n#cycle-builder .cy-edit-library .cy-workout input[type=checkbox]{width:23px;height:23px;accent-color:#ef3b9a}\n#cycle-builder .cy-edit-cats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:18px 0 12px}\n#cycle-builder .cy-edit-cats button{min-height:50px;border-radius:11px;font-weight:700}\n';document.head.appendChild(style);
 root.TrainLabCycleUI={render};
})(window);
