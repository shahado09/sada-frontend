import { Outlet } from "react-router-dom";
import AdminSidebar from "../../../components/admin/AdminSidebar/AdminSidebar";
import AdminTopbar from "../../../components/admin/AdminTopbar/AdminTopbar";
import Nav from "../../../components/Nav/Nav";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <Nav />
      <div className={styles.inner}>
        <AdminSidebar />
        <div className={styles.main}>
          <AdminTopbar />
          <div className={styles.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}