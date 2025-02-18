import { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.less";

import { getAnswer, getDailyNews, Message } from "@/utils/chatglm";

import { useAppDispatch, useAppSelector } from "@/redux/store";

import { marked } from "marked";
import _ from "lodash";
import hljs from "highlight.js";
import katex from "katex";
import cls from "classnames";
import {
  onAppendAnswer,
  onFailToSend,
  onSendMessage,
  setInput,
  setMessages,
} from "@/redux/slices/chat";

const parseMath = (html: string): string => {
  let pattern = /\[\s([^[\]]*?)\s\]/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const rep = katex.renderToString(
      match[1].replaceAll("&#39;", "'").replaceAll(/&(.*?); /g, "\\$1"),
      {
        throwOnError: false,
        output: "mathml",
      }
    );

    html = html.replace(match[0], `<section><eqn>${rep}</eqn></section>`);
  }

  pattern = /\(\s([^[\)]*?)\s\)/g;

  while ((match = pattern.exec(html)) !== null) {
    const rep = katex.renderToString(
      match[1].replaceAll("&#39;", "'").replaceAll(/&(.*?); /g, "\\$1"),
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
  document.querySelectorAll("pre code:not(.hljs)").forEach((block) => {
    hljs.highlightElement(block as HTMLElement);
  });

  document.querySelectorAll("pre code").forEach((block) => {
    const pattern = /language-(\S*)/g;
    const match = pattern.exec(block.className);

    if (match) {
      const div = document.createElement("div");
      div.className = styles.tag;
      div.innerText = match[1];
      block.parentElement?.appendChild(div);
    }
  });
};

const Chat: FC = () => {
  const dispatch = useAppDispatch();
  const { token, model, theme } = useAppSelector((state) => state.common);
  const { input, messages } = useAppSelector((state) => state.chat);

  const chatRef = useRef<HTMLDivElement>(null);
  const [buttonAble, setButtonAble] = useState(true);

  useEffect(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    let newsToday = "";
    for (let key in localStorage) {
      if (key.startsWith("news_")) {
        let [_, date] = key.split("_");
        if (Number(date) < today) {
          localStorage.removeItem(key);
        } else {
          newsToday = localStorage.getItem(key) || "";
        }
      }
    }
    if (messages.length == 0) {
      let newsConfig = JSON.parse(localStorage.getItem("news") || "{}");
      if (token && newsConfig && newsConfig.token && newsConfig.push_news) {
        if (newsToday) {
          dispatch(setMessages([{ role: "assistant", content: newsToday }]));
        } else {
          setButtonAble(false);
          dispatch(setMessages([{ role: "assistant", content: "" }]));
          getDailyNews(
            token,
            newsConfig.token as string,
            (res) => {
              dispatch(onAppendAnswer(res));
            },
            (total) => {
              if (!total) {
                dispatch(
                  setMessages([
                    {
                      role: "assistant",
                      content: "今日新闻获取失败，请稍后再试",
                    },
                  ])
                );
              } else {
                localStorage.setItem(
                  "messages",
                  JSON.stringify([
                    {
                      role: "assistant",
                      content: total,
                    },
                  ])
                );
                highlight();
              }
            }
          )
            .catch((err) => {
              dispatch(
                setMessages([
                  { role: "assistant", content: "获取新闻失败, 错误：" + err },
                ])
              );
            })
            .finally(() => {
              setButtonAble(true);
            });
        }
      }
    }
  }, []);

  useEffect(() => {
    highlight();
  }, []);

  const handleSend = useCallback(
    (message: Message) => {
      if (!buttonAble || !token) return;
      setButtonAble(false);
      dispatch(setInput(""));
      dispatch(onSendMessage(message));
      if (chatRef.current) {
        const scrollToBottom = _.debounce(() => {
          chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
          });
        });
        getAnswer(
          model,
          token,
          [...messages, message],
          (res) => {
            dispatch(onAppendAnswer(res));
            scrollToBottom();
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
            highlight();
          },

          (error) => {
            setButtonAble(true);
            dispatch(onFailToSend(error));
          }
        );
      }
    },

    [token, messages, buttonAble]
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
        {messages.map((m, i) => (
          <div className={styles.row} id={`chat row ${i}`} key={i}>
            <div
              className={styles[m.role]}
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
          value={input}
          onChange={(e) => dispatch(setInput(e.target.value))}
          name="input"
        />
        <div className={styles.buttons}>
          <button
            className={cls(
              styles.button,
              buttonAble && messages.length > 0
                ? styles["button-clickable"]
                : styles["button-disable"]
            )}
            onClick={() => {
              if (!buttonAble || messages.length === 0) return;
              localStorage.setItem(
                `history_${Date.now()}`,
                JSON.stringify({ content: messages })
              );
              dispatch(setMessages([]));
              localStorage.removeItem("messages");
            }}>
            归档
          </button>
          <button
            className={cls(
              styles.button,
              buttonAble && token
                ? styles["button-clickable"]
                : styles["button-disable"]
            )}
            onClick={() => {
              handleSend({
                role: "user",
                content: input,
              });
            }}>
            发送
          </button>
          <button
            className={cls(
              styles.button,
              buttonAble && token
                ? styles["button-clickable"]
                : styles["button-disable"]
            )}
            onClick={() => {
              dispatch(setMessages([]));
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
