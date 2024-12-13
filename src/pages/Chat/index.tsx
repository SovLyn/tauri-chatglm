import { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.less";

import { getAnswer, Message } from "@/utils/chatglm";

import { useAppSelector } from "@/redux/store";

import { selectToken } from "@/redux/slices/common";

const Chat: FC = () => {
  const token = useAppSelector(selectToken);

  const [messages, setMessages] = useState<Message[]>(
    JSON.parse(localStorage.getItem("messages") ?? "[]")
  );
  const chatRef = useRef<HTMLDivElement>(null);
  const [buttonAble, setButtonAble] = useState(true);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

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
          "GLM-4-Flash",
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
        {messages.map((m, i) => (
          <div className={styles.row} id={`chat row $ {i}`} key={i}>
            <div className={m.role === "user" ? styles.self : styles.other}>
              {m.content}
            </div>
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
