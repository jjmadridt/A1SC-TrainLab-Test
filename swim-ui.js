/* Swim v0.2 planning UI. Isolated localStorage key; no activity logging. */
(function(root){'use strict';
const KEY='a1sc-swim-weekly-plan-v01',SETTINGS='a1sc-swim-settings-v01';
const days={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
let day=(new Date().getDay()+6)%7,category='endurance';
function load(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback;}catch(e){return fallback;}}
let plan=load(KEY,{}),settings=Object.assign({environment:'pool',unit:'m',pool:25},load(SETTINGS,{}));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(plan));localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch(e){}}
function lang(){return document.getElementById('language-toggle')?.value==='es'?'es':'en';}
function t(en,es){return lang()==='es'?es:en;}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function button(txt,click,active){const b=el('button',active?'sw-active':'',txt);b.type='button';b.addEventListener('click',click);return b;}
function gender(){try{return JSON.parse(localStorage.getItem('fitclimb-v1')||'{}').settings?.bodyIllustration==='female'?'female':'male';}catch(e){return 'male';}}
function distance(w){return Math.max(0,Number(w.perSet)||0)*Math.max(1,Number(w.sets)||1);}
function selected(){return Array.isArray(plan[day])?plan[day]:[];}
function render(){const host=document.getElementById('swim-builder'),data=root.TrainLabSwim;if(!host||!data)return;host.replaceChildren();
const panel=(title)=>{const p=el('section','sw-panel');p.append(el('h2','',title));host.append(p);return p;};
const setup=panel(t('Swimming environment','Entorno de natación'));const env=el('div','sw-buttons');['pool','open'].forEach(v=>env.append(button(v==='pool'?t('Pool','Alberca'):t('Open water','Aguas abiertas'),()=>{settings.environment=v;persist();render();},settings.environment===v)));setup.append(env);
if(settings.environment==='pool'){
 const opts=el('div','sw-settings');const unit=el('label','',t('Units','Unidades'));const select=el('select');[['m',t('Meters','Metros')],['yd',t('Yards','Yardas')]].forEach(([v,name])=>{const o=el('option','',name);o.value=v;select.append(o)});select.value=settings.unit;select.addEventListener('change',()=>{settings.unit=select.value;persist();render()});unit.append(select);opts.append(unit);
 const size=el('label','',t('Pool length','Longitud de alberca'));const field=el('input');field.type='number';field.min='1';field.step='0.01';field.value=settings.pool;field.addEventListener('change',()=>{const n=Number(field.value);if(Number.isFinite(n)&&n>0&&n<=1000){settings.pool=n;persist();render();}else field.value=settings.pool;});size.append(field);opts.append(size);setup.append(opts);
 const presets=el('div','sw-buttons');[25,50].forEach(n=>presets.append(button(n+' '+settings.unit,()=>{settings.pool=n;persist();render();},settings.pool===n)));setup.append(presets);
}
const week=panel(t('Weekly plan','Plan semanal'));const wd=el('div','sw-days');days[lang()].forEach((d,i)=>wd.append(button(d,()=>{day=i;render();},day===i)));week.append(wd);
const cats=el('div','sw-buttons');data.categories.forEach(c=>cats.append(button(c[lang()],()=>{category=c.id;render();},category===c.id)));week.append(cats);
const list=el('div');data.workouts.filter(w=>w.category===category).forEach(w=>{
 const row=el('label','sw-workout');const check=el('input');check.type='checkbox';check.checked=selected().some(x=>x.id===w.id);check.addEventListener('change',()=>{const existing=selected().filter(x=>x.id!==w.id);if(check.checked)existing.push({id:w.id,perSet:w.perSet,sets:w.sets,rest:w.rest});plan[day]=existing;persist();render()});row.append(check);
 const img=el('img','sw-icon');img.src='swim-icons/'+w.category+'-'+gender()+'.webp';img.alt='';img.loading='lazy';row.append(img);
 const info=el('span');info.append(el('strong','',w[lang()]));info.append(el('small','',w.sets+' × '+w.perSet+' '+settings.unit+(w.rest?' · '+w.rest+'s '+t('rest','descanso'):'')));row.append(info);list.append(row);
});week.append(list);
const summary=panel(t('Planned session — '+days.en[day],'Sesión planeada — '+days.es[day]));summary.append(el('p','sw-note',t('Review before entering the water. Results will be logged after swimming in a later update.','Revisa antes de entrar al agua. El registro posterior se añadirá en otra actualización.')));
if(!selected().length)summary.append(el('p','sw-note',t('No workouts selected for this day.','No hay entrenamientos seleccionados para este día.')));
selected().forEach((entry)=>{const w=data.workouts.find(x=>x.id===entry.id);if(!w)return;const line=el('div','sw-plan');line.append(el('strong','',w[lang()]));const fields=el('div','sw-fields');
[['perSet',t('Distance per set','Distancia por serie'),1],['sets',t('Sets','Series'),1],['rest',t('Rest (sec)','Descanso (seg)'),0]].forEach(([key,label,min])=>{const wrapper=el('label','',label);const input=el('input');input.type='number';input.min=String(min);input.step='1';input.value=entry[key];input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isFinite(n)&&n>=min&&n<=100000){entry[key]=Math.round(n);persist();render();}else input.value=entry[key];});wrapper.append(input);fields.append(wrapper);});line.append(fields);line.append(el('small','',t('Planned distance: ','Distancia planeada: ')+distance(entry)+' '+settings.unit));summary.append(line);});
const total=selected().reduce((sum,x)=>sum+distance(x),0);summary.append(el('p','sw-total',t('Total planned: ','Total planeado: ')+total+' '+settings.unit));
if(settings.environment==='pool'){const lengths=total/settings.pool;summary.append(el('p','sw-note',t('Equivalent pool lengths: ','Largos equivalentes: ')+(Number.isInteger(lengths)?lengths:lengths.toFixed(2))));}
}
root.TrainLabSwimUI={render};
})(window);
