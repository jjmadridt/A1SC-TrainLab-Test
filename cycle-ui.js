/* A1SC Cycle v0.5 — weekly planning, session timers and local activity logging. */
(function(root){
 'use strict';
 const KEY='a1sc-cycle-weekly-plan-v03';
 const LOG_KEY='a1sc-cycle-activity-log-v05';
 let history=[];
 try {const stored=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(Array.isArray(stored))history=stored;}catch(e){}
 const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const DAYS_ES=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 let selectedDay=(new Date().getDay()+6)%7, selectedCategory='endurance';
 let plan={};
 let session=null, ticker=null;
 try {const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))plan=value;}catch(e){}
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
 function elapsed(){return session?Math.max(0,Math.floor((Date.now()-(session.createdAt||Date.now())-(session.pausedMs||0)-(session.running?0:Date.now()-(session.pauseAt||Date.now())))/1000)):0;}
 function stopTick(){if(ticker){clearInterval(ticker);ticker=null;}}
 function timeLeft(){if(!session)return 0;return session.running?Math.max(0,session.remaining-Math.floor((Date.now()-session.startedAt)/1000)):session.remaining;}
 function pause(){if(!session||!session.running)return;session.remaining=timeLeft();session.running=false;session.pauseAt=Date.now();stopTick();render();}
 function next(){if(!session)return;session.index++;if(session.index>=session.steps.length){session.finished=true;session.running=false;session.remaining=0;session.pauseAt=Date.now();stopTick();render();return;}session.remaining=session.steps[session.index].duration;session.startedAt=Date.now();render();}
 function tick(){if(!session||!session.running)return;const left=timeLeft();if(left<=0){if(session.mode==='guided')next();else{session.remaining=0;session.running=false;session.pauseAt=Date.now();stopTick();render();}}else{const display=document.getElementById('cy-countdown');if(display)display.textContent=clock(left);}}
 function startSession(w,minutes,mode){stopTick();session={workout:w,steps:stepsFor(w,minutes),index:0,mode,remaining:0,running:false,finished:false,plannedMinutes:minutes,createdAt:Date.now(),pauseAt:Date.now(),pausedMs:0};session.remaining=session.steps[0].duration;render();}
 function sessionView(mount){
  if(!session)return;
  const panel=make('section','cy-panel cy-session');const w=session.workout;
  panel.appendChild(make('h2','',w.name));
  panel.appendChild(make('p','cy-note',session.mode==='guided'?t('Guided mode · segments advance automatically.','Modo guiado · los segmentos avanzan automáticamente.'):t('Manual mode · use Next to advance.','Modo manual · usa Siguiente para avanzar.')));
  if(session.finished){panel.appendChild(make('h3','',t('Session finished','Sesión finalizada')));}
  else {
   const st=session.steps[session.index];panel.appendChild(make('h3','',st.name+' ('+(session.index+1)+'/'+session.steps.length+')'));
   panel.appendChild(make('div','cy-clock',clock(timeLeft()))).id='cy-countdown';
   panel.appendChild(make('p','cy-rpe',t('RPE — Perceived Effort (1–10): ','Esfuerzo percibido (1–10): ')+st.rpe.join('–')+(st.powerZone?' · '+st.powerZone:'')));
   const actions=make('div','cy-controls');
   function btn(label,fn){const b=make('button','',label);b.type='button';b.addEventListener('click',fn);actions.appendChild(b);}
   btn(session.running?t('Pause','Pausar'):t('Start / Resume','Iniciar / Continuar'),()=>{if(session.running){pause();return;}session.pausedMs+=Date.now()-session.pauseAt;session.startedAt=Date.now();session.running=true;stopTick();ticker=setInterval(tick,250);render();});
   btn(t('Next segment','Siguiente segmento'),next);
   panel.appendChild(actions);
   panel.appendChild(make('p','cy-note',t('Timers run locally. Keep the app open during a session; closing or reloading ends the session.','El cronómetro funciona localmente. Mantén la aplicación abierta; cerrar o recargar termina la sesión.')));
  }
  const logging=make('div','cy-logging');
  logging.appendChild(make('h3','',t('Log activity','Registrar actividad')));
  const actualLabel=make('label','',t('Actual duration (minutes)','Duración real (minutos)'));
  const actual=make('input');actual.type='number';actual.min='0';actual.max='1440';actual.step='1';actual.value=String(Math.round(elapsed()/60));actualLabel.appendChild(actual);logging.appendChild(actualLabel);
  const effortLabel=make('label','',t('Actual effort (RPE 1–10)','Esfuerzo real (1–10)'));
  const effort=make('select');for(let i=1;i<=10;i++){const option=make('option','',String(i));option.value=String(i);if(i===5)option.selected=true;effort.appendChild(option);}effortLabel.appendChild(effort);logging.appendChild(effortLabel);
  const notesLabel=make('label','',t('Notes (optional)','Notas (opcional)'));
  const notes=make('textarea');notes.rows=2;notes.maxLength=1000;notesLabel.appendChild(notes);logging.appendChild(notesLabel);
  const saveBtn=make('button','cy-start',t('Save activity','Guardar actividad'));saveBtn.type='button';
  saveBtn.addEventListener('click',()=>{
   const minutes=Number(actual.value),rpe=Number(effort.value);
   if(!Number.isFinite(minutes)||minutes<0||minutes>1440||!Number.isInteger(minutes)||rpe<1||rpe>10){root.alert(t('Check duration and effort.','Revisa duración y esfuerzo.'));return;}
   const record={id:'cycle-'+Date.now(),date:new Date().toISOString(),workoutId:w.id,workoutName:w.name,plannedMinutes:session.plannedMinutes,actualMinutes:minutes,rpe,completion:session.finished?'complete':'partial',mode:session.mode,notes:notes.value.trim()};
   const updated=[record,...history];
   try{localStorage.setItem(LOG_KEY,JSON.stringify(updated));history=updated;}catch(e){root.alert(t('Could not save activity. Check browser storage.','No se pudo guardar la actividad. Revisa el almacenamiento.'));return;}
   stopTick();session=null;render();
  });logging.appendChild(saveBtn);
  logging.appendChild(make('p','cy-note',t('Saving stores this activity only on this device.','El registro se guarda únicamente en este dispositivo.')));
  panel.appendChild(logging);
  const end=make('button','cy-end',t('Close session','Cerrar sesión'));end.type='button';end.addEventListener('click',()=>{stopTick();session=null;render();});panel.appendChild(end);
  mount.appendChild(panel);
 }
 function render(){
  const mount=document.getElementById('cycle-builder');if(!mount)return;
  mount.replaceChildren();if(session){sessionView(mount);return;}const workouts=getWorkouts();
  if(!workouts.length){mount.appendChild(make('p','cy-empty',t('Cycle workout library unavailable.','La biblioteca de ciclismo no está disponible.')));return;}
  const intro=make('div','cy-panel');intro.appendChild(make('h2','',t('Weekly Cycle Plan','Plan semanal de ciclismo')));
  intro.appendChild(make('p','cy-note',t('Choose one or more workouts for each weekday. Your selections repeat every week and are saved on this device.','Selecciona uno o más entrenamientos para cada día. Se repiten semanalmente y se guardan en este dispositivo.')));
  const days=make('div','cy-days');(lang()==='es'?DAYS_ES:DAYS).forEach((name,i)=>{const b=make('button',i===selectedDay?'cy-active':'',name);b.type='button';b.setAttribute('aria-pressed',String(i===selectedDay));b.addEventListener('click',()=>{selectedDay=i;render();});days.appendChild(b);});intro.appendChild(days);mount.appendChild(intro);
  const summary=make('div','cy-panel');summary.appendChild(make('h3','',t('Selected workouts','Entrenamientos seleccionados')+' — '+(lang()==='es'?DAYS_ES:DAYS)[selectedDay]));
  const current=selected();if(!current.length)summary.appendChild(make('p','cy-empty',t('No workouts selected for this day.','No hay entrenamientos seleccionados para este día.')));
  current.forEach(id=>{const w=workouts.find(w=>w.id===id);if(w){
   const item=make('div','cy-plan-item');item.appendChild(make('strong','',w.name));
   const config=make('div','cy-config');config.appendChild(make('span','cy-note',t('Suggested: ','Sugerido: ')+w.defaultDurationMinutes+' min'));
   const duration=make('input');duration.type='number';duration.min='5';duration.max='360';duration.step='1';duration.value=String(w.defaultDurationMinutes);duration.setAttribute('aria-label',t('Session minutes','Minutos de sesión'));
   const mode=make('select');[['guided',t('Guided','Guiado')],['manual',t('Manual','Manual')]].forEach(([v,label])=>{const o=make('option','',label);o.value=v;mode.appendChild(o);});
   const start=make('button','cy-start',t('Prepare session','Preparar sesión'));start.type='button';start.addEventListener('click',()=>{
    const n=Number(duration.value);if(!Number.isFinite(n)||n<5||n>360){root.alert(t('Enter a duration between 5 and 360 minutes.','Ingresa una duración entre 5 y 360 minutos.'));return;}
    startSession(w,n,mode.value);
   });config.append(duration,mode,start);item.appendChild(config);summary.appendChild(item);
  }});mount.appendChild(summary);
  const catalog=make('div','cy-panel');catalog.appendChild(make('h2','',t('Workout library','Biblioteca de entrenamientos')));
  const categories=root.TrainLabCycle.categories||[];const tabs=make('div','cy-cats');categories.forEach(c=>{const b=make('button',c.id===selectedCategory?'cy-active':'',c.name);b.type='button';b.setAttribute('aria-pressed',String(c.id===selectedCategory));b.addEventListener('click',()=>{selectedCategory=c.id;render();});tabs.appendChild(b);});catalog.appendChild(tabs);
  workouts.filter(w=>w.category===selectedCategory).forEach(w=>{const label=make('label','cy-workout');const cb=make('input');cb.type='checkbox';cb.checked=current.includes(w.id);cb.addEventListener('change',()=>{const next=new Set(selected());if(cb.checked)next.add(w.id);else next.delete(w.id);plan[selectedDay]=workouts.filter(x=>next.has(x.id)).map(x=>x.id);if(!save()){root.alert(t('Could not save your plan. Check browser storage settings.','No se pudo guardar el plan. Revisa el almacenamiento del navegador.'));}render();});const desc=make('span');desc.appendChild(make('strong','',w.name));desc.appendChild(make('small','',w.purpose));label.append(desc,cb);catalog.appendChild(label);});mount.appendChild(catalog);
  const logPanel=make('div','cy-panel');logPanel.appendChild(make('h2','',t('Recent Cycle activities','Actividades recientes de ciclismo')));
  if(!history.length)logPanel.appendChild(make('p','cy-note',t('No activities logged yet.','Todavía no hay actividades registradas.')));
  history.slice(0,10).forEach(r=>{const item=make('div','cy-log-item');const date=new Date(r.date);item.appendChild(make('strong','',r.workoutName+' · '+(Number.isNaN(date.getTime())?'':date.toLocaleDateString())));item.appendChild(make('small','',t('Planned ','Planeado ')+r.plannedMinutes+' min · '+t('Actual ','Real ')+r.actualMinutes+' min · RPE '+r.rpe+' · '+(r.completion==='complete'?t('Complete','Completo'):t('Partial','Parcial'))));if(r.notes)item.appendChild(make('small','',r.notes));logPanel.appendChild(item);});mount.appendChild(logPanel);
 }
 const style=document.createElement('style');style.textContent='\n/* Cycle v0.5 session controls */\n#cycle-builder .cy-config{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 5px;align-items:center}\n#cycle-builder .cy-config input,#cycle-builder .cy-config select{background:#10283e;color:#fff;border:1px solid #567;border-radius:9px;padding:10px;min-height:43px}\n#cycle-builder .cy-config input{width:85px}\n#cycle-builder .cy-config select{width:110px}\n#cycle-builder .cy-start{background:#176a96;border-color:#5ebbe9}\n#cycle-builder .cy-session{border:1px solid #4281a4;border-radius:14px;padding:16px;background:#112b40}\n#cycle-builder .cy-clock{font-size:clamp(35px,10vw,62px);font-weight:800;letter-spacing:.03em;font-variant-numeric:tabular-nums;text-align:center;padding:16px 0}\n#cycle-builder .cy-controls{display:flex;gap:8px;flex-wrap:wrap}\n#cycle-builder .cy-controls button{flex:1 1 140px;background:#176a96}\n#cycle-builder .cy-end{margin-top:14px;background:#45283c;border-color:#ac6687}\n\n#cycle-builder .cy-rpe{font-weight:750;font-size:1.05rem;margin:10px 0 14px}\n#cycle-builder .cy-workout{display:flex;align-items:center;justify-content:space-between;gap:12px}\n#cycle-builder .cy-workout input[type=checkbox]{order:2;flex-shrink:0}\n#cycle-builder .cy-logging{display:grid;gap:10px;margin-top:18px;padding-top:12px;border-top:1px solid #42627b}\n#cycle-builder .cy-logging label{display:grid;gap:5px;font-weight:600}\n#cycle-builder .cy-logging input,#cycle-builder .cy-logging select,#cycle-builder .cy-logging textarea{background:#10283e;color:#fff;border:1px solid #567;border-radius:8px;padding:9px;max-width:100%}\n#cycle-builder .cy-log-item{display:grid;gap:4px;padding:10px 0;border-bottom:1px solid #42627b}\n#cycle-builder .cy-log-item small{overflow-wrap:anywhere}\n';document.head.appendChild(style);
 root.TrainLabCycleUI={render};
})(window);
