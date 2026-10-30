
const CACHE = 'trainlab-v2.15.0';

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './disciplines/run.js',
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
      .then(cache => cache.addAll(ASSETS))
      
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
