/* Step 28C: presentation-only compact sticky header. No plan data mutations. */
(function(){'use strict';
const pairs=[['fitclimb','#app .days'],['module-page','#cycle-builder .cy-weekday-strip, #run-builder .run-days, #swim-builder .sw-days, #tri-builder .tri-days']];
const css=document.createElement('style');css.textContent=`
/* Only training screens; home and profile remain unchanged. */
#fitclimb.visible .module-header,#module-page.visible .module-header{height:39px!important;min-height:39px!important;margin:3px 0 0!important;border-radius:9px;align-items:center;display:flex;background:#102c42;position:sticky;top:var(--tl28-shell,54px);z-index:801;isolation:isolate}
#fitclimb .module-header>img,#module-page .module-header>img{left:auto;right:5px;top:3px;width:44px;height:32px;object-fit:cover;object-position:center;border-radius:6px;opacity:.85}
#fitclimb .module-header:after,#module-page .module-header:after{display:none}
#fitclimb .module-header>div,#module-page .module-header>div{padding:4px 56px 4px 10px;min-width:0}
#fitclimb .module-header h1,#module-page .module-header h1{font-size:15px;line-height:1.15;white-space:nowrap}
#fitclimb .module-header p,#module-page .module-header p{display:none}
#fitclimb .days,#module-page .cy-weekday-strip,#module-page .run-days,#module-page .sw-days,#module-page .tri-days{position:sticky!important;top:calc(var(--tl28-shell,54px) + 39px);z-index:800;margin:0!important;padding:2px 0!important;background:#091b2c!important;min-height:36px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
#fitclimb .days button,#module-page .cy-weekday-strip button,#module-page .run-days button,#module-page .sw-days button,#module-page .tri-days button{min-height:31px!important;height:31px!important;padding:3px 0!important;font-size:11px!important;border-radius:7px!important}
#fitclimb .tl-cross-launch,#module-page .tl-cross-launch{position:sticky!important;top:calc(var(--tl28-shell,54px) + 75px);z-index:799;min-height:34px!important;height:34px!important;padding:4px 9px!important;margin:0 0 5px!important;font-size:12px!important;border-radius:7px!important}
#fitclimb .tl-cross-summary,#module-page .tl-cross-summary{position:static}
#fitclimb #app>.row:first-of-type h2{font-size:0!important;margin:0!important;line-height:0!important}
#fitclimb #app>.row:first-of-type h2+small{font-size:12px}
@media(max-width:370px){#fitclimb .days button,#module-page .cy-weekday-strip button,#module-page .run-days button,#module-page .sw-days button,#module-page .tri-days button{font-size:10px!important}}
`;document.head.append(css);
function updateShell(){const shell=document.querySelector('.shell-head');const height=shell?.getBoundingClientRect().height||54;document.documentElement.style.setProperty('--tl28-shell',Math.ceil(height)+'px');}
function place(){updateShell();for(const [id,selector] of pairs){const section=document.getElementById(id);if(!section)continue;const days=section.querySelector(selector);const launch=section.querySelector('.tl-cross-launch');if(!days||!launch)continue;
 // Keep the live day selector and its existing click handlers. Move only the cross-discipline button.
 if(days.nextElementSibling!==launch)days.insertAdjacentElement('afterend',launch);
 const queue=section.querySelector('#tl-cross-queue');if(queue&&queue.previousElementSibling===launch){const builder=section.querySelector('#cycle-builder,#run-builder,#swim-builder,#tri-builder');if(builder&&queue.parentElement!==builder)builder.append(queue);}
 }}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;place();});}
function init(){place();const watch=['app','cycle-builder','run-builder','swim-builder','tri-builder'];watch.forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(schedule).observe(el,{childList:true});});const ro=window.ResizeObserver?new ResizeObserver(updateShell):null;const shell=document.querySelector('.shell-head');if(ro&&shell)ro.observe(shell);window.addEventListener('resize',updateShell);document.addEventListener('click',schedule);document.addEventListener('change',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
