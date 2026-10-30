// A1SC Train Lab — Run, phase 1: recurring weekly exercise selection.
// Kept separate from Total Body data and activity logs.
(function () {
  const KEY = 'a1sc-run-weekly-v1';
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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
  let weekly = {};
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if(saved && typeof saved === 'object' && !Array.isArray(saved)) weekly=saved; } catch(e) {}
  let day=DAYS[new Date().getDay()], categories=[];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t=(en,es)=>document.getElementById('language-toggle').value==='es'?es:en;
  const label=s=>t(s,ES[s]||s);
  function render() {
    const el=document.getElementById('run-builder');
    if(!el)return;
    const selected=Array.isArray(weekly[day])?weekly[day]:[];
    const all=Object.values(CATALOG).flat();
    const available=all.filter(n=>!selected.includes(n)&&categories.some(c=>CATALOG[c].includes(n)));
    const item=(n,checked)=>`<label class="run-exercise"><span class="run-exercise-icon" aria-hidden="true">🏃</span><span>${esc(label(n))}</span><input type="checkbox" data-run-exercise="${esc(n)}" ${checked?'checked':''}></label>`;
    el.innerHTML=`<div class="card"><h3>${t('Build your weekly run program','Crea tu programa semanal de carrera')}</h3><p class="muted">${t('Choose a day and training categories, then select exercises. Your choices repeat each week and save automatically.','Elige un día y categorías de entrenamiento, luego selecciona ejercicios. Tus opciones se repiten cada semana y se guardan automáticamente.')}</p>
      <div class="run-days">${DAYS.map((d,i)=>`<button type="button" class="${day===d?'active':''}" data-run-day="${d}">${t(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i],['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][i])}</button>`).join('')}</div>
      <div class="run-list"><strong>${t('Selected for','Seleccionados para')} ${esc(day)} (${selected.length})</strong>${selected.length?selected.map(n=>item(n,true)).join(''):`<p class="muted">${t('No exercises selected yet.','Todavía no hay ejercicios seleccionados.')}</p>`}</div>
      <div class="run-categories">${Object.keys(CATALOG).map(c=>`<button type="button" class="${categories.includes(c)?'active':''}" data-run-category="${esc(c)}" aria-pressed="${categories.includes(c)}">${esc(label(c))}</button>`).join('')}</div>
      ${categories.length?`<div class="run-list"><strong>${t('Add exercises','Agregar ejercicios')}</strong>${available.length?available.map(n=>item(n,false)).join(''):`<p class="muted">${t('All exercises in these categories are selected.','Ya seleccionaste todos los ejercicios de estas categorías.')}</p>`}</div>`:''}
      <p class="muted" style="font-size:12px">${t('Saved automatically on this device','Guardado automáticamente en este dispositivo')}</p></div>
      <div class="card"><h3>${t('Today’s run program','Programa de carrera del día')}</h3>${selected.length?selected.map((n,i)=>`<div class="run-program-row"><span>${i+1}. ${esc(label(n))}</span><small>${esc(label(Object.keys(CATALOG).find(c=>CATALOG[c].includes(n))))}</small></div>`).join(''):`<p class="muted">${t('Choose exercises above to build this day’s program.','Elige ejercicios arriba para crear el programa de este día.')}</p>`}
      <p class="muted" style="font-size:12px">${t('Activity logging and running metrics will be added in the next step.','El registro de actividades y las métricas de carrera se agregarán en el siguiente paso.')}</p></div>`;
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
  window.TrainLabRun={name:'RUN',version:'0.2.0',status:'weekly-builder',render};
})();
