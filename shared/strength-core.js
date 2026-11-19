/* Shared strength primitives: used by Total Body and Triathlon; no module storage access. */
(function(root){'use strict';
 const FACTOR=2.2046226218;
 function toLbs(value,unit){return unit==='kg'?value*FACTOR:value;}
 function toDisplay(value,unit){return Number((unit==='kg'?value/FACTOR:value).toFixed(2));}
 function validSet(weight,reps){return Number.isFinite(weight)&&weight>=0&&Number.isFinite(reps)&&reps>0;}
 root.TrainLabStrengthCore=Object.freeze({toLbs,toDisplay,validSet});
})(window);
