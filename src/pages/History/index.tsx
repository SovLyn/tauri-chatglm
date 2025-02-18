import { FC, useCallback, useEffect, useState } from "react";
import styles from "./index.module.less";
import { Message } from "@/utils/chatglm";
import EmptySVG from "@/assets/empty.svg?react";
import DeleteSVG from "@/assets/delete.svg?react";
import { useAppDispatch } from "@/redux/store";
import { setMessages } from "@/redux/slices/chat";
import { useNavigate } from "react-router-dom";
import { Input } from "antd";
import _ from "lodash";

const History: FC = () => {
  const [history, setHistory] = useState<
    { time: Date; message: Message[]; name?: string }[]
  >([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [editing, setEditing] = useState<Date | null>(null);

  useEffect(() => {
    console.log("history useEffect");
    const temp: typeof history = [];
    for (let key in localStorage) {
      if (key.startsWith("history_")) {
        const message = JSON.parse(localStorage.getItem(key) as string);
        if (message && typeof message === "object" && message?.content) {
          temp.push({
            time: new Date(parseInt(key.replace("history_", ""))),
            message: message.content,
            name: message.name,
          });
        }
      }
    }
    temp.sort((a, b) => b.time.getTime() - a.time.getTime());
    setHistory(temp);
  }, []);

  const historyClicked = (message: Message[]) => {
    dispatch(setMessages(message));
    navigate("/");
  };

  const deleteHistory = (time: Date) => {
    localStorage.removeItem(`history_${time.getTime()}`);
    setHistory((prev) => prev.filter((item) => item.time !== time));
  };

  const setName = useCallback(
    _.debounce((time: Date, name: string) => {
      localStorage.setItem(
        `history_${time.getTime()}`,
        JSON.stringify({
          content: history.find((item) => item.time === time)?.message,
          name,
        })
      );
    }),
    [history]
  );

  return (
    <div className={styles.container}>
      {history.length === 0 ? (
        <div className={styles.empty}>
          <EmptySVG />
          <div className={styles.emptyText}>暂无历史记录</div>
        </div>
      ) : (
        history.map((item, i) => (
          <div
            className={styles.item}
            key={`history ${item.time.getTime()}`}
            onClick={() => historyClicked(item.message)}>
            {editing !== item.time ? (
              <div
                className={styles.text}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(item.time);
                }}>
                {item?.name ?? `${item.time.getTime()}`}
              </div>
            ) : (
              <Input
                className={styles.editing}
                value={item.name ?? ""}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  setHistory((prev) => {
                    prev[i].name = e.target.value;
                    return [...prev];
                  });
                  setName(item.time, e.target.value);
                }}
                onBlur={() => setEditing(null)}
                autoFocus
              />
            )}
            <div className={styles.margin} />
            <DeleteSVG
              onClick={(e) => {
                e.stopPropagation();
                deleteHistory(item.time);
              }}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default History;
