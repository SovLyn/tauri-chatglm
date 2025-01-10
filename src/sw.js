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
    new RegExp("^chrome-extension://.*", "^https://open.bigmodel.cn/.*"),
    new workbox.strategies.NetworkOnly()
  );
}

const cacheName = "resources-v1";
const LongCacheSuffix = [
  ".js",
  ".css",
  ".html",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".ico",
  ".woff",
  ".otf",
  ".app",
  ".dev",
];
const LongCacheTime = 3 * 24 * 60 * 60 * 1000; // 3 days
const ShortCacheTime = 60 * 60 * 1000; // 1 hour

const NoCacheRegex = [/^chrome-extension/, /^https:\/\/open\.bigmodel\.cn/];

self.addEventListener("install", (e) => {
  console.log("SW Install");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("SW Activate");
  e.waitUntil(
    caches.keys().then(function (keyList) {
      console.log("SW find keys: ", keyList);
      caches.open(cacheName).then((cache) => {
        cache.keys().then((k) => {
          console.log("SW find keys in cache: ", k);
        });
      });
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  console.log("SW Fetch: ", e.request);
});
