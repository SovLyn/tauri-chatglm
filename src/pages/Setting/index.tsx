import { FC, useState } from "react";
import styles from "./index.module.less";
import ThemeSVG from "@/assets/theme.svg?react";
import ModelSVG from "@/assets/model.svg?react";
import TokenSVG from "@/assets/token.svg?react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Model, setModel, setTheme, setToken } from "@/redux/slices/common";
import { Button, Input, Radio, Space } from "antd";

const Setting: FC = () => {
  const dispatch = useAppDispatch();
  const { theme, model, token } = useAppSelector((state) => state.common);
  const [tokenInput, setTokenInput] = useState(token);

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <ThemeSVG /> <div className={styles.text}>主题</div>
        <Radio.Group
          className={styles.radio}
          onChange={(e) => dispatch(setTheme(e.target.value))}
          defaultValue={theme}>
          <Radio.Button value="light" className={styles.radio}>
            亮色
          </Radio.Button>
          <Radio.Button value="dark">暗色</Radio.Button>
          <Radio.Button value="system">跟随系统</Radio.Button>
        </Radio.Group>
      </div>

      <div className={styles.item}>
        <ModelSVG /> <div className={styles.text}>模型</div>
        <Radio.Group
          className={styles.radio}
          defaultValue={model}
          onChange={(e) => dispatch(setModel(e.target.value))}>
          {Object.values(Model).map((key) => (
            <Radio.Button
              value={key}
              className={styles.radio}
              key={`Model Radio ${key}`}>
              {key}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
      <div className={styles.item}>
        <TokenSVG /> <div className={styles.text}>Token</div>
        <Space.Compact className={styles.input}>
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button onClick={() => dispatch(setToken(tokenInput))}>确认</Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default Setting;
