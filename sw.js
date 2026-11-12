
const CACHE = 'trainlab-v2.94-move-run-inset-removed-18j';

const ASSETS = [
  './',
  './index.html',
  './shared/strength-core.js',
  './registration.html',
  './admin.html',
  './home-images/total-body.webp',
  './home-images/move.webp',
  './home-images/cycle.webp',
  './home-images/run.webp',
  './home-images/swim.webp',
  './home-images/triathlon.webp',
  './triathlon-icons/swim.webp',
  './triathlon-icons/bike.webp',
  './triathlon-icons/run.webp',

  // Precache all Total Body anatomy illustrations for offline use.
  './anatomy/elliptical-warm-up-male.png',
  './anatomy/elliptical-warm-up-female.png',
  './anatomy/romanian-deadlift-male.png',
  './anatomy/romanian-deadlift-female.png',
  './anatomy/leg-press-male.png',
  './anatomy/leg-press-female.png',
  './anatomy/standing-calf-raise-male.png',
  './anatomy/standing-calf-raise-female.png',
  './anatomy/dead-bug-male.png',
  './anatomy/dead-bug-female.png',
  './anatomy/chest-press-male.png',
  './anatomy/chest-press-female.png',
  './anatomy/seated-cable-row-male.png',
  './anatomy/seated-cable-row-female.png',
  './anatomy/lat-pulldown-male.png',
  './anatomy/lat-pulldown-female.png',
  './anatomy/dumbbell-shoulder-press-male.png',
  './anatomy/dumbbell-shoulder-press-female.png',
  './anatomy/pallof-press-male.png',
  './anatomy/pallof-press-female.png',
  './anatomy/side-plank-male.png',
  './anatomy/side-plank-female.png',
  './anatomy/stationary-bike-male.png',
  './anatomy/stationary-bike-female.png',
  './anatomy/goblet-squat-male.png',
  './anatomy/goblet-squat-female.png',
  './anatomy/glute-bridge-male.png',
  './anatomy/glute-bridge-female.png',
  './anatomy/step-up-male.png',
  './anatomy/step-up-female.png',
  './anatomy/farmer-carry-male.png',
  './anatomy/farmer-carry-female.png',
  './anatomy/outdoor-ride-male.png',
  './anatomy/outdoor-ride-female.png',

  './cycle-ui.js',
  './disciplines/cycle.js',
  './cycle-icons/spin-male.webp',
  './cycle-icons/spin-female.webp',
  './cycle-icons/speed-male.webp',
  './cycle-icons/speed-female.webp',
  './cycle-icons/climb-male.webp',
  './cycle-icons/climb-female.webp',
  // SWIM planning module and approved swimmer artwork.
  './swim-ui.js',
  './disciplines/swim.js',
  './swim-icons/endurance-male.webp',
  './swim-icons/endurance-female.webp',
  './swim-icons/intervals-male.webp',
  './swim-icons/intervals-female.webp',
  './swim-icons/technique-male.webp',
  './swim-icons/technique-female.webp',
  './app.js',
  './unified-history.js',
  './workout-timer.js',
  './screen-awake.js',
  './ble-heart-rate.js',
  './boxing-bell-double-ding.wav',
  './disciplines/run.js',
  './disciplines/triathlon.js',
  './anatomy/run/easy-run-female.png',
  './anatomy/run/easy-run-male.png',
  './anatomy/run/long-run-female.png',
  './anatomy/run/long-run-male.png',
  './anatomy/run/short-intervals-female.png',
  './anatomy/run/short-intervals-male.png',
  './anatomy/run/strides-female.png',
  './anatomy/run/strides-male.png',
  './anatomy/run/tempo-run-female.png',
  './anatomy/run/tempo-run-male.png',
  './cycle-icons/climb-female.webp',
  './cycle-icons/climb-male.webp',
  './cycle-icons/speed-female.webp',
  './cycle-icons/speed-male.webp',
  './cycle-icons/spin-female.webp',
  './cycle-icons/spin-male.webp',
  './swim-icons/endurance-female.webp',
  './swim-icons/endurance-male.webp',
  './swim-icons/intervals-female.webp',
  './swim-icons/intervals-male.webp',
  './swim-icons/technique-female.webp',
  './swim-icons/technique-male.webp',
  './anatomy/run/a-skips-female.png',
  './anatomy/run/a-skips-male.png',
  './anatomy/run/butt-kicks-female.png',
  './anatomy/run/butt-kicks-male.png',
  './anatomy/run/cadence-drills-female.png',
  './anatomy/run/cadence-drills-male.png',
  './anatomy/run/calf-raises-female.png',
  './anatomy/run/calf-raises-male.png',
  './anatomy/run/dynamic-mobility-female.png',
  './anatomy/run/dynamic-mobility-male.png',
  './anatomy/run/easy-run-female.png',
  './anatomy/run/easy-run-male.png',
  './anatomy/run/glute-bridges-female.png',
  './anatomy/run/glute-bridges-male.png',
  './anatomy/run/high-knees-female.png',
  './anatomy/run/high-knees-male.png',
  './anatomy/run/hill-repeats-female.png',
  './anatomy/run/hill-repeats-male.png',
  './anatomy/run/long-intervals-female.png',
  './anatomy/run/long-intervals-male.png',
  './anatomy/run/long-run-female.png',
  './anatomy/run/long-run-male.png',
  './anatomy/run/recovery-run-female.png',
  './anatomy/run/recovery-run-male.png',
  './anatomy/run/short-intervals-female.png',
  './anatomy/run/short-intervals-male.png',
  './anatomy/run/single-leg-balance-female.png',
  './anatomy/run/single-leg-balance-male.png',
  './anatomy/run/step-ups-female.png',
  './anatomy/run/step-ups-male.png',
  './anatomy/run/strides-female.png',
  './anatomy/run/strides-male.png',
  './anatomy/run/tempo-run-female.png',
  './anatomy/run/tempo-run-male.png',
  './anatomy/run/treadmill-intervals-female.png',
  './anatomy/run/treadmill-intervals-male.png',
  './anatomy/run/treadmill-run-female.png',
  './anatomy/run/treadmill-run-male.png',

  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './brand-logo.png',
  './train-lab-logo-v2.webp',
  './strength.jpg',
  './cycle.jpg',
  './run.jpg',
  './swim.jpg',
  './tri.jpg'
];

// Install and prepare the new offline cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async cache => {
        // Cache files individually: one unavailable legacy asset must not
        // prevent the service worker from installing or caching other files.
        await Promise.allSettled(ASSETS.map(async asset => {
          const request = new Request(asset, { cache: 'reload' });
          const response = await fetch(request);
          if (!response.ok) throw new Error(`Unavailable asset: ${asset}`);
          await cache.put(request, response);
        }));
      })
  );
});

// Remove only old TrainLab caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('trainlab-') && key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch fresh content when online, cached content when offline.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE)
              .then(cache => cache.put(request, copy))
          );
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('./index.html');
          if (offlinePage) return offlinePage;
        }

        return Response.error();
      })
  );
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
