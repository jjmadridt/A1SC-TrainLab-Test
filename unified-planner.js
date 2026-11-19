/* Step 28A corrective patch: day context, live language, and non-destructive combined selection summary. */
(function(){'use strict';
const ids=['strength','cycle','run','swim','tri'];
const names=['TOTAL BODY','CYCLE','RUN','SWIM','TRIATHLON'];
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const daysEs=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const modules=()=>[window.TrainLabTotalBodyPlanner,window.TrainLabCycleUI,window.TrainLabRun,window.TrainLabSwimUI,window.TrainLabTriathlon];
const lang=()=>document.getElementById('language-toggle')?.value==='es';
const tr=(en,es)=>lang()?es:en;
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}};
let overlay=null,originDay=null;
function activeModule(){if(document.getElementById('fitclimb')?.classList.contains('visible'))return 0;
if(!document.getElementById('module-page')?.classList.contains('visible'))return -1;
return ids.findIndex((id,i)=>i>0&&document.getElementById(({cycle:'cycle-builder',run:'run-builder',swim:'swim-builder',tri:'tri-builder'})[id])?.style.display==='block');}
function currentDay(){const i=activeModule(),d=modules()[i]?.getDay?.();return Number.isInteger(d)&&d>=0&&d<7?d:(new Date().getDay()+6)%7;}
function selections(d){const items=[];
const strength=read('fitclimb-v1')?.weeklyProgram?.[days[d]];
if(Array.isArray(strength))strength.forEach(x=>items.push(['TOTAL BODY',String(x)]));
const cycle=read('a1sc-cycle-weekly-plan-v03')?.[d];
if(Array.isArray(cycle))cycle.forEach(x=>items.push(['CYCLE',String(x).replace(/[-_]/g,' ')]));
const run=read('a1sc-run-weekly-v1')?.[days[d]];
if(Array.isArray(run))run.forEach(x=>items.push(['RUN',String(x)]));
const swim=read('a1sc-swim-weekly-plan-v01')?.[d];
if(Array.isArray(swim))swim.forEach(x=>items.push(['SWIM',String(x?.id||x).replace(/[-_]/g,' ')]));
const tri=read('a1sc-triathlon-weekly-plan-v01')?.[d]?.items;
if(Array.isArray(tri))tri.forEach(x=>items.push(['TRIATHLON',String(x)]));
return items;}
function summary(d){const section=document.createElement('section');section.className='tl-cross-summary';const h=document.createElement('h3');h.textContent=tr('Selected for ','Seleccionados para ')+(lang()?daysEs:days)[d];section.append(h);const items=selections(d);if(!items.length){const p=document.createElement('p');p.textContent=tr('No saved exercises yet.','Aún no hay ejercicios guardados.');section.append(p);}else{const ul=document.createElement('ul');items.forEach(([discipline,name])=>{const li=document.createElement('li');li.textContent=discipline+' · '+name;ul.append(li);});section.append(ul);}return section;}
function close(){overlay?.remove();overlay=null;}
function open(){close();const d=currentDay();originDay=d;overlay=document.createElement('div');overlay.className='tl-cross-overlay';const panel=document.createElement('section');panel.className='tl-cross-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');const h=document.createElement('h2');h.textContent=tr('Add from another discipline','Agregar de otra disciplina');const info=document.createElement('p');info.textContent=tr('Choose a discipline. The selected day stays the same and saved exercises remain in their original plans.','Elige una disciplina. Se conserva el día seleccionado y los ejercicios guardados permanecen en sus planes originales.');const list=document.createElement('div');list.className='tl-cross-options';ids.forEach((id,i)=>{const b=document.createElement('button');b.type='button';b.textContent=names[i]+' ›';b.addEventListener('click',()=>{close();window.TrainLabShowDiscipline?.(id);modules()[i]?.openPlan?.(d);refresh();});list.append(b);});const cancel=document.createElement('button');cancel.type='button';cancel.textContent=tr('Cancel','Cancelar');cancel.addEventListener('click',close);panel.append(h,info,list,cancel);overlay.append(panel);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.body.append(overlay);cancel.focus();}
function ensureLaunchButtons(){
 // Total Body's existing placement is retained. The other four disciplines
 // render their own builder contents, so attach the control INSIDE each builder
 // and restore it whenever that builder is redrawn.
 const strength=document.querySelector('#fitclimb .module-header');
 if(strength&&!document.querySelector('#fitclimb .tl-cross-launch')){
  const b=createLaunch();strength.insertAdjacentElement('afterend',b);
 }
 for(const id of ['cycle-builder','run-builder','swim-builder','tri-builder']){
  const host=document.getElementById(id);
  if(!host)continue;
  let b=host.querySelector('.tl-cross-launch');
  if(!b){b=createLaunch();host.prepend(b);}
  else if(host.firstElementChild!==b)host.prepend(b);
 }
}
function createLaunch(){
 const b=document.createElement('button');b.type='button';b.className='tl-cross-launch';
 b.addEventListener('click',open);return b;
}
function refresh(){
 ensureLaunchButtons();
 document.querySelectorAll('.tl-cross-launch').forEach(b=>{
  const label=tr('+ Add from another discipline','+ Agregar de otra disciplina');
  if(b.textContent!==label)b.textContent=label;
 });
 document.getElementById('tl-cross-queue')?.remove();
}
function install(){
 refresh();
 // Each discipline can replace its builder HTML on first load, Edit Plan,
 // day changes, and subsequent renders. Watch ALL builders, not only #app.
 // A scheduled refresh coalesces multiple DOM mutations and avoids loops.
 let pending=false;
 const schedule=()=>{
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;refresh();});
 };
 for(const id of ['app','cycle-builder','run-builder','swim-builder','tri-builder']){
  const host=document.getElementById(id);
  if(host)new MutationObserver(schedule).observe(host,{childList:true});
 }
 document.addEventListener('change',schedule);
 document.addEventListener('click',schedule);
}
const style=document.createElement('style');style.textContent=`.tl-cross-launch{display:block;width:100%;min-height:48px;margin:12px 0;padding:12px;border:1px solid #527fa0;border-radius:10px;background:#122d43;color:#fff;font-weight:700}.tl-cross-overlay{position:fixed;inset:0;z-index:9999;background:#000c;display:flex;align-items:center;justify-content:center;padding:16px}.tl-cross-panel{background:#0e263b;border:1px solid #4d7796;border-radius:16px;padding:20px;width:min(100%,440px);max-height:90dvh;overflow:auto;color:white}.tl-cross-panel h2{font-size:20px}.tl-cross-panel p{font-size:13px;line-height:1.5;color:#c3d6e5}.tl-cross-options{display:grid;gap:8px;margin:16px 0}.tl-cross-options button{min-height:48px;text-align:left;padding:12px;background:#153b58;color:white;border:1px solid #477795;border-radius:9px}.tl-cross-summary{margin:12px 0;padding:12px;border:1px solid #456a83;border-radius:10px;background:#102d43;color:white}.tl-cross-summary h3{font-size:14px;margin:0 0 8px}.tl-cross-summary ul{margin:0;padding-left:20px;max-height:180px;overflow:auto}.tl-cross-summary li{padding:3px 0;font-size:13px}.tl-cross-summary p{font-size:13px}`;document.head.append(style);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
