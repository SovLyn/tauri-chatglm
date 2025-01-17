import { core } from "@tauri-apps/api";

const CHATGLM_AI_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const NEWS_API_URL = "https://apis.tianapi.com/it/index";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export const getAnswer = async (
  model: string,
  token: string,
  messages: Message[],
  onUpdate?: (data: string) => void,
  onFinish?: (data: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const response = await fetch(CHATGLM_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
      }),
    });
    if (response.ok) {
      if (!response.body) {
        throw new Error("No response body");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let total = "";
      let buf = "";
      let lastTime = Date.now();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        chunk.split("\n\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;
          if (line === "data: [DONE]") return;
          const result = JSON.parse(line.replace("data: ", ""));
          buf += result.choices[0].delta.content;
        });

        if (Date.now() - lastTime > 100) {
          if (onUpdate) {
            onUpdate(buf);
          }
          lastTime = Date.now();
          total += buf;
          buf = "";
        }
      }
      if (onFinish) {
        onFinish(total);
      }
    } else {
      const res = JSON.parse(await response.text());
      throw new Error(
        `error code: ${res?.error?.code ?? "unknown"}, message: ${
          res?.error?.message ?? "unknown"
        }`
      );
    }
  } catch (error: any) {
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
};

export const getDailyNews = async (
  modelToken: string,
  newsToken: string,
  onUpdate?: (text: string) => void,
  onFinish?: (text: string) => void
) => {
  let news = "";
  if ("__TAURI__" in window) {
    const result = await core.invoke("get_news", {
      newsToken,
    });
    if (result && typeof result === "string") {
      news = result;
    } else {
      throw new Error("unknown error");
    }
  } else {
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
        `error code: ${res?.code ?? "unknown"}, message: ${
          res?.msg ?? "unknown"
        }`
      );
    }
    const newslist = res?.result?.newslist ?? [];
    const newsPromises = newslist.map((item: any) =>
      fetchNews(item?.title, item?.url)
    );
    let newsResults = await Promise.all(newsPromises);
    newsResults = newsResults.filter((item) => item !== null);
    if (newsResults.length === 0) {
      throw new Error("no news found");
    }
    news = newsResults.join("\n");
  }
  if (news.length === 0) {
    throw new Error("no news found");
  }

  let res = await fetch(CHATGLM_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${modelToken}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: "glm-4-long",
      stream: true,
      messages: [
        {
          role: "user",
          content: `请将以下新闻内容进行总结，并输出一个简短的新闻标题和新闻内容摘要，请按markdown格式回答：\n\n${news})`,
        },
      ],
    }),
  });
  if (res.ok) {
    if (!res.body) {
      throw new Error("No response body");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let total = "";
    let buf = "";
    let lastTime = Date.now();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      chunk.split("\n\n").forEach((line) => {
        if (!line.startsWith("data: ")) return;
        if (line === "data: [DONE]") return;
        const result = JSON.parse(line.replace("data: ", ""));
        buf += result.choices[0].delta.content;
      });

      if (Date.now() - lastTime > 100) {
        if (onUpdate) {
          onUpdate(buf);
        }
        lastTime = Date.now();
        total += buf;
        buf = "";
      }
    }
    if (onFinish) {
      onFinish(total);
    }
  } else {
    const result = JSON.parse(await res.text());
    throw new Error(
      `error code: ${result?.error?.code ?? "unknown"}, message: ${
        result?.error?.message ?? "unknown"
      }`
    );
  }
};

const fetchNews = async (
  title?: string,
  url?: string,
  description?: string,
  ctime?: string
): Promise<string | null> => {
  try {
    if (!url) return null;
    const new_website = await fetch(
      `https://cors-anywhere.herokuapp.com/${url}`
    );
    if (!new_website.ok) return null;
    const new_res = await new_website.text();
    const parser = new DOMParser();
    const dom = parser.parseFromString(new_res, "text/html");
    const content_node = dom.querySelectorAll("#content div.post_body p");
    if (!content_node) return null;
    let single_new = "";
    for (const node of content_node) {
      single_new += node.textContent ?? "";
    }
    return `title:${title ?? ""}\ncontent:${single_new}\ndescription:${
      description ?? ""
    }\nctime:${ctime ?? ""}`;
  } catch (e) {
    console.log("on getting ", url, ", got error: ", e);
    return null;
  }
};