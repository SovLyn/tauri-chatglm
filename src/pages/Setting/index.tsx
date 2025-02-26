import { FC, useState } from "react";
import styles from "./index.module.less";
import ThemeSVG from "@/assets/theme.svg?react";
import ModelSVG from "@/assets/model.svg?react";
import TokenSVG from "@/assets/token.svg?react";
import NewsSVG from "@/assets/news.svg?react";
import RoleSVG from "@/assets/role.svg?react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Model, setModel, setTheme, setToken } from "@/redux/slices/common";
import { Button, Input, Radio, Space, Switch } from "antd";
import { setNewsToken, setPushNews } from "@/redux/slices/news";
import TextArea from "antd/es/input/TextArea";
import { setAnnotation } from "@/redux/slices/chat";

const Setting: FC = () => {
  const dispatch = useAppDispatch();
  const { theme, model, token } = useAppSelector((state) => state.common);
  const { token: news_token, push_news } = useAppSelector(
    (state) => state.news
  );
  const { annotation } = useAppSelector((state) => state.chat);
  const [tokenInput, setTokenInput] = useState(token);
  const [newsTokenInput, setNewsTokenInput] = useState(news_token);
  const [annotationItemHovering, setAnnotationItemHovering] = useState<{
    hovering: boolean;
    active: boolean;
  }>({ hovering: false, active: false });

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
      <div
        className={styles.item}
        onMouseEnter={() =>
          setAnnotationItemHovering((prev) => ({
            ...prev,
            hovering: true,
          }))
        }
        onMouseLeave={() => {
          setAnnotationItemHovering((prev) => ({
            ...prev,
            hovering: false,
          }));
        }}>
        <RoleSVG />
        <div className={styles.text}>角色提示</div>
        <TextArea
          maxLength={100}
          onChange={(e) => {
            dispatch(setAnnotation(e.target.value));
          }}
          placeholder="请输入角色提示"
          onFocus={() =>
            setAnnotationItemHovering((prev) => ({ ...prev, active: true }))
          }
          onBlur={() =>
            setAnnotationItemHovering((prev) => ({ ...prev, active: false }))
          }
          style={{
            height:
              annotationItemHovering.active || annotationItemHovering.hovering
                ? "100px"
                : "40px",
            resize: "none",
          }}
          value={annotation}
        />
      </div>
      <div className={styles.item}>
        <NewsSVG /> <div className={styles.text}>新闻</div>
        <Space.Compact className={styles.input}>
          <Input
            value={newsTokenInput}
            onChange={(e) => {
              setNewsTokenInput(e.target.value);
              if (push_news) dispatch(setPushNews(false));
            }}
          />
          <Switch
            checked={push_news}
            onChange={(checked) => {
              dispatch(setPushNews(checked));
              if (checked) dispatch(setNewsToken(newsTokenInput));
            }}
            disabled={!newsTokenInput}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default Setting;
