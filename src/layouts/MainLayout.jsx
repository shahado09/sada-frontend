import { Outlet } from "react-router-dom";
import Nav from "../components/Nav/Nav";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
