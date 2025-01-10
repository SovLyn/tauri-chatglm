import { FC, useEffect, useState } from "react";
import styles from "./index.module.less";
import { Message } from "@/utils/chatglm";
import EmptySVG from "@/assets/empty.svg?react";
import DeleteSVG from "@/assets/delete.svg?react";
import { useAppDispatch } from "@/redux/store";
import { setMessages } from "@/redux/slices/chat";
import { useNavigate } from "react-router-dom";

const History: FC = () => {
  const [history, setHistory] = useState<{ time: Date; message: Message[] }[]>(
    []
  );

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const temp: typeof history = [];
    for (let key in localStorage) {
      if (key.startsWith("history_")) {
        const message = JSON.parse(localStorage.getItem(key) as string);
        temp.push({
          time: new Date(parseInt(key.replace("history_", ""))),
          message,
        });
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

  return (
    <div className={styles.container}>
      {history.length === 0 ? (
        <div className={styles.empty}>
          <EmptySVG />
          <div className={styles.emptyText}>暂无历史记录</div>
        </div>
      ) : (
        history.map((item) => (
          <div
            className={styles.item}
            key={`history ${item.time.getTime()}`}
            onClick={() => historyClicked(item.message)}>
            <div className={styles.text}>{`${item.time}`}</div>
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
