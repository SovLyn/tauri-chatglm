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
  newsToken: string
): Promise<string> => {
  if ("__TAURI__" in window) {
    const result = await core.invoke("greet", {
      modelToken,
      newsToken,
    });
    if (result && typeof result === "string") {
      const res = JSON.parse(result);
      return (res?.choices?.[0]?.message?.content as string) ?? "";
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
};
