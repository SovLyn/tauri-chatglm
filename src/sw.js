import { precacheAndRoute } from "workbox-precaching";
precacheAndRoute(self.__WB_MANIFEST);

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js"
);

workbox.skipWaiting();
workbox.clientsClaim();

if (workbox) {
  workbox.routing.registerRoute(
    new RegExp("(?!.*\\/api).*"),
    workbox.strategies.cacheFirst({
      cacheName: "static-resources",
    })
  );
  workbox.routing.registerRoute(
    new RegExp("^https://cdnjs.cloudflare.com/.*"),
    workbox.strategies.cacheFirst({
      cacheName: "cloudflare-cdn-resources",
    })
  );
  workbox.routing.registerRoute(
    new RegExp("^chrome-extension://.*", "^https://open.bigmodel.cn/.*"),
    new workbox.strategies.NetworkOnly()
  );
}

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
