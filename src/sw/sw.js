const dataCacheName = "cache-v1";
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
];
const LongCacheTime = 3 * 24 * 60 * 60 * 1000; // 3 days
const ShortCacheTime = 60 * 60 * 1000; // 1 hour

const NoCacheRegex = [/^chrome-extension/, /^ https:\/\/open\.bigmodel\.cn/];

self.addEventListener("install", (e) => {
  console.log("SW Install");
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      console.log("SW precaching");
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("SW Activate");
  e.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== cacheName && key !== dataCacheName) {
            console.log("SW Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  console.log("SW Fetch", e.request.url);

  let matchNoCache = false;
  for (let i = 0; i < NoCacheRegex.length; i++) {
    if (NoCacheRegex[i].test(e.request.url)) {
      matchNoCache = true;
      break;
    }
  }

  let matchLongCache = false;
  if (!matchNoCache) {
    for (let i = 0; i < LongCacheSuffix.length; i++) {
      if (e.request.url.indexOf(LongCacheSuffix[i]) > 0) {
        matchLongCache = true;
        break;
      }
    }
  }

  if (matchNoCache) {
    console.log("SW No cache match");
    e.respondWith(fetch(e.request));
  } else {
    console.log("SW Cache match: ", matchLongCache ? "Long" : "Short");
    e.respondWith(
      caches
        .match(e.request)
        .then((response) => {
          if (!response) throw "No cache match";
          if (response.headers.get("SW-Cache-Expires") <= Date.now())
            throw "Cache expired";
          return response;
        })
        .catch(async (err) => {
          console.log(
            "due to error: ",
            err,
            ", SW Fetching from network",
            e.request.url
          );
          const res = await fetch(e.request);
          const clonedRes = res.clone();
          let headers = new Headers(clonedRes.headers);
          headers.set(
            "SW-Cache-Expires",
            Date.now() + matchLongCache ? LongCacheTime : ShortCacheTime
          );
          caches.open(cacheName).then((cache) => {
            cache.delete(e.request.url);
            clonedRes.blob().then((blob) => {
              cache.put(
                e.request,
                new Response(blob, {
                  headers,
                  status: res.status,
                  statusText: res.statusText,
                })
              );
            });
          });
          return res;
        })
    );
  }
});
