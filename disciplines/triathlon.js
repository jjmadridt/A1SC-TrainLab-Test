/* A1SC TrainLab — Triathlon Step 17C: independent weekly Edit Plan. */
(function(root){'use strict';
 const KEY='a1sc-triathlon-weekly-plan-v01';
 const DAYS={en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],es:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']};
 const CATALOG={
  Swim:[['Continuous Swim','Nado continuo','swim-icons/endurance-male.webp'],['Technique Drills','Ejercicios de técnica','swim-icons/technique-male.webp'],['Interval Sets','Series de intervalos','swim-icons/intervals-male.webp'],['Threshold Swim','Nado a umbral','swim-icons/endurance-male.webp'],['Open Water Sighting','Orientación en aguas abiertas','swim-icons/technique-male.webp']],
  Bike:[['Endurance Ride','Rodaje de resistencia','cycle-icons/spin-male.webp'],['Tempo Ride','Rodaje tempo','cycle-icons/spin-male.webp'],['Threshold Intervals','Intervalos de umbral','cycle-icons/speed-male.webp'],['VO₂max Intervals','Intervalos VO₂max','cycle-icons/speed-male.webp'],['Cadence Drills','Ejercicios de cadencia','cycle-icons/climb-male.webp']],
  Run:[['Easy Aerobic Run','Carrera aeróbica suave','anatomy/run/easy-run-male.png'],['Long Run','Carrera larga','anatomy/run/long-run-male.png'],['Tempo Run','Carrera tempo','anatomy/run/tempo-run-male.png'],['Interval Repeats','Repeticiones por intervalos','anatomy/run/short-intervals-male.png'],['Strides','Progresiones','anatomy/run/strides-male.png']]
 };
 const CATEGORY_ES={Swim:'Natación',Bike:'Ciclismo',Run:'Carrera'};
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
 function render(){const host=document.getElementById('tri-builder');if(!host)return;host.replaceChildren();
 const css=el('style');css.textContent=`#tri-builder{color:#eaf4fc}#tri-builder button,#tri-builder select{font:inherit}#tri-builder .tri-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:12px 0}#tri-builder .tri-days button{padding:10px 0;border:1px solid #355875;border-radius:9px;background:#10273b;color:#d9eafb;font-size:12px}#tri-builder .tri-days button.tri-active,#tri-builder .tri-tabs button.tri-active,#tri-builder .tri-cats button.tri-active{background:#1676b7;border-color:#4bb3ed;color:white}#tri-builder .tri-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 18px}#tri-builder .tri-tabs button{min-height:58px;border-radius:12px;border:1px solid #355875;background:#112c44;color:white;font-weight:700}#tri-builder .tri-section{margin:14px 0}#tri-builder h3{font-size:16px;margin:14px 0 9px}#tri-builder .tri-type{width:100%;padding:13px;border-radius:11px;border:1px solid #41617b;background:#10283d;color:white}#tri-builder .tri-cats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#tri-builder .tri-cats button{padding:13px 4px;background:#10283d;color:white;border:1px solid #41617b;border-radius:11px;font-weight:700}#tri-builder .tri-cats button{padding:3px;min-height:84px;display:flex;align-items:center;justify-content:center;overflow:hidden}#tri-builder .tri-category-icon{display:block;width:100%;height:82px;object-fit:contain}#tri-builder .tri-item{display:flex;align-items:center;gap:12px;min-height:74px;padding:9px 5px;border-bottom:1px solid #28445c;cursor:pointer}#tri-builder .tri-item img{width:68px;height:60px;object-fit:cover;border-radius:9px;background:#0c2235}#tri-builder .tri-item-name{flex:1;font-weight:600}#tri-builder .tri-check{color:#ff4a9b;font-size:25px;font-weight:800}#tri-builder .tri-muted{color:#a8bfd0;font-size:13px}`;host.append(css);
 const days=el('div','tri-days');DAYS[lang()].forEach((d,i)=>days.append(button(d,()=>{day=i;render();},day===i)));host.append(days);
 const tabs=el('div','tri-tabs');tabs.append(button(t("Today's Workout",'Entrenamiento de hoy'),()=>{view='workout';render();},view==='workout'),button(t('Edit Plan','Editar plan'),()=>{view='edit';render();},view==='edit'));host.append(tabs);
 const r=record();if(view==='edit'){
  const label=el('h3','',t('Day Type','Tipo de día'));host.append(label);const select=el('select','tri-type');[['training',t('Training Day','Día de entrenamiento')],['recovery',t('Active Recovery','Recuperación activa')],['rest',t('Rest Day','Día de descanso')]].forEach(([value,name])=>{const opt=el('option','',name);opt.value=value;select.append(opt);});select.value=r.type||'training';select.addEventListener('change',()=>save({...r,type:select.value}));host.append(select);
  if(r.type==='rest'){host.append(el('p','tri-muted',t('Rest day. Your selected exercises are retained.','Día de descanso. Se conservan tus ejercicios seleccionados.')));return;}
  host.append(el('h3','',t('Selected Exercises','Ejercicios seleccionados')));
  if(!r.items?.length)host.append(el('p','tri-muted',t('No exercises selected yet.','Aún no hay ejercicios seleccionados.')));
  (r.items||[]).forEach(id=>{const match=find(id);if(match)host.append(itemRow(match.item,true,()=>save({...r,items:r.items.filter(x=>x!==id)})));});
  host.append(el('h3','',t('Exercise Categories','Categorías de ejercicios')));const cats=el('div','tri-cats');Object.keys(CATALOG).forEach(cat=>{const b=button('',()=>{category=cat;render();},category===cat);const img=el('img','tri-category-icon');img.src='triathlon-icons/'+cat.toLowerCase()+'.webp';img.alt=lang()==='es'?CATEGORY_ES[cat]:cat;b.append(img);b.setAttribute('aria-label',lang()==='es'?CATEGORY_ES[cat]:cat);cats.append(b);});host.append(cats);
  host.append(el('h3','',lang()==='es'?CATEGORY_ES[category]:category));CATALOG[category].forEach(item=>{const checked=(r.items||[]).includes(item[0]);host.append(itemRow(item,checked,()=>{const items=checked?r.items.filter(x=>x!==item[0]):[...(r.items||[]),item[0]];save({...r,items});}));});
 }else{
  host.append(el('h3','',t('Today\'s Triathlon Plan','Plan de triatlón de hoy')));
  if(r.type==='rest')host.append(el('p','tri-muted',t('Rest Day','Día de descanso')));
  else if(!r.items?.length)host.append(el('p','tri-muted',t('No workouts selected. Open Edit Plan to choose Swim, Bike and Run exercises.','No hay ejercicios seleccionados. Abre Editar plan para elegir natación, ciclismo y carrera.')));
  else{if(r.type==='recovery')host.append(el('p','tri-muted',t('Active Recovery','Recuperación activa')));r.items.forEach(id=>{const match=find(id);if(match){host.append(el('h3','',lang()==='es'?CATEGORY_ES[match.cat]:match.cat));host.append(itemRow(match.item,true,null));}});host.append(el('p','tri-muted',t('Workout recording will be added in the next step.','El registro de entrenamientos se agregará en el siguiente paso.')));}
 }
 }
 root.TrainLabTriathlon={name:'TRIATHLON',version:'0.2.0',status:'development',render};
})(window);
