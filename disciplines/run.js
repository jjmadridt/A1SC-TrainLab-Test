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
  let view='workout';
  const DAY_TYPE_KEY='a1sc-run-day-types-v1';
  let dayTypes={};try{const saved=JSON.parse(localStorage.getItem(DAY_TYPE_KEY));if(saved&&typeof saved==='object'&&!Array.isArray(saved))dayTypes=saved;}catch(e){}
  const dayType=d=>['training','recovery','rest'].includes(dayTypes[d])?dayTypes[d]:'training';
  const kind=n=>INTERVALS.has(n)?'interval':CONTINUOUS.has(n)?'run':TIMED_DRILLS.has(n)?'drill':'strength';
  function controls(n){
    const type=kind(n),v=settings[n]||{};
    const field=(id,title,value,min='0',step='1')=>`<label>${title}<input data-run-field="${id}" type="number" min="${min}" step="${step}" value="${esc(v[id]??value)}"></label>`;
    const splitTime=(key,total,majorLabel,minorLabel,majorSize=60)=>{const seconds=Math.max(0,Math.round(Number(v[key]??total)||0));return `<div class="run-time-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label>${majorLabel}<input data-run-time-key="${key}" data-run-time-part="major" type="number" min="0" step="1" value="${Math.floor(seconds/majorSize)}"></label><label>${minorLabel}<input data-run-time-key="${key}" data-run-time-part="minor" type="number" min="0" max="${majorSize-1}" step="1" value="${seconds%majorSize}"></label></div>`};
    const runTime=()=>{const minutes=Math.max(0,Math.round(Number(v.minutes??30)||0));return `<div class="run-time-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label>${t('Hours','Horas')}<input data-run-time-key="minutes" data-run-time-part="major" type="number" min="0" step="1" value="${Math.floor(minutes/60)}"></label><label>${t('Minutes','Minutos')}<input data-run-time-key="minutes" data-run-time-part="minor" type="number" min="0" max="59" step="1" value="${minutes%60}"></label></div>`};
    const timer=(mode)=>`<button type="button" class="run-save" data-open-timer="${mode}" data-exercise-index="0">⏱ ${t('Open Smart Timer','Abrir temporizador')}</button>`;
    let fields='';
    if(type==='run')fields=runTime()+field('distance',t('Distance','Distancia'),'','0','any')+`<label>${t('Unit','Unidad')}<select data-run-field="unit"><option value="km" ${v.unit==='mi'?'':'selected'}>km</option><option value="mi" ${v.unit==='mi'?'selected':''}>mi</option></select></label>`+(n==='Treadmill Run'?field('incline',t('Incline (%)','Inclinación (%)'),0,'0','0.5'):'');
    if(type==='interval')fields=field('cycles',t('Cycles','Ciclos'),5,'1')+splitTime('peak',60,t('Peak minutes','Minutos de pico'),t('Peak seconds','Segundos de pico'))+splitTime('recovery',120,t('Recovery minutes','Minutos de recuperación'),t('Recovery seconds','Segundos de recuperación'))+(n==='Treadmill Intervals'?field('incline',t('Incline (%)','Inclinación (%)'),0,'0','0.5'):'');
    if(type==='drill')fields=field('sets',t('Sets','Series'),2,'1')+splitTime('seconds',30,t('Minutes per set','Minutos por serie'),t('Seconds per set','Segundos por serie'));
    const splitKeys=type==='run'?['minutes']:type==='interval'?['peak','recovery']:type==='drill'?['seconds']:[];fields+=splitKeys.map(key=>`<input type="hidden" data-run-field="${key}" value="${esc(v[key]??(key==='minutes'?30:key==='recovery'?120:key==='peak'?60:30))}">`).join('');
    if(type==='strength')fields=field('sets',t('Sets','Series'),3,'1')+field('reps',t('Repetitions','Repeticiones'),10,'1')+(n==='Step-Ups'||n==='Calf Raises'?field('weight',t('Optional weight (kg)','Peso opcional (kg)'),'','0','any'):'');
    return `<div class="run-controls" data-run-controls="${esc(n)}"><div class="run-log-fields">${fields}</div>${type==='interval'?timer('run-interval'):type==='run'||type==='drill'?timer('run-countdown'):''}<button type="button" class="run-save" data-run-log="${esc(n)}">${t('Log Activity','Registrar actividad')}</button><p class="muted" style="font-size:12px">${t('Settings save automatically. Timer completion does not log an activity.','Los ajustes se guardan automáticamente. El temporizador no registra la actividad por sí solo.')}</p></div>`;
  }
  let pendingRunTimer=null;
  document.addEventListener('trainlab:timer-finished',e=>{
    const detail=e.detail||{};if(!String(detail.origin||'').startsWith('run-')||!(detail.elapsedSeconds>0)||!pendingRunTimer)return;
    const n=pendingRunTimer;pendingRunTimer=null;
    const seconds=Math.round(detail.elapsedSeconds),v=settings[n]||{};
    if(kind(n)==='run')v.minutes=String(Math.round(seconds/60*100)/100);
    else if(kind(n)==='drill')v.seconds=String(seconds);
    else v.completedSeconds=String(seconds);
    settings[n]=v;try{localStorage.setItem(CONTROL_KEY,JSON.stringify(settings))}catch(e){}
    expanded=n;view='workout';render();
  });
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
  const runGender=()=>{try{return JSON.parse(localStorage.getItem('fitclimb-v1'))?.settings?.bodyIllustration==='female'?'female':'male'}catch(e){return 'male'}};
  const runArt=n=>`<img class="run-anatomy" src="anatomy/run/${n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${runGender()}.png?v=20261109runart2" alt="" loading="lazy" decoding="async">`;
  function render() {
    const el=document.getElementById('run-builder');
    if(!el)return;
    const selected=Array.isArray(weekly[day])?weekly[day]:[];
    const all=Object.values(CATALOG).flat();
    const available=all.filter(n=>!selected.includes(n)&&categories.some(c=>CATALOG[c].includes(n)));
    const item=(n,checked)=>`<label class="run-exercise"><span class="run-exercise-icon" aria-hidden="true">${runArt(n)}</span><span>${esc(label(n))}</span><input type="checkbox" data-run-exercise="${esc(n)}" ${checked?'checked':''}></label>`;
    const navigation=`<div class="run-categories" style="margin-bottom:12px"><button type="button" data-run-view="workout" class="${view==='workout'?'active':''}">${t('Today’s Workout','Entrenamiento de hoy')}</button><button type="button" data-run-view="plan" class="${view==='plan'?'active':''}">${t('Edit Plan','Editar Plan')}</button></div>`;
    const dayNav=`<div class="run-days">${DAYS.map((d,i)=>`<button type="button" class="${day===d?'active':''}" data-run-day="${d}">${t(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i])}</button>`).join('')}</div>`;
    el.innerHTML=dayNav+navigation+(view==='plan'?`<div class="card"><h3>${t('Build your weekly run program','Crea tu programa semanal de carrera')}</h3>
      <div style="margin:12px 0"><label style="display:block;margin-bottom:8px" for="run-day-type">${t('Day type','Tipo de día')}</label><select id="run-day-type" data-run-day-type style="display:block;width:100%;padding:12px 14px;border-radius:10px;background:#102234;color:inherit;border:1px solid #49647c;font:inherit">${[['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].map(([id,name])=>`<option value="${id}" ${dayType(day)===id?'selected':''}>${name}</option>`).join('')}</select></div>
      <div class="run-list"><strong>${t('Selected for','Seleccionados para')} ${esc(day)}</strong>${selected.length?selected.map(n=>item(n,true)).join(''):`<p class="muted">${t('Choose from the areas below.','Elige de las áreas abajo.')}</p>`}</div>
      <div class="run-categories">${Object.keys(CATALOG).map(c=>`<button type="button" class="${categories.includes(c)?'active':''}" data-run-category="${esc(c)}" aria-pressed="${categories.includes(c)}">${esc(label(c))}</button>`).join('')}</div>
      ${categories.length?`<div class="run-list"><strong>${t('Add exercises','Agregar ejercicios')}</strong>${available.length?available.map(n=>item(n,false)).join(''):`<p class="muted">${t('All exercises in these categories are selected.','Ya seleccionaste todos los ejercicios de estas categorías.')}</p>`}</div>`:''}
      <p class="muted" style="font-size:12px">${t('Saved automatically on this device','Guardado automáticamente en este dispositivo')}</p></div>
`:`<div class="card"><h3>${t('Today’s run program','Programa de carrera del día')}</h3>${dayType(day)==='rest'?`<p class="muted">${t('Rest Day — no structured workout.','Día de descanso — sin entrenamiento programado.')}</p>`:dayType(day)==='recovery'?`<p class="muted">${t('Active Recovery — optional light movement. Your training plan is preserved.','Recuperación activa — movimiento ligero opcional. Tu plan se conserva.')}</p>`:selected.length?selected.map((n,i)=>`<div class="run-exercise-block"><div class="run-program-row">${runArt(n)}<button type="button" class="run-title-button" data-run-expand="${esc(n)}" aria-expanded="${expanded===n}">${i+1}. ${esc(label(n))} ${expanded===n?'▾':'▸'}</button><small>${esc(label(Object.keys(CATALOG).find(c=>CATALOG[c].includes(n))))}</small></div>${expanded===n?controls(n):''}</div>`).join(''):`<p class="muted">${t('Use Edit Plan to choose exercises for this day.','Usa Editar Plan para elegir los ejercicios de este día.')}</p>`}
      <div class="run-log"><h3>${t('Recent Run Activities','Actividades recientes de carrera')}</h3>
      ${activities.length?activities.slice(0,5).map((a,i)=>`<div class="run-program-row"><span>${esc(new Date(a.timestamp).toLocaleDateString())} · ${esc(label(a.exercise))}<br><small>${a.data?esc(Object.entries(a.data).filter(([k,v])=>v!=='').map(([k,v])=>k+': '+v).join(' · ')):(a.durationSeconds>=60?Math.floor(a.durationSeconds/60)+'m ':'')+(a.durationSeconds%60)+'s · '+a.distance+' '+a.unit+' · '+esc(a.effort)}</small></span><small>${esc(a.pace)}</small><button type="button" data-run-delete="${i}" style="padding:7px 9px;color:#ffb5b5">${t('Delete','Eliminar')}</button></div>`).join(''):`<p class="muted">${t('No runs logged yet.','Aún no hay carreras registradas.')}</p>`}</div></div>`);
    el.querySelectorAll('[data-run-view]').forEach(b=>b.onclick=()=>{view=b.dataset.runView;expanded=null;render()});
    el.querySelectorAll('[data-run-day-type]').forEach(b=>b.onchange=()=>{dayTypes[day]=b.value;try{localStorage.setItem(DAY_TYPE_KEY,JSON.stringify(dayTypes))}catch(e){alert(t('Could not save day type.','No se pudo guardar el tipo de día.'));return;}render()});
    el.querySelectorAll('[data-run-delete]').forEach(button=>button.onclick=()=>{
      const index=Number(button.dataset.runDelete);
      if(!Number.isInteger(index)||index<0||index>=activities.length)return;
      if(!confirm(t('Delete this Run activity? This cannot be undone.','¿Eliminar esta actividad de carrera? No se puede deshacer.')))return;
      const updated=activities.filter((_,i)=>i!==index);
      try{localStorage.setItem(LOG_KEY,JSON.stringify(updated));activities=updated;render();}
      catch(e){alert(t('Could not delete activity.','No se pudo eliminar la actividad.'));}
    });
    el.querySelectorAll('[data-run-expand]').forEach(b=>b.onclick=()=>{expanded=expanded===b.dataset.runExpand?null:b.dataset.runExpand;render()});
    el.querySelectorAll('[data-run-controls]').forEach(panel=>{
      const n=panel.dataset.runControls;
      panel.querySelectorAll('[data-run-field]').forEach(input=>input.onchange=()=>{
        settings[n]={...(settings[n]||{}),[input.dataset.runField]:input.value};
        try{localStorage.setItem(CONTROL_KEY,JSON.stringify(settings))}catch(e){alert(t('Could not save settings.','No se pudieron guardar los ajustes.'))}
      });
      panel.querySelectorAll('[data-run-time-part]').forEach(input=>input.addEventListener('change',()=>{
        const key=input.dataset.runTimeKey,parts=[...panel.querySelectorAll(`[data-run-time-key="${key}"]`)];
        const major=Number(parts.find(x=>x.dataset.runTimePart==='major')?.value),minor=Number(parts.find(x=>x.dataset.runTimePart==='minor')?.value);
        const radix=key==='minutes'?60:60;
        if(!Number.isInteger(major)||major<0||!Number.isInteger(minor)||minor<0||minor>=radix){input.setCustomValidity(t('Enter valid time values.','Ingresa valores de tiempo válidos.'));input.reportValidity();return;}
        input.setCustomValidity('');const hidden=panel.querySelector(`[data-run-field="${key}"]`);if(hidden){hidden.value=String(major*radix+minor);hidden.dispatchEvent(new Event('change',{bubbles:true}));}
      }));
      const timer=panel.querySelector('[data-open-timer]');
      if(timer)timer.addEventListener('click',(event)=>{
        pendingRunTimer=n;
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
        const entry={timestamp:new Date().toISOString(),exercise:n,kind:kind(n),data,durationSeconds:kind(n)==='run'?seconds:(Number(data.completedSeconds)||0),distance:Number(data.distance)||0,unit:data.unit||'',effort:'',pace:seconds>0&&km>0?pace(seconds,km):''};
        try{const updated=[entry,...activities];localStorage.setItem(LOG_KEY,JSON.stringify(updated));activities=updated;render()}catch(e){alert(t('Could not save activity.','No se pudo guardar la actividad.'))}
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
