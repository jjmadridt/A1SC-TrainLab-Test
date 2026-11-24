/* Step 28A corrective patch: day context, live language, and non-destructive combined selection summary. */
(function(){'use strict';
const ids=['strength','cycle','run','swim','tri'];
const names=['TOTAL BODY','CYCLE','RUN','SWIM','TRIATHLON'];
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const daysEs=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const modules=()=>[window.TrainLabTotalBodyPlanner,window.TrainLabCycleUI,window.TrainLabRun,window.TrainLabSwimUI,window.TrainLabTriathlon];
const lang=()=>document.getElementById('language-toggle')?.value==='es';
const tr=(en,es)=>lang()?es:en;
let overlay=null;
function activeModule(){if(document.getElementById('fitclimb')?.classList.contains('visible'))return 0;
if(!document.getElementById('module-page')?.classList.contains('visible'))return -1;
return ids.findIndex((id,i)=>i>0&&document.getElementById(({cycle:'cycle-builder',run:'run-builder',swim:'swim-builder',tri:'tri-builder'})[id])?.style.display==='block');}
function currentDay(){const i=activeModule(),d=modules()[i]?.getDay?.();return Number.isInteger(d)&&d>=0&&d<7?d:(new Date().getDay()+6)%7;}
function close(){overlay?.remove();overlay=null;}
function open(){close();const d=currentDay();overlay=document.createElement('div');overlay.className='tl-cross-overlay';const panel=document.createElement('section');panel.className='tl-cross-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');const h=document.createElement('h2');h.textContent=tr('Add from another discipline','Agregar de otra disciplina');const info=document.createElement('p');info.textContent=tr('Choose a discipline. The selected day stays the same and saved exercises remain in their original plans.','Elige una disciplina. Se conserva el día seleccionado y los ejercicios guardados permanecen en sus planes originales.');const list=document.createElement('div');list.className='tl-cross-options';ids.forEach((id,i)=>{const b=document.createElement('button');b.type='button';b.textContent=names[i]+' ›';b.addEventListener('click',()=>{close();window.TrainLabShowDiscipline?.(id);modules()[i]?.openPlan?.(d);refresh();});list.append(b);});const cancel=document.createElement('button');cancel.type='button';cancel.textContent=tr('Cancel','Cancelar');cancel.addEventListener('click',close);panel.append(h,info,list,cancel);overlay.append(panel);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.body.append(overlay);cancel.focus();}
// One daily workout, five original recording engines. Original roots retain their IDs and controls.
const rootIds=['app','cycle-builder','run-builder','swim-builder','tri-builder'];
let active=false,syncing=false,scheduled=false,shownDay=null,lastDay=null,entry=-1,toolsOpen=false,closing=false;
let header,footer,daysRow,heading,progress,empty,tools;
const cards=()=>rootIds.flatMap(id=>[...document.getElementById(id).querySelectorAll('[data-tl-card]')]);
function setText(el,value){if(el.textContent!==value)el.textContent=value;}
function deactivate(){active=false;shownDay=null;entry=-1;toolsOpen=false;if(tools)tools.setAttribute('aria-expanded','false');document.body.classList.remove('tl-unified-active','tl-unified-tools');}
function openDay(i){if(!Number.isInteger(i)||i<0||i>6)return;const j=activeModule();if(j<0)return;syncing=true;try{modules()[j].openWorkout(i);}finally{syncing=false;}refresh();}
function enter(id){const i=ids.indexOf(id);if(i<0)return;openDay(lastDay??modules()[i].getDay());}
function edit(){const i=activeModule(),d=shownDay;if(i<0||d==null)return;deactivate();modules()[i].openPlan(d);refresh();}
function closeOtherDiscipline(target){if(!active||closing||!target||target.getAttribute('aria-expanded')==='true')return;const id=target.closest('[data-tl-card]')?.dataset.tlCard;if(!id)return;closing=true;try{cards().filter(c=>c.dataset.tlCard!==id).forEach(c=>{const b=c.querySelector('[data-tl-toggle][aria-expanded="true"]');if(b)b.click();});}finally{closing=false;}}
function ensureSingleExpansion(){const expanded=cards().map(c=>c.querySelector('[data-tl-toggle][aria-expanded="true"]')).filter(Boolean);if(expanded.length<2)return;closing=true;try{expanded.slice(1).forEach(b=>b.isConnected&&b.click());}finally{closing=false;}}
function decorate(all){
 const counts=all.filter(c=>c.dataset.tlDone==='true').length;
 const signature=JSON.stringify([counts,all.length,lang()]);
 if(progress.dataset.signature!==signature){progress.dataset.signature=signature;progress.querySelector('strong').textContent=tr("Today's progress",'Progreso de hoy');progress.querySelector('span').textContent=counts+' '+tr('of','de')+' '+all.length+' '+tr('completed','completados');progress.querySelector('.tl-unified-track>div').style.width=(all.length?100*counts/all.length:0)+'%';}
 empty.hidden=all.length>0;setText(empty,tr('No exercises scheduled for this day. Use Edit Plan to add activities.','No hay ejercicios programados para este día. Usa Editar plan para agregar actividades.'));
 rootIds.forEach((id,i)=>{const host=document.getElementById(id);host.dataset.tlHasCards=String(all.some(c=>c.dataset.tlCard===ids[i]));});
 document.body.classList.toggle('tl-unified-mixed',new Set(all.map(c=>c.dataset.tlCard)).size>1);
 all.forEach(c=>{const id=c.dataset.tlCard,i=ids.indexOf(id);if(c.querySelector('.tl-unified-discipline'))return;const target=c.querySelector(({strength:'.tb-exercise-heading',cycle:'.cy28-text',run:'.run-title-button',swim:'.sw-exercise-header > div',tri:'.tri-exercise-toggle > span:nth-child(3)'})[id]);if(target){const tag=document.createElement('small');tag.className='tl-unified-discipline';tag.textContent=names[i];target.append(tag);}});
}
// 3B.16: one read-only selection overview, derived from each original module.
// Native controls remain the only writers of plan data, including Swim configuration.
let planOverview=null;
function clearPlanOverview(){planOverview?.remove();planOverview=null;}
function renderPlanOverview(i,d){
 const host=document.getElementById(rootIds[i]);
 const tabs=host?.querySelector(['.tb-view-actions','.cy-view-tabs','.run-categories','.sw-view-tabs','.tri-tabs'][i]);
 if(!tabs){clearPlanOverview();return;}
 const groups=modules().map(m=>m.getPlanSelections(d));
 const signature=JSON.stringify([i,d,lang(),groups]);
 if(planOverview?.isConnected&&planOverview.dataset.signature===signature&&planOverview.previousElementSibling===tabs)return;
 clearPlanOverview();
 const panel=document.createElement('section');panel.id='tl-plan-selected';panel.dataset.signature=signature;
 const h=document.createElement('h3');const count=groups.reduce((n,g)=>n+g.items.length,0);
 h.textContent=tr('Selected for ','Seleccionados para ')+(lang()?daysEs:days)[d]+' ('+count+')';panel.append(h);
 const note=document.createElement('p');note.textContent=tr('All disciplines · Saved selections','Todas las disciplinas · Selecciones guardadas');panel.append(note);
 groups.forEach((g,j)=>{
  if(!g.items.length)return;
  const section=document.createElement('div');section.className='tl-plan-group';
  const top=document.createElement('div');top.className='tl-plan-group-head';
  const label=document.createElement('strong');label.textContent=names[j]+(g.type==='rest'?' · '+tr('Rest day — retained','Descanso — guardados'):'');top.append(label);
  if(j!==i){const btn=document.createElement('button');btn.type='button';btn.dataset.tlEditDiscipline=ids[j];btn.textContent=tr('Edit','Editar');btn.setAttribute('aria-label',tr('Edit ','Editar ')+names[j]);btn.onclick=()=>{window.TrainLabShowDiscipline(ids[j]);modules()[j].openPlan(d);refresh();};top.append(btn);}
  else{const badge=document.createElement('small');badge.textContent=tr('Editing below','Editando abajo');top.append(badge);}
  section.append(top);
  g.items.forEach(item=>{const row=document.createElement('div');row.className='tl-plan-selected-item';row.dataset.tlSelectedDiscipline=ids[j];row.dataset.tlSelectedId=String(item.id);const mark=document.createElement('span');mark.textContent='✓';mark.setAttribute('aria-hidden','true');const title=document.createElement('span');title.textContent=item.label;row.append(mark,title);section.append(row);});
  panel.append(section);
 });
 if(!count){const empty=document.createElement('p');empty.textContent=tr('No exercises selected for this day. Choose exercises below or add from another discipline.','No hay ejercicios seleccionados para este día. Elige ejercicios abajo o agrega de otra disciplina.');panel.append(empty);}
 tabs.after(panel);planOverview=panel;
}
function refresh(){
 if(!header||syncing)return;
 document.querySelectorAll('.tl-cross-launch').forEach(b=>setText(b,tr('+ Add from another discipline','+ Agregar de otra disciplina')));
 const i=activeModule();if(i<0){if(active)deactivate();clearPlanOverview();return;}if(modules()[i]?.getView?.()!=='workout'){if(active)deactivate();const d=currentDay();lastDay=d;renderPlanOverview(i,d);return;}clearPlanOverview();
 const d=currentDay();
 if(!active||shownDay!==d||entry!==i){syncing=true;try{modules().forEach((m,j)=>{if(j!==i&&m?.openWorkout&&(!active||shownDay!==d||m.getDay()!==d||m.getView()!=='workout'))m.openWorkout(d);});}finally{syncing=false;}shownDay=d;lastDay=d;entry=i;active=true;document.body.classList.add('tl-unified-active');}
 const key=String(d)+'|'+lang();if(header.dataset.signature!==key){header.dataset.signature=key;setText(heading,tr('Daily workout','Rutina diaria')+' — '+(lang()?daysEs:days)[d]);daysRow.querySelectorAll('button').forEach((b,j)=>{setText(b,(lang()?['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])[j]);b.setAttribute('aria-pressed',String(j===d));});setText(header.querySelector('.tl-unified-workout'),tr("Today's Workout",'Rutina de hoy'));setText(header.querySelector('.tl-unified-edit'),tr('Edit Plan','Editar plan'));setText(tools,tr('Session & history tools','Sesión e historial'));}
 ensureSingleExpansion();decorate(cards());
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh();});}
function install(){
 document.querySelectorAll('.tl-cross-launch').forEach(b=>b.addEventListener('click',open));
 const strength=document.getElementById('fitclimb'),module=document.getElementById('module-page');module.before(strength);document.getElementById('run-builder').before(document.getElementById('cycle-builder'));
 header=document.createElement('section');header.id='tl-unified-header';header.innerHTML='<h2></h2><div class="tl-unified-days"></div><div class="tl-unified-tabs"><button type="button" class="tl-unified-workout" aria-pressed="true"></button><button type="button" class="tl-unified-edit"></button></div><div class="tl-unified-progress" role="status"><div><strong></strong><span></span></div><div class="tl-unified-track"><div></div></div></div><p class="tl-unified-empty" hidden></p>';strength.before(header);
 heading=header.querySelector('h2');daysRow=header.querySelector('.tl-unified-days');progress=header.querySelector('.tl-unified-progress');empty=header.querySelector('.tl-unified-empty');
 days.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.dataset.tlUnifiedDay=String(i);b.addEventListener('click',()=>openDay(i));daysRow.append(b);});
 header.querySelector('.tl-unified-edit').addEventListener('click',edit);
 footer=document.createElement('div');footer.id='tl-unified-footer';tools=document.createElement('button');tools.type='button';tools.setAttribute('aria-expanded','false');tools.addEventListener('click',()=>{toolsOpen=!toolsOpen;tools.setAttribute('aria-expanded',String(toolsOpen));document.body.classList.toggle('tl-unified-tools',toolsOpen);});footer.append(tools);module.after(footer);
 const observer=new MutationObserver(schedule);rootIds.forEach(id=>observer.observe(document.getElementById(id),{childList:true,subtree:true}));[strength,module].forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));
 document.getElementById('language-toggle')?.addEventListener('change',schedule);
 document.addEventListener('click',e=>{if(!closing)closeOtherDiscipline(e.target.closest('[data-tl-toggle]'));},true);
 document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')closeOtherDiscipline(e.target.closest('.sw-exercise-header[data-tl-toggle]'));},true);
 document.addEventListener('click',schedule);document.addEventListener('change',schedule);refresh();
}
window.TrainLabUnified={get active(){return active;},get syncing(){return syncing;},enter,onScreenChange(name){if(name==='home'||name==='profile'){if(active)deactivate();clearPlanOverview();}schedule();}};
const style=document.createElement('style');style.textContent=`.tl-cross-launch{display:block;width:100%;min-height:48px;margin:12px 0;padding:12px;border:1px solid #527fa0;border-radius:10px;background:#122d43;color:#fff;font-weight:700}.tl-cross-overlay{position:fixed;inset:0;z-index:9999;background:#000c;display:flex;align-items:center;justify-content:center;padding:16px}.tl-cross-panel{background:#0e263b;border:1px solid #4d7796;border-radius:16px;padding:20px;width:min(100%,440px);max-height:90dvh;overflow:auto;color:white}.tl-cross-panel h2{font-size:20px}.tl-cross-panel p{font-size:13px;line-height:1.5;color:#c3d6e5}.tl-cross-options{display:grid;gap:8px;margin:16px 0}.tl-cross-options button{min-height:48px;text-align:left;padding:12px;background:#153b58;color:white;border:1px solid #477795;border-radius:9px}.tl-cross-summary{margin:12px 0;padding:12px;border:1px solid #456a83;border-radius:10px;background:#102d43;color:white}.tl-cross-summary h3{font-size:14px;margin:0 0 8px}.tl-cross-summary ul{margin:0;padding-left:20px;max-height:180px;overflow:auto}.tl-cross-summary li{padding:3px 0;font-size:13px}.tl-cross-summary p{font-size:13px}`;document.head.append(style);
const planStyle=document.createElement('style');planStyle.textContent=`
#tl-plan-selected{border:1px solid #45647c;background:#10283d;border-radius:12px;padding:12px;margin:10px 0 14px;color:#fff}
#tl-plan-selected h3{font-size:16px!important;margin:0 0 4px!important;display:block!important}
#tl-plan-selected p{font-size:12px;color:#bbd2e2;margin:4px 0 8px;line-height:1.4}
.tl-plan-group{border-top:1px solid #34516c;padding:8px 0 4px}
.tl-plan-group-head{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;font-size:11px;color:#8ac9f3}
.tl-plan-group-head strong{min-width:0;overflow-wrap:anywhere}.tl-plan-group-head small{font-size:11px;color:#b8cddd}
.tl-plan-group-head button{min-height:36px;padding:6px 12px;min-width:64px;font-size:12px;border-radius:8px}
.tl-plan-selected-item{display:flex;align-items:baseline;gap:8px;padding:6px 0 3px;font-size:14px;line-height:1.35;overflow-wrap:anywhere}
.tl-plan-selected-item>span:first-child{color:#6dd5aa;font-weight:bold;flex:none}.tl-plan-selected-item>span:last-child{min-width:0}
`;document.head.append(planStyle);
const unifiedStyle=document.createElement('style');unifiedStyle.textContent=`
#tl-unified-header,#tl-unified-footer{display:none}
body.tl-unified-active #tl-unified-header,body.tl-unified-active #tl-unified-footer{display:block}
body.tl-unified-active #tl-unified-header{margin:8px 0 4px}
#tl-unified-header h2{font-size:19px;margin:8px 0 12px}
.tl-unified-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:8px 0}
.tl-unified-days button{min-width:0;padding:8px 0;font-size:12px;border-radius:8px}
.tl-unified-days button[aria-pressed=true],.tl-unified-workout{background:#267da9;border-color:#ff4c9c}
.tl-unified-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 12px}
.tl-unified-tabs button{min-height:42px;padding:8px 4px;font-size:14px}
.tl-unified-progress{padding:12px;border:1px solid #49647c;border-radius:12px;margin:8px 0 12px}
.tl-unified-progress>div:first-child{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}
.tl-unified-track{height:5px;border-radius:20px;overflow:hidden;background:#344b5d;margin-top:10px}
.tl-unified-track>div{height:100%;background:#26a777}
.tl-unified-empty{color:#a8c4d6;font-size:14px;padding:12px 0}
#tl-unified-footer{margin-top:16px}#tl-unified-footer button{width:100%;font-size:12px;min-height:38px}
body.tl-unified-active #fitclimb,body.tl-unified-active #module-page{display:block!important;margin:0;padding:0;scroll-snap-type:none!important}
body.tl-unified-active #module-page>div[id$="-builder"]{display:block!important;margin:0;padding:0;scroll-snap-type:none!important}
body.tl-unified-active #fitclimb>.module-header,body.tl-unified-active #fitclimb>#tabs,body.tl-unified-active #fitclimb>.footer,body.tl-unified-active #module-page>.module-header,body.tl-unified-active #module-coming,body.tl-unified-active #back-button{display:none!important}
body.tl-unified-active #app>.days,body.tl-unified-active #app>.tb-view-actions,body.tl-unified-active #app>.tb-session-meta,body.tl-unified-active #app>.tb-run-progress,body.tl-unified-active #app>.card:not([data-tl-card]),body.tl-unified-active #cycle-builder>.cy-weekday-strip,body.tl-unified-active #cycle-builder>.cy-view-tabs,body.tl-unified-active #cycle-builder .cy28-progress,body.tl-unified-active #cycle-builder .cy28n-run-list>p,body.tl-unified-active #run-builder>.run-days,body.tl-unified-active #run-builder>.run-categories,body.tl-unified-active #run-builder .run-day-progress,body.tl-unified-active #run-builder>.card>h3,body.tl-unified-active #run-builder>.card>p,body.tl-unified-active #swim-builder>.sw-workout-day-selector,body.tl-unified-active #swim-builder>.sw-days,body.tl-unified-active #swim-builder>.sw-view-tabs,body.tl-unified-active #swim-builder .sw-daily-progress,body.tl-unified-active #swim-builder .sw-activity-list>p,body.tl-unified-active #tri-builder>.tri-days,body.tl-unified-active #tri-builder>.tri-tabs,body.tl-unified-active #tri-builder>.tri-daily-progress,body.tl-unified-active #tri-builder>p.tri-muted{display:none!important}
body.tl-unified-active #run-builder>.card,body.tl-unified-active #cycle-builder>.cy28n-run-list,body.tl-unified-active #swim-builder>.sw-activity-list{padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
body.tl-unified-active #app>.tb-compact-exercise,body.tl-unified-active #cycle-builder .cy-plan-item,body.tl-unified-active #run-builder .run-exercise-block,body.tl-unified-active #swim-builder .sw-exercise-card,body.tl-unified-active #tri-builder .tri-session{margin:0!important;border:0!important;border-bottom:1px solid #29465e!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;scroll-snap-align:none!important;scroll-snap-stop:normal!important}
body.tl-unified-active #app>.tb-compact-exercise{padding:0!important}
body.tl-unified-active #cycle-builder .cy-config:has(.cy-session){display:block;padding:4px 0 12px!important}body.tl-unified-active #cycle-builder .cy-config[hidden]{display:none!important}
body.tl-unified-active #run-builder .run-exercise-block:not(:has([data-tl-toggle][aria-expanded=true]))>.run-record{display:none!important}
body.tl-unified-active:not(.tl-unified-tools) #app>.tb-session-start,body.tl-unified-active:not(.tl-unified-tools) #app>#finish,body.tl-unified-active:not(.tl-unified-tools) #cycle-builder>.cy-history-panel,body.tl-unified-active:not(.tl-unified-tools) #run-builder .run-log,body.tl-unified-active:not(.tl-unified-tools) #swim-builder .sw-history-panel{display:none!important}
body.tl-unified-active:not(.tl-unified-tools) #app[data-tl-has-cards=false],body.tl-unified-active:not(.tl-unified-tools) #module-page>div[id$="-builder"][data-tl-has-cards=false]{display:none!important}
body.tl-unified-active #app[data-tl-has-cards=false]>#finish,body.tl-unified-active #app[data-tl-has-cards=false]>.tb-session-start{display:none!important}
.tl-unified-discipline{display:none!important}body.tl-unified-active.tl-unified-mixed .tl-unified-discipline{display:block!important;font-size:10px!important;color:#79b7de!important;font-weight:600;text-decoration:none!important;margin:2px 0 0}
`;document.head.append(unifiedStyle);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
