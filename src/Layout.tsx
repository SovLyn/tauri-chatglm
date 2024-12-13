import { Outlet } from "react-router-dom";
import Header from "./Header";
import styles from "./index.module.less";

export default function Layout() {
  return (
    <div className={styles.main}>
      <Header className={styles.header} />

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
