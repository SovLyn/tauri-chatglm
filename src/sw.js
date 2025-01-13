importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js"
);

workbox.core.clientsClaim();

workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://tauri-test-app.vercel.app",
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "static-resources",
  })
);
workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://cdnjs.cloudflare.com",
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "cloudflare-cdn-resources",
  })
);
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === "https://open.bigmodel.cn" ||
    url.origin === "chrome-extension",
  new workbox.strategies.NetworkOnly()
);

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", (e) => {
  console.log("SW Install");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("SW Activate");
  e.waitUntil(
    caches.keys().then(function (keyList) {
      console.log("SW find keys: ", keyList);
      for (key of keyList) {
        console.log("in cache: ", key, ":");
        caches.match(key).then((cache) => {
          cache.keys().then((keys) => {
            console.log(keys);
          });
        });
      }
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  console.log("SW Fetch: ", e.request);
});
