/* SWIM planning and activity recording. Isolated storage keys. */
(function(root){'use strict';
const KEY='a1sc-swim-weekly-plan-v01',SETTINGS='a1sc-swim-settings-v01';
const ACTIVE='a1sc-swim-active-v01',HISTORY='a1sc-swim-activity-history-v01';
const DAY_TYPES='a1sc-swim-day-types-v01',DAY_ENV='a1sc-swim-day-environments-v01';
let view='workout';
let dayTypes=load(DAY_TYPES,{});
function currentDayType(){return ['training','recovery','rest'].includes(dayTypes[day])?dayTypes[day]:'training';}
const days={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
let day=(new Date().getDay()+6)%7,category='endurance';
function load(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch(e){return fallback;}}
let plan=load(KEY,{}),settings=Object.assign({environment:'pool',unit:'m',pool:25},load(SETTINGS,{}));
let dayEnvironments=load(DAY_ENV,{});
function daySettings(){return Object.assign({},settings,dayEnvironments[day]||{});}
function saveDaySettings(patch){dayEnvironments[day]=Object.assign({},daySettings(),patch);try{localStorage.setItem(DAY_ENV,JSON.stringify(dayEnvironments));}catch(e){alert(t('Could not save swimming environment.','No se pudo guardar el entorno de natación.'));}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(plan));localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch(e){}}
function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
function t(en,es){return lang()==='es'?es:en;}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function button(txt,click,active){const b=el('button',active?'sw-active':'',txt);b.type='button';b.addEventListener('click',click);return b;}
function gender(){try{return JSON.parse(localStorage.getItem('fitclimb-v1')||'{}').settings?.bodyIllustration==='female'?'female':'male';}catch(e){return 'male';}}
function distance(w){return Math.max(0,Number(w.perSet)||0)*Math.max(1,Number(w.sets)||1);}
function selected(){return Array.isArray(plan[day])?plan[day]:[];}
function render(){const host=document.getElementById('swim-builder'),data=root.TrainLabSwim;if(!host||!data)return;host.replaceChildren();
const settingsForDay=daySettings();
const panel=(title)=>{const p=el('section','sw-panel');p.append(el('h2','',title));host.append(p);return p;};
// Shared RUN/Total Body hierarchy: weekday strip, then the two view tabs.
const week=el('div','sw-workout-day-selector');week.style.cssText='margin:12px 0 10px';host.append(week);
const wd=el('div','sw-days');days[lang()].forEach((d,i)=>wd.append(button(d,()=>{day=i;render();},day===i)));week.append(wd);
const nav=el('div','sw-buttons sw-view-tabs');nav.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 16px';
const todayTab=button(t("Today's Workout",'Entrenamiento de hoy'),()=>{view='workout';render();},view==='workout');
const editTab=button(t('Edit Plan','Editar plan'),()=>{view='edit';render();},view==='edit');
[todayTab,editTab].forEach(b=>{b.style.cssText='width:100%;min-height:58px;font-weight:700;font-size:16px;border-radius:12px';nav.append(b);});host.append(nav);
if(view==='edit'){
 const typePanel=panel(t('Day type','Tipo de día'));
 const typeLabel=el('label');
 const typeSelect=el('select');
 [['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,label])=>{const option=el('option','',label);option.value=value;typeSelect.append(option);});
 typeSelect.value=currentDayType();typeSelect.addEventListener('change',()=>{dayTypes[day]=typeSelect.value;try{localStorage.setItem(DAY_TYPES,JSON.stringify(dayTypes));}catch(e){}render();});
 typeLabel.append(typeSelect);typePanel.append(typeLabel);
}

// Select the weekday before configuring its day type and swimming environment.
if(view==='edit'){
 const setup=panel(t('Swimming environment','Entorno de natación'));
 const env=el('div','sw-buttons');env.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px';
 ['pool','open'].forEach(v=>env.append(button(v==='pool'?t('Pool','Alberca'):t('Open water','Aguas abiertas'),()=>{saveDaySettings({environment:v});render();},settingsForDay.environment===v)));
 if(settingsForDay.environment==='pool'){
  [25,50].forEach(n=>env.append(button(n+' '+settingsForDay.unit,()=>{saveDaySettings({pool:n});render();},settingsForDay.pool===n)));
 }
 setup.append(env);
 if(settingsForDay.environment==='pool'){
  const opts=el('div','sw-settings');const unit=el('label','',t('Units','Unidades'));const select=el('select');[['m',t('Meters','Metros')],['yd',t('Yards','Yardas')]].forEach(([v,name])=>{const o=el('option','',name);o.value=v;select.append(o)});select.value=settingsForDay.unit;select.addEventListener('change',()=>{saveDaySettings({unit:select.value});render()});unit.append(select);opts.append(unit);
  const size=el('label','',t('Pool length','Longitud de alberca'));const field=el('input');field.type='number';field.min='1';field.step='0.01';field.value=settingsForDay.pool;field.addEventListener('change',()=>{const n=Number(field.value);if(Number.isFinite(n)&&n>0&&n<=1000){saveDaySettings({pool:n});render();}else field.value=settingsForDay.pool;});size.append(field);opts.append(size);setup.append(opts);
 }
}else{
 const envSummary=el('div','sw-note',settingsForDay.environment==='pool'?t('Pool','Alberca')+' · '+settingsForDay.pool+' '+settingsForDay.unit:t('Open water','Aguas abiertas'));
envSummary.style.cssText='margin:6px 0 10px;color:#b5c7d7;font-size:14px';week.append(envSummary);
}
if(view==='edit'){
 const focus=panel(t('Training focus','Enfoque de entrenamiento'));
 const cats=el('div','sw-buttons');data.categories.forEach(c=>cats.append(button(c[lang()],()=>{category=c.id;render();},category===c.id)));focus.append(cats);
 const exercises=panel(t('Select exercises','Seleccionar ejercicios'));
 const list=el('div');data.workouts.filter(w=>w.category===category).forEach(w=>{
 const row=el('label','sw-workout');const check=el('input');check.type='checkbox';check.checked=selected().some(x=>x.id===w.id);check.addEventListener('change',()=>{const existing=selected().filter(x=>x.id!==w.id);if(check.checked)existing.push({id:w.id,perSet:w.perSet,sets:w.sets,rest:w.rest});plan[day]=existing;persist();render()});row.append(check);
 const img=el('img','sw-icon');img.src='swim-icons/'+w.category+'-'+gender()+'.webp';img.alt='';img.loading='lazy';row.append(img);
 const info=el('span');info.append(el('strong','',w[lang()]));info.append(el('small','',w.sets+' × '+w.perSet+' '+settingsForDay.unit+(w.rest?' · '+w.rest+'s '+t('rest','descanso'):'')));row.append(info);list.append(row);
  // Configure a selected workout in its selection row; no duplicate planned-session list.
  if(check.checked){
   const entry=selected().find(x=>x.id===w.id);
   if(entry){const fields=el('div','sw-fields');fields.style.cssText='margin:4px 0 12px 32px;grid-template-columns:repeat(3,minmax(0,1fr))';
    [['perSet',t('Distance per set','Distancia por serie'),1],['sets',t('Sets','Series'),1],['rest',t('Rest (sec)','Descanso (seg)'),0]].forEach(([key,label,min])=>{
     const wrapper=el('label','',label),input=el('input');input.type='number';input.min=String(min);input.step='1';input.value=entry[key];
     input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isFinite(n)&&n>=min&&n<=100000){entry[key]=Math.round(n);persist();render();}else input.value=entry[key];});
     wrapper.append(input);fields.append(wrapper);
    });list.append(fields);
   }
  }
});exercises.append(list);}
if(view==='edit')return;
// Per-exercise logging: timers only prepare a draft; Log Activity commits it.
const activityPanel=el('section','sw-activity-list');host.append(activityPanel);
const historyRead=()=>{const v=load(HISTORY,[]);return Array.isArray(v)?v:[];};
const clockText=(n)=>{n=Math.max(0,Math.floor(Number(n)||0));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,'0')).join(':');};
const active=load(ACTIVE,null);
const elapsed=(a)=>Math.max(0,Math.floor(((a.accumulatedMs||0)+(a.status==='running'?Math.max(0,Date.now()-a.startedAt):0))/1000));
const setActive=(a)=>{try{if(a)localStorage.setItem(ACTIVE,JSON.stringify(a));else localStorage.removeItem(ACTIVE);}catch(e){alert(t('Storage unavailable.','Almacenamiento no disponible.'));}};
const field=(parent,label,value,min=0)=>{const l=el('label','',label),i=el('input');i.type='number';i.min=String(min);i.step='1';i.value=String(value);l.append(i);parent.append(l);return i;};
const actions=(parent)=>{const row=el('div','sw-buttons');parent.append(row);return row;};
const drafts={};
selected().forEach((entry)=>{
 const def=data.workouts.find(w=>w.id===entry.id);if(!def)return;
 const card=el('div','sw-plan sw-exercise-card');card.style.cssText='border:0;border-bottom:1px solid #29465e;padding:14px 0';activityPanel.append(card);
 const header=el('div');header.style.cssText='display:flex;align-items:center;gap:14px;cursor:pointer';
 const img=el('img','sw-icon');img.src='swim-icons/'+def.category+'-'+gender()+'.webp';img.alt='';img.loading='lazy';img.style.cssText='width:82px;height:82px;object-fit:cover;border-radius:10px';header.append(img);
 const description=el('div');description.style.flex='1';description.append(el('strong','',def[lang()]+' ▸'));description.append(el('small','',t('Planned: ','Planeado: ')+distance(entry)+' '+settingsForDay.unit));header.append(description);card.append(header);
 const details=el('div');details.style.cssText='display:none;padding:10px 0 0';card.append(details);
 header.addEventListener('click',()=>{details.style.display=details.style.display==='none'?'block':'none';});
 if(active&&active.workoutId===entry.id)details.style.display='block';
 const existingTimer=active&&active.workoutId===entry.id?active:null;
 if(active&&!active.workoutId){details.append(el('small','',t('An older unfinished session is stored; finish it before starting a new timer.','Hay una sesión anterior sin terminar; termínala antes de iniciar otro cronómetro.')));}
 const reviewing=existingTimer?.status==='review';
 const timing=existingTimer&&(existingTimer.status==='running'||existingTimer.status==='paused');
 if(reviewing){const heading=el('strong','',t('Review completed swim — correct your results, then log','Revisa el nado — corrige los resultados y registra'));details.append(heading);}
 const review=el('div','sw-review-fields');review.style.display=timing?'none':'block';details.append(review);
 const grid=el('div','sw-fields');grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';review.append(grid);
 const dist=field(grid,t('Actual distance ('+settingsForDay.unit+')','Distancia real ('+settingsForDay.unit+')'),distance(entry));
 const sets=field(grid,t('Completed sets','Series completadas'),entry.sets,0);
 const hrs=field(grid,t('Hours','Horas'),existingTimer?.status==='review'?Math.floor(elapsed(existingTimer)/3600):0);
 const mins=field(grid,t('Minutes','Minutos'),existingTimer?.status==='review'?Math.floor(elapsed(existingTimer)%3600/60):0);
 const secs=field(grid,t('Seconds','Segundos'),existingTimer?.status==='review'?elapsed(existingTimer)%60:0);
 const note=el('label','',t('Notes (optional)','Notas (opcional)'));const noteInput=el('textarea');noteInput.rows=2;noteInput.maxLength=1000;noteInput.placeholder=t('Session notes','Notas de la sesión');noteInput.style.cssText='width:100%;box-sizing:border-box;padding:9px;background:#091d2e;color:white;border:1px solid #42607a;border-radius:8px';note.append(noteInput);review.append(note);
 const timerLine=el('div','sw-note',existingTimer?clockText(elapsed(existingTimer)):clockText(0));
 timerLine.style.cssText='text-align:center;font-size:clamp(32px,9vw,56px);font-weight:800;letter-spacing:2px;font-variant-numeric:tabular-nums;padding:14px 0';
 if(!reviewing)details.insertBefore(timerLine,review);else review.prepend(timerLine);
 if(existingTimer?.status==='running'){const interval=setInterval(()=>{if(!timerLine.isConnected){clearInterval(interval);return;}timerLine.textContent=clockText(elapsed(existingTimer));},1000);}
 const row=actions(details);row.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px';
 if(!existingTimer){
  row.append(button(t('Start timer','Iniciar cronómetro'),()=>{if(active){alert(t('Finish the existing timer first.','Finaliza el cronómetro activo primero.'));return;}setActive({workoutId:entry.id,status:'running',startedAt:Date.now(),accumulatedMs:0});render();}));
 }else if(existingTimer.status==='running'){
  row.append(button(t('Pause','Pausar'),()=>{existingTimer.accumulatedMs+=Date.now()-existingTimer.startedAt;existingTimer.startedAt=0;existingTimer.status='paused';setActive(existingTimer);render();}));
  row.append(button(t('Finish & Review','Finalizar y revisar'),()=>{existingTimer.accumulatedMs+=Date.now()-existingTimer.startedAt;existingTimer.startedAt=0;existingTimer.status='review';setActive(existingTimer);render();}));
 }else if(existingTimer.status==='paused'){
  row.append(button(t('Resume','Reanudar'),()=>{existingTimer.startedAt=Date.now();existingTimer.status='running';setActive(existingTimer);render();}));
  row.append(button(t('Finish & Review','Finalizar y revisar'),()=>{existingTimer.status='review';setActive(existingTimer);render();}));
 }else{
  row.append(button(t('Clear timer','Borrar cronómetro'),()=>{setActive(null);render();}));
 }
 if(!timing){
 const logButton=button(t('Log Activity','Registrar actividad'),()=>{

  const d=Number(dist.value),n=Number(sets.value),h=Number(hrs.value),m=Number(mins.value),sec=Number(secs.value);
  if(![d,n,h,m,sec].every(Number.isFinite)||d<0||!Number.isInteger(d)||!Number.isInteger(n)||n<0||![h,m,sec].every(Number.isInteger)||h<0||m<0||m>59||sec<0||sec>59){alert(t('Enter valid activity details.','Ingresa datos válidos.'));return;}
  const rec={id:'swim-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),savedAt:new Date().toISOString(),day,environment:settingsForDay.environment,unit:settingsForDay.unit,pool:settingsForDay.environment==='pool'?settingsForDay.pool:null,workouts:[{...entry}],workoutDetails:[{id:def.id,category:def.category,en:def.en,es:def.es}],distance:d,completedSets:n,durationSeconds:h*3600+m*60+sec,notes:noteInput.value.trim(),manual:!existingTimer};
  try{localStorage.setItem(HISTORY,JSON.stringify([...historyRead(),rec]));if(existingTimer)setActive(null);render();}catch(e){alert(t('Save failed; try again.','No se pudo guardar; inténtalo de nuevo.'));}
 });
 logButton.style.cssText='grid-column:1/-1;min-height:58px;font-size:17px;font-weight:700';
 row.append(logButton);
 }
 Array.from(row.children).forEach(b=>{b.style.minHeight='62px';b.style.fontSize='17px';b.style.fontWeight='700';});
});
if(!selected().length)activityPanel.append(el('p','sw-note',t('Add exercises in Edit Plan first.','Agrega ejercicios en Editar plan.')));
const records=historyRead();
if(records.length){
 const list=el('div','sw-plan');list.append(el('strong','',t('Logged activities','Actividades registradas')));activityPanel.append(list);
 records.slice().reverse().forEach(r=>{
  const item=el('div','sw-plan');list.append(item);
  const details=Array.isArray(r.workoutDetails)&&r.workoutDetails.length?r.workoutDetails:(Array.isArray(r.workouts)?r.workouts.map(w=>{const d=data.workouts.find(x=>x.id===w.id);return {id:w.id,en:d?.en||w.id,es:d?.es||d?.en||w.id};}):[]);
  item.append(el('strong','',details.map(d=>d[lang()]||d.en||d.id).join(' · ')||t('SWIM activity','Actividad de natación')));
  const date=new Date(r.savedAt);const dateText=Number.isNaN(date.getTime())?'':date.toLocaleDateString(lang()==='es'?'es-MX':'en-US');
  item.append(el('small','',dateText+' · '+r.distance+' '+(r.unit||'m')+' · '+clockText(r.durationSeconds)+' · '+(r.completedSets||0)+' '+t('sets','series')));
  if(r.notes)item.append(el('small','',r.notes));
  const row=actions(item);
  row.append(button(t('Edit','Editar'),()=>{
   if(item.querySelector('.sw-fields'))return;
   const grid=el('div','sw-fields');grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';item.append(grid);
   const d=field(grid,t('Distance','Distancia'),r.distance),n=field(grid,t('Sets','Series'),r.completedSets);
   const h=field(grid,t('Hours','Horas'),Math.floor((r.durationSeconds||0)/3600)),m=field(grid,t('Minutes','Minutos'),Math.floor((r.durationSeconds||0)%3600/60)),sec=field(grid,t('Seconds','Segundos'),(r.durationSeconds||0)%60);
   const editActions=actions(item);
   editActions.append(button(t('Save changes','Guardar cambios'),()=>{
    const vals=[d,n,h,m,sec].map(x=>Number(x.value));if(!vals.every(Number.isInteger)||vals.some(x=>x<0)||vals[3]>59||vals[4]>59){alert(t('Enter valid results.','Ingresa resultados válidos.'));return;}
    const updated=historyRead().map(x=>x.id===r.id?{...x,distance:vals[0],completedSets:vals[1],durationSeconds:vals[2]*3600+vals[3]*60+vals[4]}:x);
    try{localStorage.setItem(HISTORY,JSON.stringify(updated));render();}catch(e){alert(t('Save failed.','No se pudo guardar.'));}
   }));
   editActions.append(button(t('Cancel','Cancelar'),render));
  }));
  row.append(button(t('Delete','Eliminar'),()=>{
   const backdrop=el('div');backdrop.style.cssText='position:fixed;inset:0;background:#000b;display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
   const dialog=el('div','sw-panel');dialog.style.cssText='max-width:350px;width:100%;background:#10273d;padding:20px;border:1px solid #42607a;border-radius:14px;color:#fff';
   dialog.append(el('strong','',t('Delete this activity? This cannot be undone.','¿Eliminar esta actividad? Esta acción no se puede deshacer.')));
   const buttons=actions(dialog);
   buttons.append(button(t('Cancel','Cancelar'),()=>backdrop.remove()));
   buttons.append(button(t('Delete','Eliminar'),()=>{try{localStorage.setItem(HISTORY,JSON.stringify(historyRead().filter(x=>x.id!==r.id)));backdrop.remove();render();}catch(e){alert(t('Delete failed.','No se pudo eliminar.'));}}));
   backdrop.append(dialog);document.body.append(backdrop);
  }));
 });
}
}
root.TrainLabSwimUI={render};
})(window);
