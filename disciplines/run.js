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
  const INTERVALS=new Set(['Short Intervals','Long Intervals','Hill Repeats','Treadmill Intervals','Strides','Cadence Drills']);
  const CONTINUOUS=new Set(['Easy Run','Long Run','Recovery Run','Treadmill Run','Tempo Run']);
  const TIMED_DRILLS=new Set(['High Knees','Butt Kicks','A-Skips','Dynamic Mobility']);
  const CONTROL_KEY='a1sc-run-controls-v1';
  let settings={};try{settings=JSON.parse(localStorage.getItem(CONTROL_KEY))||{}}catch(e){}
  let expanded=null;
  const kind=n=>INTERVALS.has(n)?'interval':CONTINUOUS.has(n)?'run':TIMED_DRILLS.has(n)?'drill':'strength';
  function controls(n){
    const type=kind(n),v=settings[n]||{};
    const field=(id,title,value,min='0',step='1')=>`<label>${title}<input data-run-field="${id}" type="number" min="${min}" step="${step}" value="${esc(v[id]??value)}"></label>`;
    const timer=(mode)=>`<button type="button" class="run-save" data-open-timer="${mode}" data-exercise-index="0">⏱ ${t('Open Smart Timer','Abrir temporizador')}</button>`;
    let fields='';
    if(type==='run')fields=field('minutes',t('Duration (minutes)','Duración (minutos)'),30)+field('distance',t('Distance','Distancia'),'','0','any')+`<label>${t('Unit','Unidad')}<select data-run-field="unit"><option value="km" ${v.unit==='mi'?'':'selected'}>km</option><option value="mi" ${v.unit==='mi'?'selected':''}>mi</option></select></label>`+(n==='Treadmill Run'?field('incline',t('Incline (%)','Inclinación (%)'),0,'0','0.5'):'');
    if(type==='interval')fields=field('cycles',t('Cycles','Ciclos'),5,'1')+field('peak',t('Peak (seconds)','Pico (segundos)'),60,'1')+field('recovery',t('Recovery (seconds)','Recuperación (segundos)'),120,'1')+(n==='Treadmill Intervals'?field('incline',t('Incline (%)','Inclinación (%)'),0,'0','0.5'):'');
    if(type==='drill')fields=field('sets',t('Sets','Series'),2,'1')+field('seconds',t('Duration per set (seconds)','Duración por serie (segundos)'),30,'1');
    if(type==='strength')fields=field('sets',t('Sets','Series'),3,'1')+field('reps',t('Repetitions','Repeticiones'),10,'1')+(n==='Step-Ups'||n==='Calf Raises'?field('weight',t('Optional weight (kg)','Peso opcional (kg)'),'','0','any'):'');
    return `<div class="run-controls" data-run-controls="${esc(n)}"><div class="run-log-fields">${fields}</div>${type==='interval'?timer('run-interval'):type==='run'||type==='drill'?timer('run-countdown'):''}<button type="button" class="run-save" data-run-log="${esc(n)}">${t('Log Activity','Registrar actividad')}</button><p class="muted" style="font-size:12px">${t('Settings save automatically. Timer completion does not log an activity.','Los ajustes se guardan automáticamente. El temporizador no registra la actividad por sí solo.')}</p></div>`;
  }
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
      <div class="card"><h3>${t('Today’s run program','Programa de carrera del día')}</h3>${selected.length?selected.map((n,i)=>`<div class="run-exercise-block"><div class="run-program-row"><button type="button" class="run-title-button" data-run-expand="${esc(n)}" aria-expanded="${expanded===n}">${i+1}. ${esc(label(n))} ${expanded===n?'▾':'▸'}</button><small>${esc(label(Object.keys(CATALOG).find(c=>CATALOG[c].includes(n))))}</small></div>${expanded===n?controls(n):''}</div>`).join(''):`<p class="muted">${t('Choose exercises above to build this day’s program.','Elige ejercicios arriba para crear el programa de este día.')}</p>`}
      <div class="run-log"><h3>${t('Recent Run Activities','Actividades recientes de carrera')}</h3>
      ${activities.length?activities.slice(0,5).map(a=>`<div class="run-program-row"><span>${esc(new Date(a.timestamp).toLocaleDateString())} · ${esc(label(a.exercise))}<br><small>${a.data?esc(Object.entries(a.data).filter(([k,v])=>v!=='').map(([k,v])=>k+': '+v).join(' · ')):(a.durationSeconds>=60?Math.floor(a.durationSeconds/60)+'m ':'')+(a.durationSeconds%60)+'s · '+a.distance+' '+a.unit+' · '+esc(a.effort)}</small></span><small>${esc(a.pace)}</small></div>`).join(''):`<p class="muted">${t('No runs logged yet.','Aún no hay carreras registradas.')}</p>`}</div></div>`;
    el.querySelectorAll('[data-run-expand]').forEach(b=>b.onclick=()=>{expanded=expanded===b.dataset.runExpand?null:b.dataset.runExpand;render()});
    el.querySelectorAll('[data-run-controls]').forEach(panel=>{
      const n=panel.dataset.runControls;
      panel.querySelectorAll('[data-run-field]').forEach(input=>input.onchange=()=>{
        settings[n]={...(settings[n]||{}),[input.dataset.runField]:input.value};
        try{localStorage.setItem(CONTROL_KEY,JSON.stringify(settings))}catch(e){alert(t('Could not save settings.','No se pudieron guardar los ajustes.'))}
      });
      const timer=panel.querySelector('[data-open-timer]');
      if(timer)timer.addEventListener('click',(event)=>{
        const get=id=>Number(panel.querySelector(`[data-run-field="${id}"]`)?.value);
        if(kind(n)==='interval'){
          const values={cycles:get('cycles'),peak:get('peak'),recovery:get('recovery')};
          if(!Number.isInteger(values.cycles)||values.cycles<1||values.cycles>10||!Number.isInteger(values.peak)||values.peak<1||values.peak>900||!Number.isInteger(values.recovery)||values.recovery<1||values.recovery>1200){alert(t('Use 1–10 cycles, 1–900 peak seconds and 1–1200 recovery seconds.','Usa 1–10 ciclos, 1–900 segundos de pico y 1–1200 segundos de recuperación.'));event.stopImmediatePropagation();return;}
          document.getElementById('tl-cycles').value=values.cycles;
          document.getElementById('tl-peak').value=values.peak;
          document.getElementById('tl-recovery').value=values.recovery;
        }else{
          const seconds=kind(n)==='run'?get('minutes')*60:get('seconds');
          if(!Number.isFinite(seconds)||seconds<1||seconds>7200){alert(t('Enter a duration between 1 and 7200 seconds.','Ingresa una duración entre 1 y 7200 segundos.'));event.stopImmediatePropagation();return;}
          document.getElementById('tl-duration').value=Math.round(seconds);
        }
      },true);
      panel.querySelector('[data-run-log]').onclick=()=>{
        const data={};panel.querySelectorAll('[data-run-field]').forEach(input=>data[input.dataset.runField]=input.value);
        const nums=Object.entries(data).filter(([k])=>k!=='unit');
        if(nums.some(([k,v])=>v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))){alert(t('Check the entered values.','Revisa los valores.'));return;}
        if(kind(n)==='run'&&!(Number(data.minutes)>0)||kind(n)==='interval'&&!(Number(data.cycles)>0&&Number(data.peak)>0&&Number(data.recovery)>0)||kind(n)==='strength'&&!(Number(data.sets)>0&&Number(data.reps)>0)||kind(n)==='drill'&&!(Number(data.sets)>0&&Number(data.seconds)>0)){alert(t('Complete the required workout values.','Completa los valores del entrenamiento.'));return;}
        const seconds=Number(data.minutes)*60,km=Number(data.distance)*(data.unit==='mi'?1.609344:1);
        const entry={timestamp:new Date().toISOString(),exercise:n,kind:kind(n),data,durationSeconds:kind(n)==='run'?seconds:0,distance:Number(data.distance)||0,unit:data.unit||'',effort:'',pace:seconds>0&&km>0?pace(seconds,km):''};
        try{const updated=[entry,...activities];localStorage.setItem(LOG_KEY,JSON.stringify(updated));activities=updated;render();alert(t('Activity saved.','Actividad guardada.'))}catch(e){alert(t('Could not save activity.','No se pudo guardar la actividad.'))}
      };
    });
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
  window.TrainLabRun={name:'RUN',version:'0.5.0',status:'all-exercise-controls',render};
})();
