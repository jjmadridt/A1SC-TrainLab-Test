// A1SC Train Lab — Run, phase 1: recurring weekly exercise selection.
// Kept separate from Total Body data and activity logs.
(function () {
  const KEY = 'a1sc-run-weekly-v1';
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const CATALOG = {
    'Endurance': ['Easy Run','Long Run','Recovery Run','Treadmill Run'],
    'Speed & Intervals': ['Tempo Run','Short Intervals','Long Intervals','Hill Repeats','Treadmill Intervals'],
    'Technique & Drills': ['Strides','High Knees','Butt Kicks','A-Skips','Cadence Drills'],
    'Strength & Mobility': ['Single-Leg Balance','Step-Ups','Calf Raises','Glute Bridges','Dynamic Mobility']
  };
  const ES = {
    'Endurance':'Resistencia','Speed & Intervals':'Velocidad e intervalos',
    'Technique & Drills':'Técnica y ejercicios','Strength & Mobility':'Fuerza y movilidad',
    'Easy Run':'Carrera suave','Long Run':'Carrera larga','Recovery Run':'Carrera de recuperación',
    'Treadmill Run':'Carrera en caminadora','Tempo Run':'Carrera tempo',
    'Short Intervals':'Intervalos cortos','Long Intervals':'Intervalos largos',
    'Hill Repeats':'Repeticiones en cuesta','Treadmill Intervals':'Intervalos en caminadora',
    'Strides':'Progresiones','High Knees':'Rodillas altas','Butt Kicks':'Talones a glúteos',
    'A-Skips':'Saltos técnicos A','Cadence Drills':'Ejercicios de cadencia',
    'Single-Leg Balance':'Equilibrio en una pierna','Step-Ups':'Subidas a banco',
    'Calf Raises':'Elevaciones de talones','Glute Bridges':'Puentes de glúteos',
    'Dynamic Mobility':'Movilidad dinámica'
  };
  const LOG_KEY = 'a1sc-run-activities-v1';
  let activities=[];
  try { const saved=JSON.parse(localStorage.getItem(LOG_KEY)); if(Array.isArray(saved))activities=saved; } catch(e) {}
  let weekly = {};
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if(saved && typeof saved === 'object' && !Array.isArray(saved)) weekly=saved; } catch(e) {}
  let day=DAYS[(new Date().getDay()+6)%7], categories=[];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t=(en,es)=>document.getElementById('language-toggle').value==='es'?es:en;
  const label=s=>t(s,ES[s]||s);
  const pace=(seconds,km)=>{const total=Math.round(seconds/km);return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')} /km`;};
  function render() {
    const el=document.getElementById('run-builder');
    if(!el)return;
    const selected=Array.isArray(weekly[day])?weekly[day]:[];
    const all=Object.values(CATALOG).flat();
    const available=all.filter(n=>!selected.includes(n)&&categories.some(c=>CATALOG[c].includes(n)));
    const item=(n,checked)=>`<label class="run-exercise"><span class="run-exercise-icon" aria-hidden="true">🏃</span><span>${esc(label(n))}</span><input type="checkbox" data-run-exercise="${esc(n)}" ${checked?'checked':''}></label>`;
    el.innerHTML=`<div class="card"><h3>${t('Build your weekly run program','Crea tu programa semanal de carrera')}</h3><p class="muted">${t('Choose a day and training categories, then select exercises. Your choices repeat each week and save automatically.','Elige un día y categorías de entrenamiento, luego selecciona ejercicios. Tus opciones se repiten cada semana y se guardan automáticamente.')}</p>
      <div class="run-days">${DAYS.map((d,i)=>`<button type="button" class="${day===d?'active':''}" data-run-day="${d}">${t(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i])}</button>`).join('')}</div>
      <div class="run-list"><strong>${t('Selected for','Seleccionados para')} ${esc(day)} (${selected.length})</strong>${selected.length?selected.map(n=>item(n,true)).join(''):`<p class="muted">${t('No exercises selected yet.','Todavía no hay ejercicios seleccionados.')}</p>`}</div>
      <div class="run-categories">${Object.keys(CATALOG).map(c=>`<button type="button" class="${categories.includes(c)?'active':''}" data-run-category="${esc(c)}" aria-pressed="${categories.includes(c)}">${esc(label(c))}</button>`).join('')}</div>
      ${categories.length?`<div class="run-list"><strong>${t('Add exercises','Agregar ejercicios')}</strong>${available.length?available.map(n=>item(n,false)).join(''):`<p class="muted">${t('All exercises in these categories are selected.','Ya seleccionaste todos los ejercicios de estas categorías.')}</p>`}</div>`:''}
      <p class="muted" style="font-size:12px">${t('Saved automatically on this device','Guardado automáticamente en este dispositivo')}</p></div>
      <div class="card"><h3>${t('Today’s run program','Programa de carrera del día')}</h3>${selected.length?selected.map((n,i)=>`<div class="run-program-row"><span>${i+1}. ${n==='Short Intervals'?`<button type="button" class="run-title-button" data-open-timer="run-interval" data-exercise-index="0">${esc(label(n))} ⏱</button>`:esc(label(n))}</span><small>${esc(label(Object.keys(CATALOG).find(c=>CATALOG[c].includes(n))))}</small></div>`).join(''):`<p class="muted">${t('Choose exercises above to build this day’s program.','Elige ejercicios arriba para crear el programa de este día.')}</p>`}
      ${selected.includes('Easy Run')?`<div class="run-log"><h3>${t('Log Easy Run','Registrar carrera suave')}</h3>
      <form id="run-easy-form"><div class="run-log-fields">
      <label>${t('Duration (minutes)','Duración (minutos)')}<input id="run-minutes" type="number" min="0" max="9999" step="1" required placeholder="30"></label>
      <label>${t('Seconds','Segundos')}<input id="run-seconds" type="number" min="0" max="59" step="1" value="0" required></label>
      <label>${t('Distance','Distancia')}<input id="run-distance" type="number" min="0.01" max="9999" step="any" required placeholder="5"></label>
      <label>${t('Unit','Unidad')}<select id="run-unit"><option value="km">km</option><option value="mi">mi</option></select></label>
      <label>${t('Effort','Esfuerzo')}<select id="run-effort"><option value="easy">${t('Easy','Suave')}</option><option value="moderate">${t('Moderate','Moderado')}</option><option value="hard">${t('Hard','Intenso')}</option></select></label>
      </div><p id="run-pace-preview" class="muted">${t('Average pace: —','Ritmo promedio: —')}</p><button type="submit" class="run-save">${t('Log Activity','Registrar actividad')}</button></form></div>`:''}
      <div class="run-log"><h3>${t('Recent Run Activities','Actividades recientes de carrera')}</h3>
      ${activities.length?activities.slice(0,5).map(a=>`<div class="run-program-row"><span>${esc(new Date(a.timestamp).toLocaleDateString())} · ${esc(label(a.exercise))}<br><small>${a.durationSeconds>=60?Math.floor(a.durationSeconds/60)+'m ':''}${a.durationSeconds%60}s · ${a.distance} ${a.unit} · ${esc(a.effort)}</small></span><small>${esc(a.pace)}</small></div>`).join(''):`<p class="muted">${t('No runs logged yet.','Aún no hay carreras registradas.')}</p>`}</div></div>`;
    const form=el.querySelector('#run-easy-form');
    if(form){
      const update=()=>{const mins=Number(el.querySelector('#run-minutes').value)||0, secs=Number(el.querySelector('#run-seconds').value)||0, dist=Number(el.querySelector('#run-distance').value)||0, unit=el.querySelector('#run-unit').value;const total=mins*60+secs;el.querySelector('#run-pace-preview').textContent=t('Average pace: ','Ritmo promedio: ')+(total>0&&dist>0?pace(total,dist*(unit==='mi'?1.609344:1)):'—');};
      form.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));
      form.onsubmit=e=>{e.preventDefault();const mins=Number(el.querySelector('#run-minutes').value),secs=Number(el.querySelector('#run-seconds').value),dist=Number(el.querySelector('#run-distance').value),unit=el.querySelector('#run-unit').value,effort=el.querySelector('#run-effort').value,total=mins*60+secs;
        if(!Number.isInteger(mins)||mins<0||!Number.isInteger(secs)||secs<0||secs>59||!Number.isFinite(dist)||dist<=0||total<=0){alert(t('Enter a valid duration and distance.','Ingresa una duración y distancia válidas.'));return;}
        const entry={timestamp:new Date().toISOString(),exercise:'Easy Run',durationSeconds:total,distance:dist,unit,effort,pace:pace(total,dist*(unit==='mi'?1.609344:1))};
        const updated=[entry,...activities];
        try{localStorage.setItem(LOG_KEY,JSON.stringify(updated));activities=updated;render();alert(t('Easy Run saved.','Carrera suave guardada.'));}catch(err){alert(t('Could not save the run. Check device storage.','No se pudo guardar la carrera. Revisa el almacenamiento.'));}
      };
    }
    el.querySelectorAll('[data-run-day]').forEach(b=>b.onclick=()=>{day=b.dataset.runDay;render()});
    el.querySelectorAll('[data-run-category]').forEach(b=>b.onclick=()=>{const c=b.dataset.runCategory;categories=categories.includes(c)?categories.filter(x=>x!==c):[...categories,c];render()});
    el.querySelectorAll('[data-run-exercise]').forEach(b=>b.onchange=()=>{
      const n=b.dataset.runExercise;
      const old=Array.isArray(weekly[day])?weekly[day]:[];
      weekly[day]=b.checked?[...old.filter(x=>x!==n),n]:old.filter(x=>x!==n);
      try{localStorage.setItem(KEY,JSON.stringify(weekly))}catch(e){alert(t('Could not save run program.','No se pudo guardar el programa.'))}
      render();
    });
  }
  window.TrainLabRun={name:'RUN',version:'0.4.0',status:'easy-run-logging',render};
})();
