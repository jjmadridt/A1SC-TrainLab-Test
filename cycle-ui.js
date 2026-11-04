/* A1SC Cycle v0.3 — weekly workout selection only. No timer or activity logging. */
(function(root){
 'use strict';
 const KEY='a1sc-cycle-weekly-plan-v03';
 const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const DAYS_ES=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 let selectedDay=(new Date().getDay()+6)%7, selectedCategory='endurance';
 let plan={};
 try {const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))plan=value;}catch(e){}
 function getWorkouts(){const mod=root.TrainLabCycle;return mod&&Array.isArray(mod.workouts)?mod.workouts:[];}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(plan));return true;}catch(e){return false;}}
 function selected(){return Array.isArray(plan[selectedDay])?plan[selectedDay]:[];}
 function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
 function t(en,es){return lang()==='es'?es:en;}
 function make(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;}
 function render(){
  const mount=document.getElementById('cycle-builder');if(!mount)return;
  mount.replaceChildren();const workouts=getWorkouts();
  if(!workouts.length){mount.appendChild(make('p','cy-empty',t('Cycle workout library unavailable.','La biblioteca de ciclismo no está disponible.')));return;}
  const intro=make('div','cy-panel');intro.appendChild(make('h2','',t('Weekly Cycle Plan','Plan semanal de ciclismo')));
  intro.appendChild(make('p','cy-note',t('Choose one or more workouts for each weekday. Your selections repeat every week and are saved on this device.','Selecciona uno o más entrenamientos para cada día. Se repiten semanalmente y se guardan en este dispositivo.')));
  const days=make('div','cy-days');(lang()==='es'?DAYS_ES:DAYS).forEach((name,i)=>{const b=make('button',i===selectedDay?'cy-active':'',name);b.type='button';b.setAttribute('aria-pressed',String(i===selectedDay));b.addEventListener('click',()=>{selectedDay=i;render();});days.appendChild(b);});intro.appendChild(days);mount.appendChild(intro);
  const summary=make('div','cy-panel');summary.appendChild(make('h3','',t('Selected workouts','Entrenamientos seleccionados')+' — '+(lang()==='es'?DAYS_ES:DAYS)[selectedDay]));
  const current=selected();if(!current.length)summary.appendChild(make('p','cy-empty',t('No workouts selected for this day.','No hay entrenamientos seleccionados para este día.')));
  current.forEach(id=>{const w=workouts.find(w=>w.id===id);if(w)summary.appendChild(make('div','cy-plan-item',w.name+' · '+w.defaultDurationMinutes+' min'));});mount.appendChild(summary);
  const catalog=make('div','cy-panel');catalog.appendChild(make('h2','',t('Workout library','Biblioteca de entrenamientos')));
  const categories=root.TrainLabCycle.categories||[];const tabs=make('div','cy-cats');categories.forEach(c=>{const b=make('button',c.id===selectedCategory?'cy-active':'',c.name);b.type='button';b.setAttribute('aria-pressed',String(c.id===selectedCategory));b.addEventListener('click',()=>{selectedCategory=c.id;render();});tabs.appendChild(b);});catalog.appendChild(tabs);
  workouts.filter(w=>w.category===selectedCategory).forEach(w=>{const label=make('label','cy-workout');const cb=make('input');cb.type='checkbox';cb.checked=current.includes(w.id);cb.addEventListener('change',()=>{const next=new Set(selected());if(cb.checked)next.add(w.id);else next.delete(w.id);plan[selectedDay]=workouts.filter(x=>next.has(x.id)).map(x=>x.id);if(!save()){root.alert(t('Could not save your plan. Check browser storage settings.','No se pudo guardar el plan. Revisa el almacenamiento del navegador.'));}render();});const desc=make('span');desc.appendChild(make('strong','',w.name));desc.appendChild(make('small','',w.purpose+' · '+w.defaultDurationMinutes+' min'));label.append(cb,desc);catalog.appendChild(label);});mount.appendChild(catalog);
  mount.appendChild(make('p','cy-note',t('Cycle v0.3: planning only. Guided sessions, timers, workout logging and progress tracking are not active yet.','Cycle v0.3: solo planificación. Las sesiones guiadas, cronómetros, registros y seguimiento aún no están activos.')));
 }
 root.TrainLabCycleUI={render};
})(window);
