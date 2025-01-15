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
    url.origin === "chrome-extension" ||
    url.origin === "https://apis.tianapi.com",
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
  const token = localStorage.getItem("token");
  const news = localStorage.getItem("news");
  if (token && news && news.push_news && news.token) {
    getDailyNews()
      .then((news) => {
        console.log("daily news: ", news);
      })
      .catch((e) => {
        console.log("daily news error: ", e);
      });
  }
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  console.log("SW Fetch: ", e.request);
});

const CHATGLM_AI_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const NEWS_API_URL = "https://apis.tianapi.com/it/index";

async function getDailyNews(modelToken, newsToken) {
  const url = new URL(NEWS_API_URL);
  url.searchParams.append("key", newsToken);
  url.searchParams.append("num", "20");
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`network error, code: ${response.status}`);
  }
  let res = await response.json();
  if (res.code !== 200) {
    throw new Error(
      `error code: ${res?.code ?? "unknown"}, message: ${res?.msg ?? "unknown"}`
    );
  }
  const newslist = res?.msg?.newslist ?? [];
  const news = [];
  for (const item of newslist) {
    if (!item.url) continue;
    const new_website = await fetch(item.url);
    if (!new_website.ok) continue;
    const new_res = await new_website.text();
    const parser = new DOMParser();
    const dom = parser.parseFromString(new_res, "text/html");
    const content_node = dom.querySelector("#content div.post_body p");
    if (!content_node) continue;
    let single_new = "";
    for (const node of content_node.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        single_new += node.textContent ?? "";
      }
    }
    news.push(`title:${item?.title ?? ""}\ncontent:${single_new}`);
  }
  if (news.length === 0) {
    throw new Error("no news found");
  }
  res = await fetch(CHATGLM_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "glm-4-plus",
      messages: {
        role: "user",
        content: `请将以下新闻内容进行总结，并输出一个简短的新闻标题和新闻内容摘要：\n\n${news.join(
          "\n\n"
        )})\n\n请输出格式为：\n\n标题：\n内容摘要：\n\n`,
      },
    }),
  });
  if (!res.ok) throw new Error("chatglm error");
  const json = await res.json();
  return json?.choices[0]?.message?.content ?? "";
}