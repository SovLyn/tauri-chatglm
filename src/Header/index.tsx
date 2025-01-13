import { FC } from "react";
import styles from "./index.module.less";
import ReturnSVG from "@/assets/return.svg?react";
import SettingSVG from "@/assets/setting.svg?react";
import HistorySVG from "@/assets/history.svg?react";

import { useLocation, useNavigate } from "react-router-dom";

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const Header: FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={className} style={style} data-tauri-drag-region>
      {location.pathname !== "/" ? (
        <div
          className={styles.left}
          onClick={() => {
            document.startViewTransition(() => navigate(-1));
          }}>
          <ReturnSVG />
        </div>
      ) : (
        <div
          className={styles.left}
          onClick={() => {
            document.startViewTransition(() => navigate("/history"));
          }}>
          <HistorySVG />
        </div>
      )}
      <div className={styles.middle}>
        {location.pathname === "/"
          ? "Chat"
          : capitalizeFirstLetter(location.pathname.replace("/", ""))}
      </div>
      {location.pathname === "/" && (
        <div
          className={styles.right}
          onClick={() => {
            document.startViewTransition(() => navigate("/setting"));
          }}>
          <SettingSVG />
        </div>
      )}
    </div>
  );
};

export default Header;
