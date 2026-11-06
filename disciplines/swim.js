// A1SC Train Lab — SWIM, phase 1: pool training. Local-first, separate from other disciplines.
(function(){
'use strict';
const PLAN='a1sc-swim-weekly-v1', LOG='a1sc-swim-activities-v1', PREF='a1sc-swim-prefs-v1';
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const ES={Monday:'Lunes',Tuesday:'Martes',Wednesday:'Miércoles',Thursday:'Jueves',Friday:'Viernes',Saturday:'Sábado',Sunday:'Domingo'};
const TYPES=[['Easy Swim','Nado suave'],['Endurance','Resistencia'],['Technique & Drills','Técnica y ejercicios'],['Intervals','Intervalos'],['Recovery','Recuperación'],['Time Trial','Contrarreloj']];
const get=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}};
const store=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true}catch{alert(tr('Storage unavailable. Export or free device space.','No hay espacio de almacenamiento. Exporta o libera espacio.'));return false}};
const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(en,es)=>document.getElementById('language-toggle')?.value==='es'?es:en;
let weekly=get(PLAN,{}), activities=get(LOG,[]), prefs=get(PREF,{length:25,unit:'m',custom:25}), day=DAYS[(new Date().getDay()+6)%7];
if(!Array.isArray(activities))activities=[];
if(!weekly||typeof weekly!=='object'||Array.isArray(weekly))weekly={};
let mode='pool';
const dateStr=()=>new Date().toLocaleString();
const label=id=>tr(id,TYPES.find(x=>x[0]===id)?.[1]||id);
function poolMeters(){const length=Number(prefs.length==='custom'?prefs.custom:prefs.length);return length*(prefs.unit==='yd'?0.9144:1)}
function render(){
 const el=document.getElementById('swim-builder');if(!el)return;
 const active=Array.isArray(weekly[day])?weekly[day]:[];
 const lenOpts=[['25m','25 m'],['50m','50 m'],['25yd','25 yd'],['custom',tr('Custom','Personalizado')]];
 const current=prefs.length==='custom'?'custom':String(prefs.length)+(prefs.unit==='yd'?'yd':'m');
 el.innerHTML=`<div class="run-controls" style="padding:14px">
 <h2>${tr('Swim training','Entrenamiento de natación')}</h2>
 <div class="run-log-fields"><label>${tr('Environment','Entorno')} <select id="swim-environment"><option value="pool" selected>${tr('Pool','Alberca')}</option><option value="open">${tr('Open water (next phase)','Aguas abiertas (próxima fase)')}</option></select></label>
 <label>${tr('Pool length','Longitud de alberca')} <select id="swim-length">${lenOpts.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${l}</option>`).join('')}</select></label>
 ${current==='custom'?`<label>${tr('Custom length','Longitud personalizada')} <input id="swim-custom" type="number" min="1" max="10000" step="0.01" value="${escapeHTML(prefs.custom||25)}"></label><label>${tr('Unit','Unidad')} <select id="swim-custom-unit"><option value="m" ${prefs.unit==='m'?'selected':''}>m</option><option value="yd" ${prefs.unit==='yd'?'selected':''}>yd</option></select></label>`:''}</div>
 <h3>${tr('Weekly swim plan','Plan semanal de natación')}</h3>
 <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${DAYS.map(d=>`<button type="button" class="run-save" data-swim-day="${d}" style="${day===d?'outline:2px solid #30d5df':''}">${tr(d,ES[d])}</button>`).join('')}</div>
 <p>${tr('Select the workouts for','Selecciona los entrenamientos para')} <strong>${tr(day,ES[day])}</strong>. ${tr('Selections repeat weekly.','La selección se repite cada semana.')}</p>
 <div style="display:grid;gap:9px">${TYPES.map(([id,es])=>`<label style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-swim-plan="${escapeHTML(id)}" ${active.includes(id)?'checked':''}> ${tr(id,es)}</label>`).join('')}</div>
 <h3>${tr('Log pool session','Registrar sesión en alberca')}</h3>
 <div class="run-log-fields"><label>${tr('Workout','Entrenamiento')} <select id="swim-type">${TYPES.map(([id])=>`<option value="${escapeHTML(id)}" ${active.includes(id)?'selected':''}>${escapeHTML(label(id))}</option>`).join('')}</select></label>
 <label>${tr('Laps / lengths','Largos recorridos')} <input id="swim-laps" type="number" min="1" max="100000" step="1" placeholder="20"></label>
 <label>${tr('Duration (minutes)','Duración (minutos)')} <input id="swim-minutes" type="number" min="0.01" max="1440" step="0.01" placeholder="30"></label></div>
 <p class="muted">${tr('One length = one end-to-end swim. Distance and average pace are calculated automatically.','Un largo = nadar de un extremo al otro. La distancia y el ritmo promedio se calculan automáticamente.')}</p>
 <button type="button" class="run-save" id="swim-log">${tr('Log Activity','Registrar actividad')}</button>
 <h3>${tr('Swim history','Historial de natación')}</h3>
 ${activities.length?`<div style="display:grid;gap:8px">${activities.slice().reverse().map((a,i)=>`<div style="padding:9px;border:1px solid #666;border-radius:8px"><strong>${escapeHTML(label(a.type))}</strong> · ${escapeHTML(a.date)}<div>${a.laps} ${tr('lengths','largos')} · ${Number(a.distance).toFixed(0)} m · ${a.minutes} min · ${escapeHTML(a.pace)} /100 m</div><button type="button" class="run-save" data-swim-delete="${activities.length-1-i}">${tr('Delete','Eliminar')}</button></div>`).join('')}</div>`:`<p>${tr('No sessions logged yet.','Aún no hay sesiones registradas.')}</p>`}
 </div>`;
 el.querySelector('#swim-environment').onchange=e=>{if(e.target.value==='open'){alert(tr('Open-water tracking is planned for the next phase. Pool mode remains active.','El registro en aguas abiertas está previsto para la próxima fase. La alberca sigue activa.'));e.target.value='pool'}};
 el.querySelector('#swim-length').onchange=e=>{const v=e.target.value;if(v==='custom'){prefs.length='custom';prefs.custom=prefs.custom||25}else{prefs.length=Number(v.replace(/[^\d]/g,''));prefs.unit=v.endsWith('yd')?'yd':'m'}store(PREF,prefs);render()};
 el.querySelector('#swim-custom')?.addEventListener('change',e=>{const n=Number(e.target.value);if(n>0&&n<=10000){prefs.custom=n;store(PREF,prefs)}else alert(tr('Enter a valid pool length.','Ingresa una longitud válida.'))});
 el.querySelector('#swim-custom-unit')?.addEventListener('change',e=>{prefs.unit=e.target.value;store(PREF,prefs)});
 el.querySelectorAll('[data-swim-day]').forEach(b=>b.onclick=()=>{day=b.dataset.swimDay;render()});
 el.querySelectorAll('[data-swim-plan]').forEach(c=>c.onchange=()=>{const s=new Set(weekly[day]||[]);c.checked?s.add(c.dataset.swimPlan):s.delete(c.dataset.swimPlan);weekly[day]=[...s];store(PLAN,weekly)});
 el.querySelector('#swim-log').onclick=()=>{
  const laps=Number(el.querySelector('#swim-laps').value), minutes=Number(el.querySelector('#swim-minutes').value), length=poolMeters();
  if(!Number.isInteger(laps)||laps<1||!Number.isFinite(minutes)||minutes<=0||!Number.isFinite(length)||length<=0){alert(tr('Enter valid lengths, duration, and pool size.','Ingresa largos, duración y longitud de alberca válidos.'));return}
  const distance=laps*length, sec=minutes*60/(distance/100);
  const pace=`${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`;
  const item={date:dateStr(),timestamp:Date.now(),type:el.querySelector('#swim-type').value,laps,minutes,distance,pace,poolLength:length};
  if(store(LOG,[...activities,item])){activities.push(item);render()}
 };
 el.querySelectorAll('[data-swim-delete]').forEach(b=>b.onclick=()=>{if(confirm(tr('Delete this swim activity?','¿Eliminar esta actividad de natación?'))){const next=activities.filter((_,i)=>i!==Number(b.dataset.swimDelete));if(store(LOG,next)){activities=next;render()}}});
}
window.TrainLabSwim={name:'SWIM',version:'0.2.0',status:'pool-phase-1',render};
})();
