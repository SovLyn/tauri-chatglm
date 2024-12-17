import { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.less";

import { getAnswer, Message } from "@/utils/chatglm";

import { useAppSelector } from "@/redux/store";

import { marked } from "marked";
import hljs from "highlight.js";
import _ from "lodash";
import katex from "katex";

const mathParse = (html: string): string => {
  let pattern = /\[(.*?)\]/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const result = katex.renderToString(match[1], {
      throwOnError: false,
      output: "mathml",
    });
    html = html.replace(
      `[${match[1]}]`,
      `<section><eqn>${result}</eqn></section>`
    );
  }

  pattern = /$$(.*?)$$/g;
  while ((match = pattern.exec(html)) !== null) {
    const result = katex.renderToString(match[1], {
      throwOnError: false,
      output: "mathml",
    });
    html = html.replace(
      `$$${match[1]}$$`,
      `<section><eqn>${result}<section><eqn>`
    );
  }

  pattern = /\((.*?)\)/g;
  while ((match = pattern.exec(html)) !== null) {
    const result = katex.renderToString(match[1], {
      throwOnError: false,
      output: "mathml",
    });
    html = html.replace(`(${match[1]})`, `<eq>${result}</eq>`);
  }

  pattern = /\$(.*?)\$\n/g;
  while ((match = pattern.exec(html)) !== null) {
    const result = katex.renderToString(match[1], {
      throwOnError: false,
      output: "mathml",
    });
    html = html.replace(`$${match[1]}$`, `<eq>${result}</eq>`);
  }
  return html;
};

const Chat: FC = () => {
  const { model, token, theme } = useAppSelector((state) => state.common);

  const [messages, setMessages] = useState<Message[]>(
    JSON.parse(localStorage.getItem("messages") ?? "[]")
  );
  const chatRef = useRef<HTMLDivElement>(null);
  const [buttonAble, setButtonAble] = useState(true);
  const [input, setInput] = useState("");

  useEffect(
    _.debounce(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
        hljs.highlightAll();
      }
    }),
    [messages]
  );

  const handleSend = useCallback(
    (message: Message) => {
      if (!buttonAble || !token) return;
      setButtonAble(false);
      setInput("");

      setMessages((prev) => {
        const tmp = [...prev, message];
        localStorage.setItem("messages", JSON.stringify(tmp));

        return [
          ...tmp,
          {
            role: "assistant",
            content: "",
          },
        ];
      });

      if (chatRef.current) {
        getAnswer(
          model as string,
          token,
          [...messages, message],
          (res) => {
            setMessages((prev) => {
              const result = [...prev];
              result[result.length - 1].content += res;
              return result;
            });
          },
          (total) => {
            setButtonAble(true);
            localStorage.setItem(
              "messages",
              JSON.stringify([
                ...messages,
                message,
                {
                  role: "assistant",
                  content: total,
                },
              ])
            );
          }
        );
      }
    },

    [token]
  );

  return (
    <div className={styles.container}>
      <div className={styles.chat} ref={chatRef}>
        {theme === "dark" ||
        (theme === "system" &&
          matchMedia("(prefers-color-scheme: dark)").matches) ? (
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"
          />
        ) : (
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css"
          />
        )}
        {messages.map((m, i) => (
          <div className={styles.row} id={`chat row $ {i}`} key={i}>
            <div
              className={m.role === "user" ? styles.self : styles.other}
              dangerouslySetInnerHTML={{
                __html: mathParse(
                  marked.parse(m.content, {
                    async: false,
                  })
                ),
              }}></div>
          </div>
        ))}
      </div>
      <div className={styles.input}>
        <textarea
          rows={4}
          placeholder="请输入内容"
          onChange={(e) => setInput(e.target.value)}
          value={input}
        />
        <div className={styles.buttons}>
          <button
            className={
              buttonAble && token
                ? styles["button-clickable"]
                : styles["button-unable"]
            }
            onClick={() => {
              handleSend({
                role: "user",
                content: input,
              });
            }}>
            发送
          </button>
          <button
            className={
              buttonAble && token
                ? styles["button-clickable"]
                : styles["button-unable"]
            }
            onClick={() => {
              setMessages([]);
              localStorage.removeItem("messages");
            }}>
            清除
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
