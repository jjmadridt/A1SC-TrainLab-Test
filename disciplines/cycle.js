/* A1SC Train Lab — Cycle workout library v0.2.0
 * Data-only development module. No UI, timers, network, storage, or registration.
 * Does not activate the Cycle discipline on its own.
 */
(function (root) {
  'use strict';
  const segment = (name, minutes, rpeMin, rpeMax, powerZone = null, repeats = 1) =>
    ({ name, minutes, rpe: [rpeMin, rpeMax], powerZone, repeats });
  const workout = (id, category, name, purpose, segments, options = {}) => ({
    id, category, name, purpose, segments,
    defaultDurationMinutes: segments.reduce((sum, s) => sum + s.minutes * s.repeats, 0),
    adjustable: true,
    modes: ['guided', 'manual'],
    targetRpe: options.targetRpe || [3, 5],
    optionalPowerZone: options.powerZone || null,
    techniqueSafety: options.techniqueSafety || null
  });
  const W = [
    workout('recovery-ride','endurance','Recovery Ride','Low-stress active recovery',[
      segment('Warm-up',5,1,2,'Z1'),segment('Easy spin',20,1,2,'Z1'),segment('Cool-down',5,1,2,'Z1')],{targetRpe:[1,2],powerZone:'Z1'}),
    workout('aerobic-base','endurance','Aerobic Base','Build aerobic endurance',[
      segment('Warm-up',10,2,3,'Z1'),segment('Steady aerobic ride',40,3,4,'Z2'),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[3,4],powerZone:'Z2'}),
    workout('long-endurance','endurance','Long Endurance','Build sustained aerobic capacity',[
      segment('Warm-up',15,2,3,'Z1'),segment('Endurance pace',90,3,5,'Z2'),segment('Cool-down',15,1,2,'Z1')],{targetRpe:[3,5],powerZone:'Z2'}),
    workout('progressive-endurance','endurance','Progressive Endurance','Gradually increase effort',[
      segment('Warm-up',10,2,3,'Z1'),segment('Easy endurance',15,3,4,'Z2'),segment('Steady endurance',15,4,5,'Z2'),segment('Strong finish',10,6,7,'Z3'),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[3,7]}),
    workout('tempo-endurance','endurance','Tempo Endurance','Sustain moderately hard effort',[
      segment('Warm-up',10,2,3,'Z1'),segment('Endurance',15,3,4,'Z2'),segment('Tempo',20,5,6,'Z3'),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[5,6],powerZone:'Z3'}),
    workout('tempo-intervals','intervals','Tempo Intervals','Repeat controlled tempo efforts',[
      segment('Warm-up',12,2,4,'Z1-Z2'),segment('Tempo effort',8,5,6,'Z3',3),segment('Easy recovery',4,1,3,'Z1',2),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[5,6],powerZone:'Z3'}),
    workout('threshold-intervals','intervals','Threshold Intervals','Develop sustained hard efforts',[
      segment('Warm-up',15,2,5,'Z1-Z3'),segment('Threshold effort',6,7,8,'Z4',3),segment('Easy recovery',4,1,3,'Z1',2),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[7,8],powerZone:'Z4'}),
    workout('vo2-max-intervals','intervals','VO₂ Max Intervals','Develop high aerobic power',[
      segment('Warm-up',15,2,5,'Z1-Z3'),segment('Hard effort',3,8,9,'Z5',4),segment('Easy recovery',3,1,3,'Z1',3),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[8,9],powerZone:'Z5'}),
    workout('sprint-repeats','intervals','Sprint Repeats','Practice short maximal accelerations',[
      segment('Warm-up',15,2,5,'Z1-Z3'),segment('Sprint',0.25,9,10,null,6),segment('Easy recovery',3,1,2,'Z1',5),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[9,10],techniqueSafety:'Use a safe, unobstructed route or stationary trainer; do not sprint in traffic.'}),
    workout('over-under-intervals','intervals','Over-Under Intervals','Alternate efforts below and above threshold',[
      segment('Warm-up',15,2,5,'Z1-Z3'),segment('Under threshold',3,6,7,'Z3-Z4',4),segment('Over threshold',2,8,9,'Z4-Z5',4),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[6,9]}),
    workout('cadence-intervals','intervals','Cadence Intervals','Improve cadence control under moderate load',[
      segment('Warm-up',10,2,3,'Z1'),segment('Controlled high cadence',3,4,5,'Z2',5),segment('Normal cadence',3,2,3,'Z1-Z2',4),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[4,5],powerZone:'Z2'}),
    workout('sustained-climbing','technique','Sustained Climbing','Practice even pacing on a long climb',[
      segment('Warm-up',15,2,4,'Z1-Z2'),segment('Sustained climb',30,5,7,'Z3'),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[5,7]}),
    workout('climbing-intervals','technique','Climbing Intervals','Repeat controlled uphill efforts',[
      segment('Warm-up',15,2,4,'Z1-Z2'),segment('Climbing effort',5,7,8,'Z4',4),segment('Easy recovery',5,1,3,'Z1',3),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[7,8]}),
    workout('seated-climbing','technique','Seated Climbing','Practice seated climbing posture and rhythm',[
      segment('Warm-up',10,2,3,'Z1'),segment('Seated climb practice',8,4,6,'Z2-Z3',3),segment('Easy recovery',4,1,3,'Z1',2),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[4,6]}),
    workout('standing-climbing','technique','Standing Climbing','Practice stable out-of-saddle climbing',[
      segment('Warm-up',10,2,3,'Z1'),segment('Standing climb practice',2,5,7,'Z3',5),segment('Seated recovery',4,2,3,'Z1',4),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[5,7],techniqueSafety:'Practice on a safe climb or trainer; maintain bike control and avoid abrupt lateral movement.'}),
    workout('cadence-control','technique','Cadence Control','Develop smooth pedaling at varied cadences',[
      segment('Warm-up',10,2,3,'Z1'),segment('Controlled cadence drill',5,3,5,'Z2',4),segment('Easy spin',3,1,2,'Z1',3),segment('Cool-down',10,1,2,'Z1')],{targetRpe:[3,5],powerZone:'Z2'}),
    workout('bike-handling','technique','Bike Handling','Practice balance, braking, cornering, and positioning',[
      segment('Easy warm-up',10,1,3,null),segment('Handling drills',25,2,4,null),segment('Cool-down',5,1,2,null)],{targetRpe:[2,4],techniqueSafety:'Use a controlled, traffic-free practice area. Do not perform drills in live traffic.'})
  ];
  // A segment with repeats is repeated as a block; recovery ordering is a UI/engine responsibility.
  // v0.2 provides workout definitions only; no timers or activity logging are implemented here.
  const categories = [
    { id:'endurance', name:'Endurance', workoutIds:W.filter(w=>w.category==='endurance').map(w=>w.id) },
    { id:'intervals', name:'Speed & Intervals', workoutIds:W.filter(w=>w.category==='intervals').map(w=>w.id) },
    { id:'technique', name:'Climbing & Technique', workoutIds:W.filter(w=>w.category==='technique').map(w=>w.id) }
  ];
  root.TrainLabCycle = {
    name:'CYCLE', version:'0.2.0', status:'development',
    enabled:false, categories, workouts:W,
    settings:{ primaryIntensity:'RPE', rpeScale:[1,10], powerZonesOptional:true,
      ftpRequiredForPowerTargets:true, modes:['guided','manual'],
      distanceOptional:true, distanceUnits:['km','mi'],
      multipleWorkoutsPerDay:true, manualPauseResume:true, gpsRequired:false,
      offlineFirst:true, registrationRequired:false },
    getWorkout(id){ return W.find(w=>w.id===id)||null; },
    getCategory(id){ return categories.find(c=>c.id===id)||null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
