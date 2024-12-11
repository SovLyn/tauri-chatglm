import { FC } from "react";
import styles from "./index.module.less";
import ReturnSVG from "@/assets/header_return.svg?react";

import { useLocation } from "react-router-dom";

const Header: FC = () => {
  const location = useLocation();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <ReturnSVG />
      </div>
      <div className={styles.middle}>
        {location.pathname === "/" ? "main" : "more"}
      </div>
      <div></div>
    </div>
  );
};

export default Header;
