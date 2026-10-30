/* Train Lab shared workout timer — testing build. Does not auto-log activities. */
(()=>{
'use strict';
const style=document.createElement('style');style.textContent=`#tl-timer-open{position:fixed;right:16px;bottom:18px;z-index:990;background:#1465dc;color:white;border:1px solid #8db7ff;border-radius:24px;padding:12px 18px;font-weight:700;box-shadow:0 4px 18px #0008}#tl-timer-panel{position:fixed;inset:0;background:#000c;z-index:1000;display:none;align-items:center;justify-content:center;padding:16px}#tl-timer-panel.visible{display:flex}#tl-timer-panel .timer-card{background:#151c29;color:white;border:1px solid #52637d;border-radius:18px;padding:22px;width:min(440px,100%);max-height:90vh;overflow:auto}#tl-timer-panel button{margin:5px;padding:10px 14px;border-radius:8px;background:#246ce4;color:white;border:0}#tl-timer-panel button:disabled{opacity:.45}#tl-timer-panel input,#tl-timer-panel select{width:100%;padding:9px;margin:5px 0 12px;background:#fff;color:#111;border-radius:6px}#tl-clock{font-size:54px;font-variant-numeric:tabular-nums;text-align:center;font-weight:800}#tl-phase{text-align:center;color:#9cd1ff}#tl-timer-panel label{display:block;font-size:13px}`;document.head.append(style);
const launch=document.createElement('button');launch.id='tl-timer-open';launch.type='button';launch.textContent='⏱ Timer';document.body.append(launch);
const overlay=document.createElement('div');overlay.id='tl-timer-panel';overlay.innerHTML=`<div class="timer-card" role="dialog" aria-modal="true" aria-label="Workout timer"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Workout Timer</h2><button id="tl-close" type="button">✕</button></div><label>Mode<select id="tl-mode"><option value="countdown">Countdown</option><option value="stopwatch">Stopwatch</option><option value="interval">Intervals</option></select></label><div id="tl-config"><label>Duration<div data-time-editor="duration"></div><input id="tl-duration" type="hidden" value="60"></label></div><div id="tl-interval-config" style="display:none"><label>Peak cycles (1–10)<input id="tl-cycles" type="number" min="1" max="10" value="5"></label><label>Peak duration<div data-time-editor="peak"></div><input id="tl-peak" type="hidden" value="60"></label><label>Recovery duration<div data-time-editor="recovery"></div><input id="tl-recovery" type="hidden" value="120"></label></div><p id="tl-validation" role="status" aria-live="polite" style="display:none;color:#ffd29c;font-size:13px;margin:8px 0"></p><div id="tl-phase">Ready</div><div id="tl-clock">01:00</div><div style="text-align:center"><button id="tl-start">Start</button><button id="tl-pause" disabled>Pause</button><button id="tl-stop">Stop</button><button id="tl-reset">Reset</button></div><p style="font-size:12px;color:#bdc9da">A chime marks phase changes. Workout logging always requires confirmation.</p></div>`;document.body.append(overlay);
// Minute/second editors preserve the existing second-based timer engine and exercise integrations.
const limits={duration:7200,peak:900,recovery:1200};
for(const id of Object.keys(limits)){
 const host=overlay.querySelector(`[data-time-editor="${id}"]`);
 host.innerHTML=`<div class="tl-time-fields"><div><span>Minutes</span><div class="tl-step"><button type="button" data-step="60" aria-label="Increase minutes">＋</button><input type="number" inputmode="numeric" min="0" max="120" data-unit="minutes" aria-label="Minutes"><button type="button" data-step="-60" aria-label="Decrease minutes">−</button></div></div><div><span>Seconds</span><div class="tl-step"><button type="button" data-step="1" aria-label="Increase seconds">＋</button><input type="number" inputmode="numeric" min="0" max="59" data-unit="seconds" aria-label="Seconds"><button type="button" data-step="-1" aria-label="Decrease seconds">−</button></div></div></div>${id==='duration'?'<div class="tl-presets"><button type="button" data-preset="30">30s</button><button type="button" data-preset="60">1 min</button><button type="button" data-preset="90">1:30</button><button type="button" data-preset="120">2 min</button><button type="button" data-preset="300">5 min</button></div>':''}`;
}
const editorStyle=document.createElement('style');editorStyle.textContent=`#tl-timer-panel .tl-time-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0 10px}#tl-timer-panel .tl-time-fields>div{background:#202d42;border:1px solid #425878;border-radius:12px;padding:10px;text-align:center}#tl-timer-panel .tl-time-fields span{display:block;font-size:12px;color:#c2d6f6;margin-bottom:4px}#tl-timer-panel .tl-step{display:flex;flex-direction:column;align-items:center}#tl-timer-panel .tl-step input{box-sizing:border-box;text-align:center;width:100%;font-size:26px;font-weight:700;margin:4px 0;background:#101b2d;color:white;border:1px solid #536b8b}#tl-timer-panel .tl-step button{width:100%;margin:2px 0;padding:5px;background:#2a4879}#tl-timer-panel .tl-presets{display:flex;flex-wrap:wrap;justify-content:center;gap:3px}#tl-timer-panel .tl-presets button{padding:8px 10px;background:#2b456b;margin:2px;font-size:12px}`;document.head.append(editorStyle);
function syncEditor(id){const host=overlay.querySelector(`[data-time-editor="${id}"]`),total=Math.max(0,Number(document.getElementById('tl-'+id).value)||0);host.querySelector('[data-unit="minutes"]').value=Math.floor(total/60);host.querySelector('[data-unit="seconds"]').value=total%60}
function setEditor(id,total){total=Math.max(0,Math.min(limits[id],Math.round(total)||0));document.getElementById('tl-'+id).value=total;syncEditor(id);if(typeof reset==='function'&&!state.running)reset()}
for(const id of Object.keys(limits)){
 const host=overlay.querySelector(`[data-time-editor="${id}"]`);
 host.addEventListener('change',e=>{if(!e.target.matches('[data-unit]'))return;const mins=Number(host.querySelector('[data-unit="minutes"]').value)||0,secs=Number(host.querySelector('[data-unit="seconds"]').value)||0;setEditor(id,mins*60+secs)});
 host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.preset)setEditor(id,Number(b.dataset.preset));else if(b.dataset.step)setEditor(id,Number(document.getElementById('tl-'+id).value)+Number(b.dataset.step))});
 syncEditor(id);
}
const el=id=>document.getElementById('tl-'+id);let state={mode:'countdown',remaining:60,elapsed:0,running:false,phase:0,segments:[],origin:null,index:null,deadline:0};let ticker=null;
const clock=n=>`${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;
function chime(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);osc.onended=()=>ctx.close()}catch(e){}}
function stop(){if(ticker)clearInterval(ticker);ticker=null;state.running=false;el('start').disabled=false;el('pause').disabled=true;el('pause').textContent='Pause'}
function values(){const mode=el('mode').value,duration=Number(el('duration').value),cycles=Number(el('cycles').value),peak=Number(el('peak').value),recovery=Number(el('recovery').value);if(mode==='countdown'&&(!Number.isInteger(duration)||duration<1||duration>7200))throw Error('Enter a duration between 1 and 7200 seconds.');if(mode==='interval'&&(!Number.isInteger(cycles)||cycles<1||cycles>10||!Number.isInteger(peak)||peak<1||peak>900||!Number.isInteger(recovery)||recovery<1||recovery>1200))throw Error('Check interval count and peak/recovery durations.');return{mode,duration,cycles,peak,recovery}}
function reset(){stop();let v;try{v=values();el('validation').style.display='none';el('validation').textContent=''}catch(e){el('validation').textContent=e.message;el('validation').style.display='block';el('phase').textContent='Adjust timer settings';el('start').disabled=true;return false}state.mode=v.mode;state.elapsed=0;state.phase=0;state.segments=[];if(v.mode==='interval')for(let i=0;i<v.cycles;i++){state.segments.push({name:`Peak ${i+1}/${v.cycles}`,seconds:v.peak});if(i<v.cycles-1)state.segments.push({name:'Recovery',seconds:v.recovery})}state.remaining=v.mode==='stopwatch'?0:v.mode==='interval'?state.segments[0].seconds:v.duration;el('phase').textContent=v.mode==='interval'?state.segments[0].name:'Ready';el('clock').textContent=clock(state.remaining);return true}
function finish(completed=true){
 stop();if(completed)chime();el('phase').textContent=completed?'Complete':'Stopped early';
 if(state.origin==='plank'&&state.index!==null){
  overlay.classList.remove('visible');
  try{
   if(typeof tab!=='undefined')tab='Workout';
   if(typeof render==='function')render();
   const field=document.getElementById('count-'+state.index);
   if(field){field.value=String(Math.max(0,Math.round(state.elapsed)));field.dispatchEvent(new Event('change',{bubbles:true}));}
   const btn=document.querySelector(`[data-open-timer="plank"][data-exercise-index="${state.index}"]`);
   if(btn)btn.scrollIntoView({block:'center'});
  }catch(e){console.warn('Unable to return to Plank screen',e)}
 }
}
function tick(){
 if(!state.running)return;
 const now=performance.now();
 if(state.mode==='stopwatch'){state.elapsed=Math.max(0,Math.floor((now-state.deadline)/1000));el('clock').textContent=clock(state.elapsed);return}
 const left=Math.max(0,Math.ceil((state.deadline-now)/1000));
 state.remaining=left;el('clock').textContent=clock(left);
 if(left>0)return;
 state.elapsed+=state.segments.length?state.segments[state.phase].seconds:Number(el('duration').value);
 if(state.mode==='interval'&&state.phase<state.segments.length-1){
  chime();state.phase++;state.remaining=state.segments[state.phase].seconds;state.deadline=now+state.remaining*1000;
  el('phase').textContent=state.segments[state.phase].name;el('clock').textContent=clock(state.remaining);
 }else finish();
}
function open(mode,index){
 state.origin=mode;state.index=index;
 el('mode').value=(mode==='bike'||mode==='run-interval')?'interval':'countdown';
 if(mode==='plank'){
  const field=document.getElementById('count-'+index);
  const exercise=typeof PROGRAM!=='undefined'?PROGRAM[day]?.ex[index]:null;
  const entered=Number(field?.value);
  el('duration').value=Number.isFinite(entered)&&entered>0?Math.round(entered):(exercise?Number(exercise[4])||60:60);
 }
 if(mode==='bike'){
  const cfg=typeof db!=='undefined'&&db.bikeIntervals||{};
  // Read visible exercise inputs at launch, even when a number field has not blurred yet.
  const read=(key,fallback)=>{const input=document.querySelector(`[data-bike-config="${key}"]`);const value=Number(input?input.value:cfg[key]);return Number.isFinite(value)?value:fallback};
  const cycles=read('cycles',0),peak=read('peak',60),recovery=read('recovery',120);
  el('cycles').value=Math.max(1,cycles);el('peak').value=peak;el('recovery').value=recovery;
  if(!cycles){el('mode').value='countdown';const minutes=document.getElementById('count-'+index);el('duration').value=Math.max(1,Math.round(Number(minutes?.value||60)*60));}
 }
 if(mode==='manual'){const field=document.querySelector('[data-reps]:focus');if(field&&Number(field.value)>0)el('duration').value=Math.round(Number(field.value));}
 Object.keys(limits).forEach(syncEditor);config();overlay.classList.add('visible');reset();
}
function config(){el('config').style.display=el('mode').value==='countdown'?'block':'none';el('interval-config').style.display=el('mode').value==='interval'?'block':'none'}
launch.onclick=()=>open('manual',null);document.addEventListener('click',e=>{const btn=e.target.closest('[data-open-timer]');if(btn)open(btn.dataset.openTimer,Number(btn.dataset.exerciseIndex))});el('close').onclick=()=>{stop();overlay.classList.remove('visible')};el('mode').onchange=()=>{config();reset()};['duration','cycles','peak','recovery'].forEach(id=>el(id).onchange=reset);el('reset').onclick=reset;el('stop').onclick=()=>{
 if(!state.running&&el('start').disabled)return;
 if(state.running)tick();
 if(state.mode!=='stopwatch'){
  const current=state.segments.length?state.segments[state.phase].seconds:Number(el('duration').value);
  state.elapsed+=Math.max(0,current-state.remaining);
 }
 finish(false)
};
el('start').onclick=()=>{if(state.running)return;if(state.elapsed===0){if(!reset())return}else if(state.mode!=='stopwatch'&&state.remaining<=0){if(!reset())return}state.running=true;state.deadline=performance.now()+(state.mode==='stopwatch'?-state.elapsed:state.remaining)*1000;el('start').disabled=true;el('pause').disabled=false;el('phase').textContent=state.mode==='interval'?state.segments[state.phase].name:'Running';chime();ticker=setInterval(tick,150)};el('pause').onclick=()=>{if(state.running){tick();if(state.mode!=='stopwatch'){const current=state.segments.length?state.segments[state.phase].seconds:Number(el('duration').value);state.elapsed+=Math.max(0,current-state.remaining);state.segments.length&&(state.segments[state.phase].seconds=state.remaining);if(!state.segments.length){el('duration').value=state.remaining;syncEditor('duration');}}stop();el('pause').disabled=false;el('pause').textContent='Resume';el('phase').textContent='Paused'}else{state.running=true;state.deadline=performance.now()+(state.mode==='stopwatch'?-state.elapsed:state.remaining)*1000;el('start').disabled=true;el('pause').textContent='Pause';el('phase').textContent=state.mode==='interval'?state.segments[state.phase].name:'Running';ticker=setInterval(tick,150)}};
})();
