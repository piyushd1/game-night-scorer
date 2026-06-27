// Service worker — cleans up legacy caches and unregisters itself.
// Caching is handled entirely by HTTP Cache-Control headers.
const VERSION = '__VERSION__'; // Replaced by CI to force unique deploy hashes
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
