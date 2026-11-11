const PROGRAM={
Monday:{title:'Lower-body strength',ex:[['Elliptical warm-up','Elliptical','minutes',1,10,10],['Romanian deadlift','Dumbbells • weight per hand','reps',3,8,10],['Leg press','Leg press machine','reps',3,8,12],['Standing calf raise','Standing calf machine or dumbbells','reps',3,12,15],['Dead bug','Exercise mat • opposite arm and leg','per side',3,8,12]]},
Tuesday:{title:'Upper body + core',ex:[['Chest press','Chest press machine','reps',3,8,12],['Seated cable row','Cable machine','reps',3,8,12],['Lat pulldown','Lat pulldown machine','reps',3,8,12],['Dumbbell shoulder press','Dumbbells • weight per hand','reps',2,8,12],['Pallof press','Cable machine','per side',3,10,12],['Side plank','Mat','seconds per side',2,30,45]]},
Wednesday:{title:'Aerobic spin',ex:[['Stationary bike','Indoor spin bike','minutes',1,60,60]]},
Thursday:{title:'Secondary resistance',ex:[['Goblet squat','Dumbbell','reps',3,8,10],['Glute bridge','Mat + optional dumbbell','reps',2,10,12],['Step-up','Platform + optional dumbbells','per leg',2,8,10],['Farmer carry','Dumbbells • weight per hand','seconds',3,30,45]]},
Friday:{title:'Recovery',ex:[]},Saturday:{title:'Team ride',ex:[['Outdoor ride','Road bike','minutes',1,60,240]]},Sunday:{title:'Recovery',ex:[]}};
const KEY='fitclimb-v1';let db;try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}db=db&&Array.isArray(db.logs)?db:{logs:[],body:[],session:{}};let tab='Workout',day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];const app=document.getElementById('app');const $=id=>document.getElementById(id);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('Storage unavailable: export a backup.')}};const session=d=>db.session[d]||1;const relevant=(d,n)=>db.logs.filter(x=>x.day===d&&x.name===n);const current=(d,n)=>relevant(d,n).filter(x=>x.session===session(d));
function render(){document.getElementById('tabs').innerHTML=['Workout'].map(t=>`<button class="${t===tab?'active':''}" data-tab="${t}">${t}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});if(tab==='Workout')workout();if(tab==='Progress')progress();if(tab==='Body')body();if(tab==='Backup')backup()}
function workout(){let p=PROGRAM[day];app.innerHTML=`${bodyAreaPicker()}<div class="days">${Object.keys(PROGRAM).map(d=>`<button class="${day===d?'active':''}" data-day="${d}">${d.slice(0,3)}</button>`).join('')}</div><div class="row"><div><h2>${p.title}</h2><small>${day} • Session ${session(day)}</small></div><span class="pill">${p.ex.length} exercises</span></div>${p.ex.length?p.ex.map((e,i)=>exercise(e,i)).join(''):'<div class="card">Recovery day. Walking or mobility is optional.</div>'}${p.ex.length?'<button class="full" id="finish">Finish session / start next</button>':''}`;document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{day=b.dataset.day;selectedBodyAreas=[];render()});
 document.querySelectorAll('[data-weekly-exercise]').forEach(el=>el.onchange=()=>toggleWeeklyExercise(el.dataset.weeklyExercise));document.querySelectorAll('[data-log]').forEach(b=>b.onclick=()=>logExercise(Number(b.dataset.log)));if($('finish'))$('finish').onclick=()=>{if(confirm('Start a new session for '+day+'?')){db.session[day]=session(day)+1;save();render()}}}
function exercise(e,i){let [name,equipment,unit,sets,min,max]=e;let past=relevant(day,name),today=current(day,name),last=past.length?past[past.length-1]:null;let advice=!last?'Establish a comfortable baseline with controlled form.':last.rir>=2&&last.count>=max?'At the top of the rep range: if all sets were controlled, consider 2–5% more load next session.':last.count<min?'Below target: maintain or reduce resistance and prioritize form.':'Keep the same load and work toward the top of the range.';let cardio=unit==='minutes';return `<section class="card exercise"><div class="row"><div><h3>${i+1}. ${esc(name)}</h3><small>${esc(equipment)}</small><div><span class="pill">${sets} × ${min}${max!==min?'–'+max:''} ${unit}</span></div></div><span class="pill">${today.length}/${sets} logged</span></div><div class="grid" style="margin-top:12px"><div><label>${cardio?'Distance (km, optional)':'Weight (lb; 0 for bodyweight)'}</label><input id="weight-${i}" ${ride?`data-ride-input="${i}"`:``} type="number" step="0.5" min="0" placeholder="0" value="${last?last.weight:''}"></div><div><label>${cardio?'Minutes':unit}</label><input id="count-${i}" data-reps="${i}" type="number" min="0.01" step="0.01" value="${bike?(pendingBikeTimer&&pendingBikeTimer.day===day&&pendingBikeTimer.session===session(day)?(pendingBikeTimer.seconds/60).toFixed(2):''):(db.repDefaults[name]??(last?last.count:min))}"></div></div>${!cardio?`<label style="margin-top:9px">Reps left in reserve (RIR)</label><select id="rir-${i}"><option value="3">3+ reps</option><option value="2" selected>2 reps</option><option value="1">1 rep</option><option value="0">0 reps</option></select>`:''}<button class="primary full log-activity" data-log="${i}">+ Log ${cardio?'activity':'set'}</button>${today.length?`<div class="history success">${today.map(x=>`✓ ${x.weight} ${cardio?'km':'lb'} × ${x.count} ${unit}`).join('<br>')}</div>`:''}<div class="notice"><small>Progression coach</small><div>${advice}</div></div></section>`}
function logExercise(i){let e=PROGRAM[day].ex[i],weight=Number($('weight-'+i).value||0),count=Number($('count-'+i).value),rir=$('rir-'+i)?Number($('rir-'+i).value):null;if(!Number.isFinite(weight)||weight<0||!Number.isFinite(count)||count<=0){alert('Enter valid values.');return}db.logs.push({date:new Date().toISOString().slice(0,10),timestamp:Date.now(),day,session:session(day),name:e[0],equipment:e[1],unit:e[2],weight,count,rir});save();render()}
function progress(){let exercises=[...new Set(db.logs.map(x=>x.name))];app.innerHTML=`<h2>Progress</h2><div class="grid"><div class="card"><small>Logged sets</small><div class="stat">${db.logs.length}</div></div><div class="card"><small>Sessions</small><div class="stat">${new Set(db.logs.map(x=>x.day+'-'+x.session)).size}</div></div></div>${exercises.length?`<label>Exercise history</label><select id="history-select">${exercises.map(x=>`<option>${esc(x)}</option>`).join('')}</select><div class="card" id="history"></div>`:'<div class="card">Log your first workout to see progression.</div>'}`;if($('history-select')){$('history-select').onchange=renderHistory;renderHistory()}}
function setRef(code){
 const [i,j]=String(code).split(':').map(Number);
 const e=PROGRAM[day]?.ex[i];
 if(!e||!Number.isInteger(j))return null;
 const n=session(day);
 if(completed(day,n))return null;
 const matches=db.logs.map((x,k)=>({...x,_index:k})).filter(x=>x.day===day&&x.session===n&&x.name===e[0]);
 return matches[j]||null;
}
function editSet(code){
 const x=setRef(code);if(!x)return;
 const cardio=x.unit==='minutes';
 const exUnit=exerciseUnit(x.name),distUnit=distanceUnit(x.name);
 const weight=prompt(tr('Correct weight / distance','Corregir peso / distancia')+` (${cardio?distUnit:exUnit})`,String(cardio?distanceShown(x.weight,distUnit):toDisplay(x.weight,exUnit)));
 if(weight===null)return;
 const count=prompt(tr('Correct repetitions / duration','Corregir repeticiones / duración'),String(x.count));
 if(count===null)return;
 const w=Number(weight),c=Number(count);
 if(weight.trim()===''||count.trim()===''||!Number.isFinite(w)||w<0||!Number.isFinite(c)||c<=0){alert(tr('Invalid values. No changes saved.','Valores inválidos. No se guardaron cambios.'));return}
 const before={...db.logs[x._index]};
 db.logs[x._index]={...before,weight:cardio?distanceKm(w,distUnit):toLbs(w,exUnit),count:c};
 db.repDefaults[x.name]=c;
 lastSetAction={type:'edit',record:before,index:x._index,day,session:session(day),name:x.name};
 save();render();
}
function deleteSet(code){
 const x=setRef(code);if(!x)return;
 if(!confirm(tr('Delete this recorded set?','¿Eliminar esta serie registrada?')))return;
 const before={...db.logs[x._index]};
 db.logs.splice(x._index,1);
 lastSetAction={type:'delete',record:before,index:x._index,day,session:session(day),name:x.name};
 save();render();
}
function undoSet(i){
 const a=lastSetAction,e=PROGRAM[day].ex[i];
 if(!a||a.day!==day||a.session!==session(day)||a.name!==e[0]||completed(day,session(day)))return;
 if(a.type==='add'){
   const k=db.logs.indexOf(a.record);
   // Object identity survives within the current page session only.
   if(k>=0)db.logs.splice(k,1);
   else{const j=db.logs.findIndex(x=>x.timestamp===a.record.timestamp&&x.name===a.name&&x.session===a.session);if(j>=0)db.logs.splice(j,1)}
 }else if(a.type==='delete')db.logs.splice(a.index,0,a.record);
 else if(a.type==='edit')db.logs[a.index]=a.record;
 lastSetAction=null;save();render();
}
function renderHistory(){let name=$('history-select').value,rows=db.logs.filter(x=>x.name===name).slice(-30).reverse();$('history').innerHTML=`<h3>${esc(name)}</h3><div class="history">${rows.map(x=>`${x.date} · ${x.weight} ${x.unit==='minutes'?'km':'lb'} × ${x.count} ${x.unit}${x.rir===null?'':' · RIR '+x.rir}`).join('<hr>')}</div>`}
function body(){app.innerHTML=`<h2>Body composition</h2><p class="muted">Strength and waist trend matter more than a target weight.</p><div class="card"><div class="grid"><div><label>Waist (inches)</label><input id="waist" type="number" step="0.1"></div><div><label>Body weight (lb, optional)</label><input id="mass" type="number" step="0.1"></div></div><button class="primary full" id="save-body">Save measurement</button></div><div class="card"><h3>Measurement history</h3><div class="history">${db.body.slice().reverse().map(x=>`${x.date} · Waist ${x.waist??'—'} in · Weight ${x.mass??'—'} lb`).join('<hr>')||'No measurements yet.'}</div></div>`;$('save-body').onclick=()=>{let waist=$('waist').value,mass=$('mass').value;if(!waist&&!mass)return alert('Enter at least one measurement.');if((waist&&Number(waist)<=0)||(mass&&Number(mass)<=0))return alert('Enter positive measurements.');db.body.push({date:new Date().toISOString().slice(0,10),waist:waist?Number(waist):null,mass:mass?Number(mass):null});save();render()}}
function backup(){app.innerHTML=`<h2>Backup and restore</h2><div class="card"><p>Data is stored locally on this device. Export backups regularly, especially before changing phones or clearing browser data.</p><button class="primary full" id="export">Download JSON backup</button><label style="margin-top:16px">Restore a previous Total Body backup</label><input type="file" id="import" accept=".json,application/json"></div><div class="card"><h3>About Total Body</h3><p>Works offline after the first successful visit on a hosted HTTPS site. No account, subscription or server database. Progression suggestions are rules of thumb, not medical or individualized coaching.</p></div>`;$('export').onclick=()=>{let blob=new Blob([JSON.stringify({version:1,...db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fitclimb-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('import').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.logs)||!Array.isArray(d.body)||typeof d.session!=='object')throw Error('Invalid backup');if(confirm('Replace current data with this backup?')){db={logs:d.logs,body:d.body,session:d.session};save();render();alert('Backup restored')}}catch(e){alert('Could not import: '+e.message)}}}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});


// FitClimb v1.1 additions. Preserve fitclimb-v1 local storage and legacy logs.
db.settings=db.settings||{lang:'en',unit:'lb'};
db.completed=db.completed||[];
db.started=db.started||{};
db.setTargets=db.setTargets||{};
db.exerciseUnits=db.exerciseUnits||{};
db.repDefaults=db.repDefaults||{};
db.distanceUnits=db.distanceUnits||{};
let lastSetAction=null;
const EN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const TITLES={Monday:'Fuerza de piernas',Tuesday:'Tren superior y abdomen',Wednesday:'Bicicleta aeróbica',Thursday:'Resistencia complementaria',Friday:'Recuperación',Saturday:'Rodada en equipo',Sunday:'Recuperación'};
const NAMES={
'Elliptical warm-up':'Calentamiento en elíptica','Romanian deadlift':'Peso muerto rumano','Leg press':'Prensa de piernas',
'Standing calf raise':'Elevación de talones','Dead bug':'Bicho muerto','Chest press':'Press de pecho',
'Seated cable row':'Remo sentado en polea','Lat pulldown':'Jalón al pecho','Dumbbell shoulder press':'Press de hombros con mancuernas',
'Pallof press':'Press Pallof','Side plank':'Plancha lateral','Stationary bike':'Bicicleta estática',
'Goblet squat':'Sentadilla goblet','Glute bridge':'Puente de glúteos','Step-up':'Subida al banco',
'Farmer carry':'Caminata del granjero','Outdoor ride':'Rodada al aire libre'};
const tr=(en,es)=>db.settings.lang==='es'?es:en;
const exerciseName=n=>db.settings.lang==='es'?(NAMES[n]||n):n;
const converted=n=>db.settings.unit==='kg'?(n/2.2046226218):n;
const displayed=n=>Number(converted(n).toFixed(2));
const lbs=n=>db.settings.unit==='kg'?n*2.2046226218:n;
const exerciseUnit=n=>db.exerciseUnits[n]||db.settings.unit;
const distanceUnit=n=>db.distanceUnits[n]||'km';
const distanceShown=(km,u)=>Number((u==='mi'?km/1.609344:km).toFixed(2));
const distanceKm=(v,u)=>u==='mi'?v*1.609344:v;
const toDisplay=(n,u)=>window.TrainLabStrengthCore?window.TrainLabStrengthCore.toDisplay(n,u):Number((u==='kg'?n/2.2046226218:n).toFixed(2));
const toLbs=(n,u)=>window.TrainLabStrengthCore?window.TrainLabStrengthCore.toLbs(n,u):(u==='kg'?n*2.2046226218:n);
const completed=(d,n)=>db.completed.some(x=>x.day===d&&x.session===n);
const startKey=(d,n)=>d+'-'+n;
const getStart=(d,n)=>db.started[startKey(d,n)]||new Date().toISOString();
const target=(d,n)=>db.setTargets[d+'|'+n]||((PROGRAM[d].ex.find(e=>e[0]===n)||[])[3]||1);
const groups={
'Elliptical warm-up':['legs','core'],'Romanian deadlift':['legs','core'],'Leg press':['legs'],
'Standing calf raise':['legs'],'Dead bug':['core'],'Chest press':['chest','arms'],
'Seated cable row':['back','arms'],'Lat pulldown':['back','arms'],
'Dumbbell shoulder press':['shoulders','arms'],'Pallof press':['core'],
'Side plank':['core'],'Stationary bike':['legs'],'Goblet squat':['legs','core'],
'Glute bridge':['legs','core'],'Step-up':['legs'],'Farmer carry':['arms','core'],
'Outdoor ride':['legs']};
// Update 10: exercise-specific, front/rear vector anatomy; Body preference controls sex.
const anatomySlug={
 'Elliptical warm-up':'elliptical-warm-up',
 'Romanian deadlift':'romanian-deadlift',
 'Leg press':'leg-press',
 'Standing calf raise':'standing-calf-raise',
 'Dead bug':'dead-bug',
 'Chest press':'chest-press',
 'Seated cable row':'seated-cable-row',
 'Lat pulldown':'lat-pulldown',
 'Dumbbell shoulder press':'dumbbell-shoulder-press',
 'Pallof press':'pallof-press',
 'Side plank':'side-plank',
 'Stationary bike':'stationary-bike',
 'Goblet squat':'goblet-squat',
 'Glute bridge':'glute-bridge',
 'Step-up':'step-up',
 'Farmer carry':'farmer-carry',
 'Outdoor ride':'outdoor-ride'
};
function anatomyImage(name,sex){
 const gender=sex==='female'?'female':'male';
 const slug=anatomySlug[name]||'dead-bug';
 return `<img src="anatomy/${slug}-${gender}.png" loading="lazy" decoding="async" alt="${esc(exerciseName(name))} ${gender} front and rear muscle diagram">`;
}
function athleteIllustration(selection,highlighted){
 const h=highlighted||[];
 const name=h.includes('chest')?'Chest press':h.includes('shoulders')?'Dumbbell shoulder press':h.includes('back')?'Lat pulldown':h.includes('core')?'Dead bug':'Goblet squat';
 return anatomyImage(name,selection);
}
function muscleArt(n){return `<div class="muscles">${anatomyImage(n,db.settings.bodyIllustration)}</div>`;}
function legacyMuscleArt(n){
 const g=groups[n]||['core'];const fill=x=>g.includes(x)?'#42c5a4':'#60778a';
 return `<svg class="muscles" viewBox="0 0 110 140" role="img" aria-label="${esc(tr('Highlighted muscle areas','Grupos musculares destacados'))}">
 <circle cx="55" cy="17" r="11" fill="#8da4b4"/>
 <path d="M40 30L70 30L76 78L66 87L44 87L34 78Z" fill="#536e80"/>
 <path d="M41 33L54 38L54 54L39 56Z M56 38L69 33L71 56L56 54Z" fill="${fill('chest')}"/>
 <path d="M40 57L70 57L67 79L43 79Z" fill="${fill('core')}"/>
 <path d="M38 34L29 75L22 74L30 30Z M72 34L80 30L88 74L81 75Z" fill="${fill('arms')}"/>
 <path d="M32 30L43 29L42 43L30 42Z M68 29L79 30L80 42L68 43Z" fill="${fill('shoulders')}"/>
 <path d="M43 86L54 86L52 132L39 132Z M56 86L67 86L71 132L58 132Z" fill="${fill('legs')}"/>
 <path d="M44 33L66 33L65 56L45 56Z" fill="${fill('back')}" opacity=".45"/>
 </svg>`;
}
function render(){
 document.documentElement.lang=db.settings.lang;
 document.getElementById('language-toggle').value=db.settings.lang;
 document.getElementById('language-toggle').onchange=e=>{db.settings.lang=e.target.value;save();render();if(window.trainlabTranslate)window.trainlabTranslate()};
 document.getElementById('tabs').innerHTML='';
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();window.scrollTo({top:0,behavior:'instant'})});
 if(tab==='Workout')workout();if(tab==='Progress')progress();if(tab==='Body')body();if(tab==='Backup')backup();
}
function settings(){
 app.innerHTML=`<h2>${tr('Settings','Ajustes')}</h2><div class="card"><label>${tr('Language','Idioma')}</label><select id="lang"><option value="en">English</option><option value="es">Español</option></select><label style="margin-top:14px">${tr('Weight unit','Unidad de peso')}</label><select id="unit"><option value="lb">lb</option><option value="kg">kg</option></select><p class="muted">${tr('Changing units converts displayed weights; stored values remain consistent.','Cambiar unidades convierte los pesos mostrados; los valores guardados se conservan.')}</p></div>`;
 $('lang').value=db.settings.lang;$('unit').value=db.settings.unit;
 $('lang').onchange=e=>{db.settings.lang=e.target.value;save();render()};
 $('unit').onchange=e=>{db.settings.unit=e.target.value;save();render()};
}
// Update 13 Step 2: browse the existing exercise catalog by body area.
// Exercise logging and the existing weekday plan are intentionally unchanged.
const TOTAL_BODY_AREAS={
 'Legs':['Elliptical warm-up','Romanian deadlift','Leg press','Standing calf raise','Stationary bike','Goblet squat','Glute bridge','Step-up','Outdoor ride'],
 'Core':['Dead bug','Pallof press','Side plank','Farmer carry'],
 'Upper Body':['Chest press','Seated cable row','Lat pulldown','Dumbbell shoulder press','Farmer carry']
};
let selectedBodyAreas=[];
// Navigation state is UI-only; weekly plans and activity records remain unchanged.
let totalBodyPlanMode=false;
// Weekly routine templates are independent of completed workout logs.
// Keep the original exercise definitions as the canonical catalog.
const BASE_EXERCISES=[...new Map(Object.values(PROGRAM).flatMap(p=>p.ex).map(e=>[e[0],e])).values()];
const BASE_BY_NAME=new Map(BASE_EXERCISES.map(e=>[e[0],e]));
const WEEKDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function restoreWeeklyProgram(){
 db.weeklyProgram=db.weeklyProgram||{};
 WEEKDAYS.forEach(d=>{
  if(!Array.isArray(db.weeklyProgram[d]))db.weeklyProgram[d]=[];
  db.weeklyProgram[d]=[...new Set(db.weeklyProgram[d])].filter(name=>BASE_BY_NAME.has(name));
  PROGRAM[d].ex=db.weeklyProgram[d].map(name=>BASE_BY_NAME.get(name));
 });
}
// One-time testing reset: remove legacy preset assignments and old test records.
// This flag ensures a refresh or future app launch never clears new selections.
if(db.totalBodyCleanStartVersion!==1){
 db.weeklyProgram=Object.fromEntries(WEEKDAYS.map(d=>[d,[]]));
 db.logs=[];db.body=[];db.session={};db.completed=[];db.started={};
 db.setTargets={};db.repDefaults={};
 db.totalBodyCleanStartVersion=1;
 save();
}
restoreWeeklyProgram();
// Per-weekday day types are separate from exercise selections and workout records.
// Switching to Rest or Active Recovery never deletes the saved exercise plan.
const DAY_TYPES=['training','recovery','rest'];
function dayType(d){
 const stored=db.dayTypes?.[d];
 if(DAY_TYPES.includes(stored))return stored;
 // Existing populated days remain training days; empty original recovery days default to rest.
 return (!db.weeklyProgram[d]?.length&&(d==='Friday'||d==='Sunday'))?'rest':'training';
}
function dayTypeLabel(type){
 return ({training:tr('Training Day','Día de entrenamiento'),recovery:tr('Active Recovery','Recuperación activa'),rest:tr('Rest Day','Día de descanso')})[type];
}
function dayTypePicker(){
 const type=dayType(day);
 return `<div class="card"><label for="tb-day-type">${tr('Day type','Tipo de día')}</label><select id="tb-day-type">${DAY_TYPES.map(t=>`<option value="${t}" ${type===t?'selected':''}>${dayTypeLabel(t)}</option>`).join('')}</select></div>`;
}
const exerciseCatalog=()=>BASE_EXERCISES;
function toggleWeeklyExercise(name){
 if(!BASE_BY_NAME.has(name))return;
 const existing=db.weeklyProgram[day];
 db.weeklyProgram[day]=existing.includes(name)?existing.filter(n=>n!==name):[...existing,name];
 PROGRAM[day].ex=db.weeklyProgram[day].map(n=>BASE_BY_NAME.get(n));
 save();render();
}

function bodyAreaPicker(){
 const labels={'Legs':tr('Legs','Piernas'),'Core':tr('Core','Core'),'Upper Body':tr('Upper Body','Tren superior')};
 const areas=Object.keys(TOTAL_BODY_AREAS);
 const chosen=new Set(db.weeklyProgram[day]);
 const selected=exerciseCatalog().filter(e=>chosen.has(e[0]));
 const available=exerciseCatalog().filter(e=>!chosen.has(e[0])&&selectedBodyAreas.some(area=>TOTAL_BODY_AREAS[area].includes(e[0])));
 const item=e=>`<label class="area-exercise-item"><span class="area-exercise-thumbnail">${anatomyImage(e[0],db.settings.bodyIllustration)}</span><span class="area-exercise-name">${esc(exerciseName(e[0]))}</span><input type="checkbox" data-weekly-exercise="${esc(e[0])}" ${chosen.has(e[0])?'checked':''} aria-label="${esc(exerciseName(e[0]))}"></label>`;
 return `<div class="card body-area-picker"><h3>${tr('Build your weekly workout','Crea tu rutina semanal')}</h3>
 <div class="area-exercise-list"><strong>${tr('Selected for','Seleccionados para')} ${db.settings.lang==='es'?ES[EN.indexOf(day)]:day} (${chosen.size})</strong>${selected.length?selected.map(item).join(''):`<p class="muted">${tr('Choose from the areas below.','Elige de las áreas abajo.')}</p>`}</div>
 <div class="area-options">${areas.map(a=>`<button type="button" class="${selectedBodyAreas.includes(a)?'active':''}" data-area="${a}" aria-pressed="${selectedBodyAreas.includes(a)}">${labels[a]}</button>`).join('')}</div>
 ${selectedBodyAreas.length?`<div class="area-exercise-list"><strong>${tr('Add exercises','Agregar ejercicios')}</strong>${available.length?available.map(item).join(''):`<p class="muted">${tr('All exercises in these categories are already selected.','Todos los ejercicios de estas categorías ya están seleccionados.')}</p>`}</div>`:''}
 <p class="muted" style="font-size:12px">${tr('Saved automatically','Guardado automático')}</p>
 </div>`;
}

function workout(){
 let p=PROGRAM[day],n=session(day),locked=completed(day,n),type=dayType(day);
 if(type!=='rest'&&!db.started[startKey(day,n)]){db.started[startKey(day,n)]=new Date().toISOString();save()}
 const dt=new Date(getStart(day,n));const start=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
 app.innerHTML=`<div class="days">${Object.keys(PROGRAM).map(d=>`<button class="${day===d?'active':''}" data-day="${d}">${db.settings.lang==='es'?['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][EN.indexOf(d)]:d.slice(0,3)}</button>`).join('')}</div>
 <div class="row"><div><h2>${esc(tr('Weekly workout','Rutina semanal'))} — ${esc(db.settings.lang==='es'?ES[EN.indexOf(day)]:day)}</h2><small>${tr('Session','Sesión')} ${n} · ${tr('Completed','Completada')}: ${locked?tr('Yes','Sí'):tr('No','No')}</small></div>${totalBodyPlanMode?'':`<span class="pill">${p.ex.length} ${tr('exercises','ejercicios')}</span>`}</div>
 <div class="tb-view-actions" role="group" aria-label="${tr('Workout view','Vista de rutina')}"><button type="button" class="${!totalBodyPlanMode?'active':''}" data-tb-view="workout" aria-pressed="${!totalBodyPlanMode}">${tr("Today's workout",'Rutina de hoy')}</button><button type="button" class="${totalBodyPlanMode?'active':''}" data-tb-view="plan" aria-pressed="${totalBodyPlanMode}">${tr('Edit plan','Editar plan')}</button></div>
 ${totalBodyPlanMode?dayTypePicker()+bodyAreaPicker():''}
 ${!totalBodyPlanMode?`
 ${type!=='training'?`<div class="card"><h3>${dayTypeLabel(type)}</h3><p class="muted">${type==='rest'?tr('No structured workout scheduled. Your saved exercises remain available when you switch back to Training Day.','No hay entrenamiento programado. Tus ejercicios guardados estarán disponibles al volver a Día de entrenamiento.'):tr('Keep movement gentle and optional. You can use your saved exercises below or edit the plan.','Mantén el movimiento suave y opcional. Puedes usar los ejercicios guardados abajo o editar el plan.')}</p></div>`:''}
 ${type==='rest'?'':`<div class="card"><label>${tr('Session start date and time','Fecha y hora de inicio')}</label><input type="datetime-local" id="start-time" value="${start}" ${locked?'disabled':''}></div>
 ${p.ex.length?p.ex.map((e,i)=>exercise(e,i,locked)).join(''):`<div class="card">${tr('No exercises selected for this day. Use Edit plan to add exercises.','No hay ejercicios seleccionados para este día. Usa Editar plan para agregarlos.')}</div>`}
 ${!locked?`<button class="primary full" id="finish">${tr('Finish session / start next','Finalizar sesión / iniciar siguiente')}</button>`:''}`}`:''}`;
 document.querySelectorAll('[data-tb-view]').forEach(b=>b.onclick=()=>{totalBodyPlanMode=b.dataset.tbView==='plan';render();const root=document.getElementById('fitclimb');if(root)root.scrollIntoView({block:'start',behavior:'instant'});});
 if($('tb-day-type'))$('tb-day-type').onchange=e=>{if(!DAY_TYPES.includes(e.target.value))return;db.dayTypes=db.dayTypes||{};db.dayTypes[day]=e.target.value;save();render()};
 document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{const area=b.dataset.area;selectedBodyAreas=selectedBodyAreas.includes(area)?selectedBodyAreas.filter(x=>x!==area):[...selectedBodyAreas,area];render()});
 document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{day=b.dataset.day;render()});
 document.querySelectorAll('[data-weekly-exercise]').forEach(el=>el.onchange=()=>toggleWeeklyExercise(el.dataset.weeklyExercise));
 document.querySelectorAll('[data-log]').forEach(b=>b.onclick=()=>logExercise(Number(b.dataset.log)));
 document.querySelectorAll('[data-distanceunit]').forEach(b=>b.onchange=()=>{
   const i=Number(b.dataset.distanceunit),name=PROGRAM[day].ex[i][0],prev=distanceUnit(name),next=b.value;
   const field=$('weight-'+i),v=field?field.value:'';
   const ride=name==='Outdoor ride';
   const hours=ride?$('ride-hours-'+i)?.value:null,minutes=ride?$('ride-minutes-'+i)?.value:null;
   const elev=ride?$('ride-elevation-'+i)?.value:null;
   const detailsOpen=ride?$('ride-elevation-'+i)?.closest('details')?.open:false;
   db.distanceUnits[name]=next;save();render();
   if(v!==''&&$('weight-'+i))$('weight-'+i).value=String(distanceShown(distanceKm(Number(v),prev),next));
   if(ride){
     if(hours!=null)$('ride-hours-'+i).value=hours;
     if(minutes!=null)$('ride-minutes-'+i).value=minutes;
     if(elev!=='')$('ride-elevation-'+i).value=String(Number((Number(elev)*(prev==='mi'?0.3048:1)/(next==='mi'?0.3048:1)).toFixed(2)));
     $('ride-elevation-'+i).closest('details').open=!!detailsOpen;
     updateRideSpeed(i);
   }
 });
 document.querySelectorAll('[data-ride-input]').forEach(el=>el.addEventListener('input',()=>updateRideSpeed(Number(el.dataset.rideInput))));
 document.querySelectorAll('[data-reps]').forEach(el=>el.onchange=()=>{
   const i=Number(el.dataset.reps),name=PROGRAM[day].ex[i][0],v=Number(el.value);
   if(Number.isFinite(v)&&v>0){db.repDefaults[name]=v;save();}
 });
 document.querySelectorAll('[data-exunit]').forEach(b=>b.onchange=()=>{
   const i=Number(b.dataset.exunit),name=PROGRAM[day].ex[i][0],prev=exerciseUnit(name),next=b.value;
   const field=$('weight-'+i);
   const currentValue=field?field.value:'';
   db.exerciseUnits[name]=next;save();render();
   if(currentValue!==''&&$('weight-'+i))$('weight-'+i).value=String(toDisplay(toLbs(Number(currentValue),prev),next));
 });
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editSet(b.dataset.edit));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteSet(b.dataset.delete));
 document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>undoSet(Number(b.dataset.undo)));
 document.querySelectorAll('[data-target]').forEach(b=>b.onchange=()=>{db.setTargets[day+'|'+PROGRAM[day].ex[Number(b.dataset.target)][0]]=Number(b.value);save();render()});
 if($('start-time'))$('start-time').onchange=e=>{if(e.target.value){db.started[startKey(day,n)]=new Date(e.target.value).toISOString();save()}};
 if($('finish'))$('finish').onclick=()=>{
 db.completed.push({day,session:n,finishedAt:new Date().toISOString(),startedAt:getStart(day,n)});
 db.session[day]=n+1;
 day=EN[(EN.indexOf(day)+1)%7];
 save();render();window.scrollTo({top:0,behavior:'instant'});
 };
}
// Timer results remain pending until the athlete explicitly logs the activity.
let pendingBikeTimer=null;
document.addEventListener('trainlab:timer-finished',event=>{
 const detail=event.detail||{};
 if(detail.origin!=='bike'||!Number.isFinite(detail.elapsedSeconds)||detail.elapsedSeconds<=0)return;
 pendingBikeTimer={seconds:detail.elapsedSeconds,day,session:session(day)};
 if(typeof render==='function')render();
});
function updateRideSpeed(i){
 const distance=Number($('weight-'+i)?.value||0),hours=Number($('ride-hours-'+i)?.value||0),minutes=Number($('ride-minutes-'+i)?.value||0);
 const field=$('ride-speed-'+i);if(!field)return;
 const duration=hours+minutes/60;
 field.value=duration>0&&distance>=0?String(Number((distance/duration).toFixed(2))):'';
}
function exercise(e,i,locked){
 const [name,equipment,unit,sets,min,max]=e;
 const count=target(day,name),past=relevant(day,name),today=current(day,name),last=past.length?past[past.length-1]:null;
 const bike=name==='Stationary bike',elliptical=name==='Elliptical warm-up',ride=name==='Outdoor ride',cardio=unit==='minutes',exUnit=exerciseUnit(name),distUnit=distanceUnit(name),weight=last?toDisplay(last.weight,exUnit):'';
 const completedSets=today.length;
 return `<section class="card exercise"><div class="row"><div><h3>${i+1}. ${esc(exerciseName(name))}</h3><small>${esc(equipment)}</small>${ride?'':`<div><span class="pill">${min}${max!==min?'–'+max:''} ${esc(unit)}</span></div>`}</div>${muscleArt(name)}</div>
 ${cardio&&!bike?`<div class="row" style="margin-top:8px"><label>${tr('Distance unit','Unidad de distancia')}</label><select data-distanceunit="${i}" style="width:100px" ${locked?'disabled':''}><option value="km" ${distUnit==='km'?'selected':''}>km</option><option value="mi" ${distUnit==='mi'?'selected':''}>mi</option></select></div>`:''}
 ${!cardio&&name!=='Side plank'?`<div class="row" style="margin-top:8px"><label>${tr('Exercise weight unit','Unidad de peso del ejercicio')}</label><select data-exunit="${i}" style="width:100px" ${locked?'disabled':''}><option value="lb" ${exUnit==='lb'?'selected':''}>lb</option><option value="kg" ${exUnit==='kg'?'selected':''}>kg</option></select></div>`:''}
 ${bike||elliptical||ride?'':`<div class="row" style="margin-top:8px"><label>${tr('Planned sets (1–15)','Series planeadas (1–15)')}</label><select data-target="${i}" style="width:90px" ${locked?'disabled':''}>${Array.from({length:15},(_,j)=>`<option value="${j+1}" ${count===j+1?'selected':''}>${j+1}</option>`).join('')}</select></div>`}
 ${name==='Side plank'?`<button type="button" class="primary full" data-open-timer="plank" data-exercise-index="${i}">⏱ ${tr('Start plank timer','Iniciar temporizador de plancha')}</button>`:''}
 ${bike?`<button type="button" class="primary full" data-open-timer="bike" data-exercise-index="${i}">⏱ ${tr('Open interval timer','Abrir temporizador de intervalos')}</button>`:''}
 <div class="pill">${bike||elliptical||ride?`${completedSets} ${tr('activities logged','actividades registradas')}`:`${completedSets}/${count} ${tr('logged','registradas')}`}</div>
 ${!locked?`<div class="grid" style="margin-top:12px">${name==='Side plank'||bike?'':`<div><label>${cardio?tr('Distance','Distancia')+' ('+distUnit+')':tr('Weight','Peso')+' ('+exUnit+')'}</label><input id="weight-${i}" ${ride?`data-ride-input="${i}"`:``} type="number" step="0.5" min="0" value="${cardio?(last?distanceShown(last.weight,distUnit):''):weight}" placeholder="0"></div>`}${ride?`<div><label>${tr('Moving time','Tiempo en movimiento')}</label><div class="row"><input id="ride-hours-${i}" data-ride-input="${i}" type="number" min="0" step="1" placeholder="h" aria-label="${tr('Hours','Horas')}" style="width:75px" value=""><input id="ride-minutes-${i}" data-ride-input="${i}" type="number" min="0" max="59" step="1" placeholder="min" aria-label="${tr('Minutes','Minutos')}" style="width:85px" value=""></div></div>`:`<div><label>${bike?tr('Actual time (minutes) — enter manually or use timer','Tiempo real (minutos) — manual o con temporizador'):(cardio?tr('Time (minutes)','Tiempo (minutos)'):esc(unit))}</label><input id="count-${i}" data-reps="${i}" type="number" min="0.01" step="0.01" value="${bike?(pendingBikeTimer&&pendingBikeTimer.day===day&&pendingBikeTimer.session===session(day)?(pendingBikeTimer.seconds/60).toFixed(2):''):(db.repDefaults[name]??(last?last.count:min))}"></div>`}</div>

 ${ride&&!locked?`<details style="margin-top:12px;margin-bottom:22px;padding:10px 0;border-bottom:1px solid var(--border, #555)"><summary>${tr('Additional ride details (optional)','Detalles adicionales (opcional)')}</summary><div class="grid" style="margin-top:8px"><div><label>${tr('Elevation gain','Desnivel positivo')} (${distUnit==='mi'?'ft':'m'})</label><input id="ride-elevation-${i}" type="number" min="0" step="1" placeholder="0"></div><div><label>${tr('Average speed','Velocidad promedio')} (${distUnit==='mi'?'mph':'km/h'})</label><input id="ride-speed-${i}" type="number" min="0" step="0.01" placeholder="—" readonly aria-readonly="true"></div></div></details>`:''}
 <button class="primary full log-activity" data-log="${i}" ${!bike&&!elliptical&&!ride&&completedSets>=count?'disabled':''}>+ ${bike||elliptical||ride?tr('Log activity','Registrar actividad'):tr('Log set','Registrar serie')}</button>`:''}
 ${today.length?`<div class="set-list" aria-label="${tr('Recorded sets','Series registradas')}">${today.map((x,j)=>`<div class="set-row"><span class="set-text"><b>${elliptical||ride?tr('Activity','Actividad'):tr('Set','Serie')} ${j+1}</b> · ${bike?`${x.count} ${esc(unit)}`:ride?`${distanceShown(x.weight,distUnit)} ${distUnit} · ${Math.floor(x.count/60)}h ${Math.round(x.count%60)}m${x.elevationGainM!=null?' · ↑'+Number((distUnit==='mi'?x.elevationGainM/0.3048:x.elevationGainM).toFixed(distUnit==='mi'?0:1))+(distUnit==='mi'?'ft':'m'):''}${x.averageSpeedKmh!=null?' · '+Number((distUnit==='mi'?x.averageSpeedKmh/1.609344:x.averageSpeedKmh).toFixed(1))+' '+(distUnit==='mi'?'mph':'km/h'):''}`:`${cardio?distanceShown(x.weight,distUnit):toDisplay(x.weight,exUnit)} ${cardio?distUnit:exUnit} × ${x.count} ${esc(unit)}`}</span>${!locked?`<button class="set-edit" data-edit="${i}:${j}" aria-label="${tr('Edit set','Editar serie')} ${j+1}">✎</button><button class="set-delete" data-delete="${i}:${j}" aria-label="${tr('Delete set','Eliminar serie')} ${j+1}">✕</button>`:''}</div>`).join('')}</div>`:''}
 ${!locked&&lastSetAction&&lastSetAction.day===day&&lastSetAction.session===session(day)&&lastSetAction.name===name?`<button class="undo-set" data-undo="${i}">${tr('Undo last set change','Deshacer último cambio')}</button>`:''}</section>`;
}
function logExercise(i){
 const e=PROGRAM[day].ex[i],n=session(day);
 if(completed(day,n))return alert(tr('Session locked.','Sesión bloqueada.'));
 if(e[0]!=='Stationary bike'&&e[0]!=='Elliptical warm-up'&&e[0]!=='Outdoor ride'&&current(day,e[0]).length>=target(day,e[0]))return alert(tr('Planned sets reached.','Series planeadas completas.'));
 const ride=e[0]==='Outdoor ride';
 const raw=e[0]==='Side plank'||e[0]==='Stationary bike'?0:Number($('weight-'+i).value||0);
 const hours=ride?Number($('ride-hours-'+i).value||0):0,minutes=ride?Number($('ride-minutes-'+i).value||0):0;
 if(ride&&(!Number.isInteger(hours)||hours<0||!Number.isInteger(minutes)||minutes<0||minutes>59))return alert(tr('Enter valid moving time.','Ingresa un tiempo en movimiento válido.'));
 const count=ride?hours*60+minutes:Number($('count-'+i).value);
 if(!Number.isFinite(raw)||raw<0||!Number.isFinite(count)||count<=0)return alert(tr('Enter valid values.','Ingresa valores válidos.'));
 const bike=e[0]==='Stationary bike';
 const optionalNumber=id=>{const el=$(id),v=el?.value?.trim();return v===''||v==null?null:Number(v)};
 const elev=ride?optionalNumber('ride-elevation-'+i):null;
 const speed=ride&&count>0?distanceKm(raw,distanceUnit(e[0]))/(count/60):null;
 if(ride&&((elev!==null&&(!Number.isFinite(elev)||elev<0))))return alert(tr('Enter valid ride details.','Ingresa detalles válidos de la rodada.'));
 const record={date:new Date().toISOString().slice(0,10),timestamp:Date.now(),day,session:n,name:e[0],equipment:e[1],unit:e[2],weight:bike?0:e[2]==='minutes'?distanceKm(raw,distanceUnit(e[0])):toLbs(raw,exerciseUnit(e[0])),count,...(ride?{...(elev!==null?{elevationGainM:elev*(distanceUnit(e[0])==='mi'?0.3048:1)}:{}),...(speed!==null&&Number.isFinite(speed)?{averageSpeedKmh:speed}:{})}:{}),...(bike&&pendingBikeTimer&&pendingBikeTimer.day===day&&pendingBikeTimer.session===n&&Math.abs(count-pendingBikeTimer.seconds/60)<0.02?{timerRecordedSeconds:pendingBikeTimer.seconds}:{})};
 db.logs.push(record);
 if(bike)pendingBikeTimer=null;
 if(!bike&&!ride)db.repDefaults[e[0]]=count;
 lastSetAction={type:'add',record,day,session:n,name:e[0]};
 save();render();
}
function setRef(code){
 const [i,j]=String(code).split(':').map(Number);
 const e=PROGRAM[day]?.ex[i];
 if(!e||!Number.isInteger(j))return null;
 const n=session(day);
 if(completed(day,n))return null;
 const matches=db.logs.map((x,k)=>({...x,_index:k})).filter(x=>x.day===day&&x.session===n&&x.name===e[0]);
 return matches[j]||null;
}
function editSet(code){
 const x=setRef(code);if(!x)return;
 const cardio=x.unit==='minutes';
 const exUnit=exerciseUnit(x.name),distUnit=distanceUnit(x.name);
 const weight=prompt(tr('Correct weight / distance','Corregir peso / distancia')+` (${cardio?distUnit:exUnit})`,String(cardio?distanceShown(x.weight,distUnit):toDisplay(x.weight,exUnit)));
 if(weight===null)return;
 const count=prompt(tr('Correct repetitions / duration','Corregir repeticiones / duración'),String(x.count));
 if(count===null)return;
 const w=Number(weight),c=Number(count);
 if(weight.trim()===''||count.trim()===''||!Number.isFinite(w)||w<0||!Number.isFinite(c)||c<=0){alert(tr('Invalid values. No changes saved.','Valores inválidos. No se guardaron cambios.'));return}
 const before={...db.logs[x._index]};
 db.logs[x._index]={...before,weight:cardio?distanceKm(w,distUnit):toLbs(w,exUnit),count:c};
 db.repDefaults[x.name]=c;
 lastSetAction={type:'edit',record:before,index:x._index,day,session:session(day),name:x.name};
 save();render();
}
// Shared, bilingual destructive-action confirmation; no generic browser OK button.
window.TrainLabConfirmDelete=function(message){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');overlay.setAttribute('role','presentation');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  const dialog=document.createElement('div');dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-modal','true');
  dialog.style.cssText='width:min(100%,400px);padding:22px;background:#102234;color:#fff;border:1px solid #49647c;border-radius:14px';
  const msg=document.createElement('p');msg.textContent=message;dialog.append(msg);
  const actions=document.createElement('div');actions.style.cssText='display:flex;justify-content:flex-end;gap:12px;margin-top:18px';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent=tr('Cancel','Cancelar');
  const del=document.createElement('button');del.type='button';del.textContent=tr('Delete','Eliminar');del.style.cssText='background:#a52d35;color:white';
  actions.append(cancel,del);dialog.append(actions);overlay.append(dialog);document.body.append(overlay);
  const finish=value=>{document.removeEventListener('keydown',key);overlay.remove();resolve(value)};
  const key=e=>{if(e.key==='Escape')finish(false)};document.addEventListener('keydown',key);
  cancel.onclick=()=>finish(false);del.onclick=()=>finish(true);overlay.onclick=e=>{if(e.target===overlay)finish(false)};cancel.focus();
 });
};
async function deleteSet(code){
 const x=setRef(code);if(!x)return;
 if(!await window.TrainLabConfirmDelete(tr('Delete this recorded set? This action cannot be undone.','¿Eliminar esta serie registrada? Esta acción no se puede deshacer.')))return;
 const before={...db.logs[x._index]};
 db.logs.splice(x._index,1);
 lastSetAction={type:'delete',record:before,index:x._index,day,session:session(day),name:x.name};
 save();render();
}
function undoSet(i){
 const a=lastSetAction,e=PROGRAM[day].ex[i];
 if(!a||a.day!==day||a.session!==session(day)||a.name!==e[0]||completed(day,session(day)))return;
 if(a.type==='add'){
   const k=db.logs.indexOf(a.record);
   // Object identity survives within the current page session only.
   if(k>=0)db.logs.splice(k,1);
   else{const j=db.logs.findIndex(x=>x.timestamp===a.record.timestamp&&x.name===a.name&&x.session===a.session);if(j>=0)db.logs.splice(j,1)}
 }else if(a.type==='delete')db.logs.splice(a.index,0,a.record);
 else if(a.type==='edit')db.logs[a.index]=a.record;
 lastSetAction=null;save();render();
}
function renderHistory(){
 let name=$('history-select').value,rows=db.logs.filter(x=>x.name===name).slice(-30).reverse();
 $('history').innerHTML=`<h3>${esc(exerciseName(name))}</h3><div class="history">${rows.map(x=>`${esc(x.date)} · ${x.unit==='minutes'?distanceShown(x.weight,distanceUnit(x.name)):toDisplay(x.weight,exerciseUnit(x.name))} ${x.unit==='minutes'?distanceUnit(x.name):exerciseUnit(x.name)} × ${x.count} ${esc(x.unit)}`).join('<hr>')}</div>`;
}
function progress(target=app){
 let exercises=[...new Set(db.logs.map(x=>x.name))];
 target.innerHTML=`<h2>${tr('Progress','Progreso')}</h2><div class="grid"><div class="card"><small>${tr('Logged sets','Series registradas')}</small><div class="stat">${db.logs.length}</div></div><div class="card"><small>${tr('Completed sessions','Sesiones finalizadas')}</small><div class="stat">${db.completed.length}</div></div></div>${exercises.length?`<label>${tr('Exercise history','Historial de ejercicio')}</label><select id="history-select">${exercises.map(x=>`<option value="${esc(x)}">${esc(exerciseName(x))}</option>`).join('')}</select><div class="card" id="history"></div>`:`<div class="card">${tr('Log your first workout to see progress.','Registra tu primer entrenamiento para ver el progreso.')}</div>`}`;
 if($('history-select')){$('history-select').onchange=renderHistory;renderHistory()}
}
function body(target=app){
 target.innerHTML=`<section class="profile-panel card"><h3>${tr('Body Measurements','Medidas corporales')}</h3><div class="profile-fields"><div class="profile-field"><label for="mass">${tr('Body weight','Peso corporal')}</label><input id="mass" type="number" min="0" step="0.1" inputmode="decimal" placeholder="—"><label for="body-unit">${tr('Weight unit','Unidad de peso')}</label><select id="body-unit"><option value="lb" ${db.settings.unit==='lb'?'selected':''}>lb</option><option value="kg" ${db.settings.unit==='kg'?'selected':''}>kg</option></select></div><div class="profile-field"><label for="waist">${tr('Waist (inches)','Cintura (pulgadas)')}</label><input id="waist" type="number" min="0" step="0.1" inputmode="decimal" placeholder="—"><span class="profile-unit-note">${tr('inches','pulgadas')}</span></div></div><button class="primary full" id="save-body">${tr('Log measurement','Registrar medición')}</button></section><section class="profile-panel card"><h3>${tr('Measurement history','Historial de medidas')}</h3><div class="history">${db.body.slice().reverse().map(x=>`${esc(x.date)} · ${tr('Waist','Cintura')} ${x.waist??'—'} in · ${tr('Weight','Peso')} ${x.mass==null?'—':displayed(x.mass)} ${db.settings.unit}`).join('<hr>')||tr('No measurements yet.','Sin mediciones.')}</div></section>`;
 $('body-unit').onchange=e=>{db.settings.unit=e.target.value;save();target===app?render():renderAthleteProfile()};
 $('save-body').onclick=()=>{let waist=$('waist').value,mass=$('mass').value;if(!waist&&!mass)return;if((waist&&Number(waist)<=0)||(mass&&Number(mass)<=0))return;db.body.push({date:new Date().toISOString().slice(0,10),waist:waist?Number(waist):null,mass:mass?lbs(Number(mass)):null});save();target===app?render():renderAthleteProfile()};
}

// Fuel Lab export is separate from the full-fidelity device backup.
// No nutrition recommendations or inferred intensity are included.
function fuelLabReport(){
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const schedule=days.map(weekday=>({weekday,title:PROGRAM[weekday].title,exercises:PROGRAM[weekday].ex.map(e=>({name:e[0],equipment:e[1],measurement:e[2],plannedSets:e[2]==='minutes'?null:(db.setTargets?.[weekday+'|'+e[0]]??e[3]),targetMinimum:e[4],targetMaximum:e[5],durationUnit:e[2]==='minutes'?'minutes':null}))}));
 const activities=db.logs.map(x=>({date:x.date,recordedAt:x.timestamp?new Date(x.timestamp).toISOString():null,weekday:x.day,session:x.session,exercise:x.name,equipment:x.equipment,measurement:x.unit,amount:x.count, ...(x.name==='Stationary bike'?{durationMinutes:x.count}:x.unit==='minutes'?{durationMinutes:x.count,distanceKm:x.weight}:{loadLb:x.weight}), ...(x.intervals?{intervals:{peaks:x.intervals.cycles,peakSeconds:x.intervals.peak,recoverySeconds:x.intervals.recovery}}:{})}));
 const completedSessions=(db.completed||[]).map(x=>typeof x==='object'?{...x}:x);
 const measurements=db.body.map(x=>({date:x.date,waistInches:x.waist,weightLb:x.mass}));
 return {schema:'a1sc.trainlab.fuellab-export',schemaVersion:1,exportedAt:new Date().toISOString(),source:'A1SC Train Lab testing',scope:'This device and its locally stored FitClimb training data only',units:{distance:'km',weight:'lb',waist:'in',duration:'minutes',interval:'seconds'},weeklyPlan:schedule,loggedActivities:activities,completedSessions,bodyMeasurements:measurements,limitations:['No intensity, heart rate, energy expenditure, or nutrition requirements inferred','Weekly plan is a recurring template, not a dated future workout calendar','Other discipline modules are not represented unless their data is stored in this local dataset']};
}
function downloadFuelLabReport(){
 const blob=new Blob([JSON.stringify(fuelLabReport(),null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='a1sc-trainlab-fuellab-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
// Override backup import to retain v1.1 settings and completed session metadata.
function backup(target=app){
 target.innerHTML=`<section class="profile-panel card"><h3>${tr('Backup My Activities','Respaldar mis actividades')}</h3><p>${tr('Your data stays on this device. Export a backup before changing phones or clearing browser data.','Tus datos permanecen en este dispositivo. Exporta un respaldo antes de cambiar de teléfono o borrar datos.')}</p><p class="muted" style="font-size:12px">${tr('Current backup includes Total Body records and measurements; Run and Cycle data are not yet included.','El respaldo actual incluye los registros de Total Body y las medidas; todavía no incluye los datos de Run y Cycle.')}</p><button class="primary full" id="export">${tr('Download backup','Descargar respaldo')}</button><button class="full" id="fuel-export" style="margin-top:10px">${tr('Export performance report for Fuel Lab','Exportar reporte de rendimiento para Fuel Lab')}</button><p class="muted" style="font-size:12px">${tr('Fuel Lab export contains locally recorded training data and weekly plan, not medical or nutrition recommendations.','La exportación para Fuel Lab contiene datos de entrenamiento locales y el plan semanal, no recomendaciones médicas ni nutricionales.')}</p><label style="margin-top:16px">${tr('Restore backup','Restaurar respaldo')}</label><input type="file" id="import" accept=".json,application/json"></section>`;
 $('fuel-export').onclick=downloadFuelLabReport;
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:'1.1',...db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fitclimb-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.logs)||!Array.isArray(d.body)||!d.session||typeof d.session!=='object')throw Error('Invalid backup');if(confirm(tr('Replace current data?','¿Reemplazar los datos actuales?'))){db={logs:d.logs,body:d.body,session:d.session,settings:d.settings||{lang:'en',unit:'lb'},completed:d.completed||[],started:d.started||{},setTargets:d.setTargets||{},exerciseUnits:d.exerciseUnits||{},repDefaults:d.repDefaults||{},distanceUnits:d.distanceUnits||{},weeklyProgram:d.weeklyProgram||{}};restoreWeeklyProgram();save();render();if(document.getElementById('athlete-profile')?.classList.contains('visible'))renderAthleteProfile()}}catch(e){alert(e.message)}};
}
render();

// Shared Athlete Profile: same db.body and db.settings used by Total Body.
window.renderAthleteProfile=renderAthleteProfile;
function renderAthleteProfile(){
 const target=document.getElementById('athlete-profile-content');
 if(!target)return;
 target.innerHTML=`<section class="profile-panel card"><h3>${tr('Gender','Género')}</h3><label for="profile-gender">${tr('Gender / anatomy illustration','Género / ilustración anatómica')}</label><select id="profile-gender"><option value="male">${tr('Male','Masculino')}</option><option value="female">${tr('Female','Femenino')}</option></select></section><div id="profile-measurements"></div><div id="profile-progress"></div><div id="profile-backup"></div>`;
 const select=document.getElementById('profile-gender');
 select.value=db.settings.bodyIllustration==='female'?'female':'male';
 select.onchange=()=>{db.settings.bodyIllustration=select.value;save();render();if(window.TrainLabRun)window.TrainLabRun.render();};
 body(document.getElementById('profile-measurements'));
 progress(document.getElementById('profile-progress'));
 backup(document.getElementById('profile-backup'));
}
