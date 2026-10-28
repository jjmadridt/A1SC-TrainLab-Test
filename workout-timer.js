/* Train Lab shared workout timer — testing build. Does not auto-log activities. */
(()=>{
'use strict';
const style=document.createElement('style');style.textContent=`#tl-timer-open{position:fixed;right:16px;bottom:18px;z-index:990;background:#1465dc;color:white;border:1px solid #8db7ff;border-radius:24px;padding:12px 18px;font-weight:700;box-shadow:0 4px 18px #0008}#tl-timer-panel{position:fixed;inset:0;background:#000c;z-index:1000;display:none;align-items:center;justify-content:center;padding:16px}#tl-timer-panel.visible{display:flex}#tl-timer-panel .timer-card{background:#151c29;color:white;border:1px solid #52637d;border-radius:18px;padding:22px;width:min(440px,100%);max-height:90vh;overflow:auto}#tl-timer-panel button{margin:5px;padding:10px 14px;border-radius:8px;background:#246ce4;color:white;border:0}#tl-timer-panel button:disabled{opacity:.45}#tl-timer-panel input,#tl-timer-panel select{width:100%;padding:9px;margin:5px 0 12px;background:#fff;color:#111;border-radius:6px}#tl-clock{font-size:54px;font-variant-numeric:tabular-nums;text-align:center;font-weight:800}#tl-phase{text-align:center;color:#9cd1ff}#tl-timer-panel label{display:block;font-size:13px}`;document.head.append(style);
const launch=document.createElement('button');launch.id='tl-timer-open';launch.type='button';launch.textContent='⏱ Timer';document.body.append(launch);
const overlay=document.createElement('div');overlay.id='tl-timer-panel';overlay.innerHTML=`<div class="timer-card" role="dialog" aria-modal="true" aria-label="Workout timer"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Workout Timer</h2><button id="tl-close" type="button">✕</button></div><label>Mode<select id="tl-mode"><option value="countdown">Countdown</option><option value="stopwatch">Stopwatch</option><option value="interval">Intervals</option></select></label><div id="tl-config"><label>Duration (seconds)<input id="tl-duration" type="number" min="1" max="7200" value="60"></label></div><div id="tl-interval-config" style="display:none"><label>Peak cycles (1–10)<input id="tl-cycles" type="number" min="1" max="10" value="5"></label><label>Peak (seconds, 30–900)<input id="tl-peak" type="number" min="30" max="900" value="60"></label><label>Recovery (seconds, 30–1200)<input id="tl-recovery" type="number" min="30" max="1200" value="120"></label></div><div id="tl-phase">Ready</div><div id="tl-clock">01:00</div><div style="text-align:center"><button id="tl-start">Start</button><button id="tl-pause" disabled>Pause</button><button id="tl-stop">Stop</button><button id="tl-reset">Reset</button></div><p style="font-size:12px;color:#bdc9da">A chime marks phase changes. Workout logging always requires confirmation.</p></div>`;document.body.append(overlay);
const el=id=>document.getElementById('tl-'+id);let state={mode:'countdown',remaining:60,elapsed:0,running:false,phase:0,segments:[],origin:null,index:null,deadline:0};let ticker=null;
const clock=n=>`${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;
function chime(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);osc.onended=()=>ctx.close()}catch(e){}}
function stop(){if(ticker)clearInterval(ticker);ticker=null;state.running=false;el('start').disabled=false;el('pause').disabled=true;el('pause').textContent='Pause'}
function values(){const mode=el('mode').value,duration=Number(el('duration').value),cycles=Number(el('cycles').value),peak=Number(el('peak').value),recovery=Number(el('recovery').value);if(mode==='countdown'&&(!Number.isInteger(duration)||duration<1||duration>7200))throw Error('Enter a duration between 1 and 7200 seconds.');if(mode==='interval'&&(!Number.isInteger(cycles)||cycles<1||cycles>10||!Number.isInteger(peak)||peak<30||peak>900||!Number.isInteger(recovery)||recovery<30||recovery>1200))throw Error('Check interval count and peak/recovery durations.');return{mode,duration,cycles,peak,recovery}}
function reset(){stop();let v;try{v=values()}catch(e){alert(e.message);return}state.mode=v.mode;state.elapsed=0;state.phase=0;state.segments=[];if(v.mode==='interval')for(let i=0;i<v.cycles;i++){state.segments.push({name:`Peak ${i+1}/${v.cycles}`,seconds:v.peak});if(i<v.cycles-1)state.segments.push({name:'Recovery',seconds:v.recovery})}state.remaining=v.mode==='stopwatch'?0:v.mode==='interval'?state.segments[0].seconds:v.duration;el('phase').textContent=v.mode==='interval'?state.segments[0].name:'Ready';el('clock').textContent=clock(state.remaining)}
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
 el('mode').value=mode==='bike'?'interval':'countdown';
 if(mode==='plank'){
  const field=document.getElementById('count-'+index);
  const exercise=typeof PROGRAM!=='undefined'?PROGRAM[day]?.ex[index]:null;
  const entered=Number(field?.value);
  el('duration').value=Number.isFinite(entered)&&entered>0?Math.round(entered):(exercise?Number(exercise[4])||60:60);
 }
 if(mode==='bike'){
  const cfg=typeof db!=='undefined'&&db.bikeIntervals||{};
  el('cycles').value=Math.max(1,cfg.cycles||1);el('peak').value=cfg.peak||60;el('recovery').value=cfg.recovery||120;
  if(!cfg.cycles){el('mode').value='countdown';const minutes=document.getElementById('count-'+index);el('duration').value=Math.max(1,Math.round(Number(minutes?.value||60)*60));}
 }
 if(mode==='manual'){const field=document.querySelector('[data-reps]:focus');if(field&&Number(field.value)>0)el('duration').value=Math.round(Number(field.value));}
 config();overlay.classList.add('visible');reset();
}
function config(){el('config').style.display=el('mode').value==='countdown'?'block':'none';el('interval-config').style.display=el('mode').value==='interval'?'block':'none'}
launch.onclick=()=>open('manual',null);document.addEventListener('click',e=>{const btn=e.target.closest('[data-open-timer]');if(btn)open(btn.dataset.openTimer,Number(btn.dataset.exerciseIndex))});el('close').onclick=()=>{stop();overlay.classList.remove('visible')};el('mode').onchange=()=>{config();reset()};['duration','cycles','peak','recovery'].forEach(id=>el(id).onchange=reset);el('reset').onclick=reset;el('stop').onclick=()=>{
 if(state.running)tick();
 if(state.mode!=='stopwatch'){
  const current=state.segments.length?state.segments[state.phase].seconds:Number(el('duration').value);
  state.elapsed+=Math.max(0,current-state.remaining);
 }
 finish(false)
};
el('start').onclick=()=>{if(state.running)return;if(state.mode!=='stopwatch'&&state.remaining<=0)reset();state.running=true;state.deadline=performance.now()+(state.mode==='stopwatch'?-state.elapsed:state.remaining)*1000;el('start').disabled=true;el('pause').disabled=false;el('phase').textContent=state.mode==='interval'?state.segments[state.phase].name:'Running';chime();ticker=setInterval(tick,150)};el('pause').onclick=()=>{if(state.running){tick();if(state.mode!=='stopwatch'){const current=state.segments.length?state.segments[state.phase].seconds:Number(el('duration').value);state.elapsed+=Math.max(0,current-state.remaining);state.segments.length&&(state.segments[state.phase].seconds=state.remaining);if(!state.segments.length)el('duration').value=state.remaining;}stop();el('pause').disabled=false;el('pause').textContent='Resume';el('phase').textContent='Paused'}else{state.running=true;state.deadline=performance.now()+(state.mode==='stopwatch'?-state.elapsed:state.remaining)*1000;el('start').disabled=true;el('pause').textContent='Pause';el('phase').textContent=state.mode==='interval'?state.segments[state.phase].name:'Running';ticker=setInterval(tick,150)}};
})();
