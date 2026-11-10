/* A1SC TrainLab — Triathlon Step 17C: independent weekly Edit Plan. */
(function(root){'use strict';
 const KEY='a1sc-triathlon-weekly-plan-v01';
 const LOG_KEY='a1sc-triathlon-activity-log-v01';
 let session=null;
 let tick=null;
 function elapsed(){return session?session.elapsed+(session.startedAt?Math.max(0,Date.now()-session.startedAt):0):0;}
 function clock(ms){let n=Math.floor(ms/1000);return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
 function stopTick(){if(tick){clearInterval(tick);tick=null;}}
 function startTick(){stopTick();tick=setInterval(()=>{const n=document.getElementById('tri-clock');if(n)n.textContent=clock(elapsed());},500);}

 const DAYS={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
 const CATALOG={
  Swim:[['Continuous Swim','Nado continuo','swim-icons/endurance-male.webp'],['Technique Drills','Ejercicios de técnica','swim-icons/technique-male.webp'],['Interval Sets','Series de intervalos','swim-icons/intervals-male.webp'],['Threshold Swim','Nado a umbral','swim-icons/endurance-male.webp'],['Open Water Sighting','Orientación en aguas abiertas','swim-icons/technique-male.webp']],
  Bike:[['Endurance Ride','Rodaje de resistencia','cycle-icons/spin-male.webp'],['Tempo Ride','Rodaje tempo','cycle-icons/spin-male.webp'],['Threshold Intervals','Intervalos de umbral','cycle-icons/speed-male.webp'],['VO₂max Intervals','Intervalos VO₂max','cycle-icons/speed-male.webp'],['Cadence Drills','Ejercicios de cadencia','cycle-icons/climb-male.webp']],
  Strength:[['Goblet Squat','Sentadilla goblet','anatomy/goblet-squat-male.png'],['Romanian Deadlift','Peso muerto rumano','anatomy/romanian-deadlift-male.png'],['Split Squat','Sentadilla dividida','anatomy/leg-press-male.png'],['Standing Calf Raise','Elevación de talones','anatomy/standing-calf-raise-male.png'],['Seated Cable Row','Remo en polea sentado','anatomy/seated-cable-row-male.png'],['Side Plank','Plancha lateral','anatomy/side-plank-male.png'],['Pallof Press','Press Pallof','anatomy/pallof-press-male.png'],['Dead Bug','Bicho muerto','anatomy/dead-bug-male.png']],
  Run:[['Easy Aerobic Run','Carrera aeróbica suave','anatomy/run/easy-run-male.png'],['Long Run','Carrera larga','anatomy/run/long-run-male.png'],['Tempo Run','Carrera tempo','anatomy/run/tempo-run-male.png'],['Interval Repeats','Repeticiones por intervalos','anatomy/run/short-intervals-male.png'],['Strides','Progresiones','anatomy/run/strides-male.png']]
 };
 const STRENGTH_PRESETS={
  'Goblet Squat':{sets:3,reps:10,equipment:'Dumbbell or kettlebell'},
  'Romanian Deadlift':{sets:3,reps:8,equipment:'Dumbbells • weight per hand'},
  'Split Squat':{sets:3,reps:8,equipment:'Dumbbells • reps per leg'},
  'Standing Calf Raise':{sets:3,reps:12,equipment:'Standing calf machine or dumbbells'},
  'Seated Cable Row':{sets:3,reps:10,equipment:'Cable machine'},
  'Side Plank':{sets:3,reps:30,equipment:'Exercise mat • seconds per side',timed:true},
  'Pallof Press':{sets:3,reps:10,equipment:'Cable or resistance band • reps per side'},
  'Dead Bug':{sets:3,reps:8,equipment:'Exercise mat • reps per side'}
 };
 const SET_LOG_KEY='a1sc-triathlon-strength-sets-v01';
 function readSets(){try{const v=JSON.parse(localStorage.getItem(SET_LOG_KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
 function saveSets(v){localStorage.setItem(SET_LOG_KEY,JSON.stringify(v));}
 function strengthPanel(id,host){
  const cfg=STRENGTH_PRESETS[id];if(!cfg)return;
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
  existing.forEach((entry,i)=>{const line=el('div','tri-set-line');line.append(el('span','',t('Set ','Serie ')+(i+1)+' · '+(cfg.timed?entry.reps+' s':(entry.weightLb*(entry.unit==='kg'?1/2.2046226218:1)).toFixed(1)+' '+entry.unit+' × '+entry.reps)));const del=button('✕',()=>{if(!confirm(t('Delete this set?','¿Eliminar esta serie?')))return;saveSets(readSets().filter(x=>x.id!==entry.id));render();});line.append(del);list.append(line);});panel.append(list);
  const log=button(t('+ Log set','+ Registrar serie'),()=>{
   const n=Number(reps.value),w=cfg.timed?0:Number(weight.value||0);
   if(!Number.isFinite(n)||n<=0||!Number.isFinite(w)||w<0){alert(t('Enter valid values.','Ingresa valores válidos.'));return;}
   const count=readSets().filter(x=>x.exercise===id&&x.day===day&&x.sessionId===session.sessionId).length;
   if(count>=Number(planned.value))return;
   session.unit=unit.value;session.planned=Number(planned.value);session.weight=weight.value;session.reps=reps.value;
   const all=readSets();all.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),exercise:id,day,sessionId:session.sessionId,unit:unit.value,weightLb:unit.value==='kg'?w*2.2046226218:w,reps:n,timestamp:Date.now()});
   try{saveSets(all);render();}catch(e){alert(t('Unable to save set.','No se pudo guardar la serie.'));}
  });
  log.disabled=existing.length>=Number(planned.value);planned.addEventListener('change',()=>{session.planned=Number(planned.value);render();});unit.addEventListener('change',()=>{session.unit=unit.value;session.weight=weight.value;session.reps=reps.value;render();});
  panel.append(log);host.append(panel);
 }
 const CATEGORY_ES={Swim:'Natación',Bike:'Ciclismo',Run:'Carrera',Strength:'Fuerza'};
 let data={};try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))data=v;}catch(e){}
 let day=(new Date().getDay()+6)%7,view='workout',category='Swim';
 function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
 function t(en,es){return lang()==='es'?es:en;}
 function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
 function button(label,fn,active){const b=el('button',active?'tri-active':'',label);b.type='button';b.addEventListener('click',fn);return b;}
 function record(){return data[day]||{type:'training',items:[]};}
 function save(r){data[day]=r;try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){alert(t('Unable to save plan.','No se pudo guardar el plan.'));}render();}
 function imageFor(item){let path=item[2];let gender='male';try{const p=JSON.parse(localStorage.getItem('a1sc-profile-v1')||'{}');if(p.gender==='female')gender='female';}catch(e){}return path.replace('-male.', '-'+gender+'.');}
 function itemRow(item,checked,onClick){const row=el('div','tri-item');const img=el('img');img.src=imageFor(item);img.alt='';img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src='home-images/triathlon.webp';};row.append(img);const name=el('div','tri-item-name',lang()==='es'?item[1]:item[0]);row.append(name);if(checked)row.append(el('span','tri-check','✓'));if(onClick){row.tabIndex=0;row.setAttribute('role','button');row.addEventListener('click',onClick);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}});}return row;}
 function find(id){for(const [cat,items] of Object.entries(CATALOG)){const item=items.find(x=>x[0]===id);if(item)return {cat,item};}return null;}
 function render(){stopTick();const host=document.getElementById('tri-builder');if(!host)return;host.replaceChildren();
 const css=el('style');css.textContent=`#tri-builder{color:#eaf4fc}#tri-builder button,#tri-builder select{font:inherit}#tri-builder .tri-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:12px 0}#tri-builder .tri-days button{padding:10px 0;border:1px solid #355875;border-radius:9px;background:#10273b;color:#d9eafb;font-size:12px}#tri-builder .tri-days button.tri-active,#tri-builder .tri-tabs button.tri-active,#tri-builder .tri-cats button.tri-active{background:#1676b7;border-color:#4bb3ed;color:white}#tri-builder .tri-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 18px}#tri-builder .tri-tabs button{min-height:58px;border-radius:12px;border:1px solid #355875;background:#112c44;color:white;font-weight:700}#tri-builder .tri-section{margin:14px 0}#tri-builder h3{font-size:16px;margin:14px 0 9px}#tri-builder .tri-type{width:100%;padding:13px;border-radius:11px;border:1px solid #41617b;background:#10283d;color:white}#tri-builder .tri-cats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#tri-builder .tri-cats button{padding:13px 4px;background:#10283d;color:white;border:1px solid #41617b;border-radius:11px;font-weight:700}#tri-builder .tri-cats button{padding:8px 4px;min-height:102px;display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;overflow:hidden}#tri-builder .tri-category-icon{display:block;width:72px;height:72px;object-fit:contain;border-radius:8px}#tri-builder .tri-item{display:flex;align-items:center;gap:12px;min-height:74px;padding:9px 5px;border-bottom:1px solid #28445c;cursor:pointer}#tri-builder .tri-item img{width:68px;height:60px;object-fit:cover;border-radius:9px;background:#0c2235}#tri-builder .tri-item-name{flex:1;font-weight:600}#tri-builder .tri-check{color:#ff4a9b;font-size:25px;font-weight:800}#tri-builder .tri-muted{color:#a8bfd0;font-size:13px}#tri-builder .tri-session{border:1px solid #355875;border-radius:12px;padding:14px;margin:12px 0;background:#10283d}#tri-builder .tri-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#tri-builder .tri-controls button{padding:11px 15px;border:1px solid #4a85aa;border-radius:9px;background:#176b9f;color:white;font-weight:700}#tri-builder .tri-controls button:disabled{opacity:.45}#tri-builder .tri-clock{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums;margin:10px 0}#tri-builder .tri-strength{margin:12px 0;padding:10px;border-top:1px solid #355875}#tri-builder .tri-strength-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}#tri-builder .tri-strength-fields label{font-size:13px;display:flex;flex-direction:column;gap:5px}#tri-builder .tri-strength-fields select{width:100%;padding:9px}#tri-builder .tri-set-line{display:flex;justify-content:space-between;align-items:center;padding:5px 0}#tri-builder .tri-set-line button{width:auto;padding:4px 10px}#tri-builder .tri-strength>button{padding:12px 16px;border-radius:9px;background:#1284a7;color:white;font-weight:700;border:0;width:100%}#tri-builder .tri-strength>button:disabled{opacity:.4}#tri-builder .tri-session input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #41617b;border-radius:8px;background:#081b2d;color:white;font:inherit}`;host.append(css);
 const days=el('div','tri-days');DAYS[lang()].forEach((d,i)=>days.append(button(d,()=>{day=i;render();},day===i)));host.append(days);
 const tabs=el('div','tri-tabs');tabs.append(button(t("Today's Workout",'Entrenamiento de hoy'),()=>{view='workout';render();},view==='workout'),button(t('Edit Plan','Editar plan'),()=>{view='edit';render();},view==='edit'));host.append(tabs);
 const r=record();if(view==='edit'){
  const label=el('h3','',t('Day Type','Tipo de día'));host.append(label);const select=el('select','tri-type');[['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,name])=>{const opt=el('option','',name);opt.value=value;select.append(opt);});select.value=r.type||'training';select.addEventListener('change',()=>save({...r,type:select.value}));host.append(select);
  if(r.type==='rest'){host.append(el('p','tri-muted',t('Rest day. Your selected exercises are retained.','Día de descanso. Se conservan tus ejercicios seleccionados.')));return;}
  host.append(el('h3','',t('Selected Exercises','Ejercicios seleccionados')));
  if(!r.items?.length)host.append(el('p','tri-muted',t('No exercises selected yet.','Aún no hay ejercicios seleccionados.')));
  (r.items||[]).forEach(id=>{const match=find(id);if(match)host.append(itemRow(match.item,true,()=>save({...r,items:r.items.filter(x=>x!==id)})));});
  host.append(el('h3','',t('Exercise Categories','Categorías de ejercicios')));const cats=el('div','tri-cats');Object.keys(CATALOG).forEach(cat=>{const b=button('',()=>{category=cat;render();},category===cat);const img=el('img','tri-category-icon');img.src=({Swim:'swim-icons/endurance-male.webp',Bike:'cycle-icons/spin-male.webp',Run:'anatomy/run/easy-run-male.png',Strength:'anatomy/goblet-squat-male.png'})[cat];img.alt=lang()==='es'?CATEGORY_ES[cat]:cat;b.append(img);b.append(el('span','',lang()==='es'?CATEGORY_ES[cat]:cat));b.setAttribute('aria-label',lang()==='es'?CATEGORY_ES[cat]:cat);cats.append(b);});host.append(cats);
  host.append(el('h3','',lang()==='es'?CATEGORY_ES[category]:category));CATALOG[category].forEach(item=>{const checked=(r.items||[]).includes(item[0]);host.append(itemRow(item,checked,()=>{const items=checked?r.items.filter(x=>x!==item[0]):[...(r.items||[]),item[0]];save({...r,items});}));});
 }else{
  host.append(el('h3','',t("Today's Triathlon Plan",'Plan de triatlón de hoy')));
  if(r.type==='rest'){host.append(el('p','tri-muted',t('Rest Day','Día de descanso')));}
  else if(!r.items?.length){host.append(el('p','tri-muted',t('No workouts selected. Open Edit Plan to choose exercises.','No hay ejercicios seleccionados. Abre Editar plan para elegir ejercicios.')));}
  else{
   if(r.type==='recovery')host.append(el('p','tri-muted',t('Active Recovery','Recuperación activa')));
   r.items.forEach(id=>{const match=find(id);if(!match)return;
    const wrap=el('div','tri-session');wrap.append(itemRow(match.item,false,null));
    if(session&&session.id===id){
     const timer=el('div','tri-clock',clock(elapsed()));timer.id='tri-clock';wrap.append(timer);
     if(match.cat==='Strength')strengthPanel(id,wrap);
     if(session.phase==='review'){
      wrap.append(el('p','tri-muted',t('Review before saving.','Revisa antes de guardar.')));
      const notes=el('input');notes.placeholder=t('Optional notes / distance / sets','Notas / distancia / series (opcional)');notes.value=session.notes||'';notes.addEventListener('input',()=>{session.notes=notes.value;});wrap.append(notes);
      const actions=el('div','tri-controls');
      actions.append(button(t('Save Activity','Guardar actividad'),()=>{
       const entry={id:Date.now()+'-'+Math.random().toString(36).slice(2,7),exercise:id,discipline:match.cat,elapsedMs:session.elapsed,notes:session.notes||'',sets:match.cat==='Strength'?readSets().filter(x=>x.exercise===id&&x.day===day&&x.sessionId===session.sessionId):[],completedAt:new Date().toISOString()};
       try{const list=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(!Array.isArray(list))throw Error('invalid log');list.push(entry);localStorage.setItem(LOG_KEY,JSON.stringify(list));session=null;render();}catch(e){alert(t('Could not save activity.','No se pudo guardar la actividad.'));}
      }));
      actions.append(button(t('Discard','Descartar'),()=>{if(session&&match.cat==='Strength'){saveSets(readSets().filter(x=>x.sessionId!==session.sessionId));}session=null;render();}));wrap.append(actions);
     }else{
      const actions=el('div','tri-controls');
      if(session.startedAt)actions.append(button(t('Pause','Pausar'),()=>{session.elapsed=elapsed();session.startedAt=null;render();}));
      else actions.append(button(t('Resume','Continuar'),()=>{session.startedAt=Date.now();render();}));
      actions.append(button(t('Finish & Review','Terminar y revisar'),()=>{session.elapsed=elapsed();session.startedAt=null;session.phase='review';render();}));
      wrap.append(actions);if(session.startedAt)startTick();
     }
    }else{
     const actions=el('div','tri-controls');const b=button(t('Start Workout','Iniciar entrenamiento'),()=>{session={id,sessionId:Date.now()+'-'+Math.random().toString(36).slice(2),elapsed:0,startedAt:Date.now(),phase:'active',notes:''};render();});b.disabled=!!session;actions.append(b);wrap.append(actions);
    }
    host.append(wrap);
   });
   const history=el('h3','',t('Recent Triathlon Activities','Actividades recientes de triatlón'));host.append(history);
   let entries=[];try{entries=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(!Array.isArray(entries))entries=[];}catch(e){}
   if(!entries.length)host.append(el('p','tri-muted',t('No activities recorded yet.','Aún no hay actividades registradas.')));
   entries.slice(-5).reverse().forEach(entry=>{const p=el('p','tri-muted');const d=new Date(entry.completedAt);p.textContent=(find(entry.exercise)?.item?.[lang()==='es'?1:0]||entry.exercise)+' · '+clock(entry.elapsedMs)+' · '+(isNaN(d.getTime())?'':d.toLocaleDateString());host.append(p);});
  }

 }
 }
 root.TrainLabTriathlon={name:'TRIATHLON',version:'0.2.0',status:'development',render};
})(window);
