/* A1SC Train Lab — Step 17W: BLE Heart Rate, Android Chrome first.
   Connection is foreground-only; no claim of background BLE persistence. */
(()=>{'use strict';
 const open=document.getElementById('tl-ble-open'); if(!open)return;
 let device=null, server=null, characteristic=null, reading=null;
 const style=document.createElement('style');
 style.textContent=`#tl-ble-open{padding:9px 10px;font-size:12px;white-space:nowrap}#tl-ble-panel{position:fixed;inset:0;z-index:20000;background:#000b;display:none;align-items:center;justify-content:center;padding:15px}#tl-ble-panel.visible{display:flex}#tl-ble-panel .ble-card{background:#10263b;border:1px solid #45627a;border-radius:16px;max-width:430px;width:100%;padding:18px;color:#eef6ff;box-shadow:0 14px 45px #0008}#tl-ble-panel .ble-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}#tl-ble-panel button{padding:10px}#tl-ble-panel .ble-bpm{font-size:48px;font-weight:800;font-variant-numeric:tabular-nums;margin:12px 0}#tl-ble-panel .ble-note{color:#b4c9db;font-size:12px;line-height:1.5}#tl-ble-panel .ble-status{min-height:32px;color:#c8e2f5;font-size:14px}`;
 document.head.appendChild(style);
 const panel=document.createElement('div');panel.id='tl-ble-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Bluetooth Heart Rate');
 panel.innerHTML=`<div class="ble-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><strong id="ble-title">Bluetooth Heart Rate</strong><button id="ble-close" type="button" aria-label="Close">✕</button></div><div id="ble-bpm" class="ble-bpm">— <span style="font-size:17px">BPM</span></div><div id="ble-device" class="ble-note">No sensor connected</div><p id="ble-status" class="ble-status" aria-live="polite">Ready to pair</p><div class="ble-actions"><button id="ble-connect" type="button">Connect sensor</button><button id="ble-disconnect" type="button" disabled>Disconnect</button></div><p id="ble-note" class="ble-note">Pair a compatible BLE heart-rate broadcaster (for example Garmin fēnix 7 Solar in Broadcast Heart Rate mode). Keep Train Lab visible for live updates. Browser Bluetooth is not guaranteed while the phone is locked.</p></div>`;
 document.body.appendChild(panel);
 // Shared, read-only live HR indicator. It never modifies workout state or recorded sets.
 const live=document.createElement('div');live.id='tl-workout-hr';live.setAttribute('aria-label','Workout heart rate');
 live.innerHTML='<span class="tl-hr-dot">♥</span> <span id="tl-workout-bpm">—</span> <small>BPM</small>';
 document.body.appendChild(live);
 const liveCss=document.createElement('style');
 liveCss.textContent=`#tl-workout-hr{position:fixed;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:8000;display:none;align-items:center;gap:5px;padding:8px 12px;border-radius:22px;background:#10263bf2;border:1px solid #45627a;color:#f3f8ff;box-shadow:0 3px 15px #0007;font-size:17px;font-weight:750;font-variant-numeric:tabular-nums;pointer-events:none}#tl-workout-hr small{font-size:10px;color:#b7cddd;font-weight:500}#tl-workout-hr .tl-hr-dot{color:#fa628c}#tl-workout-hr.hr-disconnected{opacity:.72}#tl-ble-panel.visible~#tl-workout-hr{display:none!important}`;
 document.head.appendChild(liveCss);
 function updateLiveVisibility(){
   const activeModule=document.getElementById('module-page')?.classList.contains('visible');
   const strength=document.getElementById('fitclimb');
   const activeStrength=!!strength && (strength.classList.contains('visible') || (getComputedStyle(strength).display!=='none' && !document.getElementById('landing')?.classList.contains('visible') && !activeModule));
   live.style.display=(activeModule||activeStrength)&&!panel.classList.contains('visible')?'flex':'none';
 }
 const watch=new MutationObserver(()=>updateLiveVisibility());
 watch.observe(document.body,{attributes:true,attributeFilter:['class','style'],subtree:true});
 document.addEventListener('click',()=>requestAnimationFrame(updateLiveVisibility));
 updateLiveVisibility();

 const $=id=>document.getElementById(id),status=s=>{$('ble-status').textContent=s;},setBpm=v=>{$('ble-bpm').innerHTML=(v===null?'—':String(v))+' <span style="font-size:17px">BPM</span>';open.textContent=v===null?'♥ HR':'♥ '+v;document.getElementById('tl-workout-bpm').textContent=v===null?'—':String(v);live.classList.toggle('hr-disconnected',v===null);};
 function spanish(){return document.getElementById('language-toggle')?.value==='es';}
 function labels(){const es=spanish();$('ble-title').textContent=es?'Frecuencia cardíaca Bluetooth':'Bluetooth Heart Rate';$('ble-connect').textContent=es?'Conectar sensor':'Connect sensor';$('ble-disconnect').textContent=es?'Desconectar':'Disconnect';$('ble-close').setAttribute('aria-label',es?'Cerrar':'Close');$('ble-note').textContent=es?'Conecta un sensor de pulso BLE compatible (por ejemplo, Garmin fēnix 7 Solar en modo Transmitir frecuencia cardíaca). Mantén Train Lab visible para lecturas en vivo. Bluetooth no está garantizado con el teléfono bloqueado.':'Pair a compatible BLE heart-rate broadcaster (for example Garmin fēnix 7 Solar in Broadcast Heart Rate mode). Keep Train Lab visible for live updates. Browser Bluetooth is not guaranteed while the phone is locked.';}
 function onValue(event){const view=event.target.value; if(view.byteLength<2)return;const flags=view.getUint8(0);const sixteen=Boolean(flags&1);if(view.byteLength<(sixteen?3:2))return;const bpm=sixteen?view.getUint16(1,true):view.getUint8(1);setBpm(bpm);status(spanish()?'Recibiendo pulso en vivo':'Receiving live heart rate');document.dispatchEvent(new CustomEvent('trainlab:heart-rate',{detail:{bpm,receivedAt:Date.now(),source:device?.name||'BLE HR'}}));}
 function disconnected(){if(characteristic){try{characteristic.removeEventListener('characteristicvaluechanged',onValue);}catch(_){}}characteristic=null;server=null;setBpm(null);$('ble-disconnect').disabled=true;$('ble-connect').disabled=false;status(spanish()?'Sensor desconectado':'Sensor disconnected');}
 async function connect(){labels();if(!navigator.bluetooth){status(spanish()?'Este navegador no admite Web Bluetooth. Usa Chrome en Android con HTTPS.':'Web Bluetooth unavailable. Use Android Chrome over HTTPS.');return;}
 $('ble-connect').disabled=true;status(spanish()?'Buscando sensores…':'Looking for sensors…');
 try{
  // Must occur directly from the user-initiated click flow.
  device=await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}],optionalServices:['battery_service']});
  device.addEventListener('gattserverdisconnected',disconnected);
  status(spanish()?'Conectando…':'Connecting…');server=await device.gatt.connect();
  const service=await server.getPrimaryService('heart_rate');characteristic=await service.getCharacteristic('heart_rate_measurement');
  characteristic.addEventListener('characteristicvaluechanged',onValue);await characteristic.startNotifications();
  $('ble-device').textContent=device.name||'BLE Heart Rate Sensor';$('ble-disconnect').disabled=false;status(spanish()?'Conectado. Esperando pulso…':'Connected. Waiting for heart rate…');
 }catch(e){if(server?.connected)server.disconnect();disconnected();if(e.name==='NotFoundError'){status(spanish()?'No se seleccionó ningún sensor. Confirma que el reloj transmite por Bluetooth.':'No sensor selected. Check the watch is broadcasting over Bluetooth.');}else{status((spanish()?'Error de conexión: ':'Connection error: ')+(e.message||e.name));}}
 finally{$('ble-connect').disabled=Boolean(server?.connected);}
 }
 open.addEventListener('click',()=>{labels();panel.classList.add('visible');updateLiveVisibility();});$('ble-close').addEventListener('click',()=>panel.classList.remove('visible'));
 panel.addEventListener('click',e=>{if(e.target===panel)panel.classList.remove('visible');updateLiveVisibility();});$('ble-connect').addEventListener('click',connect);
 $('ble-disconnect').addEventListener('click',()=>{if(device?.gatt?.connected)device.gatt.disconnect();else disconnected();});
 document.getElementById('language-toggle')?.addEventListener('change',labels);
 window.addEventListener('pagehide',()=>{if(device?.gatt?.connected)device.gatt.disconnect();});
})();
