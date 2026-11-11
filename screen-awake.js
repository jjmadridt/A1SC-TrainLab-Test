/* Train Lab app-wide foreground screen wake lock. Does not prevent manual locking. */
(()=>{
 'use strict';
 let lock=null,pending=false;
 async function acquire(){
  if(document.visibilityState!=='visible'||pending||lock&&!lock.released)return;
  if(!navigator.wakeLock||!navigator.wakeLock.request)return;
  pending=true;
  try{
   const requested=await navigator.wakeLock.request('screen');
   if(document.visibilityState!=='visible'){await requested.release();return;}
   lock=requested;
   requested.addEventListener('release',()=>{if(lock===requested)lock=null;});
  }catch(err){console.info('Train Lab screen wake lock unavailable:',err?.name||err);}
  finally{pending=false;}
 }
 function release(){const old=lock;lock=null;if(old&&!old.released)old.release().catch(()=>{});}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release();else acquire();});
 window.addEventListener('focus',acquire);
 document.addEventListener('pointerdown',acquire,{passive:true});
 acquire();
})();
