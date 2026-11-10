/* SWIM planning and activity recording. Isolated storage keys. */
(function(root){'use strict';
const KEY='a1sc-swim-weekly-plan-v01',SETTINGS='a1sc-swim-settings-v01';
const ACTIVE='a1sc-swim-active-v01',HISTORY='a1sc-swim-activity-history-v01';
const DAY_TYPES='a1sc-swim-day-types-v01';
let view='workout';
let dayTypes=load(DAY_TYPES,{});
function currentDayType(){return ['training','recovery','rest'].includes(dayTypes[day])?dayTypes[day]:'training';}
const days={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
let day=(new Date().getDay()+6)%7,category='endurance';
function load(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch(e){return fallback;}}
let plan=load(KEY,{}),settings=Object.assign({environment:'pool',unit:'m',pool:25},load(SETTINGS,{}));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(plan));localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch(e){}}
function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
function t(en,es){return lang()==='es'?es:en;}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function button(txt,click,active){const b=el('button',active?'sw-active':'',txt);b.type='button';b.addEventListener('click',click);return b;}
function gender(){try{return JSON.parse(localStorage.getItem('fitclimb-v1')||'{}').settings?.bodyIllustration==='female'?'female':'male';}catch(e){return 'male';}}
function distance(w){return Math.max(0,Number(w.perSet)||0)*Math.max(1,Number(w.sets)||1);}
function selected(){return Array.isArray(plan[day])?plan[day]:[];}
function render(){const host=document.getElementById('swim-builder'),data=root.TrainLabSwim;if(!host||!data)return;host.replaceChildren();
const panel=(title)=>{const p=el('section','sw-panel');p.append(el('h2','',title));host.append(p);return p;};
const nav=el('div','sw-buttons');
nav.append(button(t("Today's Workout",'Entrenamiento de hoy'),()=>{view='workout';render();},view==='workout'));
nav.append(button(t('Edit Plan','Editar plan'),()=>{view='edit';render();},view==='edit'));host.append(nav);
const setup=panel(t('Swimming environment','Entorno de natación'));const env=el('div','sw-buttons');['pool','open'].forEach(v=>env.append(button(v==='pool'?t('Pool','Alberca'):t('Open water','Aguas abiertas'),()=>{settings.environment=v;persist();render();},settings.environment===v)));setup.append(env);
if(settings.environment==='pool'){
 const opts=el('div','sw-settings');const unit=el('label','',t('Units','Unidades'));const select=el('select');[['m',t('Meters','Metros')],['yd',t('Yards','Yardas')]].forEach(([v,name])=>{const o=el('option','',name);o.value=v;select.append(o)});select.value=settings.unit;select.addEventListener('change',()=>{settings.unit=select.value;persist();render()});unit.append(select);opts.append(unit);
 const size=el('label','',t('Pool length','Longitud de alberca'));const field=el('input');field.type='number';field.min='1';field.step='0.01';field.value=settings.pool;field.addEventListener('change',()=>{const n=Number(field.value);if(Number.isFinite(n)&&n>0&&n<=1000){settings.pool=n;persist();render();}else field.value=settings.pool;});size.append(field);opts.append(size);setup.append(opts);
 const presets=el('div','sw-buttons');[25,50].forEach(n=>presets.append(button(n+' '+settings.unit,()=>{settings.pool=n;persist();render();},settings.pool===n)));setup.append(presets);
}
const week=panel(t('Weekly plan','Plan semanal'));const wd=el('div','sw-days');days[lang()].forEach((d,i)=>wd.append(button(d,()=>{day=i;render();},day===i)));week.append(wd);
if(view==='edit'){
 const typeLabel=el('label','',t('Day type','Tipo de día'));
 const typeSelect=el('select');
 [['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,label])=>{const option=el('option','',label);option.value=value;typeSelect.append(option);});
 typeSelect.value=currentDayType();typeSelect.addEventListener('change',()=>{dayTypes[day]=typeSelect.value;try{localStorage.setItem(DAY_TYPES,JSON.stringify(dayTypes));}catch(e){}render();});
 typeLabel.append(typeSelect);week.append(typeLabel);
}
if(view==='edit'){const cats=el('div','sw-buttons');data.categories.forEach(c=>cats.append(button(c[lang()],()=>{category=c.id;render();},category===c.id)));week.append(cats);
const list=el('div');data.workouts.filter(w=>w.category===category).forEach(w=>{
 const row=el('label','sw-workout');const check=el('input');check.type='checkbox';check.checked=selected().some(x=>x.id===w.id);check.addEventListener('change',()=>{const existing=selected().filter(x=>x.id!==w.id);if(check.checked)existing.push({id:w.id,perSet:w.perSet,sets:w.sets,rest:w.rest});plan[day]=existing;persist();render()});row.append(check);
 const img=el('img','sw-icon');img.src='swim-icons/'+w.category+'-'+gender()+'.webp';img.alt='';img.loading='lazy';row.append(img);
 const info=el('span');info.append(el('strong','',w[lang()]));info.append(el('small','',w.sets+' × '+w.perSet+' '+settings.unit+(w.rest?' · '+w.rest+'s '+t('rest','descanso'):'')));row.append(info);list.append(row);
});week.append(list);}
const summary=panel(t('Planned session — '+days.en[day],'Sesión planeada — '+days.es[day]));
if(view==='workout'&&currentDayType()!=='training'){summary.append(el('p','sw-note',currentDayType()==='rest'?t('Rest Day. Your saved workouts are preserved.','Día de descanso. Tus entrenamientos guardados se conservan.'):t('Active Recovery. Keep movement gentle and optional.','Recuperación activa. Mantén el movimiento suave y opcional.')));}
if(!selected().length)summary.append(el('p','sw-note',t('No workouts selected for this day.','No hay entrenamientos seleccionados para este día.')));
selected().forEach((entry)=>{const w=data.workouts.find(x=>x.id===entry.id);if(!w)return;const line=el('div','sw-plan');line.append(el('strong','',w[lang()]));const fields=el('div','sw-fields');
[['perSet',t('Distance per set','Distancia por serie'),1],['sets',t('Sets','Series'),1],['rest',t('Rest (sec)','Descanso (seg)'),0]].forEach(([key,label,min])=>{const wrapper=el('label','',label);const input=el('input');input.type='number';input.min=String(min);input.step='1';input.value=entry[key];input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isFinite(n)&&n>=min&&n<=100000){entry[key]=Math.round(n);persist();render();}else input.value=entry[key];});wrapper.append(input);fields.append(wrapper);});if(view==='edit')line.append(fields);line.append(el('small','',t('Planned distance: ','Distancia planeada: ')+distance(entry)+' '+settings.unit));summary.append(line);});
const total=selected().reduce((sum,x)=>sum+distance(x),0);summary.append(el('p','sw-total',t('Total planned: ','Total planeado: ')+total+' '+settings.unit));
if(settings.environment==='pool'){const lengths=total/settings.pool;summary.append(el('p','sw-note',t('Equivalent pool lengths: ','Largos equivalentes: ')+(Number.isInteger(lengths)?lengths:lengths.toFixed(2))));}

if(view==='edit')return;
// Activity recorder: separate storage; does not modify weekly plans or Total Body logs.
const activityPanel=panel(t('Activity recording','Registro de actividad'));
const style=(node)=>{node.style.cssText='width:100%;margin:6px 0;padding:11px;border:1px solid #42607a;border-radius:9px;background:#091d2e;color:#fff';return node;};
const active=load(ACTIVE,null);
const now=Date.now();
const elapsed=(a,at)=>Math.max(0,Math.floor(((a.accumulatedMs||0)+(a.status==='running'?Math.max(0,at-a.startedAt):0))/1000));
const time=(sec)=>{const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':');};
const saveActive=(a)=>{try{if(a)localStorage.setItem(ACTIVE,JSON.stringify(a));else localStorage.removeItem(ACTIVE);}catch(e){alert(t('Device storage unavailable. Do not close the app.','Almacenamiento no disponible. No cierres la aplicación.'));}};
const recorderButton=(text,action)=>{const b=button(text,action);b.style.margin='4px 6px 4px 0';activityPanel.append(b);return b;};
const clock=el('div','',time(active?elapsed(active,now):0));clock.style.cssText='font-size:34px;font-weight:800;font-variant-numeric:tabular-nums;text-align:center;margin:12px 0';activityPanel.append(clock);
if(active?.status==='running'){const tick=()=>{if(clock.isConnected)clock.textContent=time(elapsed(active,Date.now()));else clearInterval(timer);};const timer=setInterval(tick,1000);}
if(!active){
 activityPanel.append(el('p','sw-note',t('Start a timed session or enter a completed workout manually.','Inicia una sesión cronometrada o registra un entrenamiento manualmente.')));
 recorderButton(t('START','INICIAR'),()=>{if(!selected().length){alert(t('Select at least one workout for this day first.','Selecciona al menos un entrenamiento para este día.'));return;}
 const snapshot=selected().map(x=>({...x}));saveActive({status:'running',startedAt:Date.now(),accumulatedMs:0,day,environment:settings.environment,unit:settings.unit,pool:settings.pool,workouts:snapshot,createdAt:new Date().toISOString()});render();});
 recorderButton(t('MANUAL ENTRY','REGISTRO MANUAL'),()=>{saveActive({status:'review',startedAt:0,accumulatedMs:0,day,environment:settings.environment,unit:settings.unit,pool:settings.pool,workouts:selected().map(x=>({...x})),createdAt:new Date().toISOString(),manual:true});render();});
}else if(active.status==='running'){
 activityPanel.append(el('p','sw-note',t('Timer running. You can lock your phone and return later.','Cronómetro activo. Puedes bloquear el teléfono y regresar después.')));
 recorderButton(t('PAUSE','PAUSAR'),()=>{active.accumulatedMs+=Date.now()-active.startedAt;active.status='paused';active.startedAt=0;saveActive(active);render();});
 recorderButton(t('FINISH','FINALIZAR'),()=>{if(!confirm(t('Finish this swimming session?','¿Finalizar esta sesión de natación?')))return;active.accumulatedMs+=Date.now()-active.startedAt;active.status='review';active.startedAt=0;saveActive(active);render();});
}else if(active.status==='paused'){
 activityPanel.append(el('p','sw-note',t('Session paused.','Sesión en pausa.')));
 recorderButton(t('RESUME','REANUDAR'),()=>{active.startedAt=Date.now();active.status='running';saveActive(active);render();});
 recorderButton(t('FINISH','FINALIZAR'),()=>{if(!confirm(t('Finish this swimming session?','¿Finalizar esta sesión de natación?')))return;active.status='review';saveActive(active);render();});
}else if(active.status==='review'){
 activityPanel.append(el('p','sw-note',t('Review actual results before saving.','Revisa los resultados reales antes de guardar.')));
 const field=(label,value,min,step)=>{const wrap=el('label','',label);wrap.style.cssText='display:block;margin:9px 0';const input=style(el('input'));input.type='number';input.min=String(min);input.step=String(step);input.value=String(value);wrap.append(input);activityPanel.append(wrap);return input;};
 const planned=active.workouts.reduce((n,w)=>n+distance(w),0);
 const dist=field(t('Actual distance ('+active.unit+')','Distancia real ('+active.unit+')'),planned,0,1);
 const sets=field(t('Completed sets','Series completadas'),active.workouts.reduce((n,w)=>n+(Number(w.sets)||0),0),0,1);
 const duration=field(t('Elapsed time (minutes)','Tiempo transcurrido (minutos)'),Math.round(elapsed(active,now)/60*100)/100,0,0.01);
 const notesWrap=el('label','',t('Personal notes (optional)','Notas personales (opcional)'));notesWrap.style.cssText='display:block;margin:9px 0';const notes=style(el('textarea'));notes.rows=3;notes.maxLength=1000;notes.placeholder=t('How did the workout feel?','¿Cómo te sentiste durante el entrenamiento?');notes.value=active.notes||'';notes.addEventListener('input',()=>{active.notes=notes.value;saveActive(active);});notesWrap.append(notes);activityPanel.append(notesWrap);
 activityPanel.append(el('p','sw-note',t('Pool/open-water mode and pool length are saved with the record.','Se guardan el tipo de natación y la longitud de alberca.')));
 recorderButton(t('SAVE ACTIVITY','GUARDAR ACTIVIDAD'),()=>{const d=Number(dist.value),s=Number(sets.value),mins=Number(duration.value);if(![d,s,mins].every(Number.isFinite)||d<0||s<0||!Number.isInteger(s)||mins<0){alert(t('Enter valid results.','Ingresa resultados válidos.'));return;}
 const history=load(HISTORY,[]);if(!Array.isArray(history)){alert(t('Activity history cannot be read.','No se puede leer el historial.'));return;}
 const workoutDetails=active.workouts.map(w=>{const definition=data.workouts.find(x=>x.id===w.id);return {id:w.id,category:definition?.category||'',en:definition?.en||w.id,es:definition?.es||definition?.en||w.id};});
 const record={id:'swim-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),savedAt:new Date().toISOString(),startedAt:active.createdAt,day:active.day,environment:active.environment,unit:active.unit,pool:active.environment==='pool'?active.pool:null,workouts:active.workouts,workoutDetails,notes:notes.value.trim(),distance:d,completedSets:s,durationSeconds:Math.round(mins*60),manual:!!active.manual};
 try{localStorage.setItem(HISTORY,JSON.stringify([...history,record]));localStorage.removeItem(ACTIVE);render();alert(t('SWIM activity saved on this device.','Actividad de natación guardada en este dispositivo.'));}catch(e){alert(t('Save failed. Your session has not been cleared.','No se pudo guardar. Tu sesión sigue disponible.'));}
 });
 recorderButton(t('BACK TO PAUSED','VOLVER A PAUSA'),()=>{if(active.manual){if(confirm(t('Discard manual entry?','¿Descartar registro manual?'))){saveActive(null);render();}}else{active.status='paused';saveActive(active);render();}});
}
const records=load(HISTORY,[]);
if(Array.isArray(records)&&records.length){
 const h=el('div','sw-plan');h.append(el('strong','',t('Recent SWIM activities','Actividades recientes de natación')));
 records.slice(-5).reverse().forEach(r=>{
  const item=el('div','sw-plan');
  // Older records do not have workoutDetails. Resolve their saved workout IDs using the catalog.
  const details=Array.isArray(r.workoutDetails)&&r.workoutDetails.length?r.workoutDetails:(Array.isArray(r.workouts)?r.workouts.map(w=>{const def=data.workouts.find(x=>x.id===w.id);return {id:w.id,category:def?.category||'',en:def?.en||w.id,es:def?.es||def?.en||w.id};}):[]);
  const names=details.map(w=>w[lang()]||w.en||w.id).filter(Boolean);
  item.append(el('strong','',names.length?names.join(' · '):t('SWIM activity','Actividad de natación')));
  const categories=[...new Set(details.map(w=>data.categories.find(c=>c.id===w.category)?.[lang()]||w.category).filter(Boolean))];
  const mode=r.environment==='open'?t('Open water','Aguas abiertas'):t('Pool','Alberca');
  item.append(el('small','',categories.concat(mode).join(' · ')));
  const date=new Date(r.savedAt);const dateText=Number.isNaN(date.getTime())?'':date.toLocaleDateString(lang()==='es'?'es-MX':'en-US');
  item.append(el('p','sw-note',dateText+' · '+r.distance+' '+r.unit+' · '+time(r.durationSeconds||0)+' · '+(r.completedSets??0)+' '+t('sets','series')));
  if(typeof r.notes==='string'&&r.notes.trim())item.append(el('p','sw-note',t('Note: ','Nota: ')+r.notes));
  h.append(item);
 });activityPanel.append(h);
}

}
root.TrainLabSwimUI={render};
})(window);
