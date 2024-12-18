import { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.less";

import { getAnswer, Message } from "@/utils/chatglm";

import { useAppSelector } from "@/redux/store";

import { marked } from "marked";
import _ from "lodash";
import hljs from "highlight.js";
import katex from "katex";

const parseMath = (html: string): string => {
  let pattern = /\[ ([\s\S]*?) \]/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const rep = katex.renderToString(
      match[1].replaceAll("&#39;", "'").replaceAll(/&(.*?);/g, "\\$1"),
      {
        throwOnError: false,
        output: "mathml",
      }
    );
    html = html.replace(match[0], `<section><eqn>${rep}</eqn></section>`);
  }

  pattern = /\( (.*?) \)/g;
  while ((match = pattern.exec(html)) !== null) {
    const rep = katex.renderToString(
      match[1].replaceAll("&#39;", "'").replaceAll(/&(.*?);/g, "\\$1"),
      {
        throwOnError: false,
        output: "mathml",
      }
    );
    html = html.replace(match[0], `<eq>${rep}</eq>`);
  }

  return html;
};

const highlight = () => {
  hljs.highlightAll();

  document.querySelectorAll("pre code").forEach((block) => {
    const pattern = /language-(\S*)/g;
    const match = pattern.exec(block.className);

    if (match) {
      block.setAttribute("data-language", match[1]);
    }
  });
};

const Chat: FC = () => {
  const { token, model, theme } = useAppSelector((state) => state.common);

  const [messages, setMessages] = useState<Message[]>(
    JSON.parse(localStorage.getItem("messages") ?? "[]")
  );
  const chatRef = useRef<HTMLDivElement>(null);
  const [buttonAble, setButtonAble] = useState(true);
  const [input, setInput] = useState("");

  useEffect(
    _.debounce(
      () => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      },

      300
    ),
    [messages]
  );

  useEffect(() => {
    highlight();
  }, []);

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
          model,
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
            hljs.highlightAll();
          },

          (error) => {
            setButtonAble(true);

            setMessages((prev) => {
              const res = [...prev];
              res.pop();

              res.push({
                role: "system",
                content: error.toString(),
              });
              localStorage.setItem("messages", JSON.stringify(res));
              return prev;
            });
            alert(error);
          }
        );
      }
    },

    [token]
  );

  return (
    <div className={styles.container}>
      <div className={styles.chat} ref={chatRef}>
        {theme === "dark" ? (
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/paraiso-dark.min.css"
          />
        ) : (
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.0/styles/paraiso-light.min.css"
          />
        )}
        {messages
          .filter((c) => c.role !== "system")
          .map((m, i) => (
            <div className={styles.row} id={`chat row $ {i}`} key={i}>
              <div
                className={m.role === "user" ? styles.self : styles.other}
                dangerouslySetInnerHTML={{
                  __html: parseMath(
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
