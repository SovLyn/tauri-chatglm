const CHATGLM_AI_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

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
