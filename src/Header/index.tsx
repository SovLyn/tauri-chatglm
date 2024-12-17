import { FC } from "react";
import styles from "./index.module.less";
import ReturnSVG from "@/assets/return.svg?react";
import SettingSVG from "@/assets/setting.svg?react";

import { useLocation, useNavigate } from "react-router-dom";

const Header: FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={className} style={style}>
      {location.pathname !== "/" && (
        <div
          className={styles.left}
          onClick={() => {
            if (document.startViewTransition)
              document.startViewTransition(() => navigate(-1));
            else navigate(-1);
          }}>
          <ReturnSVG />
        </div>
      )}
      <div className={styles.middle}>
        {location.pathname === "/" ? "Chat" : "Setting"}
      </div>
      {location.pathname === "/" && (
        <div
          className={styles.right}
          onClick={() => {
            if (document.startViewTransition)
              document.startViewTransition(() => navigate("/setting"));
            else navigate("/setting");
          }}>
          <SettingSVG />
        </div>
      )}
    </div>
  );
};

export default Header;
