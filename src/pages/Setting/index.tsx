import { FC } from "react";
import styles from "./index.module.less";
import ThemeSVG from "@/assets/theme.svg?react";

import { useAppDispatch, useAppSelector } from "@/redux/store";
import { selectTheme } from "@/redux/slices/common";
import { Radio } from "antd";

const Setting: FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <ThemeSVG /> <div className={styles.text}>主题</div>
        <Radio.Group className={styles.radio} onChange={(e) => console.log(e)}>
          <Radio.Button value="light" className={styles.radio}>
            亮色
          </Radio.Button>
          <Radio.Button value="dark">暗色</Radio.Button>
          <Radio.Button value="system">跟随系统</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );
};

export default Setting;
