/* A1SC TrainLab — Triathlon Step 17C: independent weekly Edit Plan. */
(function(root){'use strict';
 const KEY='a1sc-triathlon-weekly-plan-v01';
 const LOG_KEY='a1sc-triathlon-activity-log-v01';
 let session=null;
 const sessions=new Map();
 let tick=null;
 function elapsed(){return session?session.elapsed+(session.startedAt?Math.max(0,Date.now()-session.startedAt):0):0;}
 function clock(ms){let n=Math.floor(ms/1000);return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
 function stopTick(){if(tick){clearInterval(tick);tick=null;}}
 function startTick(){stopTick();tick=setInterval(()=>{const n=document.getElementById('tri-clock');if(n)n.textContent=clock(elapsed());},500);}

 const DAYS={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
 const CATALOG={
  Swim:[['Continuous Swim','Nado continuo','swim-icons/endurance-male.webp'],['Technique Drills','Ejercicios de técnica','swim-icons/technique-male.webp'],['Interval Sets','Series de intervalos','swim-icons/intervals-male.webp'],['Threshold Swim','Nado a umbral','swim-icons/endurance-male.webp'],['Open Water Sighting','Orientación en aguas abiertas','swim-icons/technique-male.webp']],
  Bike:[['Endurance Ride','Rodaje de resistencia','cycle-icons/spin-male.webp'],['Tempo Ride','Rodaje tempo','cycle-icons/spin-male.webp'],['Threshold Intervals','Intervalos de umbral','cycle-icons/speed-male.webp'],['VO₂max Intervals','Intervalos VO₂max','cycle-icons/speed-male.webp'],['Cadence Drills','Ejercicios de cadencia','cycle-icons/climb-male.webp']],
  Strength:[['Goblet squat','Sentadilla goblet','anatomy/goblet-squat-male.png'],['Romanian deadlift','Peso muerto rumano','anatomy/romanian-deadlift-male.png'],['Split Squat','Sentadilla dividida','anatomy/leg-press-male.png'],['Standing calf raise','Elevación de talones','anatomy/standing-calf-raise-male.png'],['Seated cable row','Remo en polea sentado','anatomy/seated-cable-row-male.png'],['Side plank','Plancha lateral','anatomy/side-plank-male.png'],['Pallof press','Press Pallof','anatomy/pallof-press-male.png'],['Dead bug','Bicho muerto','anatomy/dead-bug-male.png']],
  Run:[['Easy Aerobic Run','Carrera aeróbica suave','anatomy/run/easy-run-male.png'],['Long Run','Carrera larga','anatomy/run/long-run-male.png'],['Tempo Run','Carrera tempo','anatomy/run/tempo-run-male.png'],['Interval Repeats','Repeticiones por intervalos','anatomy/run/short-intervals-male.png'],['Strides','Progresiones','anatomy/run/strides-male.png']]
 };
 const STRENGTH_PRESETS={
  'Goblet squat':{sets:3,reps:10,equipment:'Dumbbell or kettlebell'},
  'Romanian deadlift':{sets:3,reps:8,equipment:'Dumbbells • weight per hand'},
  'Split Squat':{sets:3,reps:8,equipment:'Dumbbells • reps per leg'},
  'Standing calf raise':{sets:3,reps:12,equipment:'Standing calf machine or dumbbells'},
  'Seated cable row':{sets:3,reps:10,equipment:'Cable machine'},
  'Side plank':{sets:3,reps:30,equipment:'Exercise mat • seconds per side',timed:true},
  'Pallof press':{sets:3,reps:10,equipment:'Cable or resistance band • reps per side'},
  'Dead bug':{sets:3,reps:8,equipment:'Exercise mat • reps per side'}
 };
 const activityUndo={previous:null,exercise:null};
 function readActivities(){try{const value=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');return Array.isArray(value)?value:[];}catch(e){return [];}}
 function writeActivities(items){localStorage.setItem(LOG_KEY,JSON.stringify(items));}
 function activitySummary(entry){
  const d=entry.details||{};
  return [d.distance?d.distance+' '+(d.distanceUnit||''):null,d.durationMin?d.durationMin+' '+t('min','min'):null,d.rpe?'RPE '+d.rpe:null].filter(Boolean).join(' · ');
 }
 function activityActions(entry,host){
  if(entry.discipline==='Strength')return;
  const row=el('div','tri-activity-entry');
  row.append(el('span','',activitySummary(entry)||t('Activity logged','Actividad registrada')));
  const buttons=el('div','tri-set-actions');
  buttons.append(button('✎',()=>{
   const editor=el('div','tri-strength-fields');
   const d=entry.details||{};
   function editField(label,key,values){
    const wrapper=el('label','',label);let field;
    if(values){field=el('select','tri-type');values.forEach(([v,l])=>{const option=el('option','',l);option.value=v;field.append(option);});}
    else{field=el('input');field.type='number';field.min='0';field.step='any';}
    field.value=d[key]??'';wrapper.append(field);editor.append(wrapper);return field;
   }
   const unit=editField(t('Distance unit','Unidad de distancia'),'distanceUnit',entry.discipline==='Swim'?[['m','m'],['yd','yd']]:[['km','km'],['mi','mi']]);
   const distance=editField(t('Distance','Distancia'),'distance');
   const duration=editField(t('Duration (minutes)','Duración (minutos)'),'durationMin');
   const rpe=editField('RPE (1–10)','rpe');
   const environment=entry.discipline==='Swim'?editField(t('Environment','Entorno'),'environment',[['pool',t('Pool','Alberca')],['open-water',t('Open Water','Aguas abiertas')]]):null;
   const rideType=entry.discipline==='Bike'?editField(t('Ride type','Tipo de ciclismo'),'rideType',[['indoor',t('Indoor','Interior')],['outdoor',t('Outdoor','Exterior')]]):null;
   const actions=el('div','tri-set-actions');
   actions.append(button(t('Save change','Guardar cambio'),()=>{
    const dist=Number(distance.value||0),mins=Number(duration.value||0),effort=Number(rpe.value||0);
    if(!Number.isFinite(dist)||!Number.isFinite(mins)||dist<0||mins<0||(!dist&&!mins)||(rpe.value&&(!Number.isFinite(effort)||effort<1||effort>10))){
     alert(t('Enter a valid distance or duration and RPE between 1 and 10.','Ingresa distancia o duración válida y RPE entre 1 y 10.'));return;
    }
    const current=readActivities(),index=current.findIndex(x=>x.id===entry.id);
    if(index<0){alert(t('Activity no longer exists.','La actividad ya no existe.'));return;}
    const updated={...current[index],details:{...current[index].details,distance:distance.value,distanceUnit:unit.value,durationMin:duration.value,rpe:rpe.value,environment:environment?.value||'',rideType:rideType?.value||''}};
    const next=current.slice();next[index]=updated;
    try{writeActivities(next);activityUndo.previous=current;activityUndo.exercise=canonical(entry.exercise);render();}catch(e){alert(t('Could not save change.','No se pudo guardar el cambio.'));}
   }));
   actions.append(button(t('Cancel','Cancelar'),()=>render()));
   row.after(editor,actions);
   buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
  }));
  buttons.append(button('×',()=>{
   if(!confirm(t('Delete this activity? This cannot be undone unless you use Undo before leaving this page.','¿Eliminar esta actividad? Puedes deshacerlo antes de salir de esta página.')))return;
   const current=readActivities();
   try{writeActivities(current.filter(x=>x.id!==entry.id));activityUndo.previous=current;activityUndo.exercise=canonical(entry.exercise);render();}catch(e){alert(t('Could not delete activity.','No se pudo eliminar la actividad.'));}
  }));
  row.append(buttons);host.append(row);
 }
 const SET_LOG_KEY='a1sc-triathlon-strength-sets-v01';
 const undoBySession=new Map();
 function readSets(){try{const v=JSON.parse(localStorage.getItem(SET_LOG_KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
 function saveSets(v){localStorage.setItem(SET_LOG_KEY,JSON.stringify(v));}
 function strengthPanel(id,host,session){
  id=canonical(id);const cfg=STRENGTH_PRESETS[id];if(!cfg)return;
  const panel=el('div','tri-strength');
  const title=el('div','tri-muted',cfg.equipment);panel.append(title);
  const settings=el('div','tri-strength-fields');
  const unitWrap=el('label','',t('Exercise weight unit','Unidad de peso'));
  const unit=el('select','tri-type');[['lb','lb'],['kg','kg']].forEach(([v,label])=>{const o=el('option','',label);o.value=v;unit.append(o);});unit.value=session?.unit||'lb';unitWrap.append(unit);if(!cfg.timed)settings.append(unitWrap);
  const setsWrap=el('label','',t('Planned sets (1–15)','Series planeadas (1–15)'));
  const planned=el('select','tri-type');for(let n=1;n<=15;n++){const o=el('option','',String(n));o.value=String(n);planned.append(o);}
  planned.value=String(session?.planned||cfg.sets);setsWrap.append(planned);settings.append(setsWrap);panel.append(settings);
  const existing=readSets().filter(x=>x.exercise===id&&x.day===day&&x.sessionId===session.sessionId);
  const status=el('div','tri-muted',existing.length+'/'+planned.value+' '+t('logged','registradas'));panel.append(status);
  const inputs=el('div','tri-strength-fields');
  const weightLabel=el('label','',t('Weight','Peso')+' ('+unit.value+')');
  const weight=el('input');weight.type='number';weight.min='0';weight.step='0.5';weight.placeholder='0';weight.value=session?.weight??'';weightLabel.append(weight);if(!cfg.timed)inputs.append(weightLabel);
  const repsLabel=el('label','',cfg.timed?t('Seconds per side','Segundos por lado'):t('Reps','Repeticiones'));
  const reps=el('input');reps.type='number';reps.min='1';reps.step='1';reps.value=String(session?.reps||cfg.reps);repsLabel.append(reps);inputs.append(repsLabel);panel.append(inputs);
  const list=el('div','tri-muted');
  existing.forEach((entry,i)=>{
   const line=el('div','tri-set-line');
   const summary=el('span','',t('Set ','Serie ')+(i+1)+' · '+(cfg.timed?entry.reps+' s':(window.TrainLabStrengthCore.toDisplay(entry.weightLb,entry.unit)).toFixed(1)+' '+entry.unit+' × '+entry.reps));
   line.append(summary);
   const controls=el('div','tri-set-actions');
   controls.append(button('✎',()=>{
    const editor=el('div','tri-strength-fields');
    const weightEdit=el('input');weightEdit.type='number';weightEdit.min='0';weightEdit.step='0.5';weightEdit.value=String(window.TrainLabStrengthCore.toDisplay(entry.weightLb,entry.unit));
    const repsEdit=el('input');repsEdit.type='number';repsEdit.min='1';repsEdit.step='1';repsEdit.value=String(entry.reps);
    if(!cfg.timed){const wLabel=el('label','',t('Weight','Peso')+' ('+entry.unit+')');wLabel.append(weightEdit);editor.append(wLabel);}
    const rLabel=el('label','',cfg.timed?t('Seconds per side','Segundos por lado'):t('Reps','Repeticiones'));rLabel.append(repsEdit);editor.append(rLabel);
    const actions=el('div','tri-set-actions');
    actions.append(button(t('Save change','Guardar cambio'),()=>{
     const w=cfg.timed?0:Number(weightEdit.value),n=Number(repsEdit.value);
     if(!window.TrainLabStrengthCore.validSet(w,n)){alert(t('Enter valid values.','Ingresa valores válidos.'));return;}
     const all=readSets();const pos=all.findIndex(x=>x.id===entry.id);if(pos<0)return;
     undoBySession.set(session.sessionId,all.slice());
     all[pos]={...all[pos],weightLb:window.TrainLabStrengthCore.toLbs(w,entry.unit),reps:n};
     try{saveSets(all);render();}catch(e){alert(t('Unable to save change.','No se pudo guardar el cambio.'));}
    }));
    actions.append(button(t('Cancel','Cancelar'),()=>render()));
    line.after(editor,actions);
    controls.querySelectorAll('button').forEach(b=>b.disabled=true);
   }));
   controls.append(button('×',()=>{
    if(!confirm(t('Delete this set?','¿Eliminar esta serie?')))return;
    const all=readSets();undoBySession.set(session.sessionId,all.slice());
    try{saveSets(all.filter(x=>x.id!==entry.id));render();}catch(e){alert(t('Unable to delete set.','No se pudo eliminar la serie.'));}
   }));
   line.append(controls);list.append(line);
  });panel.append(list);
  if(undoBySession.has(session.sessionId)){
   const undo=button(t('Undo last set change','Deshacer último cambio de serie'),()=>{
    const previous=undoBySession.get(session.sessionId);
    try{saveSets(previous);undoBySession.delete(session.sessionId);render();}catch(e){alert(t('Unable to undo change.','No se pudo deshacer el cambio.'));}
   });
   undo.className='tri-undo';panel.append(undo);
  }
  const log=button(t('+ Log set','+ Registrar serie'),()=>{
   const n=Number(reps.value),w=cfg.timed?0:Number(weight.value||0);
   if(!window.TrainLabStrengthCore.validSet(w,n)){alert(t('Enter valid values.','Ingresa valores válidos.'));return;}
   const count=readSets().filter(x=>x.exercise===id&&x.day===day&&x.sessionId===session.sessionId).length;
   if(count>=Number(planned.value))return;
   session.unit=unit.value;session.planned=Number(planned.value);session.weight=weight.value;session.reps=reps.value;
   const all=readSets();undoBySession.set(session.sessionId,all.slice());all.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),exercise:id,day,sessionId:session.sessionId,unit:unit.value,weightLb:window.TrainLabStrengthCore.toLbs(w,unit.value),reps:n,timestamp:Date.now()});
   try{saveSets(all);render();}catch(e){alert(t('Unable to save set.','No se pudo guardar la serie.'));}
  });
  log.disabled=existing.length>=Number(planned.value);planned.addEventListener('change',()=>{session.planned=Number(planned.value);render();});unit.addEventListener('change',()=>{session.unit=unit.value;session.weight=weight.value;session.reps=reps.value;render();});
  panel.append(log);host.append(panel);
 }
 const ENDURANCE_DEFAULTS={
  Swim:{distance:'m',distanceLabel:'Distance',duration:'Duration (min)',effort:'RPE (1–10)'},
  Bike:{distance:'km',distanceLabel:'Distance',duration:'Duration (min)',effort:'RPE (1–10)'},
  Run:{distance:'km',distanceLabel:'Distance',duration:'Duration (min)',effort:'RPE (1–10)'}
 };
 function endurancePanel(cat,host,work){
  const config=ENDURANCE_DEFAULTS[cat];if(!config)return;
  const panel=el('div','tri-strength');
  const heading=el('div','tri-muted',t('Activity details','Detalles de actividad'));panel.append(heading);
  const grid=el('div','tri-strength-fields');
  function field(label,key,opts){
   const wrap=el('label','',label);
   let input;
   if(opts){input=el('select','tri-type');opts.forEach(([value,text])=>{const option=el('option','',text);option.value=value;input.append(option);});}
   else{input=el('input');input.type='number';input.min='0';input.step='any';}
   input.value=work[key]??'';input.addEventListener('change',()=>{work[key]=input.value;});
   wrap.append(input);grid.append(wrap);return input;
  }
  if(cat==='Swim'){
   field(t('Environment','Entorno'),'environment',[['pool',t('Pool','Alberca')],['open-water',t('Open Water','Aguas abiertas')]]);
   field(t('Distance unit','Unidad de distancia'),'distanceUnit',[['m','m'],['yd','yd']]);
  }else{
   field(t('Distance unit','Unidad de distancia'),'distanceUnit',[['km','km'],['mi','mi']]);
   if(cat==='Bike')field(t('Ride type','Tipo de ciclismo'),'rideType',[['indoor',t('Indoor','Interior')],['outdoor',t('Outdoor','Exterior')]]);
  }
  field(t('Distance','Distancia'),'distance');
  field(t('Duration (minutes)','Duración (minutos)'),'durationMin');
  field(t('Effort (RPE 1–10)','Esfuerzo (RPE 1–10)'),'rpe');
  panel.append(grid);
  panel.append(el('p','tri-muted',t('Enter your completed workout details before Finish & Review. No timer starts automatically.','Ingresa los datos de tu entrenamiento antes de Terminar y revisar. No se inicia un cronómetro automáticamente.')));
  host.append(panel);
 }
 const CATEGORY_ES={Swim:'Natación',Bike:'Ciclismo',Run:'Carrera',Strength:'Fuerza'};
 let data={};try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))data=v;}catch(e){}
 let day=(new Date().getDay()+6)%7,view='workout',category='Swim';
 let activeId=null,scrollToActive=false;
 function newSession(id){return {id,sessionId:Date.now()+'-'+Math.random().toString(36).slice(2),elapsed:0,startedAt:null,phase:'active',notes:''};}
 function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
 function t(en,es){return lang()==='es'?es:en;}
 function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
 function button(label,fn,active){const b=el('button',active?'tri-active':'',label);b.type='button';b.addEventListener('click',fn);return b;}
 function record(){return data[day]||{type:'training',items:[]};}
 function save(r){data[day]=r;try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){alert(t('Unable to save plan.','No se pudo guardar el plan.'));}render();}
 function imageFor(item){let path=item[2];let gender='male';try{const p=JSON.parse(localStorage.getItem('a1sc-profile-v1')||'{}');if(p.gender==='female')gender='female';}catch(e){}return path.replace('-male.', '-'+gender+'.');}
 function itemRow(item,checked,onClick){const row=el('div','tri-item');const img=el('img');img.src=imageFor(item);img.alt='';img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src='home-images/triathlon.webp';};row.append(img);const name=el('div','tri-item-name',lang()==='es'?item[1]:item[0]);row.append(name);if(onClick){const box=el('input','tri-select-box');box.type='checkbox';box.checked=!!checked;box.setAttribute('aria-label',(checked?t('Remove ','Quitar '):t('Select ','Seleccionar '))+(lang()==='es'?item[1]:item[0]));box.addEventListener('click',e=>e.stopPropagation());box.addEventListener('change',()=>onClick());row.append(box);}else if(checked)row.append(el('span','tri-check','✓'));if(onClick){row.tabIndex=0;row.setAttribute('role','button');row.addEventListener('click',onClick);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}});}return row;}
 const ALIASES={'Romanian Deadlift':'Romanian deadlift','Standing Calf Raise':'Standing calf raise','Seated Cable Row':'Seated cable row','Pallof Press':'Pallof press','Side Plank':'Side plank','Dead Bug':'Dead bug','Goblet Squat':'Goblet squat'};
 function canonical(id){return ALIASES[id]||id;}
 function find(id){id=canonical(id);for(const [cat,items] of Object.entries(CATALOG)){const item=items.find(x=>x[0]===id);if(item)return {cat,item};}return null;}
 function render(){stopTick();const host=document.getElementById('tri-builder');if(!host)return;host.replaceChildren();
 const css=el('style');css.textContent=`#tri-builder{color:#eaf4fc}#tri-builder button,#tri-builder select{font:inherit}#tri-builder .tri-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:12px 0}#tri-builder .tri-days button{padding:10px 0;border:1px solid #355875;border-radius:9px;background:#10273b;color:#d9eafb;font-size:12px}#tri-builder .tri-days button.tri-active,#tri-builder .tri-tabs button.tri-active,#tri-builder .tri-cats button.tri-active{background:#1676b7;border-color:#4bb3ed;color:white}#tri-builder .tri-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 18px}#tri-builder .tri-tabs button{min-height:58px;border-radius:12px;border:1px solid #355875;background:#112c44;color:white;font-weight:700}#tri-builder .tri-section{margin:14px 0}#tri-builder h3{font-size:16px;margin:14px 0 9px}#tri-builder .tri-type{width:100%;padding:13px;border-radius:11px;border:1px solid #41617b;background:#10283d;color:white}#tri-builder .tri-cats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#tri-builder .tri-cats button{padding:13px 4px;background:#10283d;color:white;border:1px solid #41617b;border-radius:11px;font-weight:700}#tri-builder .tri-cats button{padding:8px 4px;min-height:102px;display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;overflow:hidden}#tri-builder .tri-category-icon{display:block;width:72px;height:72px;object-fit:contain;border-radius:8px}#tri-builder .tri-item{display:flex;align-items:center;gap:12px;min-height:74px;padding:9px 5px;border-bottom:1px solid #28445c;cursor:pointer}#tri-builder .tri-item img{width:68px;height:60px;object-fit:cover;border-radius:9px;background:#0c2235}#tri-builder .tri-item-name{flex:1;font-weight:600}#tri-builder .tri-check{color:#ff4a9b;font-size:25px;font-weight:800}#tri-builder .tri-select-box{width:22px;height:22px;min-width:22px;accent-color:#ff4a9b;cursor:pointer;margin:0 8px 0 auto}#tri-builder .tri-item:has(.tri-select-box:checked){background:rgba(20,105,158,.08)}#tri-builder .tri-muted{color:#a8bfd0;font-size:13px}#tri-builder .tri-session{border:1px solid #355875;border-radius:12px;padding:14px;margin:12px 0;background:#10283d}#tri-builder .tri-session{scroll-margin-top:12px}#tri-builder .tri-progression{margin-top:12px;display:flex;justify-content:flex-end}#tri-builder .tri-progression button{padding:10px 14px;border:1px solid #41617b;border-radius:9px;background:#214e61;color:white;font-weight:700}#tri-builder .tri-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#tri-builder .tri-controls button{padding:11px 15px;border:1px solid #4a85aa;border-radius:9px;background:#176b9f;color:white;font-weight:700}#tri-builder .tri-controls button:disabled{opacity:.45}#tri-builder .tri-clock{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums;margin:10px 0}#tri-builder .tri-strength{margin:12px 0;padding:10px;border-top:1px solid #355875}#tri-builder .tri-strength-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}#tri-builder .tri-strength-fields label{font-size:13px;display:flex;flex-direction:column;gap:5px}#tri-builder .tri-strength-fields select{width:100%;padding:9px}#tri-builder .tri-set-line{display:flex;justify-content:space-between;align-items:center;padding:5px 0}#tri-builder .tri-set-line button{width:auto;padding:5px 10px}#tri-builder .tri-set-actions{display:flex;gap:6px;align-items:center}#tri-builder .tri-history-item{border-bottom:1px solid #28445c;padding:10px 0}#tri-builder .tri-activity-entry{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0}#tri-builder .tri-activity-entry button{padding:6px 12px;border-radius:7px;background:#176b9f;color:white;border:1px solid #4a85aa}#tri-builder .tri-history-item .tri-strength-fields{margin:8px 0}#tri-builder .tri-history-item .tri-set-actions button{padding:7px 12px;border-radius:7px;background:#176b9f;color:white;border:1px solid #4a85aa}#tri-builder .tri-undo{width:100%;margin:9px 0;padding:10px;background:#214e61;border:1px solid #41617b;border-radius:9px;color:white;font-weight:600}#tri-builder .tri-strength>button{padding:12px 16px;border-radius:9px;background:#1284a7;color:white;font-weight:700;border:0;width:100%}#tri-builder .tri-strength>button:disabled{opacity:.4}#tri-builder .tri-session input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #41617b;border-radius:8px;background:#081b2d;color:white;font:inherit}`;host.append(css);
 const days=el('div','tri-days');DAYS[lang()].forEach((d,i)=>days.append(button(d,()=>{day=i;session=null;activeId=null;render();},day===i)));host.append(days);
 const tabs=el('div','tri-tabs');tabs.append(button(t("Today's Workout",'Entrenamiento de hoy'),()=>{view='workout';render();},view==='workout'),button(t('Edit Plan','Editar plan'),()=>{view='edit';render();},view==='edit'));host.append(tabs);
 const r=record();if(view==='edit'){
  const label=el('h3','',t('Day Type','Tipo de día'));host.append(label);const select=el('select','tri-type');[['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,name])=>{const opt=el('option','',name);opt.value=value;select.append(opt);});select.value=r.type||'training';select.addEventListener('change',()=>save({...r,type:select.value}));host.append(select);
  if(r.type==='rest'){host.append(el('p','tri-muted',t('Rest day. Your selected exercises are retained.','Día de descanso. Se conservan tus ejercicios seleccionados.')));return;}
  host.append(el('h3','',t('Selected Exercises','Ejercicios seleccionados')));
  if(!r.items?.length)host.append(el('p','tri-muted',t('No exercises selected yet.','Aún no hay ejercicios seleccionados.')));
  (r.items||[]).forEach(id=>{const match=find(id);if(match)host.append(itemRow(match.item,true,()=>save({...r,items:r.items.filter(x=>canonical(x)!==canonical(id))})));});
  host.append(el('h3','',t('Exercise Categories','Categorías de ejercicios')));const cats=el('div','tri-cats');Object.keys(CATALOG).forEach(cat=>{const b=button('',()=>{category=cat;render();},category===cat);const img=el('img','tri-category-icon');img.src=({Swim:'swim-icons/endurance-male.webp',Bike:'cycle-icons/spin-male.webp',Run:'anatomy/run/easy-run-male.png',Strength:'anatomy/goblet-squat-male.png'})[cat];img.alt=lang()==='es'?CATEGORY_ES[cat]:cat;b.append(img);b.append(el('span','',lang()==='es'?CATEGORY_ES[cat]:cat));b.setAttribute('aria-label',lang()==='es'?CATEGORY_ES[cat]:cat);cats.append(b);});host.append(cats);
  host.append(el('h3','',lang()==='es'?CATEGORY_ES[category]:category));const available=CATALOG[category].filter(item=>!(r.items||[]).some(id=>canonical(id)===item[0]));if(!available.length)host.append(el('p','tri-muted',t('All exercises in this category are selected.','Todos los ejercicios de esta categoría están seleccionados.')));available.forEach(item=>host.append(itemRow(item,false,()=>save({...r,items:[...(r.items||[]),item[0]]}))));
 }else{
  host.append(el('h3','',t("Today's Triathlon Plan",'Plan de triatlón de hoy')));
  if(r.type==='rest'){host.append(el('p','tri-muted',t('Rest Day','Día de descanso')));}
  else if(!r.items?.length){host.append(el('p','tri-muted',t('No workouts selected. Open Edit Plan to choose exercises.','No hay ejercicios seleccionados. Abre Editar plan para elegir ejercicios.')));}
  else{
   // Every selected exercise has its own ready-to-use session.
   if(r.type==='recovery')host.append(el('p','tri-muted',t('Active Recovery','Recuperación activa')));
   r.items.forEach(id=>{const match=find(id);if(!match)return;
    const key=day+':'+canonical(id);
    if(!sessions.has(key))sessions.set(key,newSession(canonical(id)));
    const session=sessions.get(key);
    const wrap=el('div','tri-session');wrap.dataset.triExercise=id;wrap.append(itemRow(match.item,false,null));
    if(session.phase!=='saved'){
     if(match.cat==='Strength')strengthPanel(canonical(id),wrap,session);
     else endurancePanel(match.cat,wrap,session);
     if(session.phase==='review'){
      wrap.append(el('p','tri-muted',t('Review before saving.','Revisa antes de guardar.')));
      const notes=el('input');notes.placeholder=t('Optional notes / distance / sets','Notas / distancia / series (opcional)');notes.value=session.notes||'';notes.addEventListener('input',()=>{session.notes=notes.value;});wrap.append(notes);
      const actions=el('div','tri-controls');
      actions.append(button(t('Save Activity','Guardar actividad'),()=>{
       const entry={id:Date.now()+'-'+Math.random().toString(36).slice(2,7),exercise:id,discipline:match.cat,elapsedMs:session.elapsed,notes:session.notes||'',sets:match.cat==='Strength'?readSets().filter(x=>x.exercise===canonical(id)&&x.day===day&&x.sessionId===session.sessionId):[],details:match.cat==='Strength'?null:{distance:session.distance||'',distanceUnit:session.distanceUnit||(match.cat==='Swim'?'m':'km'),durationMin:session.durationMin||'',rpe:session.rpe||'',environment:session.environment||'',rideType:session.rideType||''},completedAt:new Date().toISOString()};
       try{const list=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(!Array.isArray(list))throw Error('invalid log');list.push(entry);localStorage.setItem(LOG_KEY,JSON.stringify(list));undoBySession.delete(session.sessionId);sessions.delete(key);const next=r.items.indexOf(id)+1;activeId=r.items[next]||null;scrollToActive=!!activeId;render();}catch(e){alert(t('Could not save activity.','No se pudo guardar la actividad.'));}
      }));
      actions.append(button(t('Discard','Descartar'),()=>{if(session&&match.cat==='Strength'){saveSets(readSets().filter(x=>x.sessionId!==session.sessionId));}undoBySession.delete(session.sessionId);sessions.delete(key);activeId=id;render();}));wrap.append(actions);
     }else{
      const actions=el('div','tri-controls');
      actions.append(button(t('Finish & Review','Terminar y revisar'),()=>{
       if(match.cat!=='Strength'){
        const duration=Number(session.durationMin||0),distance=Number(session.distance||0),rpe=Number(session.rpe||0);
        if((!duration&&!distance)||duration<0||distance<0||(session.rpe&&(!Number.isFinite(rpe)||rpe<1||rpe>10))){alert(t('Enter a valid duration or distance and RPE between 1 and 10.','Ingresa duración o distancia válida y RPE entre 1 y 10.'));return;}
       }
       session.elapsed=0;session.startedAt=null;session.phase='review';render();
      }));
      wrap.append(actions);
     }
    }else{
     // The saved activity remains in history; selecting the exercise again starts a fresh session.
     sessions.delete(key);
    }
    // Keep logged endurance activities and their correction controls inside this exercise card.
    if(match.cat!=='Strength'){
     const logged=readActivities().filter(entry=>entry.discipline===match.cat&&canonical(entry.exercise)===canonical(id));
     if(logged.length){
      wrap.append(el('div','tri-muted',logged.length+' '+t('activities logged','actividades registradas')));
      logged.forEach((entry,index)=>{
       const activity=el('div','tri-history-item');
       activity.append(el('div','tri-muted',t('Activity ','Actividad ')+(index+1)));
       activityActions(entry,activity);
       wrap.append(activity);
      });
     }
     if(activityUndo.previous&&activityUndo.exercise===canonical(id)){
      const undo=button(t('Undo last activity change','Deshacer último cambio de actividad'),()=>{
       try{writeActivities(activityUndo.previous);activityUndo.previous=null;activityUndo.exercise=null;render();}catch(e){alert(t('Could not undo change.','No se pudo deshacer el cambio.'));}
      });
      undo.className='tri-undo';wrap.append(undo);
     }
    }
    // Keep every exercise ready to log; moving focus never finishes or saves it.
    const position=r.items.indexOf(id);
    if(position>=0 && position<r.items.length-1){
     const nextId=r.items.slice(position+1).find(candidate=>!!find(candidate));
     if(nextId){
      const navigation=el('div','tri-progression');
      navigation.append(button(t('Next exercise ↓','Siguiente ejercicio ↓'),()=>{
       activeId=nextId;
       const target=Array.from(host.querySelectorAll('[data-tri-exercise]')).find(n=>n.dataset.triExercise===nextId);
       if(target){target.scrollIntoView({behavior:'smooth',block:'start'});}
      }));
      wrap.append(navigation);
     }
    }
    host.append(wrap);
   });
   if(scrollToActive){scrollToActive=false;const target=Array.from(host.querySelectorAll('[data-tri-exercise]')).find(n=>n.dataset.triExercise===activeId);if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}

  }

 }
 }
 root.TrainLabTriathlon={name:'TRIATHLON',version:'0.2.0',status:'development',render};
})(window);
